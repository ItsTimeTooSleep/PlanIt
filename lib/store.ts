'use client'

import { createContext, useContext } from 'react'
import type { AppState, Task, Tag, AppSettings, Language, PomodoroState, DateNote, Note, NoteLine, ExportData, ImportOptions } from './types'

export interface StoreContextValue {
  state: AppState
  addTask: (task: Task) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  deleteTasks: (ids: string[]) => void
  addTag: (tag: Tag) => void
  updateTag: (id: string, updates: Partial<Tag>) => void
  deleteTag: (id: string) => void
  reorderTags: (tagIds: string[]) => void
  getDateNote: (date: string) => DateNote | undefined
  setDateNote: (date: string, content: string) => void
  deleteDateNote: (date: string) => void
  updateSettings: (updates: Partial<AppSettings>) => void
  updatePomodoro: (updates: Partial<PomodoroState> | ((prev: PomodoroState) => Partial<PomodoroState>)) => void
  importData: (data: AppState | ExportData, mode: 'merge' | 'overwrite', options?: ImportOptions) => void
  exportData: () => ExportData
  addNote: (note: Note) => void
  updateNote: (id: string, updates: Partial<Note>) => void
  deleteNote: (id: string) => void
  getNotesByDate: (date: string) => Note[]
  addNoteLine: (line: NoteLine) => void
  updateNoteLine: (id: string, updates: Partial<NoteLine>) => void
  deleteNoteLine: (id: string) => void
  getNoteLinesByDate: (date: string) => NoteLine[]
  undo: () => boolean
  redo: () => boolean
  canUndo: () => boolean
  canRedo: () => boolean
}

export const StoreContext = createContext<StoreContextValue | null>(null)

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}

export function useLanguage(): Language {
  return useStore().state.settings.language
}
