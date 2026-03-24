'use client'

import { useState, useCallback } from 'react'
import { Play, Pause, Square, Maximize, Minimize, Plus, Minus, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { usePomodoro, useFullscreen } from '@/lib/pomodoro-hooks'
import { useLanguage } from '@/lib/store'
import { useTranslations } from '@/lib/i18n'
import { usePomodoroDialog } from '@/lib/pomodoro-context'
import { useDesktopOnly, usePlatform } from '@/components/platform-provider'
import { FocusMode } from '@/components/desktop/focus-mode'
import { cn } from '@/lib/utils'
import { POMODORO_COLORS } from '@/lib/colors'

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
      <div className="flex flex-col items-center justify-center w-full h-full">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-3">{t.pomodoro.title}</h2>
          <div 
            className="inline-block px-6 py-2 rounded-full text-lg font-semibold"
            style={{ 
              backgroundColor: getPhaseColor() + '20',
              color: getPhaseColor()
            }}
          >
            {getPhaseLabel()}
          </div>
        </div>

        <div className="text-center mb-8">
          <p className="text-sm text-muted-foreground mb-2">{t.pomodoro.currentTask}</p>
          <p className="text-xl font-medium truncate max-w-lg">{currentTask.title}</p>
          {currentTask.startTime && currentTask.endTime && (
            <p className="text-sm text-muted-foreground mt-1">
              {currentTask.startTime} – {currentTask.endTime}
            </p>
          )}
        </div>

        <div className="relative w-80 h-80 mb-10">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              className="text-muted"
              opacity="0.2"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={getPhaseColor()}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray="283"
              strokeDashoffset={283 - (progress / 100) * 283}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-7xl font-bold tracking-tighter">
              {formatTime(pomodoro.remainingSeconds)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button 
            size="icon" 
            className="w-14 h-14 rounded-full"
            variant="ghost"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? (
              <Minimize className="w-6 h-6" />
            ) : (
              <Maximize className="w-6 h-6" />
            )}
          </Button>

          <Button 
            size="icon" 
            className="w-14 h-14 rounded-full"
            variant="ghost"
            onClick={() => {
              stopTimer()
              close()
            }}
          >
            <Square className="w-6 h-6" />
          </Button>
        </div>
      </div>
    )
  }

  const currentMinutes = Math.ceil(pomodoro.totalSeconds / 60)

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-3">{t.pomodoro.title}</h2>
        <div 
          className="inline-block px-6 py-2 rounded-full text-lg font-semibold"
          style={{ 
            backgroundColor: getPhaseColor() + '20',
            color: getPhaseColor()
          }}
        >
          {getPhaseLabel()}
        </div>
      </div>

      {pomodoro.status === 'idle' && (
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button 
              size="icon" 
              variant="ghost"
              onClick={decreaseWorkDuration}
              disabled={pomodoro.status !== 'idle'}
            >
              <Minus className="w-5 h-5" />
            </Button>

            <div className="text-center min-w-[120px]">
              <p className="text-4xl font-bold tabular-nums">
                {String(currentMinutes).padStart(2, '0')}
                <span className="text-xl text-muted-foreground">:00</span>
              </p>
            </div>

            <Button 
              size="icon" 
              variant="ghost"
              onClick={increaseWorkDuration}
              disabled={pomodoro.status !== 'idle'}
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <Switch 
              checked={skipBreaks} 
              onCheckedChange={setSkipBreaks}
              disabled={pomodoro.status !== 'idle'}
            />
            <span className="text-sm text-muted-foreground">
              {t.pomodoro.skipBreaks || '跳过休息时间'}
            </span>
          </div>

          {!skipBreaks && (
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              {shortBreakCount > 0 && (
                <span>{t.pomodoro.shortBreak}: {shortBreakCount}</span>
              )}
              {longBreakCount > 0 && (
                <span>{t.pomodoro.longBreak}: {longBreakCount}</span>
              )}
            </div>
          )}
        </div>
      )}

      {(pomodoro.status === 'running' || pomodoro.status === 'paused') && (
        <div className="relative w-80 h-80 mb-10">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              className="text-muted"
              opacity="0.2"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={getPhaseColor()}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray="283"
              strokeDashoffset={283 - (progress / 100) * 283}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-7xl font-bold tracking-tighter">
              {formatTime(pomodoro.remainingSeconds)}
            </span>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        {pomodoro.status === 'idle' && (
          <Button 
            size="icon" 
            className="w-16 h-16 rounded-full"
            onClick={startTimer}
          >
            <Play className="w-8 h-8" />
          </Button>
        )}

        {pomodoro.status === 'running' && (
          <>
            <Button 
              size="icon" 
              className="w-16 h-16 rounded-full"
              variant="secondary"
              onClick={pauseTimer}
            >
              <Pause className="w-8 h-8" />
            </Button>

            <Button 
              size="icon" 
              className="w-14 h-14 rounded-full"
              variant="ghost"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? (
                <Minimize className="w-6 h-6" />
              ) : (
                <Maximize className="w-6 h-6" />
              )}
            </Button>

            {isDesktop && (
              <Button 
                size="icon" 
                className="w-14 h-14 rounded-full"
                variant="ghost"
                onClick={handleOpenFocusMode}
                title={lang === 'zh' ? '进入专注模式' : 'Enter Focus Mode'}
              >
                <Shield className="w-6 h-6" />
              </Button>
            )}
          </>
        )}

        {pomodoro.status === 'paused' && (
          <>
            <Button 
              size="icon" 
              className="w-16 h-16 rounded-full"
              onClick={startTimer}
            >
              <Play className="w-8 h-8" />
            </Button>

            <Button 
              size="icon" 
              className="w-14 h-14 rounded-full"
              variant="ghost"
              onClick={stopTimer}
            >
              <Square className="w-6 h-6" />
            </Button>

            <Button 
              size="icon" 
              className="w-14 h-14 rounded-full"
              variant="ghost"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? (
                <Minimize className="w-6 h-6" />
              ) : (
                <Maximize className="w-6 h-6" />
              )}
            </Button>

            {isDesktop && (
              <Button 
                size="icon" 
                className="w-14 h-14 rounded-full"
                variant="ghost"
                onClick={handleOpenFocusMode}
                title={lang === 'zh' ? '进入专注模式' : 'Enter Focus Mode'}
              >
                <Shield className="w-6 h-6" />
              </Button>
            )}
          </>
        )}
      </div>

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
