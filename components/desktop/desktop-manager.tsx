'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { SystemTrayManager } from '@/components/desktop'
import { usePlatform, useDesktopOnly } from '@/components/platform-provider'
import { usePomodoroDialog } from '@/lib/pomodoro-context'

/**
 * 桌面端管理组件
 * 处理系统托盘事件和桌面端特有功能
 */
export function DesktopManager() {
  const shouldRender = useDesktopOnly()
  const router = useRouter()
  const { api } = usePlatform()
  const { startPomodoro, startShortBreak, startLongBreak, stopPomodoro } = usePomodoroDialog()

  const handleShowWindow = useCallback(async () => {
    if (!api) return
    await api.getWindowState()
  }, [api])

  const handleHideWindow = useCallback(async () => {
    if (!api) return
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
  }, [api])

  const handleExitFocusMode = useCallback(async () => {
    if (!api) return
    await api.exitFocusMode()
  }, [api])

  const handleOpenSettings = useCallback(() => {
    router.push('/settings')
  }, [router])

  const handleCheckUpdate = useCallback(() => {
    console.log('Check for updates')
  }, [])

  if (!shouldRender) {
    return null
  }

  return (
    <SystemTrayManager
      onShowWindow={handleShowWindow}
      onHideWindow={handleHideWindow}
      onStartPomodoro={handleStartPomodoro}
      onStopPomodoro={handleStopPomodoro}
      onShortBreak={handleShortBreak}
      onLongBreak={handleLongBreak}
      onEnterFocusMode={handleEnterFocusMode}
      onExitFocusMode={handleExitFocusMode}
      onOpenSettings={handleOpenSettings}
      onCheckUpdate={handleCheckUpdate}
    />
  )
}
