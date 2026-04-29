"use client";

import {
	addDays,
	addWeeks,
	format,
	isToday,
	startOfWeek,
	subWeeks,
} from "date-fns";
import { ChevronLeft, ChevronRight, Edit3 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEFAULT_TAG_COLOR } from "@/lib/colors";
import { useTranslations } from "@/lib/i18n";
import { useLanguage, useStore } from "@/lib/store";
import { calculateTaskLayoutsGrouped, type TaskLayoutInfo } from "@/lib/task-layout";
import {
	minutesToTime,
	sortTasksByTime,
	timeToMinutes,
} from "@/lib/task-utils";
import type { Tag, Task } from "@/lib/types";
import { cn } from "@/lib/utils";

interface DateRangePickerProps {
	open: boolean;
	onClose: () => void;
	onSelect: (date: string, startTime?: string, endTime?: string) => void;
	initialDate?: string;
	initialStartTime?: string;
	initialEndTime?: string;
}

const TIME_COL_W = 48;
const TOP_PADDING = 24;
type DragMode = "create" | "move" | "resize-top" | "resize-bottom";

interface DragState {
	mode: DragMode;
	taskId?: string;
	colIndex: number;
	startY: number;
	startMin: number;
	origStartMin?: number;
	origEndMin?: number;
	origColIndex?: number;
	origDateStr?: string;
}

