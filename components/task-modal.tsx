'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useStore, useLanguage } from '@/lib/store'
import { useTranslations } from '@/lib/i18n'
import { generateId, expandRepeatTasks } from '@/lib/task-utils'
import type { Task, TaskStatus, RepeatFrequency } from '@/lib/types'
import { format, addDays } from 'date-fns'
import { Plus, Trash2 } from 'lucide-react'
import { PRESET_TAG_COLORS } from '@/lib/colors'

interface TaskModalProps {
  open: boolean
  onClose: () => void
  task?: Task | null
  defaultDate?: string
  defaultStartTime?: string
  defaultEndTime?: string
}

const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六']
const WEEKDAY_LABELS_EN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export function TaskModal({ open, onClose, task, defaultDate, defaultStartTime, defaultEndTime }: TaskModalProps) {
  const lang = useLanguage()
  const t = useTranslations(lang)
  const { state, addTask, updateTask, deleteTask, deleteTasks } = useStore()

  const today = format(new Date(), 'yyyy-MM-dd')
  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd')

  const [title, setTitle] = useState('')
  const [date, setDate] = useState<string>(today)
  const [dueDate, setDueDate] = useState<string>(tomorrow)
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [isAllDay, setIsAllDay] = useState(false)
  const [tagIds, setTagIds] = useState<string[]>([])
  const [frequency, setFrequency] = useState<RepeatFrequency>('none')
  const [weekdays, setWeekdays] = useState<number[]>([])
  const [repeatEndDate, setRepeatEndDate] = useState('')
  const [repeatInterval, setRepeatInterval] = useState(1)
  const [repeatUnit, setRepeatUnit] = useState<'days' | 'weeks' | 'months'>('days')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<TaskStatus>('pending')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteAllRecurring, setDeleteAllRecurring] = useState(false)

  const { addTag } = useStore()

  // Quick create tag
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState(PRESET_TAG_COLORS[0])
  const [customTagColor, setCustomTagColor] = useState('#000000')
  const [useCustomColor, setUseCustomColor] = useState(false)
  const [showNewTag, setShowNewTag] = useState(false)

  useEffect(() => {
    if (!open) return
    if (task) {
      setTitle(task.title)
      setDate(task.date ?? today)
      setDueDate(task.dueDate ?? tomorrow)
      setStartTime(task.startTime ?? '09:00')
      setEndTime(task.endTime ?? '10:00')
      setIsAllDay(task.isAllDay)
      setTagIds(task.tagIds)
      setFrequency(task.repeatRule.frequency)
      setWeekdays(task.repeatRule.weekdays ?? [])
      setRepeatEndDate(task.repeatRule.endDate ?? '')
      setRepeatInterval(task.repeatRule.interval ?? 1)
      setRepeatUnit(task.repeatRule.customUnit ?? 'days')
      setNotes(task.notes ?? '')
      setStatus(task.status)
    } else {
      setTitle('')
      setDate(defaultDate ?? today)
      setDueDate(tomorrow)
      setStartTime(defaultStartTime ?? '09:00')
      setEndTime(defaultEndTime ?? '10:00')
      setIsAllDay(false)
      setTagIds([])
      setFrequency('none')
      setWeekdays([])
      setRepeatEndDate('')
      setRepeatInterval(1)
      setRepeatUnit('days')
      setNotes('')
      setStatus('pending')
    }
    setShowNewTag(false)
    setNewTagName('')
    setNewTagColor(PRESET_TAG_COLORS[0])
    setCustomTagColor('#000000')
    setUseCustomColor(false)
    setShowDeleteConfirm(false)
    setDeleteAllRecurring(false)
  }, [open, task, defaultDate, defaultStartTime, defaultEndTime, today, tomorrow])

  function handleSave() {
    if (!title.trim()) return
    if (!date && !dueDate) return

    const baseTask: Task = {
      id: task?.id ?? generateId(),
      title: title.trim(),
      date: date || undefined,
      dueDate: dueDate || undefined,
      startTime: isAllDay ? undefined : startTime,
      endTime: isAllDay ? undefined : endTime,
      isAllDay,
      tagIds,
      repeatRule: {
        frequency,
        weekdays: frequency === 'weekly' ? weekdays : undefined,
        endDate: repeatEndDate || undefined,
        interval: frequency === 'custom' ? repeatInterval : undefined,
        customUnit: frequency === 'custom' ? repeatUnit : undefined,
      },
      notes: notes.trim() || undefined,
      status,
      createdAt: task?.createdAt ?? new Date().toISOString(),
    }

    if (task) {
      updateTask(task.id, baseTask)
    } else {
      addTask(baseTask)
      // Generate repeat instances
      if (frequency !== 'none') {
        const instances = expandRepeatTasks(baseTask)
        instances.forEach(inst => addTask(inst))
      }
    }
    onClose()
  }

  function getRepeatTaskIds(currentTask: Task) {
    if (currentTask.repeatRule.frequency === 'none') return [currentTask.id]
    
    const baseCreatedAt = currentTask.createdAt.slice(0, 19)
    return state.tasks
      .filter(t => t.title === currentTask.title && t.createdAt.slice(0, 19) === baseCreatedAt)
      .map(t => t.id)
  }

  function handleDelete() {
    if (task) {
      const idsToDelete = deleteAllRecurring ? getRepeatTaskIds(task) : [task.id]
      deleteTasks(idsToDelete)
      onClose()
    }
  }

  function handleCreateTagInline() {
    if (!newTagName.trim()) return
    const id = generateId()
    addTag({ id, name: newTagName.trim(), color: useCustomColor ? customTagColor : newTagColor })
    setTagIds(prev => [...prev, id])
    setNewTagName('')
    setNewTagColor(PRESET_TAG_COLORS[0])
    setCustomTagColor('#000000')
    setUseCustomColor(false)
    setShowNewTag(false)
  }

  function toggleWeekday(d: number) {
    setWeekdays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])
  }

  const wdLabels = lang === 'zh' ? WEEKDAY_LABELS : WEEKDAY_LABELS_EN

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? t.task.edit : t.task.new}</DialogTitle>
          <DialogDescription aria-describedby={undefined} className="sr-only">
            {task ? t.task.edit : t.task.new}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="task-title">{t.task.title} *</Label>
            <Input
              id="task-title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={t.task.titlePlaceholder}
              autoFocus
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="task-date">{t.task.date}</Label>
              <Input id="task-date" type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="task-due-date">{t.task.dueDate}</Label>
              <Input id="task-due-date" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
          </div>

          {/* All Day */}
          <div className="flex items-center justify-between">
            <Label htmlFor="all-day-switch">{t.task.allDay}</Label>
            <Switch id="all-day-switch" checked={isAllDay} onCheckedChange={setIsAllDay} />
          </div>

          {/* Times */}
          {!isAllDay && (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="start-time">{t.task.startTime}</Label>
                <Input id="start-time" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="end-time">{t.task.endTime}</Label>
                <Input id="end-time" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
              </div>
            </div>
          )}

          {/* Tags */}
          <div className="flex flex-col gap-1.5">
            <Label>{t.task.tags}</Label>
            <div className="flex flex-wrap gap-1.5">
              {state.tags.map(tag => {
                const selected = tagIds.includes(tag.id)
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => setTagIds(prev => selected ? prev.filter(id => id !== tag.id) : [...prev, tag.id])}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all border"
                    style={selected
                      ? { backgroundColor: tag.color, color: '#fff', borderColor: tag.color }
                      : { backgroundColor: 'transparent', color: tag.color, borderColor: tag.color }
                    }
                  >
                    {tag.name}
                  </button>
                )
              })}
              <button
                type="button"
                onClick={() => setShowNewTag(v => !v)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border border-dashed border-muted-foreground text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                <Plus className="w-3 h-3" />
                {t.task.newTag}
              </button>
            </div>
            {showNewTag && (
              <div className="flex flex-col gap-2 mt-1">
                <div className="flex gap-2 items-center">
                  <div className="flex gap-1 flex-wrap">
                    {PRESET_TAG_COLORS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setNewTagColor(c)
                          setUseCustomColor(false)
                        }}
                        className={`w-5 h-5 rounded-full border-2 transition-all ${
                          !useCustomColor && newTagColor === c ? 'border-foreground' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                    <button
                      type="button"
                      onClick={() => setUseCustomColor(true)}
                      className={`w-5 h-5 rounded-full border-2 transition-all ${
                        useCustomColor ? 'border-foreground' : 'border-transparent'
                      }`}
                      style={{ 
                        backgroundColor: useCustomColor ? customTagColor : '#e5e7eb',
                        backgroundImage: useCustomColor ? 'none' : 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)',
                        backgroundSize: '8px 8px'
                      }}
                    />
                  </div>
                  {useCustomColor && (
                    <input
                      type="color"
                      value={customTagColor}
                      onChange={e => setCustomTagColor(e.target.value)}
                      className="w-7 h-7 rounded-full border border-border"
                    />
                  )}
                  <Input
                    className="h-7 text-xs flex-1"
                    value={newTagName}
                    onChange={e => setNewTagName(e.target.value)}
                    placeholder={t.settings.tagNamePlaceholder}
                    onKeyDown={e => e.key === 'Enter' && handleCreateTagInline()}
                  />
                  <Button size="sm" variant="outline" onClick={handleCreateTagInline} className="h-7 text-xs shrink-0">
                    {t.common.add}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Repeat */}
          <div className="flex flex-col gap-1.5">
            <Label>{t.task.repeatRule}</Label>
            <Select value={frequency} onValueChange={v => setFrequency(v as RepeatFrequency)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t.repeat.none}</SelectItem>
                <SelectItem value="daily">{t.repeat.daily}</SelectItem>
                <SelectItem value="workdays">{t.repeat.workdays}</SelectItem>
                <SelectItem value="weekly">{t.repeat.weekly}</SelectItem>
                <SelectItem value="monthly">{t.repeat.monthly}</SelectItem>
                <SelectItem value="custom">{t.repeat.custom}</SelectItem>
              </SelectContent>
            </Select>

            {frequency === 'weekly' && (
              <div className="flex gap-1 mt-1">
                {wdLabels.map((label, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleWeekday(i)}
                    className="w-8 h-8 rounded-full text-xs font-medium transition-colors"
                    style={weekdays.includes(i)
                      ? { backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }
                      : { backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {frequency === 'custom' && (
              <div className="flex gap-2 items-center mt-1">
                <span className="text-sm">{t.repeat.customEvery}</span>
                <Input
                  type="number"
                  min={1}
                  value={repeatInterval}
                  onChange={e => setRepeatInterval(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16"
                />
                <Select value={repeatUnit} onValueChange={v => setRepeatUnit(v as 'days' | 'weeks' | 'months')}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="days">{t.repeat.customDays}</SelectItem>
                    <SelectItem value="weeks">{t.repeat.customWeeks}</SelectItem>
                    <SelectItem value="months">{t.repeat.customMonths}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {frequency !== 'none' && (
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">{t.repeat.endDate}</Label>
                <Input
                  type="date"
                  value={repeatEndDate}
                  onChange={e => setRepeatEndDate(e.target.value)}
                  placeholder={t.repeat.endDatePlaceholder}
                />
              </div>
            )}
          </div>

          {/* Status (only for existing tasks) */}
          {task && (
            <div className="flex flex-col gap-1.5">
              <Label>{t.task.status}</Label>
              <Select value={status} onValueChange={v => setStatus(v as TaskStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">{t.status.pending}</SelectItem>
                  <SelectItem value="completed">{t.status.completed}</SelectItem>
                  <SelectItem value="skipped">{t.status.skipped}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="task-notes">{t.task.notes}</Label>
            <Textarea
              id="task-notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={t.task.notesPlaceholder}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 mt-2">
          {task && (
            <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)} className="sm:mr-auto">
              <Trash2 className="w-4 h-4 mr-1" />
              {t.common.delete}
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>{t.common.cancel}</Button>
          <Button onClick={handleSave} disabled={!title.trim() || (!date && !dueDate)} title={(!date && !dueDate) ? t.task.dateOrDueDateRequired : undefined}>{t.common.save}</Button>
        </DialogFooter>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>{t.task.deleteConfirmTitle}</DialogTitle>
              <DialogDescription>{t.task.deleteConfirm}</DialogDescription>
            </DialogHeader>
            {task && task.repeatRule.frequency !== 'none' && (
              <div className="flex items-center space-x-2 py-2">
                <Checkbox
                  id="delete-all-recurring"
                  checked={deleteAllRecurring}
                  onCheckedChange={(checked) => setDeleteAllRecurring(checked as boolean)}
                />
                <Label htmlFor="delete-all-recurring" className="text-sm font-normal cursor-pointer">
                  {t.task.deleteAllRepeat}
                </Label>
              </div>
            )}
            <DialogFooter className="flex sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                {t.common.cancel}
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                {t.common.delete}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  )
}
