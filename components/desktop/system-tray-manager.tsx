'use client'

import { useEffect } from 'react'
import { usePlatform, useDesktopOnly } from '@/components/platform-provider'
import { useLanguage } from '@/lib/store'
import { useTranslations } from '@/lib/i18n'

interface SystemTrayManagerProps {
  onShowWindow?: () => void
  onHideWindow?: () => void
  onAddTask?: () => void
  onStartPomodoro?: () => void
  onStopPomodoro?: () => void
  onShortBreak?: () => void
  onLongBreak?: () => void
  onEnterFocusMode?: () => void
  onExitFocusMode?: () => void
  onOpenSettings?: () => void
  onCheckUpdate?: () => void
}

/**
 * 系统托盘管理组件
 * 仅在桌面端生效，监听托盘菜单事件
 * @param props.onShowWindow - 显示窗口回调
 * @param props.onHideWindow - 隐藏窗口回调
 * @param props.onAddTask - 添加任务回调
 * @param props.onStartPomodoro - 开始番茄钟回调
 * @param props.onStopPomodoro - 停止番茄钟回调
 * @param props.onShortBreak - 短休息回调
 * @param props.onLongBreak - 长休息回调
 * @param props.onEnterFocusMode - 进入聚焦模式回调
 * @param props.onExitFocusMode - 退出聚焦模式回调
 * @param props.onOpenSettings - 打开设置回调
 * @param props.onCheckUpdate - 检查更新回调
 */
export function SystemTrayManager({
  onShowWindow,
  onHideWindow,
  onAddTask,
  onStartPomodoro,
  onStopPomodoro,
  onShortBreak,
  onLongBreak,
  onEnterFocusMode,
  onExitFocusMode,
  onOpenSettings,
  onCheckUpdate,
}: SystemTrayManagerProps) {
  const shouldRender = useDesktopOnly()
  const { api, isReady } = usePlatform()
  const lang = useLanguage()
  const t = useTranslations(lang)

  useEffect(() => {
    if (!api?.capabilities.supportsSystemTray || !isReady) return

    const unsubscribe = api.onTrayEvent((eventId) => {
      switch (eventId) {
        case 'show':
          onShowWindow?.()
          break
        case 'hide':
          onHideWindow?.()
          break
        case 'add-task':
          onAddTask?.()
          break
        case 'start-focus':
          onStartPomodoro?.()
          break
        case 'stop-focus':
          onStopPomodoro?.()
          break
        case 'short-break':
          onShortBreak?.()
          break
        case 'long-break':
          onLongBreak?.()
          break
        case 'enter-focus-mode':
          onEnterFocusMode?.()
          break
        case 'exit-focus-mode':
          onExitFocusMode?.()
          break
        case 'settings':
          onOpenSettings?.()
          break
        case 'check-update':
          onCheckUpdate?.()
          break
        case 'quit':
          api.closeWindow().catch(console.error)
          break
      }
    })

    return () => {
      unsubscribe()
    }
  }, [api, isReady, onShowWindow, onHideWindow, onAddTask, onStartPomodoro, onStopPomodoro, onShortBreak, onLongBreak, onEnterFocusMode, onExitFocusMode, onOpenSettings, onCheckUpdate])

  useEffect(() => {
    if (!api?.capabilities.supportsSystemTray || !isReady) return

    api.updateTrayMenuLabels({
      show: t.tray.show,
      hide: t.tray.hide,
      add_task: t.tray.addTask,
      pomodoro: t.tray.pomodoro,
      start_focus: t.tray.startFocus,
      stop_focus: t.tray.stopFocus,
      short_break: t.tray.shortBreak,
      long_break: t.tray.longBreak,
      focus_mode: t.tray.focusMode,
      enter_focus_mode: t.tray.enterFocusMode,
      exit_focus_mode: t.tray.exitFocusMode,
      settings: t.tray.settings,
      check_update: t.tray.checkUpdate,
      contact_us: t.tray.contactUs,
      quit: t.tray.quit,
      tooltip: t.tray.tooltip,
    }).catch(console.error)
  }, [api, isReady, t.tray])

  if (!shouldRender) {
    return null
  }

  return null
}
