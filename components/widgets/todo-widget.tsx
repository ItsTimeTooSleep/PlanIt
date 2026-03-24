'use client'

import { useCallback, useMemo, useState, useRef, useEffect } from 'react'
import type { Task, Tag } from '@/lib/types'
import type { BaseWidgetProps } from '@/lib/widget-types'
import { useLanguage, useStore } from '@/lib/store'
import { useTranslations } from '@/lib/i18n'
import { format, parseISO, isToday, isTomorrow, startOfToday, isBefore, endOfToday, isAfter, addDays } from 'date-fns'
import { zhCN, enUS } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import {
  CheckSquare,
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  ExternalLink,
} from 'lucide-react'

type SizeMode = 'compact' | 'normal' | 'large'

interface ContainerSize {
  width: number
  height: number
}

export function TodoWidget({ id, config, className, onCollapsedChange, onTaskClick }: BaseWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const prevExpandedRef = useRef<boolean>(true)
  const onCollapsedChangeRef = useRef(onCollapsedChange)
  const [sizeMode, setSizeMode] = useState<SizeMode>('normal')
  const [containerSize, setContainerSize] = useState<ContainerSize>({ width: 280, height: 200 })

  useEffect(() => {
    onCollapsedChangeRef.current = onCollapsedChange
  }, [onCollapsedChange])

  useEffect(() => {
    const updateSizeMode = () => {
      const el = containerRef.current
      if (!el) return
      const { width, height } = el.getBoundingClientRect()
      setContainerSize({ width, height })
      
      if (height < 120 || width < 200) {
        setSizeMode('compact')
      } else if (height > 300 && width > 300) {
        setSizeMode('large')
      } else {
        setSizeMode('normal')
      }
    }

    updateSizeMode()
    window.addEventListener('resize', updateSizeMode)
    return () => window.removeEventListener('resize', updateSizeMode)
  }, [])

  const lang = useLanguage()
  const t = useTranslations(lang)
  const { state, updateTask } = useStore()
  const [isExpanded, setIsExpanded] = useState(true)

  const showOverdue = (config?.showOverdue as boolean) ?? true
  const showTags = (config?.showTags as boolean) ?? true
  const showTime = (config?.showTime as boolean) ?? true
  const maxItems = (config?.maxItems as number) ?? 10
  const showHeader = (config?.showHeader as boolean) ?? true

  const handleOpenChange = (open: boolean) => {
    setIsExpanded(open)
    const headerHeight = headerRef.current?.offsetHeight
    if (headerHeight) {
      onCollapsedChangeRef.current?.(!open, headerHeight)
    }
  }

  useEffect(() => {
    prevExpandedRef.current = isExpanded
  }, [isExpanded])

  const locale = lang === 'zh' ? zhCN : enUS
  const today = startOfToday()

  const todayTasks = useMemo(() => {
    const todayStr = format(today, 'yyyy-MM-dd')
    return state.tasks
      .filter(task => task.date === todayStr && task.status === 'pending')
      .sort((a, b) => {
        if (a.isAllDay && !b.isAllDay) return -1
        if (!a.isAllDay && b.isAllDay) return 1
        if (!a.startTime || !b.startTime) return 0
        return a.startTime.localeCompare(b.startTime)
      })
      .slice(0, maxItems)
  }, [state.tasks, today, maxItems])

  const overdueTasks = useMemo(() => {
    if (!showOverdue) return []
    const now = new Date()
    return state.tasks
      .filter(task => {
        if (task.status !== 'pending') return false
        const taskDate = parseISO(task.date)
        if (isBefore(taskDate, today)) return true
        if (isToday(taskDate) && !task.isAllDay && task.endTime) {
          const [hours, minutes] = task.endTime.split(':').map(Number)
          const endDateTime = new Date()
          endDateTime.setHours(hours, minutes, 0, 0)
          if (now > endDateTime) return true
        }
        return false
      })
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 3)
  }, [state.tasks, today, showOverdue])

  const futureTasksCount = useMemo(() => {
    const nextWeek = addDays(today, 7)
    return state.tasks.filter(task => {
      const taskDate = parseISO(task.date)
      return (
        task.status === 'pending' &&
        isAfter(taskDate, endOfToday()) &&
        isBefore(taskDate, nextWeek)
      )
    }).length
  }, [state.tasks, today])

  const formatDate = useCallback((dateStr: string) => {
    const date = parseISO(dateStr)
    if (isToday(date)) return lang === 'zh' ? '今天' : 'Today'
    if (isTomorrow(date)) return lang === 'zh' ? '明天' : 'Tomorrow'
    return format(date, lang === 'zh' ? 'M/d' : 'MMM d', { locale })
  }, [lang, locale])

  const getTaskTags = useCallback((task: Task) => {
    if (!showTags) return []
    return task.tagIds
      .map(tagId => state.tags.find(tag => tag.id === tagId))
      .filter((tag): tag is Tag => tag !== undefined)
  }, [state.tags, showTags])

  const handleTaskClick = useCallback((task: Task) => {
    onTaskClick?.(task)
  }, [onTaskClick])

  const handleHeaderMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
  }, [])

  const pendingTotal = todayTasks.length + overdueTasks.length
  const hasManyTasks = todayTasks.length > 5 || overdueTasks.length > 0

  const showOverdueSection = overdueTasks.length > 0 && containerSize.height >= 180
  const showFutureLink = futureTasksCount > 0 && containerSize.height >= 150
  const headerHeight = headerRef.current?.offsetHeight || (sizeMode === 'compact' ? 32 : 48)
  const contentPadding = sizeMode === 'compact' ? 8 : 16
  const availableHeight = Math.max(containerSize.height - headerHeight - contentPadding, 100)
  const showTaskTime = showTime && sizeMode !== 'compact'
  const showTaskTags = showTags && sizeMode !== 'compact'

  const taskItemPadding = sizeMode === 'compact' ? 'p-1.5' : 'p-2'
  const taskTitleSize = sizeMode === 'compact' ? 'text-[10px]' : 'text-xs'
  const taskTimeSize = sizeMode === 'compact' ? 'text-[8px]' : 'text-[10px]'

  return (
    <div ref={containerRef} className={cn('flex flex-col bg-card rounded-xl border border-border overflow-hidden', className)}>
      <Collapsible open={isExpanded} onOpenChange={handleOpenChange} className="flex flex-col">
        {showHeader && (
          <CollapsibleTrigger asChild>
            <div
              ref={headerRef}
              data-drag-handle
              className={cn(
                'cursor-grab select-none bg-muted/30 hover:bg-muted/50 transition-colors flex items-center justify-between',
                sizeMode === 'compact' ? 'py-1.5 px-2' : 'py-2.5 px-3',
                !isExpanded && 'border-b-0'
              )}
              onMouseDown={handleHeaderMouseDown}
            >
              <div className="flex items-center gap-2">
                <CheckSquare className={cn('text-primary', sizeMode === 'compact' ? 'w-3 h-3' : 'w-4 h-4')} />
                <span className={cn('font-semibold', sizeMode === 'compact' ? 'text-xs' : 'text-sm')}>
                  {t.todo.title}
                </span>
                {pendingTotal > 0 && (
                  <Badge variant="secondary" className={cn('ml-1 font-medium', sizeMode === 'compact' ? 'h-4 px-1 text-[10px]' : 'h-5 px-1.5 text-xs')}>
                    {pendingTotal}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isExpanded ? (
                  <ChevronUp className={cn('text-muted-foreground transition-transform duration-200', sizeMode === 'compact' ? 'w-3 h-3' : 'w-4 h-4')} />
                ) : (
                  <ChevronDown className={cn('text-muted-foreground transition-transform duration-200', sizeMode === 'compact' ? 'w-3 h-3' : 'w-4 h-4')} />
                )}
              </div>
            </div>
          </CollapsibleTrigger>
        )}

        <CollapsibleContent className="overflow-hidden">
          <div className={cn(sizeMode === 'compact' ? 'p-1' : 'p-2', 'h-full')}>
            <ScrollArea className="transition-all h-full" style={{ height: `${availableHeight}px` }}>
              <div className="space-y-0.5">
                {showOverdueSection && (
                  <div className="mb-2">
                    <div className={cn('font-medium text-destructive mb-1 px-1', taskTimeSize)}>
                      <AlertCircle className="w-3 h-3 inline mr-1" />
                      {t.todo.timeFilter.overdue}
                      <span className="ml-auto text-[10px] text-muted-foreground">
                        {overdueTasks.length}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      {overdueTasks.map(task => (
                        <div
                          key={task.id}
                          onClick={() => handleTaskClick(task)}
                          className={cn('rounded-lg hover:bg-muted/60 transition-colors cursor-pointer group border border-transparent hover:border-border/50 flex items-start gap-2', taskItemPadding)}
                        >
                          <Checkbox
                            checked={false}
                            onCheckedChange={() => updateTask(task.id, { status: 'completed' })}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-0.5 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className={cn('font-medium truncate group-hover:text-primary transition-colors', taskTitleSize)}>{task.title}</p>
                            <p className={cn('text-destructive/80 mt-0.5', taskTimeSize)}>
                              {formatDate(task.date)}
                            </p>
                          </div>
                          <ExternalLink className={cn('text-muted-foreground/0 group-hover:text-muted-foreground/50 transition-all flex-shrink-0 mt-0.5', sizeMode === 'compact' ? 'w-2.5 h-2.5' : 'w-3 h-3')} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {todayTasks.length > 0 ? (
                  <div>
                    {showOverdueSection && overdueTasks.length > 0 && (
                      <div className={cn('font-medium text-muted-foreground mb-1 px-1 pt-1', taskTimeSize)}>
                        <Calendar className="w-3 h-3 inline mr-1" />
                        {t.todo.timeFilter.today}
                        <span className="ml-auto text-[10px]">
                          {todayTasks.length}
                        </span>
                      </div>
                    )}
                    <div className="space-y-0.5">
                      {todayTasks.map(task => (
                        <div
                          key={task.id}
                          onClick={() => handleTaskClick(task)}
                          className={cn('rounded-lg hover:bg-muted/60 transition-colors cursor-pointer group border border-transparent hover:border-border/50 flex items-start gap-2', taskItemPadding)}
                        >
                          <Checkbox
                            checked={false}
                            onCheckedChange={() => updateTask(task.id, { status: 'completed' })}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-0.5 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className={cn('font-medium truncate group-hover:text-primary transition-colors', taskTitleSize)}>{task.title}</p>
                            {showTaskTime && (
                              <div className="flex items-center gap-1.5 mt-0.5">
                                {!task.isAllDay && task.startTime && (
                                  <span className={cn('text-muted-foreground tabular-nums', taskTimeSize)}>
                                    {task.startTime}
                                    {task.endTime && ` – ${task.endTime}`}
                                  </span>
                                )}
                                {task.isAllDay && (
                                  <span className={cn('text-muted-foreground', taskTimeSize)}>
                                    {lang === 'zh' ? '全天' : 'All day'}
                                  </span>
                                )}
                                {showTaskTags && getTaskTags(task).slice(0, 1).map(tag => (
                                  <span
                                    key={tag.id}
                                    className="px-1 text-[9px] h-4 rounded-md inline-flex items-center"
                                    style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                                  >
                                    {tag.name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <ExternalLink className={cn('text-muted-foreground/0 group-hover:text-muted-foreground/50 transition-all flex-shrink-0 mt-0.5', sizeMode === 'compact' ? 'w-2.5 h-2.5' : 'w-3 h-3')} />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : !showOverdueSection ? (
                  <div className={cn('text-center', sizeMode === 'compact' ? 'py-3' : 'py-6')}>
                    <CheckSquare className={cn('mx-auto text-muted-foreground/30 mb-2', sizeMode === 'compact' ? 'w-5 h-5' : 'w-8 h-8')} />
                    <p className={cn('text-muted-foreground', taskTitleSize)}>{t.todo.noTasks}</p>
                  </div>
                ) : null}

                {showFutureLink && (
                  <div
                    onClick={() => window.location.href = '/todo'}
                    className={cn('rounded-lg hover:bg-muted/60 transition-colors cursor-pointer group border border-border/30 hover:border-border/50 flex items-center justify-between', taskItemPadding, 'mt-2')}
                  >
                    <div className={cn('text-muted-foreground group-hover:text-foreground transition-colors flex items-center gap-1.5', taskTimeSize)}>
                      <Clock className="w-3 h-3" />
                      <span>{lang === 'zh' ? '查看未来任务' : 'View future tasks'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant="secondary" className={cn('px-1', sizeMode === 'compact' ? 'h-3 text-[8px]' : 'h-4 text-[10px]')}>
                        {futureTasksCount}
                      </Badge>
                      <ExternalLink className={cn('text-muted-foreground/50 group-hover:text-muted-foreground transition-all', sizeMode === 'compact' ? 'w-2.5 h-2.5' : 'w-3 h-3')} />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
