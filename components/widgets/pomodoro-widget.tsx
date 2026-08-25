"use client";

import {
	Battery,
	Brain,
	CheckCircle,
	Coffee,
	Minus,
	Pause,
	Play,
	Plus,
	RotateCcw,
	SkipForward,
	Timer,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { POMODORO_COLORS } from "@/lib/colors";
import { useTranslations } from "@/lib/i18n";
import { formatTime, usePomodoro } from "@/lib/pomodoro-hooks";
import { useLanguage, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { BaseWidgetProps } from "@/lib/widget-types";

type SizeMode = "compact" | "normal" | "large" | "xlarge";

interface ContainerSize {
	width: number;
	height: number;
}

export function PomodoroWidget({
	id: _id,
	config,
	className,
}: BaseWidgetProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [sizeMode, setSizeMode] = useState<SizeMode>("normal");
	const [containerSize, setContainerSize] = useState<ContainerSize>({
		width: 300,
		height: 300,
	});

	const lang = useLanguage();
	const t = useTranslations(lang);
	const { state } = useStore();
	const { pomodoro } = state;
	const {
		startTimer,
		pauseTimer,
		stopTimer,
		increaseWorkDuration,
		decreaseWorkDuration,
		switchToNextPhase,
		getUpcomingPhaseInfo,
	} = usePomodoro();

	const showSessionCount = (config?.showSessionCount as boolean) ?? true;

	useEffect(() => {
		const updateSizeMode = () => {
			const el = containerRef.current;
			if (!el) return;
			const { width, height } = el.getBoundingClientRect();
			setContainerSize({ width, height });

			const minDimension = Math.min(width, height);
			const isNarrow = width < 200;
			const isShort = height < 200;

			if (minDimension < 180 || isNarrow || isShort) {
				setSizeMode("compact");
			} else if (minDimension > 380 && width > 380 && height > 380) {
				setSizeMode("xlarge");
			} else if (minDimension > 280 && width > 280 && height > 280) {
				setSizeMode("large");
			} else {
				setSizeMode("normal");
			}
		};

		updateSizeMode();
		window.addEventListener("resize", updateSizeMode);
		return () => window.removeEventListener("resize", updateSizeMode);
	}, []);

	const progress = useMemo(() => {
		return pomodoro.totalSeconds > 0
			? ((pomodoro.totalSeconds - pomodoro.remainingSeconds) /
					pomodoro.totalSeconds) *
					100
			: 0;
	}, [pomodoro.totalSeconds, pomodoro.remainingSeconds]);

	const getPhaseColor = useCallback(() => {
		switch (pomodoro.phase) {
			case "work":
				return POMODORO_COLORS.work;
			case "shortBreak":
				return POMODORO_COLORS.shortBreak;
			case "longBreak":
				return POMODORO_COLORS.longBreak;
		}
	}, [pomodoro.phase]);

	const getPhaseLabel = useCallback(() => {
		const labels = {
			work: t.pomodoro.work,
			shortBreak: t.pomodoro.shortBreak,
			longBreak: t.pomodoro.longBreak,
		};
		return labels[pomodoro.phase];
	}, [pomodoro.phase, t]);

	const handleReset = useCallback(() => {
		stopTimer();
	}, [stopTimer]);

	const handleSkip = useCallback(() => {
		switchToNextPhase();
	}, [switchToNextPhase]);

	const timeFontSize = useMemo(() => {
		switch (sizeMode) {
			case "compact":
				return "text-2xl";
			case "large":
				return "text-4xl";
			case "xlarge":
				return "text-5xl";
			default:
				return "text-3xl";
		}
	}, [sizeMode]);

	const circleSize = useMemo(() => {
		const headerHeight = 40;
		const footerHeight = showSessionCount ? 30 : 0;
		const buttonAreaHeight = 50;
		const padding = 32;

		const availableHeight =
			containerSize.height -
			headerHeight -
			footerHeight -
			buttonAreaHeight -
			padding;
		const availableWidth = containerSize.width - padding;

		const maxCircleSize = Math.min(availableHeight, availableWidth);

		const baseSize = (() => {
			switch (sizeMode) {
				case "compact":
					return 80;
				case "large":
					return 160;
				case "xlarge":
					return 200;
				default:
					return 128;
			}
		})();

		return Math.max(60, Math.min(baseSize, maxCircleSize));
	}, [sizeMode, containerSize, showSessionCount]);

	const buttonSize = useMemo(() => {
		if (containerSize.width < 180 || containerSize.height < 180) return "sm";
		switch (sizeMode) {
			case "compact":
				return "sm";
			case "large":
			case "xlarge":
				return "lg";
			default:
				return "default";
		}
	}, [sizeMode, containerSize]);

	const showButtonText = useMemo(() => {
		return containerSize.width >= 200 && sizeMode !== "compact";
	}, [containerSize.width, sizeMode]);

	const showSessionInfo = showSessionCount && containerSize.height >= 180;
	const showSkipButton = containerSize.width >= 200;
	const showTimeAdjust =
		pomodoro.status === "idle" &&
		containerSize.width >= 150 &&
		sizeMode !== "compact";

	const isFinished =
		pomodoro.status === "finished" || pomodoro.status === "summary";

	return (
		<div
			ref={containerRef}
			className={cn(
				"flex flex-col h-full bg-card rounded-xl border border-border overflow-hidden",
				className,
			)}
		>
			<div
				className="flex items-center justify-between px-3 py-2 border-b border-border"
				style={{
					backgroundColor: `${getPhaseColor()}15`,
				}}
			>
				<div className="flex items-center gap-2">
					{pomodoro.phase === "work" ? (
						<Brain
							className={cn(sizeMode === "compact" ? "w-3 h-3" : "w-4 h-4")}
							style={{ color: getPhaseColor() }}
						/>
					) : (
						<Coffee
							className={cn(sizeMode === "compact" ? "w-3 h-3" : "w-4 h-4")}
							style={{ color: getPhaseColor() }}
						/>
					)}
					<span
						className={cn(
							"font-medium",
							sizeMode === "compact" ? "text-xs" : "text-sm",
						)}
					>
						{t.pomodoro.title}
					</span>
				</div>
				<span
					className={cn(
						"font-semibold px-2 py-0.5 rounded-full",
						sizeMode === "compact" ? "text-[10px]" : "text-xs",
					)}
					style={{
						backgroundColor: `${getPhaseColor()}25`,
						color: getPhaseColor(),
					}}
				>
					{getPhaseLabel()}
				</span>
			</div>

			<div className="flex-1 flex flex-col items-center justify-center p-4">
				{isFinished ? (
					(() => {
						const { hasBreak, nextPhase } = getUpcomingPhaseInfo();
						const completedMinutes = Math.floor(pomodoro.totalSeconds / 60);

						return (
							<div className="flex flex-col items-center gap-3">
								<div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
									<CheckCircle className="w-6 h-6 text-primary" />
								</div>

								<div className="text-center">
									<p className="text-sm font-medium">{t.pomodoro.complete}</p>
									<p className="text-xs text-muted-foreground">
										{completedMinutes}
										{t.pomodoro.minutes}
									</p>
								</div>

								{hasBreak && (
									<div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted/30 text-xs">
										{nextPhase === "shortBreak" ? (
											<>
												<Coffee className="w-3 h-3 text-emerald-500" />
												<span>{pomodoro.settings.shortBreakDuration}min</span>
											</>
										) : (
											<>
												<Battery className="w-3 h-3 text-blue-500" />
												<span>{pomodoro.settings.longBreakDuration}min</span>
											</>
										)}
									</div>
								)}

								<div className="flex items-center gap-2">
									{hasBreak && (
										<Button
											size="sm"
											variant="outline"
											className="rounded-full text-xs"
											onClick={() => {
												switchToNextPhase();
												startTimer();
											}}
										>
											{t.pomodoro.break}
										</Button>
									)}

									<Button
										size="sm"
										className="rounded-full text-xs"
										onClick={switchToNextPhase}
									>
										{hasBreak ? t.pomodoro.skip : t.pomodoro.continue}
									</Button>
								</div>
							</div>
						);
					})()
				) : (
					<>
						<div
							className="relative mb-4 flex items-center justify-center gap-2"
							style={{ minHeight: circleSize }}
						>
							{showTimeAdjust && (
								<Button
									size="icon"
									variant="ghost"
									onClick={decreaseWorkDuration}
									disabled={pomodoro.status !== "idle"}
									className="w-8 h-8"
								>
									<Minus className="w-4 h-4" />
								</Button>
							)}

							<div
								className="relative"
								style={{ width: circleSize, height: circleSize }}
							>
								{pomodoro.status !== "idle" && (
									<svg
										className="w-full h-full transform -rotate-90"
										viewBox="0 0 100 100"
									>
										<circle
											cx="50"
											cy="50"
											r="45"
											fill="none"
											stroke="currentColor"
											strokeWidth="6"
											className="text-muted"
											opacity="0.2"
										/>
										<circle
											cx="50"
											cy="50"
											r="45"
											fill="none"
											stroke={getPhaseColor()}
											strokeWidth="6"
											strokeLinecap="round"
											strokeDasharray="283"
											strokeDashoffset={283 - (progress / 100) * 283}
											className="transition-all duration-1000"
										/>
									</svg>
								)}
								<div className="absolute inset-0 flex items-center justify-center">
									<span
										className={cn(
											"font-bold tracking-tighter font-mono",
											timeFontSize,
										)}
									>
										{formatTime(pomodoro.remainingSeconds)}
									</span>
								</div>
							</div>

							{showTimeAdjust && (
								<Button
									size="icon"
									variant="ghost"
									onClick={increaseWorkDuration}
									disabled={pomodoro.status !== "idle"}
									className="w-8 h-8"
								>
									<Plus className="w-4 h-4" />
								</Button>
							)}
						</div>

						<div className="flex items-center gap-1 flex-wrap justify-center">
							{pomodoro.status === "idle" && (
								<Button size={buttonSize} onClick={startTimer}>
									<Play
										className={cn(
											showButtonText && "mr-1",
											sizeMode === "compact" ? "w-3 h-3" : "w-4 h-4",
										)}
									/>
									{showButtonText && t.pomodoro.start}
								</Button>
							)}

							{pomodoro.status === "running" && (
								<Button
									size={buttonSize}
									variant="secondary"
									onClick={pauseTimer}
								>
									<Pause
										className={cn(
											showButtonText && "mr-1",
											sizeMode === "compact" ? "w-3 h-3" : "w-4 h-4",
										)}
									/>
									{showButtonText && t.pomodoro.pause}
								</Button>
							)}

							{pomodoro.status === "paused" && (
								<>
									<Button size={buttonSize} onClick={startTimer}>
										<Play
											className={cn(
												showButtonText && "mr-1",
												sizeMode === "compact" ? "w-3 h-3" : "w-4 h-4",
											)}
										/>
										{showButtonText && t.pomodoro.resume}
									</Button>
									<Button
										size={buttonSize}
										variant="ghost"
										onClick={handleReset}
									>
										<RotateCcw
											className={sizeMode === "compact" ? "w-3 h-3" : "w-4 h-4"}
										/>
									</Button>
								</>
							)}

							{showSkipButton && (
								<Button
									size={buttonSize}
									variant="outline"
									onClick={handleSkip}
								>
									<SkipForward
										className={cn(
											showButtonText && "mr-1",
											sizeMode === "compact" ? "w-3 h-3" : "w-4 h-4",
										)}
									/>
									{showButtonText && t.pomodoro.skip}
								</Button>
							)}
						</div>

						{showSessionInfo && (
							<div className="mt-3 text-xs text-muted-foreground flex items-center gap-1">
								<Timer className="w-3 h-3" />
								{t.pomodoro.completed}: {pomodoro.completedSessions}
							</div>
						)}
					</>
				)}
			</div>
		</div>
	);
}
