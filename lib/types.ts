export type TaskStatus = 'pending' | 'completed' | 'skipped'
export type RepeatFrequency = 'none' | 'daily' | 'workdays' | 'weekly' | 'monthly' | 'yearly' | 'custom'
export type Language = 'zh' | 'en'
export type PomodoroPhase = 'work' | 'shortBreak' | 'longBreak'
export type PomodoroStatus = 'idle' | 'running' | 'paused' | 'finished'
export type NoteStatus = 'active' | 'completed'
export type NoteColor = 'yellow' | 'pink' | 'blue' | 'green' | 'purple' | 'orange'
export type NoteLineType = 'straight' | 'arrow'
export type NoteLineColor = 'gray' | 'red' | 'blue' | 'green' | 'purple' | 'orange'
export type DeleteRecurringOption = 'only_this' | 'all' | 'future' | 'pending'

export interface Tag {
  id: string
  name: string
  color: string // hex color, e.g. "#4F46E5"
}

export interface DateNote {
  id: string
  date: string       // YYYY-MM-DD
  content: string    // 备注内容
  createdAt: string  // ISO timestamp
  updatedAt: string  // ISO timestamp
}

export interface Note {
  id: string
  date: string       // YYYY-MM-DD
  title: string
  content: string    // 富文本内容
  color: NoteColor
  status: NoteStatus
  width: number      // 卡片宽度 (像素)
  height: number     // 卡片高度 (像素)
  x: number          // 卡片 x 坐标
  y: number          // 卡片 y 坐标
  zIndex: number     // 卡片层级，用于重叠时的排序
  createdAt: string  // ISO timestamp
  updatedAt: string  // ISO timestamp
}

export interface NoteLine {
  id: string
  date: string       // YYYY-MM-DD
  fromNoteId: string
  toNoteId: string
  type: NoteLineType
  color: NoteLineColor
  createdAt: string  // ISO timestamp
}

export interface RepeatRule {
  frequency: RepeatFrequency
  weekdays?: number[] // 0=Sun, 1=Mon ... 6=Sat (for weekly)
  endDate?: string    // YYYY-MM-DD
  interval?: number   // for custom: every X days/weeks/months/years
  customUnit?: 'days' | 'weeks' | 'months' | 'years' // for custom
}

export interface CalendarSettings {
  dayStartTime: number  // hour (0-23)
  dayEndTime: number    // hour (0-23)
  hourDivisions: number // number of divisions per hour
  hourHeight: number    // height per hour in pixels
  timeSnap: number      // time snap precision in minutes (1, 5, 10, 15)
  snapEnabled: boolean  // whether smart snap is enabled
  snapThreshold: number // snap threshold in minutes (default 10)
}

export interface Task {
  id: string
  title: string
  date?: string      // YYYY-MM-DD (计划日期，可选但至少一个)
  dueDate?: string   // YYYY-MM-DD (截止日期，可选但至少一个)
  startTime?: string // HH:mm (undefined if allDay)
  endTime?: string   // HH:mm (undefined if allDay)
  isAllDay: boolean
  tagIds: string[]
  repeatRule: RepeatRule
  notes?: string
  status: TaskStatus
  createdAt: string  // ISO timestamp
}

export type CloseBehavior = 'exit' | 'tray'
export type StartupPage = '/home' | '/calendar' | '/todo' | '/note' | '/stats' | '/settings'

export interface NotificationSettings {
  enabled: boolean
  advanceMinutes: number | null // null 表示不提前通知
  showStartNotification: boolean
  showEndNotification: boolean
}

export interface SoundSettings {
  enabled: boolean
  playOnTaskStart: boolean
  playOnTaskEnd: boolean
  playOnTaskComplete: boolean
}

export interface AppSettings {
  language: Language
  notifications: NotificationSettings
  calendar: CalendarSettings
  closeBehavior: CloseBehavior
  sound: SoundSettings
  startupPage: StartupPage
  firstLaunchDate?: string
}

export interface PomodoroSettings {
  workDuration: number
  shortBreakDuration: number
  longBreakDuration: number
  workSessionsBeforeLongBreak: number
  autoStartBreaks: boolean
  autoStartWork: boolean
}

export interface PomodoroState {
  taskId: string | null
  status: PomodoroStatus
  phase: PomodoroPhase
  remainingSeconds: number
  totalSeconds: number
  completedSessions: number
  settings: PomodoroSettings
}

export interface AppState {
  tasks: Task[]
  tags: Tag[]
  dateNotes: DateNote[]
  notes: Note[]
  noteLines: NoteLine[]
  settings: AppSettings
  pomodoro: PomodoroState
}

export interface ExportDataMeta {
  version: string
  exportDate: string
  appName: string
}

export interface ExportData {
  meta: ExportDataMeta
  data: AppState
}

export interface ImportOptions {
  tasks: boolean
  tags: boolean
  dateNotes: boolean
  notes: boolean
  noteLines: boolean
  settings: boolean
  pomodoro: boolean
}

export interface TaskFormValues {
  title: string
  date: string
  startTime: string
  endTime: string
  isAllDay: boolean
  tagIds: string[]
  repeatRule: RepeatRule
  notes: string
  status: TaskStatus
}
