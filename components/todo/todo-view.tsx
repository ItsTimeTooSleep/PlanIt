'use client'

import { useCallback, useMemo, useState } from 'react'
import type { Task, Tag } from '@/lib/types'
import { useLanguage, useStore } from '@/lib/store'
import { useTranslations } from '@/lib/i18n'
import { format, parseISO, startOfToday, endOfToday, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isBefore, isAfter, isWithinInterval } from 'date-fns'
import { zhCN, enUS } from 'date-fns/locale'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card } from '@/components/ui/card'
import { Empty } from '@/components/ui/empty'
import { Progress } from '@/components/ui/progress'
import { TaskModal } from '@/components/task-modal'
import { FilterBar, type TimeFilter, type StatusFilter, type SortBy, type GroupBy } from './filter-bar'
import { TaskItem } from './task-item'
import { CheckSquare, Calendar, Clock, ListTodo, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

type GroupedTasks = Record<string, Task[]>

export function TodoView() {
  const lang = useLanguage()
  const t = useTranslations(lang)
  const { state, addTask, updateTask } = useStore()
  
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('today')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending')
  const [tagFilter, setTagFilter] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortBy>('date')
  const [groupBy, setGroupBy] = useState<GroupBy>('date')
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const locale = lang === 'zh' ? zhCN : enUS
  const today = startOfToday()

  const filteredAndSortedTasks = useMemo(() => {
    let tasks = [...state.tasks]

    tasks = tasks.filter(task => {
      const taskDate = parseISO(task.date)
      
      if (timeFilter === 'today') {
        return isWithinInterval(taskDate, { start: startOfToday(), end: endOfToday() })
      } else if (timeFilter === 'week') {
        return isWithinInterval(taskDate, { start: startOfWeek(today, { weekStartsOn: 1 }), end: endOfWeek(today, { weekStartsOn: 1 }) })
      } else if (timeFilter === 'month') {
        return isWithinInterval(taskDate, { start: startOfMonth(today), end: endOfMonth(today) })
      } else if (timeFilter === 'overdue') {
        return isBefore(taskDate, today) && task.status === 'pending'
      } else if (timeFilter === 'upcoming') {
        return isAfter(taskDate, endOfToday())
      }
      return true
    })

    if (statusFilter !== 'all') {
      tasks = tasks.filter(task => task.status === statusFilter)
    }

    if (tagFilter !== null) {
      tasks = tasks.filter(task => task.tagIds.includes(tagFilter))
    }

    tasks.sort((a, b) => {
      if (sortBy === 'date') {
        return a.date.localeCompare(b.date)
      } else if (sortBy === 'time') {
        if (a.date !== b.date) {
          return a.date.localeCompare(b.date)
        }
        if (a.isAllDay && !b.isAllDay) return -1
        if (!a.isAllDay && b.isAllDay) return 1
        if (!a.startTime || !b.startTime) return 0
        return a.startTime.localeCompare(b.startTime)
      } else if (sortBy === 'title') {
        return a.title.localeCompare(b.title)
      } else if (sortBy === 'status') {
        const statusOrder = { pending: 0, skipped: 1, completed: 2 }
        return statusOrder[a.status] - statusOrder[b.status]
      }
      return 0
    })

    return tasks
  }, [state.tasks, timeFilter, statusFilter, tagFilter, sortBy, today])

  const groupedTasks = useMemo(() => {
    const grouped: GroupedTasks = {}

    filteredAndSortedTasks.forEach(task => {
      let key: string
      if (groupBy === 'date') {
        key = task.date
      } else if (groupBy === 'status') {
        key = task.status
      } else if (groupBy === 'tag') {
        key = task.tagIds.length > 0 ? task.tagIds[0] : 'untagged'
      } else {
        key = 'all'
      }

      if (!grouped[key]) {
        grouped[key] = []
      }
      grouped[key].push(task)
    })

    return grouped
  }, [filteredAndSortedTasks, groupBy])

  const completedCount = useMemo(() => {
    return filteredAndSortedTasks.filter(t => t.status === 'completed').length
  }, [filteredAndSortedTasks])

  const allTasksWithTimeAndTagFilter = useMemo(() => {
    let tasks = [...state.tasks]

    tasks = tasks.filter(task => {
      const taskDate = parseISO(task.date)
      
      if (timeFilter === 'today') {
        return isWithinInterval(taskDate, { start: startOfToday(), end: endOfToday() })
      } else if (timeFilter === 'week') {
        return isWithinInterval(taskDate, { start: startOfWeek(today, { weekStartsOn: 1 }), end: endOfWeek(today, { weekStartsOn: 1 }) })
      } else if (timeFilter === 'month') {
        return isWithinInterval(taskDate, { start: startOfMonth(today), end: endOfMonth(today) })
      } else if (timeFilter === 'overdue') {
        return isBefore(taskDate, today) && task.status === 'pending'
      } else if (timeFilter === 'upcoming') {
        return isAfter(taskDate, endOfToday())
      }
      return true
    })

    if (tagFilter !== null) {
      tasks = tasks.filter(task => task.tagIds.includes(tagFilter))
    }

    return tasks
  }, [state.tasks, timeFilter, tagFilter, today])

  const allTasksCompletedCount = useMemo(() => {
    return allTasksWithTimeAndTagFilter.filter(t => t.status === 'completed').length
  }, [allTasksWithTimeAndTagFilter])

  const getGroupLabel = useCallback((key: string) => {
    if (groupBy === 'date') {
      const date = parseISO(key)
      return format(date, lang === 'zh' ? 'yyyy年M月d日 EEEE' : 'EEEE, MMMM d, yyyy', { locale })
    } else if (groupBy === 'status') {
      return t.status[key as keyof typeof t.status]
    } else if (groupBy === 'tag') {
      if (key === 'untagged') return lang === 'zh' ? '未分类' : 'Untagged'
      const tag = state.tags.find(t => t.id === key)
      return tag?.name || key
    }
    return ''
  }, [groupBy, lang, locale, t.status, state.tags])

  const handleAddTask = useCallback(() => {
    setEditingTask(null)
    setIsTaskModalOpen(true)
  }, [])

  const handleEditTask = useCallback((task: Task) => {
    setEditingTask(task)
    setIsTaskModalOpen(true)
  }, [])

  const allDayTasks = filteredAndSortedTasks.filter(t => t.isAllDay)
  const scheduledTasks = filteredAndSortedTasks.filter(t => !t.isAllDay)

  return (
    <div className="h-[calc(100vh-2.25rem)] flex flex-col ml-16">
      <FilterBar
        timeFilter={timeFilter}
        statusFilter={statusFilter}
        tagFilter={tagFilter}
        sortBy={sortBy}
        groupBy={groupBy}
        tags={state.tags}
        onTimeFilterChange={setTimeFilter}
        onStatusFilterChange={setStatusFilter}
        onTagFilterChange={setTagFilter}
        onSortByChange={setSortBy}
        onGroupByChange={setGroupBy}
        onAddTask={handleAddTask}
      />

      <div className="px-6 py-4 bg-muted/20 border-b border-border/60">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-sm font-medium">
              {t.todo.completedCount(allTasksCompletedCount, allTasksWithTimeAndTagFilter.length)}
            </span>
            <span className="text-sm text-muted-foreground">
              {allTasksWithTimeAndTagFilter.length} {t.dashboard.tasks}
            </span>
          </div>
          <Progress
            value={allTasksWithTimeAndTagFilter.length > 0 ? (allTasksCompletedCount / allTasksWithTimeAndTagFilter.length) * 100 : 0}
            className="h-2"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="max-w-5xl mx-auto p-6 space-y-6">
          {filteredAndSortedTasks.length === 0 ? (
            <Empty
              title={t.todo.noTasks}
              description={t.todo.noTasksDesc}
              icon={<ListTodo className="w-6 h-6" />}
              action={
                <Button onClick={handleAddTask}>
                  <Plus className="w-4 h-4 mr-2" />
                  {t.todo.addTask}
                </Button>
              }
            />
          ) : groupBy === 'none' ? (
            <>
              {allDayTasks.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-sm font-semibold text-muted-foreground/80 flex items-center gap-2 tracking-wide uppercase">
                    <Calendar className="w-4 h-4" />
                    {t.todo.allDayEvents}
                  </h2>
                  <div className="space-y-2">
                    {allDayTasks.map(task => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        tags={state.tags}
                        onEdit={handleEditTask}
                      />
                    ))}
                  </div>
                </div>
              )}

              {scheduledTasks.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-sm font-semibold text-muted-foreground/80 flex items-center gap-2 tracking-wide uppercase">
                    <Clock className="w-4 h-4" />
                    {t.todo.scheduledTasks}
                  </h2>
                  <div className="space-y-2">
                    {scheduledTasks.map(task => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        tags={state.tags}
                        onEdit={handleEditTask}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            Object.entries(groupedTasks).map(([key, tasks]) => (
              <div key={key} className="space-y-3">
                <h2 className="text-sm font-semibold text-muted-foreground/80 tracking-wide">
                  {getGroupLabel(key)}
                </h2>
                <div className="space-y-2">
                  {tasks.map(task => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      tags={state.tags}
                      onEdit={handleEditTask}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <TaskModal
        open={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        task={editingTask}
      />
    </div>
  )
}
