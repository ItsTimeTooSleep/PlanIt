'use client'

import { createContext, useContext, useCallback, useMemo, useState, useEffect, useRef } from 'react'
import type { WidgetInstance, WidgetLayout, WidgetType, Position, Size, PercentPosition, PercentSize, CanvasSize } from './widget-types'
import { WIDGET_METADATA } from './widget-registry'
import { DEFAULT_CANVAS_SIZE, positionToPercent, sizeToPercent, percentToPixel, pixelToPercent } from './widget-layout-manager'

const MAX_HISTORY_SIZE = 50

interface HistoryState {
  layouts: WidgetLayout[]
  activeLayoutId: string | null
}

export interface WidgetStoreState {
  layouts: WidgetLayout[]
  activeLayoutId: string | null
}

export interface WidgetStoreActions {
  addWidget: (type: WidgetType, position?: Position, size?: Size) => WidgetInstance
  updateWidget: (id: string, updates: Partial<WidgetInstance>) => void
  removeWidget: (id: string) => void
  moveWidget: (id: string, position: PercentPosition) => void
  resizeWidget: (id: string, size: PercentSize) => void
  updateWidgetConfig: (id: string, config: Partial<Record<string, unknown>>) => void
  updateWidgetZIndex: (id: string, zIndex: number) => void
  updateWidgetCollapsed: (id: string, collapsed: boolean, actualHeight?: number) => void
  toggleWidgetLock: (id: string, locked: boolean) => void
  autoArrangeWidgets: () => void
  reorderWidgets: (widgetIds: string[]) => void
  getActiveLayout: () => WidgetLayout | null
  createLayout: (name: string, canvasSize?: CanvasSize) => WidgetLayout
  deleteLayout: (id: string) => void
  setActiveLayout: (id: string) => void
  renameLayout: (id: string, name: string) => void
  duplicateLayout: (id: string) => WidgetLayout | null
  updateCanvasSize: (id: string, canvasSize: CanvasSize) => void
  exportLayout: (id: string) => string
  importLayout: (json: string) => WidgetLayout | null
  getWidgets: () => WidgetInstance[]
  getWidget: (id: string) => WidgetInstance | undefined
  canUndo: () => boolean
  canRedo: () => boolean
  undo: () => void
  redo: () => void
  startBatchUpdate: () => void
  endBatchUpdate: () => void
}

export type WidgetStoreContextValue = WidgetStoreState & WidgetStoreActions

const WIDGET_STORE_KEY = 'planit-widget-store'

