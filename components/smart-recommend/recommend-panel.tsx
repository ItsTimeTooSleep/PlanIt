"use client";

import { format, parseISO } from "date-fns";
import { Calendar, Globe, Plus, Sparkles, Check, X, BarChart2, Clock, Tag, TrendingUp } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Recommendation, RecommendTag } from "@/lib/smart-recommend/types";
import { useLanguage } from "@/lib/store";

interface RecommendPanelProps {
	recommendations: Recommendation[];
	tags: RecommendTag[];
	onAccept?: (index: number) => void;
	onReject?: (index: number) => void;
	contextTime: Date;
	onContextTimeChange: (date: Date) => void;
	onViewDetail?: (recommendation: Recommendation) => void;
	onOpenTaskModal: () => void;
}

export function RecommendPanel({
	recommendations,
	tags,
	onAccept,
	onReject,
	contextTime,
	onContextTimeChange,
	onViewDetail,
	onOpenTaskModal,
}: RecommendPanelProps) {
	const lang = useLanguage();
	const currentHour = contextTime.getHours();
	const currentDay = contextTime.getDay();
	const dayNames = ["日", "一", "二", "三", "四", "五", "六"];
	const [dateInput, setDateInput] = useState(format(contextTime, "yyyy-MM-dd"));
	const [timeInput, setTimeInput] = useState(format(contextTime, "HH:mm"));
	const [calendarOpen, setCalendarOpen] = useState(false);
	const [selectedRecIndex, setSelectedRecIndex] = useState(0);

	useEffect(() => {
		setDateInput(format(contextTime, "yyyy-MM-dd"));
		setTimeInput(format(contextTime, "HH:mm"));
	}, [contextTime]);

	const handleDateApply = useCallback(() => {
		try {
			const newDate = parseISO(`${dateInput}T${timeInput}`);
			if (!Number.isNaN(newDate.getTime())) {
				onContextTimeChange(newDate);
			}
		} catch {
			// invalid date
		}
	}, [dateInput, timeInput, onContextTimeChange]);

	const handleResetContext = useCallback(() => {
		const now = new Date();
		onContextTimeChange(now);
		setDateInput(format(now, "yyyy-MM-dd"));
		setTimeInput(format(now, "HH:mm"));
	}, [onContextTimeChange]);

	const handleCalendarSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const val = e.target.value;
		setDateInput(val);
		try {
			const newDate = parseISO(`${val}T${timeInput}`);
			if (!Number.isNaN(newDate.getTime())) {
				onContextTimeChange(newDate);
			}
		} catch {
			// invalid date
		}
	}, [timeInput, onContextTimeChange]);

	const handleTimeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const val = e.target.value;
		setTimeInput(val);
		try {
			const newDate = parseISO(`${dateInput}T${val}`);
			if (!Number.isNaN(newDate.getTime())) {
				onContextTimeChange(newDate);
			}
		} catch {
			// invalid time
		}
	}, [dateInput, onContextTimeChange]);

	const isSimulated = contextTime.toDateString() !== new Date().toDateString() ||
		Math.abs(contextTime.getHours() - new Date().getHours()) > 0 ||
		Math.abs(contextTime.getMinutes() - new Date().getMinutes()) > 2;

	return (
		<div className="flex flex-col gap-4">
			{/* 模拟上下文卡片 */}
			<div className="bg-card border border-border rounded-xl p-4">
				<div className="flex items-center justify-between mb-3">
					<div className="flex items-center gap-2">
						<Globe className="w-4 h-4 text-muted-foreground" />
						<span className="text-sm font-medium">
							{lang === "zh" ? "模拟上下文" : "Simulated Context"}
						</span>
						{isSimulated && (
							<Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-amber-500/10 text-amber-600">
								{lang === "zh" ? "模拟中" : "Simulating"}
							</Badge>
						)}
					</div>
					{isSimulated && (
						<Button variant="ghost" size="sm" className="h-7 px-2 text-[10px]" onClick={handleResetContext}>
							{lang === "zh" ? "重置为当前" : "Reset to Current"}
						</Button>
					)}
				</div>
				<div className="grid grid-cols-2 gap-3 mb-3">
					<div className="bg-muted/50 rounded-lg p-2.5 text-center">
						<p className="text-[10px] text-muted-foreground">
							{lang === "zh" ? "日期" : "Date"}
						</p>
						<p className="text-sm font-semibold">
							{format(contextTime, "MM月dd日")}
						</p>
					</div>
					<div className="bg-muted/50 rounded-lg p-2.5 text-center">
						<p className="text-[10px] text-muted-foreground">
							{lang === "zh" ? "时间" : "Time"}
						</p>
						<p className="text-sm font-semibold">
							{format(contextTime, "HH:mm")}
						</p>
					</div>
				</div>
				<div className="grid grid-cols-3 gap-2 mb-3">
					<div className="bg-muted/50 rounded-lg p-2 text-center">
						<p className="text-[10px] text-muted-foreground">
							{lang === "zh" ? "星期" : "Weekday"}
						</p>
						<p className="text-xs font-semibold">周{dayNames[currentDay]}</p>
					</div>
					<div className="bg-muted/50 rounded-lg p-2 text-center">
						<p className="text-[10px] text-muted-foreground">
							{lang === "zh" ? "时段" : "Period"}
						</p>
						<p className="text-xs font-semibold">
							{currentHour < 6 ? (lang === "zh" ? "凌晨" : "Night") :
								currentHour < 12 ? (lang === "zh" ? "上午" : "Morning") :
								currentHour < 18 ? (lang === "zh" ? "下午" : "Afternoon") :
								(lang === "zh" ? "晚上" : "Evening")}
						</p>
					</div>
					<div className="bg-muted/50 rounded-lg p-2 text-center">
						<p className="text-[10px] text-muted-foreground">
							{lang === "zh" ? "日期类型" : "Day Type"}
						</p>
						<p className="text-xs font-semibold">
							{currentDay === 0 || currentDay === 6 ?
								(lang === "zh" ? "周末" : "Weekend") :
								(lang === "zh" ? "工作日" : "Workday")}
						</p>
					</div>
				</div>
				<Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
					<PopoverTrigger asChild>
						<Button variant="outline" size="sm" className="w-full h-8 text-xs">
							<Calendar className="w-3.5 h-3.5 mr-1.5" />
							{lang === "zh" ? "调整日期时间" : "Adjust Date & Time"}
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-72 p-3" align="start">
						<div className="flex flex-col gap-2.5">
							<div>
								<p className="text-xs font-medium mb-1.5">
									{lang === "zh" ? "日历选择" : "Calendar Selection"}
								</p>
								<Input
									type="date"
									value={dateInput}
									onChange={handleCalendarSelect}
									className="h-8 text-xs"
								/>
							</div>
							<div>
								<p className="text-xs font-medium mb-1.5">
									{lang === "zh" ? "手动时间" : "Manual Time"}
								</p>
								<Input
									type="time"
									value={timeInput}
									onChange={handleTimeChange}
									className="h-8 text-xs"
								/>
							</div>
							<div className="flex gap-2">
								<Button size="sm" className="h-8 text-xs" onClick={handleDateApply}>
									{lang === "zh" ? "应用" : "Apply"}
								</Button>
								<Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleResetContext}>
									{lang === "zh" ? "重置" : "Reset"}
								</Button>
							</div>
							<div className="flex flex-wrap gap-1">
								{[
									{ label: lang === "zh" ? "明天" : "Tomorrow", offset: 1 },
									{ label: lang === "zh" ? "下周一" : "Next Monday", offset: ((8 - currentDay) % 7) || 7 },
									{ label: lang === "zh" ? "下周五" : "Next Friday", offset: ((5 - currentDay + 7) % 7) || 7 },
								].map((preset) => (
									<Button
										key={preset.label}
										variant="secondary"
										size="sm"
										className="h-7 text-[10px] px-2"
										onClick={() => {
											const d = new Date();
											d.setDate(d.getDate() + preset.offset);
											d.setHours(9, 0, 0, 0);
											onContextTimeChange(d);
											setDateInput(format(d, "yyyy-MM-dd"));
											setTimeInput("09:00");
											setCalendarOpen(false);
										}}
									>
										{preset.label}
									</Button>
								))}
							</div>
						</div>
					</PopoverContent>
				</Popover>
			</div>

			{/* 推荐列表 */}
			{recommendations.length > 0 ? (
				<div className="flex flex-col gap-3">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<Sparkles className="w-4 h-4 text-amber-500" />
							<h3 className="text-sm font-semibold">
								{lang === "zh" ? "智能推荐" : "Smart Recommendations"}
							</h3>
							<Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
								{recommendations.length}
							</Badge>
						</div>
					</div>

					<div className="grid grid-cols-1 gap-3">
						{recommendations.map((rec, index) => {
							const taskTags = tags.filter(t => rec.task.tagIds.includes(t.id));
							const isNovel = rec.isNovel;

							return (
								<Card
									key={index}
									className={cn(
										"border transition-all duration-300 cursor-pointer hover:border-amber-300 hover:shadow-md",
										isNovel ? "border-dashed" : ""
									)}
								>
									<CardHeader className="pb-3 pt-3 px-4">
										<CardTitle className="text-base flex items-start justify-between gap-3">
											<div className="flex items-start gap-2">
												<div className="flex flex-col items-center justify-center gap-0.5 mt-1">
													{isNovel ? (
														<Sparkles className="w-4 h-4 text-purple-500" />
													) : (
														<TrendingUp className="w-4 h-4 text-amber-500" />
													)}
												</div>
												<div className="flex flex-col gap-1.5">
													<div className="flex items-center gap-2">
														<span className="font-semibold">{rec.task.title}</span>
														{isNovel && (
															<Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-purple-100 text-purple-700 border-purple-200">
																{lang === "zh" ? "探索性推荐" : "Exploration"}
															</Badge>
														)}
													</div>
													{rec.reason && (
														<p className="text-xs text-muted-foreground line-clamp-2">
															{rec.reason}
														</p>
													)}
												</div>
											</div>
											<Badge className="shrink-0 text-xs px-2 py-0.5 bg-amber-500/10 text-amber-700 border-amber-200">
												{Math.round(rec.confidence * 100)}%
											</Badge>
										</CardTitle>
									</CardHeader>

									<CardContent className="pb-3 pt-0 px-4">
										<div className="flex flex-wrap gap-1.5 mb-3">
											{taskTags.length > 0 && taskTags.map((tag) => (
												<Badge
													key={tag.id}
													variant="secondary"
													className="text-xs px-1.5 py-0 h-5"
												>
													<div className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: tag.color }} />
													{tag.name}
												</Badge>
											))}
											{rec.task.date && (
												<Badge variant="outline" className="text-xs px-1.5 py-0 h-5">
													<Calendar className="w-3 h-3 mr-1" />
													{rec.task.date}
												</Badge>
											)}
											{rec.task.startTime && rec.task.endTime && (
												<Badge variant="outline" className="text-xs px-1.5 py-0 h-5">
													<Clock className="w-3 h-3 mr-1" />
													{rec.task.startTime} - {rec.task.endTime}
												</Badge>
											)}
											{rec.task.duration > 0 && (
												<Badge variant="outline" className="text-xs px-1.5 py-0 h-5">
													<Tag className="w-3 h-3 mr-1" />
													{rec.task.duration} {lang === "zh" ? "分钟" : "min"}
												</Badge>
											)}
										</div>

										<div className="flex items-center gap-2 justify-end">
											{onViewDetail && (
												<Button
													variant="ghost"
													size="sm"
													className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
													onClick={() => onViewDetail(rec)}
												>
													<BarChart2 className="w-3 h-3 mr-1" />
													{lang === "zh" ? "详情" : "Details"}
												</Button>
											)}
											{onReject && (
												<Button
													variant="ghost"
													size="sm"
													className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
													onClick={() => onReject(index)}
												>
													<X className="w-3 h-3 mr-1" />
													{lang === "zh" ? "不喜欢" : "No Thanks"}
												</Button>
											)}
											{onAccept && (
												<Button
													size="sm"
													className="h-7 px-3 text-xs bg-amber-500 hover:bg-amber-600 text-white"
													onClick={() => onAccept(index)}
												>
													<Check className="w-3 h-3 mr-1" />
													{lang === "zh" ? "使用推荐" : "Use This"}
												</Button>
											)}
										</div>
									</CardContent>
								</Card>
							);
						})}
					</div>
				</div>
			) : (
				<div className="flex flex-col items-center justify-center py-12 text-center">
					<div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
						<Plus className="w-8 h-8 text-primary" />
					</div>
					<p className="text-sm font-medium mb-1">
						{lang === "zh" ? "还没有推荐" : "No Recommendations Yet"}
					</p>
					<p className="text-xs text-muted-foreground mb-4">
						{lang === "zh" ? "添加一些任务后，智能推荐会学习您的习惯" : "Add some tasks and smart recommendations will learn your habits"}
					</p>
					<Button className="h-10 px-8 text-sm font-medium" onClick={onOpenTaskModal}>
						<Sparkles className="w-4 h-4 mr-2" />
						{lang === "zh" ? "创建任务" : "Create Task"}
					</Button>
				</div>
			)}
		</div>
	);
}
