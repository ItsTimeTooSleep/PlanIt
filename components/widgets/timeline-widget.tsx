'use client'

import { useRef, useCallback, useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { format } from 'date-fns'
import { Plus, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useStore, useLanguage } from '@/lib/store'
import type { BaseWidgetProps } from '@/lib/widget-types'
import type { Task, Tag } from '@/lib/types'
import { sortTasksByTime, timeToMinutes, minutesToTime } from '@/lib/task-utils'
import { calculateTaskLayoutsGrouped } from '@/lib/task-layout'
import { TaskBlock } from '@/components/home/task-block'

type SizeMode = 'compact' | 'normal' | 'large' | 'xlarge'

const HOUR_HEIGHT_CONFIG = {
  compact: 60,
  normal: 120,
  large: 150,
  xlarge: 180,
}

const TIMELINE_LEFT = 50
const TOTAL_HOURS = 24
const DEFAULT_FOCUS_MINUTES_BEFORE = 30
const DEFAULT_FOCUS_MINUTES_AFTER = 180

interface TimelineWidgetProps extends BaseWidgetProps {
  onTaskClick?: (task: Task) => void
  onTaskToggle?: (task: Task) => void
  onOpenCreate?: (startMin?: number) => void
  onOpenPomodoro?: (taskId: string) => void
}

/**
 * 时间轴组件
 * @param props - 组件属性
 * @param props.id - 组件实例ID
 * @param props.config - 组件配置
 * @param props.onTaskClick - 任务点击回调
 * @param props.onTaskToggle - 任务切换回调
 * @param props.onOpenCreate - 打开创建回调
 * @param props.onOpenPomodoro - 打开番茄钟回调
 * @param props.className - 自定义样式类
 * @returns 时间轴组件
 */
export function TimelineWidget({ 
  id, 
  config, 
  onTaskClick, 
  onTaskToggle, 
  onOpenCreate, 
  onOpenPomodoro,
  className 
}: TimelineWidgetProps) {
  const pathname = usePathname()
  const timelineRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const lastScrollRef = useRef<number>(Date.now())
  const autoScrollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [now, setNow] = useState(new Date())
  const [sizeMode, setSizeMode] = useState<SizeMode>('normal')

  const storeLang = useLanguage()
  const { state } = useStore()
  
  const lang = (config?.lang as 'zh' | 'en') || storeLang
  const today = format(new Date(), 'yyyy-MM-dd')
  const todayTasks = state.tasks.filter(t => t.date === today)
  const tasks = todayTasks
  const tags = state.tags

  const showHourLabels = (config?.showHourLabels as boolean) ?? true
  const showCurrentTimeLine = (config?.showCurrentTimeLine as boolean) ?? true
  const showTaskDetails = (config?.showTaskDetails as boolean) ?? true
  const autoScroll = (config?.autoScroll as boolean) ?? true
  const hourHeight = (config?.hourHeight as number) ?? HOUR_HEIGHT_CONFIG[sizeMode]

  useEffect(() => {
    const updateSizeMode = () => {
      const el = containerRef.current
      if (!el) return
      const { width, height } = el.getBoundingClientRect()
      
      if (width < 350 || height < 250) {
        setSizeMode('compact')
      } else if (width > 700 && height > 500) {
        setSizeMode('xlarge')
      } else if (height > 450) {
        setSizeMode('large')
      } else {
        setSizeMode('normal')
      }
    }

    updateSizeMode()
    window.addEventListener('resize', updateSizeMode)
    return () => window.removeEventListener('resize', updateSizeMode)
  }, [])

  useEffect(() => {
    const intervalId = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(intervalId)
  }, [])

  const currentHourHeight = HOUR_HEIGHT_CONFIG[sizeMode] || hourHeight

  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const totalHeight = TOTAL_HOURS * currentHourHeight
  const viewportMinutes = DEFAULT_FOCUS_MINUTES_BEFORE + DEFAULT_FOCUS_MINUTES_AFTER
  const viewportHeight = (viewportMinutes / 60) * currentHourHeight + 80

  const timedTasks = useMemo(() => {
    return sortTasksByTime(tasks.filter(t => !t.isAllDay))
  }, [tasks])

  const taskLayouts = useMemo(() => {
    return calculateTaskLayoutsGrouped(timedTasks, currentHourHeight, 0)
  }, [timedTasks, currentHourHeight])

  const scrollToNow = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const el = timelineRef.current
    if (!el) return
    const viewportHeight = el.clientHeight
    const totalDisplayMinutes = DEFAULT_FOCUS_MINUTES_BEFORE + DEFAULT_FOCUS_MINUTES_AFTER
    const totalDisplayHeight = (totalDisplayMinutes / 60) * currentHourHeight

    let targetTop: number
    if (viewportHeight > totalDisplayHeight) {
      targetTop = (nowMinutes / 60) * currentHourHeight - viewportHeight / 2 + currentHourHeight * 0.5 + 20
    } else {
      const startMinutes = Math.max(0, nowMinutes - DEFAULT_FOCUS_MINUTES_BEFORE)
      targetTop = (startMinutes / 60) * currentHourHeight + 20
    }
    el.scrollTo({ top: Math.max(0, targetTop), behavior })
  }, [nowMinutes, currentHourHeight])

  useEffect(() => {
    setTimeout(() => {
      scrollToNow('instant')
    }, 100)
  }, [pathname, scrollToNow])

  useEffect(() => {
    if (!autoScroll) return
    
    autoScrollTimerRef.current = setInterval(() => {
      if (Date.now() - lastScrollRef.current >= 15_000) {
        scrollToNow('smooth')
      }
    }, 5_000)
    return () => {
      if (autoScrollTimerRef.current) clearInterval(autoScrollTimerRef.current)
    }
  }, [scrollToNow, autoScroll])

  function handleScroll() {
    lastScrollRef.current = Date.now()
  }

  function handleTimelineClick(e: React.MouseEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest('[data-task-block]')) return
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
    const y = e.clientY - rect.top + (timelineRef.current?.scrollTop ?? 0)
    const rawMin = (y / currentHourHeight) * 60
    const snapped = Math.round(rawMin / 15) * 15
    onOpenCreate?.(Math.max(0, Math.min(snapped, 23 * 60)))
  }

  const nowTop = (nowMinutes / 60) * currentHourHeight

  function isTimePast(minutes: number): boolean {
    return minutes < nowMinutes
  }

  function shouldHideHourMarker(hourMinutes: number): boolean {
    return Math.abs(nowMinutes - hourMinutes) <= 10
  }

  const hourLabelFontSize = useMemo(() => {
    switch (sizeMode) {
      case 'compact': return 'text-[10px]'
      case 'large': return 'text-base'
      case 'xlarge': return 'text-lg'
      default: return 'text-sm'
    }
  }, [sizeMode])

  const showDayMarkers = sizeMode !== 'compact'
  const showMinuteMarkers = sizeMode !== 'compact'

  return (
    <div ref={containerRef} className={cn('relative flex-1 flex justify-center overflow-hidden', className)}>
      <div className="w-full h-full relative rounded-xl bg-card border border-border shadow-sm overflow-hidden">
        <div className="pointer-events-none absolute top-0 left-0 right-0 h-20 z-20"
          style={{ background: 'linear-gradient(to bottom, var(--card) 0%, rgba(255,255,255,0.9) 40%, transparent 100%)' }} />
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-20 z-20"
          style={{ background: 'linear-gradient(to top, var(--card) 0%, rgba(255,255,255,0.9) 40%, transparent 100%)' }} />

        <div
          ref={timelineRef}
          className="h-full overflow-y-auto p-4"
          onScroll={handleScroll}
          onClick={handleTimelineClick}
        >
          <div className="relative" style={{ height: totalHeight + 40, paddingTop: 20, paddingBottom: 20 }}>
            {showDayMarkers && (
              <div
                className="absolute left-0 right-0 flex items-center justify-center pointer-events-none"
                style={{ top: 0 }}
              >
                <div className="flex items-center gap-2 text-muted-foreground/60">
                  <div className="w-12 h-px bg-muted-foreground/40" />
                  <span className="text-lg">🌅</span>
                  <span className={cn('font-medium', hourLabelFontSize)}>{lang === 'zh' ? '新的一天开始' : 'New Day'}</span>
                  <div className="w-12 h-px bg-muted-foreground/40" />
                </div>
              </div>
            )}

            {showHourLabels && Array.from({ length: TOTAL_HOURS }, (_, h) => {
              const hourMinutes = h * 60
              if (shouldHideHourMarker(hourMinutes)) return null
              return (
                <div
                  key={h}
                  className="absolute left-0 right-0 flex items-start pointer-events-none"
                  style={{ top: h * currentHourHeight + 20 }}
                >
                  <span className={
                    cn(
                      "w-14 text-right pr-3 font-medium leading-none shrink-0 -translate-y-1/2 tabular-nums select-none",
                      hourLabelFontSize,
                      isTimePast(h * 60) ? "text-muted-foreground/30" : "text-muted-foreground"
                    )
                  }>
                    {String(h).padStart(2, '0')}:00
                  </span>
                  <div className="flex-1 border-t border-border/40" />
                </div>
              )
            })}

            {showMinuteMarkers && Array.from({ length: TOTAL_HOURS * 4 }, (_, i) => {
              const baseMinutes = i * 15
              if (baseMinutes % 60 === 0) return null
              const top = (baseMinutes / 60) * currentHourHeight
              return (
                <div
                  key={`mm-${baseMinutes}`}
                  className="absolute pointer-events-none"
                  style={{ top: top + 20, left: 0, right: TIMELINE_LEFT }}
                >
                  <div className="flex items-center justify-end">
                    <div className={
                      "border-t " +
                      (isTimePast(baseMinutes) ? "border-border/15" : "border-border/20")
                    } style={{ width: '10px' }} />
                  </div>
                </div>
              )
            })}

            {showCurrentTimeLine && (
              <div
                className="absolute pointer-events-none z-20"
                style={{ top: nowTop + 20, left: 0, right: 0 }}
              >
                <span className={cn('absolute -translate-y-1/2 w-14 text-right pr-3 font-semibold text-primary tabular-nums select-none', hourLabelFontSize)}>
                  {format(now, 'HH:mm')}
                </span>
                <div className="absolute left-14 w-2.5 h-2.5 rounded-full bg-primary shadow-lg -translate-y-1/2" />
                <div className="absolute left-14 right-0 h-0.5 bg-gradient-to-r from-primary/60 to-transparent -translate-y-1/2" />
              </div>
            )}

            {taskLayouts.map(layout => {
              const minDisplayHeight = sizeMode === 'compact' ? 14 : 18
              const displayHeight = Math.max(layout.height, minDisplayHeight)

              return (
                <div
                  key={layout.task.id}
                  data-task-block="true"
                  className="absolute"
                  style={{
                    top: layout.top + 20,
                    height: displayHeight,
                    left: TIMELINE_LEFT + 8,
                    right: 8
                  }}
                >
                  <TaskBlock
                    task={layout.task}
                    tags={tags}
                    hourHeight={currentHourHeight}
                    timelineLeft={0}
                    onClick={() => onTaskClick?.(layout.task)}
                    onToggle={() => onTaskToggle?.(layout.task)}
                    onOpenPomodoro={onOpenPomodoro}
                    overrideTop={0}
                    overrideHeight={displayHeight}
                    overrideLeft={layout.left}
                    overrideWidth={layout.width}
                    compact={sizeMode === 'compact'}
                  />
                </div>
              )
            })}

            {showDayMarkers && (
              <div
                className="absolute left-0 right-0 flex items-center justify-center pointer-events-none"
                style={{ bottom: 0 }}
              >
                <div className="flex items-center gap-2 text-muted-foreground/60">
                  <div className="w-12 h-px bg-muted-foreground/40" />
                  <span className="text-lg">🌙</span>
                  <span className={cn('font-medium', hourLabelFontSize)}>{lang === 'zh' ? '一天结束' : 'Day End'}</span>
                  <div className="w-12 h-px bg-muted-foreground/40" />
                </div>
              </div>
            )}

            {timedTasks.length === 0 && (
              <div className="absolute pointer-events-none" style={{ top: nowTop + 52, left: TIMELINE_LEFT + 16 }}>
                <p className={cn('text-muted-foreground', hourLabelFontSize)}>
                  {lang === 'zh' ? '点击任意时间段创建任务' : 'Click any time slot to add a task'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
