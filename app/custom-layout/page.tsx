"use client";

import {
	Check,
	Copy,
	Download,
	Edit2,
	MoreVertical,
	PanelLeft,
	PanelLeftClose,
	Plus,
	Trash2,
	Upload,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { WidgetCanvas } from "@/components/widget-panel/widget-canvas";
import { WidgetLayerManager } from "@/components/widget-panel/widget-layer-manager";
import { WidgetSelector } from "@/components/widget-panel/widget-selector";
import {
	useWidgetStore,
	WidgetStoreProvider,
} from "@/components/widget-store-provider";
import { useTranslations } from "@/lib/i18n";
import { useLanguage } from "@/lib/store";
import { cn } from "@/lib/utils";
import { DEFAULT_CANVAS_SIZE } from "@/lib/widget-layout-manager";
import type { WidgetType } from "@/lib/widget-types";

interface LayoutMenuItemProps {
	layout: { id: string; name: string };
	isActive: boolean;
	onSelect: (id: string) => void;
	onRename: (id: string, name: string) => void;
	onDuplicate: (id: string) => void;
	onDelete: (id: string) => void;
	canDelete: boolean;
	lang: string;
}

function LayoutMenuItem({
	layout,
	isActive,
	onSelect,
	onRename,
	onDuplicate,
	onDelete,
	canDelete,
	lang,
}: LayoutMenuItemProps) {
	const t = useTranslations(lang as any);
	const [isRenaming, setIsRenaming] = useState(false);
	const [renameValue, setRenameValue] = useState(layout.name);
	const [menuOpen, setMenuOpen] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (isRenaming && inputRef.current) {
			inputRef.current.focus();
			inputRef.current.select();
		}
	}, [isRenaming]);

	const handleRenameSubmit = useCallback(() => {
		if (renameValue.trim()) {
			onRename(layout.id, renameValue.trim());
		}
		setIsRenaming(false);
	}, [renameValue, layout.id, onRename]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Enter") {
				handleRenameSubmit();
			} else if (e.key === "Escape") {
				setRenameValue(layout.name);
				setIsRenaming(false);
			}
		},
		[handleRenameSubmit, layout.name],
	);

	if (isRenaming) {
		return (
			<div className="flex items-center gap-1 px-2 py-1.5">
				<Input
					ref={inputRef}
					value={renameValue}
					onChange={(e) => setRenameValue(e.target.value)}
					onKeyDown={handleKeyDown}
					className="h-7 text-sm"
				/>
				<Button
					variant="ghost"
					size="icon"
					className="h-6 w-6 shrink-0"
					onClick={handleRenameSubmit}
				>
					<Check className="w-3 h-3" />
				</Button>
			</div>
		);
	}

	return (
		<div
			className={cn(
				"flex items-center justify-between rounded-sm px-2 py-1.5 cursor-pointer group",
				isActive ? "bg-muted" : "hover:bg-muted/50",
			)}
			onClick={() => onSelect(layout.id)}
		>
			<span className="text-sm truncate flex-1">{layout.name}</span>
			<DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
				<DropdownMenuTrigger asChild>
					<Button
						variant="ghost"
						size="icon"
						className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100"
						onClick={(e) => e.stopPropagation()}
					>
						<MoreVertical className="w-3 h-3" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
					<DropdownMenuItem
						onClick={(e) => {
							e.stopPropagation();
							setMenuOpen(false);
							setIsRenaming(true);
						}}
					>
						<Edit2 className="w-4 h-4 mr-2" />
						{t.customLayout.rename}
					</DropdownMenuItem>
					<DropdownMenuItem
						onClick={(e) => {
							e.stopPropagation();
							setMenuOpen(false);
							onDuplicate(layout.id);
						}}
					>
						<Copy className="w-4 h-4 mr-2" />
						{t.customLayout.copy}
					</DropdownMenuItem>
					{canDelete && (
						<>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={(e) => {
									e.stopPropagation();
									setMenuOpen(false);
									onDelete(layout.id);
								}}
								className="text-destructive"
							>
								<Trash2 className="w-4 h-4 mr-2" />
								{t.customLayout.delete}
							</DropdownMenuItem>
						</>
					)}
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}

