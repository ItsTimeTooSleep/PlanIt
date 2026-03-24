'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePlatform, useDesktopOnly } from '@/components/platform-provider'
import { AppIcon } from '@/components/app-icon'
import { Minus, Square, X, Maximize2, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TitleBarProps {
  className?: string
}

/**
 * 自定义标题栏组件
 * 仅在桌面端显示，提供窗口拖拽区域和窗口控制按钮
 * @param props.className - 自定义样式类名
 */
export function TitleBar({ className }: TitleBarProps) {
  const shouldRender = useDesktopOnly()
  const { api, isReady } = usePlatform()
  const [isMaximized, setIsMaximized] = useState(false)
  const [hoveredButton, setHoveredButton] = useState<string | null>(null)

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

  const handleDoubleClick = useCallback(async () => {
    if (!api) return
    await api.maximizeWindow()
    setIsMaximized(prev => !prev)
  }, [api])

  if (!shouldRender || !isReady) {
    return null
  }

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-50 h-9 flex items-center justify-between bg-gradient-to-b from-card to-card/95 border-b border-border/50 select-none',
        'backdrop-blur-sm shadow-sm',
        className
      )}
      data-tauri-drag-region
      onDoubleClick={handleDoubleClick}
    >
      <div
        className="flex items-center gap-2.5 px-3"
        data-tauri-drag-region
      >
        <div className="relative">
          <AppIcon size={18} variant="default" />
        </div>
        <span className="text-xs font-semibold text-foreground/90 tracking-wide">PlanIt</span>
      </div>

      <div className="flex items-center h-full">
        <button
          className={cn(
            'h-full w-12 flex items-center justify-center transition-all duration-150',
            'hover:bg-muted/60 active:bg-muted',
            'group relative'
          )}
          onClick={handleMinimize}
          onMouseEnter={() => setHoveredButton('minimize')}
          onMouseLeave={() => setHoveredButton(null)}
          aria-label="最小化"
        >
          <Minus className={cn(
            'h-3.5 w-3.5 text-muted-foreground transition-colors duration-150',
            'group-hover:text-foreground'
          )} />
        </button>
        <button
          className={cn(
            'h-full w-12 flex items-center justify-center transition-all duration-150',
            'hover:bg-muted/60 active:bg-muted',
            'group relative'
          )}
          onClick={handleMaximize}
          onMouseEnter={() => setHoveredButton('maximize')}
          onMouseLeave={() => setHoveredButton(null)}
          aria-label={isMaximized ? '还原' : '最大化'}
        >
          {isMaximized ? (
            <Copy className={cn(
              'h-3.5 w-3.5 text-muted-foreground transition-colors duration-150',
              'group-hover:text-foreground'
            )} />
          ) : (
            <Square className={cn(
              'h-3 w-3 text-muted-foreground transition-all duration-150',
              'group-hover:text-foreground group-hover:scale-110'
            )} />
          )}
        </button>
        <button
          className={cn(
            'h-full w-12 flex items-center justify-center transition-all duration-150',
            'hover:bg-destructive active:bg-destructive/90',
            'group relative'
          )}
          onClick={handleClose}
          onMouseEnter={() => setHoveredButton('close')}
          onMouseLeave={() => setHoveredButton(null)}
          aria-label="关闭"
        >
          <X className={cn(
            'h-4 w-4 text-muted-foreground transition-colors duration-150',
            'group-hover:text-destructive-foreground'
          )} />
        </button>
      </div>
    </div>
  )
}
