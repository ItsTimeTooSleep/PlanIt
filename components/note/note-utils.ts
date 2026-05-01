"use client";

import { NOTE_LINE_COLORS as CSS_NOTE_LINE_COLORS } from "@/lib/colors";
import { translations } from "@/lib/i18n";
import type { Language, Note, NoteColor, NoteLineColor } from "@/lib/types";

export const NOTE_COLORS: Record<
	NoteColor,
	{ bg: string; text: string; border: string }
> = {
	yellow: {
		bg: "bg-note-yellow-bg",
		text: "text-note-yellow-text",
		border: "border-note-yellow-border",
	},
	pink: {
		bg: "bg-note-pink-bg",
		text: "text-note-pink-text",
		border: "border-note-pink-border",
	},
	blue: {
		bg: "bg-note-blue-bg",
		text: "text-note-blue-text",
		border: "border-note-blue-border",
	},
	green: {
		bg: "bg-note-green-bg",
		text: "text-note-green-text",
		border: "border-note-green-border",
	},
	purple: {
		bg: "bg-note-purple-bg",
		text: "text-note-purple-text",
		border: "border-note-purple-border",
	},
	orange: {
		bg: "bg-note-orange-bg",
		text: "text-note-orange-text",
		border: "border-note-orange-border",
	},
};

export const NOTE_LINE_COLORS: Record<NoteLineColor, string> = {
	gray: CSS_NOTE_LINE_COLORS.gray,
	red: CSS_NOTE_LINE_COLORS.red,
	blue: CSS_NOTE_LINE_COLORS.blue,
	green: CSS_NOTE_LINE_COLORS.green,
	purple: CSS_NOTE_LINE_COLORS.purple,
	orange: CSS_NOTE_LINE_COLORS.orange,
};

export function formatDate(date: Date): string {
	return date.toISOString().split("T")[0];
}

export function getRelativeDateStr(date: Date, lang: Language): string {
	const today = new Date();
	const yesterday = new Date(today);
	yesterday.setDate(yesterday.getDate() - 1);
	const tomorrow = new Date(today);
	tomorrow.setDate(tomorrow.getDate() + 1);

	const dateStr = formatDate(date);
	const todayStr = formatDate(today);
	const yesterdayStr = formatDate(yesterday);
	const tomorrowStr = formatDate(tomorrow);
	const t = translations[lang];

	if (dateStr === todayStr) return t.note.today;
	if (dateStr === yesterdayStr) return t.common.yesterday;
	if (dateStr === tomorrowStr) return t.common.tomorrow;

	return date.toLocaleDateString(lang === "zh" ? "zh-CN" : "en-US", {
		month: "long",
		day: "numeric",
		weekday: "long",
	});
}

function checkCollision(
	newX: number,
	newY: number,
	width: number,
	height: number,
	existingNotes: Note[],
): boolean {
	const padding = 10;
	for (const note of existingNotes) {
		if (
			newX < note.x + note.width + padding &&
			newX + width + padding > note.x &&
			newY < note.y + note.height + padding &&
			newY + height + padding > note.y
		) {
			return true;
		}
	}
	return false;
}

export function findNonOverlappingPosition(
	existingNotes: Note[],
	cardWidth: number,
	cardHeight: number,
	containerWidth: number = 1200,
	_containerHeight: number = 800,
): { x: number; y: number } {
	const padding = 20;
	const startX = padding;
	const startY = padding;

	let x = startX;
	let y = startY;
	let rowHeight = 0;

	for (let attempt = 0; attempt < 100; attempt++) {
		if (!checkCollision(x, y, cardWidth, cardHeight, existingNotes)) {
			return { x, y };
		}

		x += cardWidth + padding;

		if (x + cardWidth > containerWidth - padding) {
			x = startX;
			y += rowHeight + padding;
			rowHeight = 0;
		}

		rowHeight = Math.max(rowHeight, cardHeight);
	}

	return { x: startX + Math.random() * 200, y: startY + Math.random() * 100 };
}

export function getNextZIndex(notes: Note[]): number {
	if (notes.length === 0) return 1;
	const maxZIndex = Math.max(...notes.map((n) => n.zIndex || 1));
	const MAX_ALLOWED_ZINDEX = 40;
	if (maxZIndex >= MAX_ALLOWED_ZINDEX) {
		const allZIndices = notes.map((n) => n.zIndex || 1).sort((a, b) => a - b);
		let newZIndex = 1;
		for (const z of allZIndices) {
			if (z === newZIndex) {
				newZIndex++;
			} else {
				break;
			}
		}
		return Math.min(newZIndex, MAX_ALLOWED_ZINDEX);
	}
	return maxZIndex + 1;
}

export function clampToBounds(
	x: number,
	y: number,
	width: number,
	height: number,
	containerWidth: number,
	containerHeight: number,
	padding: number = 10,
): { x: number; y: number } {
	let clampedX = Math.max(padding, x);
	let clampedY = Math.max(padding, y);

	if (clampedX + width > containerWidth - padding) {
		clampedX = containerWidth - padding - width;
	}

	if (clampedY + height > containerHeight - padding) {
		clampedY = containerHeight - padding - height;
	}

	return { x: clampedX, y: clampedY };
}

// 计算内容的有效长度（去除HTML标签）
function getContentLength(content: string): number {
	// 去除HTML标签
	const temp = document.createElement('div');
	temp.innerHTML = content;
	const text = temp.textContent || temp.innerText || '';
	return text.length;
}

// 根据内容长度和笔记数量计算合适的卡片大小
function calculateCardSize(content: string, noteCount: number): { width: number; height: number } {
	const contentLength = getContentLength(content);
	
	// 基础大小基于笔记数量
	let baseWidth, baseHeight;
	if (noteCount === 0) {
		baseWidth = 320;
		baseHeight = 240;
	} else if (noteCount < 3) {
		baseWidth = 280;
		baseHeight = 200;
	} else if (noteCount < 6) {
		baseWidth = 240;
		baseHeight = 180;
	} else {
		baseWidth = 200;
		baseHeight = 160;
	}
	
	// 根据内容长度调整大小
	let width = baseWidth;
	let height = baseHeight;
	
	if (contentLength > 500) {
		// 长内容，大幅增加高度
		width = Math.min(baseWidth + 80, 400);
		height = Math.min(baseHeight + 120, 360);
	} else if (contentLength > 200) {
		// 中等长度，适当增加
		width = Math.min(baseWidth + 40, 360);
		height = Math.min(baseHeight + 60, 300);
	} else if (contentLength > 50) {
		// 短内容，小幅增加
		width = baseWidth;
		height = Math.min(baseHeight + 20, 260);
	}
	
	return { width, height };
}

export function createEmptyNote(
	_date: string,
	existingNotes: Note[] = [],
): {
	title: string;
	content: string;
	color: NoteColor;
	width: number;
	height: number;
	x: number;
	y: number;
	zIndex: number;
} {
	const colors: NoteColor[] = [
		"yellow",
		"pink",
		"blue",
		"green",
		"purple",
		"orange",
	];
	const randomColor = colors[Math.floor(Math.random() * colors.length)];
	
	const { width, height } = calculateCardSize("", existingNotes.length);
	
	const { x, y } = findNonOverlappingPosition(existingNotes, width, height);
	const zIndex = getNextZIndex(existingNotes);

	return {
		title: "",
		content: "",
		color: randomColor,
		width,
		height,
		x,
		y,
		zIndex,
	};
}

export function getUpdatedCardSize(note: Note, noteCount: number): { width: number; height: number } {
	const { width, height } = calculateCardSize(note.content, noteCount);
	return { width, height };
}
