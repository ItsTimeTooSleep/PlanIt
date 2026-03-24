'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Columns, Grid, Settings, Undo2, Redo2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useStore, useLanguage } from '@/lib/store'
import { useTranslations } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { WeekView } from './week-view'
import { MonthView } from './month-view'
import { TaskModal } from '@/components/task-modal'
import { DateNoteModal } from './date-note-modal'
import type { Task } from '@/lib/types'
import {
  addWeeks, subWeeks, addMonths, subMonths,
  startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  format,
} from 'date-fns'

type CalView = 'week' | 'month'

export function CalendarView() {
  const lang = useLanguage()
  const t = useTranslations(lang)
  const { state, updateTask, deleteTasks, updateSettings, undo, redo, canUndo, canRedo } = useStore()

  const [view, setView] = useState<CalView>('week')
  const [referenceDate, setReferenceDate] = useState(new Date())
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [defaultDate, setDefaultDate] = useState<string | undefined>()
  const [defaultStart, setDefaultStart] = useState<string | undefined>()
  const [defaultEnd, setDefaultEnd] = useState<string | undefined>()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [selectMode, setSelectMode] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [dateNoteModalOpen, setDateNoteModalOpen] = useState(false)
  const [selectedDateForNote, setSelectedDateForNote] = useState<string | null>(null)
  const [tempStartTime, setTempStartTime] = useState(state.settings.calendar.dayStartTime)
  const [tempEndTime, setTempEndTime] = useState(state.settings.calendar.dayEndTime)
  const [tempHourDivisions, setTempHourDivisions] = useState(state.settings.calendar.hourDivisions)
  const [tempHourHeight, setTempHourHeight] = useState(state.settings.calendar.hourHeight)
  const [tempTimeSnap, setTempTimeSnap] = useState(state.settings.calendar.timeSnap ?? 15)
  const [tempSnapEnabled, setTempSnapEnabled] = useState(state.settings.calendar.snapEnabled ?? true)
  const [tempSnapThreshold, setTempSnapThreshold] = useState(state.settings.calendar.snapThreshold ?? 10)
  const [isBatchMenuSticky, setIsBatchMenuSticky] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null)
  const viewContainerRef = useRef<HTMLDivElement>(null)
  const batchMenuRef = useRef<HTMLDivElement>(null)
  const prevScrollTopRef = useRef(0)

  function goBack() {
    setReferenceDate(prev => view === 'week' ? subWeeks(prev, 1) : subMonths(prev, 1))
  }

  function goForward() {
    setReferenceDate(prev => view === 'week' ? addWeeks(prev, 1) : addMonths(prev, 1))
  }

  function goToday() {
    setReferenceDate(new Date())
  }

  function openCreate(date: string, startTime?: string, endTime?: string) {
    setDefaultDate(date)
    setDefaultStart(startTime)
    setDefaultEnd(endTime)
    setEditTask(null)
    setModalOpen(true)
  }

  function openEdit(task: Task) {
    setEditTask(task)
    setModalOpen(true)
  }

  function openDateNote(date: string) {
    setSelectedDateForNote(date)
    setDateNoteModalOpen(true)
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleBatchDelete() {
    deleteTasks([...selectedIds])
    setSelectedIds(new Set())
    setSelectMode(false)
  }

  function handleDeleteTaskRequest(task: Task) {
    setTaskToDelete(task)
    setDeleteConfirmOpen(true)
  }

  function confirmDeleteTask() {
    if (taskToDelete) {
      deleteTasks([taskToDelete.id])
      setTaskToDelete(null)
    }
    setDeleteConfirmOpen(false)
  }

  function openSettings() {
    setTempStartTime(state.settings.calendar.dayStartTime)
    setTempEndTime(state.settings.calendar.dayEndTime)
    setTempHourDivisions(state.settings.calendar.hourDivisions)
    setTempHourHeight(state.settings.calendar.hourHeight)
    setTempTimeSnap(state.settings.calendar.timeSnap ?? 15)
    setTempSnapEnabled(state.settings.calendar.snapEnabled ?? true)
    setTempSnapThreshold(state.settings.calendar.snapThreshold ?? 10)
    setSettingsOpen(true)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement
      const isInputFocused = activeEl?.tagName === 'INPUT' || 
                             activeEl?.tagName === 'TEXTAREA' ||
                             (activeEl instanceof HTMLElement && activeEl.isContentEditable)
      
      if (isInputFocused) return
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      }
      
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault()
        redo()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo])

  /**
   * 处理 Ctrl+滚轮 调整日历高度
   * @param e - 滚轮事件对象
   */
  function handleWheel(e: React.WheelEvent) {
    if (!e.ctrlKey) return
    
    e.preventDefault()
    
    const currentHeight = state.settings.calendar.hourHeight
    const delta = e.deltaY > 0 ? -8 : 8
    const newHeight = Math.max(24, Math.min(300, currentHeight + delta))
    
    if (newHeight !== currentHeight) {
      updateSettings({
        calendar: {
          ...state.settings.calendar,
          hourHeight: newHeight
        }
      })
    }
  }

  function saveCalendarSettings() {
    updateSettings({
      calendar: {
        dayStartTime: tempStartTime,
        dayEndTime: tempEndTime,
        hourDivisions: tempHourDivisions,
        hourHeight: tempHourHeight,
        timeSnap: tempTimeSnap,
        snapEnabled: tempSnapEnabled,
        snapThreshold: tempSnapThreshold,
      }
    })
    setSettingsOpen(false)
  }

  useEffect(() => {
    const handleScroll = () => {
      const scrollContainer = viewContainerRef.current?.querySelector('.overflow-y-auto')
      if (scrollContainer) {
        const currentScrollTop = scrollContainer.scrollTop
        if (currentScrollTop > prevScrollTopRef.current && currentScrollTop > 60) {
          setIsBatchMenuSticky(true)
        } else if (currentScrollTop < prevScrollTopRef.current - 10) {
          setIsBatchMenuSticky(false)
        }
        prevScrollTopRef.current = currentScrollTop
      }
    }

    const scrollContainer = viewContainerRef.current?.querySelector('.overflow-y-auto')
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll)
      return () => scrollContainer.removeEventListener('scroll', handleScroll)
    }
  }, [selectMode])

  // Title
  let title = ''
  if (view === 'week') {
    const start = startOfWeek(referenceDate, { weekStartsOn: 0 })
    const end = endOfWeek(referenceDate, { weekStartsOn: 0 })
    if (lang === 'zh') {
      title = `${format(start, 'M月d日')} – ${format(end, 'M月d日')}`
    } else {
      title = `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`
    }
  } else {
    title = lang === 'zh' ? format(referenceDate, 'yyyy年M月') : format(referenceDate, 'MMMM yyyy')
  }

  return (
    <div className="flex flex-col h-[calc(100vh-2.25rem)] ml-16">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-3 shrink-0 flex-wrap">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={goBack} className="w-8 h-8">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={goToday} className="text-xs px-2">
            {t.calendar.today}
          </Button>
          <Button variant="ghost" size="icon" onClick={goForward} className="w-8 h-8">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <h2 className="flex-1 text-sm font-semibold text-center">{title}</h2>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={undo}
            disabled={!canUndo()}
            className="w-8 h-8"
            title={t.calendar.undo + ' (Ctrl+Z)'}
          >
            <Undo2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={redo}
            disabled={!canRedo()}
            className="w-8 h-8"
            title={t.calendar.redo + ' (Ctrl+Y)'}
          >
            <Redo2 className="w-4 h-4" />
          </Button>
          <Button
            variant={view === 'week' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setView('week')}
            className="w-8 h-8"
            title={t.calendar.week}
          >
            <Columns className="w-4 h-4" />
          </Button>
          <Button
            variant={view === 'month' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setView('month')}
            className="w-8 h-8"
            title={t.calendar.month}
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={openSettings}
            className="w-8 h-8"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Batch actions bar */}
      {selectMode && (
        <div
          ref={batchMenuRef}
          className={cn(
            "flex items-center gap-2 px-4 py-2 bg-muted/60 shrink-0 text-sm transition-all duration-200 z-50",
            isBatchMenuSticky && "sticky top-0"
          )}
        >
          <span className="text-muted-foreground">{t.calendar.selected(selectedIds.size)}</span>
          <Button size="sm" variant="destructive" onClick={handleBatchDelete} disabled={selectedIds.size === 0} className="h-7 text-xs">
            {t.calendar.batchDelete}
          </Button>
          <Button size="sm" variant="outline" onClick={() => { setSelectMode(false); setSelectedIds(new Set()) }} className="h-7 text-xs ml-auto">
            {t.calendar.exitSelectMode}
          </Button>
        </div>
      )}

      {/* View */}
      <div ref={viewContainerRef} className="flex-1 overflow-hidden flex flex-col" onWheel={handleWheel}>
        {view === 'week' ? (
          <WeekView
            referenceDate={referenceDate}
            tasks={state.tasks}
            tags={state.tags}
            dateNotes={state.dateNotes}
            onOpenTask={openEdit}
            onCreateTask={(date, start, end) => openCreate(date, start, end)}
            onOpenDateNote={openDateNote}
            selectMode={selectMode}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onEnterSelectMode={() => setSelectMode(true)}
            calendarSettings={state.settings.calendar}
            onDeleteTask={handleDeleteTaskRequest}
          />
        ) : (
          <MonthView
            referenceDate={referenceDate}
            tasks={state.tasks}
            tags={state.tags}
            dateNotes={state.dateNotes}
            onOpenTask={openEdit}
            onCreateTask={openCreate}
            onOpenDateNote={openDateNote}
          />
        )}
      </div>

      <TaskModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditTask(null) }}
        task={editTask}
        defaultDate={defaultDate}
        defaultStartTime={defaultStart}
        defaultEndTime={defaultEnd}
      />

      {/* Date Note Modal */}
      {selectedDateForNote && (
        <DateNoteModal
          open={dateNoteModalOpen}
          onClose={() => { setDateNoteModalOpen(false); setSelectedDateForNote(null) }}
          date={selectedDateForNote}
        />
      )}

      {/* Calendar Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-sm max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t.calendarSettings.title}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-1.5">
              <Label>{t.calendarSettings.timeRange}</Label>
              <div className="flex gap-4 items-center">
                <div className="flex flex-col gap-1 flex-1">
                  <Label className="text-xs text-muted-foreground">{t.calendarSettings.startTime}</Label>
                  <select
                    value={tempStartTime}
                    onChange={(e) => setTempStartTime(parseInt(e.target.value))}
                    className="w-full p-2 rounded-md border border-border bg-background"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <Label className="text-xs text-muted-foreground">{t.calendarSettings.endTime}</Label>
                  <select
                    value={tempEndTime}
                    onChange={(e) => setTempEndTime(parseInt(e.target.value))}
                    className="w-full p-2 rounded-md border border-border bg-background"
                  >
                    {Array.from({ length: 25 }, (_, i) => (
                      <option key={i} value={i}>{i === 24 ? '24:00' : String(i).padStart(2, '0') + ':00'}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>{t.calendarSettings.timeSnap}</Label>
              <p className="text-xs text-muted-foreground">{t.calendarSettings.timeSnapDesc}</p>
              <select
                value={tempTimeSnap}
                onChange={(e) => setTempTimeSnap(parseInt(e.target.value))}
                className="w-full p-2 rounded-md border border-border bg-background"
              >
                {[1, 5, 10, 15].map(m => (
                  <option key={m} value={m}>{m} {lang === 'zh' ? '分钟' : 'min'}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label>{t.calendarSettings.snapEnabled}</Label>
                <button
                  type="button"
                  role="switch"
                  aria-checked={tempSnapEnabled}
                  onClick={() => setTempSnapEnabled(!tempSnapEnabled)}
                  className={cn(
                    'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                    tempSnapEnabled ? 'bg-primary' : 'bg-muted'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                      tempSnapEnabled ? 'translate-x-4' : 'translate-x-0.5'
                    )}
                  />
                </button>
              </div>
              <p className="text-xs text-muted-foreground">{t.calendarSettings.snapEnabledDesc}</p>
            </div>

            {tempSnapEnabled && (
              <div className="flex flex-col gap-1.5">
                <Label>{t.calendarSettings.snapThreshold}</Label>
                <p className="text-xs text-muted-foreground">{t.calendarSettings.snapThresholdDesc}</p>
                <select
                  value={tempSnapThreshold}
                  onChange={(e) => setTempSnapThreshold(parseInt(e.target.value))}
                  className="w-full p-2 rounded-md border border-border bg-background"
                >
                  {[5, 10, 15, 20, 30].map(m => (
                    <option key={m} value={m}>{m} {lang === 'zh' ? '分钟' : 'min'}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Label>{lang === 'zh' ? '每小时分割数' : 'Divisions per hour'}</Label>
              <select
                value={tempHourDivisions}
                onChange={(e) => setTempHourDivisions(parseInt(e.target.value))}
                className="w-full p-2 rounded-md border border-border bg-background"
              >
                {[1, 2, 3, 4, 6].map(i => (
                  <option key={i} value={i}>{i} {lang === 'zh' ? '段' : 'divs'} ({lang === 'zh' ? '每' : 'every'} {60 / i} {lang === 'zh' ? '分钟' : 'min'})</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>{lang === 'zh' ? '日历高度 (每小时像素)' : 'Calendar Height (px per hour)'}</Label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={tempHourHeight}
                  onChange={(e) => {
                    const value = parseInt(e.target.value)
                    if (!isNaN(value) && value >= 24 && value <= 300) {
                      setTempHourHeight(value)
                    }
                  }}
                  onBlur={(e) => {
                    const value = parseInt(e.target.value)
                    if (isNaN(value) || value < 24) {
                      setTempHourHeight(24)
                    } else if (value > 300) {
                      setTempHourHeight(300)
                    }
                  }}
                  min={24}
                  max={300}
                  className="flex-1 p-2 rounded-md border border-border bg-background"
                />
                <span className="text-xs text-muted-foreground">px</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>{t.common.cancel}</Button>
            <Button onClick={saveCalendarSettings} disabled={tempStartTime >= tempEndTime}>{t.common.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t.task.deleteConfirmTitle}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            {t.task.deleteConfirm}
            {taskToDelete && (
              <span className="block mt-2 font-medium text-foreground">
                "{taskToDelete.title}"
              </span>
            )}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>{t.common.cancel}</Button>
            <Button variant="destructive" onClick={confirmDeleteTask}>{t.common.delete}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
