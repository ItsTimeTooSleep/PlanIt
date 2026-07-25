"use client";

import { format } from "date-fns";
import { Battery, CheckCircle, Coffee, Plus, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { TaskModal } from "@/components/task-modal";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/lib/i18n";
import { usePomodoro } from "@/lib/pomodoro-hooks";
import { useLanguage, useStore } from "@/lib/store";

interface PomodoroSummaryProps {
	onClose: () => void;
}

export function PomodoroSummary({ onClose }: PomodoroSummaryProps) {
	const lang = useLanguage();
	const t = useTranslations(lang);
	const { pomodoro, calculateBreakCount } = usePomodoro();
	const { updateTask, state } = useStore();
	const { tasks } = state;
	const [showTaskModal, setShowTaskModal] = useState(false);
	const hasUpdatedTask = useRef(false);

	const isManualStop = pomodoro.manualStop;

	// 自然完成时自动更新绑定任务的时间数据
	useEffect(() => {
		if (hasUpdatedTask.current) return;

		if (!isManualStop && pomodoro.taskId && pomodoro.startTime && pomodoro.actualEndTime) {
			const task = tasks.find((t) => t.id === pomodoro.taskId);
			if (task) {
				if (!task.startTime || !task.endTime || task.status !== "completed") {
					const actualStartTime = format(pomodoro.startTime, "HH:mm");
					const actualEndTime = format(pomodoro.actualEndTime, "HH:mm");
					const actualDate = format(pomodoro.startTime, "yyyy-MM-dd");

					updateTask(task.id, {
						date: task.date || actualDate,
						startTime: actualStartTime,
						endTime: actualEndTime,
						status: "completed",
					});

					hasUpdatedTask.current = true;
				}
			}
		}
	}, []);

	const handleWriteToTask = () => {
		if (hasUpdatedTask.current) return;
		if (pomodoro.taskId && pomodoro.startTime && pomodoro.actualEndTime) {
			const task = tasks.find((t) => t.id === pomodoro.taskId);
			if (task) {
				const actualStartTime = format(pomodoro.startTime, "HH:mm");
				const actualEndTime = format(pomodoro.actualEndTime, "HH:mm");
				const actualDate = format(pomodoro.startTime, "yyyy-MM-dd");

				updateTask(task.id, {
					date: task.date || actualDate,
					startTime: actualStartTime,
					endTime: actualEndTime,
					status: "completed",
				});

				hasUpdatedTask.current = true;
			}
		}
	};

	const { shortBreakCount, longBreakCount } = calculateBreakCount();

	const totalFocusSeconds =
		pomodoro.startTime && pomodoro.actualEndTime
			? Math.floor(
					(pomodoro.actualEndTime.getTime() - pomodoro.startTime.getTime()) /
						1000,
				)
			: pomodoro.totalSeconds - pomodoro.remainingSeconds;

	const totalFocusMinutes = Math.floor(totalFocusSeconds / 60);

	const formatDateTime = (date: Date | null) => {
		if (!date) return "-";
		return format(date, "yyyy-MM-dd HH:mm");
	};

	const getDefaultDate = () => {
		if (pomodoro.startTime) {
			return format(pomodoro.startTime, "yyyy-MM-dd");
		}
		return format(new Date(), "yyyy-MM-dd");
	};

	const getDefaultStartTime = () => {
		if (pomodoro.startTime) {
			return format(pomodoro.startTime, "HH:mm");
		}
		return "";
	};

	const getDefaultEndTime = () => {
		if (pomodoro.actualEndTime) {
			return format(pomodoro.actualEndTime, "HH:mm");
		}
		return "";
	};

	return (
		<>
			<div className="relative z-10 flex flex-col items-center gap-10">
				<div className="flex flex-col items-center gap-6">
					<div className={`w-32 h-32 rounded-full ${isManualStop ? "bg-orange-500/10" : "bg-primary/10"} flex items-center justify-center`}>
						{isManualStop ? (
							<XCircle className="w-16 h-16 text-orange-500" />
						) : (
							<CheckCircle className="w-16 h-16 text-primary" />
						)}
					</div>

					<div className="text-center space-y-2">
						<h2 className="text-3xl font-bold">
							{isManualStop ? t.pomodoro.manualStop : t.pomodoro.focusComplete}
						</h2>
						{isManualStop && (
							<p className="text-muted-foreground">{t.pomodoro.manualStopDesc}</p>
						)}
						<div className="text-2xl font-semibold text-primary">
							{totalFocusMinutes} {t.pomodoro.minutes}
						</div>
						{!isManualStop && (
							<p className="text-muted-foreground">{t.pomodoro.focusDuration}</p>
						)}
					</div>
				</div>

				<div className="w-full max-w-sm space-y-4">
					<div className="bg-muted/30 rounded-xl p-5 space-y-4">
						<div className="space-y-3">
							<div className="flex flex-col gap-1.5">
								<span className="text-xs text-muted-foreground uppercase tracking-wider">
									{t.calendarSettings.startTime}
								</span>
								<span className="text-lg font-medium">
									{formatDateTime(pomodoro.startTime)}
								</span>
							</div>
							<div className="flex flex-col gap-1.5">
								<span className="text-xs text-muted-foreground uppercase tracking-wider">
									{t.pomodoro.scheduledEnd}
								</span>
								<span className="text-lg font-medium">
									{formatDateTime(pomodoro.scheduledEndTime)}
								</span>
							</div>
							<div className="flex flex-col gap-1.5">
								<span className="text-xs text-muted-foreground uppercase tracking-wider">
									{t.pomodoro.actualEnd}
								</span>
								<span className="text-lg font-medium">
									{formatDateTime(pomodoro.actualEndTime)}
								</span>
							</div>
						</div>

						<div className="pt-4 border-t border-border/30">
							<div className="flex flex-col gap-2">
								<span className="text-xs text-muted-foreground uppercase tracking-wider">
									{t.pomodoro.breaks}
								</span>
								<div className="flex items-center gap-4">
									<div
										className={`flex items-center gap-2 px-3 py-2 rounded-lg ${shortBreakCount > 0 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}
									>
										<Coffee className="w-4 h-4" />
										<span className="text-sm font-medium">
											{shortBreakCount} {t.pomodoro.shortBreak}
										</span>
									</div>
									<div
										className={`flex items-center gap-2 px-3 py-2 rounded-lg ${longBreakCount > 0 ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" : "text-muted-foreground"}`}
									>
										<Battery className="w-4 h-4" />
										<span className="text-sm font-medium">
											{longBreakCount} {t.pomodoro.longBreak}
										</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div className="flex flex-col items-center gap-3 w-full max-w-sm">
					{isManualStop && pomodoro.taskId && !hasUpdatedTask.current ? (
						<>
							<Button
								onClick={handleWriteToTask}
								className="rounded-full w-full py-6 text-lg"
							>
								{t.pomodoro.writeToTask}
							</Button>
							<Button
								variant="outline"
								onClick={onClose}
								className="rounded-full w-full py-4"
							>
								{t.pomodoro.skipWriteToTask}
							</Button>
						</>
					) : pomodoro.taskId ? (
						<div className="text-center text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg w-full">
							{t.pomodoro.taskBindingComplete}
						</div>
					) : (
						<Button
							onClick={() => setShowTaskModal(true)}
							className="rounded-full w-full py-6 text-lg"
						>
							<Plus className="w-5 h-5 mr-2" />
							{t.pomodoro.quickCreateTask}
						</Button>
					)}

					{!(isManualStop && pomodoro.taskId && !hasUpdatedTask.current) && (
						<Button
							variant="ghost"
							size="sm"
							onClick={onClose}
							className="rounded-full"
						>
							{t.common.close}
						</Button>
					)}
				</div>
			</div>

			<TaskModal
				open={showTaskModal}
				onClose={() => setShowTaskModal(false)}
				defaultDate={getDefaultDate()}
				defaultStartTime={getDefaultStartTime()}
				defaultEndTime={getDefaultEndTime()}
				defaultStatus="completed"
			/>
		</>
	);
}
