"use client";

import { Copy, Minus, Square, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AppIcon } from "@/components/app-icon";
import { useDesktopOnly, usePlatform } from "@/components/platform-provider";
import { useLanguage } from "@/lib/store";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface TitleBarProps {
	className?: string;
}

/**
 * 自定义标题栏组件
 * 仅在桌面端显示，提供窗口拖拽区域和窗口控制按钮
 * @param props.className - 自定义样式类名
 */
export function TitleBar({ className }: TitleBarProps) {
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

	const handleDoubleClick = useCallback(async () => {
		if (!api) return;
		await api.maximizeWindow();
		setIsMaximized((prev) => !prev);
	}, [api]);

	if (!shouldRender || !isReady) {
		return null;
	}

	return (
		<div
			className={cn(
				"fixed top-0 left-0 right-0 z-50 h-9 flex items-center bg-gradient-to-b from-card to-card/95 border-b border-border/50 select-none",
				"backdrop-blur-sm shadow-sm",
				isMac ? "justify-start" : "justify-between",
				className,
			)}
			data-tauri-drag-region
			onDoubleClick={handleDoubleClick}
		>
			{isMac ? (
				<>
					<div className="flex items-center gap-2 px-4">
						<button
							type="button"
							className={cn(
								"w-3.5 h-3.5 rounded-full transition-all duration-150 flex items-center justify-center",
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
									className="w-2 h-2 text-red-900"
									viewBox="0 0 12 12"
									fill="currentColor"
								>
									<path d="M5.5 5.5L2.5 2.5L1.5 3.5L4.5 6.5L1.5 9.5L2.5 10.5L5.5 7.5L8.5 10.5L9.5 9.5L6.5 6.5L9.5 3.5L8.5 2.5L5.5 5.5Z" />
								</svg>
							)}
						</button>
						<button
							type="button"
							className={cn(
								"w-3.5 h-3.5 rounded-full transition-all duration-150 flex items-center justify-center",
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
									className="w-2 h-2 text-yellow-900"
									viewBox="0 0 12 12"
									fill="currentColor"
								>
									<rect x="1.5" y="5.5" width="9" height="1" rx="0.5" />
								</svg>
							)}
						</button>
						<button
							type="button"
							className={cn(
								"w-3.5 h-3.5 rounded-full transition-all duration-150 flex items-center justify-center",
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
										className="w-2 h-2 text-green-900"
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
										className="w-2 h-2 text-green-900"
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
					</div>
					<div
						className="flex-1 flex items-center justify-center"
						data-tauri-drag-region
					>
						<span className="text-xs font-semibold text-foreground/90 tracking-wide">
							PlanIt
						</span>
					</div>
				</>
			) : (
				<>
					<div
						className="flex items-center gap-2.5 px-3"
						data-tauri-drag-region
					>
						<div className="relative">
							<AppIcon size={18} variant="default" />
						</div>
						<span className="text-xs font-semibold text-foreground/90 tracking-wide">
							PlanIt
						</span>
					</div>

					<div className="flex items-center h-full">
						<button
							type="button"
							className={cn(
								"h-full w-12 flex items-center justify-center transition-all duration-150",
								"hover:bg-muted/60 active:bg-muted",
								"group relative",
							)}
							onClick={handleMinimize}
							onMouseEnter={() => setHoveredButton("minimize")}
							onMouseLeave={() => setHoveredButton(null)}
							aria-label={t.common.minimize}
						>
							<Minus
								className={cn(
									"h-3.5 w-3.5 text-muted-foreground transition-colors duration-150",
									"group-hover:text-foreground",
								)}
							/>
						</button>
						<button
							type="button"
							className={cn(
								"h-full w-12 flex items-center justify-center transition-all duration-150",
								"hover:bg-muted/60 active:bg-muted",
								"group relative",
							)}
							onClick={handleMaximize}
							onMouseEnter={() => setHoveredButton("maximize")}
							onMouseLeave={() => setHoveredButton(null)}
							aria-label={isMaximized ? t.common.restore : t.common.maximize}
						>
							{isMaximized ? (
								<Copy
									className={cn(
										"h-3.5 w-3.5 text-muted-foreground transition-colors duration-150",
										"group-hover:text-foreground",
									)}
								/>
							) : (
								<Square
									className={cn(
										"h-3 w-3 text-muted-foreground transition-colors duration-150",
										"group-hover:text-foreground group-hover:scale-110",
									)}
								/>
							)}
						</button>
						<button
							type="button"
							className={cn(
								"h-full w-12 flex items-center justify-center transition-all duration-150",
								"hover:bg-destructive active:bg-destructive/90",
								"group relative",
							)}
							onClick={handleClose}
							onMouseEnter={() => setHoveredButton("close")}
							onMouseLeave={() => setHoveredButton(null)}
							aria-label={t.common.close}
						>
							<X
								className={cn(
									"h-4 w-4 text-muted-foreground transition-colors duration-150",
									"group-hover:text-destructive-foreground",
								)}
							/>
						</button>
					</div>
				</>
			)}
		</div>
	);
}
