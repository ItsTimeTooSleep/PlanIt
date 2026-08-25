"use client";

import { addDays, format, isToday, startOfWeek } from "date-fns";
import { Edit3, StickyNote } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_TAG_COLOR } from "@/lib/colors";
import { useTranslations } from "@/lib/i18n";
import { DueTasksBadge } from "@/components/calendar/due-tasks-badge";
import { playSound } from "@/lib/sound";
import { useLanguage, useStore } from "@/lib/store";
import {
	calculateTaskLayoutsGrouped,
	type TaskLayoutInfo,
} from "@/lib/task-layout";
import {
	minutesToTime,
	sortTasksByTime,
	timeToMinutes,
} from "@/lib/task-utils";
import type { DateNote, Tag, Task } from "@/lib/types";
import { cn } from "@/lib/utils";

const TIME_COL_W = 44; // px for time label column

interface WeekViewProps {
	referenceDate: Date;
	tasks: Task[];
	tags: Tag[];
	dateNotes: DateNote[];
	onOpenTask: (task: Task) => void;
	onCreateTask: (date: string, startTime?: string, endTime?: string) => void;
	onOpenDateNote: (date: string) => void;
	selectMode: boolean;
	selectedIds: Set<string>;
	onToggleSelect: (id: string) => void;
	onEnterSelectMode: () => void;
	calendarSettings: {
		dayStartTime: number;
		dayEndTime: number;
		hourDivisions: number;
		hourHeight: number;
		timeSnap: number;
		snapEnabled: boolean;
		snapThreshold: number;
	};
	onSelectMultiple?: (ids: string[]) => void;
	onDeleteTask?: (task: Task) => void;
}

// ── Ghost block shown during drag ──────────────────────────────────────────
interface GhostBlock {
	dateStr: string;
	startMin: number;
	endMin: number;
}

// ── Drag state ─────────────────────────────────────────────────────────────
type DragMode = "create" | "move" | "resize-top" | "resize-bottom";

interface DragState {
	mode: DragMode;
	taskId?: string;
	colIndex: number;
	startY: number;
	startMin: number;
	origStartMin?: number;
	origEndMin?: number;
	origColIndex?: number;
	lastY: number;
	lastTime: number;
	velocity: number;
	/** 上一次 pointermove 是否处于磁吸锁定状态 */
	snapped?: boolean;
	/** 本次拖拽会话中从磁吸状态扯离的次数 */
	leaveSnapCount?: number;
	/** 本次拖拽会话内临时抑制磁吸 */
	snappingSuppressed?: boolean;
}

/** 连续扯离磁吸线达到该次数时，判定用户在做微调，临时关闭本次拖拽的磁吸 */
const SNAP_LEAVE_THRESHOLD = 2;

