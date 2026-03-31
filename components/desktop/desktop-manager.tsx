'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SystemTrayManager } from '@/components/desktop'
import { usePlatform, useDesktopOnly } from '@/components/platform-provider'
import { usePomodoroDialog } from '@/lib/pomodoro-context'
import { useStore } from '@/lib/store'
import type { TrayMenuState } from '@/lib/platform'
import { TaskModal } from '@/components/task-modal'

/**
 * 桌面端管理组件
 * 处理系统托盘事件和桌面端特有功能
 */
export function DesktopManager() {
  const shouldRender = useDesktopOnly()
  const router = useRouter()
  const { api } = usePlatform()
  const { startPomodoro, startShortBreak, startLongBreak, stopPomodoro } = usePomodoroDialog()
  const { state } = useStore()
  const { pomodoro } = state
  
  const [focusModeActive, setFocusModeActive] = useState(false)
  const [windowVisible, setWindowVisible] = useState(true)
  const [taskModalOpen, setTaskModalOpen] = useState(false)

  useEffect(() => {
    if (!api) return
    
    const checkFocusMode = async () => {
      try {
        const isActive = await api.isFocusModeActive()
        setFocusModeActive(isActive)
      } catch (error) {
        console.error('[DesktopManager] Failed to check focus mode:', error)
      }
    }
    
    checkFocusMode()
  }, [api])

  useEffect(() => {
    if (!api) return
    
    const updateMenu = async () => {
      const menuState: TrayMenuState = {
        pomodoroRunning: pomodoro.status === 'running' || pomodoro.status === 'paused',
        pomodoroPhase: pomodoro.phase,
        focusModeActive,
        windowVisible,
      }
      
      try {
        await api.updateTrayMenu(menuState)
      } catch (error) {
        console.error('[DesktopManager] Failed to update tray menu:', error)
      }
    }
    
    updateMenu()
  }, [api, pomodoro.status, pomodoro.phase, focusModeActive, windowVisible])

  const handleShowWindow = useCallback(async () => {
    if (!api) return
    setWindowVisible(true)
  }, [api])

  const handleHideWindow = useCallback(async () => {
    if (!api) return
    setWindowVisible(false)
  }, [api])

  const handleStartPomodoro = useCallback(() => {
    startPomodoro()
  }, [startPomodoro])

  const handleStopPomodoro = useCallback(() => {
    stopPomodoro()
  }, [stopPomodoro])

  const handleShortBreak = useCallback(() => {
    startShortBreak()
  }, [startShortBreak])

  const handleLongBreak = useCallback(() => {
    startLongBreak()
  }, [startLongBreak])

  const handleEnterFocusMode = useCallback(async () => {
    if (!api) return
    await api.enterFocusMode()
    setFocusModeActive(true)
  }, [api])

  const handleExitFocusMode = useCallback(async () => {
    if (!api) return
    await api.exitFocusMode()
    setFocusModeActive(false)
  }, [api])

  const handleOpenSettings = useCallback(() => {
    router.push('/settings')
  }, [router])

  const handleCheckUpdate = useCallback(() => {
    console.log('Check for updates')
  }, [])

  const handleVisitWebsite = useCallback(() => {
    if (!api) return
    api.openExternalLink('https://planit.vervel.app').catch(console.error)
  }, [api])

  const handleAddTask = useCallback(() => {
    setTaskModalOpen(true)
  }, [])

  if (!shouldRender) {
    return null
  }

  return (
    <>
      <SystemTrayManager
        onShowWindow={handleShowWindow}
        onHideWindow={handleHideWindow}
        onAddTask={handleAddTask}
        onStartPomodoro={handleStartPomodoro}
        onStopPomodoro={handleStopPomodoro}
        onShortBreak={handleShortBreak}
        onLongBreak={handleLongBreak}
        onEnterFocusMode={handleEnterFocusMode}
        onExitFocusMode={handleExitFocusMode}
        onOpenSettings={handleOpenSettings}
        onCheckUpdate={handleCheckUpdate}
        onVisitWebsite={handleVisitWebsite}
      />
      <TaskModal
        open={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
      />
    </>
  )
}
