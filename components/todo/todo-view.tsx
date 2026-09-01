"use client";

import {
	endOfMonth,
	endOfToday,
	endOfWeek,
	format,
	isBefore,
	isWithinInterval,
	parseISO,
	startOfMonth,
	startOfToday,
	startOfWeek,
} from "date-fns";
import { enUS, zhCN } from "date-fns/locale";
import { Calendar, Clock, ListTodo, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TaskModal } from "@/components/task-modal";
import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/empty";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslations } from "@/lib/i18n";
import { useLanguage, useStore } from "@/lib/store";
import type { Task } from "@/lib/types";
import {
	FilterBar,
	type GroupBy,
	type SortBy,
	type SortOrder,
	type StatusFilter,
	type TimeFilter,
	type ViewMode,
} from "./filter-bar";
import { TaskItem } from "./task-item";

type GroupedTasks = Record<string, Task[]>;

interface TodoFiltersConfig {
	timeFilter: TimeFilter;
	statusFilter: StatusFilter;
	tagFilter: string | null;
	sortBy: SortBy;
	sortOrder: SortOrder;
	groupBy: GroupBy;
	viewMode: ViewMode;
}

const TODO_FILTERS_STORAGE_KEY = "planit:todo-filters";

const DEFAULT_FILTERS: TodoFiltersConfig = {
	timeFilter: "week",
	statusFilter: "pending",
	tagFilter: null,
	sortBy: "time",
	sortOrder: "asc",
	groupBy: "date",
	viewMode: "byDueDate",
};

function loadTodoFilters(): TodoFiltersConfig {
	try {
		const stored = localStorage.getItem(TODO_FILTERS_STORAGE_KEY);
		if (!stored) return DEFAULT_FILTERS;
		const parsed = JSON.parse(stored);
		// 合并默认值和存储的值
		return { ...DEFAULT_FILTERS, ...parsed };
	} catch {
		return DEFAULT_FILTERS;
	}
}

function saveTodoFilters(config: TodoFiltersConfig): void {
	try {
		localStorage.setItem(TODO_FILTERS_STORAGE_KEY, JSON.stringify(config));
	} catch {
		// 忽略存储错误
	}
}

