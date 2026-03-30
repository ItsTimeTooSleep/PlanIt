'use client'

import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useStore, useLanguage } from '@/lib/store'
import { useTranslations } from '@/lib/i18n'
import { generateId, expandRepeatTasks, getTaskIdsToDelete, isPartOfRecurringGroup } from '@/lib/task-utils'
import type { Task, TaskStatus, RepeatFrequency, DeleteRecurringOption } from '@/lib/types'
import { format, addDays } from 'date-fns'
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import { PRESET_TAG_COLORS } from '@/lib/colors'
import { TaskDeleteDialog } from './task-delete-dialog'

interface TaskModalProps {
  open: boolean
  onClose: () => void
  task?: Task | null
  defaultDate?: string
  defaultStartTime?: string
  defaultEndTime?: string
  defaultStatus?: TaskStatus
}

const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六']
const WEEKDAY_LABELS_EN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export function TaskModal({ open, onClose, task, defaultDate, defaultStartTime, defaultEndTime, defaultStatus }: TaskModalProps) {
  const lang = useLanguage()
  const t = useTranslations(lang)
  const { state, addTask, updateTask, deleteTask, deleteTasks } = useStore()

  const today = format(new Date(), 'yyyy-MM-dd')
  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd')

  const [title, setTitle] = useState('')
  const [date, setDate] = useState<string>('')
  const [dueDate, setDueDate] = useState<string>('')
  const [startTime, setStartTime] = useState<string>('')
  const [endTime, setEndTime] = useState<string>('')
  const [isAllDay, setIsAllDay] = useState(false)
  const [tagIds, setTagIds] = useState<string[]>([])
  const [frequency, setFrequency] = useState<RepeatFrequency>('none')
  const [weekdays, setWeekdays] = useState<number[]>([])
  const [repeatEndDate, setRepeatEndDate] = useState('')
  const [repeatInterval, setRepeatInterval] = useState(1)
  const [repeatUnit, setRepeatUnit] = useState<'days' | 'weeks' | 'months' | 'years'>('days')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<TaskStatus>('pending')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  const [dueDateOffset, setDueDateOffset] = useState<number>(0)

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
      setDate(task.date ?? '')
      setDueDate(task.dueDate ?? '')
      setStartTime(task.startTime ?? '')
      setEndTime(task.endTime ?? '')
      setIsAllDay(task.isAllDay)
      setTagIds(task.tagIds)
      setFrequency(task.repeatRule.frequency)
      setWeekdays(task.repeatRule.weekdays ?? [])
      setRepeatEndDate(task.repeatRule.endDate ?? '')
      setRepeatInterval(task.repeatRule.interval ?? 1)
      setRepeatUnit(task.repeatRule.customUnit ?? 'days')
      setNotes(task.notes ?? '')
      setStatus(task.status)
      // 计算初始截止日期偏移
      if (task.date && task.dueDate) {
        const planDate = new Date(task.date)
        const due = new Date(task.dueDate)
        const diff = Math.floor((due.getTime() - planDate.getTime()) / (1000 * 60 * 60 * 24))
        setDueDateOffset(diff)
      } else {
        setDueDateOffset(0)
      }
    } else {
      setTitle('')
      setDate(defaultDate ?? '')
      setDueDate(tomorrow)
      setStartTime(defaultStartTime ?? '')
      setEndTime(defaultEndTime ?? '')
      setIsAllDay(false)
      setTagIds([])
      setFrequency('none')
      setWeekdays([])
      setRepeatEndDate('')
      setRepeatInterval(1)
      setRepeatUnit('days')
      setNotes('')
      setStatus(defaultStatus ?? 'pending')
      setDueDateOffset(0)
      setShowAdvancedOptions(false)
    }
    setShowNewTag(false)
    setNewTagName('')
    setNewTagColor(PRESET_TAG_COLORS[0])
    setCustomTagColor('#000000')
    setUseCustomColor(false)
    setShowDeleteConfirm(false)
  }, [open, task, defaultDate, defaultStartTime, defaultEndTime, defaultStatus, today, tomorrow])

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

  function handleDeleteConfirm(option: DeleteRecurringOption) {
    if (task) {
      const idsToDelete = getTaskIdsToDelete(task, state.tasks, option)
      deleteTasks(idsToDelete)
      onClose()
    }
  }

  const isRecurring = task ? isPartOfRecurringGroup(task, state.tasks) : false

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

  /**
   * 处理键盘事件，Enter键保存任务
   * @param e - 键盘事件对象
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      const target = e.target as HTMLElement
      if (target.tagName !== 'TEXTAREA') {
        e.preventDefault()
        handleSave()
      }
    }
  }, [handleSave])

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" onKeyDown={handleKeyDown}>
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

          {/* 截止日期 - 独立分组 */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="task-due-date">{t.task.dueDate}</Label>
            <Input id="task-due-date" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </div>

          {/* 计划日期与时间设置区域 */}
          <div className="flex flex-col gap-3 p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-semibold text-foreground">计划时间</Label>
            </div>
            
            {/* 计划日期 */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="task-date" className="text-xs text-muted-foreground">计划日期</Label>
              <Input 
                id="task-date" 
                type="date" 
                value={date} 
                onChange={e => {
                  const newDate = e.target.value
                  setDate(newDate)
                  if (!newDate) {
                    setIsAllDay(false)
                    setStartTime('')
                    setEndTime('')
                  }
                }} 
              />
            </div>

            {/* 全天任务开关 */}
            <div className="flex items-center justify-between pt-1">
              <Label htmlFor="all-day-switch" className={`text-sm ${!date ? 'text-muted-foreground' : ''}`}>全天任务</Label>
              <Switch 
                id="all-day-switch" 
                checked={isAllDay} 
                onCheckedChange={setIsAllDay} 
                disabled={!date}
              />
            </div>

            {/* 时间设置 - 仅在非全天任务时显示 */}
            {!isAllDay && (
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/30">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="start-time" className={`text-xs ${!date ? 'text-muted-foreground/50' : 'text-muted-foreground'}`}>开始时间</Label>
                  <Input 
                    id="start-time" 
                    type="time" 
                    value={startTime} 
                    onChange={e => setStartTime(e.target.value)} 
                    disabled={!date}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="end-time" className={`text-xs ${!date ? 'text-muted-foreground/50' : 'text-muted-foreground'}`}>结束时间</Label>
                  <Input 
                    id="end-time" 
                    type="time" 
                    value={endTime} 
                    onChange={e => setEndTime(e.target.value)} 
                    disabled={!date}
                  />
                </div>
              </div>
            )}
          </div>

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
                <SelectItem value="yearly">{t.repeat.yearly}</SelectItem>
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
                <Select value={repeatUnit} onValueChange={v => setRepeatUnit(v as 'days' | 'weeks' | 'months' | 'years')}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="days">{t.repeat.customDays}</SelectItem>
                    <SelectItem value="weeks">{t.repeat.customWeeks}</SelectItem>
                    <SelectItem value="months">{t.repeat.customMonths}</SelectItem>
                    <SelectItem value="years">{t.repeat.customYears}</SelectItem>
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

          {/* Advanced Options - Only show when repeat is enabled */}
          {frequency !== 'none' && (
            <Collapsible open={showAdvancedOptions} onOpenChange={setShowAdvancedOptions}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-start p-0 h-8">
                  {showAdvancedOptions ? (
                    <ChevronDown className="w-4 h-4 mr-1" />
                  ) : (
                    <ChevronRight className="w-4 h-4 mr-1" />
                  )}
                  <span className="text-sm">{t.task.advancedOptions}</span>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <div className="flex flex-col gap-3 p-3 bg-muted/20 rounded-lg">
                  {/* Due Date Offset */}
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="due-date-offset" className="text-xs text-muted-foreground">
                      {t.task.dueDateOffset}
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="due-date-offset"
                        type="number"
                        min={0}
                        value={dueDateOffset}
                        onChange={e => {
                          const val = e.target.value
                          const newOffset = val === '' ? 0 : Math.max(0, parseInt(val) || 0)
                          setDueDateOffset(newOffset)
                          // 同步更新截止日期
                          if (date) {
                            const newDueDate = addDays(new Date(date), newOffset)
                            setDueDate(format(newDueDate, 'yyyy-MM-dd'))
                          }
                        }}
                        className="w-20"
                      />
                      <span className="text-sm text-muted-foreground">{t.task.days}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t.task.dueDateOffsetDesc}
                    </p>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Status */}
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
        <TaskDeleteDialog
          open={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleDeleteConfirm}
          isRecurring={isRecurring}
        />
      </DialogContent>
    </Dialog>
  )
}
