"use client";

import { format, isToday, isTomorrow, isThisWeek, differenceInDays } from "date-fns";
import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { useLanguage, useStore } from "@/lib/store";
import { useTranslations } from "@/lib/i18n";
import { Plus, CheckCircle, Calendar, Clock, Tag, AlertCircle, Search, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface PomodoroTaskSelectorProps {
	selectedTaskId?: string | null;
	onTaskSelect: (taskId: string | null) => void;
	onCreateTask?: () => void;
}

export function PomodoroTaskSelector({
	selectedTaskId,
	onTaskSelect,
	onCreateTask,
}: PomodoroTaskSelectorProps) {
	const lang = useLanguage();
	const t = useTranslations(lang);
	const { state } = useStore();
	const { tags } = state;
	const [isOpen, setIsOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	// 获取所有待办任务(不包含已跳过的任务)
	const pendingTasks = state.tasks.filter(
		(task) => task.status === "pending",
	);

	const selectedTask = pendingTasks.find((task) => task.id === selectedTaskId);

	// 获取任务的标签
	const getTaskTags = (taskTagIds: string[]) => {
		return taskTagIds.map((id) => tags.find((tag) => tag.id === id)).filter(Boolean);
	};

	// 格式化日期显示
	const formatDateDisplay = (dateStr?: string) => {
		if (!dateStr) return null;
		try {
			const date = new Date(dateStr);
			return format(date, lang === "zh" ? "MM月dd日" : "MMM dd");
		} catch {
			return null;
		}
	};

	// 判断是否即将到期
	const isDueSoon = (dueDate?: string) => {
		if (!dueDate) return false;
		const due = new Date(dueDate);
		const now = new Date();
		const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
		return diffDays <= 3 && diffDays > 0;
	};

	// 判断是否已过期(今天截止的任务不算过期)
	const isOverdue = (dueDate?: string) => {
		if (!dueDate) return false;
		const due = new Date(dueDate);
		due.setHours(23, 59, 59, 999); // 设置到当天的最后时刻
		const now = new Date();
		return due.getTime() < now.getTime();
	};

	// 获取日期分组标签
	const getDateGroupLabel = (dateStr?: string) => {
		if (!dateStr) return t.pomodoro.noDate;
		try {
			const date = new Date(dateStr);
			if (isToday(date)) return t.pomodoro.today;
			if (isTomorrow(date)) return t.pomodoro.tomorrow;
			if (isThisWeek(date)) return t.pomodoro.thisWeek;
			return t.pomodoro.future;
		} catch {
			return t.pomodoro.noDate;
		}
	};

	// 按日期分组和排序任务
	const groupedTasks = () => {
		// 先筛选
		let filtered = pendingTasks;
		
		// 搜索筛选
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter((task) =>
				task.title.toLowerCase().includes(query)
			);
		}
		
		// 标签筛选
		if (selectedTagFilter) {
			filtered = filtered.filter((task) =>
				task.tagIds.includes(selectedTagFilter)
			);
		}
		
		// 按日期排序(越靠近今天越靠前)
		const sorted = [...filtered].sort((a, b) => {
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			
			const dateA = a.date ? new Date(a.date) : null;
			const dateB = b.date ? new Date(b.date) : null;
			
			// 无日期的任务排在最后
			if (!dateA && !dateB) return 0;
			if (!dateA) return 1;
			if (!dateB) return -1;
			
			// 计算与今天的距离
			const diffA = differenceInDays(dateA, today);
			const diffB = differenceInDays(dateB, today);
			
			// 负数(过去)排在最后
			if (diffA < 0 && diffB >= 0) return 1;
			if (diffB < 0 && diffA >= 0) return -1;
			
			// 都在过去的,按时间排序
			if (diffA < 0 && diffB < 0) return diffA - diffB;
			
			// 都在未来的,距离越近越靠前
			return Math.abs(diffA) - Math.abs(diffB);
		});
		
		// 按日期分组
		const groups: { [key: string]: typeof filtered } = {};
		
		sorted.forEach((task) => {
			const groupLabel = getDateGroupLabel(task.date);
			if (!groups[groupLabel]) {
				groups[groupLabel] = [];
			}
			groups[groupLabel].push(task);
		});
		
		// 按分组顺序排序(今天 -> 明天 -> 本周 -> 未来 -> 无日期)
		const groupOrder = [
			t.pomodoro.today,
			t.pomodoro.tomorrow,
			t.pomodoro.thisWeek,
			t.pomodoro.future,
			t.pomodoro.noDate,
		];
		
		return groupOrder
			.filter((label) => groups[label])
			.map((label) => ({
				label,
				tasks: groups[label],
			}));
	};

	// 处理任务选择
	const handleTaskClick = (taskId: string | null) => {
		onTaskSelect(taskId);
		setIsOpen(false);
		setSearchQuery("");
		setSelectedTagFilter(null);
	};

	// 处理创建新任务
	const handleCreateNewTask = () => {
		onCreateTask?.();
		setIsOpen(false);
		setSearchQuery("");
		setSelectedTagFilter(null);
	};

	// 处理点击外部关闭
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		};
		
		if (isOpen) {
			document.addEventListener("mousedown", handleClickOutside);
		}
		
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isOpen]);

	// 获取所有已使用的标签
	const allUsedTags = tags.filter((tag) =>
		pendingTasks.some((task) => task.tagIds.includes(tag.id))
	);

	const grouped = groupedTasks();

	return (
		<div className="w-full max-w-sm space-y-4" ref={containerRef}>
			{/* 任务选择器 */}
			<div className="space-y-2">
				<div className="text-sm font-medium text-muted-foreground">
					{t.pomodoro.bindTaskToFocus}
				</div>
				
				{/* 触发器 */}
				<button
					onClick={() => setIsOpen(!isOpen)}
					className="w-full flex items-center justify-between px-3 py-2 text-sm border rounded-md hover:bg-accent transition-colors"
				>
					<span className={selectedTask ? "text-foreground" : "text-muted-foreground"}>
						{selectedTask ? selectedTask.title : t.pomodoro.noTaskBinding}
					</span>
					<ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
				</button>
				
				{/* 下拉菜单 */}
				{isOpen && (
					<div className="absolute z-50 w-full max-w-sm mt-1 bg-popover border rounded-md shadow-lg overflow-hidden">
						{/* 搜索框 */}
						<div className="p-2 border-b">
							<div className="relative">
								<Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
								<Input
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									placeholder={t.pomodoro.searchTask}
									className="pl-8 h-8"
								/>
								{searchQuery && (
									<button
										onClick={() => setSearchQuery("")}
										className="absolute right-2 top-1/2 transform -translate-y-1/2"
									>
										<X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
									</button>
								)}
							</div>
						</div>
						
						{/* 标签筛选 */}
						{allUsedTags.length > 0 && (
							<div className="p-2 border-b">
								<div className="text-xs text-muted-foreground mb-1.5">{t.pomodoro.filterByTag}</div>
								<div className="flex flex-wrap gap-1">
									{allUsedTags.map((tag) => (
										<button
											key={tag.id}
											onClick={() => setSelectedTagFilter(
												selectedTagFilter === tag.id ? null : tag.id
											)}
											className={cn(
												"px-2 py-0.5 rounded-full text-xs font-medium transition-all",
												selectedTagFilter === tag.id
													? "ring-2 ring-primary ring-offset-1"
													: "hover:opacity-80"
											)}
											style={{
												backgroundColor: `${tag.color}20`,
												color: tag.color,
											}}
										>
											{tag.name}
										</button>
									))}
								</div>
							</div>
						)}
						
						{/* 任务列表 */}
						<div className="max-h-[300px] overflow-y-auto p-1">
							{/* 不绑定选项 */}
							<button
								onClick={() => handleTaskClick(null)}
								className={cn(
									"w-full flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-accent transition-colors",
									selectedTaskId === null && "bg-accent"
								)}
							>
								<span className="text-muted-foreground">{t.pomodoro.noTaskBinding}</span>
							</button>
							
							{/* 分组显示任务 */}
							{grouped.length > 0 ? (
								grouped.map((group) => (
									<div key={group.label}>
										{/* 分组标题 */}
										<div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground border-b mt-1">
											{group.label} ({group.tasks.length})
										</div>
										
										{/* 任务列表 */}
										{group.tasks.map((task) => (
											<button
												key={task.id}
												onClick={() => handleTaskClick(task.id)}
												className={cn(
													"w-full flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-accent transition-colors",
													selectedTaskId === task.id && "bg-accent"
												)}
											>
												<CheckCircle className="w-3 h-3 shrink-0" />
												<span className="truncate">{task.title}</span>
												{task.startTime && task.endTime && (
													<span className="text-xs text-muted-foreground">
														({task.startTime}-{task.endTime})
													</span>
												)}
											</button>
										))}
									</div>
								))
							) : (
								<div className="px-3 py-2 text-sm text-muted-foreground text-center">
									{t.pomodoro.noMatchingTask}
								</div>
							)}
							
							{/* 创建新任务按钮 */}
							<button
								onClick={handleCreateNewTask}
								className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-accent transition-colors border-t mt-1"
							>
								<Plus className="w-4 h-4" />
								<span>{t.pomodoro.createNewTask}</span>
							</button>
						</div>
					</div>
				)}
			</div>

			{/* 选中任务的详细信息卡片 */}
			{selectedTask && (
				<div className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/20 space-y-3">
					{/* 任务标题 */}
					<div className="flex items-start gap-2">
						<CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
						<div className="text-sm font-medium text-foreground truncate">
							{selectedTask.title}
						</div>
					</div>

					{/* 任务详细信息 */}
					<div className="space-y-2">
						{/* 时间信息 */}
						{selectedTask.startTime && selectedTask.endTime && (
							<div className="flex items-center gap-2 text-xs text-muted-foreground">
								<Clock className="w-3 h-3" />
								<span>{selectedTask.startTime} - {selectedTask.endTime}</span>
								{selectedTask.isAllDay && (
									<span className="px-1.5 py-0.5 bg-muted/30 rounded text-xs">
										{lang === "zh" ? "全天" : "All day"}
									</span>
								)}
							</div>
						)}

						{/* 计划日期 */}
						{selectedTask.date && (
							<div className="flex items-center gap-2 text-xs text-muted-foreground">
								<Calendar className="w-3 h-3" />
								<span>{formatDateDisplay(selectedTask.date)}</span>
							</div>
						)}

						{/* 截止日期 */}
						{selectedTask.dueDate && (
							<div className="flex items-center gap-2 text-xs">
								<AlertCircle className={cn(
									"w-3 h-3",
									isOverdue(selectedTask.dueDate) ? "text-destructive" :
									isDueSoon(selectedTask.dueDate) ? "text-orange-500" : "text-muted-foreground"
								)} />
								<span className={cn(
									isOverdue(selectedTask.dueDate) ? "text-destructive" :
									isDueSoon(selectedTask.dueDate) ? "text-orange-500" : "text-muted-foreground"
								)}>
									{lang === "zh" ? "截止" : "Due"}: {formatDateDisplay(selectedTask.dueDate)}
									{isOverdue(selectedTask.dueDate) && ` (${lang === "zh" ? "已过期" : "Overdue"})`}
									{isDueSoon(selectedTask.dueDate) && ` (${lang === "zh" ? "即将到期" : "Due soon"})`}
								</span>
							</div>
						)}

						{/* 标签 */}
						{selectedTask.tagIds.length > 0 && (
							<div className="flex items-center gap-2">
								<Tag className="w-3 h-3 text-muted-foreground" />
								<div className="flex flex-wrap gap-1">
									{getTaskTags(selectedTask.tagIds).map((tag) => (
										<span
											key={tag?.id}
											className="px-2 py-0.5 rounded-full text-xs font-medium"
											style={{
												backgroundColor: `${tag?.color}20`,
												color: tag?.color,
											}}
										>
											{tag?.name}
										</span>
									))}
								</div>
							</div>
						)}

						{/* 状态 */}
						<div className="flex items-center gap-2">
							<div className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-600 dark:text-blue-400">
								{lang === "zh" ? "待办" : "Pending"}
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}