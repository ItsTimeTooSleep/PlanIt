'use client'

import { useState, useMemo } from 'react'
import { Search, GripVertical, Calculator, CircleDot, Quote, Timer, Search as SearchIcon, CheckSquare, StickyNote, Clock, BarChart3, Target, Calendar, GanttChart, Minus, Type, CalendarClock } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { WidgetType, WidgetCategory, WidgetMetadata } from '@/lib/widget-types'
import { WIDGET_METADATA, WIDGET_CATEGORIES, CATEGORY_ORDER, getWidgetsByCategory } from '@/lib/widget-registry'

const WIDGET_ICONS: Record<WidgetType, React.ComponentType<{ className?: string }>> = {
  calculator: Calculator,
  spinWheel: CircleDot,
  quote: Quote,
  timer: Timer,
  search: SearchIcon,
  todo: CheckSquare,
  note: StickyNote,
  pomodoro: Clock,
  progress: BarChart3,
  currentTask: Target,
  datetime: Calendar,
  timeline: GanttChart,
  line: Minus,
  text: Type,
  countdown: CalendarClock,
}

interface WidgetSelectorProps {
  onDragStart?: (type: WidgetType) => void
  onWidgetSelect?: (type: WidgetType) => void
  className?: string
}

/**
 * 组件选择面板
 * @param props - 组件属性
 * @param props.onDragStart - 拖拽开始回调
 * @param props.onWidgetSelect - 组件选择回调
 * @param props.className - 自定义样式类
 * @returns 组件选择面板
 */
export function WidgetSelector({ onDragStart, onWidgetSelect, className }: WidgetSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<WidgetCategory>('productivity')

  const filteredWidgets = useMemo(() => {
    const allWidgets = Object.values(WIDGET_METADATA)
    if (!searchQuery.trim()) {
      return allWidgets
    }
    const query = searchQuery.toLowerCase()
    return allWidgets.filter(
      (widget) =>
        widget.name.toLowerCase().includes(query) ||
        widget.nameZh.includes(query) ||
        widget.description.toLowerCase().includes(query) ||
        widget.descriptionZh.includes(query)
    )
  }, [searchQuery])

  const handleDragStart = (type: WidgetType) => {
    onDragStart?.(type)
  }

  const handleWidgetClick = (type: WidgetType) => {
    onWidgetSelect?.(type)
  }

  return (
    <div className={cn('flex flex-col h-full bg-card border-r border-border', className)}>
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索组件..."
            className="pl-9 h-9 text-sm"
          />
        </div>
      </div>

      {searchQuery ? (
        <ScrollArea className="flex-1">
          <div className="p-3 grid grid-cols-2 gap-2">
            {filteredWidgets.map((widget) => (
              <WidgetCard
                key={widget.type}
                widget={widget}
                onDragStart={handleDragStart}
                onClick={handleWidgetClick}
              />
            ))}
            {filteredWidgets.length === 0 && (
              <div className="col-span-2 py-8 text-center text-sm text-muted-foreground">
                未找到匹配的组件
              </div>
            )}
          </div>
        </ScrollArea>
      ) : (
        <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as WidgetCategory)} className="flex-1 flex flex-col">
          <TabsList className="grid grid-cols-4 mx-3 mt-2">
            {CATEGORY_ORDER.map((category) => (
              <TabsTrigger key={category} value={category} className="text-xs">
                {WIDGET_CATEGORIES[category].nameZh}
              </TabsTrigger>
            ))}
          </TabsList>

          {CATEGORY_ORDER.map((category) => (
            <TabsContent key={category} value={category} className="flex-1 mt-0">
              <ScrollArea className="h-full">
                <div className="p-3 grid grid-cols-2 gap-2">
                  {getWidgetsByCategory(category).map((widget) => (
                    <WidgetCard
                      key={widget.type}
                      widget={widget}
                      onDragStart={handleDragStart}
                      onClick={handleWidgetClick}
                    />
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  )
}

interface WidgetCardProps {
  widget: WidgetMetadata
  onDragStart: (type: WidgetType) => void
  onClick: (type: WidgetType) => void
}

function WidgetCard({ widget, onDragStart, onClick }: WidgetCardProps) {
  const Icon = WIDGET_ICONS[widget.type]

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('widget-type', widget.type)
    onDragStart(widget.type)
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={() => onClick(widget.type)}
      className="group relative flex flex-col items-center p-3 rounded-lg border border-border bg-background hover:bg-muted/50 hover:border-primary/50 cursor-pointer transition-all"
    >
      <div className="absolute left-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical className="w-3 h-3 text-muted-foreground" />
      </div>

      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
        <Icon className="w-5 h-5 text-primary" />
      </div>

      <span className="text-xs font-medium text-center">{widget.nameZh}</span>
      <span className="text-[10px] text-muted-foreground text-center mt-0.5 line-clamp-1">
        {widget.descriptionZh}
      </span>
    </div>
  )
}
