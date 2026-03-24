'use client'

import { useState, useCallback, useRef, Suspense, lazy, useEffect, useMemo } from 'react'
import { Grid3X3, LayoutGrid, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { WidgetType, Position, Size, BaseWidgetProps } from '@/lib/widget-types'
import { WIDGET_METADATA } from '@/lib/widget-registry'
import { WidgetWrapper } from './widget-wrapper'
import { useWidgetStore } from '@/lib/widget-store'
import { 
  snapPositionToGrid, 
  CANVAS_PADDING, 
  positionToPercent, 
  sizeToPercent,
  positionToPixel,
  sizeToPixel,
  DEFAULT_CANVAS_SIZE
} from '@/lib/widget-layout-manager'

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

interface WidgetCanvasProps {
  className?: string
  showGrid?: boolean
  editMode?: boolean
}

/**
 * 组件画布
 * @param props - 组件属性
 * @param props.className - 自定义样式类
 * @param props.showGrid - 是否显示网格
 * @param props.editMode - 是否为编辑模式（显示固定画布边界）
 * @returns 组件画布
 */
export function WidgetCanvas({ className, showGrid = true, editMode = false }: WidgetCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [gridVisible, setGridVisible] = useState(showGrid)
  const [zoom, setZoom] = useState(1)
  const [isEditingZoom, setIsEditingZoom] = useState(false)
  const [zoomInputValue, setZoomInputValue] = useState('')
  const zoomInputRef = useRef<HTMLInputElement>(null)
  const collapsedCallbacksRef = useRef<Map<string, (collapsed: boolean, actualHeight?: number) => void>>(new Map())
  const configCallbacksRef = useRef<Map<string, (config: Partial<Record<string, unknown>>) => void>>(new Map())

  const {
    getWidgets,
    addWidget,
    moveWidget,
    resizeWidget,
    removeWidget,
    getActiveLayout,
    updateWidgetCollapsed,
    toggleWidgetLock,
    autoArrangeWidgets,
    updateWidgetConfig,
    startBatchUpdate,
    endBatchUpdate,
  } = useWidgetStore()

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
    if (isEditingZoom && zoomInputRef.current) {
      zoomInputRef.current.focus()
      zoomInputRef.current.select()
    }
  }, [isEditingZoom])

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 0.1, 2))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 0.1, 0.25))
  }, [])

  /**
   * 计算适合容器的缩放比例
   * @returns 适合容器的缩放比例
   */
  const calculateFitZoom = useCallback(() => {
    if (!containerRef.current) return 1
    
    const containerRect = containerRef.current.getBoundingClientRect()
    const padding = 32
    const availableWidth = containerRect.width - padding * 2
    const availableHeight = containerRect.height - padding * 2
    
    const widthRatio = availableWidth / canvasSize.width
    const heightRatio = availableHeight / canvasSize.height
    
    return Math.min(widthRatio, heightRatio, 1)
  }, [canvasSize])

  const handleZoomReset = useCallback(() => {
    const fitZoom = calculateFitZoom()
    setZoom(fitZoom)
  }, [calculateFitZoom])

  /**
   * 计算并设置初始缩放比例
   */
  useEffect(() => {
    if (editMode && containerRef.current) {
      const fitZoom = calculateFitZoom()
      setZoom(fitZoom)
    }
  }, [editMode, calculateFitZoom])

  const handleStartEditZoom = useCallback(() => {
    setZoomInputValue(Math.round(zoom * 100).toString())
    setIsEditingZoom(true)
  }, [zoom])

  const handleZoomInputChange = useCallback((value: string) => {
    setZoomInputValue(value)
    const numValue = parseInt(value, 10)
    if (!isNaN(numValue) && numValue >= 25 && numValue <= 200) {
      setZoom(numValue / 100)
    }
  }, [])

  const handleZoomBlur = useCallback(() => {
    setIsEditingZoom(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!canvasRef.current?.contains(e.relatedTarget as Node)) {
      setIsDragOver(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)

      const widgetType = e.dataTransfer.getData('widget-type') as WidgetType
      if (!widgetType || !canvasRef.current) return

      const canvasRect = canvasRef.current.getBoundingClientRect()
      const meta = WIDGET_METADATA[widgetType]

      const position = snapPositionToGrid({
        x: (e.clientX - canvasRect.left) / zoom - meta.defaultSize.width / 2,
        y: (e.clientY - canvasRect.top) / zoom - meta.defaultSize.height / 2,
      })

      position.x = Math.max(CANVAS_PADDING, position.x)
      position.y = Math.max(CANVAS_PADDING, position.y)

      addWidget(widgetType, position, meta.defaultSize)
    },
    [addWidget, zoom]
  )

  const handleMove = useCallback(
    (id: string, pixelPosition: Position) => {
      const percentPosition = positionToPercent(pixelPosition, canvasSize)
      moveWidget(id, percentPosition)
    },
    [moveWidget, canvasSize]
  )

  const handleResize = useCallback(
    (id: string, pixelSize: Size) => {
      const percentSize = sizeToPercent(pixelSize, canvasSize)
      resizeWidget(id, percentSize)
    },
    [resizeWidget, canvasSize]
  )

  const handleRemove = useCallback(
    (id: string) => {
      removeWidget(id)
      if (selectedWidgetId === id) {
        setSelectedWidgetId(null)
      }
    },
    [removeWidget, selectedWidgetId]
  )

  const handleToggleLock = useCallback(
    (id: string, locked: boolean) => {
      toggleWidgetLock(id, locked)
    },
    [toggleWidgetLock]
  )

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      setSelectedWidgetId(null)
    }
  }, [])

  const renderWidgets = () => {
    return widgets.map((widget) => {
      const WidgetComponent = WIDGET_LOADERS[widget.type]
      if (!WidgetComponent) return null

      const pixelPosition = positionToPixel(widget.position, canvasSize)
      const pixelSize = sizeToPixel(widget.size, canvasSize)

      return (
        <WidgetWrapper
          key={widget.id}
          widget={widget}
          pixelPosition={pixelPosition}
          pixelSize={pixelSize}
          canvasSize={canvasSize}
          onMove={handleMove}
          onResize={handleResize}
          onRemove={handleRemove}
          onToggleLock={handleToggleLock}
          isSelected={selectedWidgetId === widget.id}
          onSelect={setSelectedWidgetId}
          canvasRef={canvasRef}
          gridEnabled={gridVisible}
          onStartBatchUpdate={startBatchUpdate}
          onEndBatchUpdate={endBatchUpdate}
        >
          <Suspense fallback={<WidgetSkeleton />}>
            <WidgetComponent
              id={widget.id}
              config={widget.config}
              className="w-full h-full"
              onCollapsedChange={getCollapsedCallback(widget.id)}
              onConfigChange={getConfigCallback(widget.id)}
            />
          </Suspense>
        </WidgetWrapper>
      )
    })
  }

  const renderGrid = () => {
    if (!gridVisible) return null
    
    const gridSize = editMode ? `${20 * zoom}px ${20 * zoom}px` : '20px 20px'
    
    return (
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(to right, var(--border) 1px, transparent 1px),
            linear-gradient(to bottom, var(--border) 1px, transparent 1px)
          `,
          backgroundSize: gridSize,
        }}
      />
    )
  }

  const renderEmptyState = () => {
    if (widgets.length > 0 || isDragOver) return null
    
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <LayoutGrid className="w-8 h-8" />
        </div>
        <p className="text-sm font-medium mb-1">画布为空</p>
        <p className="text-xs">从左侧面板拖拽组件到此处</p>
      </div>
    )
  }

  const renderDragOverIndicator = () => {
    if (!isDragOver) return null
    
    return (
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-primary/5">
        <div className="px-4 py-2 bg-primary/10 border-2 border-dashed border-primary rounded-lg text-primary text-sm">
          释放以添加组件
        </div>
      </div>
    )
  }

  const renderToolbar = () => {
    return (
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-background/90 backdrop-blur-sm border border-border rounded-lg px-3 py-1.5 shadow-sm">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomOut}>
          <ZoomOut className="w-4 h-4" />
        </Button>
        {isEditingZoom ? (
          <Input
            ref={zoomInputRef}
            value={zoomInputValue}
            onChange={(e) => handleZoomInputChange(e.target.value)}
            onBlur={handleZoomBlur}
            className="h-7 w-14 text-sm text-center"
          />
        ) : (
          <span
            className="text-sm font-medium min-w-[3rem] text-center cursor-pointer hover:text-primary transition-colors"
            onClick={handleStartEditZoom}
          >
            {Math.round(zoom * 100)}%
          </span>
        )}
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomIn}>
          <ZoomIn className="w-4 h-4" />
        </Button>
        <div className="w-px h-4 bg-border mx-1" />
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomReset} title="恢复默认">
          <RotateCcw className="w-4 h-4" />
        </Button>
        <div className="w-px h-4 bg-border mx-1" />
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setGridVisible(!gridVisible)}
        >
          <Grid3X3 className={cn('w-4 h-4', gridVisible && 'text-primary')} />
        </Button>
      </div>
    )
  }

  if (editMode) {
    return (
      <div 
        ref={containerRef}
        className={cn('relative flex-1 overflow-auto bg-muted/50', className)}
      >
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div
            ref={canvasRef}
            className="relative bg-background shadow-2xl rounded-lg border-2 border-border overflow-hidden"
            style={{
              width: canvasSize.width * zoom,
              height: canvasSize.height * zoom,
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleCanvasClick}
          >
            {renderGrid()}
            {renderDragOverIndicator()}
            {renderEmptyState()}

            <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', width: canvasSize.width, height: canvasSize.height }}>
              {renderWidgets()}
            </div>
          </div>
        </div>

        {renderToolbar()}

        <div className="absolute top-4 right-4 text-xs text-muted-foreground bg-background/90 backdrop-blur-sm px-2 py-1 rounded border border-border">
          {canvasSize.width} × {canvasSize.height} px
        </div>
      </div>
    )
  }

  return (
    <div
      ref={canvasRef}
      className={cn(
        'relative flex-1 overflow-auto bg-muted/30 transition-colors',
        isDragOver && 'bg-primary/5',
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleCanvasClick}
    >
      {renderGrid()}
      {renderDragOverIndicator()}
      {renderEmptyState()}
      {renderWidgets()}

      <div className="absolute bottom-4 right-4 flex gap-2">
        <Button
          variant="outline"
          size="icon"
          className="bg-background shadow-sm"
          onClick={() => setGridVisible(!gridVisible)}
        >
          <Grid3X3 className={cn('w-4 h-4', gridVisible && 'text-primary')} />
        </Button>
      </div>
    </div>
  )
}
