'use client'

import { useState } from 'react'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, format, isSameMonth, isToday,
} from 'date-fns'
import type { Task, Tag, DateNote } from '@/lib/types'
import { useLanguage, useStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { StickyNote } from 'lucide-react'
import { DEFAULT_TAG_COLOR, STATUS_COLORS } from '@/lib/colors'

interface MonthViewProps {
  referenceDate: Date
  tasks: Task[]
  tags: Tag[]
  dateNotes: DateNote[]
  onOpenTask: (task: Task) => void
  onCreateTask: (date: string) => void
  onOpenDateNote: (date: string) => void
}

const SHORT_DAYS_ZH = ['日', '一', '二', '三', '四', '五', '六']
const SHORT_DAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function MonthView({ referenceDate, tasks, tags, dateNotes, onOpenTask, onCreateTask, onOpenDateNote }: MonthViewProps) {
  const lang = useLanguage()
  const { updateTask } = useStore()
  const dayLabels = lang === 'zh' ? SHORT_DAYS_ZH : SHORT_DAYS_EN
  const [hoveredDate, setHoveredDate] = useState<string | null>(null)
  const [hoveredDueDate, setHoveredDueDate] = useState<string | null>(null)

  const monthStart = startOfMonth(referenceDate)
  const monthEnd = endOfMonth(referenceDate)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

  const days: Date[] = []
  let cur = gridStart
  while (cur <= gridEnd) {
    days.push(cur)
    cur = addDays(cur, 1)
  }

  return (
    <div className="flex flex-col h-full p-2">
      {/* Day labels */}
      <div className="grid grid-cols-7 mb-1 shrink-0">
        {dayLabels.map((d, i) => (
          <div key={i} className="text-center text-xs text-muted-foreground font-medium py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 flex-1 gap-px bg-border rounded-lg overflow-hidden auto-rows-fr">
        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const dayTasks = tasks.filter(t => t.date === dateStr)
          const dueTasksForDay = tasks.filter(t => t.dueDate === dateStr && t.status !== 'completed')
          const dateNote = dateNotes.find(n => n.date === dateStr)
          const inMonth = isSameMonth(day, referenceDate)
          const isHovered = hoveredDate === dateStr
          const isHoveredDue = hoveredDueDate === dateStr

          return (
            <div
              key={dateStr}
              className={cn(
                'relative bg-background p-1 cursor-pointer transition-colors hover:bg-muted/50 group flex flex-col h-full',
                !inMonth && 'opacity-40'
              )}
              onMouseEnter={() => setHoveredDate(dateStr)}
              onMouseLeave={() => setHoveredDate(null)}
            >
              <div className="flex items-start justify-between shrink-0">
                <span
                  className={cn(
                    'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium',
                    isToday(day) ? 'bg-primary text-primary-foreground' : 'text-foreground'
                  )}
                  onClick={() => onCreateTask(dateStr)}
                >
                  {format(day, 'd')}
                </span>
                <div className="flex items-center gap-1">
                  {dueTasksForDay.length > 0 && (
                    <div className="relative">
                      <span 
                        className="text-xs font-semibold bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center cursor-help"
                        onMouseEnter={() => setHoveredDueDate(dateStr)}
                        onMouseLeave={() => setHoveredDueDate(null)}
                      >
                        {dueTasksForDay.length}
                      </span>
                      {isHoveredDue && (
                        <div className="absolute top-5 right-0 z-50 bg-popover border border-border rounded-lg shadow-lg p-2 min-w-[140px] max-w-[200px]">
                          <p className="text-xs font-medium text-muted-foreground mb-1.5 border-b border-border pb-1">
                            {lang === 'zh' ? '即将截止' : 'Due soon'}
                          </p>
                          {dueTasksForDay.slice(0, 6).map(task => {
                            const tag = tags.find(tg => task.tagIds[0] === tg.id)
                            const color = tag?.color ?? DEFAULT_TAG_COLOR
                            return (
                              <div
                                key={task.id}
                                className="flex items-center gap-1.5 py-0.5 cursor-pointer hover:opacity-80 min-w-0"
                                onClick={e => { e.stopPropagation(); onOpenTask(task) }}
                                style={{ overflow: 'hidden' }}
                              >
                                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                                <span className="text-[11px] flex-1 min-w-0" style={{
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {task.title}
                                </span>
                              </div>
                            )
                          })}
                          {dueTasksForDay.length > 6 && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">+{dueTasksForDay.length - 6} more</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {dateNote && (
                    <button
                      className="p-0.5 rounded hover:bg-muted transition-colors"
                      onClick={(e) => { e.stopPropagation(); onOpenDateNote(dateStr) }}
                      title={dateNote.content}
                    >
                      <StickyNote className="w-3 h-3 text-warning" />
                    </button>
                  )}
                </div>
              </div>

              {dateNote && (
                <div 
                  className="text-[9px] text-muted-foreground leading-tight mt-0.5 cursor-pointer shrink-0 overflow-hidden"
                  onClick={(e) => { e.stopPropagation(); onOpenDateNote(dateStr) }}
                  style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    maxHeight: '2.4em',
                  }}
                >
                  {dateNote.content}
                </div>
              )}

              {/* Dots */}
              {dayTasks.length > 0 && !isHovered && !dateNote && (
                <div className="flex gap-0.5 mt-auto flex-wrap content-start">
                  {dayTasks.slice(0, 5).map(task => {
                    const tag = tags.find(tg => task.tagIds[0] === tg.id)
                    return (
                      <div
                        key={task.id}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: tag?.color ?? DEFAULT_TAG_COLOR }}
                      />
                    )
                  })}
                  {dayTasks.length > 5 && (
                    <span className="text-[9px] text-muted-foreground">+{dayTasks.length - 5}</span>
                  )}
                </div>
              )}

              {/* Hover: task list */}
              {isHovered && dayTasks.length > 0 && (
                <div className="absolute top-8 left-0 z-30 bg-popover border border-border rounded-lg shadow-lg p-2 min-w-[140px] max-w-[200px]">
                  {dayTasks.slice(0, 6).map(task => {
                    const tag = tags.find(tg => task.tagIds[0] === tg.id)
                    const color = tag?.color ?? DEFAULT_TAG_COLOR
                    const isCompleted = task.status === 'completed'
                    const isSkipped = task.status === 'skipped'
                    const isDimmed = isCompleted || isSkipped

                    return (
                      <div
                        key={task.id}
                        className="flex items-center gap-1.5 py-0.5 cursor-pointer hover:opacity-80 group min-w-0"
                        onClick={e => { e.stopPropagation(); onOpenTask(task) }}
                        style={{ opacity: isDimmed ? 0.6 : 1, overflow: 'hidden' }}
                      >
                        {/* Quick complete checkbox */}
                        <div
                          className="w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 cursor-pointer transition-all"
                          style={{
                            backgroundColor: isCompleted ? STATUS_COLORS.success : 'transparent',
                            borderColor: isCompleted ? STATUS_COLORS.success : 'var(--muted-foreground)',
                          }}
                          onClick={e => {
                            e.stopPropagation()
                            const newStatus = isCompleted ? 'pending' : 'completed'
                            updateTask(task.id, { status: newStatus })
                          }}
                        >
                          {isCompleted && (
                            <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                        <span className={cn(
                          'text-[11px] flex-1 min-w-0',
                          isSkipped && 'line-through'
                        )} style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {task.title}
                        </span>
                      </div>
                    )
                  })}
                  {dayTasks.length > 6 && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">+{dayTasks.length - 6} more</p>
                  )}
                </div>
              )}

              {/* Note button when no note exists */}
              {isHovered && !dateNote && (
                <button
                  className="absolute bottom-1 right-1 p-1 rounded bg-muted/50 hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
                  onClick={(e) => { e.stopPropagation(); onOpenDateNote(dateStr) }}
                >
                  <StickyNote className="w-3 h-3 text-muted-foreground" />
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
