"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useTranslations } from "@/lib/i18n";
import { usePomodoroDialog } from "@/lib/pomodoro-context";
import { useLanguage } from "@/lib/store";
import { PomodoroTimer } from "./pomodoro-timer";

export function PomodoroDialog() {
	const lang = useLanguage();
	const t = useTranslations(lang);
	const { isOpen, close } = usePomodoroDialog();

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				if (!open) close();
			}}
		>
			<DialogContent
					className="w-full max-w-5xl h-[90vh] p-0 overflow-y-auto"
					showCloseButton={false}
				>
				<DialogTitle className="absolute -m-px h-px w-px overflow-hidden whitespace-nowrap border-0 p-0">
					{t.pomodoro.title}
				</DialogTitle>
				<div className="w-full h-full">
					<PomodoroTimer />
				</div>
			</DialogContent>
		</Dialog>
	);
}
