'use client'

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { Play, Pause, Square, Maximize, Minimize, Plus, Minus, Shield, Coffee, Battery } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { usePomodoro, useFullscreen } from '@/lib/pomodoro-hooks'
import { useLanguage } from '@/lib/store'
import { useTranslations } from '@/lib/i18n'
import { usePomodoroDialog } from '@/lib/pomodoro-context'
import { useDesktopOnly } from '@/components/platform-provider'
import { FocusMode } from '@/components/desktop/focus-mode'
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
    skipBreaks,
    setSkipBreaks,
    increaseWorkDuration,
    decreaseWorkDuration,
    calculateBreakCount,
  } = usePomodoro()
  const { isFullscreen, toggleFullscreen } = useFullscreen()
  const [showFocusMode, setShowFocusMode] = useState(false)
  const animationRef = useRef<number | null>(null)
  const timeRef = useRef(0)
  
  const [blobs, setBlobs] = useState<AnimatedBlob[]>([
    { x: -100, y: -100, scale: 1, opacity: 0.22, colorIndex: 0, colorOffset: 0 },
    { x: -80, y: -80, scale: 1, opacity: 0.18, colorIndex: 1, colorOffset: Math.PI * 0.5 },
    { x: -120, y: -60, scale: 0.9, opacity: 0.14, colorIndex: 2, colorOffset: Math.PI },
    { x: -60, y: -120, scale: 0.85, opacity: 0.12, colorIndex: 3, colorOffset: Math.PI * 1.5 },
  ])

  const currentColorVariants = useMemo(() => {
    return PHASE_COLOR_VARIANTS[pomodoro.phase] || PHASE_COLOR_VARIANTS.work
  }, [pomodoro.phase])

  useEffect(() => {
    const animate = () => {
      timeRef.current += 0.004
      
      setBlobs(prev => prev.map((blob, index) => {
        const speedMultiplier = 1 + index * 0.15
        const offset = blob.colorOffset
        
        return {
          ...blob,
          x: -100 + Math.sin(timeRef.current * (0.6 + index * 0.1) + offset) * (50 + index * 15),
          y: -100 + Math.cos(timeRef.current * (0.5 + index * 0.12) + offset) * (45 + index * 12),
          scale: 0.8 + Math.sin(timeRef.current * (0.8 + index * 0.1) + offset) * 0.25,
          opacity: 0.08 + Math.sin(timeRef.current * (1.0 + index * 0.08) + offset) * 0.10,
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

  if (isTaskMode && currentTask) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full relative overflow-hidden">
        {blobs.map((blob, index) => {
          const size = 320 + index * 40
          const blur = 100 + index * 15
          const isRight = index % 2 === 0
          
          return (
            <div
              key={index}
              className="absolute rounded-full transition-all duration-500 ease-out"
              style={{
                backgroundColor: currentColorVariants[blob.colorIndex % currentColorVariants.length],
                width: `${size}px`,
                height: `${size}px`,
                right: isRight ? '-100px' : 'auto',
                left: !isRight ? '-80px' : 'auto',
                top: isRight ? `${blob.y}px` : 'auto',
                bottom: !isRight ? `${blob.y}px` : 'auto',
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
                stopTimer()
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
        const size = 340 + index * 40
        const blur = 110 + index * 15
        const isRight = index % 2 === 0
        
        return (
          <div
            key={index}
            className="absolute rounded-full transition-all duration-500 ease-out"
            style={{
              backgroundColor: currentColorVariants[blob.colorIndex % currentColorVariants.length],
              width: `${size}px`,
              height: `${size}px`,
              right: isRight ? '-100px' : 'auto',
              left: !isRight ? '-80px' : 'auto',
              top: isRight ? `${blob.y}px` : 'auto',
              bottom: !isRight ? `${blob.y}px` : 'auto',
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
                  onClick={stopTimer}
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
