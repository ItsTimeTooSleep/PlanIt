'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePlatform, useDesktopOnly } from '@/components/platform-provider'
import { Minus, Square, X, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WindowControlsProps {
  className?: string
  showMinimize?: boolean
  showMaximize?: boolean
  showClose?: boolean
  variant?: 'default' | 'compact'
}

/**
 * 窗口控制按钮组件
 * 仅在桌面端显示，提供最小化、最大化、关闭窗口功能
 * @param props.className - 自定义样式类名
 * @param props.showMinimize - 是否显示最小化按钮
 * @param props.showMaximize - 是否显示最大化按钮
 * @param props.showClose - 是否显示关闭按钮
 * @param props.variant - 按钮变体：'default' 标准尺寸，'compact' 紧凑尺寸
 */
export function WindowControls({
  className,
  showMinimize = true,
  showMaximize = true,
  showClose = true,
  variant = 'default',
}: WindowControlsProps) {
  const shouldRender = useDesktopOnly()
  const { api, isReady } = usePlatform()
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    if (!api?.capabilities.supportsWindowControls) return

    api.getWindowState()
      .then(state => setIsMaximized(state.isMaximized ?? false))
      .catch(console.error)
  }, [api])

  const handleMinimize = useCallback(async () => {
    if (!api) return
    await api.minimizeWindow()
  }, [api])

  const handleMaximize = useCallback(async () => {
    if (!api) return
    await api.maximizeWindow()
    setIsMaximized(prev => !prev)
  }, [api])

  const handleClose = useCallback(async () => {
    if (!api) return
    await api.closeWindow()
  }, [api])

  if (!shouldRender || !isReady) {
    return null
  }

  const buttonSize = variant === 'compact' ? 'w-10 h-8' : 'w-12 h-9'
  const iconSize = variant === 'compact' ? 'h-3 w-3' : 'h-3.5 w-3.5'
  const closeIconSize = variant === 'compact' ? 'h-3.5 w-3.5' : 'h-4 w-4'

  return (
    <div className={cn('flex items-center h-full', className)}>
      {showMinimize && (
        <button
          className={cn(
            'flex items-center justify-center transition-all duration-150',
            buttonSize,
            'hover:bg-muted/60 active:bg-muted',
            'group'
          )}
          onClick={handleMinimize}
          aria-label="最小化"
        >
          <Minus className={cn(
            iconSize,
            'text-muted-foreground transition-colors duration-150',
            'group-hover:text-foreground'
          )} />
        </button>
      )}
      {showMaximize && (
        <button
          className={cn(
            'flex items-center justify-center transition-all duration-150',
            buttonSize,
            'hover:bg-muted/60 active:bg-muted',
            'group'
          )}
          onClick={handleMaximize}
          aria-label={isMaximized ? '还原' : '最大化'}
        >
          {isMaximized ? (
            <Copy className={cn(
              iconSize,
              'text-muted-foreground transition-colors duration-150',
              'group-hover:text-foreground'
            )} />
          ) : (
            <Square className={cn(
              'h-3 w-3 text-muted-foreground transition-all duration-150',
              'group-hover:text-foreground group-hover:scale-110'
            )} />
          )}
        </button>
      )}
      {showClose && (
        <button
          className={cn(
            'flex items-center justify-center transition-all duration-150',
            buttonSize,
            'hover:bg-destructive active:bg-destructive/90',
            'group'
          )}
          onClick={handleClose}
          aria-label="关闭"
        >
          <X className={cn(
            closeIconSize,
            'text-muted-foreground transition-colors duration-150',
            'group-hover:text-destructive-foreground'
          )} />
        </button>
      )}
    </div>
  )
}
