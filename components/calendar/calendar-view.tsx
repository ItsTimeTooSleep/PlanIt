"use client";

import {
	addDays,
	addMonths,
	addWeeks,
	endOfWeek,
	format,
	isSameMonth,
	isSameWeek,
	parseISO,
	startOfWeek,
	subMonths,
	subWeeks,
} from "date-fns";
import {
	AlertCircle,
	Bell,
	CalendarCheck,
	ChevronLeft,
	ChevronRight,
	Columns,
	Grid,
	Redo2,
	Settings,
	Undo2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { DateRangePicker } from "@/components/date-range-picker";
import { TaskModal } from "@/components/task-modal";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { useTranslations } from "@/lib/i18n";
import { useLanguage, useStore } from "@/lib/store";
import type { CalendarSettings, Task } from "@/lib/types";
import { cn } from "@/lib/utils";
import { DateNoteModal } from "./date-note-modal";
import { MonthView } from "./month-view";
import { ScheduleDueTasksModal } from "./schedule-due-tasks-modal";
import { WeekView } from "./week-view";

type CalView = "week" | "month";

export function CalendarView() {
	const lang = useLanguage();
	const t = useTranslations(lang);
	const {
		state,
		deleteTasks,
		updateTask,
		updateSettings,
		undo,
		redo,
		canUndo,
		canRedo,
	} = useStore();

	const [view, setView] = useState<CalView>("week");
	const [referenceDate, setReferenceDate] = useState(new Date());
	const [editTask, setEditTask] = useState<Task | null>(null);
	const [modalOpen, setModalOpen] = useState(false);
	const [defaultDate, setDefaultDate] = useState<string | undefined>();
	const [defaultStart, setDefaultStart] = useState<string | undefined>();
	const [defaultEnd, setDefaultEnd] = useState<string | undefined>();
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [selectMode, setSelectMode] = useState(false);
	const [settingsOpen, setSettingsOpen] = useState(false);
	const [dateNoteModalOpen, setDateNoteModalOpen] = useState(false);
	const [selectedDateForNote, setSelectedDateForNote] = useState<string | null>(
		null,
	);
	const [isBatchMenuSticky, setIsBatchMenuSticky] = useState(false);
	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
	const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
	const [dateRangePickerOpen, setDateRangePickerOpen] = useState(false);
	const [taskToSchedule, setTaskToSchedule] = useState<Task | null>(null);
	const [scheduleDueModalOpen, setScheduleDueModalOpen] = useState(false);

	const today = useMemo(
		() => format(new Date(), "yyyy-MM-dd"),
		[],
	);

	const tomorrow = useMemo(
		() => format(addDays(new Date(), 1), "yyyy-MM-dd"),
		[],
	);

	const pendingDueTasks = useMemo(() => {
		const filtered = state.tasks.filter(
			(task) =>
				(task.dueDate === today || task.dueDate === tomorrow) &&
				!task.date &&
				task.status !== "completed" &&
				task.status !== "skipped",
		);

		// 按截止日期排序：今天截止的任务排在前面，明天截止的排在后面
		return filtered.sort((a, b) => {
			if (a.dueDate === today && b.dueDate !== today) return -1;
			if (a.dueDate !== today && b.dueDate === today) return 1;
			return 0;
		});
	}, [state.tasks, today, tomorrow]);
	const viewContainerRef = useRef<HTMLDivElement>(null);
	const batchMenuRef = useRef<HTMLDivElement>(null);
	const prevScrollTopRef = useRef(0);

	function goBack() {
		setReferenceDate((prev) =>
			view === "week" ? subWeeks(prev, 1) : subMonths(prev, 1),
		);
	}

	function goForward() {
		setReferenceDate((prev) =>
			view === "week" ? addWeeks(prev, 1) : addMonths(prev, 1),
		);
	}

	function goToday() {
		setReferenceDate(new Date());
	}

	function openCreate(date: string, startTime?: string, endTime?: string) {
		setDefaultDate(date);
		setDefaultStart(startTime);
		setDefaultEnd(endTime);
		setEditTask(null);
		setModalOpen(true);
	}

	function openEdit(task: Task) {
		setEditTask(task);
		setModalOpen(true);
	}

	function openDateNote(date: string) {
		setSelectedDateForNote(date);
		setDateNoteModalOpen(true);
	}

	function toggleSelect(id: string) {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	}

	function handleBatchDelete() {
		deleteTasks([...selectedIds]);
		setSelectedIds(new Set());
		setSelectMode(false);
	}

	function handleDeleteTaskRequest(task: Task) {
		setTaskToDelete(task);
		setDeleteConfirmOpen(true);
	}

	function confirmDeleteTask() {
		if (taskToDelete) {
			deleteTasks([taskToDelete.id]);
			setTaskToDelete(null);
		}
		setDeleteConfirmOpen(false);
	}

	function openDateRangePicker(task: Task) {
		setTaskToSchedule(task);
		setDateRangePickerOpen(true);
	}

	function handleSelectDate(
		date: string,
		startTime?: string,
		endTime?: string,
	) {
		if (taskToSchedule) {
			// 更新任务的日期和时间
			updateTask(taskToSchedule.id, {
				date,
				startTime,
				endTime,
			});
			setTaskToSchedule(null);
			setDateRangePickerOpen(false);
		}
	}

	function openSettings() {
		setSettingsOpen(true);
	}

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			const activeEl = document.activeElement;
			const isInputFocused =
				activeEl?.tagName === "INPUT" ||
				activeEl?.tagName === "TEXTAREA" ||
				(activeEl instanceof HTMLElement && activeEl.isContentEditable);

			if (isInputFocused) return;

			if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
				e.preventDefault();
				undo();
			}

			if (
				(e.ctrlKey || e.metaKey) &&
				(e.key === "y" || (e.shiftKey && e.key === "z"))
			) {
				e.preventDefault();
				redo();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [undo, redo]);

	/**
	 * 处理 Ctrl+滚轮 调整日历高度
	 * @param e - 滚轮事件对象
	 */
	function handleWheel(e: React.WheelEvent) {
		if (!e.ctrlKey) return;

		e.preventDefault();

		const currentHeight = state.settings.calendar.hourHeight;
		const delta = e.deltaY > 0 ? -8 : 8;
		const newHeight = Math.max(24, Math.min(300, currentHeight + delta));

		if (newHeight !== currentHeight) {
			updateSettings({
				calendar: {
					...state.settings.calendar,
					hourHeight: newHeight,
				},
			});
		}
	}

	function updateCalendarSetting<K extends keyof CalendarSettings>(
		key: K,
		value: CalendarSettings[K],
	) {
		updateSettings({
			calendar: { ...state.settings.calendar, [key]: value },
		});
	}

	useEffect(() => {
		const handleScroll = () => {
			const scrollContainer =
				viewContainerRef.current?.querySelector(".overflow-y-auto");
			if (scrollContainer) {
				const currentScrollTop = scrollContainer.scrollTop;
				if (
					currentScrollTop > prevScrollTopRef.current &&
					currentScrollTop > 60
				) {
					setIsBatchMenuSticky(true);
				} else if (currentScrollTop < prevScrollTopRef.current - 10) {
					setIsBatchMenuSticky(false);
				}
				prevScrollTopRef.current = currentScrollTop;
			}
		};

		const scrollContainer =
			viewContainerRef.current?.querySelector(".overflow-y-auto");
		if (scrollContainer) {
			scrollContainer.addEventListener("scroll", handleScroll);
			return () => scrollContainer.removeEventListener("scroll", handleScroll);
		}
	}, []);

	// Title
	const title =
		view === "week"
			? lang === "zh"
				? `${format(startOfWeek(referenceDate, { weekStartsOn: 0 }), "M月d日")} – ${format(endOfWeek(referenceDate, { weekStartsOn: 0 }), "M月d日")}`
				: `${format(startOfWeek(referenceDate, { weekStartsOn: 0 }), "MMM d")} – ${format(endOfWeek(referenceDate, { weekStartsOn: 0 }), "MMM d, yyyy")}`
			: lang === "zh"
				? format(referenceDate, "yyyy年M月")
				: format(referenceDate, "MMMM yyyy");

	return (
		<div className="flex flex-col h-[calc(100vh-2.25rem)] ml-16">
			{/* Toolbar - Compact Design */}
			<div className="shrink-0 border-b border-border bg-card">
				<div className="flex items-center gap-4 px-4 py-2">
					{/* Left Section - Date Navigation */}
					<div className="flex items-center gap-1">
						<Button
							variant="ghost"
							size="icon"
							onClick={goBack}
							className="w-7 h-7 rounded-md hover:bg-muted transition-all duration-150"
						>
							<ChevronLeft className="w-4 h-4" />
						</Button>

						<div className="flex flex-col items-center justify-center min-w-[140px]">
							<h2 className="text-sm font-semibold">{title}</h2>
						</div>

						<Button
							variant="ghost"
							size="icon"
							onClick={goForward}
							className="w-7 h-7 rounded-md hover:bg-muted transition-all duration-150"
						>
							<ChevronRight className="w-4 h-4" />
						</Button>

						{(() => {
							// 根据视图类型判断是否显示按钮
							const today = new Date();
							if (view === "week") {
								return !isSameWeek(referenceDate, today, { weekStartsOn: 0 });
							} else {
								return !isSameMonth(referenceDate, today);
							}
						})() && (
							<Button
								variant="default"
								size="sm"
								onClick={goToday}
								className="text-xs px-3 h-7 rounded-md ml-1"
							>
								{view === "week" ? t.calendar.thisWeek : t.calendar.thisMonth}
							</Button>
						)}
					</div>

					<div className="flex-1" />

					{/* Right Section - Action Buttons */}
					<div className="flex items-center gap-1">
						<Button
							variant="ghost"
							size="icon"
							onClick={undo}
							disabled={!canUndo()}
							className="w-7 h-7 rounded-md hover:bg-muted transition-all duration-150 disabled:opacity-40"
							title={`${t.calendar.undo} (Ctrl+Z)`}
						>
							<Undo2 className="w-3.5 h-3.5" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							onClick={redo}
							disabled={!canRedo()}
							className="w-7 h-7 rounded-md hover:bg-muted transition-all duration-150 disabled:opacity-40"
							title={`${t.calendar.redo} (Ctrl+Y)`}
						>
							<Redo2 className="w-3.5 h-3.5" />
						</Button>

						{pendingDueTasks.length > 0 && (
							<Popover>
								<PopoverTrigger asChild>
									<Button
										variant="ghost"
										size="icon"
										className="w-7 h-7 rounded-md hover:bg-muted transition-all duration-150 relative"
										title={t.calendar.smartReminderTooltip(
											pendingDueTasks.length,
										)}
									>
										<Bell className="w-3.5 h-3.5 text-red-500" />
										<span className="absolute -top-0.5 -right-0.5 text-[9px] font-bold bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center">
											{pendingDueTasks.length}
										</span>
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-64 rounded-xl">
									<div className="space-y-2">
										<h3 className="font-semibold text-sm flex items-center gap-2 text-red-600 dark:text-red-400">
											<AlertCircle className="w-4 h-4" />
											{t.calendar.smartReminder}
										</h3>
										<p className="text-xs text-muted-foreground">
											{t.calendar.smartReminderTooltip(pendingDueTasks.length)}
										</p>
										<div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
											{pendingDueTasks.map((task) => (
												<div
													key={task.id}
													className="text-sm py-1.5 px-2 hover:bg-muted rounded-md cursor-pointer transition-all duration-100 flex items-center justify-between gap-2"
												>
													<div
														onClick={() => {
															setEditTask(task);
															setModalOpen(true);
														}}
														className="flex-1 flex flex-col gap-0.5"
													>
														<span className="font-medium">{task.title}</span>
														{task.dueDate && (
															<span className="text-[10px] text-muted-foreground">
																{lang === "zh"
																	? `截止：${format(parseISO(task.dueDate), "M月d日")}`
																	: `Due: ${format(parseISO(task.dueDate), "MMM d")}`}
															</span>
														)}
													</div>
													<Button
														variant="ghost"
														size="icon"
														className="w-6 h-6 rounded-md hover:bg-primary/10 transition-all duration-100"
														onClick={(e) => {
															e.stopPropagation();
															openDateRangePicker(task);
														}}
														title={lang === "zh" ? "计划时间" : "Schedule time"}
													>
														<CalendarCheck className="w-3.5 h-3.5 text-primary" />
													</Button>
												</div>
											))}
										</div>
									</div>
								</PopoverContent>
							</Popover>
						)}

						<Button
							variant={view === "week" ? "default" : "ghost"}
							size="icon"
							onClick={() => setView("week")}
							className={cn(
								"w-7 h-7 rounded-md transition-all duration-150",
								view === "week" ? "" : "hover:bg-muted",
							)}
							title={t.calendar.week}
						>
							<Columns
								className={cn(
									"w-3.5 h-3.5",
									view === "week" ? "text-primary-foreground" : "",
								)}
							/>
						</Button>
						<Button
							variant={view === "month" ? "default" : "ghost"}
							size="icon"
							onClick={() => setView("month")}
							className={cn(
								"w-7 h-7 rounded-md transition-all duration-150",
								view === "month" ? "" : "hover:bg-muted",
							)}
							title={t.calendar.month}
						>
							<Grid
								className={cn(
									"w-3.5 h-3.5",
									view === "month" ? "text-primary-foreground" : "",
								)}
							/>
						</Button>

						<Button
							variant="ghost"
							size="icon"
							onClick={openSettings}
							className="w-7 h-7 rounded-md hover:bg-muted transition-all duration-150"
						>
							<Settings className="w-3.5 h-3.5" />
						</Button>
					</div>
				</div>
			</div>

			{/* Enhanced Batch actions bar */}
			{selectMode && (
				<div
					ref={batchMenuRef}
					className={cn(
						"flex items-center gap-3 px-6 py-3 shrink-0 text-sm transition-all duration-300 z-50 border-y border-border/50",
						isBatchMenuSticky
							? "sticky top-0 bg-gradient-to-r from-amber-50/90 via-amber-100/90 to-amber-50/90 dark:from-amber-950/90 dark:via-amber-900/90 dark:to-amber-950/90 backdrop-blur-xl shadow-lg"
							: "bg-gradient-to-r from-amber-50/70 via-amber-100/70 to-amber-50/70 dark:from-amber-950/70 dark:via-amber-900/70 dark:to-amber-950/70",
					)}
				>
					<div className="flex items-center gap-2">
						<div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
						<span className="font-medium text-amber-800 dark:text-amber-200">
							{t.calendar.selected(selectedIds.size)}
						</span>
					</div>

					<div className="flex-1" />

					<div className="flex items-center gap-2">
						<Button
							size="sm"
							variant="destructive"
							onClick={handleBatchDelete}
							disabled={selectedIds.size === 0}
							className="h-8 text-xs px-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
						>
							{t.calendar.batchDelete}
						</Button>
						<Button
							size="sm"
							variant="outline"
							onClick={() => {
								setSelectMode(false);
								setSelectedIds(new Set());
							}}
							className="h-8 text-xs px-4 rounded-xl border-amber-300/50 dark:border-amber-700/50 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-all duration-200"
						>
							{t.calendar.exitSelectMode}
						</Button>
					</div>
				</div>
			)}

			{/* View */}
			<div
				ref={viewContainerRef}
				className="flex-1 overflow-hidden flex flex-col"
				onWheel={handleWheel}
			>
				{view === "week" ? (
					<WeekView
						referenceDate={referenceDate}
						tasks={state.tasks}
						tags={state.tags}
						dateNotes={state.dateNotes}
						onOpenTask={openEdit}
						onCreateTask={(date, start, end) => openCreate(date, start, end)}
						onOpenDateNote={openDateNote}
						selectMode={selectMode}
						selectedIds={selectedIds}
						onToggleSelect={toggleSelect}
						onEnterSelectMode={() => setSelectMode(true)}
						calendarSettings={state.settings.calendar}
						onDeleteTask={handleDeleteTaskRequest}
						onOpenScheduleDue={() => setScheduleDueModalOpen(true)}
					/>
				) : (
					<MonthView
						referenceDate={referenceDate}
						tasks={state.tasks}
						tags={state.tags}
						dateNotes={state.dateNotes}
						onOpenTask={openEdit}
						onCreateTask={openCreate}
						onOpenDateNote={openDateNote}
					/>
				)}
			</div>

			<TaskModal
				open={modalOpen}
				onClose={() => {
					setModalOpen(false);
					setEditTask(null);
				}}
				task={editTask}
				defaultDate={defaultDate}
				defaultStartTime={defaultStart}
				defaultEndTime={defaultEnd}
			/>

			{/* Date Note Modal */}
			{selectedDateForNote && (
				<DateNoteModal
					open={dateNoteModalOpen}
					onClose={() => {
						setDateNoteModalOpen(false);
						setSelectedDateForNote(null);
					}}
					date={selectedDateForNote}
				/>
			)}

			{/* Calendar Settings Dialog */}
			<Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
				<DialogContent className="max-w-sm max-h-[80vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>{t.calendarSettings.title}</DialogTitle>
					</DialogHeader>
					<div className="flex flex-col gap-4 py-4">
						<div className="flex flex-col gap-1.5">
							<Label>{t.calendarSettings.timeRange}</Label>
							<div className="flex gap-4 items-center">
								<div className="flex flex-col gap-1 flex-1">
									<Label className="text-xs text-muted-foreground">
										{t.calendarSettings.startTime}
									</Label>
									<select
										value={state.settings.calendar.dayStartTime}
										onChange={(e) =>
											updateCalendarSetting(
												"dayStartTime",
												parseInt(e.target.value, 10),
											)
										}
										className="w-full p-2 rounded-md border border-border bg-background"
									>
										{Array.from({ length: 24 }, (_, i) => (
											<option key={i} value={i}>
												{String(i).padStart(2, "0")}:00
											</option>
										))}
									</select>
								</div>
								<div className="flex flex-col gap-1 flex-1">
									<Label className="text-xs text-muted-foreground">
										{t.calendarSettings.endTime}
									</Label>
									<select
										value={state.settings.calendar.dayEndTime}
										onChange={(e) =>
											updateCalendarSetting(
												"dayEndTime",
												parseInt(e.target.value, 10),
											)
										}
										className="w-full p-2 rounded-md border border-border bg-background"
									>
										{Array.from({ length: 25 }, (_, i) => (
											<option key={i} value={i}>
												{i === 24
													? "24:00"
													: `${String(i).padStart(2, "0")}:00`}
											</option>
										))}
									</select>
								</div>
							</div>
						</div>

						<div className="flex flex-col gap-1.5">
							<Label>{t.calendarSettings.timeSnap}</Label>
							<p className="text-xs text-muted-foreground">
								{t.calendarSettings.timeSnapDesc}
							</p>
							<select
								value={state.settings.calendar.timeSnap}
								onChange={(e) =>
									updateCalendarSetting(
										"timeSnap",
										parseInt(e.target.value, 10),
									)
								}
								className="w-full p-2 rounded-md border border-border bg-background"
							>
								{[1, 5, 10, 15].map((m) => (
									<option key={m} value={m}>
										{m} {t.settings.minutes}
									</option>
								))}
							</select>
						</div>

						<div className="flex flex-col gap-1.5">
							<div className="flex items-center justify-between">
								<Label>{t.calendarSettings.snapEnabled}</Label>
								<button
									type="button"
									role="switch"
									aria-checked={state.settings.calendar.snapEnabled}
									onClick={() =>
										updateCalendarSetting(
											"snapEnabled",
											!state.settings.calendar.snapEnabled,
										)
									}
									className={cn(
										"relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
										state.settings.calendar.snapEnabled
											? "bg-primary"
											: "bg-muted",
									)}
								>
									<span
										className={cn(
											"inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
											state.settings.calendar.snapEnabled
												? "translate-x-4"
												: "translate-x-0.5",
										)}
									/>
								</button>
							</div>
							<p className="text-xs text-muted-foreground">
								{t.calendarSettings.snapEnabledDesc}
							</p>
						</div>

						{state.settings.calendar.snapEnabled && (
							<div className="flex flex-col gap-1.5">
								<Label>{t.calendarSettings.snapThreshold}</Label>
								<p className="text-xs text-muted-foreground">
									{t.calendarSettings.snapThresholdDesc}
								</p>
								<select
									value={state.settings.calendar.snapThreshold}
									onChange={(e) =>
										updateCalendarSetting(
											"snapThreshold",
											parseInt(e.target.value, 10),
										)
									}
									className="w-full p-2 rounded-md border border-border bg-background"
								>
									{[5, 10, 15, 20, 30].map((m) => (
										<option key={m} value={m}>
											{m} {t.settings.minutes}
										</option>
									))}
								</select>
							</div>
						)}

						<div className="flex flex-col gap-1.5">
							<Label>{t.calendarSettings.hourDivisions}</Label>
							<select
								value={state.settings.calendar.hourDivisions}
								onChange={(e) =>
									updateCalendarSetting(
										"hourDivisions",
										parseInt(e.target.value, 10),
									)
								}
								className="w-full p-2 rounded-md border border-border bg-background"
							>
								{[1, 2, 3, 4, 6].map((i) => (
									<option key={i} value={i}>
										{i} {t.calendarSettings.divisions} ({t.repeat.customEvery}{" "}
										{60 / i} {t.settings.minutes})
									</option>
								))}
							</select>
						</div>

						<div className="flex flex-col gap-1.5">
							<Label>{t.calendarSettings.hourHeightLabel}</Label>
							<div className="flex items-center gap-2">
								<input
									type="number"
									value={state.settings.calendar.hourHeight}
									onChange={(e) => {
										const value = parseInt(e.target.value, 10);
										if (!Number.isNaN(value) && value >= 24 && value <= 300) {
											updateCalendarSetting("hourHeight", value);
										}
									}}
									min={24}
									max={300}
									className="flex-1 p-2 rounded-md border border-border bg-background"
								/>
								<span className="text-xs text-muted-foreground">px</span>
							</div>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation Dialog */}
			<Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
				<DialogContent className="max-w-sm">
					<DialogHeader>
						<DialogTitle>{t.task.deleteConfirmTitle}</DialogTitle>
					</DialogHeader>
					<p className="text-sm text-muted-foreground py-2">
						{t.task.deleteConfirm}
						{taskToDelete && (
							<span className="block mt-2 font-medium text-foreground">
								&ldquo;{taskToDelete.title}&rdquo;
							</span>
						)}
					</p>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setDeleteConfirmOpen(false)}
						>
							{t.common.cancel}
						</Button>
						<Button variant="destructive" onClick={confirmDeleteTask}>
							{t.common.delete}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Date Range Picker */}
			<DateRangePicker
				open={dateRangePickerOpen}
				onClose={() => {
					setDateRangePickerOpen(false);
					setTaskToSchedule(null);
				}}
				onSelect={handleSelectDate}
				initialDate={taskToSchedule?.dueDate}
			/>

			{/* Schedule unscheduled due tasks */}
			<ScheduleDueTasksModal
				open={scheduleDueModalOpen}
				onClose={() => setScheduleDueModalOpen(false)}
			/>
		</div>
	);
}
