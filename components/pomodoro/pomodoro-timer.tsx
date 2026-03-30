'use client'

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { Play, Pause, Square, Maximize, Minimize, Plus, Minus, Shield, Coffee, Battery, CheckCircle, RotateCcw, SkipForward } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { usePomodoro, useFullscreen } from '@/lib/pomodoro-hooks'
import { useLanguage } from '@/lib/store'
import { useTranslations } from '@/lib/i18n'
import { usePomodoroDialog } from '@/lib/pomodoro-context'
import { useDesktopOnly } from '@/components/platform-provider'
import { FocusMode } from '@/components/desktop/focus-mode'
import { PomodoroSummary } from './pomodoro-summary'
import { POMODORO_COLORS } from '@/lib/colors'

interface AnimatedBlob {
  x: number
  y: number
  scale: number
  opacity: number
  colorIndex: number
  colorOffset: number
}

const PHASE_COLOR_VARIANTS: Record<string, string[]> = {
  work: [
    'oklch(0.63 0.24 25)',
    'oklch(0.60 0.22 20)',
    'oklch(0.66 0.25 30)',
    'oklch(0.58 0.20 15)',
  ],
  shortBreak: [
    'oklch(0.72 0.19 142)',
    'oklch(0.70 0.17 145)',
    'oklch(0.75 0.20 140)',
    'oklch(0.68 0.18 150)',
  ],
  longBreak: [
    'oklch(0.62 0.18 260)',
    'oklch(0.60 0.16 265)',
    'oklch(0.65 0.20 255)',
    'oklch(0.58 0.17 270)',
  ],
}

