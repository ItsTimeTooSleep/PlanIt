"use client";

import { GripVertical, Layers } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useWidgetStore } from "@/components/widget-store-provider";
import { useTranslations } from "@/lib/i18n";
import { useLanguage } from "@/lib/store";
import { cn } from "@/lib/utils";
import { WIDGET_METADATA } from "@/lib/widget-registry";
import type { WidgetInstance } from "@/lib/widget-types";

interface WidgetLayerManagerProps {
	className?: string;
}

interface DraggableWidgetItemProps {
	widget: WidgetInstance;
	index: number;
	lang: string;
	onDragStart: (index: number) => void;
	onDragOver: (index: number) => void;
	onDragEnd: () => void;
	isDragging: boolean;
}

function DraggableWidgetItem({
	widget,
	index,
	lang,
	onDragStart,
	onDragOver,
	onDragEnd,
	isDragging,
}: DraggableWidgetItemProps) {
	const meta = WIDGET_METADATA[widget.type];

	return (
		<div
			draggable
			onDragStart={() => onDragStart(index)}
			onDragOver={(e) => {
				e.preventDefault();
				onDragOver(index);
			}}
			onDragEnd={onDragEnd}
			className={cn(
				"flex items-center gap-2 p-2 rounded-lg border border-border bg-card cursor-grab active:cursor-grabbing transition-colors allow-drag",
				isDragging && "opacity-50",
			)}
		>
			<GripVertical className="w-4 h-4 text-muted-foreground" />
			<div className="flex-1">
				<div className="text-sm font-medium">
					{lang === "zh" ? meta.nameZh : meta.name}
				</div>
				<div className="text-xs text-muted-foreground">
					Z-index: {widget.zIndex}
				</div>
			</div>
		</div>
	);
}

export function WidgetLayerManager({ className }: WidgetLayerManagerProps) {
	const lang = useLanguage();
	const t = useTranslations(lang);
	const [open, setOpen] = useState(false);
	const { getWidgets, reorderWidgets } = useWidgetStore();
	const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
	const [widgetOrder, setWidgetOrder] = useState<string[]>([]);

	const widgets = getWidgets().sort(
		(a, b) => (b.zIndex || 0) - (a.zIndex || 0),
	);

	const handleOpen = useCallback(() => {
		setWidgetOrder(widgets.map((w) => w.id));
		setOpen(true);
	}, [widgets]);

	const handleDragStart = useCallback((index: number) => {
		setDraggedIndex(index);
	}, []);

	const handleDragOver = useCallback(
		(index: number) => {
			if (draggedIndex === null || draggedIndex === index) return;

			setWidgetOrder((prev) => {
				const newOrder = [...prev];
				const [removed] = newOrder.splice(draggedIndex, 1);
				newOrder.splice(index, 0, removed);
				return newOrder;
			});
			setDraggedIndex(index);
		},
		[draggedIndex],
	);

	const handleDragEnd = useCallback(() => {
		setDraggedIndex(null);
	}, []);

	const handleSave = useCallback(() => {
		reorderWidgets(widgetOrder);
		setOpen(false);
	}, [widgetOrder, reorderWidgets]);

	return (
		<>
			<Button
				variant="outline"
				size="sm"
				onClick={handleOpen}
				className={className}
			>
				<Layers className="w-4 h-4 mr-1" />
				{t.customLayout.layers}
			</Button>

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>{t.customLayout.layerManager}</DialogTitle>
					</DialogHeader>
					<ScrollArea className="max-h-80">
						<div className="space-y-2">
							{widgetOrder.map((widgetId, index) => {
								const widget = widgets.find((w) => w.id === widgetId);
								if (!widget) return null;
								return (
									<DraggableWidgetItem
										key={widget.id}
										widget={widget}
										index={index}
										lang={lang}
										onDragStart={handleDragStart}
										onDragOver={handleDragOver}
										onDragEnd={handleDragEnd}
										isDragging={draggedIndex === index}
									/>
								);
							})}
							{widgetOrder.length === 0 && (
								<div className="text-center py-8 text-muted-foreground">
									{t.customLayout.noWidgets}
								</div>
							)}
						</div>
					</ScrollArea>
					<div className="flex justify-end gap-2">
						<Button variant="outline" onClick={() => setOpen(false)}>
							{t.customLayout.cancel}
						</Button>
						<Button onClick={handleSave}>{t.customLayout.save}</Button>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
