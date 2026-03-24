import type { WidgetInstance, WidgetLayout, Position, Size, PercentPosition, PercentSize, CanvasSize } from './widget-types'
import { WIDGET_METADATA } from './widget-registry'

export const GRID_SIZE = 20

export const CANVAS_PADDING = 20

export const DEFAULT_CANVAS_SIZE: CanvasSize = { width: 1200, height: 800 }

export function pixelToPercent(value: number, canvasSize: number): number {
  return (value / canvasSize) * 100
}

export function percentToPixel(percent: number, canvasSize: number): number {
  return (percent / 100) * canvasSize
}

export function positionToPercent(position: Position, canvasSize: CanvasSize): PercentPosition {
  return {
    x: pixelToPercent(position.x, canvasSize.width),
    y: pixelToPercent(position.y, canvasSize.height),
  }
}

export function positionToPixel(position: PercentPosition, canvasSize: CanvasSize): Position {
  return {
    x: percentToPixel(position.x, canvasSize.width),
    y: percentToPixel(position.y, canvasSize.height),
  }
}

export function sizeToPercent(size: Size, canvasSize: CanvasSize): PercentSize {
  return {
    width: pixelToPercent(size.width, canvasSize.width),
    height: pixelToPercent(size.height, canvasSize.height),
  }
}

export function sizeToPixel(size: PercentSize, canvasSize: CanvasSize): Size {
  return {
    width: percentToPixel(size.width, canvasSize.width),
    height: percentToPixel(size.height, canvasSize.height),
  }
}

export function snapToGrid(value: number, gridSize: number = GRID_SIZE): number {
  return Math.round(value / gridSize) * gridSize
}

export function snapPositionToGrid(position: Position, gridSize: number = GRID_SIZE): Position {
  return {
    x: snapToGrid(position.x, gridSize),
    y: snapToGrid(position.y, gridSize),
  }
}

export function snapSizeToGrid(size: Size, gridSize: number = GRID_SIZE): Size {
  return {
    width: snapToGrid(size.width, gridSize),
    height: snapToGrid(size.height, gridSize),
  }
}

export function clampSize(
  size: Size,
  minSize: Size,
  maxSize: Size
): Size {
  return {
    width: Math.max(minSize.width, Math.min(maxSize.width, size.width)),
    height: Math.max(minSize.height, Math.min(maxSize.height, size.height)),
  }
}

export function getWidgetBounds(widget: WidgetInstance): {
  left: number
  top: number
  right: number
  bottom: number
} {
  return {
    left: widget.position.x,
    top: widget.position.y,
    right: widget.position.x + widget.size.width,
    bottom: widget.position.y + widget.size.height,
  }
}

export function doWidgetsOverlap(a: WidgetInstance, b: WidgetInstance): boolean {
  const boundsA = getWidgetBounds(a)
  const boundsB = getWidgetBounds(b)
  return !(
    boundsA.right <= boundsB.left ||
    boundsA.left >= boundsB.right ||
    boundsA.bottom <= boundsB.top ||
    boundsA.top >= boundsB.bottom
  )
}

export function findNonOverlappingPosition(
  newWidget: WidgetInstance,
  existingWidgets: WidgetInstance[],
  canvasSize: Size
): Position {
  const meta = WIDGET_METADATA[newWidget.type]
  const minSize = meta.minSize
  let position = { ...newWidget.position }
  let attempts = 0
  const maxAttempts = 100

  const checkOverlap = (pos: Position): boolean => {
    const testWidget = { ...newWidget, position: pos }
    return existingWidgets.some((w) => w.id !== newWidget.id && doWidgetsOverlap(testWidget, w))
  }

  while (checkOverlap(position) && attempts < maxAttempts) {
    position.x += GRID_SIZE
    if (position.x + newWidget.size.width > canvasSize.width - CANVAS_PADDING) {
      position.x = CANVAS_PADDING
      position.y += GRID_SIZE
    }
    if (position.y + newWidget.size.height > canvasSize.height - CANVAS_PADDING) {
      position.y = CANVAS_PADDING
    }
    attempts++
  }

  return snapPositionToGrid(position)
}