export function TodoView() {
	const lang = useLanguage();
	const t = useTranslations(lang);
	const { state } = useStore();

	// 初始化配置加载
	const [filters, setFilters] = useState<TodoFiltersConfig>(() =>
		typeof window !== "undefined"
			? loadTodoFilters()
			: DEFAULT_FILTERS,
	);

	const timeFilter = filters.timeFilter;
	const statusFilter = filters.statusFilter;
	const tagFilter = filters.tagFilter;
	const sortBy = filters.sortBy;
	const sortOrder = filters.sortOrder;
	const groupBy = filters.groupBy;
	const viewMode = filters.viewMode;

	const updateFilter = useCallback((key: keyof TodoFiltersConfig, value: any) => {
		setFilters((prev) => {
			const newFilters = { ...prev, [key]: value };
			saveTodoFilters(newFilters);
			return newFilters;
		});
	}, []);

	const setTimeFilter = useCallback(
		(value: TimeFilter) => updateFilter("timeFilter", value),
		[updateFilter],
	);
	const setStatusFilter = useCallback(
		(value: StatusFilter) => updateFilter("statusFilter", value),
		[updateFilter],
	);
	const setTagFilter = useCallback(
		(value: string | null) => updateFilter("tagFilter", value),
		[updateFilter],
	);
	const setSortBy = useCallback(
		(value: SortBy) => updateFilter("sortBy", value),
		[updateFilter],
	);
	const setSortOrder = useCallback(
		(value: SortOrder) => updateFilter("sortOrder", value),
		[updateFilter],
	);
	const setGroupBy = useCallback(
		(value: GroupBy) => updateFilter("groupBy", value),
		[updateFilter],
	);
	const setViewMode = useCallback(
		(value: ViewMode) => updateFilter("viewMode", value),
		[updateFilter],
	);
	const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
	const [editingTask, setEditingTask] = useState<Task | null>(null);
	const [exitingTaskIds, setExitingTaskIds] = useState<Set<string>>(new Set());
	const [searchQuery, setSearchQuery] = useState("");
	const previousTasksRef = useRef<Record<string, Task>>({});

	const locale = lang === "zh" ? zhCN : enUS;
	const today = startOfToday();

	const taskMatchesFilter = useCallback(
		(task: Task): boolean => {
			const dateToUse = viewMode === "byDate" ? task.date : task.dueDate;

			let matchesTime = true;
			if (dateToUse) {
				const taskDate = parseISO(dateToUse);
				if (timeFilter === "today") {
					matchesTime = isWithinInterval(taskDate, {
						start: startOfToday(),
						end: endOfToday(),
					});
				} else if (timeFilter === "week") {
					matchesTime = isWithinInterval(taskDate, {
						start: startOfWeek(today, { weekStartsOn: 1 }),
						end: endOfWeek(today, { weekStartsOn: 1 }),
					});
				} else if (timeFilter === "month") {
					matchesTime = isWithinInterval(taskDate, {
						start: startOfMonth(today),
						end: endOfMonth(today),
					});
				} else if (timeFilter === "overdue") {
					matchesTime = isBefore(taskDate, today);
				} else if (timeFilter === "upcoming") {
					matchesTime = !isBefore(taskDate, startOfToday());
				}
			} else {
				matchesTime = timeFilter === "all";
			}

			let matchesStatus = true;
			if (statusFilter !== "all") {
				matchesStatus = task.status === statusFilter;
			}

			let matchesTag = true;
			if (tagFilter !== null) {
				matchesTag = task.tagIds.includes(tagFilter);
			}

			return matchesTime && matchesStatus && matchesTag;
		},
		[timeFilter, statusFilter, tagFilter, viewMode, today],
	);

	useEffect(() => {
		const currentTasks: Record<string, Task> = {};
		state.tasks.forEach((task) => {
			currentTasks[task.id] = task;
		});

		const newExitingIds = new Set<string>();

		state.tasks.forEach((task) => {
			const previousTask = previousTasksRef.current[task.id];
			if (previousTask) {
				const didMatchBefore = taskMatchesFilter({ ...previousTask });
				const doesMatchNow = taskMatchesFilter(task);

				if (didMatchBefore && !doesMatchNow) {
					newExitingIds.add(task.id);
				}
			}
		});

		if (newExitingIds.size > 0) {
			setExitingTaskIds((prev) => {
				const merged = new Set([...prev, ...newExitingIds]);
				setTimeout(() => {
					setExitingTaskIds((current) => {
						const updated = new Set(current);
						newExitingIds.forEach((id) => updated.delete(id));
						return updated;
					});
				}, 800);
				return merged;
			});
		}

		previousTasksRef.current = currentTasks;
	}, [state.tasks, taskMatchesFilter]);

	const filteredAndSortedTasks = useMemo(() => {
		let expandedTasks: Task[] = [];

		state.tasks.forEach((task) => {
			if (task.isMultiStep && task.steps) {
				// 多步骤任务：将每个步骤转换为虚拟任务
				task.steps.forEach((step) => {
					const stepTask: Task = {
						...task,
						id: `${task.id}-step-${step.id}`,
						title: `${task.title} - ${step.title}`,
						date: step.date,
						startTime: step.startTime,
						endTime: step.endTime,
						status: step.status,
						isAllDay: !step.startTime && !step.endTime,
					};
					expandedTasks.push(stepTask);
				});
			} else {
				// 普通任务
				expandedTasks.push(task);
			}
		});

		expandedTasks = expandedTasks.filter((task) => {
			const dateToUse = viewMode === "byDate" ? task.date : task.dueDate;
			if (!dateToUse) {
				return timeFilter === "all";
			}

			const taskDate = parseISO(dateToUse);

			if (timeFilter === "today") {
				return isWithinInterval(taskDate, {
					start: startOfToday(),
					end: endOfToday(),
				});
			} else if (timeFilter === "week") {
				return isWithinInterval(taskDate, {
					start: startOfWeek(today, { weekStartsOn: 1 }),
					end: endOfWeek(today, { weekStartsOn: 1 }),
				});
			} else if (timeFilter === "month") {
				return isWithinInterval(taskDate, {
					start: startOfMonth(today),
					end: endOfMonth(today),
				});
			} else if (timeFilter === "overdue") {
				return isBefore(taskDate, today);
			} else if (timeFilter === "upcoming") {
				return !isBefore(taskDate, startOfToday());
			}
			return true;
		});

		expandedTasks = expandedTasks.filter((task) => {
			// 对于步骤任务，我们需要检查原始任务是否匹配
			const isStepTask = task.id.includes("-step-");
			const originalTaskId = isStepTask ? task.id.split("-step-")[0] : task.id;
			const _originalTask = state.tasks.find((t) => t.id === originalTaskId);

			let matchesStatus = true;
			if (statusFilter !== "all") {
				matchesStatus = task.status === statusFilter;
			}

			let matchesTag = true;
			if (tagFilter !== null) {
				matchesTag = task.tagIds.includes(tagFilter);
			}

			let matchesSearch = true;
			const query = searchQuery.trim().toLowerCase();
			if (query) {
				matchesSearch = task.title.toLowerCase().includes(query);
			}

			const isExiting = isStepTask
				? exitingTaskIds.has(originalTaskId)
				: exitingTaskIds.has(task.id);

			return (matchesStatus && matchesTag && matchesSearch) || isExiting;
		});

		expandedTasks.sort((a, b) => {
			let result = 0;

			if (sortBy === "date") {
				const dateA = viewMode === "byDate" ? a.date : a.dueDate;
				const dateB = viewMode === "byDate" ? b.date : b.dueDate;
				if (!dateA) return 1;
				if (!dateB) return -1;
				result = dateA.localeCompare(dateB);
			} else if (sortBy === "time") {
				const dateA = viewMode === "byDate" ? a.date : a.dueDate;
				const dateB = viewMode === "byDate" ? b.date : b.dueDate;
				if (!dateA || !dateB || dateA !== dateB) {
					if (!dateA) return 1;
					if (!dateB) return -1;
					result = dateA.localeCompare(dateB);
				} else {
					if (a.isAllDay && !b.isAllDay) result = -1;
					else if (!a.isAllDay && b.isAllDay) result = 1;
					else if (!a.startTime || !b.startTime) result = 0;
					else result = a.startTime.localeCompare(b.startTime);
				}
			} else if (sortBy === "title") {
				result = a.title.localeCompare(b.title);
			} else if (sortBy === "status") {
				const statusOrder = { pending: 0, skipped: 1, completed: 2 };
				result = statusOrder[a.status] - statusOrder[b.status];
			}

			return sortOrder === "asc" ? result : -result;
		});

		return expandedTasks;
	}, [
		state.tasks,
		timeFilter,
		statusFilter,
		tagFilter,
		sortBy,
		sortOrder,
		today,
		viewMode,
		exitingTaskIds,
	]);

	const groupedTasks = useMemo(() => {
		const grouped: GroupedTasks = {};

		filteredAndSortedTasks.forEach((task) => {
			let key: string;
			if (groupBy === "date") {
				const dateKey = viewMode === "byDate" ? task.date : task.dueDate;
				key = dateKey || "unscheduled";
			} else if (groupBy === "status") {
				key = task.status;
			} else if (groupBy === "tag") {
				key = task.tagIds.length > 0 ? task.tagIds[0] : "untagged";
			} else {
				key = "all";
			}

			if (!grouped[key]) {
				grouped[key] = [];
			}
			grouped[key].push(task);
		});

		return grouped;
	}, [filteredAndSortedTasks, groupBy, viewMode]);

	const allTasksWithTimeAndTagFilter = useMemo(() => {
		let tasks = [...state.tasks];

		tasks = tasks.filter((task) => {
			const dateToUse = viewMode === "byDate" ? task.date : task.dueDate;
			if (!dateToUse) {
				return timeFilter === "all";
			}

			const taskDate = parseISO(dateToUse);

			if (timeFilter === "today") {
				return isWithinInterval(taskDate, {
					start: startOfToday(),
					end: endOfToday(),
				});
			} else if (timeFilter === "week") {
				return isWithinInterval(taskDate, {
					start: startOfWeek(today, { weekStartsOn: 1 }),
					end: endOfWeek(today, { weekStartsOn: 1 }),
				});
			} else if (timeFilter === "month") {
				return isWithinInterval(taskDate, {
					start: startOfMonth(today),
					end: endOfMonth(today),
				});
			} else if (timeFilter === "overdue") {
				return isBefore(taskDate, today);
			} else if (timeFilter === "upcoming") {
				return !isBefore(taskDate, startOfToday());
			}
			return true;
		});

		if (tagFilter !== null) {
			tasks = tasks.filter((task) => task.tagIds.includes(tagFilter));
		}

		return tasks;
	}, [state.tasks, timeFilter, tagFilter, today, viewMode]);

	const allTasksCompletedCount = useMemo(() => {
		return allTasksWithTimeAndTagFilter.filter((t) => t.status === "completed")
			.length;
	}, [allTasksWithTimeAndTagFilter]);

	const getGroupLabel = useCallback(
		(key: string) => {
			if (groupBy === "date") {
				if (key === "unscheduled") {
					return t.task.unscheduled;
				}
				const date = parseISO(key);
				return format(
					date,
					lang === "zh" ? "yyyy年M月d日 EEEE" : "EEEE, MMMM d, yyyy",
					{ locale },
				);
			} else if (groupBy === "status") {
				return t.status[key as keyof typeof t.status];
			} else if (groupBy === "tag") {
				if (key === "untagged") return t.task.untagged;
				const tag = state.tags.find((t) => t.id === key);
				return tag?.name || key;
			}
			return "";
		},
		[groupBy, lang, locale, t, state.tags],
	);

	const handleAddTask = useCallback(() => {
		setEditingTask(null);
		setIsTaskModalOpen(true);
	}, []);

	const handleEditTask = useCallback((task: Task) => {
		setEditingTask(task);
		setIsTaskModalOpen(true);
	}, []);

	const allDayTasks = filteredAndSortedTasks.filter((t) => t.isAllDay);
	const scheduledTasks = filteredAndSortedTasks.filter((t) => !t.isAllDay);

	return (
		<div className="h-[calc(100vh-2.25rem)] flex flex-col ml-16">
			<FilterBar
				timeFilter={timeFilter}
				statusFilter={statusFilter}
				tagFilter={tagFilter}
				sortBy={sortBy}
				sortOrder={sortOrder}
				groupBy={groupBy}
				viewMode={viewMode}
				tags={state.tags}
				completedCount={allTasksCompletedCount}
				totalCount={allTasksWithTimeAndTagFilter.length}
				searchQuery={searchQuery}
				onSearchChange={setSearchQuery}
				onTimeFilterChange={setTimeFilter}
				onStatusFilterChange={setStatusFilter}
				onTagFilterChange={setTagFilter}
				onSortByChange={setSortBy}
				onSortOrderChange={setSortOrder}
				onGroupByChange={setGroupBy}
				onViewModeChange={setViewMode}
				onAddTask={handleAddTask}
			/>

			<ScrollArea className="flex-1 h-0">
				<div className="max-w-5xl mx-auto p-6 space-y-6">
					{filteredAndSortedTasks.length === 0 ? (
						<Empty
							title={t.todo.noTasks}
							description={t.todo.noTasksDesc}
							icon={<ListTodo className="w-6 h-6" />}
							action={
								<Button onClick={handleAddTask}>
									<Plus className="w-4 h-4 mr-2" />
									{t.todo.addTask}
								</Button>
							}
						/>
					) : groupBy === "none" ? (
						<>
							{allDayTasks.length > 0 && (
								<div className="space-y-3">
									<h2 className="text-sm font-semibold text-muted-foreground/80 flex items-center gap-2 tracking-wide uppercase">
										<Calendar className="w-4 h-4" />
										{t.todo.allDayEvents}
									</h2>
									<div className="space-y-2">
										{allDayTasks.map((task) => (
											<TaskItem
												key={task.id}
												task={task}
												tags={state.tags}
												onEdit={handleEditTask}
												statusFilter={statusFilter}
												shouldExit={exitingTaskIds.has(task.id)}
											/>
										))}
									</div>
								</div>
							)}

							{scheduledTasks.length > 0 && (
								<div className="space-y-3">
									<h2 className="text-sm font-semibold text-muted-foreground/80 flex items-center gap-2 tracking-wide uppercase">
										<Clock className="w-4 h-4" />
										{t.todo.scheduledTasks}
									</h2>
									<div className="space-y-2">
										{scheduledTasks.map((task) => (
											<TaskItem
												key={task.id}
												task={task}
												tags={state.tags}
												onEdit={handleEditTask}
												statusFilter={statusFilter}
												shouldExit={exitingTaskIds.has(task.id)}
											/>
										))}
									</div>
								</div>
							)}
						</>
					) : (
						Object.entries(groupedTasks).map(([key, tasks]) => (
							<div key={key} className="space-y-3">
								<h2 className="text-sm font-semibold text-muted-foreground/80 tracking-wide">
									{getGroupLabel(key)}
								</h2>
								<div className="space-y-2">
									{tasks.map((task) => (
										<TaskItem
											key={task.id}
											task={task}
											tags={state.tags}
											onEdit={handleEditTask}
											statusFilter={statusFilter}
											shouldExit={exitingTaskIds.has(task.id)}
										/>
									))}
								</div>
							</div>
						))
					)}
				</div>
			</ScrollArea>

			<TaskModal
				open={isTaskModalOpen}
				onClose={() => setIsTaskModalOpen(false)}
				task={editingTask}
			/>
		</div>
	);
}
