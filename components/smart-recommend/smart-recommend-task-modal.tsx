"use client";

import { addDays, format } from "date-fns";
import {
	Calendar,
	ChevronDown,
	ChevronRight,
	Plus,
	Trash2,
	Sparkles,
	Check,
	X,
	BarChart2,
	RefreshCw,
} from "lucide-react";
import { useCallback, useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { PRESET_TAG_COLORS } from "@/lib/colors";
import { useTranslations } from "@/lib/i18n";
import { useLanguage } from "@/lib/store";
import { generateId } from "@/lib/task-utils";
import type { RepeatFrequency, TaskStatus, TaskStep } from "@/lib/types";
import type { Recommendation, RecommendTag } from "@/lib/smart-recommend/types";
import { DateRangePicker } from "../date-range-picker";

interface SmartRecommendTaskModalProps {
	open: boolean;
	onClose: () => void;
	tags: RecommendTag[];
	recommendations?: Recommendation[];
	onAddTask?: (task: any) => void;
	onSubmit?: (task: any) => void;
	onShowDetail?: (rec: Recommendation) => void;
	defaultDate?: string;
	defaultStartTime?: string;
	defaultEndTime?: string;
	defaultStatus?: TaskStatus;
	defaultCreatedAt?: string;
}

const WEEKDAY_LABELS = ["日", "一", "二", "三", "四", "五", "六"];
const WEEKDAY_LABELS_EN = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function SmartRecommendTaskModal({
	open,
	onClose,
	tags,
	recommendations = [],
	onAddTask,
	onSubmit,
	onShowDetail,
	defaultDate,
	defaultStartTime,
	defaultEndTime,
	defaultStatus,
	defaultCreatedAt,
}: SmartRecommendTaskModalProps) {
	const lang = useLanguage();
	const t = useTranslations(lang);

	const [title, setTitle] = useState("");
	const [date, setDate] = useState<string>("");
	const [dueDate, setDueDate] = useState<string>("");
	const [startTime, setStartTime] = useState<string>("");
	const [endTime, setEndTime] = useState<string>("");
	const [isAllDay, setIsAllDay] = useState(false);
	const [tagIds, setTagIds] = useState<string[]>([]);
	const [frequency, setFrequency] = useState<RepeatFrequency>("none");
	const [weekdays, setWeekdays] = useState<number[]>([]);
	const [repeatEndDate, setRepeatEndDate] = useState("");
	const [repeatInterval, setRepeatInterval] = useState(1);
	const [repeatUnit, setRepeatUnit] = useState<
		"days" | "weeks" | "months" | "years"
	>("days");
	const [notes, setNotes] = useState("");
	const [status, setStatus] = useState<TaskStatus>("pending");
	const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
	const [dueDateOffset, setDueDateOffset] = useState(0);
	const [showDateRangePicker, setShowDateRangePicker] = useState(false);
	const [isMultiStep, setIsMultiStep] = useState(false);
	const [steps, setSteps] = useState<TaskStep[]>([]);
	const [editingStepId, setEditingStepId] = useState<string | null>(null);
	const [selectedRecIndex, setSelectedRecIndex] = useState(0);
	const [isUsingRecommendation, setIsUsingRecommendation] = useState(false);

	const [newTagName, setNewTagName] = useState("");
	const [newTagColor, setNewTagColor] = useState(PRESET_TAG_COLORS[0]);
	const [customTagColor, setCustomTagColor] = useState("#000000");
	const [useCustomColor, setUseCustomColor] = useState(false);
	const [showNewTag, setShowNewTag] = useState(false);

	const currentRec = recommendations[selectedRecIndex];

	useEffect(() => {
		if (!open) return;
		// 重置所有字段
		const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");
		setTitle("");
		setDate(defaultDate ?? "");
		setDueDate(tomorrow);
		setStartTime(defaultStartTime ?? "");
		setEndTime(defaultEndTime ?? "");
		setIsAllDay(false);
		setTagIds([]);
		setFrequency("none");
		setWeekdays([]);
		setRepeatEndDate("");
		setRepeatInterval(1);
		setRepeatUnit("days");
		setNotes("");
		setStatus(defaultStatus ?? "pending");
		setDueDateOffset(0);
		setShowAdvancedOptions(false);
		setIsMultiStep(false);
		setSteps([]);
		setShowNewTag(false);
		setNewTagName("");
		setNewTagColor(PRESET_TAG_COLORS[0]);
		setCustomTagColor("#000000");
		setUseCustomColor(false);
		setSelectedRecIndex(0);
		setIsUsingRecommendation(false);

		// 如果有推荐，先不自动填充，让用户选择
	}, [open, defaultDate, defaultStartTime, defaultEndTime, defaultStatus]);

	const fillRecommendation = useCallback((index: number) => {
		const rec = recommendations[index];
		if (!rec) return;

		setTitle(rec.task.title);
		setDate(rec.task.date ?? "");
		setDueDate(rec.task.dueDate ?? "");
		setStartTime(rec.task.startTime ?? "");
		setEndTime(rec.task.endTime ?? "");
		setIsAllDay(rec.task.isAllDay);
		setTagIds(rec.task.tagIds);
		setNotes(rec.task.notes ?? "");
		setSelectedRecIndex(index);
		setIsUsingRecommendation(true);
	}, [recommendations]);

	const clearRecommendation = useCallback(() => {
		const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");
		setTitle("");
		setDate("");
		setDueDate(tomorrow);
		setStartTime("");
		setEndTime("");
		setIsAllDay(false);
		setTagIds([]);
		setNotes("");
		setIsUsingRecommendation(false);
	}, []);

	const nextRecommendation = useCallback(() => {
		if (recommendations.length <= 1) return;
		const nextIndex = (selectedRecIndex + 1) % recommendations.length;
		fillRecommendation(nextIndex);
	}, [recommendations, selectedRecIndex, fillRecommendation]);

	const handleSave = useCallback(() => {
		if (!title.trim()) return;

		const baseTask = {
			id: generateId(),
			title: title.trim(),
			date: date || undefined,
			dueDate: dueDate || undefined,
			startTime: isAllDay ? undefined : startTime,
			endTime: isAllDay ? undefined : endTime,
			isAllDay,
			tagIds,
			repeatRule: {
				frequency,
				weekdays: frequency === "weekly" ? weekdays : undefined,
				endDate: repeatEndDate || undefined,
				interval: frequency === "custom" ? repeatInterval : undefined,
				customUnit: frequency === "custom" ? repeatUnit : undefined,
			},
			notes: notes.trim() || undefined,
			status,
			createdAt: defaultCreatedAt ? new Date(defaultCreatedAt).toISOString() : new Date().toISOString(),
		};

		if (onSubmit) {
			onSubmit(baseTask);
		} else if (onAddTask) {
			onAddTask(baseTask);
		}
		onClose();
	}, [title, date, dueDate, startTime, endTime, isAllDay, tagIds, frequency, weekdays, repeatEndDate, repeatInterval, repeatUnit, notes, status, onAddTask, onSubmit, onClose, defaultDate]);

	const handleDateRangeSelect = useCallback(
		(date: string, startTime?: string, endTime?: string) => {
			if (editingStepId) {
				updateStep(editingStepId, {
					date,
					startTime: startTime || undefined,
					endTime: endTime || undefined,
				});
				setEditingStepId(null);
			} else {
				setDate(date);
				if (startTime && endTime) {
					setStartTime(startTime);
					setEndTime(endTime);
					setIsAllDay(false);
				} else {
					setStartTime("");
					setEndTime("");
					setIsAllDay(true);
				}
			}
		},
		[editingStepId],
	);

	function addStep() {
		const newStep: TaskStep = {
			id: generateId(),
			title: "",
			status: "pending",
		};
		setSteps((prev) => [...prev, newStep]);
	}

	function removeStep(id: string) {
		setSteps((prev) => prev.filter((s) => s.id !== id));
	}

	function updateStep(id: string, updates: Partial<TaskStep>) {
		setSteps((prev) =>
			prev.map((s) => (s.id === id ? { ...s, ...updates } : s)),
		);
	}

	const toggleTag = (tagId: string) => {
		setTagIds((prev) =>
			prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
		);
	};

	const toggleWeekday = useCallback((d: number) => {
		setWeekdays((prev) =>
			prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d],
		);
	}, []);

	const wdLabels = lang === "zh" ? WEEKDAY_LABELS : WEEKDAY_LABELS_EN;

	return (
		<>
			<Dialog open={open} onOpenChange={(v) => !v && onClose()}>
				<DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
					{/* 推荐提示条 */}
					{recommendations.length > 0 && (
						<div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200/60 dark:border-amber-800/60 px-4 py-3 rounded-lg mb-4">
							<div className="flex items-start gap-3">
								<div className="flex-shrink-0 mt-0.5">
									<Sparkles className="w-4 h-4 text-amber-500" />
								</div>
								<div className="flex-1 min-w-0">
									<div className="flex items-center justify-between mb-1">
										<span className="text-sm font-semibold text-amber-800 dark:text-amber-300">
											{isUsingRecommendation
												? `${lang === "zh" ? "智能推荐" : "Smart Recommendation"} ${selectedRecIndex + 1}/${recommendations.length}`
												: `${lang === "zh" ? "为您准备了" : "We have"} ${recommendations.length} ${lang === "zh" ? "个智能推荐" : "recommendations"}`}
										</span>
										{recommendations.length > 1 && (
											<div className="flex items-center gap-1">
												{onShowDetail && currentRec && (
													<Button
														variant="ghost"
														size="sm"
														className="h-7 px-2 text-[10px] text-amber-700 hover:text-amber-800 hover:bg-amber-100/60"
														onClick={() => onShowDetail(currentRec)}
													>
														<BarChart2 className="w-3 h-3 mr-1" />
														{lang === "zh" ? "详情" : "Details"}
													</Button>
												)}
												{isUsingRecommendation && (
													<Button
														variant="ghost"
														size="sm"
														className="h-7 px-2 text-[10px] text-amber-700 hover:text-amber-800 hover:bg-amber-100/60"
														onClick={nextRecommendation}
													>
														<RefreshCw className="w-3 h-3 mr-1" />
														{lang === "zh" ? "换一个" : "Next"}
													</Button>
												)}
											</div>
										)}
									</div>

									{isUsingRecommendation && currentRec && (
										<>
											<p className="text-xs text-amber-700/80 dark:text-amber-200/80 mb-2">
												{currentRec.reason}
											</p>
											<div className="flex items-center gap-2">
												<Button
													variant="ghost"
													size="sm"
													className="h-7 px-3 text-xs text-amber-700 hover:text-amber-800 hover:bg-amber-100/60"
													onClick={clearRecommendation}
												>
													<X className="w-3 h-3 mr-1" />
													{lang === "zh" ? "清空，自己填写" : "Clear & Fill Manually"}
												</Button>
											</div>
										</>
									)}

									{!isUsingRecommendation && (
										<div className="flex items-center gap-2">
											<Button
												size="sm"
												className="h-7 px-3 text-xs bg-amber-500 hover:bg-amber-600 text-white"
												onClick={() => fillRecommendation(0)}
											>
												<Check className="w-3 h-3 mr-1" />
												{lang === "zh" ? "使用推荐" : "Use Recommendation"}
											</Button>
										</div>
									)}
								</div>
							</div>
						</div>
					)}

					<DialogHeader>
						<DialogTitle>{lang === "zh" ? "创建任务" : "Create Task"}</DialogTitle>
						<DialogDescription className="sr-only">
							{lang === "zh" ? "创建任务" : "Create Task"}
						</DialogDescription>
					</DialogHeader>

					<div className="flex flex-col gap-4">
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="task-title">{t.task.title} *</Label>
							<Input
								id="task-title"
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								placeholder={t.task.titlePlaceholder}
								autoFocus
							/>
						</div>

						<div className="flex flex-col gap-1.5">
							<Label htmlFor="task-due-date">{t.task.dueDate}</Label>
							<Input
								id="task-due-date"
								type="date"
								value={dueDate}
								onChange={(e) => setDueDate(e.target.value)}
							/>
						</div>

						<div className="flex flex-col gap-3 p-3 bg-muted/30 rounded-lg">
							<div className="flex items-center gap-2">
								<Label className="text-sm font-semibold text-foreground">
									{lang === "zh" ? "计划时间" : "Schedule Time"}
								</Label>
							</div>

							<div className="flex items-center justify-between">
								<Label htmlFor="multi-step-switch" className="text-sm">
									{t.task.multiStep}
								</Label>
								<Switch
									id="multi-step-switch"
									checked={isMultiStep}
									onCheckedChange={setIsMultiStep}
								/>
							</div>

							{!isMultiStep && (
								<div className="flex flex-col gap-3 pt-2">
									{date ? (
										<div className="flex flex-col sm:flex-row gap-3 p-3 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
											<div className="flex items-start gap-3 flex-1 min-w-0">
												<Calendar className="h-5 w-5 text-primary shrink-0 mt-0.5" />
												<div className="flex-1 min-w-0">
													<div className="text-sm font-medium text-foreground">
														{format(
															new Date(date),
															lang === "zh" ? "yyyy年MM月dd日" : "MMM dd, yyyy",
														)}
													</div>
													{!isAllDay && startTime && endTime && (
														<div className="text-xs text-muted-foreground mt-1">
															{startTime} - {endTime}
														</div>
													)}
													{isAllDay && (
														<div className="text-xs text-muted-foreground mt-1">
															{lang === "zh" ? "全天任务" : "All day"}
														</div>
													)}
												</div>
											</div>
											<div className="flex items-center gap-2 shrink-0 sm:ml-auto">
												<Button
													variant="ghost"
													size="sm"
													onClick={() => setShowDateRangePicker(true)}
													className="h-8 px-3 text-xs font-medium text-primary hover:bg-primary/10"
												>
													{lang === "zh" ? "修改" : "Edit"}
												</Button>
												<Button
													variant="ghost"
													size="icon"
													onClick={() => {
														setDate("");
														setStartTime("");
														setEndTime("");
														setIsAllDay(false);
													}}
													className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</div>
										</div>
									) : (
										<Button
											variant="outline"
											onClick={() => setShowDateRangePicker(true)}
											className="h-10 justify-start gap-2 border-dashed border-border/50 hover:border-primary/40 hover:bg-primary/5 text-muted-foreground hover:text-primary transition-all duration-300"
										>
											<Calendar className="h-5 w-5" />
											<span>{lang === "zh" ? "选择时间" : "Select Time"}</span>
										</Button>
									)}
								</div>
							)}

							{isMultiStep && (
								<div className="flex flex-col gap-6 pt-4 border-t border-border/30">
									{steps.map((step, index) => (
										<div key={step.id} className="group relative z-10">
											<div className="flex flex-col gap-4 p-5 bg-gradient-to-br from-background to-background/80 rounded-xl border border-border/50 shadow-sm hover:shadow-md transition-all duration-300 hover:border-primary/30">
												<div className="flex gap-4">
													<div className="flex flex-col items-center gap-2 shrink-0">
														<div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-primary/90 to-primary text-primary-foreground text-sm font-bold shadow-md">
															{index + 1}
														</div>
														<Select
															value={step.status}
															onValueChange={(v: TaskStatus) =>
																updateStep(step.id, { status: v })
															}
														>
															<SelectTrigger className="w-20 h-7 text-xs bg-background/50 border-border/50">
																<SelectValue />
															</SelectTrigger>
															<SelectContent className="border-border/50">
																<SelectItem
																	value="pending"
																	className="cursor-pointer text-xs"
																>
																	{lang === "zh" ? "待办" : "Todo"}
																</SelectItem>
																<SelectItem
																	value="completed"
																	className="cursor-pointer text-xs"
																>
																	{lang === "zh" ? "完成" : "Done"}
																</SelectItem>
																<SelectItem
																	value="skipped"
																	className="cursor-pointer text-xs"
																>
																	{lang === "zh" ? "跳过" : "Skip"}
																</SelectItem>
															</SelectContent>
														</Select>
													</div>

													<div className="flex-1 flex flex-col gap-3">
														<div className="flex items-center gap-3">
															<Input
																placeholder={t.task.stepTitle}
																value={step.title}
																onChange={(e) =>
																	updateStep(step.id, { title: e.target.value })
																}
																className="h-12 text-base bg-background/50 border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300"
															/>
															<Button
																variant="ghost"
																size="icon"
																onClick={() => removeStep(step.id)}
																className="h-10 w-10 text-destructive/70 hover:text-destructive hover:bg-destructive/10 opacity-70 hover:opacity-100 transition-all duration-300 shrink-0"
															>
																<Trash2 className="h-5 w-5" />
															</Button>
														</div>

														{step.date ? (
															<div className="flex flex-col sm:flex-row gap-3 p-3 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
																<div className="flex items-start gap-3 flex-1 min-w-0">
																	<Calendar className="h-5 w-5 text-primary shrink-0 mt-0.5" />
																	<div className="flex-1 min-w-0">
																		<div className="text-sm font-medium text-foreground">
																			{format(
																				new Date(step.date),
																				lang === "zh" ? "yyyy年MM月dd日" : "MMM dd, yyyy",
																			)}
																		</div>
																		{step.startTime && step.endTime && (
																			<div className="text-xs text-muted-foreground mt-1">
																				{step.startTime} - {step.endTime}
																			</div>
																		)}
																	</div>
																</div>
																<div className="flex items-center gap-2 shrink-0 sm:ml-auto">
																	<Button
																		variant="ghost"
																		size="sm"
																		onClick={() => {
																			setEditingStepId(step.id);
																			setShowDateRangePicker(true);
																		}}
																		className="h-8 px-3 text-xs font-medium text-primary hover:bg-primary/10"
																	>
																		{lang === "zh" ? "修改" : "Edit"}
																	</Button>
																	<Button
																		variant="ghost"
																		size="icon"
																		onClick={() =>
																			updateStep(step.id, {
																				date: undefined,
																				startTime: undefined,
																				endTime: undefined,
																			})
																		}
																		className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
																	>
																		<Trash2 className="h-4 w-4" />
																	</Button>
																</div>
															</div>
														) : (
															<Button
																variant="outline"
																onClick={() => {
																	setEditingStepId(step.id);
																	setShowDateRangePicker(true);
																}}
																className="h-10 justify-start gap-2 border-dashed border-border/50 hover:border-primary/40 hover:bg-primary/5 text-muted-foreground hover:text-primary transition-all duration-300"
															>
																<Calendar className="h-5 w-5" />
																<span>
																	{lang === "zh" ? "选择时间" : "Select Time"}
																</span>
															</Button>
														)}
													</div>
												</div>
											</div>
										</div>
									))}

									<Button
										variant="outline"
										size="lg"
										onClick={addStep}
										className="w-full h-12 mt-2 border-2 border-dashed border-border/50 hover:border-primary/40 hover:bg-primary/5 text-muted-foreground hover:text-primary transition-all duration-300 group z-10"
									>
										<div className="flex items-center justify-center gap-2">
											<div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center transition-all duration-300 group-hover:bg-primary/20">
												<Plus className="h-4 w-4 text-primary" />
											</div>
											<span className="font-medium">{t.task.addStep}</span>
										</div>
									</Button>
								</div>
							)}
						</div>

						<div className="flex flex-col gap-1.5">
							<Label>{t.task.tags}</Label>
							<div className="flex flex-wrap gap-1.5">
								{tags.map((tag) => {
									const selected = tagIds.includes(tag.id);
									return (
										<button
											key={tag.id}
											type="button"
											onClick={() => toggleTag(tag.id)}
											className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all border"
											style={
												selected
													? {
															backgroundColor: tag.color,
															color: "#fff",
															borderColor: tag.color,
													  }
													: {
															backgroundColor: "transparent",
															color: tag.color,
															borderColor: tag.color,
													  }
											}
										>
											{tag.name}
										</button>
									);
								})}
								<button
									type="button"
									onClick={() => setShowNewTag((v) => !v)}
									className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border border-dashed border-muted-foreground text-muted-foreground hover:border-primary hover:text-primary transition-colors"
								>
									<Plus className="w-3 h-3" />
									{t.task.newTag}
								</button>
							</div>
							{showNewTag && (
								<div className="flex flex-col gap-2 mt-1">
									<div className="flex gap-2 items-center">
										<div className="flex gap-1 flex-wrap">
											{PRESET_TAG_COLORS.map((c) => (
												<button
													key={c}
													type="button"
													onClick={() => {
														setNewTagColor(c);
														setUseCustomColor(false);
													}}
													className={`w-5 h-5 rounded-full border-2 transition-all ${
														!useCustomColor && newTagColor === c
															? "border-foreground"
															: "border-transparent"
													}`}
													style={{ backgroundColor: c }}
												/>
											))}
											<button
												type="button"
												onClick={() => setUseCustomColor(true)}
												className={`w-5 h-5 rounded-full border-2 transition-all ${
													useCustomColor ? "border-foreground" : "border-transparent"
												}`}
												style={{
													backgroundColor: useCustomColor ? customTagColor : "#e5e7eb",
													backgroundImage: useCustomColor
														? "none"
														: "linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)",
													backgroundSize: "8px 8px",
												}}
											/>
										</div>
										{useCustomColor && (
											<input
												type="color"
												value={customTagColor}
												onChange={(e) => setCustomTagColor(e.target.value)}
												className="w-7 h-7 rounded-full border border-border"
											/>
										)}
										<Input
											className="h-7 text-xs flex-1"
											value={newTagName}
											onChange={(e) => setNewTagName(e.target.value)}
											placeholder={t.settings.tagNamePlaceholder}
											onKeyDown={(e) => {
												if (e.key === "Enter") {
												}
											}}
										/>
										<Button
											size="sm"
											variant="outline"
											onClick={() => {}}
											className="h-7 text-xs shrink-0"
										>
											{t.common.add}
										</Button>
									</div>
								</div>
							)}
						</div>

						<div className="flex flex-col gap-1.5">
							<Label>{t.task.repeatRule}</Label>
							<Select
								value={frequency}
								onValueChange={(v) => setFrequency(v as RepeatFrequency)}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="none">{t.repeat.none}</SelectItem>
									<SelectItem value="daily">{t.repeat.daily}</SelectItem>
									<SelectItem value="workdays">{t.repeat.workdays}</SelectItem>
									<SelectItem value="weekly">{t.repeat.weekly}</SelectItem>
									<SelectItem value="monthly">{t.repeat.monthly}</SelectItem>
									<SelectItem value="yearly">{t.repeat.yearly}</SelectItem>
									<SelectItem value="custom">{t.repeat.custom}</SelectItem>
								</SelectContent>
							</Select>

							{frequency === "weekly" && (
								<div className="flex gap-1 mt-1">
									{wdLabels.map((label, i) => (
										<button
											key={i}
											type="button"
											onClick={() => toggleWeekday(i)}
											className="w-8 h-8 rounded-full text-xs font-medium transition-colors"
											style={
												weekdays.includes(i)
													? {
															backgroundColor: "var(--primary)",
															color: "var(--primary-foreground)",
													  }
													: {
															backgroundColor: "var(--muted)",
															color: "var(--muted-foreground)",
													  }
											}
										>
											{label}
										</button>
									))}
								</div>
							)}

							{frequency === "custom" && (
								<div className="flex gap-2 items-center mt-1">
									<span className="text-sm">{t.repeat.customEvery}</span>
									<Input
										type="number"
										min={1}
										value={repeatInterval}
										onChange={(e) =>
											setRepeatInterval(
												Math.max(1, parseInt(e.target.value, 10) || 1),
											)
										}
										className="w-16"
									/>
									<Select
										value={repeatUnit}
										onValueChange={(v) =>
											setRepeatUnit(v as "days" | "weeks" | "months" | "years")
										}
									>
										<SelectTrigger className="w-24">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="days">{t.repeat.customDays}</SelectItem>
											<SelectItem value="weeks">{t.repeat.customWeeks}</SelectItem>
											<SelectItem value="months">{t.repeat.customMonths}</SelectItem>
											<SelectItem value="years">{t.repeat.customYears}</SelectItem>
										</SelectContent>
									</Select>
								</div>
							)}

							{frequency !== "none" && (
								<div className="flex flex-col gap-1.5">
									<Label className="text-xs text-muted-foreground">
										{t.repeat.endDate}
									</Label>
									<Input
										type="date"
										value={repeatEndDate}
										onChange={(e) => setRepeatEndDate(e.target.value)}
										placeholder={t.repeat.endDatePlaceholder}
									/>
								</div>
							)}
						</div>

						{frequency !== "none" && (
							<Collapsible
								open={showAdvancedOptions}
								onOpenChange={setShowAdvancedOptions}
							>
								<CollapsibleTrigger asChild>
									<Button
										variant="ghost"
										size="sm"
										className="w-full justify-start p-0 h-8"
									>
										{showAdvancedOptions ? (
											<ChevronDown className="w-4 h-4 mr-1" />
										) : (
											<ChevronRight className="w-4 h-4 mr-1" />
										)}
										<span className="text-sm">{t.task.advancedOptions}</span>
									</Button>
								</CollapsibleTrigger>
								<CollapsibleContent className="pt-2">
									<div className="flex flex-col gap-3 p-3 bg-muted/30 rounded-lg">
										<div className="flex flex-col gap-1.5">
											<Label
												htmlFor="due-date-offset"
												className="text-xs text-muted-foreground"
											>
												{t.task.dueDateOffset}
											</Label>
											<div className="flex items-center gap-2">
												<Input
													id="due-date-offset"
													type="number"
													min={0}
													value={dueDateOffset}
													onChange={(e) => {
														const val = e.target.value;
														const newOffset =
															val === ""
																? 0
																: Math.max(0, parseInt(val, 10) || 0);
														setDueDateOffset(newOffset);
														if (date) {
															const newDueDate = addDays(
																new Date(date),
																newOffset,
															);
															setDueDate(format(newDueDate, "yyyy-MM-dd"));
														}
													}}
													className="w-16"
												/>
												<span className="text-sm text-muted-foreground">
													{t.task.days}
												</span>
											</div>
											<p className="text-xs text-muted-foreground">
												{t.task.dueDateOffsetDesc}
											</p>
										</div>
									</div>
								</CollapsibleContent>
							</Collapsible>
						)}

						<div className="flex flex-col gap-1.5">
							<Label>{t.task.status}</Label>
							<Select
								value={status}
								onValueChange={(v) => setStatus(v as TaskStatus)}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="pending">{t.status.pending}</SelectItem>
									<SelectItem value="completed">{t.status.completed}</SelectItem>
									<SelectItem value="skipped">{t.status.skipped}</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="flex flex-col gap-1.5">
							<Label htmlFor="task-notes">{t.task.notes}</Label>
							<Textarea
								id="task-notes"
								value={notes}
								onChange={(e) => setNotes(e.target.value)}
								placeholder={t.task.notesPlaceholder}
								rows={3}
							/>
						</div>
					</div>

					<DialogFooter className="flex-col sm:flex-row gap-2">
						<Button variant="outline" onClick={onClose}>
							{t.common.cancel}
						</Button>
						<Button
							onClick={handleSave}
							disabled={!title.trim() || (!date && !dueDate)}
							title={!date && !dueDate ? t.task.dateOrDueDateRequired : undefined}
						>
							{t.common.save}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<DateRangePicker
				open={showDateRangePicker}
				onClose={() => {
					setShowDateRangePicker(false);
					setEditingStepId(null);
				}}
				onSelect={handleDateRangeSelect}
				initialDate={
					editingStepId
						? steps.find((s) => s.id === editingStepId)?.date
						: date
				}
				initialStartTime={
					editingStepId
						? steps.find((s) => s.id === editingStepId)?.startTime
						: startTime
				}
				initialEndTime={
					editingStepId
						? steps.find((s) => s.id === editingStepId)?.endTime
						: endTime
				}
			/>
		</>
	);
}
