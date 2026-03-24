'use client'

import { useState, useCallback } from 'react'
import { Layers, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useWidgetStore } from '@/components/widget-store-provider'
import { WIDGET_METADATA } from '@/lib/widget-registry'
import type { WidgetInstance } from '@/lib/widget-types'
import { cn } from '@/lib/utils'

interface WidgetLayerManagerProps {
  className?: string
}

interface DraggableWidgetItemProps {
  widget: WidgetInstance
  index: number
  onDragStart: (index: number) => void
  onDragOver: (index: number) => void
  onDragEnd: () => void
  isDragging: boolean
}

function DraggableWidgetItem({
  widget,
  index,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragging,
}: DraggableWidgetItemProps) {
  const meta = WIDGET_METADATA[widget.type]

  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => {
        e.preventDefault()
        onDragOver(index)
      }}
      onDragEnd={onDragEnd}
      className={cn(
        'flex items-center gap-2 p-2 rounded-lg border border-border bg-card cursor-grab active:cursor-grabbing transition-colors',
        isDragging && 'opacity-50'
      )}
    >
      <GripVertical className="w-4 h-4 text-muted-foreground" />
      <div className="flex-1">
        <div className="text-sm font-medium">{meta.nameZh || meta.name}</div>
        <div className="text-xs text-muted-foreground">Z-index: {widget.zIndex}</div>
      </div>
    </div>
  )
}

export function WidgetLayerManager({ className }: WidgetLayerManagerProps) {
  const [open, setOpen] = useState(false)
  const { getWidgets, reorderWidgets } = useWidgetStore()
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [widgetOrder, setWidgetOrder] = useState<string[]>([])

  const widgets = getWidgets().sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0))

  const handleOpen = useCallback(() => {
    setWidgetOrder(widgets.map(w => w.id))
    setOpen(true)
  }, [widgets])

  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index)
  }, [])

  const handleDragOver = useCallback((index: number) => {
    if (draggedIndex === null || draggedIndex === index) return

    setWidgetOrder(prev => {
      const newOrder = [...prev]
      const [removed] = newOrder.splice(draggedIndex, 1)
      newOrder.splice(index, 0, removed)
      return newOrder
    })
    setDraggedIndex(index)
  }, [draggedIndex])

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null)
  }, [])

  const handleSave = useCallback(() => {
    reorderWidgets(widgetOrder)
    setOpen(false)
  }, [widgetOrder, reorderWidgets])

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleOpen}
        className={className}
      >
        <Layers className="w-4 h-4 mr-1" />
        层级
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>组件层级管理</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-80">
            <div className="space-y-2">
              {widgetOrder.map((widgetId, index) => {
                const widget = widgets.find(w => w.id === widgetId)
                if (!widget) return null
                return (
                  <DraggableWidgetItem
                    key={widget.id}
                    widget={widget}
                    index={index}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                    isDragging={draggedIndex === index}
                  />
                )
              })}
              {widgetOrder.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  暂无组件
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave}>
              保存
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