function CustomLayoutContent() {
	const lang = useLanguage();
	const t = useTranslations(lang);
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const [importDialogOpen, setImportDialogOpen] = useState(false);
	const [importJson, setImportJson] = useState("");
	const [newLayoutDialogOpen, setNewLayoutDialogOpen] = useState(false);
	const [newLayoutName, setNewLayoutName] = useState("");
	const [newLayoutWidth, setNewLayoutWidth] = useState(
		DEFAULT_CANVAS_SIZE.width.toString(),
	);
	const [newLayoutHeight, setNewLayoutHeight] = useState(
		DEFAULT_CANVAS_SIZE.height.toString(),
	);
	const [isEditingTitle, setIsEditingTitle] = useState(false);
	const [editingTitle, setEditingTitle] = useState("");
	const titleInputRef = useRef<HTMLInputElement>(null);

	const {
		getActiveLayout,
		createLayout,
		deleteLayout,
		setActiveLayout,
		renameLayout,
		duplicateLayout,
		exportLayout,
		importLayout,
		layouts,
		activeLayoutId,
		canUndo,
		canRedo,
		undo,
		redo,
	} = useWidgetStore();

	const activeLayout = getActiveLayout();

	const handleWidgetSelect = useCallback((type: WidgetType) => {
		console.log("Widget selected:", type);
	}, []);

	const handleDragStart = useCallback((type: WidgetType) => {
		console.log("Widget drag start:", type);
	}, []);

	const handleStartEditTitle = useCallback(() => {
		if (activeLayout) {
			setEditingTitle(activeLayout.name);
			setIsEditingTitle(true);
		}
	}, [activeLayout]);

	const handleSaveTitle = useCallback(() => {
		if (editingTitle.trim() && activeLayout) {
			renameLayout(activeLayout.id, editingTitle.trim());
		}
		setIsEditingTitle(false);
		setEditingTitle("");
	}, [editingTitle, activeLayout, renameLayout]);

	const handleCancelEditTitle = useCallback(() => {
		setIsEditingTitle(false);
		setEditingTitle("");
	}, []);

	const handleTitleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Enter") {
				handleSaveTitle();
			} else if (e.key === "Escape") {
				handleCancelEditTitle();
			}
		},
		[handleSaveTitle, handleCancelEditTitle],
	);

	useEffect(() => {
		if (isEditingTitle && titleInputRef.current) {
			titleInputRef.current.focus();
			titleInputRef.current.select();
		}
	}, [isEditingTitle]);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			console.log(
				"[handleKeyDown] key:",
				e.key,
				"ctrlKey:",
				e.ctrlKey,
				"metaKey:",
				e.metaKey,
				"shiftKey:",
				e.shiftKey,
			);
			const isInputFocused =
				document.activeElement instanceof HTMLInputElement ||
				document.activeElement instanceof HTMLTextAreaElement ||
				document.activeElement instanceof HTMLSelectElement;

			if (isInputFocused) {
				console.log("[handleKeyDown] input focused, skipping");
				return;
			}

			if ((e.ctrlKey || e.metaKey) && e.key === "z") {
				console.log("[handleKeyDown] Ctrl+Z detected, shiftKey:", e.shiftKey);
				e.preventDefault();
				if (e.shiftKey) {
					console.log("[handleKeyDown] calling redo, canRedo:", canRedo());
					if (canRedo()) {
						redo();
					}
				} else {
					console.log("[handleKeyDown] calling undo, canUndo:", canUndo());
					if (canUndo()) {
						undo();
					}
				}
			}

			if ((e.ctrlKey || e.metaKey) && e.key === "y") {
				console.log("[handleKeyDown] Ctrl+Y detected");
				e.preventDefault();
				if (canRedo()) {
					redo();
				}
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [canUndo, canRedo, undo, redo]);

	const handleExport = useCallback(() => {
		if (activeLayout) {
			const json = exportLayout(activeLayout.id);
			const blob = new Blob([json], { type: "application/json" });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `${activeLayout.name}.json`;
			a.click();
			URL.revokeObjectURL(url);
		}
	}, [activeLayout, exportLayout]);

	const handleImport = useCallback(() => {
		if (importJson.trim()) {
			const result = importLayout(importJson);
			if (result) {
				setImportDialogOpen(false);
				setImportJson("");
			}
		}
	}, [importJson, importLayout]);

	const handleOpenNewLayoutDialog = useCallback(() => {
		setNewLayoutName(t.customLayout.newLayout);
		setNewLayoutWidth(DEFAULT_CANVAS_SIZE.width.toString());
		setNewLayoutHeight(DEFAULT_CANVAS_SIZE.height.toString());
		setNewLayoutDialogOpen(true);
	}, [t]);

	const handleSetMaxCanvasSize = useCallback(() => {
		if (typeof window !== "undefined") {
			const maxWidth = Math.floor(window.innerWidth * 0.85);
			const maxHeight = Math.floor(window.innerHeight * 0.85);
			setNewLayoutWidth(maxWidth.toString());
			setNewLayoutHeight(maxHeight.toString());
		}
	}, []);

	const handleCreateNewLayout = useCallback(() => {
		const width = parseInt(newLayoutWidth, 10);
		const height = parseInt(newLayoutHeight, 10);
		const name = newLayoutName.trim() || t.customLayout.newLayout;
		if (width >= 400 && height >= 300) {
			createLayout(name, { width, height });
			setNewLayoutDialogOpen(false);
		}
	}, [newLayoutName, newLayoutWidth, newLayoutHeight, createLayout, t]);

	return (
		<div className="flex h-[calc(100vh-2.25rem)] bg-background ml-16 relative overflow-hidden">
			<div
				style={{
					width: sidebarOpen ? 256 : 0,
					transition: "width 300ms ease-in-out",
				}}
				className="border-r border-border flex flex-col overflow-hidden shrink-0"
			>
				<div
					className={cn(
						"flex items-center justify-between px-4 py-3 border-b border-border transition-opacity duration-200",
						sidebarOpen ? "opacity-100" : "opacity-0",
					)}
				>
					<h2 className="text-sm font-semibold whitespace-nowrap">
						{t.customLayout.widgets}
					</h2>
					<Button
						variant="ghost"
						size="icon"
						className="h-7 w-7 shrink-0"
						onClick={() => setSidebarOpen(false)}
					>
						<PanelLeftClose className="w-4 h-4" />
					</Button>
				</div>

				<div
					className={cn(
						"flex-1 transition-opacity duration-200",
						sidebarOpen ? "opacity-100" : "opacity-0",
					)}
				>
					<WidgetSelector
						onWidgetSelect={handleWidgetSelect}
						onDragStart={handleDragStart}
						className="h-full"
					/>
				</div>
			</div>

			<div className="flex-1 flex flex-col">
				<header className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="icon"
							className={cn(
								"shrink-0 transition-all duration-300 ease-in-out bg-background border shadow-sm",
								sidebarOpen
									? "opacity-0 pointer-events-none scale-75 w-0 p-0 border-0 overflow-hidden"
									: "opacity-100 scale-100 w-9",
							)}
							onClick={() => setSidebarOpen(true)}
							title={t.customLayout.openWidgetPanel}
						>
							<PanelLeft className="w-4 h-4" />
						</Button>

						{isEditingTitle ? (
							<div className="flex items-center gap-1">
								<Input
									ref={titleInputRef}
									value={editingTitle}
									onChange={(e) => setEditingTitle(e.target.value)}
									onKeyDown={handleTitleKeyDown}
									className="h-8 w-48 text-lg font-semibold"
								/>
								<Button
									variant="ghost"
									size="icon"
									className="h-7 w-7"
									onClick={handleSaveTitle}
								>
									<Check className="w-4 h-4" />
								</Button>
								<Button
									variant="ghost"
									size="icon"
									className="h-7 w-7"
									onClick={handleCancelEditTitle}
								>
									<PanelLeft className="w-4 h-4" />
								</Button>
							</div>
						) : (
							<h1
								className="text-lg font-semibold cursor-pointer hover:text-primary transition-colors"
								onClick={handleStartEditTitle}
								title={t.customLayout.clickToEditTitle}
							>
								{activeLayout?.name || t.customLayout.customLayout}
							</h1>
						)}

						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline" size="sm">
									{t.customLayout.switchLayout}
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="start" className="w-48">
								<ScrollArea className="max-h-48">
									{layouts.map((layout) => (
										<LayoutMenuItem
											key={layout.id}
											layout={layout}
											isActive={layout.id === activeLayoutId}
											onSelect={setActiveLayout}
											onRename={renameLayout}
											onDuplicate={duplicateLayout}
											onDelete={deleteLayout}
											canDelete={layouts.length > 1}
											lang={lang}
										/>
									))}
								</ScrollArea>
								<DropdownMenuSeparator />
								<DropdownMenuItem onClick={handleOpenNewLayoutDialog}>
									<Plus className="w-4 h-4 mr-2" />
									{t.customLayout.newLayout}
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>

					<div className="flex items-center gap-2">
						<WidgetLayerManager />

						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline" size="sm">
									{t.customLayout.more}
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem onClick={handleExport}>
									<Download className="w-4 h-4 mr-2" />
									{t.customLayout.exportLayout}
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => setImportDialogOpen(true)}>
									<Upload className="w-4 h-4 mr-2" />
									{t.customLayout.importLayout}
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</header>

				<WidgetCanvas className="flex-1" editMode />
			</div>

			<Dialog open={newLayoutDialogOpen} onOpenChange={setNewLayoutDialogOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>{t.customLayout.newLayout}</DialogTitle>
					</DialogHeader>
					<div className="py-4 space-y-4">
						<div className="space-y-2">
							<Label>{t.customLayout.layoutName}</Label>
							<Input
								value={newLayoutName}
								onChange={(e) => setNewLayoutName(e.target.value)}
								placeholder={t.customLayout.enterLayoutName}
							/>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label>{t.customLayout.width}</Label>
								<Input
									type="number"
									value={newLayoutWidth}
									onChange={(e) => setNewLayoutWidth(e.target.value)}
									min={400}
									max={3840}
								/>
							</div>
							<div className="space-y-2">
								<Label>{t.customLayout.height}</Label>
								<Input
									type="number"
									value={newLayoutHeight}
									onChange={(e) => setNewLayoutHeight(e.target.value)}
									min={300}
									max={2160}
								/>
							</div>
						</div>
						<div className="flex gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={handleSetMaxCanvasSize}
							>
								{t.customLayout.max}
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => {
									setNewLayoutWidth("1200");
									setNewLayoutHeight("800");
								}}
							>
								{t.customLayout.default}
							</Button>
						</div>
						<p className="text-xs text-muted-foreground">
							{t.customLayout.sizeNote}
						</p>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setNewLayoutDialogOpen(false)}
						>
							{t.customLayout.cancel}
						</Button>
						<Button onClick={handleCreateNewLayout}>
							{t.customLayout.create}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>{t.customLayout.importLayout}</DialogTitle>
					</DialogHeader>
					<div className="py-4">
						<textarea
							value={importJson}
							onChange={(e) => setImportJson(e.target.value)}
							placeholder={t.customLayout.pasteLayoutJson}
							className="w-full h-48 p-2 text-sm border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
						/>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setImportDialogOpen(false)}
						>
							{t.customLayout.cancel}
						</Button>
						<Button onClick={handleImport} disabled={!importJson.trim()}>
							{t.customLayout.import}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

/**
 * 自定义布局页面
 * @returns 自定义布局页面
 */
export default function CustomLayoutPage() {
	return (
		<WidgetStoreProvider>
			<CustomLayoutContent />
		</WidgetStoreProvider>
	);
}
