'use client'

import { useRef, useEffect, useState, forwardRef, useImperativeHandle, useCallback, useMemo } from 'react'
import { Clock, Pause, Timer, MessageSquare, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAdaptiveLayout, DEFAULT_TASK_CONTENT_CONFIGS } from '@/hooks/use-adaptive-layout'

interface ContentMetrics {
  containerWidth: number
  containerHeight: number
  iconSize: number
  badgeWidth: number
  titleWidth: number
  timeWidth: number
  buttonWidth: number
  contentAreaWidth: number
  needsButtonWrap: boolean
  needsTitleTruncate: boolean
  titleMaxChars: number
  visibleContents: string[]
}

export interface LayoutTestWidgetRef {
  getLayoutInfo: () => ContentMetrics & {
    minWidth: number
    minHeight: number
  }
  getMinSize: () => { minWidth: number; minHeight: number }
}

export interface ContentVisibilityOption {
  id: string
  enabled: boolean
  required?: boolean
}

interface LayoutTestWidgetProps {
  className?: string
  contentOptions?: ContentVisibilityOption[]
  onContentOptionsChange?: (options: ContentVisibilityOption[]) => void
}

const PADDING = 12
const GAP = 12
const ICON_SIZE = 40
const BUTTON_WIDTH = 80
const BUTTON_HEIGHT = 32
const PROGRESS_HEIGHT = 4
const MIN_CONTENT_WIDTH = 100

function measureTextWidth(text: string, fontSize: number = 14): number {
  return text.length * fontSize * 0.6
}

/**
 * 布局测试组件
 * @param props - 组件属性
 * @param props.className - 自定义样式类
 * @param props.contentOptions - 内容可见性配置
 * @param props.onContentOptionsChange - 内容配置变更回调
 * @param ref - 组件引用
 * @returns 测试组件
 */
