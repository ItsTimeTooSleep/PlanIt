'use client'

import type { ComponentType } from 'react'
import type {
  WidgetType,
  WidgetCategory,
  WidgetMetadata,
  BaseWidgetProps,
  DEFAULT_WIDGET_CONFIGS,
} from './widget-types'

export const WIDGET_METADATA: Record<WidgetType, WidgetMetadata> = {
  calculator: {
    type: 'calculator',
    name: 'Calculator',
    nameZh: '计算器',
    description: 'A simple calculator with basic operations',
    descriptionZh: '支持基本运算的计算器',
    icon: 'Calculator',
    category: 'tools',
    defaultSize: { width: 280, height: 380 },
    minSize: { width: 180, height: 240 },
    maxSize: { width: 500, height: 600 },
    defaultConfig: {
      showHistory: true,
      maxHistoryItems: 10,
    },
  },
  spinWheel: {
    type: 'spinWheel',
    name: 'Spin Wheel',
    nameZh: '随机转盘',
    description: 'A customizable spin wheel for random selection',
    descriptionZh: '可自定义选项的随机转盘',
    icon: 'CircleDot',
    category: 'tools',
    defaultSize: { width: 320, height: 400 },
    minSize: { width: 200, height: 250 },
    maxSize: { width: 550, height: 650 },
    defaultConfig: {
      options: ['选项1', '选项2', '选项3', '选项4'],
      spinDuration: 4000,
      showHistory: true,
      maxHistoryItems: 5,
    },
  },
  quote: {
    type: 'quote',
    name: 'Quote',
    nameZh: '名言警句',
    description: 'Display random inspirational quotes',
    descriptionZh: '展示随机名言警句',
    icon: 'Quote',
    category: 'info',
    defaultSize: { width: 300, height: 200 },
    minSize: { width: 200, height: 100 },
    maxSize: { width: 600, height: 400 },
    defaultConfig: {
      category: 'all',
      autoRefresh: false,
      refreshInterval: 300,
      showCategory: true,
      showNavigation: true,
      showCopyButton: true,
    },
  },
  timer: {
    type: 'timer',
    name: 'Timer',
    nameZh: '计时器',
    description: 'Countdown and stopwatch timer',
    descriptionZh: '倒计时和正计时功能',
    icon: 'Timer',
    category: 'productivity',
    defaultSize: { width: 280, height: 280 },
    minSize: { width: 180, height: 180 },
    maxSize: { width: 500, height: 500 },
    defaultConfig: {
      mode: 'stopwatch',
      defaultTime: 300,
      savedTime: 0,
      showPresets: true,
      showModeSwitch: true,
      maxPresets: 5,
      soundEnabled: true,
    },
  },
  search: {
    type: 'search',
    name: 'Search',
    nameZh: '搜索框',
    description: 'Quick search with multiple engines',
    descriptionZh: '支持多搜索引擎的快捷搜索',
    icon: 'Search',
    category: 'tools',
    defaultSize: { width: 320, height: 120 },
    minSize: { width: 240, height: 60 },
    maxSize: { width: 700, height: 200 },
    defaultConfig: {
      defaultEngine: 'google',
      searchHistory: [],
      maxHistory: 10,
      showQuickButtons: true,
      showHistoryPanel: true,
    },
  },
  todo: {
    type: 'todo',
    name: 'Todo',
    nameZh: '待办事项',
    description: 'Quick view of your tasks',
    descriptionZh: '待办事项快速视图',
    icon: 'CheckSquare',
    category: 'productivity',
    defaultSize: { width: 320, height: 300 },
    minSize: { width: 200, height: 150 },
    maxSize: { width: 550, height: 600 },
    defaultConfig: {
      showOverdue: true,
      showTags: true,
      showTime: true,
      maxItems: 10,
      showHeader: true,
    },
  },
  note: {
    type: 'note',
    name: 'Quick Note',
    nameZh: '快速笔记',
    description: 'Quickly capture your thoughts',
    descriptionZh: '快速记录你的想法',
    icon: 'StickyNote',
    category: 'productivity',
    defaultSize: { width: 300, height: 180 },
    minSize: { width: 180, height: 100 },
    maxSize: { width: 500, height: 400 },
    defaultConfig: {
      showHeader: true,
      maxLength: 1000,
      autoSave: false,
    },
  },
  pomodoro: {
    type: 'pomodoro',
    name: 'Pomodoro',
    nameZh: '番茄钟',
    description: 'Pomodoro timer for focus',
    descriptionZh: '专注番茄钟计时器',
    icon: 'Clock',
    category: 'productivity',
    defaultSize: { width: 280, height: 320 },
    minSize: { width: 180, height: 200 },
    maxSize: { width: 450, height: 500 },
    defaultConfig: {
      showTask: true,
      showSessionCount: true,
      showSettings: false,
    },
  },
  progress: {
    type: 'progress',
    name: 'Progress',
    nameZh: '进度条',
    description: 'Daily task progress',
    descriptionZh: '今日任务完成进度',
    icon: 'BarChart3',
    category: 'info',
    defaultSize: { width: 280, height: 100 },
    minSize: { width: 180, height: 50 },
    maxSize: { width: 500, height: 200 },
    defaultConfig: {
      showPercentage: true,
      showCount: true,
      showIcon: true,
      showDetailedStats: true,
    },
  },
  currentTask: {
    type: 'currentTask',
    name: 'Current Task',
    nameZh: '当前任务',
    description: 'Display current task',
    descriptionZh: '显示当前进行中的任务',
    icon: 'Target',
    category: 'productivity',
    defaultSize: { width: 300, height: 150 },
    minSize: { width: 200, height: 80 },
    maxSize: { width: 550, height: 300 },
    defaultConfig: {
      showTimeRemaining: true,
      showTags: true,
      showNotes: true,
      showProgress: true,
    },
  },
  datetime: {
    type: 'datetime',
    name: 'Date & Time',
    nameZh: '日期时间',
    description: 'Display current date and time',
    descriptionZh: '显示当前日期和时间',
    icon: 'Calendar',
    category: 'info',
    defaultSize: { width: 400, height: 70 },
    minSize: { width: 250, height: 40 },
    maxSize: { width: 700, height: 150 },
    defaultConfig: {
      showSeconds: true,
      showDate: true,
      showWeekday: true,
      showYear: false,
      timeFormat: '24',
      lang: 'zh',
    },
  },
  timeline: {
    type: 'timeline',
    name: 'Timeline',
    nameZh: '时间轴',
    description: 'Daily timeline view',
    descriptionZh: '今日时间轴视图',
    icon: 'GanttChart',
    category: 'productivity',
    defaultSize: { width: 500, height: 400 },
    minSize: { width: 280, height: 200 },
    maxSize: { width: 900, height: 700 },
    defaultConfig: {
      showHourLabels: true,
      showCurrentTimeLine: true,
      showTaskDetails: true,
      autoScroll: true,
    },
  },
  line: {
    type: 'line',
    name: 'Line',
    nameZh: '线条',
    description: 'Decorative line separator',
    descriptionZh: '装饰性线条分隔符',
    icon: 'Minus',
    category: 'decoration',
    defaultSize: { width: 200, height: 20 },
    minSize: { width: 50, height: 4 },
    maxSize: { width: 1000, height: 50 },
    defaultConfig: {
      color: '#888888',
      thickness: 2,
      opacity: 100,
      style: 'solid',
    },
  },
  text: {
    type: 'text',
    name: 'Text',
    nameZh: '文本',
    description: 'Customizable text block',
    descriptionZh: '可自定义的文本块',
    icon: 'Type',
    category: 'decoration',
    defaultSize: { width: 200, height: 80 },
    minSize: { width: 80, height: 30 },
    maxSize: { width: 800, height: 500 },
    defaultConfig: {
      content: '',
      fontSize: 16,
      fontWeight: 'normal',
      textAlign: 'left',
      color: '#333333',
      backgroundColor: 'transparent',
    },
  },
  countdown: {
    type: 'countdown',
    name: 'Countdown',
    nameZh: '目标日期',
    description: 'Countdown to a target date',
    descriptionZh: '目标日期倒计时',
    icon: 'CalendarClock',
    category: 'info',
    defaultSize: { width: 280, height: 120 },
    minSize: { width: 180, height: 80 },
    maxSize: { width: 500, height: 250 },
    defaultConfig: {
      targetDate: new Date().toISOString().split('T')[0],
      name: '目标日期',
      showIcon: true,
    },
  },
}

