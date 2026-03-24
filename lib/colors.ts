/**
 * 颜色常量定义
 * 所有颜色统一使用 CSS 变量，支持亮色/暗色主题切换
 */

/**
 * 预设标签颜色 CSS 变量名称
 */
export const TAG_COLORS = {
  blue: 'var(--tag-blue)',
  green: 'var(--tag-green)',
  amber: 'var(--tag-amber)',
  pink: 'var(--tag-pink)',
  purple: 'var(--tag-purple)',
  red: 'var(--tag-red)',
  cyan: 'var(--tag-cyan)',
  orange: 'var(--tag-orange)',
  slate: 'var(--tag-slate)',
  emerald: 'var(--tag-emerald)',
}

/**
 * 预设标签颜色数组（用于颜色选择器）
 */
export const PRESET_TAG_COLORS: string[] = [
  TAG_COLORS.blue,
  TAG_COLORS.green,
  TAG_COLORS.amber,
  TAG_COLORS.pink,
  TAG_COLORS.purple,
  TAG_COLORS.red,
  TAG_COLORS.cyan,
  TAG_COLORS.orange,
  TAG_COLORS.slate,
  TAG_COLORS.emerald,
]

/**
 * 番茄钟阶段颜色
 */
export const POMODORO_COLORS = {
  work: 'var(--pomodoro-work)',
  shortBreak: 'var(--pomodoro-short-break)',
  longBreak: 'var(--pomodoro-long-break)',
}

/**
 * 笔记卡片颜色 CSS 变量
 */
export const NOTE_COLORS = {
  yellow: {
    bg: 'var(--note-yellow-bg)',
    text: 'var(--note-yellow-text)',
    border: 'var(--note-yellow-border)',
  },
  pink: {
    bg: 'var(--note-pink-bg)',
    text: 'var(--note-pink-text)',
    border: 'var(--note-pink-border)',
  },
  blue: {
    bg: 'var(--note-blue-bg)',
    text: 'var(--note-blue-text)',
    border: 'var(--note-blue-border)',
  },
  green: {
    bg: 'var(--note-green-bg)',
    text: 'var(--note-green-text)',
    border: 'var(--note-green-border)',
  },
  purple: {
    bg: 'var(--note-purple-bg)',
    text: 'var(--note-purple-text)',
    border: 'var(--note-purple-border)',
  },
  orange: {
    bg: 'var(--note-orange-bg)',
    text: 'var(--note-orange-text)',
    border: 'var(--note-orange-border)',
  },
}

/**
 * 笔记行颜色 CSS 变量
 */
export const NOTE_LINE_COLORS = {
  gray: 'var(--note-line-gray)',
  red: 'var(--note-line-red)',
  blue: 'var(--note-line-blue)',
  green: 'var(--note-line-green)',
  purple: 'var(--note-line-purple)',
  orange: 'var(--note-line-orange)',
  yellow: 'var(--note-line-yellow)',
  black: 'var(--note-line-black)',
}

/**
 * 笔记编辑器颜色 CSS 变量（RGB 格式，用于 execCommand）
 */
export const NOTE_EDITOR_COLORS_RGB = {
  black: 'var(--note-editor-black)',
  red: 'var(--note-editor-red)',
  blue: 'var(--note-editor-blue)',
  green: 'var(--note-editor-green)',
  yellow: 'var(--note-editor-yellow)',
  purple: 'var(--note-editor-purple)',
}

/**
 * 笔记编辑器颜色选项
 * value: CSS 变量用于显示（oklch 格式）
 * actualValue: CSS 变量用于 execCommand（RGB 格式）
 */
export const NOTE_EDITOR_COLORS: { label: string; value: string; actualValue: string }[] = [
  { label: '黑色', value: NOTE_LINE_COLORS.black, actualValue: NOTE_EDITOR_COLORS_RGB.black },
  { label: '红色', value: NOTE_LINE_COLORS.red, actualValue: NOTE_EDITOR_COLORS_RGB.red },
  { label: '蓝色', value: NOTE_LINE_COLORS.blue, actualValue: NOTE_EDITOR_COLORS_RGB.blue },
  { label: '绿色', value: NOTE_LINE_COLORS.green, actualValue: NOTE_EDITOR_COLORS_RGB.green },
  { label: '黄色', value: NOTE_LINE_COLORS.yellow, actualValue: NOTE_EDITOR_COLORS_RGB.yellow },
  { label: '紫色', value: NOTE_LINE_COLORS.purple, actualValue: NOTE_EDITOR_COLORS_RGB.purple },
]

/**
 * 状态颜色
 */
export const STATUS_COLORS = {
  success: 'var(--success)',
  successForeground: 'var(--success-foreground)',
  warning: 'var(--warning)',
  warningForeground: 'var(--warning-foreground)',
  info: 'var(--info)',
  infoForeground: 'var(--info-foreground)',
}

/**
 * 默认标签颜色
 */
export const DEFAULT_TAG_COLOR = 'var(--default-tag)'

/**
 * 图表颜色
 */
export const CHART_COLORS = {
  primary: 'var(--chart-primary)',
  secondary: 'var(--chart-secondary)',
}

import type { Tag } from '@/lib/types'

/**
 * 默认标签定义
 */
export const DEFAULT_TAGS: Tag[] = [
  { id: 'tag-study', name: '学习', color: TAG_COLORS.blue },
  { id: 'tag-exercise', name: '运动', color: TAG_COLORS.green },
  { id: 'tag-rest', name: '休息', color: TAG_COLORS.amber },
  { id: 'tag-social', name: '社交', color: TAG_COLORS.pink },
]
