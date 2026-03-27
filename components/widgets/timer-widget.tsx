'use client'

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { Play, Pause, RotateCcw, Timer, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { BaseWidgetProps, TimerConfig, TimerMode } from '@/lib/widget-types'

const PRESET_TIMES = [
  { label: '1分', seconds: 60 },
  { label: '5分', seconds: 300 },
  { label: '15分', seconds: 900 },
  { label: '25分', seconds: 1500 },
  { label: '30分', seconds: 1800 },
  { label: '45分', seconds: 2700 },
  { label: '60分', seconds: 3600 },
]

type SizeMode = 'compact' | 'normal' | 'large' | 'xlarge'

/**
 * 计时器组件
 * @param props - 组件属性
 * @param props.id - 组件实例ID
 * @param props.config - 组件配置
 * @param props.className - 自定义样式类
 * @returns 计时器组件
 */
export function TimerWidget({ id: _id, config, className }: BaseWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [sizeMode, setSizeMode] = useState<SizeMode>('normal')
  
  const timerConfig = config as Partial<TimerConfig>
  const [mode, setMode] = useState<TimerMode>(timerConfig.mode || 'stopwatch')
  const [time, setTime] = useState(timerConfig.defaultTime || 0)
  const [initialTime, setInitialTime] = useState(timerConfig.defaultTime || 300)
  const [isRunning, setIsRunning] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const showPresets = (config?.showPresets as boolean) ?? true
  const showModeSwitch = (config?.showModeSwitch as boolean) ?? true
  const maxPresets = (config?.maxPresets as number) ?? 5

  useEffect(() => {
    const updateSizeMode = () => {
      const el = containerRef.current
      if (!el) return
      const { width, height } = el.getBoundingClientRect()
      const minDimension = Math.min(width, height)
      
      if (minDimension < 200) {
        setSizeMode('compact')
      } else if (minDimension > 400) {
        setSizeMode('xlarge')
      } else if (minDimension > 300) {
        setSizeMode('large')
      } else {
        setSizeMode('normal')
      }
    }

    updateSizeMode()
    window.addEventListener('resize', updateSizeMode)
    return () => window.removeEventListener('resize', updateSizeMode)
  }, [])

  const formatTime = useCallback((seconds: number): string => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, [])

  const progress = useMemo(() => {
    if (mode === 'countdown' && initialTime > 0) {
      return ((initialTime - time) / initialTime) * 100
    }
    return 0
  }, [mode, initialTime, time])

  const start = useCallback(() => {
    setIsRunning(true)
  }, [])

  const pause = useCallback(() => {
    setIsRunning(false)
  }, [])

  const reset = useCallback(() => {
    setIsRunning(false)
    if (mode === 'countdown') {
      setTime(initialTime)
    } else {
      setTime(0)
    }
  }, [mode, initialTime])

  const setPresetTime = useCallback((seconds: number) => {
    setIsRunning(false)
    setTime(seconds)
    setInitialTime(seconds)
    setMode('countdown')
  }, [])

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime((prev) => {
          if (mode === 'countdown') {
            if (prev <= 1) {
              setIsRunning(false)
              return 0
            }
            return prev - 1
          } else {
            return prev + 1
          }
        })
      }, 1000)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, mode])

  useEffect(() => {
    if (mode === 'countdown' && time === 0 && initialTime > 0) {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification('计时结束', { body: '倒计时已完成！' })
        }
      }
    }
  }, [time, mode, initialTime])

  const timeFontSize = useMemo(() => {
    switch (sizeMode) {
      case 'compact': return 'text-2xl'
      case 'large': return 'text-5xl'
      case 'xlarge': return 'text-6xl'
      default: return 'text-4xl'
    }
  }, [sizeMode])

  const buttonSize = useMemo(() => {
    switch (sizeMode) {
      case 'compact': return 'sm'
      case 'large': return 'lg'
      case 'xlarge': return 'lg'
      default: return 'default'
    }
  }, [sizeMode])

  const circleSize = useMemo(() => {
    switch (sizeMode) {
      case 'compact': return 100
      case 'large': return 180
      case 'xlarge': return 220
      default: return 144
    }
  }, [sizeMode])

  const showPresetButtons = showPresets
  const displayPresets = PRESET_TIMES.slice(0, maxPresets)

  return (
    <div ref={containerRef} className={cn('flex flex-col h-full bg-card rounded-xl border border-border overflow-hidden', className)}>
      {showModeSwitch && (
        <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
          <span className={cn('font-medium', sizeMode === 'compact' ? 'text-xs' : 'text-sm')}>计时器</span>
          <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
            <Button
              variant="ghost"
              size="sm"
              className={cn('text-xs', mode === 'stopwatch' && 'bg-background shadow-sm')}
              onClick={() => {
                setMode('stopwatch')
                setTime(0)
                setIsRunning(false)
              }}
            >
              <Clock className={cn('mr-1', sizeMode === 'compact' ? 'w-2.5 h-2.5' : 'w-3 h-3')} />
              {sizeMode !== 'compact' && '正计时'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn('text-xs', mode === 'countdown' && 'bg-background shadow-sm')}
              onClick={() => {
                setMode('countdown')
                setTime(initialTime)
                setIsRunning(false)
              }}
            >
              <Timer className={cn('mr-1', sizeMode === 'compact' ? 'w-2.5 h-2.5' : 'w-3 h-3')} />
              {sizeMode !== 'compact' && '倒计时'}
            </Button>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {showPresetButtons && mode === 'countdown' && !isRunning && time === initialTime && (
          <div className="flex flex-wrap justify-center gap-1 mb-4">
            {displayPresets.map((preset) => (
              <Button
                key={preset.seconds}
                variant="outline"
                size="sm"
                className={cn('text-xs', sizeMode === 'compact' ? 'h-6' : 'h-7')}
                onClick={() => setPresetTime(preset.seconds)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
        )}

        <div className="relative mb-4">
          {mode === 'countdown' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <svg 
                className="transform -rotate-90" 
                style={{ width: circleSize, height: circleSize }}
                viewBox="0 0 100 100"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  className="text-muted opacity-20"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray="283"
                  strokeDashoffset={283 - (progress / 100) * 283}
                  className="text-primary transition-all duration-1000"
                />
              </svg>
            </div>
          )}
          <div
            className={cn(
              'text-center flex items-center justify-center',
              mode === 'countdown' ? '' : ''
            )}
            style={{ width: circleSize, height: circleSize }}
          >
            <span className={cn('font-mono font-bold tracking-tight', timeFontSize)}>
              {formatTime(time)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isRunning ? (
            <Button size={buttonSize} className="rounded-full" onClick={start}>
              <Play className={sizeMode === 'compact' ? 'w-4 h-4' : 'w-5 h-5'} />
            </Button>
          ) : (
            <Button
              size={buttonSize}
              variant="secondary"
              className="rounded-full"
              onClick={pause}
            >
              <Pause className={sizeMode === 'compact' ? 'w-4 h-4' : 'w-5 h-5'} />
            </Button>
          )}
          <Button
            size={buttonSize}
            variant="ghost"
            className="rounded-full"
            onClick={reset}
          >
            <RotateCcw className={sizeMode === 'compact' ? 'w-4 h-4' : 'w-5 h-5'} />
          </Button>
        </div>
      </div>
    </div>
  )
}
