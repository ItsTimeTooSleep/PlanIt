'use client'

import { useRef, useState, useEffect, useCallback, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface SmartResizableProps {
  children: React.ReactNode
  initialWidth?: number
  initialHeight?: number
  getMinSize: () => { minWidth: number; minHeight: number }
  className?: string
  onSizeChange?: (width: number, height: number) => void
}

/**
 * 智能可调整大小容器
 * @param props - 组件属性
 * @param props.children - 子组件
 * @param props.initialWidth - 初始宽度
 * @param props.initialHeight - 初始高度
 * @param props.getMinSize - 获取最小尺寸的函数
 * @param props.className - 自定义样式类
 * @param props.onSizeChange - 尺寸变化回调
 * @param _ref - 组件引用
 * @returns 智能可调整大小容器
 */
export const SmartResizable = forwardRef<HTMLDivElement, SmartResizableProps>(
  function SmartResizable({
    children,
    initialWidth = 400,
    initialHeight = 200,
    getMinSize,
    className,
    onSizeChange,
  }, _ref) {
    const containerRef = useRef<HTMLDivElement>(null)
    const getMinSizeRef = useRef(getMinSize)
    const [size, setSize] = useState({ width: initialWidth, height: initialHeight })
    const [isResizing, setIsResizing] = useState(false)
    const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 })
    const [isAtMinSize, setIsAtMinSize] = useState({ width: false, height: false })

    useEffect(() => {
      getMinSizeRef.current = getMinSize
    }, [getMinSize])

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
      e.preventDefault()
      setIsResizing(true)
      setResizeStart({
        x: e.clientX,
        y: e.clientY,
        width: size.width,
        height: size.height,
      })
      setIsAtMinSize({ width: false, height: false })
    }, [size])

    const handleMouseMove = useCallback((e: MouseEvent) => {
      if (!isResizing) return

      const deltaX = e.clientX - resizeStart.x
      const deltaY = e.clientY - resizeStart.y

      let newWidth = resizeStart.width + deltaX
      let newHeight = resizeStart.height + deltaY

      const minSize = getMinSizeRef.current()

      const atMinWidth = newWidth < minSize.minWidth
      const atMinHeight = newHeight < minSize.minHeight

      setIsAtMinSize({ width: atMinWidth, height: atMinHeight })

      newWidth = Math.max(minSize.minWidth, newWidth)
      newHeight = Math.max(minSize.minHeight, newHeight)

      setSize({ width: newWidth, height: newHeight })
      onSizeChange?.(newWidth, newHeight)
    }, [isResizing, resizeStart, onSizeChange])

    const handleMouseUp = useCallback(() => {
      setIsResizing(false)
      setIsAtMinSize({ width: false, height: false })
    }, [])

    useEffect(() => {
      if (isResizing) {
        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)
        return () => {
          window.removeEventListener('mousemove', handleMouseMove)
          window.removeEventListener('mouseup', handleMouseUp)
        }
      }
    }, [isResizing, handleMouseMove, handleMouseUp])

    const showWarning = isAtMinSize.width || isAtMinSize.height

    return (
      <div className="relative inline-block">
        <div
          ref={containerRef}
          className={cn(
            'relative border-2 border-dashed rounded-lg overflow-hidden transition-colors',
            showWarning ? 'border-red-400 bg-red-500/5' : 'border-muted-foreground/30',
            className
          )}
          style={{ width: size.width, height: size.height }}
        >
          {children}
        </div>

        <div
          className={cn(
            'absolute bottom-0 right-0 w-4 h-4 cursor-se-resize',
            'after:absolute after:bottom-1 after:right-1 after:w-2 after:h-2',
            'after:border-r-2 after:border-b-2 after:border-muted-foreground/50',
            'hover:after:border-foreground after:transition-colors',
            isResizing && 'after:border-foreground'
          )}
          onMouseDown={handleMouseDown}
        />

        {showWarning && (
          <div className="absolute -bottom-8 left-0 right-0 text-xs text-red-500 text-center whitespace-nowrap">
            {isAtMinSize.width && isAtMinSize.height && '已达最小尺寸'}
            {isAtMinSize.width && !isAtMinSize.height && '已达最小宽度'}
            {!isAtMinSize.width && isAtMinSize.height && '已达最小高度'}
          </div>
        )}
      </div>
    )
  }
)
