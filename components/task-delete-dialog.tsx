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
import type { DeleteRecurringOption } from "@/lib/types";

interface TaskDeleteDialogProps {
	open: boolean;
	onClose: () => void;
	onConfirm: (option: DeleteRecurringOption) => void;
	isRecurring: boolean;
}

export function TaskDeleteDialog({
	open,
	onClose,
	onConfirm,
	isRecurring,
}: TaskDeleteDialogProps) {
	const lang = useLanguage();
	const t = useTranslations(lang);
	const [selectedOption, setSelectedOption] =
		useState<DeleteRecurringOption>("only_this");

	useEffect(() => {
		if (open) {
			setSelectedOption("only_this");
		}
	}, [open]);

	return (
		<Dialog open={open} onOpenChange={(v) => !v && onClose()}>
			<DialogContent className="max-w-sm">
				<DialogHeader>
					<DialogTitle>{t.task.deleteConfirmTitle}</DialogTitle>
					<DialogDescription>{t.task.deleteConfirm}</DialogDescription>
				</DialogHeader>

				{isRecurring && (
					<div className="py-4">
						<div className="flex flex-col gap-2">
							<Label htmlFor="delete-option-select">
								{t.task.deleteOptions}
							</Label>
							<Select
								value={selectedOption}
								onValueChange={(v) =>
									setSelectedOption(v as DeleteRecurringOption)
								}
							>
								<SelectTrigger id="delete-option-select">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="only_this">
										{t.task.deleteOptionOnlyThis}
									</SelectItem>
									<SelectItem value="all">{t.task.deleteOptionAll}</SelectItem>
									<SelectItem value="future">
										{t.task.deleteOptionFuture}
									</SelectItem>
									<SelectItem value="pending">
										{t.task.deleteOptionPending}
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
						variant="destructive"
						onClick={() =>
							onConfirm(isRecurring ? selectedOption : "only_this")
						}
					>
						{t.common.delete}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