export function DateRangePicker({
	open,
	onClose,
	onSelect,
	initialDate,
	initialStartTime,
	initialEndTime,
}: DateRangePickerProps) {
	const lang = useLanguage();
	const t = useTranslations(lang);
	const { state } = useStore();

	const [referenceDate, setReferenceDate] = useState(new Date());
	const [selectedDate, setSelectedDate] = useState<string | null>(null);
	const [selectedStartMin, setSelectedStartMin] = useState<number | null>(null);
	const [selectedEndMin, setSelectedEndMin] = useState<number | null>(null);
	const [isSelecting, setIsSelecting] = useState(false);
	const [initialStartMin, setInitialStartMin] = useState<number | null>(null);
	const [tempStartMin, setTempStartMin] = useState<number | null>(null);
	const [tempEndMin, setTempEndMin] = useState<number | null>(null);
	const [selectColIndex, setSelectColIndex] = useState(0);
	const [showManualEdit, setShowManualEdit] = useState(false);
	const [manualEditDate, setManualEditDate] = useState("");
	const [manualEditStart, setManualEditStart] = useState("");
	const [manualEditEnd, setManualEditEnd] = useState("");
	const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
	const [ghost, setGhost] = useState<{ dateStr: string; startMin: number; endMin: number } | null>(null);
	const [isHovered, setIsHovered] = useState<string | null>(null);

	const gridRef = useRef<HTMLDivElement>(null);
	const scrollRef = useRef<HTMLDivElement>(null);
	const dragRef = useRef<DragState | null>(null);

	const calendarSettings = state.settings.calendar;
	const { dayStartTime, dayEndTime, hourHeight, timeSnap } =
		calendarSettings;
	const visibleHours = dayEndTime - dayStartTime;
	const totalHeight = visibleHours * hourHeight;

	const tasks = state.tasks;
	const tags = state.tags;

	useEffect(() => {
		if (open) {
			if (initialDate) {
				setReferenceDate(new Date(initialDate));
				setSelectedDate(initialDate);
			} else {
				setReferenceDate(new Date());
				setSelectedDate(null);
			}

			if (initialStartTime && initialEndTime) {
				setSelectedStartMin(timeToMinutes(initialStartTime));
				setSelectedEndMin(timeToMinutes(initialEndTime));
			} else {
				setSelectedStartMin(null);
				setSelectedEndMin(null);
			}

			setInitialStartMin(null);
			setTempStartMin(null);
			setTempEndMin(null);
			setIsSelecting(false);
			setActiveTaskId(null);
			setGhost(null);
		}
	}, [open, initialDate, initialStartTime, initialEndTime]);

	// Scroll to current time on mount
	useEffect(() => {
		if (open && scrollRef.current) {
			const el = scrollRef.current;
			const now = new Date();
			const minutes = now.getHours() * 60 + now.getMinutes();
			const startMinutes = dayStartTime * 60;
			if (minutes >= startMinutes && minutes <= dayEndTime * 60) {
				const scrollTop =
					((minutes - startMinutes) / 60) * hourHeight - el.clientHeight / 3;
				el.scrollTo({ top: Math.max(0, scrollTop), behavior: "smooth" });
			}
		}
	}, [open, dayStartTime, dayEndTime, hourHeight]);

	const weekStart = startOfWeek(referenceDate, { weekStartsOn: 0 });
	const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
	const dayLabels = t.weekdays.short;

	function goBack() {
		setReferenceDate(subWeeks(referenceDate, 1));
	}

	function goForward() {
		setReferenceDate(addWeeks(referenceDate, 1));
	}

	const getMinuteFromY = useCallback(
		(y: number) => {
			const raw = dayStartTime * 60 + (y / hourHeight) * 60;
			const maxMinutes = dayEndTime === 24 ? 24 * 60 : dayEndTime * 60;
			return Math.max(
				dayStartTime * 60,
				Math.min(Math.round(raw / timeSnap) * timeSnap, maxMinutes),
			);
		},
		[dayStartTime, dayEndTime, hourHeight, timeSnap],
	);

	const getRelativePos = useCallback(
		(e: PointerEvent | MouseEvent | { clientX: number; clientY: number }) => {
			const grid = gridRef.current;
			if (!grid) return { x: 0, y: 0 };
			const rect = grid.getBoundingClientRect();
			return {
				x: e.clientX - rect.left,
				y: e.clientY - rect.top,
			};
		},
		[],
	);

	const getColFromX = useCallback((x: number): number => {
		const grid = gridRef.current;
		if (!grid) return 0;
		const colW = (grid.clientWidth - TIME_COL_W) / 7;
		const col = Math.floor((x - TIME_COL_W) / colW);
		return Math.max(0, Math.min(col, 6));
	}, []);

	const onPointerMove = useCallback(
		(e: PointerEvent) => {
			const drag = dragRef.current;
			if (!drag) return;
			e.preventDefault();

			const { x, y } = getRelativePos(e);
			const adjustedY = y - TOP_PADDING;
			const currentMin = getMinuteFromY(Math.max(0, adjustedY));
			const colIndex = getColFromX(x);
			const dateStr = format(days[colIndex], "yyyy-MM-dd");
			const maxMinutes = dayEndTime === 24 ? 24 * 60 : dayEndTime * 60;

			if (drag.mode === "create") {
				const newStart = Math.min(drag.startMin, currentMin);
				const newEnd = Math.max(drag.startMin, currentMin);
				const finalEnd = newEnd - newStart < timeSnap ? newStart + timeSnap : newEnd;
				
				setTempStartMin(newStart);
				setTempEndMin(Math.min(finalEnd, maxMinutes));
				setGhost({ dateStr, startMin: newStart, endMin: Math.min(finalEnd, maxMinutes) });
			} else if (
				drag.mode === "move" &&
				drag.origStartMin !== undefined &&
				drag.origEndMin !== undefined
			) {
				const delta = currentMin - drag.startMin;
				const dur = drag.origEndMin - drag.origStartMin;
				const newStart = Math.max(
					dayStartTime * 60,
					Math.min(drag.origStartMin + delta, maxMinutes - dur),
				);
				const newEnd = newStart + dur;

				setGhost({ dateStr, startMin: newStart, endMin: newEnd });
			} else if (drag.mode === "resize-top" && drag.origEndMin !== undefined) {
				const newStart = Math.max(
					dayStartTime * 60,
					Math.min(currentMin, drag.origEndMin - timeSnap),
				);

				setGhost({
					dateStr: drag.origDateStr || dateStr,
					startMin: newStart,
					endMin: drag.origEndMin,
				});
			} else if (
				drag.mode === "resize-bottom" &&
				drag.origStartMin !== undefined
			) {
				const newEnd = Math.min(
					maxMinutes,
					Math.max(currentMin, drag.origStartMin + timeSnap),
				);

				setGhost({
					dateStr: drag.origDateStr || dateStr,
					startMin: drag.origStartMin,
					endMin: newEnd,
				});
			}
		},
		[
			days,
			getColFromX,
			getMinuteFromY,
			getRelativePos,
			timeSnap,
			dayStartTime,
			dayEndTime,
			hourHeight,
		],
	);

	const onPointerUp = useCallback(
		(e: PointerEvent) => {
			const drag = dragRef.current;
			if (!drag) {
				return;
			}
			dragRef.current = null;

			if (drag.mode === "create" && ghost) {
				setIsSelecting(false);
				const finalStartMin = Math.min(ghost.startMin, ghost.endMin);
				const finalEndMin = Math.max(ghost.startMin, ghost.endMin);
				setSelectedStartMin(finalStartMin);
				setSelectedEndMin(finalEndMin);
				setSelectedDate(ghost.dateStr);
				setInitialStartMin(null);
				setTempStartMin(null);
				setTempEndMin(null);
			} else if (ghost && drag.taskId) {
				// 对于拖拽和拉伸，我们通过 onSelect 回调来应用变化
				const { startMin, endMin, dateStr } = ghost;
				setSelectedDate(dateStr);
				setSelectedStartMin(startMin);
				setSelectedEndMin(endMin);
			}
			
			setGhost(null);
			(e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
		},
		[ghost],
	);

	const handlePointerDown = useCallback(
		(colIndex: number, e: React.PointerEvent) => {
			if (e.button !== 0) return;
			
			// 检查是否点击在任务上
			if ((e.target as HTMLElement).closest("[data-task-block]")) {
				return;
			}
			
			e.currentTarget.setPointerCapture(e.pointerId);

			const { y } = getRelativePos(e.nativeEvent);
			const adjustedY = y - TOP_PADDING;
			const startMin = getMinuteFromY(Math.max(0, adjustedY));
			const dateStr = format(days[colIndex], "yyyy-MM-dd");

			setIsSelecting(true);
			setSelectColIndex(colIndex);
			setSelectedDate(dateStr);
			setInitialStartMin(startMin);
			setTempStartMin(startMin);
			setTempEndMin(startMin);
			
			dragRef.current = {
				mode: "create",
				colIndex,
				startY: y,
				startMin,
			};
			
			setGhost({ dateStr, startMin, endMin: startMin + timeSnap });
		},
		[days, getRelativePos, getMinuteFromY, timeSnap],
	);

	useEffect(() => {
		if (open) {
			window.addEventListener("pointermove", onPointerMove, { passive: false });
			window.addEventListener("pointerup", onPointerUp);
		}
		return () => {
			window.removeEventListener("pointermove", onPointerMove);
			window.removeEventListener("pointerup", onPointerUp);
		};
	}, [open, onPointerMove, onPointerUp]);

	const handleOpenManualEdit = () => {
		if (!displayDate || displayStartMin === null || displayEndMin === null)
			return;

		setManualEditDate(displayDate);
		setManualEditStart(minutesToTime(Math.min(displayStartMin, displayEndMin)));
		setManualEditEnd(minutesToTime(Math.max(displayStartMin, displayEndMin)));
		setShowManualEdit(true);
	};

	const handleSaveManualEdit = () => {
		if (!manualEditDate || !manualEditStart || !manualEditEnd) return;

		const startMin = timeToMinutes(manualEditStart);
		const endMin = timeToMinutes(manualEditEnd);

		setSelectedDate(manualEditDate);
		setSelectedStartMin(Math.min(startMin, endMin));
		setSelectedEndMin(Math.max(startMin, endMin));
		setShowManualEdit(false);

		// 如果日期变了，调整日历参考日期
		const newDate = new Date(manualEditDate);
		const newWeekStart = startOfWeek(newDate, { weekStartsOn: 0 });
		setReferenceDate(newWeekStart);
	};

	const handleConfirm = () => {
		if (selectedDate && selectedStartMin !== null && selectedEndMin !== null) {
			const startMin = Math.min(selectedStartMin, selectedEndMin);
			const endMin = Math.max(selectedStartMin, selectedEndMin);
			onSelect(selectedDate, minutesToTime(startMin), minutesToTime(endMin));
			onClose();
		} else if (selectedDate) {
			onSelect(selectedDate);
			onClose();
		}
	};

	// 确定当前应该显示的选择信息
	const hasSelection =
		(selectedDate && selectedStartMin !== null && selectedEndMin !== null) ||
		(isSelecting &&
			selectedDate &&
			tempStartMin !== null &&
			tempEndMin !== null);

	// 计算显示用的日期和时间
	const displayDate = selectedDate;
	const displayStartMin = isSelecting ? tempStartMin : selectedStartMin;
	const displayEndMin = isSelecting ? tempEndMin : selectedEndMin;

	// 获取任务的标签颜色
	const getTaskTagColors = (task: Task, tags: Tag[]): string[] => {
		const colors = task.tagIds
			.map((tagId) => tags.find((tg) => tg.id === tagId)?.color)
			.filter((c): c is string => !!c);
		return colors.length > 0 ? colors : [DEFAULT_TAG_COLOR];
	};

	// 为颜色添加透明度
	const colorWithOpacity = (color: string, opacity: number): string => {
		return `color-mix(in srgb, ${color} ${opacity}%, transparent)`;
	};

	return (
		<Dialog open={open} onOpenChange={(v) => !v && onClose()}>
			<DialogContent className="max-w-3xl max-h-[85vh] p-0 overflow-hidden flex flex-col">
				<DialogHeader className="px-6 pt-4 pb-2">
					<DialogTitle>{t.dateRangePicker.title}</DialogTitle>
					<DialogDescription>{t.dateRangePicker.description}</DialogDescription>
				</DialogHeader>

				{/* Navigation */}
				<div className="flex items-center justify-between px-6 py-2">
					<Button
						variant="ghost"
						size="icon"
						onClick={goBack}
						className="w-8 h-8"
					>
						<ChevronLeft className="w-4 h-4" />
					</Button>
					<h3 className="text-sm font-semibold">
						{lang === "zh"
							? `${format(weekStart, "M月d日")} – ${format(addDays(weekStart, 6), "M月d日")}`
							: `${format(weekStart, "MMM d")} – ${format(addDays(weekStart, 6), "MMM d")}`}
					</h3>
					<Button
						variant="ghost"
						size="icon"
						onClick={goForward}
						className="w-8 h-8"
					>
						<ChevronRight className="w-4 h-4" />
					</Button>
				</div>

				{/* Calendar Grid */}
				<div className="flex-1 overflow-hidden flex flex-col">
					{/* Day header row */}
					<div className="flex shrink-0 border-b border-border bg-card px-6">
						<div style={{ width: TIME_COL_W }} className="shrink-0" />
						{days.map((day, _colIndex) => {
							const dateStr = format(day, "yyyy-MM-dd");
							const _isToday = isToday(day);
							return (
								<div
									key={dateStr}
									className="flex-1 border-l border-border min-w-0 px-1 py-2"
								>
									<div className="flex flex-col items-center">
										<button
											className={cn(
												"flex flex-col items-center justify-center w-8 h-8 rounded-full transition-colors cursor-pointer shrink-0",
												_isToday
													? "bg-primary text-primary-foreground"
													: "text-muted-foreground hover:bg-muted",
												selectedDate === dateStr &&
													"ring-2 ring-primary ring-offset-1",
											)}
										>
											<span
												className={cn(
													"text-[10px] font-medium",
													_isToday
														? "text-primary-foreground/80"
														: "text-muted-foreground/70",
												)}
											>
												{dayLabels[day.getDay()]}
											</span>
											<span
												className={cn(
													"text-sm font-semibold leading-none",
													_isToday ? "text-primary-foreground" : "text-foreground",
												)}
											>
												{format(day, "d")}
											</span>
										</button>
									</div>
								</div>
							);
						})}
					</div>

					{/* Scrollable grid */}
					<div ref={scrollRef} className="flex-1 overflow-y-auto px-6 pb-4">
						<div
							ref={gridRef}
							className="flex select-none relative"
							style={{ height: totalHeight + TOP_PADDING }}
						>
							{/* Time labels */}
							<div style={{ width: TIME_COL_W }} className="shrink-0 relative">
								{Array.from({ length: visibleHours }, (_, i) => {
									const h = dayStartTime + i;
									return (
										<div
											key={h}
											className="absolute right-2 text-[10px] text-muted-foreground -translate-y-1/2 tabular-nums"
											style={{ top: TOP_PADDING + i * hourHeight }}
										>
											{String(h).padStart(2, "0")}
										</div>
									);
								})}
							</div>

							{/* Day columns */}
							{days.map((day, colIndex) => {
								const dateStr = format(day, "yyyy-MM-dd");
								const isSelectedDate = selectedDate === dateStr;
								const isNowDay = isToday(day);
								const now = new Date();
								const nowMin = isNowDay
									? now.getHours() * 60 + now.getMinutes()
									: null;
								const dayTasks = sortTasksByTime(
									tasks.filter(
										(t) =>
											t.date === dateStr &&
											!t.isAllDay &&
											t.startTime &&
											t.endTime,
									),
								);

								const taskLayouts = calculateTaskLayoutsGrouped(
									dayTasks,
									hourHeight,
									dayStartTime * 60,
								);

								const ghostHere = ghost?.dateStr === dateStr ? ghost : null;

								// Helper for selection block
								const blockStartMin =
									isSelecting && selectColIndex === colIndex
										? tempStartMin
										: isSelectedDate
											? selectedStartMin
											: null;
								const blockEndMin =
									isSelecting && selectColIndex === colIndex
										? tempEndMin
										: isSelectedDate
											? selectedEndMin
											: null;

								return (
									<div
										key={dateStr}
										className={cn(
											"flex-1 border-l border-border relative",
											isToday(day) && "bg-primary/[0.015]",
										)}
										style={{ height: totalHeight + TOP_PADDING }}
										onPointerDown={(e) => handlePointerDown(colIndex, e)}
									>
										{/* Hour lines */}
										{Array.from({ length: visibleHours }, (_, i) => {
											const h = dayStartTime + i;
											return (
												<div
													key={h}
													className="absolute left-0 right-0 border-t border-border pointer-events-none"
													style={{ top: TOP_PADDING + i * hourHeight }}
												/>
											);
										})}
										{/* Divider lines */}
										{Array.from(
											{ length: visibleHours * 2 },
											(_, i) => {
												const divisionHeight = hourHeight / 2;
												return (
													<div
														key={`div-${i}`}
														className="absolute left-0 right-0 border-t border-border/40 pointer-events-none"
														style={{
															top:
																TOP_PADDING +
																((i + 1) % 2) * divisionHeight +
																Math.floor((i + 1) / 2) *
																	hourHeight,
														}}
													/>
												);
											},
										)}

										{/* Render existing tasks */}
										{taskLayouts.map((layout) => {
											const task = layout.task;
											const tagColors = getTaskTagColors(task, tags);
											const primaryColor = tagColors[0];
											const isCompleted = task.status === "completed";
											const isSkipped = task.status === "skipped";
											const isDimmed = isCompleted || isSkipped;
											const isActive = activeTaskId === task.id;
											const isTaskHovered = isHovered === task.id;
											const isGhostTask = ghost && ghost.dateStr === dateStr && dragRef.current?.taskId === task.id;

											const top = TOP_PADDING + layout.top;
											const height = layout.height;
											const left = layout.left;
											const width = layout.width;

											return (
												<div
													key={task.id}
													data-task-block
													className={cn(
														"absolute cursor-pointer rounded-md overflow-hidden transition-all duration-200 group",
														isActive && "ring-2 ring-primary/50 ring-offset-1 z-20",
														isGhostTask && "opacity-30"
													)}
													style={{
														top,
														height,
														left: `${left}%`,
														width: `${width}%`,
														backgroundColor: colorWithOpacity(primaryColor, isDimmed ? 10 : 16),
														opacity: isDimmed ? 0.6 : 1,
														zIndex: isActive ? 20 : 10,
													}}
													onMouseEnter={() => setIsHovered(task.id)}
													onMouseLeave={() => setIsHovered(null)}
													onClick={(e) => {
														e.stopPropagation();
														setActiveTaskId(activeTaskId === task.id ? null : task.id);
													}}
													onPointerDown={(e) => {
														if (e.button !== 0) return;
														if ((e.target as HTMLElement).closest("[data-resize-handle]")) {
															return;
														}
														e.stopPropagation();
														e.currentTarget.setPointerCapture(e.pointerId);
														const { y } = getRelativePos(e.nativeEvent);
														const adjustedY = y - TOP_PADDING;
														const startMin = getMinuteFromY(Math.max(0, adjustedY));

														dragRef.current = {
															mode: "move",
															taskId: task.id,
															colIndex,
															startY: y,
															startMin,
															origStartMin: timeToMinutes(task.startTime!),
															origEndMin: timeToMinutes(task.endTime!),
															origColIndex: colIndex,
															origDateStr: dateStr,
														};

														setGhost({
															dateStr,
															startMin: timeToMinutes(task.startTime!),
															endMin: timeToMinutes(task.endTime!),
														});
														setActiveTaskId(task.id);
													}}
												>
													{/* Resize handles */}
													{isActive && (
														<>
															<div
																data-resize-handle="top"
																className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize z-10 hover:bg-primary/30 transition-colors"
																onPointerDown={(e) => {
																	e.stopPropagation();
																	e.currentTarget.setPointerCapture(e.pointerId);
																	const { y } = getRelativePos(e.nativeEvent);
																	
																	dragRef.current = {
																		mode: "resize-top",
																		taskId: task.id,
																		colIndex,
																		startY: y,
																		startMin: getMinuteFromY(Math.max(0, y - TOP_PADDING)),
																		origStartMin: timeToMinutes(task.startTime!),
																		origEndMin: timeToMinutes(task.endTime!),
																		origColIndex: colIndex,
																		origDateStr: dateStr,
																	};
																	
																	setGhost({
																		dateStr,
																		startMin: timeToMinutes(task.startTime!),
																		endMin: timeToMinutes(task.endTime!),
																	});
																}}
															/>
															<div
																data-resize-handle="bottom"
																className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize z-10 hover:bg-primary/30 transition-colors"
																onPointerDown={(e) => {
																	e.stopPropagation();
																	e.currentTarget.setPointerCapture(e.pointerId);
																	const { y } = getRelativePos(e.nativeEvent);
																	
																	dragRef.current = {
																		mode: "resize-bottom",
																		taskId: task.id,
																		colIndex,
																		startY: y,
																		startMin: getMinuteFromY(Math.max(0, y - TOP_PADDING)),
																		origStartMin: timeToMinutes(task.startTime!),
																		origEndMin: timeToMinutes(task.endTime!),
																		origColIndex: colIndex,
																		origDateStr: dateStr,
																	};
																	
																	setGhost({
																		dateStr,
																		startMin: timeToMinutes(task.startTime!),
																		endMin: timeToMinutes(task.endTime!),
																	});
																}}
															/>
														</>
													)}

													{/* Task color strip */}
													<div className="flex h-full">
														<div
															className="w-1 flex-shrink-0"
															style={{ backgroundColor: primaryColor }}
														/>
														<div className="flex-1 p-1 min-w-0">
															<p className="text-[10px] font-medium truncate" style={{ color: primaryColor }}>
																{task.title}
															</p>
														</div>
														{(isTaskHovered || isActive) && (
															<div className="absolute right-1 top-1/2 -translate-y-1/2">
																<div
																	className="w-4 h-4 rounded-full flex items-center justify-center"
																	style={{
																		backgroundColor: primaryColor,
																		color: "white",
																		textShadow: "0 1px 2px rgba(0,0,0,0.3)",
																	}}
																>
																	<Edit3 className="w-2.5 h-2.5" />
																</div>
															</div>
														)}
													</div>
												</div>
											);
										})}

										{/* Now indicator */}
										{isNowDay &&
											nowMin !== null &&
											nowMin >= dayStartTime * 60 &&
											nowMin <= dayEndTime * 60 && (
												<div
													className="absolute left-0 right-0 pointer-events-none z-30"
													style={{
														top:
															TOP_PADDING +
															((nowMin - dayStartTime * 60) / 60) * hourHeight,
													}}
												>
													<div className="absolute w-3 h-3 rounded-full bg-primary shadow-lg shadow-primary/30 -translate-y-1/2" />
													<div className="absolute left-3 right-0 h-0.5 bg-gradient-to-r from-primary to-primary/40 -translate-y-1/2" />
												</div>
											)}

										{/* Selection block / Ghost block */}
										{(ghostHere || (blockStartMin !== null && blockEndMin !== null && !ghost)) && (
											<div
												className="absolute left-0.5 right-0.5 rounded-md pointer-events-none z-40 border-2 border-primary/70 bg-primary/20 transition-all duration-75"
												style={{
													top:
														TOP_PADDING +
														((Math.min(
															ghostHere?.startMin ?? blockStartMin!,
															ghostHere?.endMin ?? blockEndMin!
														) - dayStartTime * 60) / 60) * hourHeight,
													height: Math.max(
														((Math.max(
															ghostHere?.startMin ?? blockStartMin!,
															ghostHere?.endMin ?? blockEndMin!
														) - Math.min(
															ghostHere?.startMin ?? blockStartMin!,
															ghostHere?.endMin ?? blockEndMin!
														)) / 60) * hourHeight,
														4,
													),
												}}
											>
												<div className="absolute -top-5 left-1 px-1.5 py-0.5 bg-primary text-primary-foreground text-[10px] font-semibold rounded shadow-sm whitespace-nowrap">
													{minutesToTime(Math.min(
														ghostHere?.startMin ?? blockStartMin!,
														ghostHere?.endMin ?? blockEndMin!
													))} – {minutesToTime(Math.max(
														ghostHere?.startMin ?? blockStartMin!,
														ghostHere?.endMin ?? blockEndMin!
													))}
												</div>
											</div>
										)}
									</div>
								);
							})}
						</div>
					</div>
				</div>

				{/* Selection display */}
				{hasSelection &&
					displayDate &&
					displayStartMin !== null &&
					displayEndMin !== null && (
						<div
							className="px-6 py-3 bg-muted/30 border-t border-border cursor-pointer hover:bg-muted/50 transition-colors"
							onClick={!isSelecting ? handleOpenManualEdit : undefined}
						>
							<Label className="text-xs text-muted-foreground">
								{t.dateRangePicker.selected}
								{isSelecting && t.dateRangePicker.selecting}
								{!isSelecting && t.dateRangePicker.clickToEdit}
							</Label>
							<p className="text-sm font-medium mt-1">
								{lang === "zh"
									? `${format(new Date(displayDate), "M月d日")} ${minutesToTime(Math.min(displayStartMin, displayEndMin))} – ${minutesToTime(Math.max(displayStartMin, displayEndMin))}`
									: `${format(new Date(displayDate), "MMM d")} ${minutesToTime(Math.min(displayStartMin, displayEndMin))} – ${minutesToTime(Math.max(displayStartMin, displayEndMin))}`}
							</p>
						</div>
					)}

				<DialogFooter className="px-6 pb-4 pt-2">
					<Button variant="outline" onClick={onClose}>
						{t.common.cancel}
					</Button>
					<Button
						onClick={handleConfirm}
						disabled={!hasSelection || isSelecting}
					>
						{t.common.confirm}
					</Button>
				</DialogFooter>
			</DialogContent>

			{/* Manual Edit Dialog */}
			<Dialog open={showManualEdit} onOpenChange={setShowManualEdit}>
				<DialogContent className="max-w-sm">
					<DialogHeader>
						<DialogTitle>{t.dateRangePicker.editTitle}</DialogTitle>
						<DialogDescription>
							{t.dateRangePicker.editDescription}
						</DialogDescription>
					</DialogHeader>
					<div className="flex flex-col gap-4 py-2">
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="edit-date">{t.dateRangePicker.date}</Label>
							<Input
								id="edit-date"
								type="date"
								value={manualEditDate}
								onChange={(e) => setManualEditDate(e.target.value)}
							/>
						</div>
						<div className="grid grid-cols-2 gap-3">
							<div className="flex flex-col gap-1.5">
								<Label htmlFor="edit-start">
									{t.dateRangePicker.startTime}
								</Label>
								<Input
									id="edit-start"
									type="time"
									value={manualEditStart}
									onChange={(e) => setManualEditStart(e.target.value)}
								/>
							</div>
							<div className="flex flex-col gap-1.5">
								<Label htmlFor="edit-end">{t.dateRangePicker.endTime}</Label>
								<Input
									id="edit-end"
									type="time"
									value={manualEditEnd}
									onChange={(e) => setManualEditEnd(e.target.value)}
								/>
							</div>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setShowManualEdit(false)}>
							{t.common.cancel}
						</Button>
						<Button onClick={handleSaveManualEdit}>{t.common.save}</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</Dialog>
	);
}
