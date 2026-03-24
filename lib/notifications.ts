'use client'

import type { Task } from './types'
import { isDesktop } from './platform'

const LOG_PREFIX = '[PlanIt Notification]'

let scheduledIds: Map<string, ReturnType<typeof setTimeout>> = new Map()
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

export function scheduleTaskNotification(task: Task, title: string, body?: string) {
  console.log(`${LOG_PREFIX} scheduleTaskNotification called for task:`, {
    taskId: task.id,
    taskTitle: task.title,
    date: task.date,
    startTime: task.startTime,
    endTime: task.endTime,
    isAllDay: task.isAllDay,
    notificationTitle: title,
    notificationBody: body,
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

  const [year, month, day] = task.date.split('-').map(Number)
  const [h, m] = task.startTime.split(':').map(Number)
  const taskDate = new Date(year, month - 1, day, h, m, 0, 0)

  const now = Date.now()
  const delay = taskDate.getTime() - now
  
  console.log(`${LOG_PREFIX} Task scheduled time:`, taskDate.toISOString())
  console.log(`${LOG_PREFIX} Current time:`, new Date(now).toISOString())
  console.log(`${LOG_PREFIX} Delay until notification:`, delay, 'ms', `(${Math.round(delay / 1000)} seconds)`)
  
  if (delay < 0) {
    console.warn(`${LOG_PREFIX} Task time is in the past, skipping notification`)
    return
  }

  cancelTaskNotification(task.id)
  console.log(`${LOG_PREFIX} Cancelled any existing notification for task ${task.id}`)

  const id = setTimeout(() => {
    console.log(`${LOG_PREFIX} Timer fired for task ${task.id}, showing notification...`)
    showNotification(
      title,
      body ?? `${task.startTime} – ${task.endTime ?? ''}`,
      task.id
    ).catch((error) => {
      console.error(`${LOG_PREFIX} Error in showNotification promise:`, error)
    })
    scheduledIds.delete(task.id)
    console.log(`${LOG_PREFIX} Removed task ${task.id} from scheduled notifications`)
  }, delay)

  scheduledIds.set(task.id, id)
  console.log(`${LOG_PREFIX} Notification scheduled for task ${task.id}, timeout ID:`, id)
  console.log(`${LOG_PREFIX} Total scheduled notifications:`, scheduledIds.size)
}

export function cancelTaskNotification(taskId: string) {
  const existing = scheduledIds.get(taskId)
  if (existing !== undefined) {
    clearTimeout(existing)
    scheduledIds.delete(taskId)
  }
}

export function cancelAllNotifications() {
  scheduledIds.forEach(id => clearTimeout(id))
  scheduledIds.clear()
}
