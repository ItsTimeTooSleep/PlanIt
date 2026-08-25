"use client";

import { Copy, Minus, Square, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useDesktopOnly, usePlatform } from "@/components/platform-provider";
import { useTranslations } from "@/lib/i18n";
import { useLanguage } from "@/lib/store";
import { cn } from "@/lib/utils";

interface WindowControlsProps {
	className?: string;
	showMinimize?: boolean;
	showMaximize?: boolean;
	showClose?: boolean;
	variant?: "default" | "compact";
}

/**
 * 窗口控制按钮组件
 * 仅在桌面端显示，提供最小化、最大化、关闭窗口功能
 * @param props.className - 自定义样式类名
 * @param props.showMinimize - 是否显示最小化按钮
 * @param props.showMaximize - 是否显示最大化按钮
 * @param props.showClose - 是否显示关闭按钮
 * @param props.variant - 按钮变体：'default' 标准尺寸，'compact' 紧凑尺寸
 */
export function WindowControls({
	className,
	showMinimize = true,
	showMaximize = true,
	showClose = true,
	variant = "default",
}: WindowControlsProps) {
	const shouldRender = useDesktopOnly();
	const { api, isReady, platform } = usePlatform();
	const lang = useLanguage();
	const t = useTranslations(lang);
	const [isMaximized, setIsMaximized] = useState(false);
	const [hoveredButton, setHoveredButton] = useState<string | null>(null);

	const isMac = platform === "macos";

	useEffect(() => {
		if (!api?.capabilities.supportsWindowControls) return;

		api
			.getWindowState()
			.then((state) => setIsMaximized(state.isMaximized ?? false))
			.catch(console.error);
	}, [api]);

	const handleMinimize = useCallback(async () => {
		if (!api) return;
		await api.minimizeWindow();
	}, [api]);

	const handleMaximize = useCallback(async () => {
		if (!api) return;
		await api.maximizeWindow();
		setIsMaximized((prev) => !prev);
	}, [api]);

	const handleClose = useCallback(async () => {
		if (!api) return;
		await api.closeWindow();
	}, [api]);

	if (!shouldRender || !isReady) {
		return null;
	}

	const buttonSize = variant === "compact" ? "w-10 h-8" : "w-12 h-9";
	const iconSize = variant === "compact" ? "h-3 w-3" : "h-3.5 w-3.5";
	const closeIconSize = variant === "compact" ? "h-3.5 w-3.5" : "h-4 w-4";

	const trafficLightSize = variant === "compact" ? "w-3 h-3" : "w-3.5 h-3.5";
	const trafficLightIconSize =
		variant === "compact" ? "w-1.5 h-1.5" : "w-2 h-2";

	if (isMac) {
		return (
			<div className={cn("flex items-center h-full gap-2", className)}>
				{showClose && (
					<button
						type="button"
						className={cn(
							trafficLightSize,
							"rounded-full transition-all duration-150 flex items-center justify-center",
							"bg-red-500 hover:bg-red-600 active:bg-red-700",
							"group",
						)}
						onClick={handleClose}
						onMouseEnter={() => setHoveredButton("close")}
						onMouseLeave={() => setHoveredButton(null)}
						aria-label={t.common.close}
					>
						{hoveredButton === "close" && (
							<svg
								className={cn(trafficLightIconSize, "text-red-900")}
								viewBox="0 0 12 12"
								fill="currentColor"
							>
								<path d="M5.5 5.5L2.5 2.5L1.5 3.5L4.5 6.5L1.5 9.5L2.5 10.5L5.5 7.5L8.5 10.5L9.5 9.5L6.5 6.5L9.5 3.5L8.5 2.5L5.5 5.5Z" />
							</svg>
						)}
					</button>
				)}
				{showMinimize && (
					<button
						type="button"
						className={cn(
							trafficLightSize,
							"rounded-full transition-all duration-150 flex items-center justify-center",
							"bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-700",
							"group",
						)}
						onClick={handleMinimize}
						onMouseEnter={() => setHoveredButton("minimize")}
						onMouseLeave={() => setHoveredButton(null)}
						aria-label={t.common.minimize}
					>
						{hoveredButton === "minimize" && (
							<svg
								className={cn(trafficLightIconSize, "text-yellow-900")}
								viewBox="0 0 12 12"
								fill="currentColor"
							>
								<rect x="1.5" y="5.5" width="9" height="1" rx="0.5" />
							</svg>
						)}
					</button>
				)}
				{showMaximize && (
					<button
						type="button"
						className={cn(
							trafficLightSize,
							"rounded-full transition-all duration-150 flex items-center justify-center",
							"bg-green-500 hover:bg-green-600 active:bg-green-700",
							"group",
						)}
						onClick={handleMaximize}
						onMouseEnter={() => setHoveredButton("maximize")}
						onMouseLeave={() => setHoveredButton(null)}
						aria-label={isMaximized ? t.common.restore : t.common.maximize}
					>
						{hoveredButton === "maximize" &&
							(isMaximized ? (
								<svg
									className={cn(trafficLightIconSize, "text-green-900")}
									viewBox="0 0 12 12"
									fill="currentColor"
								>
									<path
										d="M8 1.5V4.5H5M4 10.5V7.5H7M9 1.5H5.5C4.94772 1.5 4.5 1.94772 4.5 2.5V6M3 10.5H6.5C7.05228 10.5 7.5 10.0523 7.5 9.5V6"
										stroke="currentColor"
										strokeWidth="1.2"
										strokeLinecap="round"
										strokeLinejoin="round"
									/>
								</svg>
							) : (
								<svg
									className={cn(trafficLightIconSize, "text-green-900")}
									viewBox="0 0 12 12"
									fill="none"
									stroke="currentColor"
								>
									<rect
										x="2.5"
										y="2.5"
										width="7"
										height="7"
										rx="0.5"
										strokeWidth="1.2"
									/>
								</svg>
							))}
					</button>
				)}
			</div>
		);
	}

	return (
		<div className={cn("flex items-center h-full", className)}>
			{showMinimize && (
				<button
					type="button"
					className={cn(
						"flex items-center justify-center transition-all duration-150",
						buttonSize,
						"hover:bg-muted/60 active:bg-muted",
						"group",
					)}
					onClick={handleMinimize}
					aria-label={t.common.minimize}
				>
					<Minus
						className={cn(
							iconSize,
							"text-muted-foreground transition-colors duration-150",
							"group-hover:text-foreground",
						)}
					/>
				</button>
			)}
			{showMaximize && (
				<button
					type="button"
					className={cn(
						"flex items-center justify-center transition-all duration-150",
						buttonSize,
						"hover:bg-muted/60 active:bg-muted",
						"group",
					)}
					onClick={handleMaximize}
					aria-label={isMaximized ? t.common.restore : t.common.maximize}
				>
					{isMaximized ? (
						<Copy
							className={cn(
								iconSize,
								"text-muted-foreground transition-colors duration-150",
								"group-hover:text-foreground",
							)}
						/>
					) : (
						<Square
							className={cn(
								"h-3 w-3 text-muted-foreground transition-colors duration-150",
								"group-hover:text-foreground",
							)}
						/>
					)}
				</button>
			)}
			{showClose && (
				<button
					type="button"
					className={cn(
						"flex items-center justify-center transition-all duration-150",
						buttonSize,
						"hover:bg-destructive active:bg-destructive/90",
						"group",
					)}
					onClick={handleClose}
					aria-label={t.common.close}
				>
					<X
						className={cn(
							closeIconSize,
							"text-muted-foreground transition-colors duration-150",
							"group-hover:text-destructive-foreground",
						)}
					/>
				</button>
			)}
		</div>
	);
}