export function isValidPosition(position: Position, canvasSize: Size): boolean {
  return position.x >= 0 && position.y >= 0
}

export function isValidSize(size: Size, widgetType: string): boolean {
  const meta = WIDGET_METADATA[widgetType as keyof typeof WIDGET_METADATA]
  if (!meta) return true
  return (
    size.width >= meta.minSize.width &&
    size.width <= meta.maxSize.width &&
    size.height >= meta.minSize.height &&
    size.height <= meta.maxSize.height
  )
}

export function serializeLayout(layout: WidgetLayout): string {
  return JSON.stringify(layout, null, 2)
}

export function deserializeLayout(json: string): WidgetLayout | null {
  try {
    const layout = JSON.parse(json) as WidgetLayout
    if (!layout.id || !layout.name || !Array.isArray(layout.widgets)) {
      return null
    }
    return layout
  } catch {
    return null
  }
}

export function getLayoutThumbnail(layout: WidgetLayout): string {
  const widgetCount = layout.widgets.length
  const types = [...new Set(layout.widgets.map((w) => w.type))]
  return `${widgetCount} widgets: ${types.slice(0, 3).join(', ')}${types.length > 3 ? '...' : ''}`
}

export function sortWidgetsByPosition(widgets: WidgetInstance[]): WidgetInstance[] {
  return [...widgets].sort((a, b) => {
    if (a.position.y !== b.position.y) {
      return a.position.y - b.position.y
    }
    return a.position.x - b.position.x
  })
}

export function getWidgetsInArea(
  widgets: WidgetInstance[],
  area: { position: Position; size: Size }
): WidgetInstance[] {
  return widgets.filter((widget) => {
    const bounds = getWidgetBounds(widget)
    const areaBounds = {
      left: area.position.x,
      top: area.position.y,
      right: area.position.x + area.size.width,
      bottom: area.position.y + area.size.height,
    }
    return !(
      bounds.right < areaBounds.left ||
      bounds.left > areaBounds.right ||
      bounds.bottom < areaBounds.top ||
      bounds.top > areaBounds.bottom
    )
  })
}

export function calculateCanvasSize(widgets: WidgetInstance[], minSize: Size): Size {
  if (widgets.length === 0) {
    return minSize
  }

  let maxWidth = minSize.width
  let maxHeight = minSize.height

  widgets.forEach((widget) => {
    const right = widget.position.x + widget.size.width
    const bottom = widget.position.y + widget.size.height
    maxWidth = Math.max(maxWidth, right + CANVAS_PADDING)
    maxHeight = Math.max(maxHeight, bottom + CANVAS_PADDING)
  })

  return { width: maxWidth, height: maxHeight }
}

/**
 * 自动排列组件，使它们垂直堆叠
 * @param widgets - 组件列表
 * @param canvasSize - 画布尺寸
 * @param collapsedId - 折叠的组件ID
 * @param collapsedHeight - 折叠后的高度
 * @returns 更新后的组件列表
 */
export function autoArrangeWidgets(
  widgets: WidgetInstance[],
  canvasSize: CanvasSize,
  collapsedId?: string,
  collapsedHeight?: number
): WidgetInstance[] {
  const sorted = sortWidgetsByPosition(widgets)
  const result: WidgetInstance[] = []
  let currentY = CANVAS_PADDING
  const columnWidth = 300
  const gap = 16

  sorted.forEach((widget, index) => {
    const isCollapsed = widget.id === collapsedId || widget.collapsed
    const height = isCollapsed && collapsedHeight ? collapsedHeight : 
                   (widget.actualHeight ? percentToPixel(widget.actualHeight, canvasSize.height) : 
                   percentToPixel(widget.size.height, canvasSize.height))
    
    const newWidget: WidgetInstance = {
      ...widget,
      position: {
        x: pixelToPercent(CANVAS_PADDING + (index % 2) * (columnWidth + gap), canvasSize.width),
        y: pixelToPercent(currentY, canvasSize.height),
      },
    }
    
    result.push(newWidget)
    currentY += height + gap
  })

  return result
}
