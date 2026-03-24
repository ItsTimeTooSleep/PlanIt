'use client'

import { useState, useCallback, useRef, useEffect, memo } from 'react'
import { X, Move, Lock, LockOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { WidgetInstance, Position, Size } from '@/lib/widget-types'
import { WIDGET_METADATA } from '@/lib/widget-registry'
import { snapToGrid, clampSize } from '@/lib/widget-layout-manager'

interface WidgetWrapperProps {
  widget: WidgetInstance
  pixelPosition: Position
  pixelSize: Size
  canvasSize?: Size
  children: React.ReactNode
  onMove: (id: string, position: Position) => void
  onResize: (id: string, size: Size) => void
  onRemove: (id: string) => void
  onToggleLock?: (id: string, locked: boolean) => void
  isSelected?: boolean
  onSelect?: (id: string) => void
  canvasRef?: React.RefObject<HTMLDivElement | null>
  gridEnabled?: boolean
  onStartBatchUpdate?: () => void
  onEndBatchUpdate?: () => void
  className?: string
}

type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

const MOVE_HANDLE_HEIGHT = 24
const RESIZE_HANDLE_HIT_AREA = 8

/**
 * 组件包装器
 * @param props - 组件属性
 * @param props.widget - 组件实例
 * @param props.pixelPosition - 像素位置
 * @param props.pixelSize - 像素大小
 * @param props.canvasSize - 画布尺寸
 * @param props.children - 子组件
 * @param props.onMove - 移动回调
 * @param props.onResize - 调整大小回调
 * @param props.onRemove - 移除回调
 * @param props.onToggleLock - 锁定切换回调
 * @param props.isSelected - 是否选中
 * @param props.onSelect - 选中回调
 * @param props.canvasRef - 画布引用
 * @param props.gridEnabled - 是否启用网格对齐
 * @param props.className - 自定义样式类
 * @returns 组件包装器
 */
export const WidgetWrapper = memo(function WidgetWrapper({
  widget,
  pixelPosition,
  pixelSize,
  canvasSize,
  children,
  onMove,
  onResize,
  onRemove,
  onToggleLock,
  isSelected = false,
  onSelect,
  canvasRef,
  gridEnabled = true,
  onStartBatchUpdate,
  onEndBatchUpdate,
  className,
}: WidgetWrapperProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeDirection, setResizeDirection] = useState<ResizeDirection | null>(null)
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 })
  const [initialSize, setInitialSize] = useState<Size>(pixelSize)
  const [initialPos, setInitialPos] = useState<Position>(pixelPosition)
  const [initialMousePos, setInitialMousePos] = useState<Position>({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)

  const wrapperRef = useRef<HTMLDivElement>(null)
  const meta = WIDGET_METADATA[widget.type]
  const isLocked = widget.locked ?? false
  const isDecoration = meta.category === 'decoration'

  const applyGridSnap = useCallback((value: number): number => {
    return gridEnabled ? snapToGrid(value) : value
  }, [gridEnabled])

  const handleWrapperMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isLocked) return
      const target = e.target as HTMLElement
      
      if (target.closest('[data-resize-handle]') || target.closest('[data-widget-controls]')) {
        return
      }

      const dragHandle = target.closest('[data-drag-handle]') as HTMLElement | null
      
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(true)
      onSelect?.(widget.id)
      onStartBatchUpdate?.()

      const rect = wrapperRef.current?.getBoundingClientRect()
      if (rect) {
        if (dragHandle) {
          const handleRect = dragHandle.getBoundingClientRect()
          setDragOffset({
            x: e.clientX - handleRect.left,
            y: e.clientY - handleRect.top,
          })
        } else {
          setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
          })
        }
      }
    },
    [widget.id, onSelect, isLocked, onStartBatchUpdate]
  )

  const handleMoveHandleDragStart = useCallback(
    (e: React.MouseEvent) => {
      if (isLocked) return

      e.preventDefault()
      e.stopPropagation()
      setIsDragging(true)
      onSelect?.(widget.id)
      onStartBatchUpdate?.()

      const rect = wrapperRef.current?.getBoundingClientRect()
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        })
      }
    },
    [widget.id, onSelect, isLocked, onStartBatchUpdate]
  )

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, direction: ResizeDirection) => {
      if (isLocked) return
      e.preventDefault()
      e.stopPropagation()
      setIsResizing(true)
      setResizeDirection(direction)
      setInitialSize(pixelSize)
      setInitialPos(pixelPosition)
      setInitialMousePos({ x: e.clientX, y: e.clientY })
      onSelect?.(widget.id)
      onStartBatchUpdate?.()
    },
    [pixelSize, pixelPosition, widget.id, onSelect, isLocked, onStartBatchUpdate]
  )

  const handleToggleLock = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      onToggleLock?.(widget.id, !isLocked)
    },
    [widget.id, isLocked, onToggleLock]
  )

  useEffect(() => {
    if (!isDragging && !isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && canvasRef?.current) {
        const canvasRect = canvasRef.current.getBoundingClientRect()
        let newX = applyGridSnap(e.clientX - canvasRect.left - dragOffset.x)
        let newY = applyGridSnap(e.clientY - canvasRect.top - dragOffset.y)

        newX = Math.max(0, newX)
        newY = Math.max(0, newY)

        if (canvasSize) {
          newX = Math.min(newX, canvasSize.width - pixelSize.width)
          newY = Math.min(newY, canvasSize.height - pixelSize.height)
        }

        onMove(widget.id, {
          x: newX,
          y: newY,
        })
      }

      if (isResizing && resizeDirection) {
        const deltaX = e.clientX - initialMousePos.x
        const deltaY = e.clientY - initialMousePos.y

        let newWidth = initialSize.width
        let newHeight = initialSize.height
        let newX = initialPos.x
        let newY = initialPos.y

        if (resizeDirection.includes('e')) {
          newWidth = applyGridSnap(initialSize.width + deltaX)
        }
        if (resizeDirection.includes('w')) {
          newWidth = applyGridSnap(initialSize.width - deltaX)
          newX = applyGridSnap(initialPos.x + deltaX)
        }
        if (resizeDirection.includes('s')) {
          newHeight = applyGridSnap(initialSize.height + deltaY)
        }
        if (resizeDirection.includes('n')) {
          newHeight = applyGridSnap(initialSize.height - deltaY)
          newY = applyGridSnap(initialPos.y + deltaY)
        }

        const clampedSize = clampSize(
          { width: newWidth, height: newHeight },
          meta.minSize,
          meta.maxSize
        )

        if (resizeDirection.includes('w') || resizeDirection.includes('n')) {
          onMove(widget.id, {
            x: newX,
            y: newY,
          })
        }

        onResize(widget.id, clampedSize)
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setIsResizing(false)
      setResizeDirection(null)
      onEndBatchUpdate?.()
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [
    isDragging,
    isResizing,
    resizeDirection,
    dragOffset,
    initialSize,
    initialPos,
    initialMousePos,
    widget.id,
    onMove,
    onResize,
    canvasRef,
    meta,
    applyGridSnap,
    onEndBatchUpdate,
  ])

  const showResizeHandles = isSelected || isHovered

  const resizeHandleStyle: Record<ResizeDirection, React.CSSProperties> = {
    n: { top: 0, left: '25%', right: '25%', height: RESIZE_HANDLE_HIT_AREA, transform: 'translateY(-50%)', cursor: 'n-resize' },
    s: { bottom: 0, left: '25%', right: '25%', height: RESIZE_HANDLE_HIT_AREA, transform: 'translateY(50%)', cursor: 's-resize' },
    e: { right: 0, top: '25%', bottom: '25%', width: RESIZE_HANDLE_HIT_AREA, transform: 'translateX(50%)', cursor: 'e-resize' },
    w: { left: 0, top: '25%', bottom: '25%', width: RESIZE_HANDLE_HIT_AREA, transform: 'translateX(-50%)', cursor: 'w-resize' },
    ne: { top: 0, right: 0, width: 16, height: 16, transform: 'translate(50%, -50%)', cursor: 'ne-resize' },
    nw: { top: 0, left: 0, width: 16, height: 16, transform: 'translate(-50%, -50%)', cursor: 'nw-resize' },
    se: { bottom: 0, right: 0, width: 16, height: 16, transform: 'translate(50%, 50%)', cursor: 'se-resize' },
    sw: { bottom: 0, left: 0, width: 16, height: 16, transform: 'translate(-50%, 50%)', cursor: 'sw-resize' },
  }

  return (
    <div
      ref={wrapperRef}
      className={cn(
        'absolute select-none group',
        isDragging && 'cursor-grabbing',
        isSelected && 'z-10',
        isLocked && 'opacity-90',
        className
      )}
      style={{
        left: pixelPosition.x,
        top: pixelPosition.y,
        width: pixelSize.width,
        height: widget.collapsed && widget.actualHeight ? widget.actualHeight : pixelSize.height,
        zIndex: widget.zIndex || 1,
        transition: 'top 0.3s ease-out, height 0.3s ease-out',
      }}
      onMouseDown={handleWrapperMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={cn(
          'w-full h-full overflow-hidden transition-shadow',
          !isDecoration && 'rounded-xl',
          isSelected ? 'shadow-lg ring-2 ring-primary/50' : (isDecoration ? '' : 'shadow-md hover:shadow-lg'),
          isLocked && 'ring-2 ring-amber-500/30'
        )}
      >
        {children}
      </div>

      {isSelected && (
        <>
          <div
            data-widget-controls
            className="absolute -top-8 right-0 flex items-center gap-1 bg-background border border-border rounded-lg px-1 py-0.5 shadow-sm"
          >
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-6 w-6',
                isLocked ? 'text-amber-500 hover:text-amber-600' : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={handleToggleLock}
              title={isLocked ? '解锁组件' : '锁定组件'}
            >
              {isLocked ? <Lock className="w-3 h-3" /> : <LockOpen className="w-3 h-3" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={() => onRemove(widget.id)}
              disabled={isLocked}
              title="删除组件"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>

          {!isLocked && (
            <div
              data-move-handle
              className="absolute -top-6 left-1/2 -translate-x-1/2 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
              onMouseDown={handleMoveHandleDragStart}
              style={{ height: MOVE_HANDLE_HEIGHT }}
            >
              <Move className="w-4 h-4" />
            </div>
          )}
        </>
      )}

      {!isLocked && showResizeHandles && (Object.keys(resizeHandleStyle) as ResizeDirection[]).map((direction) => (
        <div
          key={direction}
          data-resize-handle
          className="absolute bg-transparent hover:bg-primary/20 transition-colors"
          style={resizeHandleStyle[direction]}
          onMouseDown={(e) => handleResizeStart(e, direction)}
        />
      ))}
    </div>
  )
})
