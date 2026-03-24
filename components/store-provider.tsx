'use client'

import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import { StoreContext, type StoreContextValue } from '@/lib/store'
import type { AppState, Task, Tag, AppSettings, PomodoroState, DateNote, Note, NoteLine, ExportData, ImportOptions } from '@/lib/types'
import { historyManager, type HistoryAction, type HistoryActionData } from '@/lib/history-manager'
import { DEFAULT_TAGS } from '@/lib/colors'
import { scheduleTaskNotification, cancelTaskNotification, cancelAllNotifications } from '@/lib/notifications'
import { translations } from '@/lib/i18n'

const APP_VERSION = '1.0.0'
const APP_NAME = 'PlanIt'

const DEFAULT_POMODORO: PomodoroState = {
  taskId: null,
  status: 'idle',
  phase: 'work',
  remainingSeconds: 25 * 60,
  totalSeconds: 25 * 60,
  completedSessions: 0,
  settings: {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    workSessionsBeforeLongBreak: 4,
    autoStartBreaks: true,
    autoStartWork: false,
  },
}

const DEFAULT_STATE: AppState = {
  tasks: [],
  tags: DEFAULT_TAGS,
  dateNotes: [],
  notes: [],
  noteLines: [],
  settings: { 
    language: 'zh', 
    notificationsEnabled: false,
    closeBehavior: 'exit',
    calendar: { 
      dayStartTime: 0, 
      dayEndTime: 24, 
      hourDivisions: 2, 
      hourHeight: 56,
      timeSnap: 15,
      snapEnabled: true,
      snapThreshold: 10,
    }
  },
  pomodoro: DEFAULT_POMODORO,
}

const STORAGE_KEY = 'planit_data'

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_STATE
    const parsed = JSON.parse(raw) as Partial<AppState>
    const notesWithZIndex = (parsed.notes ?? []).map((note, index) => ({
      ...note,
      zIndex: note.zIndex ?? index + 1,
    }))
    return {
      tasks: parsed.tasks ?? [],
      tags: parsed.tags ?? DEFAULT_TAGS,
      dateNotes: parsed.dateNotes ?? [],
      notes: notesWithZIndex,
      noteLines: parsed.noteLines ?? [],
      settings: { 
        ...DEFAULT_STATE.settings, 
        ...(parsed.settings ?? {}),
        calendar: {
          ...DEFAULT_STATE.settings.calendar,
          ...(parsed.settings?.calendar ?? {})
        }
      },
      pomodoro: { ...DEFAULT_POMODORO, ...(parsed.pomodoro ?? {}) },
    }
  } catch {
    return DEFAULT_STATE
  }
}