export const WIDGET_CATEGORIES: Record<WidgetCategory, { name: string; nameZh: string }> = {
  tools: { name: 'Tools', nameZh: '工具' },
  info: { name: 'Information', nameZh: '信息' },
  productivity: { name: 'Productivity', nameZh: '效率' },
  decoration: { name: 'Decoration', nameZh: '装饰' },
}

export const CATEGORY_ORDER: WidgetCategory[] = ['productivity', 'tools', 'info', 'decoration']

export function getWidgetsByCategory(category: WidgetCategory): WidgetMetadata[] {
  return Object.values(WIDGET_METADATA).filter((meta) => meta.category === category)
}

export function getWidgetMetadata(type: WidgetType): WidgetMetadata {
  return WIDGET_METADATA[type]
}

export function getAllWidgetTypes(): WidgetType[] {
  return Object.keys(WIDGET_METADATA) as WidgetType[]
}

export function getDefaultConfig(type: WidgetType): Record<string, unknown> {
  const meta = WIDGET_METADATA[type]
  return meta.defaultConfig
}

let widgetComponents: Partial<Record<WidgetType, ComponentType<BaseWidgetProps>>> = {}

export function registerWidget(type: WidgetType, component: ComponentType<BaseWidgetProps>): void {
  widgetComponents[type] = component
}

export function getWidgetComponent(type: WidgetType): ComponentType<BaseWidgetProps> | undefined {
  return widgetComponents[type]
}

export function clearWidgetComponents(): void {
  widgetComponents = {}
}
