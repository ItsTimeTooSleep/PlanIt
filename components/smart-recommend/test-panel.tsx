"use client";

import { format } from "date-fns";
import { CalendarClock, RotateCcw, Shuffle, Trash2, Plus, Pencil, Trash2 as Trash } from "lucide-react";
import { useCallback, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { AlgorithmConfig, RecommendTask, RecommendTag } from "@/lib/smart-recommend/types";
import { PRESET_TAG_COLORS } from "@/lib/colors";
import { cn } from "@/lib/utils";
import { generateId } from "@/lib/task-utils";

interface TestPanelProps {
	tasks: RecommendTask[];
	tags: RecommendTag[];
	config: AlgorithmConfig;
	contextTime?: Date;
	customCreatedAt: string | null;
	onConfigChange: (config: AlgorithmConfig) => void;
	onContextTimeChange?: (date: Date) => void;
	onCustomCreatedAtChange: (dateStr: string | null) => void;
	onDeleteTask: (id: string) => void;
	onGenerateBatchTasks?: () => void;
	onTagsChange?: (tags: RecommendTag[]) => void;
}

export function TestPanel({
	tasks,
	tags,
	config,
	customCreatedAt,
	onConfigChange,
	onCustomCreatedAtChange,
	onDeleteTask,
	onGenerateBatchTasks,
	onTagsChange,
}: TestPanelProps) {
	const effectiveCreatedAt = customCreatedAt ? new Date(customCreatedAt) : new Date();

	const createdAtDate = customCreatedAt
		? format(new Date(customCreatedAt), "yyyy-MM-dd")
		: format(effectiveCreatedAt, "yyyy-MM-dd");
	const createdAtTime = customCreatedAt
		? format(new Date(customCreatedAt), "HH:mm")
		: format(effectiveCreatedAt, "HH:mm");

	// 标签编辑状态
	const [tagDialog, setTagDialog] = useState<{ mode: "add" | "edit"; tag?: RecommendTag } | null>(null);
	const [tagName, setTagName] = useState("");
	const [tagColor, setTagColor] = useState(PRESET_TAG_COLORS[0]);
	const [customTagColor, setCustomTagColor] = useState("#000000");
	const [useCustomColor, setUseCustomColor] = useState(false);

	const handleAddTag = useCallback(() => {
		setTagName("");
		setTagColor(PRESET_TAG_COLORS[0]);
		setCustomTagColor("#000000");
		setUseCustomColor(false);
		setTagDialog({ mode: "add" });
	}, []);

	const handleEditTag = useCallback((tag: RecommendTag) => {
		setTagName(tag.name);
		setTagColor(tag.color);
		setCustomTagColor(tag.color);
		setUseCustomColor(!PRESET_TAG_COLORS.includes(tag.color));
		setTagDialog({ mode: "edit", tag });
	}, []);

	const handleDeleteTag = useCallback((tagId: string) => {
		if (!onTagsChange) return;
		onTagsChange(tags.filter((t) => t.id !== tagId));
	}, [tags, onTagsChange]);

	const handleSaveTag = useCallback(() => {
		if (!tagName.trim() || !onTagsChange) return;
		const selectedColor = useCustomColor ? customTagColor : tagColor;
		if (tagDialog?.mode === "edit" && tagDialog.tag) {
			onTagsChange(tags.map((t) => (t.id === tagDialog.tag!.id ? { ...t, name: tagName.trim(), color: selectedColor } : t)));
		} else {
			onTagsChange([...tags, { id: generateId(), name: tagName.trim(), color: selectedColor }]);
		}
		setTagDialog(null);
	}, [tagName, tagColor, customTagColor, useCustomColor, tagDialog, tags, onTagsChange]);

	const handleWeightChange = useCallback((key: keyof AlgorithmConfig["weights"], value: number) => {
		const newWeights = { ...config.weights, [key]: value };
		const total = Object.values(newWeights).reduce((a, b) => a + b, 0);
		const normalized = Object.fromEntries(
			Object.entries(newWeights).map(([k, v]) => [k, v / total]),
		) as unknown as AlgorithmConfig["weights"];
		onConfigChange({ ...config, weights: normalized });
	}, [config, onConfigChange]);

	const handleCreatedAtDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const val = e.target.value;
		if (!val) {
			onCustomCreatedAtChange(null);
			return;
		}
		const time = customCreatedAt ? format(new Date(customCreatedAt), "HH:mm") : "09:00";
		onCustomCreatedAtChange(`${val}T${time}:00.000Z`);
	}, [customCreatedAt, onCustomCreatedAtChange]);

	const handleCreatedAtTimeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const val = e.target.value;
		if (!val) return;
		const date = customCreatedAt
			? format(new Date(customCreatedAt), "yyyy-MM-dd")
			: format(new Date(), "yyyy-MM-dd");
		onCustomCreatedAtChange(`${date}T${val}:00.000Z`);
	}, [customCreatedAt, onCustomCreatedAtChange]);

	const handleResetCreatedAt = useCallback(() => {
		onCustomCreatedAtChange(null);
	}, [onCustomCreatedAtChange]);

	return (
		<div className="flex flex-col gap-4">
			<Card>
				<CardHeader className="pb-2 pt-4 px-4">
					<div className="flex items-center justify-between">
						<CardTitle className="text-sm">创建日期模拟</CardTitle>
						{customCreatedAt && (
							<Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-amber-500/10 text-amber-600">
								自定义
							</Badge>
						)}
					</div>
				</CardHeader>
				<CardContent className="px-4 pb-4">
					<div className="bg-muted/50 rounded-lg p-3 mb-3">
						<div className="flex items-center gap-2 mb-2">
							<CalendarClock className="w-3.5 h-3.5 text-muted-foreground" />
							<span className="text-xs text-muted-foreground">
								新任务将使用以下创建时间
							</span>
						</div>
						<div className="text-sm font-semibold mb-2">
							{format(effectiveCreatedAt, "yyyy年MM月dd日 HH:mm")}
						</div>
						<div className="grid grid-cols-2 gap-2">
							<div>
								<Label className="text-[10px] mb-1">日期</Label>
								<Input
									type="date"
									value={createdAtDate}
									onChange={handleCreatedAtDateChange}
									className="h-7 text-xs"
								/>
							</div>
							<div>
								<Label className="text-[10px] mb-1">时间</Label>
								<Input
									type="time"
									value={createdAtTime}
									onChange={handleCreatedAtTimeChange}
									className="h-7 text-xs"
								/>
							</div>
						</div>
						{customCreatedAt && (
							<Button
								variant="ghost"
								size="sm"
								className="h-6 text-[10px] mt-2 w-full"
								onClick={handleResetCreatedAt}
							>
								<RotateCcw className="w-3 h-3 mr-1" />
								重置为当前时间
							</Button>
						)}
					</div>
					<div className="flex flex-wrap gap-1">
						{[
							{ label: "1天前", days: -1 },
							{ label: "1周前", days: -7 },
							{ label: "2周前", days: -14 },
							{ label: "1月前", days: -30 },
						].map((preset) => (
							<Button
								key={preset.label}
								variant="secondary"
								size="sm"
								className="h-6 text-[10px] px-2"
								onClick={() => {
									const d = new Date();
									d.setDate(d.getDate() + preset.days);
									d.setHours(9, 0, 0, 0);
									onCustomCreatedAtChange(d.toISOString());
								}}
							>
								{preset.label}
							</Button>
						))}
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="pb-2 pt-4 px-4">
					<CardTitle className="text-sm">任务数据管理</CardTitle>
				</CardHeader>
				<CardContent className="px-4 pb-4">
					<div className="flex gap-2 mb-3">
						{onGenerateBatchTasks && (
							<Button size="sm" variant="outline" className="h-7 text-xs flex-1" onClick={onGenerateBatchTasks}>
								<Shuffle className="w-3 h-3 mr-1" />
								批量生成
							</Button>
						)}
					</div>

					<div className="text-xs text-muted-foreground mb-2">
						共 {tasks.length} 条任务数据
					</div>

					<div className="max-h-48 overflow-y-auto flex flex-col gap-1">
						{tasks.slice(-20).reverse().map((task) => (
							<div key={task.id} className="flex items-center gap-2 bg-muted/30 rounded px-2 py-1.5">
								<div className="flex-1 min-w-0">
									<span className="text-xs truncate block">{task.title}</span>
									<span className="text-[10px] text-muted-foreground">
										{task.startTime && task.endTime ? `${task.startTime}-${task.endTime}` : "全天"}
										{task.duration > 0 && ` · ${task.duration}min`}
										{task.dueDate && ` · 截止${task.dueDate}`}
									</span>
								</div>
								<Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => onDeleteTask(task.id)}>
									<X className="w-3 h-3" />
								</Button>
							</div>
						))}
						{tasks.length > 20 && (
							<p className="text-[10px] text-muted-foreground text-center py-1">
								仅显示最近 20 条，共 {tasks.length} 条
							</p>
						)}
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="pb-2 pt-4 px-4">
					<CardTitle className="text-sm">算法参数配置</CardTitle>
				</CardHeader>
				<CardContent className="px-4 pb-4">
					<div className="flex flex-col gap-3">
						<WeightSlider
							label="名称语义权重"
							value={config.weights.nameSimilarity}
							onChange={(v) => handleWeightChange("nameSimilarity", v)}
							description="基于字符n-gram的Jaccard相似度"
						/>
						<WeightSlider
							label="时间模式权重"
							value={config.weights.timePattern}
							onChange={(v) => handleWeightChange("timePattern", v)}
							description="基于创建时间和当前时段的匹配度"
						/>
						<WeightSlider
							label="标签关联权重"
							value={config.weights.tagCorrelation}
							onChange={(v) => handleWeightChange("tagCorrelation", v)}
							description="基于标签共现和近期偏好"
						/>
						<WeightSlider
							label="时长统计权重"
							value={config.weights.durationStats}
							onChange={(v) => handleWeightChange("durationStats", v)}
							description="基于相似任务的历史时长分布"
						/>
						<WeightSlider
							label="调度模式权重"
							value={config.weights.schedulingPattern}
							onChange={(v) => handleWeightChange("schedulingPattern", v)}
							description="基于调度习惯与提前量模式"
						/>
						<WeightSlider
							label="截止日期权重"
							value={config.weights.dueDatePattern}
							onChange={(v) => handleWeightChange("dueDatePattern", v)}
							description="基于截止日期偏好与周期模式"
						/>

						<div className="border-t pt-3 mt-1">
							<div className="flex items-center gap-2 mb-2">
								<Label className="text-xs">最大推荐数</Label>
								<Select
									value={String(config.maxRecommendations)}
									onValueChange={(v) => onConfigChange({ ...config, maxRecommendations: Number(v) })}
								>
									<SelectTrigger className="h-7 text-xs w-20">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="3">3</SelectItem>
										<SelectItem value="5">5</SelectItem>
										<SelectItem value="8">8</SelectItem>
										<SelectItem value="10">10</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="flex items-center gap-2 mb-2">
								<Label className="text-xs">最低置信度</Label>
								<Slider
									value={[config.minConfidence]}
									min={0}
									max={0.5}
									step={0.05}
									onValueChange={([v]) => onConfigChange({ ...config, minConfidence: v })}
									className="flex-1"
								/>
								<span className="text-xs font-medium w-10 text-right">{(config.minConfidence * 100).toFixed(0)}%</span>
							</div>
							<div className="flex items-center gap-2">
								<Label className="text-xs">学习率</Label>
								<Slider
									value={[config.learningRate]}
									min={0.01}
									max={0.2}
									step={0.01}
									onValueChange={([v]) => onConfigChange({ ...config, learningRate: v })}
									className="flex-1"
								/>
								<span className="text-xs font-medium w-10 text-right">{config.learningRate.toFixed(2)}</span>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="pb-2 pt-4 px-4">
					<CardTitle className="text-sm">标签管理</CardTitle>
				</CardHeader>
				<CardContent className="px-4 pb-4">
					<div className="flex flex-col gap-3">
						<div className="space-y-2">
							{tags.map((tag) => (
								<div key={tag.id} className="flex items-center justify-between bg-muted/30 rounded px-2 py-1.5">
									<div className="flex items-center gap-2">
										<div className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />
										<span className="text-sm">{tag.name}</span>
									</div>
									<div className="flex gap-1">
										<Button
											variant="ghost"
											size="sm"
											className="h-6 w-6 p-0"
											onClick={() => handleEditTag(tag)}
										>
											<Pencil className="w-3 h-3" />
										</Button>
										<Button
											variant="ghost"
											size="sm"
											className="h-6 w-6 p-0 text-destructive"
											onClick={() => handleDeleteTag(tag.id)}
										>
											<Trash className="w-3 h-3" />
										</Button>
									</div>
								</div>
							))}
						</div>
						<Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleAddTag}>
							<Plus className="w-3 h-3 mr-1" />
							添加标签
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* 标签编辑对话框 */}
			<Dialog open={!!tagDialog} onOpenChange={(v) => !v && setTagDialog(null)}>
				<DialogContent className="max-w-sm">
					<DialogHeader>
						<DialogTitle>
							{tagDialog?.mode === "edit" ? "编辑标签" : "添加标签"}
						</DialogTitle>
					</DialogHeader>
					<div className="space-y-4 py-2">
						<div className="space-y-2">
							<Label className="text-xs font-medium">标签名称</Label>
							<Input
								value={tagName}
								onChange={(e) => setTagName(e.target.value)}
								placeholder="输入标签名称"
								autoFocus
								onKeyDown={(e) => e.key === "Enter" && handleSaveTag()}
								className="h-8 text-xs"
							/>
						</div>
						<div className="space-y-2">
							<Label className="text-xs font-medium">标签颜色</Label>
							<div className="flex gap-1.5 flex-wrap">
								{PRESET_TAG_COLORS.map((color) => (
									<button
										key={color}
										type="button"
										onClick={() => {
											setTagColor(color);
											setUseCustomColor(false);
										}}
										className={cn(
											"w-7 h-7 rounded-full transition-transform border-2",
											!useCustomColor && tagColor === color ? "border-foreground scale-110" : "border-transparent hover:scale-105"
										)}
										style={{ backgroundColor: color }}
									/>
								))}
								<button
									type="button"
									onClick={() => setUseCustomColor(true)}
									className={cn(
										"w-7 h-7 rounded-full transition-transform border-2 flex items-center justify-center",
										useCustomColor ? "border-foreground scale-110" : "border-transparent hover:scale-105"
									)}
								>
									<span className="text-xs">🎨</span>
								</button>
							</div>
							{useCustomColor && (
								<div className="flex items-center gap-2 pt-1">
									<div className="w-5 h-5 rounded-full border" style={{ backgroundColor: customTagColor }} />
									<input
										type="color"
										value={customTagColor}
										onChange={(e) => setCustomTagColor(e.target.value)}
										className="h-8 w-20 rounded border border-border"
									/>
								</div>
							)}
						</div>
					</div>
					<DialogFooter className="gap-2">
						<Button variant="outline" size="sm" onClick={() => setTagDialog(null)} className="h-8">
							取消
						</Button>
						<Button size="sm" onClick={handleSaveTag} disabled={!tagName.trim()} className="h-8">
							保存
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

function WeightSlider({
	label,
	value,
	onChange,
	description,
}: {
	label: string;
	value: number;
	onChange: (v: number) => void;
	description: string;
}) {
	return (
		<div>
			<div className="flex items-center justify-between mb-1">
				<Label className="text-xs">{label}</Label>
				<span className="text-xs font-semibold">{(value * 100).toFixed(1)}%</span>
			</div>
			<Slider value={[value]} min={0.05} max={0.6} step={0.01} onValueChange={([v]) => onChange(v)} />
			<p className="text-[10px] text-muted-foreground mt-0.5">{description}</p>
		</div>
	);
}

function X({ className }: { className?: string }) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
			<path d="M18 6 6 18" />
			<path d="m6 6 12 12" />
		</svg>
	);
}