function save(state: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {}
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(DEFAULT_STATE)
  const [hydrated, setHydrated] = useState(false)
  const scheduledRef = useRef(false)

  useEffect(() => {
    setState(load())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated || scheduledRef.current) return
    scheduledRef.current = true
    
    if (state.settings.notificationsEnabled) {
      const now = Date.now()
      const t = translations[state.settings.language]
      state.tasks.forEach(task => {
        if (task.status !== 'pending') return
        if (task.isAllDay || !task.startTime || !task.date) return
        const [year, month, day] = task.date.split('-').map(Number)
        const [h, m] = task.startTime.split(':').map(Number)
        const taskDate = new Date(year, month - 1, day, h, m, 0, 0)
        if (taskDate.getTime() > now) {
          scheduleTaskNotification(task, t.settings.notificationTitle, `${t.settings.notificationBody}: ${task.title}`)
        }
      })
    }
  }, [hydrated, state.settings.notificationsEnabled, state.settings.language, state.tasks])

  const set = useCallback((updater: (prev: AppState) => AppState) => {
    setState(prev => {
      const next = updater(prev)
      save(next)
      return next
    })
  }, [])

  const addTask = useCallback((task: Task, recordHistory: boolean = true) => {
    if (recordHistory) {
      historyManager.push({
        type: 'create_task',
        timestamp: Date.now(),
        data: { task }
      })
    }
    set(prev => {
      const next = { ...prev, tasks: [...prev.tasks, task] }
      if (next.settings.notificationsEnabled) {
        const t = translations[next.settings.language]
        scheduleTaskNotification(task, t.settings.notificationTitle, `${t.settings.notificationBody}: ${task.title}`)
      }
      return next
    })
  }, [set])

  const updateTask = useCallback((id: string, updates: Partial<Task>, recordHistory: boolean = true) => {
    if (recordHistory) {
      set(prev => {
        const existingTask = prev.tasks.find(t => t.id === id)
        if (!existingTask) return prev
        
        const previousState: Partial<Task> = {}
        Object.keys(updates).forEach(key => {
          ;(previousState as Record<string, unknown>)[key] = existingTask[key as keyof Task]
        })
        
        historyManager.push({
          type: 'update_task',
          timestamp: Date.now(),
          data: { taskId: id, previousState, newState: updates }
        })
        
        const next = {
          ...prev,
          tasks: prev.tasks.map(t => t.id === id ? { ...t, ...updates } : t),
        }
        if (next.settings.notificationsEnabled) {
          const updatedTask = next.tasks.find(t => t.id === id)
          if (updatedTask) {
            const t = translations[next.settings.language]
            scheduleTaskNotification(updatedTask, t.settings.notificationTitle, `${t.settings.notificationBody}: ${updatedTask.title}`)
          }
        }
        save(next)
        return next
      })
    } else {
      set(prev => {
        const next = {
          ...prev,
          tasks: prev.tasks.map(t => t.id === id ? { ...t, ...updates } : t),
        }
        if (next.settings.notificationsEnabled) {
          const updatedTask = next.tasks.find(t => t.id === id)
          if (updatedTask) {
            const t = translations[next.settings.language]
            scheduleTaskNotification(updatedTask, t.settings.notificationTitle, `${t.settings.notificationBody}: ${updatedTask.title}`)
          }
        }
        return next
      })
    }
  }, [set])

  const deleteTask = useCallback((id: string, recordHistory: boolean = true) => {
    cancelTaskNotification(id)
    if (recordHistory) {
      set(prev => {
        const taskToDelete = prev.tasks.find(t => t.id === id)
        if (!taskToDelete) return prev
        
        historyManager.push({
          type: 'delete_task',
          timestamp: Date.now(),
          data: { task: taskToDelete }
        })
        
        const next = { ...prev, tasks: prev.tasks.filter(t => t.id !== id) }
        save(next)
        return next
      })
    } else {
      set(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== id) }))
    }
  }, [set])

  const deleteTasks = useCallback((ids: string[], recordHistory: boolean = true) => {
    ids.forEach(id => cancelTaskNotification(id))
    if (recordHistory) {
      set(prev => {
        const tasksToDelete = prev.tasks.filter(t => ids.includes(t.id))
        if (tasksToDelete.length === 0) return prev
        
        historyManager.push({
          type: 'delete_tasks',
          timestamp: Date.now(),
          data: { tasks: tasksToDelete }
        })
        
        const s = new Set(ids)
        const next = { ...prev, tasks: prev.tasks.filter(t => !s.has(t.id)) }
        save(next)
        return next
      })
    } else {
      const s = new Set(ids)
      set(prev => ({ ...prev, tasks: prev.tasks.filter(t => !s.has(t.id)) }))
    }
  }, [set])

  const addTag = useCallback((tag: Tag) => {
    set(prev => ({ ...prev, tags: [...prev.tags, tag] }))
  }, [set])

  const updateTag = useCallback((id: string, updates: Partial<Tag>) => {
    set(prev => ({
      ...prev,
      tags: prev.tags.map(t => t.id === id ? { ...t, ...updates } : t),
    }))
  }, [set])

  const deleteTag = useCallback((id: string) => {
    set(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t.id !== id),
      tasks: prev.tasks.map(t => ({
        ...t,
        tagIds: t.tagIds.filter(tid => tid !== id),
      })),
    }))
  }, [set])

  const reorderTags = useCallback((tagIds: string[]) => {
    set(prev => {
      const tagMap = new Map(prev.tags.map(t => [t.id, t]))
      const reorderedTags = tagIds
        .map(id => tagMap.get(id))
        .filter((t): t is Tag => t !== undefined)
      return { ...prev, tags: reorderedTags }
    })
  }, [set])

  const getDateNote = useCallback((date: string): DateNote | undefined => {
    return state.dateNotes.find(n => n.date === date)
  }, [state.dateNotes])

  const setDateNote = useCallback((date: string, content: string) => {
    set(prev => {
      const now = new Date().toISOString()
      const existing = prev.dateNotes.find(n => n.date === date)
      if (existing) {
        return {
          ...prev,
          dateNotes: prev.dateNotes.map(n => 
            n.date === date ? { ...n, content, updatedAt: now } : n
          ),
        }
      } else {
        const newNote: DateNote = {
          id: `note-${Date.now()}`,
          date,
          content,
          createdAt: now,
          updatedAt: now,
        }
        return {
          ...prev,
          dateNotes: [...prev.dateNotes, newNote],
        }
      }
    })
  }, [set])

  const deleteDateNote = useCallback((date: string) => {
    set(prev => ({
      ...prev,
      dateNotes: prev.dateNotes.filter(n => n.date !== date),
    }))
  }, [set])

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    if (updates.notificationsEnabled === false) {
      cancelAllNotifications()
    }
    set(prev => ({ ...prev, settings: { ...prev.settings, ...updates } }))
  }, [set])

  const updatePomodoro = useCallback((updates: Partial<PomodoroState> | ((prev: PomodoroState) => Partial<PomodoroState>)) => {
    set(prev => {
      const pomodoroUpdates = typeof updates === 'function' 
        ? updates(prev.pomodoro) 
        : updates
      return { 
        ...prev, 
        pomodoro: { ...prev.pomodoro, ...pomodoroUpdates } 
      }
    })
  }, [set])

  const addNote = useCallback((note: Note) => {
    set(prev => ({ ...prev, notes: [...prev.notes, note] }))
  }, [set])

  const updateNote = useCallback((id: string, updates: Partial<Note>) => {
    set(prev => ({
      ...prev,
      notes: prev.notes.map(n => n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n),
    }))
  }, [set])

  const deleteNote = useCallback((id: string) => {
    set(prev => ({ ...prev, notes: prev.notes.filter(n => n.id !== id) }))
  }, [set])

  const getNotesByDate = useCallback((date: string): Note[] => {
    return state.notes.filter(n => n.date === date)
  }, [state.notes])

  const addNoteLine = useCallback((line: NoteLine) => {
    set(prev => ({ ...prev, noteLines: [...prev.noteLines, line] }))
  }, [set])

  const updateNoteLine = useCallback((id: string, updates: Partial<NoteLine>) => {
    set(prev => ({
      ...prev,
      noteLines: prev.noteLines.map(l => l.id === id ? { ...l, ...updates } : l),
    }))
  }, [set])

  const deleteNoteLine = useCallback((id: string) => {
    set(prev => ({ ...prev, noteLines: prev.noteLines.filter(l => l.id !== id) }))
  }, [set])

  const getNoteLinesByDate = useCallback((date: string): NoteLine[] => {
    return state.noteLines.filter(l => l.date === date)
  }, [state.noteLines])

  const importData = useCallback((data: AppState | ExportData, mode: 'merge' | 'overwrite', options?: ImportOptions) => {
    set(prev => {
      const actualData: AppState = 'meta' in data ? data.data : data
      const importOpts: ImportOptions = options ?? {
        tasks: true,
        tags: true,
        dateNotes: true,
        notes: true,
        noteLines: true,
        settings: true,
        pomodoro: true,
      }
      
      if (mode === 'overwrite') {
        return {
          tasks: importOpts.tasks ? actualData.tasks : prev.tasks,
          tags: importOpts.tags ? actualData.tags : prev.tags,
          dateNotes: importOpts.dateNotes ? actualData.dateNotes : prev.dateNotes,
          notes: importOpts.notes ? actualData.notes : prev.notes,
          noteLines: importOpts.noteLines ? actualData.noteLines : prev.noteLines,
          settings: importOpts.settings ? actualData.settings : prev.settings,
          pomodoro: importOpts.pomodoro ? actualData.pomodoro : prev.pomodoro,
        }
      }
      
      const eIds = new Set(prev.tasks.map(t => t.id))
      const eTags = new Set(prev.tags.map(t => t.id))
      const eDateNotes = new Set(prev.dateNotes.map(n => n.date))
      const eNotes = new Set(prev.notes.map(n => n.id))
      const eNoteLines = new Set(prev.noteLines.map(l => l.id))
      const importedNotesWithZIndex = actualData.notes.map((note, index) => ({
        ...note,
        zIndex: note.zIndex ?? prev.notes.length + index + 1,
      }))
      
      return {
        tasks: importOpts.tasks 
          ? [...prev.tasks, ...actualData.tasks.filter(t => !eIds.has(t.id))]
          : prev.tasks,
        tags: importOpts.tags 
          ? [...prev.tags, ...actualData.tags.filter(t => !eTags.has(t.id))]
          : prev.tags,
        dateNotes: importOpts.dateNotes 
          ? [...prev.dateNotes, ...actualData.dateNotes.filter(n => !eDateNotes.has(n.date))]
          : prev.dateNotes,
        notes: importOpts.notes 
          ? [...prev.notes, ...importedNotesWithZIndex.filter(n => !eNotes.has(n.id))]
          : prev.notes,
        noteLines: importOpts.noteLines 
          ? [...prev.noteLines, ...actualData.noteLines.filter(l => !eNoteLines.has(l.id))]
          : prev.noteLines,
        settings: importOpts.settings ? actualData.settings : prev.settings,
        pomodoro: importOpts.pomodoro ? actualData.pomodoro : prev.pomodoro,
      }
    })
  }, [set])

  const exportData = useCallback((): ExportData => {
    return {
      meta: {
        version: APP_VERSION,
        exportDate: new Date().toISOString(),
        appName: APP_NAME,
      },
      data: state,
    }
  }, [state])

  const undo = useCallback((): boolean => {
    const action = historyManager.undo()
    if (!action) return false
    
    set(prev => {
      let next = prev
      
      switch (action.type) {
        case 'create_task': {
          const data = action.data as { task: Task }
          next = { ...prev, tasks: prev.tasks.filter(t => t.id !== data.task.id) }
          break
        }
        case 'update_task': {
          const data = action.data as { taskId: string; previousState: Partial<Task>; newState: Partial<Task> }
          next = {
            ...prev,
            tasks: prev.tasks.map(t => 
              t.id === data.taskId ? { ...t, ...data.previousState } : t
            ),
          }
          break
        }
        case 'delete_task': {
          const data = action.data as { task: Task }
          next = { ...prev, tasks: [...prev.tasks, data.task] }
          break
        }
        case 'delete_tasks': {
          const data = action.data as { tasks: Task[] }
          next = { ...prev, tasks: [...prev.tasks, ...data.tasks] }
          break
        }
      }
      
      save(next)
      return next
    })
    
    return true
  }, [set])

  const redo = useCallback((): boolean => {
    const action = historyManager.redo()
    if (!action) return false
    
    set(prev => {
      let next = prev
      
      switch (action.type) {
        case 'create_task': {
          const data = action.data as { task: Task }
          next = { ...prev, tasks: [...prev.tasks, data.task] }
          break
        }
        case 'update_task': {
          const data = action.data as { taskId: string; previousState: Partial<Task>; newState: Partial<Task> }
          next = {
            ...prev,
            tasks: prev.tasks.map(t => 
              t.id === data.taskId ? { ...t, ...data.newState } : t
            ),
          }
          break
        }
        case 'delete_task': {
          const data = action.data as { task: Task }
          next = { ...prev, tasks: prev.tasks.filter(t => t.id !== data.task.id) }
          break
        }
        case 'delete_tasks': {
          const data = action.data as { tasks: Task[] }
          const ids = new Set(data.tasks.map(t => t.id))
          next = { ...prev, tasks: prev.tasks.filter(t => !ids.has(t.id)) }
          break
        }
      }
      
      save(next)
      return next
    })
    
    return true
  }, [set])

  const canUndo = useCallback((): boolean => {
    return historyManager.canUndo()
  }, [])

  const canRedo = useCallback((): boolean => {
    return historyManager.canRedo()
  }, [])

  const value: StoreContextValue = {
    state,
    addTask,
    updateTask,
    deleteTask,
    deleteTasks,
    addTag,
    updateTag,
    deleteTag,
    reorderTags,
    getDateNote,
    setDateNote,
    deleteDateNote,
    updateSettings,
    updatePomodoro,
    importData,
    exportData,
    addNote,
    updateNote,
    deleteNote,
    getNotesByDate,
    addNoteLine,
    updateNoteLine,
    deleteNoteLine,
    getNoteLinesByDate,
    undo,
    redo,
    canUndo,
    canRedo,
  }

  if (!hydrated) {
    return <div className="min-h-screen bg-background" />
  }

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  )
}
