import { useRef, useEffect, useState, useCallback, RefObject } from 'react'

export interface AdaptiveContentItem {
  id: string
  minWidth: number
  minHeight?: number
  priority: number
  required: boolean
}

export interface AdaptiveLayoutConfig {
  contents: AdaptiveContentItem[]
  baseMinWidth: number
  baseMinHeight: number
  gap?: number
}

export interface AdaptiveLayoutResult {
  containerWidth: number
  containerHeight: number
  visibleContents: Set<string>
  getMinSize: () => { minWidth: number; minHeight: number }
  isContentVisible: (id: string) => boolean
}

/**
 * 自适应布局 Hook
 * @param config - 布局配置
 * @param externalRef - 外部容器引用
 * @returns 自适应布局结果
 */
export function useAdaptiveLayout(
  config: AdaptiveLayoutConfig,
  externalRef?: RefObject<HTMLDivElement | null>
): AdaptiveLayoutResult {
  const internalRef = useRef<HTMLDivElement | null>(null)
  const containerRef = externalRef || internalRef
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  const [visibleContents, setVisibleContents] = useState<Set<string>>(new Set())

  const calculateVisibleContents = useCallback(
    (width: number, height: number): Set<string> => {
      const visible = new Set<string>()
      const sortedContents = [...config.contents].sort((a, b) => b.priority - a.priority)

      let remainingWidth = width - config.baseMinWidth
      let remainingHeight = height - config.baseMinHeight

      for (const content of sortedContents) {
        if (content.required) {
          visible.add(content.id)
        } else {
          const hasWidth = remainingWidth >= content.minWidth
          const hasHeight = content.minHeight ? remainingHeight >= content.minHeight : true

          if (hasWidth && hasHeight) {
            visible.add(content.id)
            remainingWidth -= content.minWidth + (config.gap || 0)
            if (content.minHeight) {
              remainingHeight -= content.minHeight
            }
          }
        }
      }

      return visible
    },
    [config]
  )

  const getMinSize = useCallback(() => {
    let minWidth = config.baseMinWidth
    let minHeight = config.baseMinHeight

    for (const content of config.contents) {
      if (content.required) {
        minWidth += content.minWidth + (config.gap || 0)
        if (content.minHeight) {
          minHeight = Math.max(minHeight, content.minHeight)
        }
      }
    }

    return { minWidth, minHeight }
  }, [config])

  const isContentVisible = useCallback(
    (id: string) => visibleContents.has(id),
    [visibleContents]
  )

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const updateSize = () => {
      const { width, height } = el.getBoundingClientRect()
      setContainerSize({ width, height })
      setVisibleContents(calculateVisibleContents(width, height))
    }

    updateSize()

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        setContainerSize({ width, height })
        setVisibleContents(calculateVisibleContents(width, height))
      }
    })

    resizeObserver.observe(el)
    return () => resizeObserver.disconnect()
  }, [calculateVisibleContents, containerRef])

  return {
    containerWidth: containerSize.width,
    containerHeight: containerSize.height,
    visibleContents,
    getMinSize,
    isContentVisible,
  }
}

export interface ContentVisibilityConfig {
  id: string
  label: string
  labelZh: string
  defaultEnabled: boolean
  minWidth: number
  minHeight?: number
  priority: number
}

export const DEFAULT_TASK_CONTENT_CONFIGS: ContentVisibilityConfig[] = [
  {
    id: 'remainingTime',
    label: 'Remaining Time',
    labelZh: '剩余时间',
    defaultEnabled: true,
    minWidth: 80,
    priority: 3,
  },
  {
    id: 'notes',
    label: 'Notes',
    labelZh: '备注',
    defaultEnabled: true,
    minWidth: 100,
    minHeight: 40,
    priority: 2,
  },
  {
    id: 'tag',
    label: 'Tag',
    labelZh: '标签',
    defaultEnabled: true,
    minWidth: 50,
    priority: 4,
  },
  {
    id: 'progress',
    label: 'Progress Bar',
    labelZh: '进度条',
    defaultEnabled: true,
    minWidth: 0,
    minHeight: 4,
    priority: 5,
  },
]
