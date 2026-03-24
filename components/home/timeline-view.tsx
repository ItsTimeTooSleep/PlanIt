'use client'

import { useRef, useCallback, useEffect, useMemo } from 'react'
import { format } from 'date-fns'
import type { Task, Tag } from '@/lib/types'
import { sortTasksByTime, timeToMinutes, minutesToTime } from '@/lib/task-utils'
import { calculateTaskLayoutsGrouped } from '@/lib/task-layout'
import { TaskBlock } from './task-block'

const HOUR_HEIGHT = 120
const TIMELINE_LEFT = 70
const TOTAL_HOURS = 24
const DEFAULT_FOCUS_MINUTES_BEFORE = 30
const DEFAULT_FOCUS_MINUTES_AFTER = 180

interface TimelineViewProps {
  now: Date
  today: string
  tasks: Task[]
  tags: Tag[]
  lang: 'zh' | 'en'
  onTaskClick: (task: Task) => void
  onTaskToggle: (task: Task) => void
  onOpenCreate: (startMin?: number) => void
  onOpenPomodoro?: (taskId: string) => void
}

/**
 * 时间线视图组件
 * 显示当日任务的时间分布，支持碰撞布局避免重叠
 */
export function TimelineView({ now, today, tasks, tags, lang, onTaskClick, onTaskToggle, onOpenCreate, onOpenPomodoro }: TimelineViewProps) {
  const timelineRef = useRef<HTMLDivElement>(null)
  const lastScrollRef = useRef<number>(Date.now())
  const autoScrollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const totalHeight = TOTAL_HOURS * HOUR_HEIGHT
  const viewportMinutes = DEFAULT_FOCUS_MINUTES_BEFORE + DEFAULT_FOCUS_MINUTES_AFTER
  const viewportHeight = (viewportMinutes / 60) * HOUR_HEIGHT + 80

  const timedTasks = useMemo(() => {
    return sortTasksByTime(tasks.filter(t => !t.isAllDay))
  }, [tasks])

  const taskLayouts = useMemo(() => {
    return calculateTaskLayoutsGrouped(timedTasks, HOUR_HEIGHT, 0)
  }, [timedTasks])

  const scrollToNow = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const el = timelineRef.current
    if (!el) return
    const viewportHeight = el.clientHeight
    const totalDisplayMinutes = DEFAULT_FOCUS_MINUTES_BEFORE + DEFAULT_FOCUS_MINUTES_AFTER
    const totalDisplayHeight = (totalDisplayMinutes / 60) * HOUR_HEIGHT
    
    let targetTop: number
    if (viewportHeight > totalDisplayHeight) {
      targetTop = (nowMinutes / 60) * HOUR_HEIGHT - viewportHeight / 2 + HOUR_HEIGHT * 0.5 + 20
    } else {
      const startMinutes = Math.max(0, nowMinutes - DEFAULT_FOCUS_MINUTES_BEFORE)
      targetTop = (startMinutes / 60) * HOUR_HEIGHT + 20
    }
    el.scrollTo({ top: Math.max(0, targetTop), behavior })
  }, [nowMinutes])

  useEffect(() => {
    setTimeout(() => {
      scrollToNow('instant')
    }, 100)
  }, [])

  useEffect(() => {
    autoScrollTimerRef.current = setInterval(() => {
      if (Date.now() - lastScrollRef.current >= 15_000) {
        scrollToNow('smooth')
      }
    }, 5_000)
    return () => {
      if (autoScrollTimerRef.current) clearInterval(autoScrollTimerRef.current)
    }
  }, [scrollToNow])

  /**
   * 处理滚动事件
   */
  function handleScroll() {
    lastScrollRef.current = Date.now()
  }

  /**
   * 处理时间线点击事件
   * @param e - 鼠标事件
   */
  function handleTimelineClick(e: React.MouseEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest('[data-task-block]')) return
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
    const y = e.clientY - rect.top + (timelineRef.current?.scrollTop ?? 0)
    const rawMin = (y / HOUR_HEIGHT) * 60
    const snapped = Math.round(rawMin / 15) * 15
    onOpenCreate(Math.max(0, Math.min(snapped, 23 * 60)))
  }

  const nowTop = (nowMinutes / 60) * HOUR_HEIGHT

  /**
   * 检查时间是否已过
   * @param minutes - 分钟数
   * @returns 是否已过
   */
  function isTimePast(minutes: number): boolean {
    return minutes < nowMinutes
  }

  /**
   * 检查整点标识是否应该隐藏
   * @param hourMinutes - 整点对应的分钟数
   * @returns 是否应该隐藏
   */
  function shouldHideHourMarker(hourMinutes: number): boolean {
    return Math.abs(nowMinutes - hourMinutes) <= 10
  }

  return (
    <div className="relative flex-1 flex justify-center overflow-hidden px-4 py-3">
      <div className="w-full relative rounded-xl bg-card border border-border shadow-sm overflow-hidden" style={{ height: viewportHeight }}>
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
            <div
              className="absolute left-0 right-0 flex items-center justify-center pointer-events-none"
              style={{ top: 0 }}
            >
              <div className="flex items-center gap-2 text-muted-foreground/60">
                <div className="w-12 h-px bg-muted-foreground/40" />
                <span className="text-lg">🌅</span>
                <span className="text-xs font-medium">{lang === 'zh' ? '新的一天开始' : 'New Day'}</span>
                <div className="w-12 h-px bg-muted-foreground/40" />
              </div>
            </div>

            {Array.from({ length: TOTAL_HOURS }, (_, h) => {
              const hourMinutes = h * 60
              if (shouldHideHourMarker(hourMinutes)) return null
              return (
                <div
                  key={h}
                  className="absolute left-0 right-0 flex items-start pointer-events-none"
                  style={{ top: h * HOUR_HEIGHT + 20 }}
                >
                  <span className={
                    "w-16 text-right pr-4 text-sm font-medium leading-none shrink-0 -translate-y-1/2 tabular-nums select-none " + 
                    (isTimePast(h * 60) ? "text-muted-foreground/30" : "text-muted-foreground")
                  }>
                    {String(h).padStart(2, '0')}:00
                  </span>
                  <div className="flex-1 border-t border-border/40" />
                </div>
              )
            })}

            {Array.from({ length: TOTAL_HOURS * 4 }, (_, i) => {
              const baseMinutes = i * 15
              if (baseMinutes % 60 === 0) return null
              const top = (baseMinutes / 60) * HOUR_HEIGHT
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

            <div
              className="absolute flex items-center pointer-events-none z-20"
              style={{ top: nowTop + 20, left: 0, right: 0 }}
            >
              <span className="w-16 text-right pr-4 text-sm font-semibold text-primary tabular-nums shrink-0 select-none">
                {format(now, 'HH:mm')}
              </span>
              <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 shadow-lg" />
              <div className="flex-1 h-0.5 bg-gradient-to-r from-primary/60 to-transparent" />
            </div>

            {taskLayouts.map(layout => {
              const minDisplayHeight = 18
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
                    hourHeight={HOUR_HEIGHT}
                    timelineLeft={0}
                    onClick={() => onTaskClick(layout.task)}
                    onToggle={() => onTaskToggle(layout.task)}
                    onOpenPomodoro={onOpenPomodoro}
                    overrideTop={0}
                    overrideHeight={displayHeight}
                    overrideLeft={layout.left}
                    overrideWidth={layout.width}
                  />
                </div>
              )
            })}

            <div
              className="absolute left-0 right-0 flex items-center justify-center pointer-events-none"
              style={{ bottom: 0 }}
            >
              <div className="flex items-center gap-2 text-muted-foreground/60">
                <div className="w-12 h-px bg-muted-foreground/40" />
                <span className="text-lg">🌙</span>
                <span className="text-xs font-medium">{lang === 'zh' ? '一天结束' : 'Day End'}</span>
                <div className="w-12 h-px bg-muted-foreground/40" />
              </div>
            </div>

            {timedTasks.length === 0 && (
              <div className="absolute pointer-events-none" style={{ top: nowTop + 52, left: TIMELINE_LEFT + 16 }}>
                <p className="text-sm text-muted-foreground">
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
