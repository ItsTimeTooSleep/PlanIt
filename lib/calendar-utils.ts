import { isAfter, isBefore, isToday, parseISO } from "date-fns";
import type { Task } from "./types";

/**
 * 判断日期的状态（过期、未来或今天）
 * @param dateStr - 日期字符串 (yyyy-MM-dd格式)
 * @returns 包含过期、未来/今天状态的对象
 */
export function getDateStatus(dateStr: string): {
	isOverdue: boolean;
	isFutureOrToday: boolean;
	todayDate: Date;
	cellDate: Date;
} {
	const todayDate = new Date();
	todayDate.setHours(0, 0, 0, 0);
	const cellDate = parseISO(dateStr);
	const isOverdue = isBefore(cellDate, todayDate);
	const isFutureOrToday = isAfter(cellDate, todayDate) || isToday(cellDate);

	return {
		isOverdue,
		isFutureOrToday,
		todayDate,
		cellDate,
	};
}

/**
 * 筛选指定日期截止的未完成且未跳过的任务
 * @param tasks - 所有任务列表
 * @param dateStr - 日期字符串 (yyyy-MM-dd格式)
 * @returns 筛选后的任务列表
 */
export function filterDueTasksForDay(
	tasks: Task[],
	dateStr: string,
): Task[] {
	return tasks.filter(
		(task) =>
			task.dueDate === dateStr &&
			task.status !== "completed" &&
			task.status !== "skipped",
	);
}

/**
 * 获取截止任务徽章的颜色类名
 * @param isOverdue - 是否过期
 * @param isFutureOrToday - 是否未来或今天
 * @returns 颜色类名
 */
export function getDueBadgeColorClass(
	isOverdue: boolean,
	isFutureOrToday: boolean,
): string {
	if (isOverdue) {
		return "bg-gradient-to-br from-red-500 to-red-600";
	}
	if (isFutureOrToday) {
		return "bg-gradient-to-br from-yellow-500 to-yellow-600";
	}
	return "bg-gradient-to-br from-red-500 to-red-600";
}

/**
 * 获取截止任务悬停菜单标题的颜色类名
 * @param _isOverdue - 是否过期（当前未使用，统一接口保留）
 * @returns 颜色类名
 */
export function getDueHoverTitleColorClass(_isOverdue: boolean): string {
	return "text-red-600 dark:text-red-400";
}