const SHORT_DAYS_ZH = ["日", "一", "二", "三", "四", "五", "六"];
const SHORT_DAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function WeekView({
	referenceDate,
	tasks,
	tags,
	dateNotes,
	onOpenTask,
	onCreateTask,
	onOpenDateNote,
	selectMode,
	selectedIds,
	onToggleSelect,
	onEnterSelectMode,
	calendarSettings,
	onSelectMultiple,
	onDeleteTask,
}: WeekViewProps) {
	const lang = useLanguage();
	const _t = useTranslations(lang);
	const { updateTask, state } = useStore();
	const scrollRef = useRef<HTMLDivElement>(null);
	const gridRef = useRef<HTMLDivElement>(null);
	const dayLabels = lang === "zh" ? SHORT_DAYS_ZH : SHORT_DAYS_EN;

	const weekStart = startOfWeek(referenceDate, { weekStartsOn: 0 });
	const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

	const {
		dayStartTime,
		dayEndTime,
		hourDivisions,
		hourHeight,
		timeSnap,
		snapEnabled,
		snapThreshold,
	} = calendarSettings;
	const visibleHours = dayEndTime - dayStartTime;
	const totalHeight = visibleHours * hourHeight;
	const TOP_PADDING = 20;

	const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
	const [gridWidth, setGridWidth] = useState(0);
	const [currentTime, setCurrentTime] = useState(new Date());

	useEffect(() => {
		const intervalId = setInterval(() => setCurrentTime(new Date()), 60000);
		return () => clearInterval(intervalId);
	}, []);

	useEffect(() => {
		const handleVisibilityChange = () => {
			if (!document.hidden) {
				setCurrentTime(new Date());
			}
		};

		document.addEventListener("visibilitychange", handleVisibilityChange);
		return () =>
			document.removeEventListener("visibilitychange", handleVisibilityChange);
	}, []);

	useEffect(() => {
		const el = gridRef.current;
		if (!el) return;
		const observer = new ResizeObserver(() => {
			setGridWidth(el.clientWidth ?? 0);
		});
		observer.observe(el);
		setGridWidth(el.clientWidth ?? 0);
		return () => observer.disconnect();
	}, []);

	/**
	 * 键盘事件处理：Delete键删除选中的任务
	 * 注意：当焦点在输入元素（input、textarea等）上时，不触发删除操作
	 */
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Delete" || e.key === "Backspace") {
				const activeElement = document.activeElement;
				const isInputElement =
					activeElement instanceof HTMLInputElement ||
					activeElement instanceof HTMLTextAreaElement ||
					activeElement instanceof HTMLSelectElement ||
					(activeElement instanceof HTMLElement &&
						activeElement.isContentEditable);

				if (isInputElement) {
					return;
				}

				if (activeTaskId && onDeleteTask) {
					const task = tasks.find((t) => t.id === activeTaskId);
					if (task) {
						onDeleteTask(task);
					}
				}
			}
			if (e.key === "Escape") {
				setActiveTaskId(null);
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [activeTaskId, tasks, onDeleteTask]);

	// Scroll to current time on mount
	useEffect(() => {
		const el = scrollRef.current;
		if (!el) return;
		const now = new Date();
		const minutes = now.getHours() * 60 + now.getMinutes();
		const startMinutes = dayStartTime * 60;
		if (minutes >= startMinutes && minutes <= dayEndTime * 60) {
			const scrollTop =
				((minutes - startMinutes) / 60) * hourHeight - el.clientHeight / 3;
			el.scrollTo({ top: Math.max(0, scrollTop), behavior: "smooth" });
		}
	}, [dayStartTime, dayEndTime, hourHeight]);

	const todayStr = format(currentTime, "yyyy-MM-dd");

	// ── Drag state ────────────────────────────────────────────────────────────
	const dragRef = useRef<DragState | null>(null);
	const [ghost, setGhost] = useState<GhostBlock | null>(null);
	const [snapLine, setSnapLine] = useState<{
		y: number;
		colIndex: number;
	} | null>(null);
	const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);

	// ── Box select state ──────────────────────────────────────────────────────
	const boxSelectRef = useRef<{
		isSelecting: boolean;
		startX: number;
		startY: number;
		currentX: number;
		currentY: number;
	}>({ isSelecting: false, startX: 0, startY: 0, currentX: 0, currentY: 0 });
	const [boxSelectRect, setBoxSelectRect] = useState<{
		x: number;
		y: number;
		w: number;
		h: number;
	} | null>(null);

	const getAllVisibleTasks = useCallback(() => {
		const allTasks: {
			task: Task;
			x: number;
			y: number;
			w: number;
			h: number;
			colIndex: number;
		}[] = [];
		days.forEach((day, colIndex) => {
			const dateStr = format(day, "yyyy-MM-dd");
			
			// 处理普通任务
			const normalTasks = tasks.filter((t) => t.date === dateStr && !t.isAllDay);
			normalTasks.forEach((task) => {
				if (task.startTime && task.endTime) {
					const startMin = timeToMinutes(task.startTime);
					const endMin = timeToMinutes(task.endTime);
					const top = ((startMin - dayStartTime * 60) / 60) * hourHeight;
					const height = ((endMin - startMin) / 60) * hourHeight;
					const colWidth = gridRef.current
						? (gridRef.current.clientWidth - TIME_COL_W) / 7
						: 0;
					allTasks.push({
						task,
						x: TIME_COL_W + colIndex * colWidth,
						y: top,
						w: colWidth,
						h: height,
						colIndex,
					});
				}
			});
			
			// 处理多步骤任务的步骤
			tasks.forEach((task) => {
				if (task.isMultiStep && task.steps) {
					task.steps.forEach((step) => {
						if (step.date === dateStr && step.startTime && step.endTime) {
							const stepTask: Task = {
								...task,
								id: `${task.id}-step-${step.id}`,
								title: `${task.title} - ${step.title}`,
								date: step.date,
								startTime: step.startTime,
								endTime: step.endTime,
								status: step.status,
							};
							const startMin = timeToMinutes(step.startTime);
							const endMin = timeToMinutes(step.endTime);
							const top = ((startMin - dayStartTime * 60) / 60) * hourHeight;
							const height = ((endMin - startMin) / 60) * hourHeight;
							const colWidth = gridRef.current
								? (gridRef.current.clientWidth - TIME_COL_W) / 7
								: 0;
							allTasks.push({
								task: stepTask,
								x: TIME_COL_W + colIndex * colWidth,
								y: top,
								w: colWidth,
								h: height,
								colIndex,
							});
						}
					});
				}
			});
		});
		return allTasks;
	}, [days, tasks, dayStartTime, hourHeight]);

	const tasksInBox = useCallback(
		(x1: number, y1: number, x2: number, y2: number) => {
			const minX = Math.min(x1, x2);
			const maxX = Math.max(x1, x2);
			const minY = Math.min(y1, y2);
			const maxY = Math.max(y1, y2);

			const allVisibleTasks = getAllVisibleTasks();
			const selectedIds: Set<string> = new Set();
			
			allVisibleTasks
				.filter(({ x, y, w, h }) => {
					const taskRight = x + w;
					const taskBottom = y + h;
					return !(
						taskRight < minX ||
						x > maxX ||
						taskBottom < minY ||
						y > maxY
					);
				})
				.forEach(({ task }) => {
					const isStepTask = task.id.includes("-step-");
					const originalTaskId = isStepTask
						? task.id.split("-step-")[0]
						: task.id;
					selectedIds.add(originalTaskId);
				});
				
			return Array.from(selectedIds);
		},
		[getAllVisibleTasks],
	);

	// Helpers: convert pointer position → minutes + column
	const getMinuteFromY = useCallback(
		(y: number) => {
			const raw = dayStartTime * 60 + (y / hourHeight) * 60;
			const maxMinutes = dayEndTime === 24 ? 24 * 60 : dayEndTime * 60;
			return Math.max(
				dayStartTime * 60,
				Math.min(Math.round(raw / timeSnap) * timeSnap, maxMinutes),
			);
		},
		[dayStartTime, dayEndTime, hourHeight, timeSnap],
	);

	const getColFromX = useCallback((x: number): number => {
		const grid = gridRef.current;
		if (!grid) return 0;
		const colW = (grid.clientWidth - TIME_COL_W) / 7;
		const col = Math.floor((x - TIME_COL_W) / colW);
		return Math.max(0, Math.min(col, 6));
	}, []);

	const getRelativePos = useCallback((e: PointerEvent) => {
		const grid = gridRef.current;
		if (!grid) return { x: 0, y: 0 };
		const rect = grid.getBoundingClientRect();
		return {
			x: e.clientX - rect.left,
			y: e.clientY - rect.top,
		};
	}, []);

	/**
	 * 获取指定列中所有任务的边缘时间点（开始和结束时间）
	 * @param colIndex - 列索引
	 * @param excludeTaskId - 要排除的任务ID（当前正在拖拽的任务）
	 * @returns 边缘时间点数组（分钟数）
	 */
	const getSnapEdges = useCallback(
		(colIndex: number, excludeTaskId?: string): number[] => {
			const dateStr = format(days[colIndex], "yyyy-MM-dd");
			const dayTasks = tasks.filter(
				(t) => t.date === dateStr && !t.isAllDay && t.id !== excludeTaskId,
			);
			const edges: number[] = [];
			dayTasks.forEach((task) => {
				if (task.startTime) edges.push(timeToMinutes(task.startTime));
				if (task.endTime) edges.push(timeToMinutes(task.endTime));
			});

			const todayStrLocal = format(currentTime, "yyyy-MM-dd");
			if (dateStr === todayStrLocal) {
				const nowMin = currentTime.getHours() * 60 + currentTime.getMinutes();
				edges.push(nowMin);
			}

			return edges;
		},
		[days, tasks, currentTime],
	);

	/**
	 * 智能磁吸计算
	 * @param targetMin - 目标分钟数
	 * @param colIndex - 列索引
	 * @param velocity - 当前拖拽速度（像素/毫秒）
	 * @param excludeTaskId - 要排除的任务ID
	 * @returns 磁吸后的分钟数和磁吸线位置
	 */
	const calculateSnap = useCallback(
		(
			targetMin: number,
			colIndex: number,
			velocity: number,
			excludeTaskId?: string,
		): { snappedMin: number; snapLineY: number | null } => {
			// 会话内用户反复扯离磁吸线，判定为微调意图，临时抑制磁吸
			if (!snapEnabled || dragRef.current?.snappingSuppressed) {
				return { snappedMin: targetMin, snapLineY: null };
			}

			const edges = getSnapEdges(colIndex, excludeTaskId);
			if (edges.length === 0) {
				return { snappedMin: targetMin, snapLineY: null };
			}

			const velocityThreshold = 0.5;
			if (Math.abs(velocity) > velocityThreshold) {
				return { snappedMin: targetMin, snapLineY: null };
			}

			let closestEdge: number | null = null;
			let minDistance = Infinity;

			for (const edge of edges) {
				const distance = Math.abs(targetMin - edge);
				if (distance <= snapThreshold && distance < minDistance) {
					minDistance = distance;
					closestEdge = edge;
				}
			}

			const maxMinutes = dayEndTime === 24 ? 24 * 60 : dayEndTime * 60;
			if (closestEdge !== null && closestEdge <= maxMinutes) {
				const snapLineY =
					TOP_PADDING + ((closestEdge - dayStartTime * 60) / 60) * hourHeight;
				return { snappedMin: closestEdge, snapLineY };
			}

			return { snappedMin: targetMin, snapLineY: null };
		},
		[
			snapEnabled,
			snapThreshold,
			getSnapEdges,
			dayStartTime,
			dayEndTime,
			hourHeight,
		],
	);

	// ── Pointer handlers ──────────────────────────────────────────────────────

	const onPointerMove = useCallback(
		(e: PointerEvent) => {
			const drag = dragRef.current;
			if (!drag) return;
			e.preventDefault();

			const { x, y } = getRelativePos(e);
			const now = Date.now();
			const dt = now - drag.lastTime;
			const dy = y - drag.lastY;
			const velocity = dt > 0 ? Math.abs(dy / dt) : 0;

			drag.lastY = y;
			drag.lastTime = now;
			drag.velocity = velocity;

			const adjustedY = y - TOP_PADDING;
			const currentMin = getMinuteFromY(Math.max(0, adjustedY));
			const colIndex = getColFromX(x);
			const dateStr = format(days[colIndex], "yyyy-MM-dd");
			const maxMinutes = dayEndTime === 24 ? 24 * 60 : dayEndTime * 60;

			// 本次移动是否产生了磁吸
			let snappedThisMove = false;

			if (drag.mode === "create") {
				const rawStartMin = Math.min(drag.startMin, currentMin);
				const rawEndMin = Math.max(drag.startMin, currentMin) + timeSnap;

				const { snappedMin: snappedStart, snapLineY: snapStartLine } =
					calculateSnap(rawStartMin, colIndex, velocity);
				const { snappedMin: snappedEnd, snapLineY: snapEndLine } =
					calculateSnap(rawEndMin, colIndex, velocity);

				const startMin =
					snappedStart !== rawStartMin ? snappedStart : rawStartMin;
				const endMin = Math.min(
					snappedEnd !== rawEndMin ? snappedEnd : rawEndMin,
					maxMinutes,
				);

				setGhost({ dateStr, startMin, endMin });

				if (snapStartLine !== null) {
					snappedThisMove = true;
					setSnapLine({ y: snapStartLine, colIndex });
				} else if (snapEndLine !== null && snappedEnd <= maxMinutes) {
					snappedThisMove = true;
					setSnapLine({ y: snapEndLine, colIndex });
				} else {
					setSnapLine(null);
				}
			} else if (
				drag.mode === "move" &&
				drag.origStartMin !== undefined &&
				drag.origEndMin !== undefined
			) {
				const delta = currentMin - drag.startMin;
				const dur = drag.origEndMin - drag.origStartMin;
				const rawNewStart = Math.max(
					dayStartTime * 60,
					Math.min(drag.origStartMin + delta, maxMinutes - dur),
				);

				const { snappedMin: snappedStart, snapLineY } = calculateSnap(
					rawNewStart,
					colIndex,
					velocity,
					drag.taskId,
				);
				const newStart = Math.min(snappedStart, maxMinutes - dur);

				setGhost({ dateStr, startMin: newStart, endMin: newStart + dur });

				if (snapLineY !== null && snappedStart <= maxMinutes - dur) {
					snappedThisMove = true;
					setSnapLine({ y: snapLineY, colIndex });
				} else {
					setSnapLine(null);
				}
			} else if (drag.mode === "resize-top" && drag.origEndMin !== undefined) {
				const rawNewStart = Math.max(
					dayStartTime * 60,
					Math.min(currentMin, drag.origEndMin - timeSnap),
				);

				const { snappedMin: snappedStart, snapLineY } = calculateSnap(
					rawNewStart,
					drag.colIndex,
					velocity,
					drag.taskId,
				);
				const newStart = snappedStart;

				setGhost({
					dateStr: format(days[drag.colIndex], "yyyy-MM-dd"),
					startMin: newStart,
					endMin: drag.origEndMin,
				});

				if (snapLineY !== null) {
					snappedThisMove = true;
					setSnapLine({ y: snapLineY, colIndex: drag.colIndex });
				} else {
					setSnapLine(null);
				}
			} else if (
				drag.mode === "resize-bottom" &&
				drag.origStartMin !== undefined
			) {
				const rawNewEnd = Math.min(
					maxMinutes,
					Math.max(currentMin, drag.origStartMin + timeSnap),
				);

				const { snappedMin: snappedEnd, snapLineY } = calculateSnap(
					rawNewEnd,
					drag.colIndex,
					velocity,
					drag.taskId,
				);
				const newEnd = Math.min(snappedEnd, maxMinutes);

				setGhost({
					dateStr: format(days[drag.colIndex], "yyyy-MM-dd"),
					startMin: drag.origStartMin,
					endMin: newEnd,
				});

				if (snapLineY !== null && snappedEnd <= maxMinutes) {
					snappedThisMove = true;
					setSnapLine({ y: snapLineY, colIndex: drag.colIndex });
				} else {
					setSnapLine(null);
				}
			}

			// 会话状态机：记录「磁吸 -> 扯离」的反复，判定用户在做微调则临时抑制磁吸
			if (drag.snappingSuppressed) {
				drag.snapped = snappedThisMove;
				return;
			}
			if (drag.snapped && !snappedThisMove) {
				drag.leaveSnapCount = (drag.leaveSnapCount ?? 0) + 1;
				if (drag.leaveSnapCount >= SNAP_LEAVE_THRESHOLD) {
					drag.snappingSuppressed = true;
					setSnapLine(null);
				}
			}
			drag.snapped = snappedThisMove;
		},
		[
			days,
			getColFromX,
			getMinuteFromY,
			getRelativePos,
			timeSnap,
			calculateSnap,
			dayStartTime,
			dayEndTime,
		],
	);

	const onPointerUp = useCallback(
		(e: PointerEvent) => {
			// Handle box select first
			const boxSelect = boxSelectRef.current;
			if (boxSelect.isSelecting) {
				boxSelect.isSelecting = false;
				const ids = tasksInBox(
					boxSelect.startX,
					boxSelect.startY,
					boxSelect.currentX,
					boxSelect.currentY,
				);
				if (onSelectMultiple) {
					onSelectMultiple(ids);
				} else {
					ids.forEach((id) => onToggleSelect(id));
				}
				setBoxSelectRect(null);
				(e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
				return;
			}

			// Handle drag
			const drag = dragRef.current;
			if (!drag) return;
			dragRef.current = null;
			setSnapLine(null);
			setDraggingTaskId(null);
			(e.target as HTMLElement).releasePointerCapture?.(e.pointerId);

			if (!ghost) {
				setGhost(null);
				return;
			}

			const { startMin, endMin, dateStr } = ghost;
			setGhost(null);

			// 播放拖拽音效
			if (state.settings.sound.enabled && state.settings.sound.playOnTaskDrag) {
				playSound("taskDrag");
			}

			if (drag.mode === "create") {
				if (endMin - startMin < timeSnap) return;
				onCreateTask(dateStr, minutesToTime(startMin), minutesToTime(endMin));
			} else if (drag.taskId) {
				const isStepTask = drag.taskId.includes("-step-");
				
				if (isStepTask) {
					// 处理多步骤任务的步骤
					const [originalTaskId, stepId] = drag.taskId.split("-step-");
					const originalTask = tasks.find((t) => t.id === originalTaskId);
					
					if (originalTask && originalTask.steps) {
						const updatedSteps = originalTask.steps.map((s) => {
							if (s.id === stepId) {
								return {
									...s,
									date: dateStr,
									startTime: minutesToTime(startMin),
									endTime: minutesToTime(endMin),
								};
							}
							return s;
						});
						
						updateTask(originalTaskId, { steps: updatedSteps as any });
					}
				} else {
					// 普通任务
					if (drag.mode === "move") {
						updateTask(drag.taskId, {
							date: dateStr,
							startTime: minutesToTime(startMin),
							endTime: minutesToTime(endMin),
						});
					} else if (
						drag.mode === "resize-top" ||
						drag.mode === "resize-bottom"
					) {
						updateTask(drag.taskId, {
							startTime: minutesToTime(startMin),
							endTime: minutesToTime(endMin),
						});
					}
				}
			}
		},
		[
			ghost,
			onCreateTask,
			updateTask,
			tasksInBox,
			onToggleSelect,
			onSelectMultiple,
			timeSnap,
			state.settings.sound,
			tasks,
		],
	);

	const onBoxSelectPointerMove = useCallback((e: PointerEvent) => {
		const boxSelect = boxSelectRef.current;
		if (!boxSelect.isSelecting) return;

		const grid = gridRef.current;
		if (!grid) return;
		const rect = grid.getBoundingClientRect();

		boxSelect.currentX = e.clientX - rect.left;
		boxSelect.currentY = e.clientY - rect.top;

		const x = Math.min(boxSelect.startX, boxSelect.currentX);
		const y = Math.min(boxSelect.startY, boxSelect.currentY);
		const w = Math.abs(boxSelect.currentX - boxSelect.startX);
		const h = Math.abs(boxSelect.currentY - boxSelect.startY);
		setBoxSelectRect({ x, y, w, h });
	}, []);

	const onContextMenu = useCallback((e: MouseEvent) => {
		if (dragRef.current) {
			e.preventDefault();
			dragRef.current = null;
			setGhost(null);
			setSnapLine(null);
			setDraggingTaskId(null);
			const boxSelect = boxSelectRef.current;
			if (boxSelect.isSelecting) {
				boxSelect.isSelecting = false;
				setBoxSelectRect(null);
			}
		}
	}, []);

	useEffect(() => {
		window.addEventListener("pointermove", onPointerMove, { passive: false });
		window.addEventListener("pointermove", onBoxSelectPointerMove, {
			passive: false,
		});
		window.addEventListener("pointerup", onPointerUp);
		window.addEventListener("contextmenu", onContextMenu);
		return () => {
			window.removeEventListener("pointermove", onPointerMove);
			window.removeEventListener("pointermove", onBoxSelectPointerMove);
			window.removeEventListener("pointerup", onPointerUp);
			window.removeEventListener("contextmenu", onContextMenu);
		};
	}, [onPointerMove, onBoxSelectPointerMove, onPointerUp, onContextMenu]);

	// ── Render ────────────────────────────────────────────────────────────────

	return (
		<div className="flex flex-col h-full bg-background">
			{/* Day header row - Enhanced */}
			<div className="flex shrink-0 border-b border-border bg-card">
				<div style={{ width: TIME_COL_W }} className="shrink-0" />
				{days.map((day) => {
					const dateStr = format(day, "yyyy-MM-dd");
					const _allDayForDay = tasks.filter(
						(t) => t.date === dateStr && t.isAllDay,
					);
					const dateNote = dateNotes.find((n) => n.date === dateStr);
					const _isToday = isToday(day);
					return (
						<div
							key={dateStr}
							className="flex-1 border-l border-border min-w-0 px-0.5 py-2"
						>
							<div className="flex flex-col items-center">
								<div className="flex items-center justify-center w-full px-1 gap-1.5 relative">
									<button
										className={cn(
											"flex flex-col items-center justify-center px-2 py-1.5 rounded-lg transition-all cursor-pointer shrink-0 min-w-[60px]",
											_isToday
												? "bg-gradient-to-br from-primary/15 to-primary/5 text-primary font-medium border border-primary/20"
												: "text-muted-foreground hover:bg-muted/50",
										)}
										onClick={() => onOpenDateNote(dateStr)}
										title={
											dateNote
												? dateNote.content
												: lang === "zh"
													? "添加日期备注"
													: "Add date note"
										}
									>
										<span
											className={cn(
												"text-[10px] font-medium",
												_isToday
													? "text-primary/80"
													: "text-muted-foreground/70",
											)}
										>
											{dayLabels[day.getDay()]}
										</span>
										<span
											className={cn(
												"text-base font-semibold leading-tight",
												_isToday ? "text-primary" : "text-foreground",
											)}
										>
											{format(day, "d")}
										</span>
									</button>
									<DueTasksBadge
										dateStr={dateStr}
										tasks={tasks}
										tags={tags}
										onOpenTask={onOpenTask}
										translations={{
											overdue: _t.calendar.overdue,
											dueSoon: _t.calendar.dueSoon,
										}}
									/>
								</div>
								{dateNote && (
									<div
										className="flex items-center justify-center mt-0.5"
										title={dateNote.content}
									>
										<StickyNote className="w-3 h-3 text-warning" />
									</div>
								)}
							</div>
							{dateNote && (
								<div
									className="text-[9px] text-muted-foreground leading-tight mb-0.5 cursor-pointer px-1 overflow-hidden"
									onClick={() => onOpenDateNote(dateStr)}
									style={{
										display: "-webkit-box",
										WebkitLineClamp: 2,
										WebkitBoxOrient: "vertical",
										maxHeight: "2.4em",
									}}
								>
									{dateNote.content}
								</div>
							)}
							{/* 处理全天任务和多步骤任务的全天步骤 */}
							{(() => {
								const allDayTasks: Task[] = [];
								tasks.forEach((task) => {
									if (task.isMultiStep && task.steps) {
										// 多步骤任务的全天步骤
										task.steps.forEach((step) => {
											if (
												step.date === dateStr &&
												!step.startTime &&
												!step.endTime
											) {
												const stepTask: Task = {
													...task,
													id: `${task.id}-step-${step.id}`,
													title: `${task.title} - ${step.title}`,
													date: step.date,
													status: step.status,
												};
												allDayTasks.push(stepTask);
											}
										});
									} else {
										// 普通全天任务
										if (task.date === dateStr && task.isAllDay) {
											allDayTasks.push(task);
										}
									}
								});

								return allDayTasks.slice(0, 2).map((task) => {
									const isStepTask = task.id.includes("-step-");
									const color =
										tags.find((tg) => task.tagIds[0] === tg.id)?.color ??
										DEFAULT_TAG_COLOR;
									const isCompleted = task.status === "completed";
									const isSkipped = task.status === "skipped";
									const isDimmed = isCompleted || isSkipped;
									const originalTaskId = isStepTask
										? task.id.split("-step-")[0]
										: task.id;
									const originalTask = tasks.find(
										(t) => t.id === originalTaskId,
									);
									const taskToOpen = originalTask || task;

									return (
										<div
											key={task.id}
											className="text-[9px] rounded-sm px-1 mb-0.5 cursor-pointer font-medium transition-all group min-w-0"
											style={{
												backgroundColor: color + (isDimmed ? "18" : "28"),
												color,
												opacity: isDimmed ? 0.6 : 1,
												overflow: "hidden",
												textOverflow: "ellipsis",
												whiteSpace: "nowrap",
											}}
											onClick={() => onOpenTask(taskToOpen)}
										>
											<span className={cn(isSkipped && "line-through")}>
												{task.title}
											</span>
										</div>
									);
								});
							})()}
							{(() => {
								let count = 0;
								tasks.forEach((task) => {
									if (task.isMultiStep && task.steps) {
										count += task.steps.filter(
											(s) => s.date === dateStr && !s.startTime && !s.endTime,
										).length;
									} else if (task.date === dateStr && task.isAllDay) {
										count++;
									}
								});
								return count > 2 ? (
									<div className="text-[9px] text-muted-foreground px-1">
										+{count - 2}
									</div>
								) : null;
							})()}
						</div>
					);
				})}
				{/* Scrollbar placeholder to maintain alignment */}
				<div
					className="shrink-0"
					style={{ width: "var(--scrollbar-width, 14px)" }}
				/>
			</div>

			{/* Scrollable grid */}
			<div ref={scrollRef} className="flex-1 overflow-y-auto">
				<div
					ref={gridRef}
					className="flex select-none relative"
					style={{ height: totalHeight + TOP_PADDING }}
				>
					{/* Time labels */}
					<div style={{ width: TIME_COL_W }} className="shrink-0 relative">
						{Array.from({ length: visibleHours }, (_, i) => {
							const h = dayStartTime + i;
							return (
								<div
									key={h}
									className="absolute right-2 text-[10px] text-muted-foreground -translate-y-1/2 tabular-nums"
									style={{ top: TOP_PADDING + i * hourHeight }}
								>
									{String(h).padStart(2, "0")}
								</div>
							);
						})}
					</div>

					{/* Day columns */}
					{days.map((day, colIndex) => {
						const dateStr = format(day, "yyyy-MM-dd");

						// 处理任务和多步骤任务
						const dayTasks: Task[] = [];
						tasks.forEach((task) => {
							if (task.isMultiStep && task.steps) {
								// 多步骤任务：将每个步骤转换为虚拟任务
								task.steps.forEach((step) => {
									if (step.date === dateStr) {
										// 创建一个虚拟任务代表步骤
										const stepTask: Task = {
											...task,
											id: `${task.id}-step-${step.id}`,
											title: `${task.title} - ${step.title}`,
											date: step.date,
											startTime: step.startTime,
											endTime: step.endTime,
											status: step.status,
										};
										dayTasks.push(stepTask);
									}
								});
							} else {
								// 普通任务
								if (task.date === dateStr && !task.isAllDay) {
									dayTasks.push(task);
								}
							}
						});

						const sortedDayTasks = sortTasksByTime(dayTasks);
						const isNowDay = dateStr === todayStr;
						const nowMin = isNowDay
							? currentTime.getHours() * 60 + currentTime.getMinutes()
							: null;
						const ghostHere = ghost?.dateStr === dateStr ? ghost : null;

						const taskLayouts = calculateTaskLayoutsGrouped(
							sortedDayTasks,
							hourHeight,
							dayStartTime * 60,
						);

						return (
							<div
								key={dateStr}
								className={cn(
									"flex-1 border-l border-border relative",
									isToday(day) && "bg-primary/[0.015]",
								)}
								style={{ height: totalHeight + TOP_PADDING }}
								// Drag to create or box select
								onPointerDown={(e) => {
									if (e.button !== 0) return;
									if (selectMode) {
										if ((e.target as HTMLElement).closest("[data-week-block]"))
											return;
										e.currentTarget.setPointerCapture(e.pointerId);
										const { x, y } = getRelativePos(e.nativeEvent);
										boxSelectRef.current = {
											isSelecting: true,
											startX: x,
											startY: y,
											currentX: x,
											currentY: y,
										};
										setBoxSelectRect({ x, y, w: 0, h: 0 });
									} else {
										if ((e.target as HTMLElement).closest("[data-week-block]"))
											return;
										e.currentTarget.setPointerCapture(e.pointerId);
										const { y } = getRelativePos(e.nativeEvent);
										const adjustedY = y - TOP_PADDING;
										const startMin = getMinuteFromY(Math.max(0, adjustedY));
										const now = Date.now();
										dragRef.current = {
											mode: "create",
											colIndex,
											startY: y,
											startMin,
											lastY: y,
											lastTime: now,
											velocity: 0,
											snapped: false,
											leaveSnapCount: 0,
										};
										setGhost({
											dateStr,
											startMin,
											endMin: startMin + timeSnap,
										});
									}
								}}
							>
								{/* Hour lines */}
								{Array.from({ length: visibleHours }, (_, i) => {
									const h = dayStartTime + i;
									return (
										<div
											key={h}
											className="absolute left-0 right-0 border-t border-border pointer-events-none"
											style={{ top: TOP_PADDING + i * hourHeight }}
										/>
									);
								})}
								{/* Divider lines */}
								{Array.from(
									{ length: visibleHours * (hourDivisions - 1) },
									(_, i) => {
										const divisionHeight = hourHeight / hourDivisions;
										return (
											<div
												key={`div-${i}`}
												className="absolute left-0 right-0 border-t border-border/40 pointer-events-none"
												style={{
													top:
														TOP_PADDING +
														((i + 1) % hourDivisions) * divisionHeight +
														Math.floor((i + 1) / hourDivisions) * hourHeight,
												}}
											/>
										);
									},
								)}

								{/* Now indicator */}
								{isNowDay &&
									nowMin !== null &&
									nowMin >= dayStartTime * 60 &&
									nowMin <= dayEndTime * 60 && (
										<div
											className="absolute left-0 right-0 pointer-events-none z-20"
											style={{
												top:
													TOP_PADDING +
													((nowMin - dayStartTime * 60) / 60) * hourHeight,
											}}
										>
											<div className="absolute w-3 h-3 rounded-full bg-primary shadow-lg shadow-primary/30 -translate-y-1/2" />
											<div className="absolute left-3 right-0 h-0.5 bg-gradient-to-r from-primary to-primary/40 -translate-y-1/2" />
										</div>
									)}

								{/* Ghost block */}
								{ghostHere && (
									<div
										className="absolute left-0.5 right-0.5 rounded-md pointer-events-none z-30 border-2 border-dashed border-primary/50 transition-all duration-75"
										style={{
											top:
												TOP_PADDING +
												((ghostHere.startMin - dayStartTime * 60) / 60) *
													hourHeight,
											height: Math.max(
												((ghostHere.endMin - ghostHere.startMin) / 60) *
													hourHeight,
												4,
											),
										}}
									>
										<div className="absolute -top-5 left-1 px-1.5 py-0.5 bg-primary text-primary-foreground text-[10px] font-semibold rounded shadow-sm">
											{minutesToTime(ghostHere.startMin)} –{" "}
											{minutesToTime(ghostHere.endMin)}
										</div>
									</div>
								)}

								{/* Task blocks with collision layout */}
								{taskLayouts.map((layout) => {
									// 检查是否是多步骤任务的步骤
									const isStepTask = layout.task.id.includes("-step-");
									const originalTaskId = isStepTask
										? layout.task.id.split("-step-")[0]
										: layout.task.id;
									const originalTask = tasks.find(
										(t) => t.id === originalTaskId,
									);
									const taskToOpen = originalTask || layout.task;

									return (
										<WeekTaskBlock
											key={layout.task.id}
											task={layout.task}
											tags={tags}
											_hourHeight={hourHeight}
											selectMode={selectMode}
											selected={selectedIds.has(originalTaskId)}
											isActive={activeTaskId === originalTaskId}
											onToggleSelect={() => onToggleSelect(originalTaskId)}
											onOpenTask={() => onOpenTask(taskToOpen)}
											onLongPress={() => {
												if (!selectMode) {
													onEnterSelectMode();
													onToggleSelect(originalTaskId);
												}
											}}
											onDragStart={(mode, e) => {
												if (selectMode) return;
												e.currentTarget.setPointerCapture(e.pointerId);
												const { y } = getRelativePos(e.nativeEvent);
												const adjustedY = y - TOP_PADDING;
												const startMin = getMinuteFromY(
													Math.max(0, adjustedY),
												);
												const now = Date.now();
												dragRef.current = {
													mode,
													taskId: layout.task.id,
													colIndex,
													startY: y,
													startMin,
													origStartMin: timeToMinutes(
														layout.task.startTime!,
													),
													origEndMin: timeToMinutes(layout.task.endTime!),
													origColIndex: colIndex,
													lastY: y,
													lastTime: now,
													velocity: 0,
													snapped: false,
													leaveSnapCount: 0,
												};
												setDraggingTaskId(layout.task.id);
												setGhost({
													dateStr,
													startMin: timeToMinutes(layout.task.startTime!),
													endMin: timeToMinutes(layout.task.endTime!),
												});
											}}
											onToggleComplete={() => {
												if (isStepTask && originalTask) {
													// 更新步骤状态
													const stepId = layout.task.id.split("-step-")[1];
													const updatedSteps = originalTask.steps?.map((s) =>
														s.id === stepId
															? {
																	...s,
																	status:
																		s.status === "completed"
																			? "pending"
																			: "completed",
																}
															: s,
													);
													updateTask(originalTask.id, { steps: updatedSteps as any });
												} else {
													const newStatus =
														layout.task.status === "completed"
															? "pending"
															: "completed";
													updateTask(layout.task.id, { status: newStatus });
												}
											}}
											_dayStartTime={dayStartTime}
											topPadding={TOP_PADDING}
											onClick={() =>
												setActiveTaskId(
													activeTaskId === originalTaskId
														? null
														: originalTaskId,
												)
											}
											layoutInfo={layout}
											ghostTime={
												ghost &&
												ghost.dateStr === dateStr &&
												draggingTaskId === layout.task.id
													? { startMin: ghost.startMin, endMin: ghost.endMin }
													: undefined
											}
										/>
									);
								})}
							</div>
						);
					})}
					{/* Box select rectangle */}
					{boxSelectRect && (
						<div
							className="absolute pointer-events-none border-2 border-primary bg-primary/20 z-40"
							style={{
								left: boxSelectRect.x,
								top: boxSelectRect.y,
								width: boxSelectRect.w,
								height: boxSelectRect.h,
							}}
						/>
					)}
					{/* Snap line indicator */}
					{snapLine && (
						<div
							className="absolute pointer-events-none z-50"
							style={{
								left:
									TIME_COL_W +
									snapLine.colIndex * ((gridWidth - TIME_COL_W) / 7),
								top: snapLine.y,
								width: (gridWidth - TIME_COL_W) / 7,
							}}
						>
							<div className="w-full h-0.5 bg-primary shadow-lg shadow-primary/50" />
							<div className="absolute left-1/2 -translate-x-1/2 -top-1 px-1.5 py-0.5 bg-primary text-primary-foreground text-[9px] font-medium rounded shadow-lg">
								{minutesToTime(
									Math.round(
										((snapLine.y - TOP_PADDING) / hourHeight) * 60 +
											dayStartTime * 60,
									),
								)}
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

// ── WeekTaskBlock ──────────────────────────────────────────────────────────

/**
 * 获取任务的所有标签颜色
 * @param task - 任务对象
 * @param tags - 标签列表
 * @returns 标签颜色数组
 */
function getTaskTagColors(task: Task, tags: Tag[]): string[] {
	const colors = task.tagIds
		.map((tagId) => tags.find((tg) => tg.id === tagId)?.color)
		.filter((c): c is string => !!c);
	return colors.length > 0 ? colors : [DEFAULT_TAG_COLOR];
}

/**
 * 为颜色添加透明度（支持 CSS 变量）
 * @param color - 颜色值（可以是 CSS 变量）
 * @param opacity - 透明度百分比（0-100）
 * @returns 带透明度的颜色值
 */
function colorWithOpacity(color: string, opacity: number): string {
	return `color-mix(in srgb, ${color} ${opacity}%, transparent)`;
}

const DISPLAY_THRESHOLDS = {
	LINE_MODE: 6,
	MINIMAL: 12,
	COMPACT: 20,
	NORMAL: 32,
	SHOW_NOTES: 50,
} as const;

type DisplayMode = "line" | "minimal" | "compact" | "normal";

/**
 * 备注显示组件
 * 根据可用高度智能显示备注内容
 * @param notes - 备注文本
 * @param availableHeight - 可用高度（像素）
 * @param primaryColor - 主题颜色
 */
function NotesDisplay({
	notes,
	availableHeight,
	primaryColor,
}: {
	notes: string;
	availableHeight: number;
	primaryColor: string;
}) {
	return (
		<div
			className="text-[8px] leading-tight mt-0.5 overflow-hidden"
			style={{
				color: primaryColor,
				opacity: 0.7,
				display: "-webkit-box",
				WebkitLineClamp: Math.max(1, Math.floor((availableHeight - 10) / 10)),
				WebkitBoxOrient: "vertical",
				maxHeight: availableHeight - 10,
			}}
		>
			{notes}
		</div>
	);
}

function WeekTaskBlock({
	task,
	tags,
	_hourHeight,
	selectMode,
	selected,
	isActive,
	onToggleSelect,
	onOpenTask,
	onLongPress,
	onDragStart,
	onToggleComplete,
	_dayStartTime,
	topPadding,
	onClick,
	layoutInfo,
	ghostTime,
}: {
	task: Task;
	tags: Tag[];
	_hourHeight: number;
	selectMode: boolean;
	selected: boolean;
	isActive: boolean;
	onToggleSelect: () => void;
	onOpenTask: () => void;
	onLongPress: () => void;
	onDragStart: (mode: DragMode, e: React.PointerEvent<HTMLDivElement>) => void;
	onToggleComplete: () => void;
	_dayStartTime: number;
	topPadding: number;
	onClick: () => void;
	layoutInfo: TaskLayoutInfo;
	ghostTime?: { startMin: number; endMin: number };
}) {
	const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const didDrag = useRef(false);
	const [isHovered, setIsHovered] = useState(false);

	const top = task.startTime && task.endTime ? topPadding + layoutInfo.top : 0;
	const height = task.startTime && task.endTime ? layoutInfo.height : 0;
	const left = layoutInfo.left;
	const width = layoutInfo.width;

	const tagColors = getTaskTagColors(task, tags);
	const primaryColor = tagColors[0];
	const isCompleted = task.status === "completed";
	const isSkipped = task.status === "skipped";
	const isDimmed = isCompleted || isSkipped;

	const getDisplayMode = (h: number): DisplayMode => {
		if (h < DISPLAY_THRESHOLDS.LINE_MODE) return "line";
		if (h < DISPLAY_THRESHOLDS.MINIMAL) return "minimal";
		if (h < DISPLAY_THRESHOLDS.COMPACT) return "compact";
		if (h < DISPLAY_THRESHOLDS.NORMAL) return "normal";
		return "normal";
	};

	const displayMode = getDisplayMode(height);

	if (!task.startTime || !task.endTime) return null;

	if (displayMode === "line") {
		return (
			<div
				data-week-block="true"
				className={cn(
					"absolute cursor-grab active:cursor-grabbing group transition-all duration-200",
					selected && "ring-2 ring-primary ring-offset-1",
					isActive && "ring-2 ring-primary/50 ring-offset-1 z-50",
				)}
				style={{
					top,
					height: Math.max(height, 2),
					left: `${left}%`,
					width: `${width}%`,
					opacity: isDimmed ? 0.6 : 1,
					zIndex: isActive ? 50 : selected ? 15 : 10,
				}}
				onClick={(_e) => {
					if (selectMode) {
						onToggleSelect();
					} else if (!didDrag.current) {
						onOpenTask();
					}
				}}
				onPointerDown={(e) => {
					if (e.button !== 0) return;
					if (selectMode) {
						onToggleSelect();
						return;
					}
					didDrag.current = false;
					pressTimer.current = setTimeout(() => {
						onLongPress();
						didDrag.current = true;
					}, 600);
					onDragStart("move", e);
				}}
				onPointerMove={() => {
					didDrag.current = true;
					if (pressTimer.current) clearTimeout(pressTimer.current);
				}}
				onPointerUp={(_e) => {
					if (pressTimer.current) clearTimeout(pressTimer.current);
				}}
				title={`${task.title}\n${task.startTime} – ${task.endTime}`}
			>
				<div
					className="flex h-full rounded-sm overflow-hidden"
					style={{ backgroundColor: primaryColor, opacity: isDimmed ? 0.6 : 1 }}
				>
					{tagColors.length > 1 && (
						<div className="flex flex-col w-0.5 shrink-0">
							{tagColors.map((color, idx) => (
								<div
									key={idx}
									className="flex-1"
									style={{ backgroundColor: color }}
								/>
							))}
						</div>
					)}
				</div>
			</div>
		);
	}

	const checkboxSize =
		displayMode === "minimal"
			? "w-2.5 h-2.5"
			: displayMode === "compact"
				? "w-3 h-3"
				: "w-4 h-4";
	const checkboxIconSize =
		displayMode === "minimal"
			? "w-1.5 h-1.5"
			: displayMode === "compact"
				? "w-2 h-2"
				: "w-2.5 h-2.5";
	const titleFontSize =
		displayMode === "minimal"
			? "text-[7px]"
			: displayMode === "compact"
				? "text-[8px]"
				: "text-[10px]";
	const showTime = displayMode === "normal" && height > 40;
	const showNotes =
		displayMode === "normal" &&
		height >= DISPLAY_THRESHOLDS.SHOW_NOTES &&
		task.notes;
	const paddingClass =
		displayMode === "minimal"
			? "pl-4 pr-3 py-0.5"
			: displayMode === "compact"
				? "pl-5 pr-4 py-0.5"
				: "pl-7 pr-5 py-1";

	return (
		<div
			data-week-block="true"
			className={cn(
				"absolute cursor-grab active:cursor-grabbing group transition-all duration-200",
				selected && "ring-2 ring-primary ring-offset-1",
				isActive && "ring-2 ring-primary/50 ring-offset-1 z-50",
			)}
			style={{
				top,
				height,
				left: `${left}%`,
				width: `${width}%`,
				opacity: isDimmed ? 0.6 : 1,
				zIndex: isActive ? 50 : selected ? 15 : 10,
			}}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			onClick={(e) => {
				if ((e.target as HTMLElement).closest("[data-edit-button]")) return;
				if ((e.target as HTMLElement).closest("[data-complete-checkbox]"))
					return;
				if ((e.target as HTMLElement).closest("[data-resize-handle]")) return;
				if (!selectMode) {
					onClick();
				}
			}}
			onPointerDown={(e) => {
				if (e.button !== 0) return;
				if ((e.target as HTMLElement).closest("[data-edit-button]")) return;
				if ((e.target as HTMLElement).closest("[data-complete-checkbox]"))
					return;
				if ((e.target as HTMLElement).closest("[data-resize-handle]")) return;
				if (selectMode) {
					onToggleSelect();
					return;
				}

				didDrag.current = false;
				pressTimer.current = setTimeout(() => {
					onLongPress();
					didDrag.current = true;
				}, 600);
				onDragStart("move", e);
			}}
			onPointerMove={() => {
				didDrag.current = true;
				if (pressTimer.current) clearTimeout(pressTimer.current);
			}}
			onPointerUp={() => {
				if (pressTimer.current) clearTimeout(pressTimer.current);
			}}
		>
			<div className="flex h-full rounded-md overflow-hidden">
				<div
					className={cn(
						"flex flex-col shrink-0 rounded-l-md overflow-hidden",
						displayMode === "minimal"
							? "w-0.5"
							: displayMode === "compact"
								? "w-0.5"
								: "w-1",
					)}
				>
					{tagColors.map((color, idx) => (
						<div
							key={idx}
							className="flex-1"
							style={{ backgroundColor: color }}
						/>
					))}
				</div>

				<div
					className="flex-1 relative rounded-r-md overflow-hidden"
					style={{
						backgroundColor: colorWithOpacity(primaryColor, isDimmed ? 10 : 16),
					}}
				>
					<div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-0" />

					{isActive && (
						<div
							data-resize-handle="top"
							className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize z-40 hover:bg-primary/30 transition-colors"
							onPointerDown={(e) => {
								if (e.button !== 0) return;
								e.stopPropagation();
								onDragStart("resize-top", e);
							}}
						/>
					)}

					{isActive && (
						<div
							data-resize-handle="bottom"
							className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize z-40 hover:bg-primary/30 transition-colors"
							onPointerDown={(e) => {
								if (e.button !== 0) return;
								e.stopPropagation();
								onDragStart("resize-bottom", e);
							}}
						/>
					)}

					<div
						data-complete-checkbox="true"
						className={cn(
							"absolute z-30 cursor-pointer",
							displayMode === "minimal"
								? "top-0.5 left-0.5"
								: displayMode === "compact"
									? "top-0.5 left-0.5"
									: "top-1 left-1",
						)}
						onClick={(e) => {
							e.stopPropagation();
							onToggleComplete();
						}}
					>
						<div
							className={cn(
								"rounded-full border-2 flex items-center justify-center transition-all duration-200",
								checkboxSize,
								isCompleted
									? "bg-success border-success"
									: "bg-transparent border-muted-foreground hover:border-success group-hover:border-success",
							)}
						>
							{isCompleted && (
								<svg
									className={cn("text-success-foreground", checkboxIconSize)}
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={3}
										d="M5 13l4 4L19 7"
									/>
								</svg>
							)}
						</div>
					</div>

					{displayMode !== "minimal" && (
						<div
							data-edit-button="true"
							className={cn(
								"absolute z-30 transition-all duration-200 cursor-pointer",
								displayMode === "compact"
									? "top-0.5 right-0.5"
									: "top-1 right-1",
								isHovered ? "opacity-100" : "opacity-0",
							)}
							onClick={(e) => {
								e.stopPropagation();
								onOpenTask();
							}}
						>
							<div
								className={cn(
									"rounded-full flex items-center justify-center",
									displayMode === "compact" ? "w-3 h-3" : "w-4 h-4",
								)}
								style={{
									backgroundColor: primaryColor,
									color: "white",
									textShadow: "0 1px 2px rgba(0,0,0,0.3)",
								}}
							>
								<Edit3
									className={
										displayMode === "compact" ? "w-2 h-2" : "w-2.5 h-2.5"
									}
								/>
							</div>
						</div>
					)}

					<div
						className={cn(paddingClass, "min-w-0")}
						style={{ overflow: "hidden" }}
					>
						<p
							className={cn(
								"font-semibold leading-tight",
								titleFontSize,
								isSkipped && "line-through",
							)}
							style={{
								color: primaryColor,
								paddingRight: displayMode === "compact" ? "20px" : "24px",
								overflow: "hidden",
								textOverflow: "ellipsis",
								whiteSpace: "nowrap",
								width: "100%",
							}}
						>
							{task.title}
						</p>
						{showTime && (
							<p className="text-[9px] text-muted-foreground leading-none tabular-nums mt-0.5">
								{ghostTime
									? `${minutesToTime(ghostTime.startMin)} – ${minutesToTime(ghostTime.endMin)}`
									: `${task.startTime} – ${task.endTime}`}
							</p>
						)}
						{showNotes && (
							<NotesDisplay
								notes={task.notes!}
								availableHeight={height - (showTime ? 50 : 40)}
								primaryColor={primaryColor}
							/>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
