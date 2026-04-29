"use client";

import { useTranslations } from "@/lib/i18n";
import type { Language } from "@/lib/types";

interface ProgressBarProps {
	completedCount: number;
	totalCount: number;
	lang: Language;
	compact?: boolean;
}

export function ProgressBar({
	completedCount,
	totalCount,
	lang,
	compact = false,
}: ProgressBarProps) {
	const t = useTranslations(lang);
	const percentage = totalCount
		? Math.round((completedCount / totalCount) * 100)
		: 0;

	if (compact) {
		return (
			<div className="flex flex-col gap-1.5">
				<div className="flex items-center justify-between">
					<span className="text-xs font-medium text-muted-foreground">
						{t.progress.todayProgress}
					</span>
					<span className="text-xs font-semibold tabular-nums">
						{completedCount}/{totalCount}
					</span>
				</div>
				<div className="h-1.5 bg-muted rounded-full overflow-hidden">
					<div
						className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
						style={{ width: `${percentage}%` }}
					/>
				</div>
			</div>
		);
	}

	return (
		<div className="flex items-center gap-3">
			<div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
				<div
					className="h-full bg-primary rounded-full transition-all duration-700"
					style={{
						width: totalCount
							? `${(completedCount / totalCount) * 100}%`
							: "0%",
					}}
				/>
			</div>
			<span className="text-sm font-medium text-muted-foreground shrink-0 tabular-nums">
				{t.progress.progressLabel(completedCount, totalCount)}
			</span>
		</div>
	);
}
