"use client";

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
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useTranslations } from "@/lib/i18n";
import { useLanguage } from "@/lib/store";
import type { NotesSyncOption } from "@/lib/types";

interface TaskNotesSyncDialogProps {
	open: boolean;
	onClose: () => void;
	onConfirm: (option: NotesSyncOption) => void;
	isRecurring: boolean;
}

export function TaskNotesSyncDialog({
	open,
	onClose,
	onConfirm,
	isRecurring,
}: TaskNotesSyncDialogProps) {
	const lang = useLanguage();
	const t = useTranslations(lang);
	const [selectedOption, setSelectedOption] =
		useState<NotesSyncOption>("only_this");

	useEffect(() => {
		if (open) {
			setSelectedOption("only_this");
		}
	}, [open]);

	return (
		<Dialog open={open} onOpenChange={(v) => !v && onClose()}>
			<DialogContent className="max-w-sm">
				<DialogHeader>
					<DialogTitle>{t.task.notesSyncTitle}</DialogTitle>
					<DialogDescription>{t.task.notesSyncConfirm}</DialogDescription>
				</DialogHeader>

				{isRecurring && (
					<div className="py-4">
						<div className="flex flex-col gap-2">
							<Label htmlFor="notes-sync-option-select">
								{t.task.notesSyncOptions}
							</Label>
							<Select
								value={selectedOption}
								onValueChange={(v) =>
									setSelectedOption(v as NotesSyncOption)
								}
							>
								<SelectTrigger id="notes-sync-option-select">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="only_this">
										{t.task.notesSyncOnlyThis}
									</SelectItem>
									<SelectItem value="all">
										{t.task.notesSyncAll}
									</SelectItem>
									<SelectItem value="future">
										{t.task.notesSyncFuture}
									</SelectItem>
									<SelectItem value="pending">
										{t.task.notesSyncPending}
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				)}

				<DialogFooter className="flex sm:flex-row gap-2">
					<Button variant="outline" onClick={onClose}>
						{t.common.cancel}
					</Button>
					<Button
						onClick={() =>
							onConfirm(isRecurring ? selectedOption : "only_this")
						}
					>
						{t.common.confirm}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}