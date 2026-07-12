"use client";

import {
	CheckCircle2,
	Circle,
	Edit2,
	GripVertical,
	Link2,
	Trash2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/lib/i18n";
import { useLanguage } from "@/lib/store";
import type { Note } from "@/lib/types";
import { cn } from "@/lib/utils";
import { NOTE_COLORS } from "./note-utils";

interface NoteCardProps {
	note: Note;
	onUpdate: (id: string, updates: Partial<Note>) => void;
	onDelete: (id: string) => void;
	onEdit: (note: Note) => void;
	onBringToFront: (id: string) => void;
	onStartConnection?: (id: string, e: React.MouseEvent) => void;
	onShowConnections?: (id: string) => void;
	hasConnections?: boolean;
	isConnecting?: boolean;
	isAnyDragging?: boolean;
	onDragStateChange?: (isDragging: boolean, mouseY: number) => void;
}

export function NoteCard({
	note,
	onUpdate,
	onDelete,
	onEdit,
	onBringToFront,
	onStartConnection,
	onShowConnections,
	hasConnections = false,
	isConnecting = false,
	isAnyDragging = false,
	onDragStateChange,
}: NoteCardProps) {
	const [isHovered, setIsHovered] = useState(false);
	const [isDragging, setIsDragging] = useState(false);
	const [isResizing, setIsResizing] = useState(false);
	const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
	const [resizeOffset, setResizeOffset] = useState({ x: 0, y: 0 });
	const cardRef = useRef<HTMLDivElement>(null);
	const lang = useLanguage();
	const t = useTranslations(lang);
	
	// 当有任何卡片在拖拽时，强制取消本卡片的悬停效果
	const effectiveIsHovered = isAnyDragging ? false : isHovered;

	const colorClasses = NOTE_COLORS[note.color];

	const handleMouseDown = useCallback(
		(e: React.MouseEvent) => {
			if (isConnecting) return;
			if ((e.target as HTMLElement).closest("button")) return;
			if ((e.target as HTMLElement).closest(".content-selectable")) return;
			
			// 无论是否拖拽，都先置顶笔记
			onBringToFront(note.id);
			
			setIsDragging(true);
			setDragOffset({
				x: e.clientX - note.x,
				y: e.clientY - note.y,
			});
			onDragStateChange?.(true, e.clientY);
		},
		[note.id, note.x, note.y, onBringToFront, isConnecting, onDragStateChange],
	);

	const handleResizeMouseDown = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			e.preventDefault();
			setIsResizing(true);
			setResizeOffset({
				x: e.clientX - (note.x + note.width),
				y: e.clientY - (note.y + note.height),
			});
			onBringToFront(note.id);
		},
		[note.id, note.x, note.y, note.width, note.height, onBringToFront],
	);

	useEffect(() => {
		if (!isDragging && !isResizing) return;

		const handleMouseMove = (e: MouseEvent) => {
			if (isDragging) {
				const newX = e.clientX - dragOffset.x;
				const newY = e.clientY - dragOffset.y;
				onUpdate(note.id, { x: newX, y: newY });
				onDragStateChange?.(true, e.clientY);
			} else if (isResizing) {
				const newWidth = Math.max(150, e.clientX - resizeOffset.x - note.x);
				const newHeight = Math.max(100, e.clientY - resizeOffset.y - note.y);
				onUpdate(note.id, { width: newWidth, height: newHeight });
			}
		};

		const handleMouseUp = () => {
			setIsDragging(false);
			setIsResizing(false);
			onDragStateChange?.(false, 0);
		};

		window.addEventListener("mousemove", handleMouseMove);
		window.addEventListener("mouseup", handleMouseUp);

		return () => {
			window.removeEventListener("mousemove", handleMouseMove);
			window.removeEventListener("mouseup", handleMouseUp);
		};
	}, [isDragging, isResizing, dragOffset, resizeOffset, note.id, note.x, note.y, onUpdate, onDragStateChange]);

	const handleStatusToggle = useCallback(() => {
		onUpdate(note.id, {
			status: note.status === "active" ? "completed" : "active",
		});
	}, [note.id, note.status, onUpdate]);

	const handleConnectionStart = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			e.preventDefault();
			if (onStartConnection) {
				onStartConnection(note.id, e);
			}
		},
		[note.id, onStartConnection],
	);

	return (
		<div
			ref={cardRef}
			data-note-id={note.id}
			className={cn(
				"absolute rounded-lg shadow-md",
				colorClasses.bg,
				colorClasses.border,
				colorClasses.text,
				"border-2",
				effectiveIsHovered && !isDragging && !isResizing && !isConnecting && "shadow-lg scale-[1.02]",
				isDragging && "shadow-2xl scale-[1.03] opacity-90",
				isResizing && "shadow-2xl opacity-90",
				note.status === "completed" && "opacity-60",
				isConnecting && "ring-2 ring-primary ring-offset-2",
				isConnecting && "cursor-pointer",
			)}
			style={{
				left: note.x,
				top: note.y,
				width: note.width,
				height: note.height,
				zIndex: note.zIndex || 1,
				transition: isDragging || isResizing ? "none" : "transform 0.2s, box-shadow 0.2s",
			}}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			onMouseDown={handleMouseDown}
		>
			{effectiveIsHovered && onStartConnection && (
				<div
					className="absolute -top-4 left-1/2 -translate-x-1/2 z-50"
					onMouseDown={handleConnectionStart}
				>
					<Button
						variant="secondary"
						size="sm"
						className="h-7 w-7 p-0 rounded-full shadow-lg border-2 border-background"
					>
						<Link2 className="w-3.5 h-3.5" />
					</Button>
				</div>
			)}

			<div className="relative h-full flex flex-col">
				<div
					className={cn(
						"flex items-center justify-between px-3 py-2 cursor-grab active:cursor-grabbing",
						"border-b",
						colorClasses.border,
					)}
				>
					<div className="flex items-center gap-2 min-w-0 flex-1">
						<GripVertical className="w-4 h-4 opacity-50 flex-shrink-0" />
						<button
							onClick={handleStatusToggle}
							className="hover:scale-110 transition-transform flex-shrink-0"
							title={
								note.status === "active"
									? t.note.markComplete
									: t.note.markActive
							}
						>
							{note.status === "completed" ? (
								<CheckCircle2 className="w-5 h-5 text-success" />
							) : (
								<Circle className="w-5 h-5" />
							)}
						</button>
						{note.title && (
							<h3
								className={cn(
									"font-semibold truncate min-w-0",
									note.status === "completed" && "line-through",
								)}
							>
								{note.title}
							</h3>
						)}
					</div>
					{effectiveIsHovered && (
						<div className="flex items-center gap-1">
							{hasConnections && onShowConnections && (
								<Button
									variant="ghost"
									size="sm"
									className="h-6 w-6 p-0"
									onClick={(e) => {
										e.stopPropagation();
										onShowConnections(note.id);
									}}
									title={t.note.line.viewConnections}
								>
									<Link2 className="w-3.5 h-3.5" />
								</Button>
							)}
							<Button
								variant="ghost"
								size="sm"
								className="h-6 w-6 p-0"
								onClick={(e) => {
									e.stopPropagation();
									onEdit(note);
								}}
								title={t.note.editNote}
							>
								<Edit2 className="w-3.5 h-3.5" />
							</Button>
							<Button
								variant="ghost"
								size="sm"
								className="h-6 w-6 p-0 text-destructive hover:text-destructive/80"
								onClick={(e) => {
									e.stopPropagation();
									onDelete(note.id);
								}}
								title={t.note.deleteNote}
							>
								<Trash2 className="w-3.5 h-3.5" />
							</Button>
						</div>
					)}
				</div>
				<div className="flex-1 p-3 overflow-y-auto overflow-x-hidden">
					<div
						className={cn(
							"text-sm leading-relaxed break-words break-all content-selectable select-text",
							note.status === "completed" && "line-through",
						)}
						dangerouslySetInnerHTML={{ __html: note.content }}
						onMouseDown={(e) => {
							// 点击内容区域时也置顶笔记
							onBringToFront(note.id);
							e.stopPropagation();
						}}
					/>
				</div>
				<div className="px-3 pb-2 text-xs opacity-60">
					{new Date(note.updatedAt).toLocaleTimeString(
						lang === "zh" ? "zh-CN" : "en-US",
						{
							hour: "2-digit",
							minute: "2-digit",
						},
					)}
				</div>
			</div>

			{/* Resize Handle */}
			{effectiveIsHovered && (
				<div
					className="absolute bottom-0 right-0 w-5 h-5 cursor-se-resize flex items-center justify-center"
					onMouseDown={handleResizeMouseDown}
				>
					<div className="w-2 h-2 border-r-2 border-b-2 opacity-30" />
				</div>
			)}
		</div>
	);
}
