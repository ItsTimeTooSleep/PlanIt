'use client'

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { Play, Pause, RotateCcw, SkipForward, Coffee, Brain, Timer, Plus, Minus, CheckCircle, Battery } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/lib/store'
import { POMODORO_COLORS } from '@/lib/colors'
import type { BaseWidgetProps } from '@/lib/widget-types'

type SizeMode = 'compact' | 'normal' | 'large' | 'xlarge'
type PomodoroPhase = 'work' | 'shortBreak' | 'longBreak'
type PomodoroStatus = 'idle' | 'running' | 'paused' | 'finished'

interface ContainerSize {
  width: number
  height: number
}

interface PomodoroSettings {
  workDuration: number
  shortBreakDuration: number
  longBreakDuration: number
  workSessionsBeforeLongBreak: number
}

interface LocalPomodoroState {
  status: PomodoroStatus
  phase: PomodoroPhase
  remainingSeconds: number
  totalSeconds: number
  completedSessions: number
  customWorkMinutes: number
  settings: PomodoroSettings
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

function getPhaseDuration(phase: PomodoroPhase, settings: PomodoroSettings): number {
  switch (phase) {
    case 'work':
      return settings.workDuration * 60
    case 'shortBreak':
      return settings.shortBreakDuration * 60
    case 'longBreak':
      return settings.longBreakDuration * 60
  }
}

function getNextPhase(
  currentPhase: PomodoroPhase,
  completedSessions: number,
  settings: PomodoroSettings
): PomodoroPhase {
  if (currentPhase === 'work') {
    const nextSessionNumber = completedSessions + 1
    if (nextSessionNumber % settings.workSessionsBeforeLongBreak === 0) {
      return 'longBreak'
    }
    return 'shortBreak'
  }
  return 'work'
}

export function PomodoroWidget({ id, config, className }: BaseWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const [sizeMode, setSizeMode] = useState<SizeMode>('normal')
  const [containerSize, setContainerSize] = useState<ContainerSize>({ width: 300, height: 300 })
  
  const lang = useLanguage()
  
  const [pomodoro, setPomodoro] = useState<LocalPomodoroState>({
    status: 'idle',
    phase: 'work',
    remainingSeconds: 25 * 60,
    totalSeconds: 25 * 60,
    completedSessions: 0,
    customWorkMinutes: 25,
    settings: {
      workDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      workSessionsBeforeLongBreak: 4,
    },
  })

  const showTask = (config?.showTask as boolean) ?? true
  const showSessionCount = (config?.showSessionCount as boolean) ?? true

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

  useEffect(() => {
    if (pomodoro.status === 'running') {
      if (!timerRef.current) {
        timerRef.current = setInterval(() => {
          setPomodoro(prev => {
            if (prev.remainingSeconds <= 1) {
              clearInterval(timerRef.current!)
              timerRef.current = null
              return { ...prev, status: 'finished', remainingSeconds: 0 }
            }
            return { ...prev, remainingSeconds: prev.remainingSeconds - 1 }
          })
        }, 1000)
      }
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [pomodoro.status])

  const startTimer = useCallback(() => {
    setPomodoro(prev => ({ ...prev, status: 'running' }))
  }, [])

  const pauseTimer = useCallback(() => {
    setPomodoro(prev => ({ ...prev, status: 'paused' }))
  }, [])

  const stopTimer = useCallback(() => {
    setPomodoro({
      status: 'idle',
      phase: 'work',
      remainingSeconds: pomodoro.customWorkMinutes * 60,
      totalSeconds: pomodoro.customWorkMinutes * 60,
      completedSessions: 0,
      customWorkMinutes: pomodoro.customWorkMinutes,
      settings: pomodoro.settings,
    })
  }, [pomodoro.customWorkMinutes, pomodoro.settings])

  const setWorkDuration = useCallback((minutes: number) => {
    const validMinutes = Math.max(1, Math.min(240, minutes))
    const duration = validMinutes * 60
    setPomodoro(prev => ({
      ...prev,
      customWorkMinutes: validMinutes,
      remainingSeconds: duration,
      totalSeconds: duration,
    }))
  }, [])

  const increaseWorkDuration = useCallback(() => {
    const currentMinutes = Math.ceil(pomodoro.totalSeconds / 60)
    const newMinutes = Math.min(240, currentMinutes + 5)
    setWorkDuration(newMinutes)
  }, [pomodoro.totalSeconds, setWorkDuration])

  const decreaseWorkDuration = useCallback(() => {
    const currentMinutes = Math.ceil(pomodoro.totalSeconds / 60)
    const newMinutes = Math.max(1, currentMinutes - 5)
    setWorkDuration(newMinutes)
  }, [pomodoro.totalSeconds, setWorkDuration])

  const getUpcomingPhaseInfo = useCallback(() => {
    if (pomodoro.phase !== 'work') {
      return { hasBreak: false, nextPhase: 'work' as PomodoroPhase, isFullSession: true }
    }
    
    const workDurationSeconds = pomodoro.settings.workDuration * 60
    const isFullSession = pomodoro.totalSeconds >= workDurationSeconds
    
    if (!isFullSession) {
      return { hasBreak: false, nextPhase: 'work' as PomodoroPhase, isFullSession }
    }
    
    const nextPhase = getNextPhase(pomodoro.phase, pomodoro.completedSessions, pomodoro.settings)
    return { hasBreak: nextPhase !== 'work', nextPhase, isFullSession }
  }, [pomodoro.phase, pomodoro.totalSeconds, pomodoro.settings, pomodoro.completedSessions])

  const switchToNextPhase = useCallback(() => {
    setPomodoro(prev => {
      let newCompletedSessions = prev.completedSessions
      if (prev.phase === 'work') {
        newCompletedSessions += 1
      }

      const workDurationSeconds = prev.settings.workDuration * 60
      const isFullSession = prev.phase !== 'work' || prev.totalSeconds >= workDurationSeconds

      if (!isFullSession) {
        return {
          ...prev,
          phase: 'work',
          remainingSeconds: prev.customWorkMinutes * 60,
          totalSeconds: prev.customWorkMinutes * 60,
          completedSessions: prev.completedSessions,
          status: 'idle',
        }
      }

      const nextPhase = getNextPhase(prev.phase, prev.completedSessions, prev.settings)
      let nextDuration: number

      if (nextPhase === 'work') {
        nextDuration = prev.customWorkMinutes * 60
      } else {
        nextDuration = getPhaseDuration(nextPhase, prev.settings)
      }

      return {
        ...prev,
        phase: nextPhase,
        remainingSeconds: nextDuration,
        totalSeconds: nextDuration,
        completedSessions: newCompletedSessions,
        status: 'idle',
      }
    })
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

  const showSessionInfo = showSessionCount && containerSize.height >= 180
  const showSkipButton = containerSize.width >= 200
  const showTimeAdjust = pomodoro.status === 'idle' && containerSize.width >= 150 && sizeMode !== 'compact'

  const currentMinutes = Math.ceil(pomodoro.totalSeconds / 60)

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
        {pomodoro.status === 'finished' ? (
          (() => {
            const { hasBreak, nextPhase, isFullSession } = getUpcomingPhaseInfo()
            const completedMinutes = Math.floor(pomodoro.totalSeconds / 60)
            
            return (
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-primary" />
                </div>
                
                <div className="text-center">
                  <p className="text-sm font-medium">
                    {lang === 'zh' ? '专注完成！' : 'Complete!'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {completedMinutes}{lang === 'zh' ? '分钟' : 'min'}
                  </p>
                </div>

                {hasBreak && (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted/30 text-xs">
                    {nextPhase === 'shortBreak' ? (
                      <>
                        <Coffee className="w-3 h-3 text-emerald-500" />
                        <span>{pomodoro.settings.shortBreakDuration}min</span>
                      </>
                    ) : (
                      <>
                        <Battery className="w-3 h-3 text-blue-500" />
                        <span>{pomodoro.settings.longBreakDuration}min</span>
                      </>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {hasBreak && (
                    <Button 
                      size="sm"
                      variant="outline"
                      className="rounded-full text-xs"
                      onClick={() => {
                        switchToNextPhase()
                        startTimer()
                      }}
                    >
                      {lang === 'zh' ? '休息' : 'Break'}
                    </Button>
                  )}
                  
                  <Button 
                    size="sm"
                    className="rounded-full text-xs"
                    onClick={switchToNextPhase}
                  >
                    {hasBreak 
                      ? (lang === 'zh' ? '跳过' : 'Skip')
                      : (lang === 'zh' ? '继续' : 'Continue')
                    }
                  </Button>
                </div>
              </div>
            )
          })()
        ) : (
          <>
        <div className="relative mb-4 flex items-center justify-center gap-2" style={{ minHeight: circleSize }}>
          {showTimeAdjust && (
            <Button 
              size="icon" 
              variant="ghost"
              onClick={decreaseWorkDuration}
              disabled={pomodoro.status !== 'idle'}
              className="w-8 h-8"
            >
              <Minus className="w-4 h-4" />
            </Button>
          )}
          
          <div className="relative" style={{ width: circleSize, height: circleSize }}>
            {pomodoro.status !== 'idle' && (
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
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={cn('font-bold tracking-tighter font-mono', timeFontSize)}>
                {formatTime(pomodoro.remainingSeconds)}
              </span>
            </div>
          </div>
          
          {showTimeAdjust && (
            <Button 
              size="icon" 
              variant="ghost"
              onClick={increaseWorkDuration}
              disabled={pomodoro.status !== 'idle'}
              className="w-8 h-8"
            >
              <Plus className="w-4 h-4" />
            </Button>
          )}
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
          </>
        )}
      </div>
    </div>
  )
}
