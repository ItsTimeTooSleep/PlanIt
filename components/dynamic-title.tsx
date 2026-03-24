'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { useStore, useLanguage } from '@/lib/store'
import { timeToMinutes } from '@/lib/task-utils'
import type { Task } from '@/lib/types'

interface CurrentTaskInfo {
  task: Task
  type: 'current' | 'next'
  endTime?: string
  startTime?: string
  remainingMinutes?: number
}

interface TaskAnalysis {
  currentTaskInfo: CurrentTaskInfo | null
  overdueCount: number
}

function analyzeTasks(tasks: Task[], now: Date): TaskAnalysis {
  const today = format(now, 'yyyy-MM-dd')
  const nowMinutes = now.getHours() * 60 + now.getMinutes()

  const todayTasks = tasks
    .filter(task => task.date === today && !task.isAllDay && task.status === 'pending')
    .sort((a, b) => {
      const aStart = a.startTime ? timeToMinutes(a.startTime) : 0
      const bStart = b.startTime ? timeToMinutes(b.startTime) : 0
      return aStart - bStart
    })

  let currentTaskInfo: CurrentTaskInfo | null = null
  let overdueCount = 0

  for (const task of todayTasks) {
    if (!task.startTime || !task.endTime) continue
    
    const startMinutes = timeToMinutes(task.startTime)
    const endMinutes = timeToMinutes(task.endTime)
    
    if (nowMinutes >= startMinutes && nowMinutes < endMinutes) {
      currentTaskInfo = {
        task,
        type: 'current',
        endTime: task.endTime,
        remainingMinutes: endMinutes - nowMinutes
      }
    } else if (endMinutes <= nowMinutes) {
      overdueCount++
    }
  }

  if (!currentTaskInfo) {
    for (const task of todayTasks) {
      if (!task.startTime || !task.endTime) continue
      
      const startMinutes = timeToMinutes(task.startTime)
      
      if (startMinutes > nowMinutes) {
        currentTaskInfo = {
          task,
          type: 'next',
          startTime: task.startTime,
          remainingMinutes: startMinutes - nowMinutes
        }
        break
      }
    }
  }

  return { currentTaskInfo, overdueCount }
}

function formatTitle(analysis: TaskAnalysis, lang: 'zh' | 'en'): string {
  const { currentTaskInfo, overdueCount } = analysis

  if (!currentTaskInfo) {
    if (overdueCount > 0) {
      return lang === 'zh' 
        ? `PlanIt — 暂无任务（${overdueCount}项过期待处理）` 
        : `PlanIt — No tasks (${overdueCount} overdue)`
    }
    return lang === 'zh' ? 'PlanIt — 暂无任务' : 'PlanIt — No tasks'
  }

  const { task, type, remainingMinutes } = currentTaskInfo

  if (type === 'current') {
    const timeStr = remainingMinutes !== undefined 
      ? (lang === 'zh' ? `${remainingMinutes}分钟后结束` : `ends in ${remainingMinutes}m`)
      : ''
    return `${task.title} — ${timeStr} | PlanIt`
  } else {
    const timeStr = currentTaskInfo.startTime || ''
    return lang === 'zh' 
      ? `下一个: ${task.title} (${timeStr}开始) | PlanIt`
      : `Next: ${task.title} (starts ${timeStr}) | PlanIt`
  }
}

export function DynamicTitle() {
  const lang = useLanguage()
  const { state } = useStore()
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const analysis = analyzeTasks(state.tasks, now)
    const title = formatTitle(analysis, lang)
    document.title = title
  }, [state.tasks, now, lang])

  return null
}
