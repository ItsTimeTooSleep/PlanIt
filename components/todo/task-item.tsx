'use client'

import { useCallback, useState, useRef, useEffect } from 'react'
import type { Task, Tag, DeleteRecurringOption } from '@/lib/types'
import { useLanguage, useStore } from '@/lib/store'
import { useTranslations } from '@/lib/i18n'
import { format, parseISO, isToday, isTomorrow, isYesterday } from 'date-fns'
import { zhCN, enUS } from 'date-fns/locale'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import {
  MoreHorizontal,
  Edit,
  Trash2,
  CheckCircle2,
  Circle,
  SkipForward,
  Calendar,
  Clock,
} from 'lucide-react'
import { TaskDeleteDialog } from '../task-delete-dialog'
import { getTaskIdsToDelete, isPartOfRecurringGroup } from '@/lib/task-utils'

interface TaskItemProps {
  task: Task
  tags: Tag[]
  onEdit: (task: Task) => void
  className?: string
}

export function TaskItem({ task, tags, onEdit, className }: TaskItemProps) {
  const lang = useLanguage()
  const t = useTranslations(lang)
  const { state, updateTask, deleteTasks } = useStore()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const itemRef = useRef<HTMLDivElement>(null)

  const locale = lang === 'zh' ? zhCN : enUS

  const formatDate = useCallback((dateStr?: string) => {
    if (!dateStr) return lang === 'zh' ? '未规划' : 'Unscheduled'
    const date = parseISO(dateStr)
    if (isToday(date)) return lang === 'zh' ? '今天' : 'Today'
    if (isTomorrow(date)) return lang === 'zh' ? '明天' : 'Tomorrow'
    if (isYesterday(date)) return lang === 'zh' ? '昨天' : 'Yesterday'
    return format(date, lang === 'zh' ? 'M月d日 EEEE' : 'MMM d, EEEE', { locale })
  }, [lang, locale])

  const getTaskTags = useCallback(() => {
    return task.tagIds
      .map(tagId => tags.find(tag => tag.id === tagId))
      .filter((tag): tag is Tag => tag !== undefined)
  }, [task.tagIds, tags])

  const handleToggleStatus = useCallback(() => {
    const newStatus: Task['status'] = task.status === 'completed' ? 'pending' : 'completed'
    updateTask(task.id, { status: newStatus })
  }, [task.id, task.status, updateTask])

  const handleMarkSkip = useCallback(() => {
    updateTask(task.id, { status: 'skipped' })
  }, [task.id, updateTask])

  const handleMarkPending = useCallback(() => {
    updateTask(task.id, { status: 'pending' })
  }, [task.id, updateTask])

  const handleDeleteConfirm = useCallback((option: DeleteRecurringOption) => {
    const idsToDelete = getTaskIdsToDelete(task, state.tasks, option)
    deleteTasks(idsToDelete)
    setShowDeleteDialog(false)
  }, [task, state.tasks, deleteTasks])

  /**
   * 处理键盘事件，支持 Backspace 键删除
   * @param e - 键盘事件对象
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault()
      e.stopPropagation()
      setShowDeleteDialog(true)
    }
  }, [])

  const isCompleted = task.status === 'completed'
  const isSkipped = task.status === 'skipped'
  const isRecurring = isPartOfRecurringGroup(task, state.tasks)

  return (
    <>
      <div
        ref={itemRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className={cn(
          'group flex items-start gap-3 p-4 rounded-xl border bg-card hover:bg-accent/50 transition-colors focus:outline-none focus:ring-2 focus:ring-ring',
          isCompleted && 'opacity-60',
          isSkipped && 'opacity-40',
          className
        )}
      >
        <div className="flex-shrink-0 pt-1">
          <Checkbox
            checked={isCompleted}
            onCheckedChange={handleToggleStatus}
            className="mt-0.5"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 min-w-0">
            <h3
              className={cn(
                'font-medium leading-tight truncate',
                isCompleted && 'line-through text-muted-foreground'
              )}
            >
              {task.title}
            </h3>

            {task.isAllDay && (
              <Badge variant="outline" className="flex-shrink-0">
                <Calendar className="w-3 h-3 mr-1" />
                {t.todo.allDayEvents}
              </Badge>
            )}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatDate(task.date || task.dueDate)}</span>
            </div>

            {!task.isAllDay && task.startTime && (
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {task.startTime}
                  {task.endTime && ` - ${task.endTime}`}
                </span>
              </div>
            )}

            {getTaskTags().map(tag => (
              <Badge
                key={tag.id}
                variant="secondary"
                style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
              >
                {tag.name}
              </Badge>
            ))}

            {isCompleted && (
              <Badge variant="secondary" className="text-success" style={{ backgroundColor: 'color-mix(in srgb, var(--success) 15%, transparent)' }}>
                <CheckCircle2 className="w-3 h-3 mr-1" />
                {t.status.completed}
              </Badge>
            )}

            {isSkipped && (
              <Badge variant="secondary" className="text-gray-500">
                <SkipForward className="w-3 h-3 mr-1" />
                {t.status.skipped}
              </Badge>
            )}
          </div>

          {task.notes && (
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
              {task.notes}
            </p>
          )}
        </div>

        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(task)}>
                <Edit className="w-4 h-4 mr-2" />
                {t.common.edit}
              </DropdownMenuItem>

              {!isCompleted && !isSkipped && (
                <DropdownMenuItem onClick={handleMarkSkip}>
                  <SkipForward className="w-4 h-4 mr-2" />
                  {t.task.markSkip}
                </DropdownMenuItem>
              )}

              {isSkipped && (
                <DropdownMenuItem onClick={handleMarkPending}>
                  <Circle className="w-4 h-4 mr-2" />
                  {t.task.markPending}
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {t.common.delete}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <TaskDeleteDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteConfirm}
        isRecurring={isRecurring}
      />
    </>
  )
}
