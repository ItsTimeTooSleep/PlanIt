import type { Task } from './types'
import { addDays, addWeeks, addMonths, addYears, format, parseISO, isAfter } from 'date-fns'

export function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function taskDurationMinutes(task: Task): number {
  if (task.isAllDay || !task.startTime || !task.endTime) return 0
  return timeToMinutes(task.endTime) - timeToMinutes(task.startTime)
}

export function taskDurationHours(task: Task): number {
  return taskDurationMinutes(task) / 60
}

/** Generate all task instances for a repeat rule, up to maxDays out */
export function expandRepeatTasks(task: Task, maxDays = 90): Task[] {
  if (task.repeatRule.frequency === 'none') return []

  const base = parseISO(task.date)
  const endDate = task.repeatRule.endDate ? parseISO(task.repeatRule.endDate) : addDays(base, maxDays)
  const instances: Task[] = []
  let current = base
  let iteration = 0

  while (iteration < 500) {
    iteration++
    // advance by frequency
    let next: Date
    switch (task.repeatRule.frequency) {
      case 'daily':
        next = addDays(current, 1)
        break
      case 'weekly':
        next = addWeeks(current, 1)
        break
      case 'monthly':
        next = addMonths(current, 1)
        break
      case 'yearly':
        next = addYears(current, 1)
        break
      default:
        return instances
    }
    current = next

    if (isAfter(current, endDate)) break

    // For weekly, only generate for matching weekdays
    if (task.repeatRule.frequency === 'weekly' && task.repeatRule.weekdays?.length) {
      if (!task.repeatRule.weekdays.includes(current.getDay())) continue
    }

    instances.push({
      ...task,
      id: generateId(),
      date: format(current, 'yyyy-MM-dd'),
      repeatRule: { frequency: 'none' },
    })
  }

  return instances
}

export function sortTasksByTime(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.isAllDay && !b.isAllDay) return -1
    if (!a.isAllDay && b.isAllDay) return 1
    if (!a.startTime || !b.startTime) return 0
    return timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  })
}

export function formatDuration(minutes: number, lang: 'zh' | 'en'): string {
  if (minutes < 60) {
    return lang === 'zh' ? `${minutes} 分钟` : `${minutes} min`
  }
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (m === 0) return lang === 'zh' ? `${h} 小时` : `${h} hr${h > 1 ? 's' : ''}`
  return lang === 'zh' ? `${h} 小时 ${m} 分钟` : `${h}h ${m}m`
}

export function getWeekDates(referenceDate: Date): Date[] {
  const day = referenceDate.getDay() // 0=Sun
  const monday = addDays(referenceDate, -day)
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i))
}

export function formatDateDisplay(date: Date, lang: 'zh' | 'en'): string {
  if (lang === 'zh') {
    return format(date, 'M月d日')
  }
  return format(date, 'MMM d')
}
