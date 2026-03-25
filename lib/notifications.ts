'use client'

import type { Task, NotificationSettings } from './types'
import { isDesktop } from './platform'

const LOG_PREFIX = '[PlanIt Notification]'

interface ScheduledNotification {
  advanceTimeoutId?: ReturnType<typeof setTimeout>
  startTimeoutId?: ReturnType<typeof setTimeout>
  endTimeoutId?: ReturnType<typeof setTimeout>
}

const scheduledIds: Map<string, ScheduledNotification> = new Map()
let permissionChecked = false

async function checkAndRequestPermission(): Promise<boolean> {
  if (isDesktop()) {
    try {
      const { isPermissionGranted, requestPermission } = await import('@tauri-apps/plugin-notification')
      
      let granted = await isPermissionGranted()
      console.log(`${LOG_PREFIX} Tauri notification permission status:`, granted)
      
      if (!granted) {
        console.log(`${LOG_PREFIX} Requesting Tauri notification permission...`)
        const permission = await requestPermission()
        granted = permission === 'granted'
        console.log(`${LOG_PREFIX} Tauri permission request result:`, permission)
      }
      
      return granted
    } catch (error) {
      console.error(`${LOG_PREFIX} Error checking/requesting Tauri permission:`, error)
      return false
    }
  } else {
    if (!('Notification' in window)) {
      console.warn(`${LOG_PREFIX} Notification API not supported in this browser`)
      return false
    }
    
    const permission = Notification.permission
    console.log(`${LOG_PREFIX} Browser notification permission:`, permission)
    
    if (permission === 'granted') {
      return true
    }
    
    if (permission === 'denied') {
      console.warn(`${LOG_PREFIX} Browser notification permission denied`)
      return false
    }
    
    console.log(`${LOG_PREFIX} Requesting browser notification permission...`)
    const result = await Notification.requestPermission()
    console.log(`${LOG_PREFIX} Browser permission request result:`, result)
    return result === 'granted'
  }
}

async function showNotification(title: string, body: string, tag: string): Promise<void> {
  console.log(`${LOG_PREFIX} Attempting to show notification:`, { title, body, tag })
  
  if (!permissionChecked) {
    console.log(`${LOG_PREFIX} First notification, checking permission...`)
    const hasPermission = await checkAndRequestPermission()
    permissionChecked = true
    if (!hasPermission) {
      console.error(`${LOG_PREFIX} No permission to show notifications`)
      return
    }
  }
  
  if (isDesktop()) {
    try {
      const { sendNotification } = await import('@tauri-apps/plugin-notification')
      console.log(`${LOG_PREFIX} Sending Tauri notification via plugin...`)
      sendNotification({ title, body })
      console.log(`${LOG_PREFIX} Tauri notification sent successfully`)
    } catch (error) {
      console.error(`${LOG_PREFIX} Failed to send Tauri notification:`, error)
      try {
        const { invoke } = await import('@tauri-apps/api/core')
        console.log(`${LOG_PREFIX} Falling back to custom invoke command...`)
        await invoke('show_notification', {
          title,
          body,
          icon: null,
          sound: true,
        })
        console.log(`${LOG_PREFIX} Fallback notification sent successfully`)
      } catch (fallbackError) {
        console.error(`${LOG_PREFIX} Fallback notification also failed:`, fallbackError)
      }
    }
  } else {
    console.log(`${LOG_PREFIX} Browser environment detected`)
    
    if (!('Notification' in window)) {
      console.warn(`${LOG_PREFIX} Notification API not supported in this browser`)
      return
    }
    
    const permission = Notification.permission
    console.log(`${LOG_PREFIX} Current notification permission:`, permission)
    
    if (permission !== 'granted') {
      console.warn(`${LOG_PREFIX} Notification permission not granted, cannot show notification`)
      return
    }
    
    try {
      const notification = new Notification(title, {
        body,
        icon: '/icon.svg',
        tag,
      })
      
      notification.onshow = () => {
        console.log(`${LOG_PREFIX} Notification shown successfully`)
      }
      
      notification.onerror = (event) => {
        console.error(`${LOG_PREFIX} Notification error event:`, event)
      }
      
      notification.onclick = () => {
        console.log(`${LOG_PREFIX} Notification clicked`)
        window.focus()
        notification.close()
      }
      
      notification.onclose = () => {
        console.log(`${LOG_PREFIX} Notification closed`)
      }
      
      console.log(`${LOG_PREFIX} Browser notification created:`, notification)
    } catch (error) {
      console.error(`${LOG_PREFIX} Failed to create browser notification:`, error)
    }
  }
}

