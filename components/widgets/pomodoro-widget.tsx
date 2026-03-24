'use client'

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { Play, Pause, RotateCcw, SkipForward, Settings2, Coffee, Brain, Timer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { usePomodoro } from '@/lib/pomodoro-hooks'
import { useLanguage } from '@/lib/store'
import { POMODORO_COLORS } from '@/lib/colors'
import type { BaseWidgetProps } from '@/lib/widget-types'

type SizeMode = 'compact' | 'normal' | 'large' | 'xlarge'

interface ContainerSize {
  width: number
  height: number
}

/**
 * 番茄钟组件
 * @param props - 组件属性
 * @param props.id - 组件实例ID
 * @param props.config - 组件配置
 * @param props.className - 自定义样式类
 * @returns 番茄钟组件
 */
export function PomodoroWidget({ id, config, className }: BaseWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [sizeMode, setSizeMode] = useState<SizeMode>('normal')
  const [containerSize, setContainerSize] = useState<ContainerSize>({ width: 300, height: 300 })
  
  const lang = useLanguage()
  const {
    pomodoro,
    currentTask,
    formatTime,
    startTimer,
    pauseTimer,
    stopTimer,
    switchToNextPhase,
  } = usePomodoro()

  const showTask = (config?.showTask as boolean) ?? true
  const showSessionCount = (config?.showSessionCount as boolean) ?? true
  const showSettings = (config?.showSettings as boolean) ?? false

  useEffect(() => {
    const updateSizeMode = () => {
      const el = containerRef.current
      if (!el) return
      const { width, height } = el.getBoundingClientRect()
      setContainerSize({ width, height })
      
      const minDimension = Math.min(width, height)
      const isNarrow = width < 200
      const isShort = height < 200
      
      if (minDimension < 180 || isNarrow || isShort) {
        setSizeMode('compact')
      } else if (minDimension > 380 && width > 380 && height > 380) {
        setSizeMode('xlarge')
      } else if (minDimension > 280 && width > 280 && height > 280) {
        setSizeMode('large')
      } else {
        setSizeMode('normal')
      }
    }

    updateSizeMode()
    window.addEventListener('resize', updateSizeMode)
    return () => window.removeEventListener('resize', updateSizeMode)
  }, [])

  const progress = useMemo(() => {
    return pomodoro.totalSeconds > 0
      ? ((pomodoro.totalSeconds - pomodoro.remainingSeconds) / pomodoro.totalSeconds) * 100
      : 0
  }, [pomodoro.totalSeconds, pomodoro.remainingSeconds])

  const getPhaseColor = useCallback(() => {
    switch (pomodoro.phase) {
      case 'work':
        return POMODORO_COLORS.work
      case 'shortBreak':
        return POMODORO_COLORS.shortBreak
      case 'longBreak':
        return POMODORO_COLORS.longBreak
    }
  }, [pomodoro.phase])

  const getPhaseLabel = useCallback(() => {
    const labels = {
      work: lang === 'zh' ? '专注' : 'Work',
      shortBreak: lang === 'zh' ? '短休息' : 'Short Break',
      longBreak: lang === 'zh' ? '长休息' : 'Long Break',
    }
    return labels[pomodoro.phase]
  }, [pomodoro.phase, lang])

  const getPhaseIcon = useCallback(() => {
    switch (pomodoro.phase) {
      case 'work':
        return Brain
      case 'shortBreak':
      case 'longBreak':
        return Coffee
    }
  }, [pomodoro.phase])

  const handleReset = useCallback(() => {
    stopTimer()
  }, [stopTimer])

  const handleSkip = useCallback(() => {
    switchToNextPhase()
  }, [switchToNextPhase])

  const timeFontSize = useMemo(() => {
    switch (sizeMode) {
      case 'compact': return 'text-2xl'
      case 'large': return 'text-4xl'
      case 'xlarge': return 'text-5xl'
      default: return 'text-3xl'
    }
  }, [sizeMode])

  const circleSize = useMemo(() => {
    const headerHeight = 40
    const footerHeight = showSessionCount ? 30 : 0
    const buttonAreaHeight = 50
    const padding = 32
    
    const availableHeight = containerSize.height - headerHeight - footerHeight - buttonAreaHeight - padding
    const availableWidth = containerSize.width - padding
    
    const maxCircleSize = Math.min(availableHeight, availableWidth)
    
    const baseSize = (() => {
      switch (sizeMode) {
        case 'compact': return 80
        case 'large': return 160
        case 'xlarge': return 200
        default: return 128
      }
    })()
    
    return Math.max(60, Math.min(baseSize, maxCircleSize))
  }, [sizeMode, containerSize, showSessionCount])

  const buttonSize = useMemo(() => {
    if (containerSize.width < 180 || containerSize.height < 180) return 'sm'
    switch (sizeMode) {
      case 'compact': return 'sm'
      case 'large':
      case 'xlarge': return 'lg'
      default: return 'default'
    }
  }, [sizeMode, containerSize])

  const showButtonText = useMemo(() => {
    return containerSize.width >= 200 && sizeMode !== 'compact'
  }, [containerSize.width, sizeMode])

  const showTaskInfo = showTask && currentTask && containerSize.height >= 200
  const showSessionInfo = showSessionCount && containerSize.height >= 180
  const showSkipButton = containerSize.width >= 200

  const PhaseIcon = getPhaseIcon()

  return (
    <div ref={containerRef} className={cn('flex flex-col h-full bg-card rounded-xl border border-border overflow-hidden', className)}>
      <div
        className="flex items-center justify-between px-3 py-2 border-b border-border"
        style={{
          backgroundColor: `${getPhaseColor()}15`,
        }}
      >
        <div className="flex items-center gap-2">
          <PhaseIcon className={cn(sizeMode === 'compact' ? 'w-3 h-3' : 'w-4 h-4')} style={{ color: getPhaseColor() }} />
          <span className={cn('font-medium', sizeMode === 'compact' ? 'text-xs' : 'text-sm')}>
            {lang === 'zh' ? '番茄钟' : 'Pomodoro'}
          </span>
        </div>
        <span
          className={cn('font-semibold px-2 py-0.5 rounded-full', sizeMode === 'compact' ? 'text-[10px]' : 'text-xs')}
          style={{
            backgroundColor: `${getPhaseColor()}25`,
            color: getPhaseColor(),
          }}
        >
          {getPhaseLabel()}
        </span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {showTaskInfo && (
          <p className="text-xs text-muted-foreground mb-2 text-center truncate max-w-full">
            {currentTask.title}
          </p>
        )}

        <div className="relative mb-4" style={{ width: circleSize, height: circleSize }}>
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              className="text-muted"
              opacity="0.2"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={getPhaseColor()}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray="283"
              strokeDashoffset={283 - (progress / 100) * 283}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn('font-bold tracking-tighter font-mono', timeFontSize)}>
              {formatTime(pomodoro.remainingSeconds)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-wrap justify-center">
          {pomodoro.status === 'idle' && (
            <Button size={buttonSize} onClick={startTimer}>
              <Play className={cn(showButtonText && 'mr-1', sizeMode === 'compact' ? 'w-3 h-3' : 'w-4 h-4')} />
              {showButtonText && (lang === 'zh' ? '开始' : 'Start')}
            </Button>
          )}

          {pomodoro.status === 'running' && (
            <Button size={buttonSize} variant="secondary" onClick={pauseTimer}>
              <Pause className={cn(showButtonText && 'mr-1', sizeMode === 'compact' ? 'w-3 h-3' : 'w-4 h-4')} />
              {showButtonText && (lang === 'zh' ? '暂停' : 'Pause')}
            </Button>
          )}

          {pomodoro.status === 'paused' && (
            <>
              <Button size={buttonSize} onClick={startTimer}>
                <Play className={cn(showButtonText && 'mr-1', sizeMode === 'compact' ? 'w-3 h-3' : 'w-4 h-4')} />
                {showButtonText && (lang === 'zh' ? '继续' : 'Resume')}
              </Button>
              <Button size={buttonSize} variant="ghost" onClick={handleReset}>
                <RotateCcw className={sizeMode === 'compact' ? 'w-3 h-3' : 'w-4 h-4'} />
              </Button>
            </>
          )}

          {showSkipButton && (
            <Button size={buttonSize} variant="outline" onClick={handleSkip}>
              <SkipForward className={cn(showButtonText && 'mr-1', sizeMode === 'compact' ? 'w-3 h-3' : 'w-4 h-4')} />
              {showButtonText && (lang === 'zh' ? '跳过' : 'Skip')}
            </Button>
          )}
        </div>

        {showSessionInfo && (
          <div className="mt-3 text-xs text-muted-foreground flex items-center gap-1">
            <Timer className="w-3 h-3" />
            {lang === 'zh' ? '已完成' : 'Completed'}: {pomodoro.completedSessions}
          </div>
        )}
      </div>
    </div>
  )
}