export function PomodoroTimer() {
  const lang = useLanguage()
  const t = useTranslations(lang)
  const { isTaskMode, close } = usePomodoroDialog()
  const isDesktop = useDesktopOnly()
  const {
    pomodoro,
    currentTask,
    formatTime,
    startTimer,
    pauseTimer,
    stopTimer,
    stopTimerWithSummary,
    skipBreaks,
    setSkipBreaks,
    increaseWorkDuration,
    decreaseWorkDuration,
    calculateBreakCount,
    switchToNextPhase,
    getUpcomingPhaseInfo,
  } = usePomodoro()
  const { isFullscreen, toggleFullscreen } = useFullscreen()
  const [showFocusMode, setShowFocusMode] = useState(false)
  const animationRef = useRef<number | null>(null)
  const timeRef = useRef(0)
  
  const [blobs, setBlobs] = useState<AnimatedBlob[]>([
    { x: 0, y: 280, scale: 1.1, opacity: 0.35, colorIndex: 0, colorOffset: 0 },
  ])

  const currentColorVariants = useMemo(() => {
    return PHASE_COLOR_VARIANTS[pomodoro.phase] || PHASE_COLOR_VARIANTS.work
  }, [pomodoro.phase])

  useEffect(() => {
    const animate = () => {
      timeRef.current += 0.003
      
      setBlobs(prev => prev.map((blob) => {
        return {
          ...blob,
          x: Math.sin(timeRef.current * 0.4) * 120,
          y: 280 + Math.sin(timeRef.current * 0.3) * 30,
          scale: 1.1 + Math.sin(timeRef.current * 0.5) * 0.3,
          opacity: 0.35 + Math.sin(timeRef.current * 0.6) * 0.15,
        }
      }))
      
      animationRef.current = requestAnimationFrame(animate)
    }
    
    animationRef.current = requestAnimationFrame(animate)
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (pomodoro.status === 'running') {
          pauseTimer()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [pomodoro.status, pauseTimer])

  const progress = pomodoro.totalSeconds > 0 
    ? ((pomodoro.totalSeconds - pomodoro.remainingSeconds) / pomodoro.totalSeconds) * 100 
    : 0

  const getPhaseColor = () => {
    switch (pomodoro.phase) {
      case 'work':
        return POMODORO_COLORS.work
      case 'shortBreak':
        return POMODORO_COLORS.shortBreak
      case 'longBreak':
        return POMODORO_COLORS.longBreak
    }
  }

  const getPhaseLabel = () => {
    switch (pomodoro.phase) {
      case 'work':
        return t.pomodoro.work
      case 'shortBreak':
        return t.pomodoro.shortBreak
      case 'longBreak':
        return t.pomodoro.longBreak
    }
  }

  const handleOpenFocusMode = useCallback(() => {
    setShowFocusMode(true)
  }, [])

  const handleCloseFocusMode = useCallback(() => {
    setShowFocusMode(false)
  }, [])

  const { shortBreakCount, longBreakCount } = calculateBreakCount()

  const isWorkPhase = pomodoro.phase === 'work'
  const focusTimeElapsed = pomodoro.startTime ? 
    Math.floor((Date.now() - pomodoro.startTime.getTime()) / 1000) : 
    (pomodoro.totalSeconds - pomodoro.remainingSeconds)
  const hasFocusedOneMinute = focusTimeElapsed >= 60

  const handleStop = useCallback(() => {
    if (isWorkPhase && hasFocusedOneMinute) {
      stopTimerWithSummary()
    } else {
      stopTimer()
    }
  }, [isWorkPhase, hasFocusedOneMinute, stopTimerWithSummary, stopTimer])

  const handleCloseSummary = useCallback(() => {
    stopTimer()
  }, [stopTimer])

  useEffect(() => {
    if (pomodoro.status === 'finished' && isWorkPhase && hasFocusedOneMinute) {
      stopTimerWithSummary()
    }
  }, [pomodoro.status, isWorkPhase, hasFocusedOneMinute, stopTimerWithSummary])

  if (pomodoro.status === 'summary') {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full relative overflow-hidden">
        {blobs.map((blob, index) => {
          const size = 350
          const blur = 80
          
          return (
            <div
              key={index}
              className="absolute rounded-full transition-all duration-500 ease-out"
              style={{
                backgroundColor: currentColorVariants[blob.colorIndex % currentColorVariants.length],
                width: `${size}px`,
                height: `${size}px`,
                left: `calc(50% - ${size / 2}px + ${blob.x}px)`,
                top: `calc(50% - ${size / 2}px + ${blob.y}px)`,
                opacity: blob.opacity,
                transform: `scale(${blob.scale})`,
                filter: `blur(${blur}px)`
              }}
            />
          )
        })}
        
        <PomodoroSummary onClose={handleCloseSummary} />
      </div>
    )
  }

  if (isTaskMode && currentTask) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full relative overflow-hidden">
        {blobs.map((blob, index) => {
          const size = 350
          const blur = 80
          
          return (
            <div
              key={index}
              className="absolute rounded-full transition-all duration-500 ease-out"
              style={{
                backgroundColor: currentColorVariants[blob.colorIndex % currentColorVariants.length],
                width: `${size}px`,
                height: `${size}px`,
                left: `calc(50% - ${size / 2}px + ${blob.x}px)`,
                top: `calc(50% - ${size / 2}px + ${blob.y}px)`,
                opacity: blob.opacity,
                transform: `scale(${blob.scale})`,
                filter: `blur(${blur}px)`
              }}
            />
          )
        })}
        
        <div className="relative z-10 flex flex-col items-center justify-center w-full h-full">
          <div className="text-center mb-8">
            <p className="text-sm text-muted-foreground mb-1">{t.pomodoro.currentTask}</p>
            <p className="text-xl font-medium truncate max-w-lg">{currentTask.title}</p>
            {currentTask.startTime && currentTask.endTime && (
              <p className="text-sm text-muted-foreground mt-1">
                {currentTask.startTime} – {currentTask.endTime}
              </p>
            )}
          </div>

          <div className="relative w-72 h-72 mb-8">
            <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="44"
                fill="none"
                stroke="currentColor"
                strokeWidth="5"
                className="text-muted"
                opacity="0.25"
              />
              <circle
                cx="50"
                cy="50"
                r="44"
                fill="none"
                stroke={getPhaseColor()}
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray="276.46"
                strokeDashoffset={276.46 - (progress / 100) * 276.46}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
              <div 
                className="px-3 py-1 rounded-full text-xs font-medium"
                style={{ 
                  backgroundColor: getPhaseColor() + '18',
                  color: getPhaseColor()
                }}
              >
                {getPhaseLabel()}
              </div>
              <span className="text-5xl font-bold tracking-tight tabular-nums">
                {formatTime(pomodoro.remainingSeconds)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button 
              size="icon" 
              className="w-10 h-10 rounded-full"
              variant="ghost"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </Button>

            <Button 
              size="icon" 
              className="w-10 h-10 rounded-full"
              variant="ghost"
              onClick={() => {
                handleStop()
                close()
              }}
            >
              <Square className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const currentMinutes = Math.ceil(pomodoro.totalSeconds / 60)

  return (
    <div className="flex flex-col items-center justify-center w-full h-full relative overflow-hidden">
      {blobs.map((blob, index) => {
        const size = 350
        const blur = 80
        
        return (
          <div
            key={index}
            className="absolute rounded-full transition-all duration-500 ease-out"
            style={{
              backgroundColor: currentColorVariants[blob.colorIndex % currentColorVariants.length],
              width: `${size}px`,
              height: `${size}px`,
              left: `calc(50% - ${size / 2}px + ${blob.x}px)`,
              top: `calc(50% - ${size / 2}px + ${blob.y}px)`,
              opacity: blob.opacity,
              transform: `scale(${blob.scale})`,
              filter: `blur(${blur}px)`
            }}
          />
        )
      })}

      {pomodoro.status === 'idle' && (
        <div className="relative z-10 flex flex-col items-center gap-10">
          <div className="relative w-96 h-96">
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div 
                className="px-4 py-1.5 rounded-full text-sm font-medium mb-4"
                style={{ 
                  backgroundColor: getPhaseColor() + '18',
                  color: getPhaseColor()
                }}
              >
                {getPhaseLabel()}
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  size="icon" 
                  variant="ghost"
                  className="w-10 h-10 rounded-full"
                  onClick={decreaseWorkDuration}
                >
                  <Minus className="w-5 h-5" />
                </Button>

                <div className="text-center min-w-[120px]">
                  <p className="text-7xl font-bold tabular-nums tracking-tight">
                    {String(currentMinutes).padStart(2, '0')}
                    <span className="text-3xl text-muted-foreground">:00</span>
                  </p>
                </div>

                <Button 
                  size="icon" 
                  variant="ghost"
                  className="w-10 h-10 rounded-full"
                  onClick={increaseWorkDuration}
                >
                  <Plus className="w-5 h-5" />
                </Button>
              </div>
              
              <p className="text-sm text-muted-foreground mt-3">{t.pomodoro.title}</p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-muted/30">
              <Switch 
                checked={skipBreaks} 
                onCheckedChange={setSkipBreaks}
                className="data-[state=checked]:bg-primary"
              />
              <span className="text-sm text-muted-foreground">
                {t.pomodoro.skipBreaks || '跳过休息时间'}
              </span>
            </div>

            {!skipBreaks && (
              <div className="flex items-center gap-3 text-sm">
                {shortBreakCount > 0 && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Coffee className="w-3.5 h-3.5" />
                    <span>{shortBreakCount}</span>
                  </div>
                )}
                {longBreakCount > 0 && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <Battery className="w-3.5 h-3.5" />
                    <span>{longBreakCount}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <Button 
            size="icon" 
            className="w-12 h-12 rounded-full"
            onClick={startTimer}
          >
            <Play className="w-5 h-5 ml-0.5" />
          </Button>
        </div>
      )}

      {pomodoro.status === 'finished' && (() => {
        const { hasBreak, nextPhase, isFullSession } = getUpcomingPhaseInfo()
        const completedMinutes = Math.floor(pomodoro.totalSeconds / 60)
        const completedSeconds = pomodoro.totalSeconds % 60
        
        return (
          <div className="relative z-10 flex flex-col items-center gap-8">
            <div className="flex flex-col items-center gap-4">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-primary" />
              </div>
              
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">
                  {lang === 'zh' ? '专注完成！' : 'Focus Complete!'}
                </h2>
                <p className="text-muted-foreground">
                  {lang === 'zh' 
                    ? `专注时长: ${completedMinutes}分${completedSeconds > 0 ? completedSeconds + '秒' : ''}`
                    : `Focus duration: ${completedMinutes}m${completedSeconds > 0 ? completedSeconds + 's' : ''}`
                  }
                </p>
                {isFullSession && pomodoro.phase === 'work' && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {lang === 'zh' 
                      ? `已完成 ${pomodoro.completedSessions + 1} 个番茄钟`
                      : `${pomodoro.completedSessions + 1} pomodoros completed`
                    }
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col items-center gap-3">
              {hasBreak && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/30 mb-2">
                  {nextPhase === 'shortBreak' ? (
                    <>
                      <Coffee className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm">
                        {lang === 'zh' ? '短休息' : 'Short Break'}: {pomodoro.settings.shortBreakDuration}min
                      </span>
                    </>
                  ) : (
                    <>
                      <Battery className="w-4 h-4 text-blue-500" />
                      <span className="text-sm">
                        {lang === 'zh' ? '长休息' : 'Long Break'}: {pomodoro.settings.longBreakDuration}min
                      </span>
                    </>
                  )}
                </div>
              )}

              <div className="flex items-center gap-3">
                {hasBreak && (
                  <Button 
                    variant="outline"
                    className="rounded-full"
                    onClick={() => {
                      switchToNextPhase()
                      startTimer()
                    }}
                  >
                    {nextPhase === 'shortBreak' ? (
                      <>
                        <Coffee className="w-4 h-4 mr-2" />
                        {lang === 'zh' ? '开始休息' : 'Start Break'}
                      </>
                    ) : (
                      <>
                        <Battery className="w-4 h-4 mr-2" />
                        {lang === 'zh' ? '开始长休息' : 'Start Long Break'}
                      </>
                    )}
                  </Button>
                )}
                
                <Button 
                  className="rounded-full"
                  onClick={() => {
                    switchToNextPhase()
                  }}
                >
                  {hasBreak ? (
                    <>
                      <SkipForward className="w-4 h-4 mr-2" />
                      {lang === 'zh' ? '跳过休息' : 'Skip Break'}
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      {lang === 'zh' ? '继续专注' : 'Continue Focus'}
                    </>
                  )}
                </Button>
              </div>

              <Button 
                variant="ghost"
                size="sm"
                onClick={stopTimer}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                {lang === 'zh' ? '重置' : 'Reset'}
              </Button>
            </div>
          </div>
        )
      })()}

      {(pomodoro.status === 'running' || pomodoro.status === 'paused') && (
        <div className="relative z-10 flex flex-col items-center gap-12">
          <div className="relative w-[420px] h-[420px]">
            <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="44"
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                className="text-muted"
                opacity="0.25"
              />
              <circle
                cx="50"
                cy="50"
                r="44"
                fill="none"
                stroke={getPhaseColor()}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray="276.46"
                strokeDashoffset={276.46 - (progress / 100) * 276.46}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <div 
                className="px-4 py-1.5 rounded-full text-sm font-medium"
                style={{ 
                  backgroundColor: getPhaseColor() + '18',
                  color: getPhaseColor()
                }}
              >
                {getPhaseLabel()}
              </div>
              <span className="text-8xl font-bold tracking-tight tabular-nums">
                {formatTime(pomodoro.remainingSeconds)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {pomodoro.status === 'running' && (
              <>
                <Button 
                  size="icon" 
                  className="w-11 h-11 rounded-full"
                  variant="secondary"
                  onClick={pauseTimer}
                >
                  <Pause className="w-5 h-5" />
                </Button>

                <Button 
                  size="icon" 
                  className="w-9 h-9 rounded-full"
                  variant="ghost"
                  onClick={toggleFullscreen}
                >
                  {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                </Button>

                {isDesktop && (
                  <Button 
                    size="icon" 
                    className="w-9 h-9 rounded-full"
                    variant="ghost"
                    onClick={handleOpenFocusMode}
                    title={lang === 'zh' ? '进入专注模式' : 'Enter Focus Mode'}
                  >
                    <Shield className="w-4 h-4" />
                  </Button>
                )}
              </>
            )}

            {pomodoro.status === 'paused' && (
              <>
                <Button 
                  size="icon" 
                  className="w-11 h-11 rounded-full"
                  onClick={startTimer}
                >
                  <Play className="w-5 h-5 ml-0.5" />
                </Button>

                <Button 
                  size="icon" 
                  className="w-9 h-9 rounded-full"
                  variant="ghost"
                  onClick={handleStop}
                >
                  <Square className="w-4 h-4" />
                </Button>

                <Button 
                  size="icon" 
                  className="w-9 h-9 rounded-full"
                  variant="ghost"
                  onClick={toggleFullscreen}
                >
                  {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                </Button>

                {isDesktop && (
                  <Button 
                    size="icon" 
                    className="w-9 h-9 rounded-full"
                    variant="ghost"
                    onClick={handleOpenFocusMode}
                    title={lang === 'zh' ? '进入专注模式' : 'Enter Focus Mode'}
                  >
                    <Shield className="w-4 h-4" />
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {isDesktop && (
        <FocusMode
          isOpen={showFocusMode}
          onClose={handleCloseFocusMode}
          pomodoroState={{
            phase: pomodoro.phase,
            status: pomodoro.status === 'finished' ? 'idle' : pomodoro.status,
            remainingSeconds: pomodoro.remainingSeconds,
            totalSeconds: pomodoro.totalSeconds,
            workSessions: pomodoro.completedSessions,
          }}
          formatTime={formatTime}
          onStart={startTimer}
          onPause={pauseTimer}
          onStop={stopTimer}
        />
      )}
    </div>
  )
}
