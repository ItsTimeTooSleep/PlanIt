'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { Settings, CalendarClock, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { BaseWidgetProps, CountdownConfig } from '@/lib/widget-types'
import { useStore } from '@/lib/store'

type SizeMode = 'compact' | 'normal' | 'large'

interface ContainerSize {
  width: number
  height: number
}

/**
 * 目标日期组件
 * @param props - 组件属性
 * @param props.id - 组件实例ID
 * @param props.config - 组件配置
 * @param props.onConfigChange - 配置变更回调
 * @param props.className - 自定义样式类
 * @returns 目标日期组件
 */
export function CountdownWidget({ id, config, onConfigChange, className }: BaseWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [sizeMode, setSizeMode] = useState<SizeMode>('normal')
  const [containerSize, setContainerSize] = useState<ContainerSize>({ width: 200, height: 120 })
  const { state } = useStore()
  
  const firstLaunchDate = state.settings.firstLaunchDate ?? new Date().toISOString().split('T')[0]
  const isJourneyMode = (config?.isJourneyMode as boolean) ?? true
  const targetDate = isJourneyMode 
    ? firstLaunchDate 
    : ((config?.targetDate as string) ?? new Date().toISOString().split('T')[0])
  const name = isJourneyMode 
    ? '旅程' 
    : ((config?.name as string) ?? '目标日期')
  const showIcon = (config?.showIcon as boolean) ?? true

  useEffect(() => {
    const updateSizeMode = () => {
      const el = containerRef.current
      if (!el) return
      const { width, height } = el.getBoundingClientRect()
      setContainerSize({ width, height })
      
      if (width < 150 || height < 80) {
        setSizeMode('compact')
      } else if (width > 300 && height > 150) {
        setSizeMode('large')
      } else {
        setSizeMode('normal')
      }
    }

    updateSizeMode()
    window.addEventListener('resize', updateSizeMode)
    return () => window.removeEventListener('resize', updateSizeMode)
  }, [])

  const handleConfigChange = useCallback(
    (key: keyof CountdownConfig, value: string | number | boolean) => {
      onConfigChange?.({ [key]: value })
    },
    [onConfigChange]
  )

  const countdownInfo = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const target = new Date(targetDate)
    target.setHours(0, 0, 0, 0)
    
    const diffTime = target.getTime() - today.getTime()
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))
    
    const isPast = diffDays < 0
    const absDays = Math.abs(diffDays)
    
    return {
      days: absDays,
      isPast,
      diffDays,
    }
  }, [targetDate])

  const formatDays = useCallback((days: number): string => {
    if (days >= 365) {
      const years = Math.floor(days / 365)
      const remainingDays = days % 365
      if (remainingDays === 0) {
        return `${years}年`
      }
      return `${years}年${remainingDays}天`
    }
    return `${days}天`
  }, [])

  const iconSize = useMemo(() => {
    switch (sizeMode) {
      case 'compact': return 'w-8 h-8'
      default: return 'w-10 h-10'
    }
  }, [sizeMode])

  const iconInnerSize = useMemo(() => {
    switch (sizeMode) {
      case 'compact': return 'w-4 h-4'
      default: return 'w-5 h-5'
    }
  }, [sizeMode])

  const labelFontSize = useMemo(() => {
    switch (sizeMode) {
      case 'compact': return 'text-xs'
      default: return 'text-sm'
    }
  }, [sizeMode])

  const daysFontSize = useMemo(() => {
    switch (sizeMode) {
      case 'compact': return 'text-xl'
      case 'large': return 'text-4xl'
      default: return 'text-3xl'
    }
  }, [sizeMode])

  const showIconDisplay = showIcon && containerSize.height >= 100

  return (
    <div ref={containerRef} className={cn('relative w-full h-full flex flex-col items-center justify-center bg-card overflow-hidden', 
      sizeMode === 'compact' ? 'p-2' : 'p-4',
      className
    )}>
      <div className="text-center space-y-1">
        {showIconDisplay && (
          <div className="flex justify-center mb-2">
            <div className={cn(
              'rounded-full flex items-center justify-center',
              iconSize,
              countdownInfo.isPast ? 'bg-muted' : 'bg-primary/10'
            )}>
              <CalendarClock className={cn(
                iconInnerSize,
                countdownInfo.isPast ? 'text-muted-foreground' : 'text-primary'
              )} />
            </div>
          </div>
        )}
        
        <div className={cn('text-muted-foreground', labelFontSize)}>
          {isJourneyMode ? (
            <>开启{name}已经</>
          ) : countdownInfo.isPast ? (
            <>距离{name}已经过了</>
          ) : countdownInfo.diffDays === 0 ? (
            <>今天是{name}</>
          ) : (
            <>距离{name}还有</>
          )}
        </div>
        
        <div className={cn(
          'font-bold',
          daysFontSize,
          countdownInfo.isPast || isJourneyMode ? 'text-primary' : 'text-primary'
        )}>
          {countdownInfo.diffDays === 0 && !isJourneyMode ? (
            '今天'
          ) : (
            <>
              {formatDays(countdownInfo.days)}
              {(countdownInfo.isPast || isJourneyMode) && '了'}
            </>
          )}
        </div>
      </div>

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity',
              isOpen && 'opacity-100'
            )}
          >
            <Settings className="w-3.5 h-3.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64" align="end">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-xs">旅程模式</Label>
              <Button
                variant={isJourneyMode ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs"
                onClick={() => handleConfigChange('isJourneyMode', !isJourneyMode)}
              >
                {isJourneyMode ? '开启' : '关闭'}
              </Button>
            </div>

            {!isJourneyMode && (
              <>
                <div className="space-y-2">
                  <Label className="text-xs">目标名称</Label>
                  <Input
                    value={name}
                    onChange={(e) => handleConfigChange('name', e.target.value)}
                    placeholder="例如：生日、考试..."
                    className="h-8 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">目标日期</Label>
                  <Input
                    type="date"
                    value={targetDate}
                    onChange={(e) => handleConfigChange('targetDate', e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              </>
            )}

            <div className="flex items-center justify-between">
              <Label className="text-xs">显示图标</Label>
              <Button
                variant={showIcon ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs"
                onClick={() => handleConfigChange('showIcon', !showIcon)}
              >
                {showIcon ? '显示' : '隐藏'}
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
