"use client";

import { Clock } from "lucide-react";
import { useEffect, useState } from "react";
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
import { useTranslations } from "@/lib/i18n";
import { useLanguage } from "@/lib/store";
import { cn } from "@/lib/utils";

/** 实际花费时间的快速预设选项（分钟） */
const QUICK_PRESETS = [5, 15, 30, 45, 60, 90, 120];

interface CompleteTaskDialogProps {
	open: boolean;
	onClose: () => void;
	taskTitle: string;
	/** 确认完成：minutes 为实际花费时间（分钟），null 表示仅标记完成不记录时间 */
	onConfirm: (minutes: number | null) => void;
}

export function CompleteTaskDialog({
	open,
	onClose,
	taskTitle,
	onConfirm,
}: CompleteTaskDialogProps) {
	const lang = useLanguage();
	const t = useTranslations(lang);
	const [minutes, setMinutes] = useState("");

	useEffect(() => {
		if (open) setMinutes("");
	}, [open]);

	const handleConfirm = () => {
		const trimmed = minutes.trim();
		if (trimmed === "") {
			onConfirm(null);
		} else {
			const value = Math.max(0, parseInt(trimmed, 10) || 0);
			onConfirm(value);
		}
		onClose();
	};

	const handleNoRecord = () => {
		onConfirm(null);
		onClose();
	};

	return (
		<Dialog open={open} onOpenChange={(v) => !v && onClose()}>
			<DialogContent className="max-w-sm">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Clock className="w-4 h-4" />
						{t.todo.completeTimeTitle}
					</DialogTitle>
					<DialogDescription className="line-clamp-2">
						{taskTitle} · {t.todo.completeTimeDesc}
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col gap-3">
					<div className="flex items-center gap-2">
						<Label htmlFor="complete-time-minutes" className="shrink-0 text-sm">
							{t.task.actualDuration}
						</Label>
						<div className="flex items-center gap-2 flex-1">
							<Input
								id="complete-time-minutes"
								type="number"
								min={0}
								value={minutes}
								onChange={(e) => setMinutes(e.target.value)}
								placeholder={t.todo.completeTimeMinutesPlaceholder}
								onKeyDown={(e) => {
									if (e.key === "Enter" && !e.nativeEvent.isComposing) {
										handleConfirm();
									}
								}}
								autoFocus
							/>
							<span className="text-sm text-muted-foreground">
								{t.task.actualDurationMinutesHint}
							</span>
						</div>
					</div>

					<div className="flex flex-col gap-1.5">
						<span className="text-xs text-muted-foreground">
							{t.todo.completeTimePresets}
						</span>
						<div className="flex flex-wrap gap-1.5">
							{QUICK_PRESETS.map((value) => (
								<button
									key={value}
									type="button"
									onClick={() => setMinutes(String(value))}
									className={cn(
										"px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
										minutes === String(value)
											? "bg-primary text-primary-foreground border-primary"
											: "bg-muted/50 text-foreground border-border hover:bg-muted",
									)}
								>
									{value} {t.task.actualDurationMinutesHint}
								</button>
							))}
						</div>
					</div>
				</div>

				<DialogFooter className="flex-col sm:flex-row sm:items-center gap-2">
					<Button
						variant="ghost"
						onClick={handleNoRecord}
						className="sm:mr-auto"
					>
						{t.todo.completeTimeNoRecord}
					</Button>
					<Button variant="outline" onClick={onClose}>
						{t.common.cancel}
					</Button>
					<Button onClick={handleConfirm}>{t.common.save}</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}