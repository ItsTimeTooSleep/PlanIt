"use client";

import { format, isToday, isTomorrow, isYesterday, parseISO } from "date-fns";
import { enUS, zhCN } from "date-fns/locale";
import {
	Calendar,
	CheckCircle2,
	Circle,
	Clock,
	Edit,
	MoreHorizontal,
	SkipForward,
	Trash2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslations } from "@/lib/i18n";
import { useLanguage, useStore } from "@/lib/store";
import { getTaskIdsToDelete, isPartOfRecurringGroup } from "@/lib/task-utils";
import type { DeleteRecurringOption, Tag, Task, TaskStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { TaskDeleteDialog } from "../task-delete-dialog";

interface TaskItemProps {
	task: Task;
	tags: Tag[];
	onEdit: (task: Task) => void;
	className?: string;
	statusFilter?: string;
	shouldExit?: boolean;
}

export function TaskItem({
	task,
	tags,
	onEdit,
	className,
	statusFilter = "all",
	shouldExit = false,
}: TaskItemProps) {
	const lang = useLanguage();
	const t = useTranslations(lang);
	const { state, updateTask, deleteTasks } = useStore();
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [isHighlighted, setIsHighlighted] = useState(false);
	const [isExiting, setIsExiting] = useState(false);
	const itemRef = useRef<HTMLDivElement>(null);
	const previousStatusRef = useRef<string | null>(null);
	const isMountedRef = useRef(false);

	const locale = lang === "zh" ? zhCN : enUS;

	useEffect(() => {
		console.log(
			`[TaskItem ${task.id}] DEBUG - statusFilter: "${statusFilter}", task.status: "${task.status}", previous: "${previousStatusRef.current}"`,
		);

		if (!isMountedRef.current) {
			previousStatusRef.current = task.status;
			isMountedRef.current = true;
			console.log(`[TaskItem ${task.id}] Initial mount`);
			return;
		}

		if (task.status !== previousStatusRef.current) {
			console.log(
				`[TaskItem ${task.id}] Status changed! statusFilter !== 'all'? ${statusFilter !== "all"}`,
			);
			if (statusFilter !== "all") {
				console.log(`[TaskItem ${task.id}] Triggering highlight!`);
				setIsHighlighted(true);
				setTimeout(() => setIsHighlighted(false), 500);
			}
		}
		previousStatusRef.current = task.status;
	}, [task.status, task.id, statusFilter]);

	useEffect(() => {
		if (shouldExit && !isExiting) {
			setIsExiting(true);
		}
	}, [shouldExit, isExiting]);

	const formatDate = useCallback(
		(dateStr?: string) => {
			if (!dateStr) return t.task.unscheduled;
			const date = parseISO(dateStr);
			if (isToday(date)) return t.task.today;
			if (isTomorrow(date)) return t.task.tomorrow;
			if (isYesterday(date)) return lang === "zh" ? "昨天" : "Yesterday";
			return format(date, lang === "zh" ? "M月d日 EEEE" : "MMM d, EEEE", {
				locale,
			});
		},
		[t, lang, locale],
	);

	const getTaskTags = useCallback(() => {
		return task.tagIds
			.map((tagId) => tags.find((tag) => tag.id === tagId))
			.filter((tag): tag is Tag => tag !== undefined);
	}, [task.tagIds, tags]);

	const handleToggleStatus = useCallback(() => {
		const isStepTask = task.id.includes("-step-");
		if (isStepTask) {
			// 更新步骤状态
			const originalTaskId = task.id.split("-step-")[0];
			const stepId = task.id.split("-step-")[1];
			const originalTask = state.tasks.find((t) => t.id === originalTaskId);
			if (originalTask?.steps) {
				const updatedSteps = originalTask.steps.map((s) =>
					s.id === stepId
						? {
								...s,
								status: (s.status === "completed" ? "pending" : "completed") as TaskStatus,
							}
						: s,
				);
				updateTask(originalTaskId, { steps: updatedSteps });
			}
		} else {
			const newStatus: Task["status"] =
				task.status === "completed" ? "pending" : "completed";
			updateTask(task.id, { status: newStatus });
		}
	}, [task.id, task.status, state.tasks, updateTask]);

	const handleMarkSkip = useCallback(() => {
		const isStepTask = task.id.includes("-step-");
		if (isStepTask) {
			const originalTaskId = task.id.split("-step-")[0];
			const stepId = task.id.split("-step-")[1];
			const originalTask = state.tasks.find((t) => t.id === originalTaskId);
			if (originalTask?.steps) {
				const updatedSteps = originalTask.steps.map((s) =>
					s.id === stepId ? { ...s, status: "skipped" as TaskStatus } : s,
				);
				updateTask(originalTaskId, { steps: updatedSteps });
			}
		} else {
			updateTask(task.id, { status: "skipped" });
		}
	}, [task.id, state.tasks, updateTask]);

	const handleMarkPending = useCallback(() => {
		const isStepTask = task.id.includes("-step-");
		if (isStepTask) {
			const originalTaskId = task.id.split("-step-")[0];
			const stepId = task.id.split("-step-")[1];
			const originalTask = state.tasks.find((t) => t.id === originalTaskId);
			if (originalTask?.steps) {
				const updatedSteps = originalTask.steps.map((s) =>
					s.id === stepId ? { ...s, status: "pending" as TaskStatus } : s,
				);
				updateTask(originalTaskId, { steps: updatedSteps });
			}
		} else {
			updateTask(task.id, { status: "pending" });
		}
	}, [task.id, state.tasks, updateTask]);

	const handleEditClick = useCallback(() => {
		const isStepTask = task.id.includes("-step-");
		if (isStepTask) {
			const originalTaskId = task.id.split("-step-")[0];
			const originalTask = state.tasks.find((t) => t.id === originalTaskId);
			if (originalTask) {
				onEdit(originalTask);
				return;
			}
		}
		onEdit(task);
	}, [task, onEdit, state.tasks]);

	const handleDeleteConfirm = useCallback(
		(option: DeleteRecurringOption) => {
			const isStepTask = task.id.includes("-step-");
			const taskToDelete = isStepTask
				? state.tasks.find((t) => t.id === task.id.split("-step-")[0])
				: task;
			if (taskToDelete) {
				const idsToDelete = getTaskIdsToDelete(
					taskToDelete,
					state.tasks,
					option,
				);
				deleteTasks(idsToDelete);
				setShowDeleteDialog(false);
			}
		},
		[task, state.tasks, deleteTasks],
	);

	const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
		if (e.key === "Backspace" || e.key === "Delete") {
			e.preventDefault();
			e.stopPropagation();
			setShowDeleteDialog(true);
		}
	}, []);

	const isCompleted = task.status === "completed";
	const isSkipped = task.status === "skipped";
	const isRecurring = isPartOfRecurringGroup(task, state.tasks);

	return (
		<>
			<div
				ref={itemRef}
				onKeyDown={handleKeyDown}
				className={cn(
					"group flex items-start gap-3 p-4 rounded-xl border bg-card hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-ring",
					"origin-top",
					isHighlighted && "bg-green-50 dark:bg-green-900/20",
					!isExiting && isCompleted && "opacity-60",
					isSkipped && "opacity-40",
					className,
				)}
				style={
					isExiting
						? {
								maxHeight: "0px",
								marginTop: "0px",
								marginBottom: "0px",
								paddingTop: "0px",
								paddingBottom: "0px",
								opacity: 0,
								transform: "scale(0.95) translateX(-8px)",
								overflow: "hidden",
								transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
							}
						: {
								maxHeight: "500px",
								transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
							}
				}
			>
				<div className="flex-shrink-0 pt-1">
					<Checkbox
						checked={isCompleted}
						onCheckedChange={handleToggleStatus}
						className="mt-0.5"
					/>
				</div>

				<div className="flex-1 min-w-0">
					<div className="flex items-start gap-2 min-w-0">
						<h3
							className={cn(
								"font-medium leading-tight truncate",
								isCompleted && "line-through text-muted-foreground",
							)}
						>
							{task.title}
						</h3>

						{task.isAllDay && (
							<Badge variant="outline" className="flex-shrink-0">
								<Calendar className="w-3 h-3 mr-1" />
								{t.todo.allDayEvents}
							</Badge>
						)}
					</div>

					<div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
						<div className="flex items-center gap-1">
							<Calendar className="w-3.5 h-3.5" />
							<span>{formatDate(task.date || task.dueDate)}</span>
						</div>

						{!task.isAllDay && task.startTime && (
							<div className="flex items-center gap-1">
								<Clock className="w-3.5 h-3.5" />
								<span>
									{task.startTime}
									{task.endTime && ` - ${task.endTime}`}
								</span>
							</div>
						)}

						{getTaskTags().map((tag) => (
							<Badge
								key={tag.id}
								variant="secondary"
								style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
							>
								{tag.name}
							</Badge>
						))}

						{isCompleted && (
							<Badge
								variant="secondary"
								className="text-success"
								style={{
									backgroundColor:
										"color-mix(in srgb, var(--success) 15%, transparent)",
								}}
							>
								<CheckCircle2 className="w-3 h-3 mr-1" />
								{t.status.completed}
							</Badge>
						)}

						{isSkipped && (
							<Badge variant="secondary" className="text-gray-500">
								<SkipForward className="w-3 h-3 mr-1" />
								{t.status.skipped}
							</Badge>
						)}
					</div>

					{task.notes && (
						<p className="mt-2 text-sm text-muted-foreground line-clamp-2">
							{task.notes}
						</p>
					)}
				</div>

				<div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" size="icon" className="h-8 w-8">
								<MoreHorizontal className="w-4 h-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem onClick={handleEditClick}>
								<Edit className="w-4 h-4 mr-2" />
								{t.common.edit}
							</DropdownMenuItem>

							{!isCompleted && !isSkipped && (
								<DropdownMenuItem onClick={handleMarkSkip}>
									<SkipForward className="w-4 h-4 mr-2" />
									{t.task.markSkip}
								</DropdownMenuItem>
							)}

							{isSkipped && (
								<DropdownMenuItem onClick={handleMarkPending}>
									<Circle className="w-4 h-4 mr-2" />
									{t.task.markPending}
								</DropdownMenuItem>
							)}

							<DropdownMenuSeparator />

							<DropdownMenuItem
								onClick={() => setShowDeleteDialog(true)}
								className="text-destructive"
							>
								<Trash2 className="w-4 h-4 mr-2" />
								{t.common.delete}
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			<TaskDeleteDialog
				open={showDeleteDialog}
				onClose={() => setShowDeleteDialog(false)}
				onConfirm={handleDeleteConfirm}
				isRecurring={isRecurring}
			/>
		</>
	);
}
