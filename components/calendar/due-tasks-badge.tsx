"use client";

import { AlertCircle } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { DEFAULT_TAG_COLOR } from "@/lib/colors";
import {
	filterDueTasksForDay,
	getDateStatus,
	getDueBadgeColorClass,
	getDueHoverTitleColorClass,
} from "@/lib/calendar-utils";
import type { Tag, Task } from "@/lib/types";
import { cn } from "@/lib/utils";

interface DueTasksBadgeProps {
	dateStr: string;
	tasks: Task[];
	tags: Tag[];
	onOpenTask: (task: Task) => void;
	translations: {
		overdue: string;
		dueSoon: string;
	};
	className?: string;
	badgeClassName?: string;
	hoverMenuClassName?: string;
}

/**
 * 截止任务徽章组件
 * 显示截止任务数量，并根据日期状态显示不同颜色
 * 悬停时显示任务列表菜单
 */
export function DueTasksBadge({
	dateStr,
	tasks,
	tags,
	onOpenTask,
	translations,
	className,
	badgeClassName,
	hoverMenuClassName,
}: DueTasksBadgeProps) {
	const [hovered, setHovered] = useState(false);
	const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const handleMouseEnter = useCallback(() => {
		if (hoverTimeoutRef.current) {
			clearTimeout(hoverTimeoutRef.current);
			hoverTimeoutRef.current = null;
		}
		setHovered(true);
	}, []);

	const handleMouseLeave = useCallback(() => {
		hoverTimeoutRef.current = setTimeout(() => {
			setHovered(false);
		}, 150);
	}, []);

	const dueTasks = filterDueTasksForDay(tasks, dateStr);
	const { isOverdue, isFutureOrToday } = getDateStatus(dateStr);

	if (dueTasks.length === 0) {
		return null;
	}

	return (
		<div
			className={cn("relative", className)}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
		>
			{/* 徽章 */}
			<span
				className={cn(
					"text-[10px] font-bold text-white rounded-md px-1.5 py-0.5 cursor-help shadow-sm hover:shadow-md transition-all",
					getDueBadgeColorClass(isOverdue, isFutureOrToday),
					badgeClassName,
				)}
			>
				{dueTasks.length}
			</span>

			{/* 悬停菜单 */}
			{hovered && (
				<div
					className={cn(
						"absolute top-7 right-0 z-[60] bg-popover border border-border rounded-xl shadow-xl p-3 min-w-[150px] max-w-[220px]",
						hoverMenuClassName,
					)}
					onMouseEnter={handleMouseEnter}
					onMouseLeave={handleMouseLeave}
				>
					{/* 标题 */}
					<p
						className={cn(
							"text-xs font-semibold mb-2 flex items-center gap-1.5",
							getDueHoverTitleColorClass(isOverdue),
						)}
					>
						<AlertCircle className="w-3.5 h-3.5" />
						{isOverdue ? translations.overdue : translations.dueSoon}
					</p>

					{/* 任务列表：任务过多时支持滚动查看 */}
					<div className="max-h-56 overflow-y-auto overscroll-contain pr-1 -mr-1">
						{dueTasks.map((task) => {
							const tag = tags.find((tg) => task.tagIds[0] === tg.id);
							const color = tag?.color ?? DEFAULT_TAG_COLOR;
							return (
								<div
									key={task.id}
									className="flex items-center gap-1.5 py-1.5 px-2 cursor-pointer hover:bg-muted/60 rounded-lg transition-all min-w-0"
									onClick={(e) => {
										e.stopPropagation();
										onOpenTask(task);
									}}
									style={{ overflow: "hidden" }}
								>
									<div
										className="w-2.5 h-2.5 rounded-full shrink-0"
										style={{ backgroundColor: color }}
									/>
									<span
										className="text-[11px] flex-1 min-w-0 font-medium"
										style={{
											overflow: "hidden",
											textOverflow: "ellipsis",
											whiteSpace: "nowrap",
										}}
									>
										{task.title}
									</span>
								</div>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
}