export function scheduleTaskNotification(
  task: Task, 
  startTitle: string, 
  startBody?: string, 
  settings?: NotificationSettings,
  endTitle?: string,
  endBody?: string
) {
  console.log(`${LOG_PREFIX} scheduleTaskNotification called for task:`, {
    taskId: task.id,
    taskTitle: task.title,
    date: task.date,
    startTime: task.startTime,
    endTime: task.endTime,
    isAllDay: task.isAllDay,
    settings,
  })
  
  if (typeof window === 'undefined') {
    console.warn(`${LOG_PREFIX} Window is undefined (SSR), skipping notification scheduling`)
    return
  }
  
  const isDesktopEnv = isDesktop()
  console.log(`${LOG_PREFIX} Environment:`, isDesktopEnv ? 'Desktop (Tauri)' : 'Browser')
  
  if (!isDesktopEnv) {
    if (!('Notification' in window)) {
      console.warn(`${LOG_PREFIX} Notification API not supported, cannot schedule notification`)
      return
    }
    
    const permission = Notification.permission
    console.log(`${LOG_PREFIX} Browser notification permission:`, permission)
    
    if (permission !== 'granted') {
      console.warn(`${LOG_PREFIX} Permission not granted (${permission}), cannot schedule notification`)
      return
    }
  }
  
  if (task.isAllDay) {
    console.log(`${LOG_PREFIX} Task is all-day, skipping notification`)
    return
  }
  
  if (!task.startTime || !task.date) {
    console.warn(`${LOG_PREFIX} Task missing startTime or date, skipping notification`)
    return
  }

  cancelTaskNotification(task.id)
  console.log(`${LOG_PREFIX} Cancelled any existing notification for task ${task.id}`)

  const [year, month, day] = task.date.split('-').map(Number)
  const [startH, startM] = task.startTime.split(':').map(Number)
  const taskStartDate = new Date(year, month - 1, day, startH, startM, 0, 0)

  const now = Date.now()
  const scheduled: ScheduledNotification = {}
  const safeSettings = settings || { enabled: false, advanceMinutes: null, showStartNotification: false, showEndNotification: false }

  if (safeSettings.advanceMinutes !== null && safeSettings.advanceMinutes !== undefined) {
    const advanceDate = new Date(taskStartDate.getTime() - safeSettings.advanceMinutes * 60 * 1000)
    const advanceDelay = advanceDate.getTime() - now
    
    console.log(`${LOG_PREFIX} Advance notification time:`, advanceDate.toISOString())
    console.log(`${LOG_PREFIX} Advance delay:`, advanceDelay, 'ms')
    
    if (advanceDelay >= 0) {
      scheduled.advanceTimeoutId = setTimeout(() => {
        console.log(`${LOG_PREFIX} Advance timer fired for task ${task.id}, showing notification...`)
        showNotification(
          startTitle,
          startBody ?? `${task.startTime} – ${task.endTime ?? ''}`,
          `${task.id}-advance`
        ).catch((error) => {
          console.error(`${LOG_PREFIX} Error in advance showNotification promise:`, error)
        })
        const current = scheduledIds.get(task.id)
        if (current) {
          delete current.advanceTimeoutId
        }
      }, advanceDelay)
    }
  }

  if (safeSettings.showStartNotification) {
    const startDelay = taskStartDate.getTime() - now
    
    console.log(`${LOG_PREFIX} Task start time:`, taskStartDate.toISOString())
    console.log(`${LOG_PREFIX} Start delay:`, startDelay, 'ms')
    
    if (startDelay >= 0) {
      scheduled.startTimeoutId = setTimeout(() => {
        console.log(`${LOG_PREFIX} Start timer fired for task ${task.id}, showing notification...`)
        showNotification(
          startTitle,
          startBody ?? `${task.startTime} – ${task.endTime ?? ''}`,
          `${task.id}-start`
        ).catch((error) => {
          console.error(`${LOG_PREFIX} Error in start showNotification promise:`, error)
        })
        const current = scheduledIds.get(task.id)
        if (current) {
          delete current.startTimeoutId
        }
      }, startDelay)
    }
  }

  if (safeSettings.showEndNotification && task.endTime) {
    const [endH, endM] = task.endTime.split(':').map(Number)
    const taskEndDate = new Date(year, month - 1, day, endH, endM, 0, 0)
    const endDelay = taskEndDate.getTime() - now
    
    console.log(`${LOG_PREFIX} Task end time:`, taskEndDate.toISOString())
    console.log(`${LOG_PREFIX} End delay:`, endDelay, 'ms')
    
    if (endDelay >= 0) {
      scheduled.endTimeoutId = setTimeout(() => {
        console.log(`${LOG_PREFIX} End timer fired for task ${task.id}, showing notification...`)
        showNotification(
          endTitle ?? startTitle,
          endBody ?? `${task.startTime} – ${task.endTime}`,
          `${task.id}-end`
        ).catch((error) => {
          console.error(`${LOG_PREFIX} Error in end showNotification promise:`, error)
        })
        const current = scheduledIds.get(task.id)
        if (current) {
          delete current.endTimeoutId
        }
      }, endDelay)
    }
  }

  scheduledIds.set(task.id, scheduled)
  console.log(`${LOG_PREFIX} Notifications scheduled for task ${task.id}`)
  console.log(`${LOG_PREFIX} Total tasks with scheduled notifications:`, scheduledIds.size)
}

export function cancelTaskNotification(taskId: string) {
  const existing = scheduledIds.get(taskId)
  if (existing) {
    if (existing.advanceTimeoutId) clearTimeout(existing.advanceTimeoutId)
    if (existing.startTimeoutId) clearTimeout(existing.startTimeoutId)
    if (existing.endTimeoutId) clearTimeout(existing.endTimeoutId)
    scheduledIds.delete(taskId)
  }
}

export function cancelAllNotifications() {
  scheduledIds.forEach((scheduled) => {
    if (scheduled.advanceTimeoutId) clearTimeout(scheduled.advanceTimeoutId)
    if (scheduled.startTimeoutId) clearTimeout(scheduled.startTimeoutId)
    if (scheduled.endTimeoutId) clearTimeout(scheduled.endTimeoutId)
  })
  scheduledIds.clear()
}