function generateId(): string {
  return `widget-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

function createDefaultLayout(): WidgetLayout {
  const now = new Date().toISOString()
  const today = new Date().toISOString().split('T')[0]
  return {
    id: generateId(),
    name: '默认界面',
    canvas: {
      width: 1200,
      height: 800,
    },
    widgets: [
      {
        id: generateId(),
        type: 'note',
        position: { x: 18.333333333333332, y: 57.49999999999999 },
        size: { width: 15, height: 40 },
        zIndex: 8,
        config: { showHeader: true, maxLength: 1000, autoSave: false },
        createdAt: now,
        updatedAt: now,
      },
      {
        id: generateId(),
        type: 'todo',
        position: { x: 1.6666666666666667, y: 22.5 },
        size: { width: 31.666666666666664, height: 32.5 },
        zIndex: 7,
        config: { showOverdue: true, showTags: true, showTime: true, maxItems: 10, showHeader: true },
        createdAt: now,
        updatedAt: now,
      },
      {
        id: generateId(),
        type: 'timeline',
        position: { x: 35, y: 22.5 },
        size: { width: 63.33333333333333, height: 75 },
        zIndex: 6,
        config: { showHourLabels: true, showCurrentTimeLine: true, showTaskDetails: true, autoScroll: true },
        createdAt: now,
        updatedAt: now,
      },
      {
        id: generateId(),
        type: 'pomodoro',
        position: { x: 1.6666666666666667, y: 57.49999999999999 },
        size: { width: 15, height: 40 },
        zIndex: 5,
        config: { showTask: true, showSessionCount: true, showSettings: false },
        createdAt: now,
        updatedAt: now,
      },
      {
        id: generateId(),
        type: 'countdown',
        position: { x: 83.33333333333334, y: 2.5 },
        size: { width: 15, height: 17.5 },
        zIndex: 4,
        config: { targetDate: today, name: '旅程', showIcon: false },
        createdAt: now,
        updatedAt: now,
      },
      {
        id: generateId(),
        type: 'datetime',
        position: { x: 45, y: 2.5 },
        size: { width: 36.666666666666664, height: 17.5 },
        zIndex: 3,
        config: { showSeconds: true, showDate: true, showWeekday: true, showYear: false, timeFormat: '24', lang: 'zh' },
        createdAt: now,
        updatedAt: now,
      },
      {
        id: generateId(),
        type: 'progress',
        position: { x: 1.6666666666666667, y: 2.5 },
        size: { width: 41.66666666666667, height: 17.5 },
        zIndex: 2,
        config: { showPercentage: true, showCount: true, showIcon: true, showDetailedStats: true },
        createdAt: now,
        updatedAt: now,
      },
    ],
    createdAt: now,
    updatedAt: now,
  }
}

function loadFromStorage(): WidgetStoreState {
  if (typeof window === 'undefined') {
    return {
      layouts: [createDefaultLayout()],
      activeLayoutId: null,
    }
  }

  try {
    const stored = localStorage.getItem(WIDGET_STORE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as WidgetStoreState
      if (parsed.layouts && parsed.layouts.length > 0) {
        return parsed
      }
    }
  } catch (e) {
    console.error('Failed to load widget store from localStorage:', e)
  }

  const defaultLayout = createDefaultLayout()
  return {
    layouts: [defaultLayout],
    activeLayoutId: defaultLayout.id,
  }
}

function saveToStorage(state: WidgetStoreState): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(WIDGET_STORE_KEY, JSON.stringify(state))
  } catch (e) {
    console.error('Failed to save widget store to localStorage:', e)
  }
}

export const WidgetStoreContext = createContext<WidgetStoreContextValue | null>(null)

export function useWidgetStore(): WidgetStoreContextValue {
  const ctx = useContext(WidgetStoreContext)
  if (!ctx) throw new Error('useWidgetStore must be used within WidgetStoreProvider')
  return ctx
}

/**
 * 检测两个组件在X轴上是否有重叠
 * @param widget1 - 组件1
 * @param widget2 - 组件2
 * @param canvasSize - 画布尺寸
 * @returns 是否有重叠
 */
function hasXOverlap(
  widget1: WidgetInstance,
  widget2: WidgetInstance,
  canvasSize: CanvasSize
): boolean {
  const x1Start = percentToPixel(widget1.position.x, canvasSize.width)
  const x1End = x1Start + percentToPixel(widget1.size.width, canvasSize.width)
  const x2Start = percentToPixel(widget2.position.x, canvasSize.width)
  const x2End = x2Start + percentToPixel(widget2.size.width, canvasSize.width)
  
  return x1Start < x2End && x1End > x2Start
}

/**
 * 检测组件移动后是否会与其他组件发生碰撞
 * @param widget - 要移动的组件
 * @param newY - 新的 Y 位置（像素）
 * @param newHeight - 新的高度（像素，折叠时使用 actualHeight）
 * @param otherWidgets - 其他组件列表
 * @param canvasSize - 画布尺寸
 * @param excludeIds - 排除的组件ID列表
 * @returns 是否会发生碰撞
 */
function wouldCollide(
  widget: WidgetInstance,
  newY: number,
  newHeight: number,
  otherWidgets: WidgetInstance[],
  canvasSize: CanvasSize,
  excludeIds: string[]
): boolean {
  const widgetYEnd = newY + newHeight

  for (const other of otherWidgets) {
    if (excludeIds.includes(other.id)) continue
    if (!hasXOverlap(widget, other, canvasSize)) continue

    const otherY = percentToPixel(other.position.y, canvasSize.height)
    const otherHeight = other.collapsed && other.actualHeight
      ? other.actualHeight
      : percentToPixel(other.size.height, canvasSize.height)
    const otherYEnd = otherY + otherHeight

    const yOverlaps = newY < otherYEnd && widgetYEnd > otherY
    if (yOverlaps) return true
  }

  return false
}

export function useWidgetStoreState(): WidgetStoreContextValue {
  const [state, setState] = useState<WidgetStoreState>(loadFromStorage)
  const historyRef = useRef<HistoryState[]>([])
  const historyIndexRef = useRef<number>(-1)
  const isUndoRedoRef = useRef<boolean>(false)
  const prevStateRef = useRef<string>('')
  const isBatchUpdateRef = useRef<boolean>(false)
  const batchStartStateRef = useRef<HistoryState | null>(null)

  const pushToHistory = useCallback((layouts: WidgetLayout[], activeLayoutId: string | null) => {
    console.log('[pushToHistory] called, isUndoRedo:', isUndoRedoRef.current, 'isBatch:', isBatchUpdateRef.current)
    if (isUndoRedoRef.current || isBatchUpdateRef.current) {
      return
    }
    const stateKey = JSON.stringify({ layouts, activeLayoutId })
    if (stateKey === prevStateRef.current) {
      console.log('[pushToHistory] state unchanged, skipping')
      return
    }
    prevStateRef.current = stateKey
    
    const newHistory = historyRef.current.slice(0, historyIndexRef.current + 1)
    newHistory.push({
      layouts: JSON.parse(JSON.stringify(layouts)),
      activeLayoutId: activeLayoutId,
    })
    if (newHistory.length > MAX_HISTORY_SIZE) {
      newHistory.shift()
    }
    historyRef.current = newHistory
    historyIndexRef.current = newHistory.length - 1
    console.log('[pushToHistory] saved, history length:', newHistory.length, 'index:', historyIndexRef.current)
  }, [])

  const startBatchUpdate = useCallback(() => {
    console.log('[startBatchUpdate]')
    isBatchUpdateRef.current = true
    batchStartStateRef.current = {
      layouts: JSON.parse(JSON.stringify(state.layouts)),
      activeLayoutId: state.activeLayoutId,
    }
  }, [state])

  const endBatchUpdate = useCallback(() => {
    console.log('[endBatchUpdate]')
    if (!isBatchUpdateRef.current) return
    
    isBatchUpdateRef.current = false
    
    if (batchStartStateRef.current) {
      const startKey = JSON.stringify({
        layouts: batchStartStateRef.current.layouts,
        activeLayoutId: batchStartStateRef.current.activeLayoutId,
      })
      const currentKey = JSON.stringify({
        layouts: state.layouts,
        activeLayoutId: state.activeLayoutId,
      })
      
      if (startKey !== currentKey) {
        const newHistory = historyRef.current.slice(0, historyIndexRef.current + 1)
        newHistory.push({
          layouts: JSON.parse(JSON.stringify(state.layouts)),
          activeLayoutId: state.activeLayoutId,
        })
        if (newHistory.length > MAX_HISTORY_SIZE) {
          newHistory.shift()
        }
        historyRef.current = newHistory
        historyIndexRef.current = newHistory.length - 1
        prevStateRef.current = currentKey
        console.log('[endBatchUpdate] saved, history length:', newHistory.length, 'index:', historyIndexRef.current)
      }
    }
    batchStartStateRef.current = null
  }, [state])

  const canUndo = useCallback((): boolean => {
    const result = historyIndexRef.current > 0
    console.log('[canUndo] index:', historyIndexRef.current, 'result:', result)
    return result
  }, [])

  const canRedo = useCallback((): boolean => {
    const result = historyIndexRef.current < historyRef.current.length - 1
    console.log('[canRedo] index:', historyIndexRef.current, 'history length:', historyRef.current.length, 'result:', result)
    return result
  }, [])

  const undo = useCallback(() => {
    console.log('[undo] called, index:', historyIndexRef.current)
    if (historyIndexRef.current > 0) {
      isUndoRedoRef.current = true
      historyIndexRef.current -= 1
      const historyState = historyRef.current[historyIndexRef.current]
      prevStateRef.current = JSON.stringify({ 
        layouts: historyState.layouts, 
        activeLayoutId: historyState.activeLayoutId 
      })
      setState({
        layouts: JSON.parse(JSON.stringify(historyState.layouts)),
        activeLayoutId: historyState.activeLayoutId,
      })
      console.log('[undo] restored to index:', historyIndexRef.current)
      setTimeout(() => {
        isUndoRedoRef.current = false
      }, 0)
    }
  }, [])

  const redo = useCallback(() => {
    console.log('[redo] called, index:', historyIndexRef.current)
    if (historyIndexRef.current < historyRef.current.length - 1) {
      isUndoRedoRef.current = true
      historyIndexRef.current += 1
      const historyState = historyRef.current[historyIndexRef.current]
      prevStateRef.current = JSON.stringify({ 
        layouts: historyState.layouts, 
        activeLayoutId: historyState.activeLayoutId 
      })
      setState({
        layouts: JSON.parse(JSON.stringify(historyState.layouts)),
        activeLayoutId: historyState.activeLayoutId,
      })
      console.log('[redo] restored to index:', historyIndexRef.current)
      setTimeout(() => {
        isUndoRedoRef.current = false
      }, 0)
    }
  }, [])

  const setStateWithHistory = useCallback(
    (updater: (prev: WidgetStoreState) => WidgetStoreState) => {
      setState((prev) => {
        const newState = updater(prev)
        return newState
      })
    },
    []
  )

  useEffect(() => {
    if (!isUndoRedoRef.current) {
      pushToHistory(state.layouts, state.activeLayoutId)
    }
    saveToStorage(state)
  }, [state, pushToHistory])

  const getActiveLayout = useCallback((): WidgetLayout | null => {
    if (!state.activeLayoutId) return state.layouts[0] || null
    return state.layouts.find((l) => l.id === state.activeLayoutId) || state.layouts[0] || null
  }, [state.layouts, state.activeLayoutId])

  const getWidgets = useCallback((): WidgetInstance[] => {
    const layout = getActiveLayout()
    return layout?.widgets || []
  }, [getActiveLayout])

  const getWidget = useCallback((id: string): WidgetInstance | undefined => {
    return getWidgets().find((w) => w.id === id)
  }, [getWidgets])

  const updateWidget = useCallback((id: string, updates: Partial<WidgetInstance>): void => {
    const now = new Date().toISOString()
    setStateWithHistory((prev) => ({
      ...prev,
      layouts: prev.layouts.map((layout) => {
        if (layout.id === prev.activeLayoutId || (!prev.activeLayoutId && layout === prev.layouts[0])) {
          return {
            ...layout,
            widgets: layout.widgets.map((widget) =>
              widget.id === id ? { ...widget, ...updates, updatedAt: now } : widget
            ),
            updatedAt: now,
          }
        }
        return layout
      }),
    }))
  }, [setStateWithHistory])

  const addWidget = useCallback(
    (type: WidgetType, position?: Position, size?: Size): WidgetInstance => {
      const meta = WIDGET_METADATA[type]
      const now = new Date().toISOString()
      
      let newWidget: WidgetInstance | null = null

      setStateWithHistory((prev) => {
        const layoutId = prev.activeLayoutId || prev.layouts[0]?.id
        const layout = prev.layouts.find((l) => l.id === layoutId)
        if (!layout) return prev

        let newZIndex = 1
        if (layout.widgets.length > 0) {
          newZIndex = Math.max(...layout.widgets.map(w => w.zIndex || 0)) + 1
        }
        const canvasSize = layout.canvas || DEFAULT_CANVAS_SIZE

        const pixelPosition = position || { x: 20, y: 20 }
        const pixelSize = size || meta.defaultSize
        
        newWidget = {
          id: generateId(),
          type,
          position: positionToPercent(pixelPosition, canvasSize),
          size: sizeToPercent(pixelSize, canvasSize),
          zIndex: newZIndex,
          config: { ...meta.defaultConfig },
          createdAt: now,
          updatedAt: now,
        }

        return {
          ...prev,
          layouts: prev.layouts.map((l) => {
            if (l.id === layoutId) {
              return {
                ...l,
                widgets: [...l.widgets, newWidget!],
                updatedAt: now,
              }
            }
            return l
          }),
        }
      })

      return newWidget!
    },
    [setStateWithHistory]
  )

  const removeWidget = useCallback((id: string): void => {
    const now = new Date().toISOString()
    setStateWithHistory((prev) => ({
      ...prev,
      layouts: prev.layouts.map((layout) => {
        if (layout.id === prev.activeLayoutId || (!prev.activeLayoutId && layout === prev.layouts[0])) {
          return {
            ...layout,
            widgets: layout.widgets.filter((widget) => widget.id !== id),
            updatedAt: now,
          }
        }
        return layout
      }),
    }))
  }, [setStateWithHistory])

  const moveWidget = useCallback((id: string, position: PercentPosition): void => {
    updateWidget(id, { position })
  }, [updateWidget])

  const resizeWidget = useCallback((id: string, size: PercentSize): void => {
    updateWidget(id, { size })
  }, [updateWidget])

  const updateWidgetConfig = useCallback(
    (id: string, config: Partial<Record<string, unknown>>): void => {
      const widget = getWidget(id)
      if (widget) {
        updateWidget(id, { config: { ...widget.config, ...config } })
      }
    },
    [getWidget, updateWidget]
  )

  const updateWidgetZIndex = useCallback((id: string, zIndex: number): void => {
    updateWidget(id, { zIndex })
  }, [updateWidget])

  /**
   * 更新组件折叠状态
   * @param id - 组件ID
   * @param collapsed - 是否折叠
   * @param actualHeight - 实际高度（折叠后的高度）
   */
  const updateWidgetCollapsedState = useCallback((id: string, collapsed: boolean, actualHeight?: number): void => {
    const now = new Date().toISOString()
    setStateWithHistory((prev) => {
      const layoutId = prev.activeLayoutId || prev.layouts[0]?.id
      const layout = prev.layouts.find(l => l.id === layoutId)
      if (!layout) return prev

      const canvasSize = layout.canvas || DEFAULT_CANVAS_SIZE
      const targetWidget = layout.widgets.find(w => w.id === id)
      if (!targetWidget) return prev

      const originalHeight = percentToPixel(targetWidget.size.height, canvasSize.height)
      const collapsedHeight = actualHeight || 50
      
      let heightDiff: number
      if (collapsed) {
        heightDiff = -(originalHeight - collapsedHeight)
      } else {
        const prevCollapsedHeight = targetWidget.actualHeight || collapsedHeight
        heightDiff = originalHeight - prevCollapsedHeight
      }

      const targetY = percentToPixel(targetWidget.position.y, canvasSize.height)
      const widgetsToMove: { id: string; newY: number }[] = []

      const widgetsBelow = layout.widgets
        .filter(w => w.id !== id && !w.locked)
        .map(w => ({
          widget: w,
          y: percentToPixel(w.position.y, canvasSize.height),
        }))
        .filter(({ y }) => y > targetY)
        .sort((a, b) => a.y - b.y)

      for (const { widget, y } of widgetsBelow) {
        if (!hasXOverlap(targetWidget, widget, canvasSize)) continue

        const potentialNewY = y + heightDiff
        const widgetHeight = widget.collapsed && widget.actualHeight
          ? widget.actualHeight
          : percentToPixel(widget.size.height, canvasSize.height)

        if (potentialNewY < 0) continue
        if (potentialNewY + widgetHeight > canvasSize.height) continue

        const otherWidgets = layout.widgets.filter(w => w.id !== id && w.id !== widget.id)
        const excludeIds = [id, widget.id, ...widgetsToMove.map(m => m.id)]
        
        if (!wouldCollide(widget, potentialNewY, widgetHeight, otherWidgets, canvasSize, excludeIds)) {
          widgetsToMove.push({ id: widget.id, newY: potentialNewY })
        }
      }

      const updatedWidgets = layout.widgets.map((widget) => {
        if (widget.id === id) {
          return { ...widget, collapsed, actualHeight: collapsed ? collapsedHeight : undefined, updatedAt: now }
        }
        
        const moveInfo = widgetsToMove.find(m => m.id === widget.id)
        if (moveInfo) {
          return {
            ...widget,
            position: {
              x: widget.position.x,
              y: pixelToPercent(Math.max(0, moveInfo.newY), canvasSize.height),
            },
            updatedAt: now,
          }
        }
        
        return widget
      })

      return {
        ...prev,
        layouts: prev.layouts.map((l) => {
          if (l.id === layoutId) {
            return {
              ...l,
              widgets: updatedWidgets,
              updatedAt: now,
            }
          }
          return l
        }),
      }
    })
  }, [setStateWithHistory])

  /**
   * 切换组件锁定状态
   * @param id - 组件ID
   * @param locked - 是否锁定
   */
  const toggleWidgetLockState = useCallback((id: string, locked: boolean): void => {
    updateWidget(id, { locked })
  }, [updateWidget])

  /**
   * 自动排列所有组件
   */
  const autoArrangeWidgetsState = useCallback((): void => {
  }, [])

  const reorderWidgets = useCallback((widgetIds: string[]): void => {
    const now = new Date().toISOString()
    setStateWithHistory((prev) => {
      const layoutId = prev.activeLayoutId || prev.layouts[0]?.id
      return {
        ...prev,
        layouts: prev.layouts.map((layout) => {
          if (layout.id === layoutId) {
            const newWidgets = widgetIds.map((id, index) => {
              const widget = layout.widgets.find(w => w.id === id)
              return widget ? { ...widget, zIndex: index + 1, updatedAt: now } : widget
            }).filter(Boolean) as WidgetInstance[]
            
            const remainingWidgets = layout.widgets.filter(w => !widgetIds.includes(w.id))
            
            return {
              ...layout,
              widgets: [...newWidgets, ...remainingWidgets],
              updatedAt: now,
            }
          }
          return layout
        }),
      }
    })
  }, [setStateWithHistory])

  const createLayout = useCallback((name: string, canvasSize?: CanvasSize): WidgetLayout => {
    const now = new Date().toISOString()
    const newLayout: WidgetLayout = {
      id: generateId(),
      name,
      canvas: canvasSize || DEFAULT_CANVAS_SIZE,
      widgets: [],
      createdAt: now,
      updatedAt: now,
    }

    setStateWithHistory((prev) => ({
      ...prev,
      layouts: [...prev.layouts, newLayout],
      activeLayoutId: newLayout.id,
    }))

    return newLayout
  }, [setStateWithHistory])

  const deleteLayout = useCallback((id: string): void => {
    setStateWithHistory((prev) => {
      if (prev.layouts.length <= 1) {
        return prev
      }
      const newLayouts = prev.layouts.filter((l) => l.id !== id)
      const newActiveId =
        prev.activeLayoutId === id ? (newLayouts[0]?.id || null) : prev.activeLayoutId
      return {
        ...prev,
        layouts: newLayouts,
        activeLayoutId: newActiveId,
      }
    })
  }, [setStateWithHistory])

  const setActiveLayout = useCallback((id: string): void => {
    setStateWithHistory((prev) => ({
      ...prev,
      activeLayoutId: id,
    }))
  }, [setStateWithHistory])

  const renameLayout = useCallback((id: string, name: string): void => {
    const now = new Date().toISOString()
    setStateWithHistory((prev) => ({
      ...prev,
      layouts: prev.layouts.map((layout) =>
        layout.id === id ? { ...layout, name, updatedAt: now } : layout
      ),
    }))
  }, [setStateWithHistory])

  const duplicateLayout = useCallback((id: string): WidgetLayout | null => {
    const now = new Date().toISOString()
    let duplicated: WidgetLayout | null = null

    setStateWithHistory((prev) => {
      const source = prev.layouts.find((l) => l.id === id)
      if (!source) return prev

      duplicated = {
        ...source,
        id: generateId(),
        name: `${source.name} (Copy)`,
        widgets: source.widgets.map((w) => ({ ...w, id: generateId() })),
        createdAt: now,
        updatedAt: now,
      }

      return {
        ...prev,
        layouts: [...prev.layouts, duplicated!],
        activeLayoutId: duplicated!.id,
      }
    })

    return duplicated
  }, [setStateWithHistory])

  const updateCanvasSize = useCallback((id: string, canvasSize: CanvasSize): void => {
    const now = new Date().toISOString()
    setStateWithHistory((prev) => ({
      ...prev,
      layouts: prev.layouts.map((layout) =>
        layout.id === id ? { ...layout, canvas: canvasSize, updatedAt: now } : layout
      ),
    }))
  }, [setStateWithHistory])

  const exportLayout = useCallback(
    (id: string): string => {
      const layout = state.layouts.find((l) => l.id === id)
      if (!layout) return ''
      return JSON.stringify(layout, null, 2)
    },
    [state.layouts]
  )

  const importLayout = useCallback((json: string): WidgetLayout | null => {
    try {
      const layout = JSON.parse(json) as WidgetLayout
      if (!layout.name || !Array.isArray(layout.widgets)) {
        throw new Error('Invalid layout format')
      }

      const now = new Date().toISOString()
      const imported: WidgetLayout = {
        ...layout,
        id: generateId(),
        name: `${layout.name} (Imported)`,
        canvas: layout.canvas || DEFAULT_CANVAS_SIZE,
        widgets: layout.widgets.map((w) => ({ ...w, id: generateId() })),
        createdAt: now,
        updatedAt: now,
      }

      setStateWithHistory((prev) => ({
        ...prev,
        layouts: [...prev.layouts, imported],
        activeLayoutId: imported.id,
      }))

      return imported
    } catch (e) {
      console.error('Failed to import layout:', e)
      return null
    }
  }, [setStateWithHistory])

  return useMemo(
    () => ({
      ...state,
      addWidget,
      updateWidget,
      removeWidget,
      moveWidget,
      resizeWidget,
      updateWidgetConfig,
      updateWidgetZIndex,
      updateWidgetCollapsed: updateWidgetCollapsedState,
      toggleWidgetLock: toggleWidgetLockState,
      autoArrangeWidgets: autoArrangeWidgetsState,
      reorderWidgets,
      getActiveLayout,
      createLayout,
      deleteLayout,
      setActiveLayout,
      renameLayout,
      duplicateLayout,
      updateCanvasSize,
      exportLayout,
      importLayout,
      getWidgets,
      getWidget,
      canUndo,
      canRedo,
      undo,
      redo,
      startBatchUpdate,
      endBatchUpdate,
    }),
    [
      state,
      addWidget,
      updateWidget,
      removeWidget,
      moveWidget,
      resizeWidget,
      updateWidgetConfig,
      updateWidgetZIndex,
      updateWidgetCollapsedState,
      toggleWidgetLockState,
      autoArrangeWidgetsState,
      reorderWidgets,
      getActiveLayout,
      createLayout,
      deleteLayout,
      setActiveLayout,
      renameLayout,
      duplicateLayout,
      updateCanvasSize,
      exportLayout,
      importLayout,
      getWidgets,
      getWidget,
      canUndo,
      canRedo,
      undo,
      redo,
      startBatchUpdate,
      endBatchUpdate,
    ]
  )
}