export const LayoutTestWidget = forwardRef<LayoutTestWidgetRef, LayoutTestWidgetProps>(
  function LayoutTestWidget({ className, contentOptions }, ref) {
    const containerRef = useRef<HTMLDivElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)
    const titleRef = useRef<HTMLHeadingElement>(null)
    const buttonRef = useRef<HTMLButtonElement>(null)
    const [metrics, setMetrics] = useState<ContentMetrics>({
      containerWidth: 300,
      containerHeight: 100,
      iconSize: ICON_SIZE,
      badgeWidth: 60,
      titleWidth: 200,
      timeWidth: 100,
      buttonWidth: BUTTON_WIDTH,
      contentAreaWidth: 200,
      needsButtonWrap: false,
      needsTitleTruncate: false,
      titleMaxChars: 50,
      visibleContents: [],
    })

    const [effectiveContentOptions, setEffectiveContentOptions] = useState<ContentVisibilityOption[]>([])

    useEffect(() => {
      if (contentOptions) {
        setEffectiveContentOptions(contentOptions)
      } else {
        setEffectiveContentOptions(
          DEFAULT_TASK_CONTENT_CONFIGS.map((c) => ({
            id: c.id,
            enabled: c.defaultEnabled,
            required: false,
          }))
        )
      }
    }, [contentOptions])

    const mockTask = {
      title: '这是一个很长的任务标题用于测试截断效果',
      status: 'focusing',
      tag: '工作',
      startTime: '14:00',
      endTime: '15:30',
      remaining: '1小时30分钟',
      notes: '这是一个任务备注，用于测试备注显示功能。当空间足够时会显示这段文字。',
    }

    const tagColor = '#3b82f6'

    const adaptiveConfig = useMemo(() => {
      const contents = effectiveContentOptions
        .filter((opt) => opt.enabled)
        .map((opt) => {
          const config = DEFAULT_TASK_CONTENT_CONFIGS.find((c) => c.id === opt.id)
          return {
            id: opt.id,
            minWidth: config?.minWidth || 0,
            minHeight: config?.minHeight,
            priority: config?.priority || 1,
            required: opt.required || false,
          }
        })

      return {
        contents,
        baseMinWidth: ICON_SIZE + GAP + MIN_CONTENT_WIDTH,
        baseMinHeight: BUTTON_HEIGHT + 60,
        gap: GAP,
      }
    }, [effectiveContentOptions])

    const adaptiveLayout = useAdaptiveLayout(adaptiveConfig, containerRef)

    useEffect(() => {
      const el = containerRef.current
      if (!el) return

      const calculateMetrics = (containerWidth: number, containerHeight: number): ContentMetrics => {
        const availableWidth = containerWidth - PADDING * 2
        const availableHeight = containerHeight - PADDING * 2 - PROGRESS_HEIGHT

        const iconSize = Math.min(ICON_SIZE, availableHeight * 0.6)
        const buttonWidth = BUTTON_WIDTH
        const buttonHeight = BUTTON_HEIGHT

        const badgeText = '正在专注'
        const badgeWidth = measureTextWidth(badgeText, 12) + 16
        const titleWidth = measureTextWidth(mockTask.title, 16)
        const timeText = `${mockTask.startTime} – ${mockTask.endTime}`
        const timeWidth = measureTextWidth(timeText, 14) + 20

        const contentAreaWidth = availableWidth - iconSize - GAP

        const inlineButtonWidth = buttonWidth + GAP
        const contentWithInlineButton = contentAreaWidth - inlineButtonWidth

        const needsButtonWrap = contentWithInlineButton < MIN_CONTENT_WIDTH

        const effectiveContentWidth = needsButtonWrap ? contentAreaWidth : contentWithInlineButton
        const needsTitleTruncate = titleWidth > effectiveContentWidth

        const titleMaxChars = Math.floor(effectiveContentWidth / 9.6)

        return {
          containerWidth,
          containerHeight,
          iconSize,
          badgeWidth,
          titleWidth,
          timeWidth,
          buttonWidth,
          contentAreaWidth,
          needsButtonWrap,
          needsTitleTruncate,
          titleMaxChars,
          visibleContents: Array.from(adaptiveLayout.visibleContents),
        }
      }

      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect
          setMetrics(calculateMetrics(width, height))
        }
      })

      const { width, height } = el.getBoundingClientRect()
      setMetrics(calculateMetrics(width, height))

      resizeObserver.observe(el)
      return () => resizeObserver.disconnect()
    }, [adaptiveLayout.visibleContents])

    const displayTitle = useCallback(() => {
      if (metrics.needsTitleTruncate && metrics.titleMaxChars > 3) {
        return mockTask.title.slice(0, metrics.titleMaxChars - 2) + '...'
      }
      return mockTask.title
    }, [metrics.needsTitleTruncate, metrics.titleMaxChars])

    const getMinSize = useCallback(() => {
      const adaptiveMinSize = adaptiveLayout.getMinSize()
      const minButtonHeight = metrics.needsButtonWrap ? BUTTON_HEIGHT + GAP : 0
      const progressHeight = effectiveContentOptions.find(o => o.id === 'progress' && o.required) ? PROGRESS_HEIGHT : 0
      
      const minWidth = adaptiveMinSize.minWidth + PADDING * 2
      const minHeight = adaptiveMinSize.minHeight + PADDING * 2 + progressHeight + minButtonHeight
      
      return { minWidth, minHeight }
    }, [adaptiveLayout, metrics.needsButtonWrap, effectiveContentOptions])

    useImperativeHandle(ref, () => ({
      getLayoutInfo: () => ({
        ...metrics,
        minWidth: getMinSize().minWidth,
        minHeight: getMinSize().minHeight,
      }),
      getMinSize,
    }))

    const isContentVisible = (id: string): boolean => {
      return adaptiveLayout.isContentVisible(id)
    }

    const showRemainingTime = isContentVisible('remainingTime')
    const showNotes = isContentVisible('notes')
    const showTag = isContentVisible('tag')
    const showProgress = isContentVisible('progress')

    return (
      <div
        ref={containerRef}
        className={cn('relative overflow-hidden flex flex-col h-full bg-card rounded-xl border border-border', className)}
      >
        <div
          className="absolute inset-0 opacity-5"
          style={{ background: `linear-gradient(90deg, ${tagColor} 0%, transparent 50%)` }}
        />

        <div
          ref={contentRef}
          className="relative flex flex-1 p-3"
          style={{ gap: GAP }}
        >
          <div
            className="flex-shrink-0 rounded-xl flex items-center justify-center"
            style={{
              width: metrics.iconSize,
              height: metrics.iconSize,
              backgroundColor: `${tagColor}20`,
            }}
          >
            <Timer
              className="flex-shrink-0"
              style={{ width: metrics.iconSize * 0.5, height: metrics.iconSize * 0.5, color: tagColor }}
            />
          </div>

          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-0.5">
              <span
                className="font-semibold rounded-full whitespace-nowrap bg-success text-success-foreground"
                style={{ fontSize: '12px', padding: '2px 8px' }}
              >
                正在专注
              </span>
              {showTag && !metrics.needsButtonWrap && (
                <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  {mockTask.tag}
                </span>
              )}
            </div>

            <h3
              ref={titleRef}
              className="font-semibold truncate"
              style={{ fontSize: '16px' }}
              title={mockTask.title}
            >
              {displayTitle()}
            </h3>

            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <Clock className="text-muted-foreground flex-shrink-0" style={{ width: 12, height: 12 }} />
              <span className="text-muted-foreground tabular-nums whitespace-nowrap" style={{ fontSize: '14px' }}>
                {mockTask.startTime} – {mockTask.endTime}
              </span>
              {showRemainingTime && (
                <span className="text-muted-foreground whitespace-nowrap" style={{ fontSize: '12px' }}>
                  (还剩 {mockTask.remaining})
                </span>
              )}
            </div>

            {showNotes && (
              <div className="mt-2 flex items-start gap-1.5 text-muted-foreground">
                <MessageSquare className="w-3 h-3 flex-shrink-0 mt-0.5" />
                <p className="text-xs line-clamp-2 flex-1">{mockTask.notes}</p>
              </div>
            )}
          </div>

          {!metrics.needsButtonWrap && (
            <div className="flex items-center flex-shrink-0">
              <Button
                ref={buttonRef}
                className="bg-success hover:bg-success/90"
                style={{ height: BUTTON_HEIGHT, fontSize: '14px' }}
              >
                <Pause className="mr-1" style={{ width: 16, height: 16 }} />
                暂停
              </Button>
            </div>
          )}
        </div>

        {metrics.needsButtonWrap && (
          <div className="px-3 pb-3">
            <Button
              className="w-full bg-success hover:bg-success/90"
              style={{ height: BUTTON_HEIGHT, fontSize: '14px' }}
            >
              <Pause className="mr-1" style={{ width: 16, height: 16 }} />
              暂停
            </Button>
          </div>
        )}

        {showProgress && (
          <div className="bg-muted" style={{ height: PROGRESS_HEIGHT }}>
            <div
              className="h-full transition-all duration-1000"
              style={{ width: '50%', backgroundColor: tagColor }}
            />
          </div>
        )}
      </div>
    )
  }
)

export { DEFAULT_TASK_CONTENT_CONFIGS }
