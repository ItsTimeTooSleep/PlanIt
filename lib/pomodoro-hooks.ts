'use client'

import { useCallback, useEffect, useState, useRef } from 'react'
import { useStore, useLanguage } from '@/lib/store'
import { useTranslations } from '@/lib/i18n'
import type { PomodoroPhase, Task, PomodoroState } from '@/lib/types'
import { timeToMinutes } from '@/lib/task-utils'

let globalTimerRef: NodeJS.Timeout | null = null
let activeUpdatePomodoro: ((updates: Partial<PomodoroState> | ((prev: PomodoroState) => Partial<PomodoroState>)) => void) | null = null
let timerStartTimestamp: number | null = null
let timerRemainingAtStart: number | null = null

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

export function formatMinutes(minutes: number): string {
  const mins = Math.floor(minutes)
  const secs = Math.round((minutes - mins) * 60)
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

export function getPhaseDuration(phase: PomodoroPhase, settings: { workDuration: number; shortBreakDuration: number; longBreakDuration: number }): number {
  switch (phase) {
    case 'work':
      return settings.workDuration * 60
    case 'shortBreak':
      return settings.shortBreakDuration * 60
    case 'longBreak':
      return settings.longBreakDuration * 60
  }
}

export function getNextPhase(
  currentPhase: PomodoroPhase,
  completedSessions: number,
  settings: { workSessionsBeforeLongBreak: number }
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

function calculateTaskDurationInSeconds(task: Task): number | null {
  if (!task.startTime || !task.endTime) return null
  const startMinutes = timeToMinutes(task.startTime)
  const endMinutes = timeToMinutes(task.endTime)
  return (endMinutes - startMinutes) * 60
}

function calculateRemainingTimeInSeconds(task: Task): number | null {
  if (!task.startTime || !task.endTime) return null
  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const endMinutes = timeToMinutes(task.endTime)
  const startMinutes = timeToMinutes(task.startTime)
  
  if (currentMinutes >= endMinutes) {
    return 0
  } else if (currentMinutes < startMinutes) {
    return (endMinutes - startMinutes) * 60
  } else {
    return (endMinutes - currentMinutes) * 60
  }
}

function isTaskStarted(task: Task): boolean {
  if (!task.startTime || !task.endTime) return false
  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const startMinutes = timeToMinutes(task.startTime)
  const endMinutes = timeToMinutes(task.endTime)
  return currentMinutes >= startMinutes && currentMinutes < endMinutes
}

function clearGlobalTimer() {
  if (globalTimerRef) {
    clearInterval(globalTimerRef)
    globalTimerRef = null
  }
}

export function usePomodoro() {
  const lang = useLanguage()
  const { state, updatePomodoro } = useStore()
  const { pomodoro, tasks } = state
  const [skipBreaks, setSkipBreaks] = useState(false)
  const [customWorkMinutes, setCustomWorkMinutes] = useState(25)

  const currentTask = pomodoro.taskId 
    ? tasks.find(task => task.id === pomodoro.taskId)
    : null

  const startTimer = useCallback(() => {
    updatePomodoro({ status: 'running' })
  }, [updatePomodoro])

  const pauseTimer = useCallback(() => {
    updatePomodoro({ status: 'paused' })
  }, [updatePomodoro])

  const stopTimer = useCallback(() => {
    updatePomodoro({
      taskId: null,
      status: 'idle',
      phase: 'work',
      remainingSeconds: pomodoro.settings.workDuration * 60,
      totalSeconds: pomodoro.settings.workDuration * 60,
      completedSessions: 0,
    })
  }, [pomodoro.settings.workDuration, updatePomodoro])

  const setWorkDuration = useCallback((minutes: number) => {
    const duration = Math.max(1, Math.min(240, minutes)) * 60
    updatePomodoro({
      remainingSeconds: duration,
      totalSeconds: duration,
    })
  }, [updatePomodoro])

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

  const startPomodoro = useCallback((taskId?: string) => {
    let duration: number
    const targetTaskId: string | null = taskId ?? null
    let initialStatus: 'idle' | 'running' = 'idle'

    if (taskId) {
      const task = tasks.find(t => t.id === taskId)
      if (task) {
        const remainingDuration = calculateRemainingTimeInSeconds(task)
        const fullDuration = calculateTaskDurationInSeconds(task)
        duration = Math.max(0, remainingDuration ?? fullDuration ?? getPhaseDuration('work', pomodoro.settings))
        
        if (isTaskStarted(task) && duration > 0) {
          initialStatus = 'running'
        }
      } else {
        duration = customWorkMinutes * 60
      }
    } else {
      duration = customWorkMinutes * 60
    }

    updatePomodoro({
      taskId: targetTaskId,
      status: initialStatus,
      phase: 'work',
      remainingSeconds: duration,
      totalSeconds: duration,
      completedSessions: 0,
    })
  }, [tasks, pomodoro.settings, customWorkMinutes, updatePomodoro])

  const resetToToolMode = useCallback(() => {
    updatePomodoro({
      taskId: null,
      status: 'idle',
      phase: 'work',
      remainingSeconds: customWorkMinutes * 60,
      totalSeconds: customWorkMinutes * 60,
      completedSessions: 0,
    })
  }, [customWorkMinutes, updatePomodoro])

  const getUpcomingPhaseInfo = useCallback(() => {
    if (pomodoro.phase !== 'work') {
      return { hasBreak: false, nextPhase: 'work' as PomodoroPhase, isFullSession: true }
    }
    
    const workDurationSeconds = pomodoro.settings.workDuration * 60
    const isFullSession = pomodoro.totalSeconds >= workDurationSeconds
    
    if (skipBreaks || !isFullSession) {
      return { hasBreak: false, nextPhase: 'work' as PomodoroPhase, isFullSession }
    }
    
    const nextPhase = getNextPhase(pomodoro.phase, pomodoro.completedSessions, pomodoro.settings)
    return { hasBreak: nextPhase !== 'work', nextPhase, isFullSession }
  }, [pomodoro.phase, pomodoro.totalSeconds, pomodoro.settings, pomodoro.completedSessions, skipBreaks])

  const switchToNextPhase = useCallback(() => {
    let newCompletedSessions = pomodoro.completedSessions
    if (pomodoro.phase === 'work') {
      newCompletedSessions += 1
    }

    const workDurationSeconds = pomodoro.settings.workDuration * 60
    const isFullSession = pomodoro.phase !== 'work' || pomodoro.totalSeconds >= workDurationSeconds

    if (skipBreaks || !isFullSession) {
      const nextPhase = 'work'
      let nextDuration: number
      if (currentTask) {
        const taskDuration = calculateTaskDurationInSeconds(currentTask)
        nextDuration = taskDuration ?? getPhaseDuration(nextPhase, pomodoro.settings)
      } else {
        nextDuration = customWorkMinutes * 60
      }
      updatePomodoro({
        phase: nextPhase,
        remainingSeconds: nextDuration,
        totalSeconds: nextDuration,
        completedSessions: isFullSession ? newCompletedSessions : pomodoro.completedSessions,
        status: 'idle',
      })
      return
    }

    const nextPhase = getNextPhase(pomodoro.phase, pomodoro.completedSessions, pomodoro.settings)
    let nextDuration: number

    if (nextPhase === 'work' && currentTask) {
      const taskDuration = calculateTaskDurationInSeconds(currentTask)
      nextDuration = taskDuration ?? getPhaseDuration(nextPhase, pomodoro.settings)
    } else if (nextPhase === 'work') {
      nextDuration = customWorkMinutes * 60
    } else {
      nextDuration = getPhaseDuration(nextPhase, pomodoro.settings)
    }

    updatePomodoro({
      phase: nextPhase,
      remainingSeconds: nextDuration,
      totalSeconds: nextDuration,
      completedSessions: newCompletedSessions,
      status: 'idle',
    })
  }, [pomodoro.phase, pomodoro.totalSeconds, pomodoro.completedSessions, pomodoro.settings, skipBreaks, currentTask, customWorkMinutes, updatePomodoro])

  useEffect(() => {
    activeUpdatePomodoro = updatePomodoro
  }, [updatePomodoro])

  useEffect(() => {
    if (pomodoro.status === 'running') {
      timerStartTimestamp = Date.now()
      timerRemainingAtStart = pomodoro.remainingSeconds
      
      if (!globalTimerRef) {
        globalTimerRef = setInterval(() => {
          if (activeUpdatePomodoro && timerStartTimestamp !== null && timerRemainingAtStart !== null) {
            const now = Date.now()
            const elapsedSeconds = Math.floor((now - timerStartTimestamp) / 1000)
            const newRemaining = timerRemainingAtStart - elapsedSeconds
            
            activeUpdatePomodoro(prevPomodoro => {
              if (newRemaining <= 0) {
                clearGlobalTimer()
                timerStartTimestamp = null
                timerRemainingAtStart = null
                return {
                  status: 'finished',
                  remainingSeconds: 0,
                }
              }
              return {
                remainingSeconds: newRemaining,
              }
            })
          }
        }, 1000)
      }
    } else {
      clearGlobalTimer()
      timerStartTimestamp = null
      timerRemainingAtStart = null
    }

    return () => {
    }
  }, [pomodoro.status, pomodoro.remainingSeconds])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && pomodoro.status === 'running' && timerStartTimestamp !== null && timerRemainingAtStart !== null) {
        const now = Date.now()
        const elapsedSeconds = Math.floor((now - timerStartTimestamp) / 1000)
        const newRemaining = timerRemainingAtStart - elapsedSeconds
        
        if (activeUpdatePomodoro) {
          activeUpdatePomodoro(prevPomodoro => {
            if (newRemaining <= 0) {
              clearGlobalTimer()
              timerStartTimestamp = null
              timerRemainingAtStart = null
              return {
                status: 'finished',
                remainingSeconds: 0,
              }
            }
            return {
              remainingSeconds: newRemaining,
            }
          })
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [pomodoro.status])

  const calculateBreakCount = useCallback(() => {
    const workDurationSeconds = pomodoro.settings.workDuration * 60
    if (pomodoro.totalSeconds < workDurationSeconds) {
      return { shortBreakCount: 0, longBreakCount: 0 }
    }
    const sessionCount = Math.ceil(pomodoro.totalSeconds / workDurationSeconds)
    const longBreakCount = Math.floor(sessionCount / pomodoro.settings.workSessionsBeforeLongBreak)
    const shortBreakCount = sessionCount - longBreakCount - 1
    return { shortBreakCount: Math.max(0, shortBreakCount), longBreakCount }
  }, [pomodoro.totalSeconds, pomodoro.settings])

  return {
    pomodoro,
    currentTask,
    formatTime,
    startTimer,
    pauseTimer,
    stopTimer,
    startPomodoro,
    resetToToolMode,
    switchToNextPhase,
    getUpcomingPhaseInfo,
    getNextPhase: () => getNextPhase(pomodoro.phase, pomodoro.completedSessions, pomodoro.settings),
    skipBreaks,
    setSkipBreaks,
    customWorkMinutes,
    setCustomWorkMinutes,
    increaseWorkDuration,
    decreaseWorkDuration,
    calculateBreakCount,
  }
}

export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.log('Fullscreen request failed:', err)
      })
    } else {
      document.exitFullscreen().catch(err => {
        console.log('Exit fullscreen failed:', err)
      })
    }
  }, [])

  return { isFullscreen, toggleFullscreen }
}
