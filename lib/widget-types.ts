export type WidgetType =
  | 'calculator'
  | 'spinWheel'
  | 'quote'
  | 'timer'
  | 'search'
  | 'todo'
  | 'note'
  | 'pomodoro'
  | 'progress'
  | 'currentTask'
  | 'datetime'
  | 'timeline'
  | 'line'
  | 'text'
  | 'countdown';

export type WidgetCategory = 'tools' | 'info' | 'productivity' | 'decoration';

export type TimerMode = 'countdown' | 'stopwatch';

export type QuoteCategory = 'motivational' | 'philosophical' | 'learning' | 'life' | 'all';

export type SearchEngine = 'google' | 'bing' | 'baidu' | 'duckduckgo';

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface PercentPosition {
  x: number;
  y: number;
}

export interface PercentSize {
  width: number;
  height: number;
}

export interface CanvasSize {
  width: number;
  height: number;
}

export interface WidgetInstance {
  id: string;
  type: WidgetType;
  position: PercentPosition;
  size: PercentSize;
  zIndex: number;
  config: Record<string, unknown>;
  collapsed?: boolean;
  actualHeight?: number;
  locked?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WidgetLayout {
  id: string;
  name: string;
  canvas: CanvasSize;
  widgets: WidgetInstance[];
  createdAt: string;
  updatedAt: string;
}

export interface WidgetMetadata {
  type: WidgetType;
  name: string;
  nameZh: string;
  description: string;
  descriptionZh: string;
  icon: string;
  category: WidgetCategory;
  defaultSize: Size;
  minSize: Size;
  maxSize: Size;
  defaultConfig: Record<string, unknown>;
}

export interface BaseWidgetProps {
  id: string;
  config: Record<string, unknown>;
  onConfigChange?: (config: Partial<Record<string, unknown>>) => void;
  onRemove?: () => void;
  onCollapsedChange?: (collapsed: boolean, actualHeight?: number) => void;
  onTaskClick?: (task: import('./types').Task) => void;
  onTaskToggle?: (task: import('./types').Task) => void;
  onOpenCreate?: (startMin?: number) => void;
  className?: string;
}

export interface CalculatorConfig {
  showHistory?: boolean;
  maxHistoryItems?: number;
}

export interface SpinWheelConfig {
  options?: string[];
  spinDuration?: number;
  showHistory?: boolean;
  maxHistoryItems?: number;
}

export interface QuoteConfig {
  category?: QuoteCategory;
  autoRefresh?: boolean;
  refreshInterval?: number;
  showCategory?: boolean;
  showNavigation?: boolean;
  showCopyButton?: boolean;
}

export interface TimerConfig {
  mode?: TimerMode;
  defaultTime?: number;
  savedTime?: number;
  showPresets?: boolean;
  showModeSwitch?: boolean;
  maxPresets?: number;
  soundEnabled?: boolean;
}

export interface SearchConfig {
  defaultEngine?: SearchEngine;
  searchHistory?: string[];
  maxHistory?: number;
  showQuickButtons?: boolean;
  showHistoryPanel?: boolean;
  placeholder?: string;
}

export interface SearchEngineConfig {
  id: SearchEngine;
  name: string;
  icon: string;
  searchUrl: string;
}

export interface TodoConfig {
  showOverdue?: boolean;
  showTags?: boolean;
  showTime?: boolean;
  maxItems?: number;
  showHeader?: boolean;
}

export interface NoteConfig {
  showHeader?: boolean;
  placeholder?: string;
  autoSave?: boolean;
  maxLength?: number;
}

export interface PomodoroConfig {
  showTask?: boolean;
  showSessionCount?: boolean;
  showSettings?: boolean;
}

export interface ProgressConfig {
  showPercentage?: boolean;
  showCount?: boolean;
  showIcon?: boolean;
  showDetailedStats?: boolean;
  progressHeight?: number;
}

export interface CurrentTaskConfig {
  showTimeRemaining?: boolean;
  showTags?: boolean;
  showNotes?: boolean;
  showProgress?: boolean;
}

export interface DateTimeConfig {
  showSeconds?: boolean;
  showDate?: boolean;
  showWeekday?: boolean;
  showYear?: boolean;
  timeFormat?: '12' | '24';
  lang?: 'zh' | 'en';
}

export interface TimelineConfig {
  showHourLabels?: boolean;
  showCurrentTimeLine?: boolean;
  showTaskDetails?: boolean;
  autoScroll?: boolean;
  hourHeight?: number;
}

export interface LineConfig {
  color?: string;
  thickness?: number;
  opacity?: number;
  style?: 'solid' | 'dashed' | 'dotted';
}

export interface TextConfig {
  content?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'medium' | 'semibold' | 'bold';
  textAlign?: 'left' | 'center' | 'right';
  color?: string;
  backgroundColor?: string;
}

export interface CountdownConfig {
  targetDate?: string;
  name?: string;
  showIcon?: boolean;
  isJourneyMode?: boolean;
}

export const SEARCH_ENGINES: SearchEngineConfig[] = [
  {
    id: 'google',
    name: 'Google',
    icon: 'G',
    searchUrl: 'https://www.google.com/search?q=',
  },
  {
    id: 'bing',
    name: 'Bing',
    icon: 'B',
    searchUrl: 'https://www.bing.com/search?q=',
  },
  {
    id: 'baidu',
    name: '百度',
    icon: '度',
    searchUrl: 'https://www.baidu.com/s?wd=',
  },
  {
    id: 'duckduckgo',
    name: 'DuckDuckGo',
    icon: 'D',
    searchUrl: 'https://duckduckgo.com/?q=',
  },
];

export const QUOTES: Record<QuoteCategory, Array<{ text: string; author: string }>> = {
  motivational: [
    { text: '成功不是终点，失败也不是终结，唯有继续前行的勇气才是最重要的。', author: '温斯顿·丘吉尔' },
    { text: '不要等待机会，而要创造机会。', author: '林肯' },
    { text: '生命中最伟大的光辉不在于永不坠落，而是坠落后总能再度升起。', author: '曼德拉' },
    { text: '你的时间有限，不要浪费在过别人的生活上。', author: '史蒂夫·乔布斯' },
    { text: '成功的秘诀就是每天都比别人多努力一点。', author: '台湾谚语' },
    { text: '梦想还是要有的，万一实现了呢？', author: '马云' },
    { text: '世上无难事，只要肯攀登。', author: '毛泽东' },
    { text: '行动是治愈恐惧的良药，而犹豫、拖延将不断滋养恐惧。', author: '威廉·詹姆斯' },
  ],
  philosophical: [
    { text: '我思故我在。', author: '笛卡尔' },
    { text: '人生就像骑自行车，要保持平衡就得不断前进。', author: '爱因斯坦' },
    { text: '知之为知之，不知为不知，是知也。', author: '孔子' },
    { text: '未经审视的人生不值得过。', author: '苏格拉底' },
    { text: '存在即合理。', author: '黑格尔' },
    { text: '人是生而自由的，却无往不在枷锁之中。', author: '卢梭' },
    { text: '世界上只有一种英雄主义，那就是认清生活的真相后依然热爱生活。', author: '罗曼·罗兰' },
    { text: '人生而自由，却无往不在枷锁之中。', author: '卢梭' },
  ],
  learning: [
    { text: '学而不思则罔，思而不学则殆。', author: '孔子' },
    { text: '读书破万卷，下笔如有神。', author: '杜甫' },
    { text: '三人行，必有我师焉。', author: '孔子' },
    { text: '学习永远不晚。', author: '高尔基' },
    { text: '知识就是力量。', author: '培根' },
    { text: '书山有路勤为径，学海无涯苦作舟。', author: '韩愈' },
    { text: '读一本好书，就是和许多高尚的人谈话。', author: '歌德' },
    { text: '活到老，学到老。', author: '中国谚语' },
  ],
  life: [
    { text: '生活不是等待暴风雨过去，而是学会在雨中跳舞。', author: '维维安·格林' },
    { text: '简单是终极的复杂。', author: '达·芬奇' },
    { text: '幸福不是得到你想要的一切，而是享受你现在拥有的一切。', author: '佚名' },
    { text: '人生最大的荣耀不在于从不跌倒，而在于每次跌倒后都能爬起来。', author: '孔子' },
    { text: '时间会证明一切，但你要先给它时间。', author: '佚名' },
    { text: '不要因为走得太远，而忘记为什么出发。', author: '纪伯伦' },
    { text: '人生没有彩排，每一天都是现场直播。', author: '佚名' },
    { text: '最好的时光是现在。', author: '佚名' },
  ],
  all: [],
};

QUOTES.all = [
  ...QUOTES.motivational,
  ...QUOTES.philosophical,
  ...QUOTES.learning,
  ...QUOTES.life,
];

export const DEFAULT_WIDGET_CONFIGS: Record<WidgetType, Record<string, unknown>> = {
  calculator: { showHistory: true, maxHistoryItems: 10 },
  spinWheel: { options: ['选项1', '选项2', '选项3', '选项4'], spinDuration: 4000, showHistory: true, maxHistoryItems: 5 },
  quote: { category: 'all' as QuoteCategory, autoRefresh: false, refreshInterval: 300, showCategory: true, showNavigation: true, showCopyButton: true },
  timer: { mode: 'stopwatch' as TimerMode, defaultTime: 300, savedTime: 0, showPresets: true, showModeSwitch: true, maxPresets: 5, soundEnabled: true },
  search: { defaultEngine: 'google' as SearchEngine, searchHistory: [], maxHistory: 10, showQuickButtons: true, showHistoryPanel: true },
  todo: { showOverdue: true, showTags: true, showTime: true, maxItems: 10, showHeader: true },
  note: { showHeader: true, maxLength: 1000, autoSave: false },
  pomodoro: { showTask: true, showSessionCount: true, showSettings: false },
  progress: { showPercentage: true, showCount: true, showIcon: true, showDetailedStats: true },
  currentTask: { showTimeRemaining: true, showTags: true, showNotes: true, showProgress: true },
  datetime: { showSeconds: true, showDate: true, showWeekday: true, showYear: false, timeFormat: '24', lang: 'zh' },
  timeline: { showHourLabels: true, showCurrentTimeLine: true, showTaskDetails: true, autoScroll: true },
  line: { color: '#888888', thickness: 2, opacity: 100, style: 'solid' },
  text: { content: '', fontSize: 16, fontWeight: 'normal', textAlign: 'left', color: '#333333', backgroundColor: 'transparent' },
  countdown: { targetDate: new Date().toISOString().split('T')[0], name: '目标日期', showIcon: true, isJourneyMode: true },
};
