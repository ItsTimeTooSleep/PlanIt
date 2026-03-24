'use client'

import { useMemo, useRef, useEffect, useState, useCallback } from 'react'
import { Progress } from '@/components/ui/progress'
import { useStore, useLanguage } from '@/lib/store'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import type { BaseWidgetProps } from '@/lib/widget-types'
import { CheckCircle2, Circle, Target, TrendingUp } from 'lucide-react'

type SizeMode = 'compact' | 'normal' | 'large' | 'wide'

interface ContainerSize {
  width: number
  height: number
}

/**
 * 使用动画数字的 hook
 * @param targetValue - 目标数值
 * @param duration - 动画持续时间（毫秒）
 * @returns 当前动画数值
 */
function useAnimatedNumber(targetValue: number, duration: number = 600): number {
  const [displayValue, setDisplayValue] = useState(0)
  const startValueRef = useRef(0)
  const startTimeRef = useRef<number | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  const animate = useCallback((timestamp: number) => {
    if (startTimeRef.current === null) {
      startTimeRef.current = timestamp
    }

    const elapsed = timestamp - startTimeRef.current
    const progress = Math.min(elapsed / duration, 1)
    
    // 使用 easeOutCubic 缓动函数
    const easeOutCubic = 1 - Math.pow(1 - progress, 3)
    
    const currentValue = Math.round(startValueRef.current + (targetValue - startValueRef.current) * easeOutCubic)
    setDisplayValue(currentValue)

    if (progress < 1) {
      animationFrameRef.current = requestAnimationFrame(animate)
    }
  }, [targetValue, duration])

  useEffect(() => {
    startValueRef.current = displayValue
    startTimeRef.current = null
    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [targetValue, animate])

  return displayValue
}

/**
 * 进度条组件
 * @param props - 组件属性
 * @param props.id - 组件实例ID
 * @param props.config - 组件配置
 * @param props.className - 自定义样式类
 * @returns 进度条组件
 */
export function ProgressWidget({ id, config, className }: BaseWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [sizeMode, setSizeMode] = useState<SizeMode>('normal')
  const [containerSize, setContainerSize] = useState<ContainerSize>({ width: 280, height: 100 })
  
  const lang = useLanguage()
  const { state } = useStore()

  const showPercentage = (config?.showPercentage as boolean) ?? true
  const showCount = (config?.showCount as boolean) ?? true
  const showIcon = (config?.showIcon as boolean) ?? true
  const progressHeight = (config?.progressHeight as number) ?? 8

  useEffect(() => {
    const updateSizeMode = () => {
      const el = containerRef.current
      if (!el) return
      const { width, height } = el.getBoundingClientRect()
      setContainerSize({ width, height })
      
      const isShort = height < 50
      
      if (height < 50) {
        setSizeMode('compact')
      } else if (width > 380) {
        setSizeMode('wide')
      } else if (height > 120) {
        setSizeMode('large')
      } else {
        setSizeMode('normal')
      }
    }

    updateSizeMode()
    window.addEventListener('resize', updateSizeMode)
    return () => window.removeEventListener('resize', updateSizeMode)
  }, [])

  const today = format(new Date(), 'yyyy-MM-dd')
  const todayTasks = state.tasks.filter(t => t.date === today)
  const completedCount = todayTasks.filter(t => t.status === 'completed').length
  const totalCount = todayTasks.length
  const pendingCount = totalCount - completedCount

  const targetProgress = useMemo(() => {
    if (totalCount === 0) return 0
    return Math.round((completedCount / totalCount) * 100)
  }, [completedCount, totalCount])

  const animatedProgress = useAnimatedNumber(targetProgress, 600)

  const titleFontSize = useMemo(() => {
    switch (sizeMode) {
      case 'compact': return 'text-xs'
      case 'large': return 'text-base'
      default: return 'text-sm'
    }
  }, [sizeMode])

  const percentageFontSize = useMemo(() => {
    switch (sizeMode) {
      case 'compact': return 'text-lg'
      case 'large': return 'text-3xl'
      default: return 'text-2xl'
    }
  }, [sizeMode])

  const countFontSize = useMemo(() => {
    switch (sizeMode) {
      case 'compact': return 'text-[10px]'
      case 'large': return 'text-sm'
      default: return 'text-xs'
    }
  }, [sizeMode])

  const isVertical = sizeMode === 'large'
  const showDetailedStats = containerSize.height >= 100

  return (
    <div 
      ref={containerRef} 
      className={cn(
        'flex flex-col h-full bg-card rounded-xl border border-border overflow-hidden',
        sizeMode === 'compact' ? 'p-2' : 'p-4',
        className
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {showIcon && (
            <Target className={cn('text-primary', sizeMode === 'compact' ? 'w-3 h-3' : 'w-4 h-4')} />
          )}
          <span className={cn('font-medium', titleFontSize)}>
            {lang === 'zh' ? '今日进度' : 'Today\'s Progress'}
          </span>
        </div>
        {showCount && (
          <span className={cn('text-muted-foreground', countFontSize)}>
            {completedCount}/{totalCount}
          </span>
        )}
      </div>

      <Progress
        value={animatedProgress}
        className={cn(
          'transition-all',
          sizeMode === 'compact' ? 'h-1.5' : sizeMode === 'large' ? 'h-4' : 'h-2'
        )}
      />

      <div className={cn(
        'flex items-center mt-2',
        isVertical ? 'flex-col items-start gap-2' : 'justify-between'
      )}>
        {showPercentage && (
          <span className={cn('font-bold text-primary', percentageFontSize)}>
            {animatedProgress}%
          </span>
        )}
        <span className={cn('text-muted-foreground', countFontSize)}>
          {lang === 'zh' ? '已完成' : 'completed'}
        </span>
      </div>

      {showDetailedStats && totalCount > 0 && (
        <div className={cn(
          'flex gap-4 mt-3 pt-3 border-t border-border/50',
          sizeMode === 'compact' ? 'gap-2 mt-2 pt-2' : ''
        )}>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className={cn('text-green-500', sizeMode === 'compact' ? 'w-3 h-3' : 'w-4 h-4')} />
            <span className={countFontSize}>
              {lang === 'zh' ? `完成 ${completedCount}` : `${completedCount} done`}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Circle className={cn('text-muted-foreground', sizeMode === 'compact' ? 'w-3 h-3' : 'w-4 h-4')} />
            <span className={countFontSize}>
              {lang === 'zh' ? `待办 ${pendingCount}` : `${pendingCount} pending`}
            </span>
          </div>
        </div>
      )}

      {totalCount === 0 && (
        <p className={cn('text-muted-foreground text-center mt-2', countFontSize)}>
          {lang === 'zh' ? '暂无任务' : 'No tasks today'}
        </p>
      )}
    </div>
  )
}
