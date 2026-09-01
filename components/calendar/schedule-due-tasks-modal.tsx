"use client";

import { format, parseISO } from "date-fns";
import { CalendarCheck, Check, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DateRangePicker } from "@/components/date-range-picker";
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
import { DEFAULT_TAG_COLOR } from "@/lib/colors";
import { useTranslations } from "@/lib/i18n";
import { useLanguage, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

interface ScheduleDueTasksModalProps {
	open: boolean;
	onClose: () => void;
}

export function ScheduleDueTasksModal({ open, onClose }: ScheduleDueTasksModalProps) {
	const lang = useLanguage();
	const t = useTranslations(lang);
	const { state, updateTask } = useStore();

	const [query, setQuery] = useState("");
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [scheduleOpen, setScheduleOpen] = useState(false);

	const today = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);

	// 截止日期在今天或未来、且尚未安排计划时间（无 date）的任务
	const candidateTasks = useMemo(() => {
		return state.tasks
			.filter(
				(task) =>
					task.dueDate &&
					task.dueDate >= today &&
					!task.date &&
					task.status !== "completed" &&
					task.status !== "skipped",
			)
			.sort((a, b) => (a.dueDate! < b.dueDate! ? -1 : 1));
	}, [state.tasks, today]);

	const filteredTasks = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return candidateTasks;
		return candidateTasks.filter((task) => task.title.toLowerCase().includes(q));
	}, [candidateTasks, query]);

	// 打开弹窗时重置状态
	useEffect(() => {
		if (open) {
			setQuery("");
			setSelectedId(null);
			setScheduleOpen(false);
		}
	}, [open]);

	function toggleSelect(id: string) {
		// 单选：再次点击已选任务可取消选择
		setSelectedId((prev) => (prev === id ? null : id));
	}

	function handleSetPlanTime() {
		if (selectedId === null) {
			toast.warning(t.scheduleDueModal.noSelection);
			return;
		}
		setScheduleOpen(true);
	}

	function handleSelectPlanTime(
		date: string,
		startTime?: string,
		endTime?: string,
	) {
		if (selectedId !== null) {
			updateTask(selectedId, { date, startTime, endTime });
			toast.success(t.scheduleDueModal.applied);
		}
		setScheduleOpen(false);
		onClose();
	}

	return (
		<>
			<Dialog open={open && !scheduleOpen} onOpenChange={(v) => !v && onClose()}>
				<DialogContent className="max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<CalendarCheck className="w-4 h-4 text-primary" />
							{t.scheduleDueModal.title}
						</DialogTitle>
						<DialogDescription>
							{t.scheduleDueModal.description}
						</DialogDescription>
					</DialogHeader>

					{/* Search */}
					<div className="relative">
						<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
						<Input
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder={t.scheduleDueModal.searchPlaceholder}
							className="pl-8"
						/>
					</div>

					{/* Task list */}
					<div className="flex-1 min-h-0 overflow-y-auto border border-border rounded-md">
						{filteredTasks.length === 0 ? (
							<div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
								<Search className="w-6 h-6" />
								<p className="text-sm">{t.scheduleDueModal.noTasks}</p>
							</div>
						) : (
							<div className="flex flex-col">
								{filteredTasks.map((task) => {
									const tagColor =
										state.tags.find(
											(tg) => task.tagIds[0] === tg.id,
										)?.color ?? DEFAULT_TAG_COLOR;
									const isSelected = selectedId === task.id;
									return (
										<div
											key={task.id}
											className={cn(
												"flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors hover:bg-muted",
												isSelected && "bg-primary/5",
											)}
											onClick={() => toggleSelect(task.id)}
										>
											<div
												className={cn(
													"w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all",
													isSelected
														? "bg-primary border-primary"
														: "border-muted-foreground/40",
												)}
											>
												{isSelected && (
													<Check className="w-3 h-3 text-primary-foreground" />
												)}
											</div>
											<div
												className="w-2 h-2 rounded-full shrink-0"
												style={{ backgroundColor: tagColor }}
											/>
											<span className="flex-1 min-w-0 text-sm truncate">
												{task.title}
											</span>
											<span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">
												{t.scheduleDueModal.dueLabel}{" "}
												{lang === "zh"
													? format(parseISO(task.dueDate!), "M月d日")
													: format(parseISO(task.dueDate!), "MMM d")}
											</span>
										</div>
									);
								})}
							</div>
						)}
					</div>

					<DialogFooter className="flex items-center justify-between gap-2 border-t border-border pt-3">
						<span className="text-xs text-muted-foreground">
							{selectedId !== null
								? t.scheduleDueModal.selected(
										filteredTasks.find((task) => task.id === selectedId)?.title ?? "",
									)
								: t.scheduleDueModal.noSelection}
						</span>
						<div className="flex items-center gap-2">
							<Button variant="outline" onClick={onClose}>
								{t.common.cancel}
							</Button>
							<Button
								onClick={handleSetPlanTime}
								disabled={selectedId === null}
							>
								<CalendarCheck className="w-3.5 h-3.5 mr-1.5" />
								{t.scheduleDueModal.setPlanTime}
							</Button>
						</div>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<DateRangePicker open={scheduleOpen} onClose={() => setScheduleOpen(false)} onSelect={handleSelectPlanTime} />
		</>
	);
}