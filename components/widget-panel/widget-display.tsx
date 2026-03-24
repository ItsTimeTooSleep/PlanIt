'use client'

import { Suspense, lazy, useMemo, useRef, useState, useEffect, useCallback } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { WidgetType, BaseWidgetProps } from '@/lib/widget-types'
import { WIDGET_METADATA } from '@/lib/widget-registry'
import { useWidgetStore } from '@/components/widget-store-provider'
import { DEFAULT_CANVAS_SIZE } from '@/lib/widget-layout-manager'
import type { Task } from '@/lib/types'

const WIDGET_LOADERS: Record<WidgetType, React.LazyExoticComponent<React.ComponentType<BaseWidgetProps>>> = {
  calculator: lazy(() => import('@/components/widgets/calculator-widget').then(m => ({ default: m.CalculatorWidget }))),
  spinWheel: lazy(() => import('@/components/widgets/spin-wheel-widget').then(m => ({ default: m.SpinWheelWidget }))),
  quote: lazy(() => import('@/components/widgets/quote-widget').then(m => ({ default: m.QuoteWidget }))),
  timer: lazy(() => import('@/components/widgets/timer-widget').then(m => ({ default: m.TimerWidget }))),
  search: lazy(() => import('@/components/widgets/search-widget').then(m => ({ default: m.SearchWidget }))),
  todo: lazy(() => import('@/components/widgets/todo-widget').then(m => ({ default: m.TodoWidget }))),
  note: lazy(() => import('@/components/widgets/note-widget').then(m => ({ default: m.NoteWidget }))),
  pomodoro: lazy(() => import('@/components/widgets/pomodoro-widget').then(m => ({ default: m.PomodoroWidget }))),
  progress: lazy(() => import('@/components/widgets/progress-widget').then(m => ({ default: m.ProgressWidget }))),
  currentTask: lazy(() => import('@/components/widgets/current-task-widget').then(m => ({ default: m.CurrentTaskWidget }))),
  datetime: lazy(() => import('@/components/widgets/datetime-widget').then(m => ({ default: m.DateTimeWidget }))),
  timeline: lazy(() => import('@/components/widgets/timeline-widget').then(m => ({ default: m.TimelineWidget }))),
  line: lazy(() => import('@/components/widgets/line-widget').then(m => ({ default: m.LineWidget }))),
  text: lazy(() => import('@/components/widgets/text-widget').then(m => ({ default: m.TextWidget }))),
  countdown: lazy(() => import('@/components/widgets/countdown-widget').then(m => ({ default: m.CountdownWidget }))),
}

function WidgetSkeleton() {
  return (
    <div className="w-full h-full rounded-xl border border-border bg-card p-4">
      <Skeleton className="h-4 w-24 mb-3" />
      <Skeleton className="h-full flex-1" />
    </div>
  )
}

interface WidgetDisplayProps {
  className?: string
  onTaskClick?: (task: Task) => void
  onTaskToggle?: (task: Task) => void
  onOpenCreate?: (startMin?: number) => void
}

export function WidgetDisplay({ className, onTaskClick, onTaskToggle, onOpenCreate }: WidgetDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const collapsedCallbacksRef = useRef<Map<string, (collapsed: boolean, actualHeight?: number) => void>>(new Map())
  const configCallbacksRef = useRef<Map<string, (config: Partial<Record<string, unknown>>) => void>>(new Map())
  const { getWidgets, getActiveLayout, updateWidgetCollapsed, updateWidgetConfig } = useWidgetStore()
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })

  const widgets = getWidgets()
  const activeLayout = getActiveLayout()
  const canvasSize = activeLayout?.canvas || DEFAULT_CANVAS_SIZE

  const getCollapsedCallback = useCallback((widgetId: string) => {
    if (!collapsedCallbacksRef.current.has(widgetId)) {
      collapsedCallbacksRef.current.set(widgetId, (collapsed: boolean, actualHeight?: number) => {
        updateWidgetCollapsed(widgetId, collapsed, actualHeight)
      })
    }
    return collapsedCallbacksRef.current.get(widgetId)!
  }, [updateWidgetCollapsed])

  const getConfigCallback = useCallback((widgetId: string) => {
    if (!configCallbacksRef.current.has(widgetId)) {
      configCallbacksRef.current.set(widgetId, (config: Partial<Record<string, unknown>>) => {
        updateWidgetConfig(widgetId, config)
      })
    }
    return configCallbacksRef.current.get(widgetId)!
  }, [updateWidgetConfig])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateContainerSize = () => {
      const rect = container.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        setContainerSize({ width: rect.width, height: rect.height })
      }
    }

    updateContainerSize()

    const resizeObserver = new ResizeObserver(updateContainerSize)
    resizeObserver.observe(container)

    return () => resizeObserver.disconnect()
  }, [])

  const sortedWidgets = useMemo(() => {
    return [...widgets].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
  }, [widgets])

  if (widgets.length === 0) {
    return null
  }

  return (
    <div ref={containerRef} className={cn('relative flex-1 overflow-hidden', className)}>
      {sortedWidgets.map((widget) => {
        const WidgetComponent = WIDGET_LOADERS[widget.type]
        if (!WidgetComponent) return null

        const left = (widget.position.x / 100) * containerSize.width
        const top = (widget.position.y / 100) * containerSize.height
        const width = (widget.size.width / 100) * containerSize.width
        const height = (widget.size.height / 100) * containerSize.height

        return (
          <div
            key={widget.id}
            className="absolute"
            style={{
              left: containerSize.width > 0 ? `${left}px` : `${widget.position.x}%`,
              top: containerSize.height > 0 ? `${top}px` : `${widget.position.y}%`,
              width: containerSize.width > 0 ? `${width}px` : `${widget.size.width}%`,
              height: widget.collapsed && widget.actualHeight ? `${widget.actualHeight}px` : (containerSize.height > 0 ? `${height}px` : `${widget.size.height}%`),
              zIndex: widget.zIndex || 1,
              transition: 'top 0.3s ease-out, height 0.3s ease-out',
            }}
          >
            <div className={cn(
              'w-full h-full overflow-hidden',
              WIDGET_METADATA[widget.type]?.category !== 'decoration' && 'rounded-xl shadow-md bg-card border border-border'
            )}>
              <Suspense fallback={<WidgetSkeleton />}>
                <WidgetComponent
                  id={widget.id}
                  config={widget.config}
                  className="w-full h-full"
                  onCollapsedChange={getCollapsedCallback(widget.id)}
                  onConfigChange={getConfigCallback(widget.id)}
                  onTaskClick={onTaskClick}
                  onTaskToggle={onTaskToggle}
                  onOpenCreate={onOpenCreate}
                />
              </Suspense>
            </div>
          </div>
        )
      })}
    </div>
  )
}
