'use client'

import { useEffect } from 'react'
import { usePlatform, useDesktopOnly } from '@/components/platform-provider'

interface SystemTrayManagerProps {
  onShowWindow?: () => void
  onHideWindow?: () => void
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
  }, [api, isReady, onShowWindow, onHideWindow, onStartPomodoro, onStopPomodoro, onShortBreak, onLongBreak, onEnterFocusMode, onExitFocusMode, onOpenSettings, onCheckUpdate])

  if (!shouldRender) {
    return null
  }

  return null
}
