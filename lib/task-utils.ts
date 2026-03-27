import type { Task, DeleteRecurringOption } from './types'
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

/**
 * 生成重复任务的所有实例
 * @param task - 基础任务对象
 * @param maxDays - 最大生成天数（默认90天）
 * @returns 生成的重复任务实例数组
 */
export function expandRepeatTasks(task: Task, maxDays = 90): Task[] {
  if (task.repeatRule.frequency === 'none') return []
  if (!task.date && !task.dueDate) return []

  const dateToUse = task.date || task.dueDate
  if (!dateToUse) return []

  const base = parseISO(dateToUse)
  const endDate = task.repeatRule.endDate ? parseISO(task.repeatRule.endDate) : addDays(base, maxDays)
  const instances: Task[] = []
  let current = base
  let iteration = 0

  // 计算截止日期与计划日期的相对间隔（天数）
  let dueDateOffsetDays: number | null = null
  if (task.date && task.dueDate) {
    const planDate = parseISO(task.date)
    const dueDate = parseISO(task.dueDate)
    dueDateOffsetDays = Math.floor((dueDate.getTime() - planDate.getTime()) / (1000 * 60 * 60 * 24))
  }

  while (iteration < 500) {
    iteration++
    // 根据频率推进日期
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
      case 'custom':
        // 处理自定义重复
        if (!task.repeatRule.interval || !task.repeatRule.customUnit) {
          return instances
        }
        switch (task.repeatRule.customUnit) {
          case 'days':
            next = addDays(current, task.repeatRule.interval)
            break
          case 'weeks':
            next = addWeeks(current, task.repeatRule.interval)
            break
          case 'months':
            next = addMonths(current, task.repeatRule.interval)
            break
          case 'years':
            next = addYears(current, task.repeatRule.interval)
            break
          default:
            return instances
        }
        break
      case 'workdays':
        // 跳过周末，找到下一个工作日
        next = addDays(current, 1)
        while (next.getDay() === 0 || next.getDay() === 6) {
          next = addDays(next, 1)
        }
        break
      default:
        return instances
    }
    current = next

    if (isAfter(current, endDate)) break

    // 对于周重复，只生成匹配的星期几
    if (task.repeatRule.frequency === 'weekly' && task.repeatRule.weekdays?.length) {
      if (!task.repeatRule.weekdays.includes(current.getDay())) continue
    }

    // 计算当前实例的计划日期和截止日期
    let instanceDate: string | undefined
    let instanceDueDate: string | undefined

    if (task.date) {
      instanceDate = format(current, 'yyyy-MM-dd')
      // 如果有截止日期偏移，保持相对间隔
      if (dueDateOffsetDays !== null) {
        const instanceDueDateObj = addDays(current, dueDateOffsetDays)
        instanceDueDate = format(instanceDueDateObj, 'yyyy-MM-dd')
      }
    } else if (task.dueDate) {
      // 只有截止日期的情况
      instanceDueDate = format(current, 'yyyy-MM-dd')
    }

    instances.push({
      ...task,
      id: generateId(),
      date: instanceDate,
      dueDate: instanceDueDate,
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

/**
 * 获取与指定任务属于同一重复组的所有任务ID
 * @param currentTask - 当前任务对象
 * @param allTasks - 所有任务数组
 * @returns 同一重复组的任务ID数组
 */
export function getRecurringTaskIds(currentTask: Task, allTasks: Task[]): string[] {
  const baseCreatedAt = currentTask.createdAt.slice(0, 19)
  return allTasks
    .filter(t => {
      // 匹配条件：标题相同，且创建时间前19位相同（去掉毫秒）
      const titleMatch = t.title === currentTask.title
      const createdAtMatch = t.createdAt.slice(0, 19) === baseCreatedAt
      return titleMatch && createdAtMatch
    })
    .map(t => t.id)
}

/**
 * 根据删除选项筛选需要删除的任务ID
 * @param currentTask - 当前任务对象
 * @param allTasks - 所有任务数组
 * @param option - 删除选项
 * @returns 需要删除的任务ID数组
 */
export function getTaskIdsToDelete(
  currentTask: Task, 
  allTasks: Task[], 
  option: DeleteRecurringOption
): string[] {
  if (option === 'only_this') {
    return [currentTask.id]
  }

  const allRecurringIds = getRecurringTaskIds(currentTask, allTasks)
  const today = format(new Date(), 'yyyy-MM-dd')

  // 如果只有当前任务一个（是原始重复任务），直接根据选项判断
  if (allRecurringIds.length === 1) {
    switch (option) {
      case 'all':
        return [currentTask.id]
      case 'future': {
        const taskDate = currentTask.date || currentTask.dueDate
        if (!taskDate) return [currentTask.id]
        return taskDate >= today ? [currentTask.id] : []
      }
      case 'pending':
        return currentTask.status === 'pending' ? [currentTask.id] : []
      default:
        return [currentTask.id]
    }
  }

  return allRecurringIds.filter(id => {
    const task = allTasks.find(t => t.id === id)
    if (!task) return false

    switch (option) {
      case 'all':
        return true
      case 'future': {
        const taskDate = task.date || task.dueDate
        if (!taskDate) return true
        return taskDate >= today
      }
      case 'pending':
        return task.status === 'pending'
      default:
        return false
    }
  })
}

/**
 * 检查任务是否属于重复任务组（或本身是重复任务）
 * @param currentTask - 当前任务对象
 * @param allTasks - 所有任务数组
 * @returns 是否显示重复任务删除选项
 */
export function isPartOfRecurringGroup(currentTask: Task, allTasks: Task[]): boolean {
  // 方案1：当前任务本身有重复规则
  if (currentTask.repeatRule.frequency !== 'none') {
    return true
  }
  
  // 方案2：有其他任务和当前任务有相同的创建时间前缀和标题（属于同一重复组）
  const baseCreatedAt = currentTask.createdAt.slice(0, 19)
  const hasMatchingTasks = allTasks.some(t => 
    t.id !== currentTask.id && 
    t.title === currentTask.title && 
    t.createdAt.slice(0, 19) === baseCreatedAt
  )
  
  return hasMatchingTasks
}
