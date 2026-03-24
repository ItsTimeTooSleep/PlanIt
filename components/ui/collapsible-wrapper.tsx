'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CollapsibleWrapperProps {
  children: React.ReactNode
  header?: React.ReactNode
  defaultExpanded?: boolean
  onCollapsedChange?: (collapsed: boolean, headerHeight?: number) => void
  className?: string
  headerClassName?: string
  contentClassName?: string
  showChevron?: boolean
}

export function CollapsibleWrapper({
  children,
  header,
  defaultExpanded = true,
  onCollapsedChange,
  className,
  headerClassName,
  contentClassName,
  showChevron = true,
}: CollapsibleWrapperProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const headerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [contentHeight, setContentHeight] = useState<number | undefined>(undefined)
  const prevExpandedRef = useRef(defaultExpanded)
  const [isInitialized, setIsInitialized] = useState(false)

  console.log('[CollapsibleWrapper] render', { isExpanded, contentHeight, isInitialized })

  useEffect(() => {
    console.log('[CollapsibleWrapper] isExpanded changed', { isExpanded })
    if (prevExpandedRef.current !== isExpanded) {
      prevExpandedRef.current = isExpanded
      const headerHeight = headerRef.current?.offsetHeight
      console.log('[CollapsibleWrapper] calling onCollapsedChange', { collapsed: !isExpanded, headerHeight })
      if (headerHeight) {
        onCollapsedChange?.(!isExpanded, headerHeight)
      }
    }
  }, [isExpanded, onCollapsedChange])

  useEffect(() => {
    if (contentRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          console.log('[CollapsibleWrapper] ResizeObserver', { height: entry.contentRect.height })
          setContentHeight(entry.contentRect.height)
        }
      })
      resizeObserver.observe(contentRef.current)
      console.log('[CollapsibleWrapper] ResizeObserver attached')
      return () => {
        console.log('[CollapsibleWrapper] ResizeObserver detached')
        resizeObserver.disconnect()
      }
    }
  }, [])

  useEffect(() => {
    if (isExpanded && contentRef.current && contentHeight === undefined) {
      const h = contentRef.current.offsetHeight
      console.log('[CollapsibleWrapper] Initial content height:', h)
      setContentHeight(h)
    }
    setIsInitialized(true)
  }, [isExpanded, contentHeight])

  const headerHeight = headerRef.current?.offsetHeight || 0
  const collapsedHeight = headerHeight > 0 ? headerHeight : undefined
  const totalHeight = contentHeight !== undefined && headerHeight > 0 ? headerHeight + contentHeight : undefined

  console.log('[CollapsibleWrapper] height calculation', { headerHeight, contentHeight, collapsedHeight, totalHeight })

  const toggleExpanded = useCallback(() => {
    console.log('[CollapsibleWrapper] toggleExpanded clicked')
    setIsExpanded(!isExpanded)
  }, [isExpanded])

  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden transition-[height] duration-300 ease-out',
        className
      )}
      style={{
        height: isExpanded
          ? (totalHeight !== undefined ? `${totalHeight}px` : 'auto')
          : (collapsedHeight !== undefined ? `${collapsedHeight}px` : 'auto'),
      }}
    >
      {header && (
        <div
          ref={headerRef}
          className={cn(
            'cursor-pointer select-none flex items-center justify-between',
            headerClassName
          )}
          onClick={toggleExpanded}
        >
          {header}
          {showChevron && (
            <div className="flex items-center gap-2">
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground transition-transform duration-200" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform duration-200" />
              )}
            </div>
          )}
        </div>
      )}
      <div
        ref={contentRef}
        className={cn(
          'overflow-hidden transition-[opacity,transform] duration-300 ease-out',
          isExpanded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[-10px]',
          contentClassName
        )}
      >
        {children}
      </div>
    </div>
  )
}
