'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { useStore } from '@/lib/store'

interface PomodoroDialogContextValue {
  isOpen: boolean
  open: (taskId?: string) => void
  close: () => void
  isTaskMode: boolean
  startPomodoro: () => void
  startShortBreak: () => void
  startLongBreak: () => void
  stopPomodoro: () => void
}

const PomodoroDialogContext = createContext<PomodoroDialogContextValue | null>(null)

export function PomodoroDialogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isTaskMode, setIsTaskMode] = useState(false)
  const { state, updatePomodoro } = useStore()
  const { pomodoro } = state

  const open = useCallback((taskId?: string) => {
    setIsTaskMode(!!taskId)
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    setIsTaskMode(false)
  }, [])

  const startPomodoro = useCallback(() => {
    const duration = pomodoro.settings.workDuration * 60
    updatePomodoro({
      taskId: null,
      status: 'running',
      phase: 'work',
      remainingSeconds: duration,
      totalSeconds: duration,
    })
    setIsTaskMode(false)
    setIsOpen(true)
  }, [pomodoro.settings.workDuration, updatePomodoro])

  const startShortBreak = useCallback(() => {
    const duration = pomodoro.settings.shortBreakDuration * 60
    updatePomodoro({
      taskId: null,
      status: 'running',
      phase: 'shortBreak',
      remainingSeconds: duration,
      totalSeconds: duration,
    })
    setIsTaskMode(false)
    setIsOpen(true)
  }, [pomodoro.settings.shortBreakDuration, updatePomodoro])

  const startLongBreak = useCallback(() => {
    const duration = pomodoro.settings.longBreakDuration * 60
    updatePomodoro({
      taskId: null,
      status: 'running',
      phase: 'longBreak',
      remainingSeconds: duration,
      totalSeconds: duration,
    })
    setIsTaskMode(false)
    setIsOpen(true)
  }, [pomodoro.settings.longBreakDuration, updatePomodoro])

  const stopPomodoro = useCallback(() => {
    updatePomodoro({
      taskId: null,
      status: 'idle',
      phase: 'work',
      remainingSeconds: pomodoro.settings.workDuration * 60,
      totalSeconds: pomodoro.settings.workDuration * 60,
      completedSessions: 0,
    })
    setIsOpen(false)
    setIsTaskMode(false)
  }, [pomodoro.settings.workDuration, updatePomodoro])

  return (
    <PomodoroDialogContext.Provider value={{
      isOpen,
      open,
      close,
      isTaskMode,
      startPomodoro,
      startShortBreak,
      startLongBreak,
      stopPomodoro,
    }}>
      {children}
    </PomodoroDialogContext.Provider>
  )
}

export function usePomodoroDialog() {
  const ctx = useContext(PomodoroDialogContext)
  if (!ctx) throw new Error('usePomodoroDialog must be used within PomodoroDialogProvider')
  return ctx
}
