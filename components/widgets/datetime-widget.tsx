'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { format } from 'date-fns'
import { zhCN, enUS } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import type { BaseWidgetProps } from '@/lib/widget-types'

type SizeMode = 'compact' | 'normal' | 'large' | 'wide'

interface ContainerSize {
  width: number
  height: number
}

interface DateTimeWidgetProps extends BaseWidgetProps {
  showSeconds?: boolean
  showDate?: boolean
  showWeekday?: boolean
}

/**
 * 日期时间组件
 * @param props - 组件属性
 * @param props.id - 组件实例ID
 * @param props.config - 组件配置
 * @param props.showSeconds - 是否显示秒
 * @param props.showDate - 是否显示日期
 * @param props.showWeekday - 是否显示星期
 * @param props.className - 自定义样式类
 * @returns 日期时间组件
 */
export function DateTimeWidget({ 
  id, 
  config, 
  showSeconds = true, 
  showDate = true, 
  showWeekday = true,
  className 
}: DateTimeWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [sizeMode, setSizeMode] = useState<SizeMode>('normal')
  const [containerSize, setContainerSize] = useState<ContainerSize>({ width: 300, height: 80 })
  const [now, setNow] = useState(new Date())
  
  const lang = (config?.lang as 'zh' | 'en') || 'zh'
  const configShowSeconds = (config?.showSeconds as boolean) ?? showSeconds
  const configShowDate = (config?.showDate as boolean) ?? showDate
  const configShowWeekday = (config?.showWeekday as boolean) ?? showWeekday
  const showYear = (config?.showYear as boolean) ?? false
  const timeFormat = (config?.timeFormat as '12' | '24') ?? '24'

  useEffect(() => {
    const updateSizeMode = () => {
      const el = containerRef.current
      if (!el) return
      const { width, height } = el.getBoundingClientRect()
      setContainerSize({ width, height })
      
      if (height < 50) {
        setSizeMode('compact')
      } else if (width > 400) {
        setSizeMode('wide')
      } else if (height > 80) {
        setSizeMode('large')
      } else {
        setSizeMode('normal')
      }
    }

    updateSizeMode()
    window.addEventListener('resize', updateSizeMode)
    return () => window.removeEventListener('resize', updateSizeMode)
  }, [])

  useEffect(() => {
    const intervalId = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(intervalId)
  }, [])

  const locale = lang === 'zh' ? zhCN : enUS

  const weekdays = useMemo(() => ['日', '一', '二', '三', '四', '五', '六'], [])

  const dateDisplay = useMemo(() => {
    if (!configShowDate) return ''
    if (lang === 'zh') {
      const year = showYear ? `${format(now, 'yyyy年')} ` : ''
      const weekday = configShowWeekday ? ` 周${weekdays[now.getDay()]}` : ''
      return `${year}${format(now, 'M月d日')}${weekday}`
    }
    const year = showYear ? `${format(now, 'yyyy, ')} ` : ''
    return configShowWeekday 
      ? `${year}${format(now, 'MMM d, EEEE', { locale })}` 
      : `${year}${format(now, 'MMM d', { locale })}`
  }, [lang, now, configShowDate, configShowWeekday, showYear, weekdays, locale])

  const timeDisplay = useMemo(() => {
    if (timeFormat === '12') {
      const hours = now.getHours()
      const ampm = hours >= 12 ? 'PM' : 'AM'
      const hours12 = hours % 12 || 12
      const time = configShowSeconds 
        ? `${hours12.toString().padStart(2, '0')}:${format(now, 'mm:ss')}`
        : `${hours12.toString().padStart(2, '0')}:${format(now, 'mm')}`
      return `${time} ${ampm}`
    }
    return configShowSeconds ? format(now, 'HH:mm:ss') : format(now, 'HH:mm')
  }, [now, configShowSeconds, timeFormat])

  const timeFontSize = useMemo(() => {
    switch (sizeMode) {
      case 'compact': return 'text-xl'
      case 'large': return 'text-3xl'
      case 'wide': return 'text-2xl'
      default: return 'text-2xl'
    }
  }, [sizeMode])

  const dateFontSize = useMemo(() => {
    switch (sizeMode) {
      case 'compact': return 'text-xs'
      case 'large': return 'text-lg'
      case 'wide': return 'text-base'
      default: return 'text-base'
    }
  }, [sizeMode])

  const isVertical = containerSize.width < containerSize.height * 2

  return (
    <div 
      ref={containerRef} 
      className={cn(
        'bg-card rounded-xl border border-border shadow-sm',
        isVertical ? 'flex flex-col justify-center px-4 py-3' : 'flex items-center justify-between px-4 py-3',
        className
      )}
    >
      <div className={cn('flex flex-col justify-center', isVertical && 'mb-1')}>
        {configShowDate && (
          <p className={cn('font-medium text-foreground tracking-wide', dateFontSize)}>
            {dateDisplay}
          </p>
        )}
      </div>
      <div className={isVertical ? '' : 'text-right'}>
        <p className={cn('font-mono font-semibold text-primary tabular-nums leading-none', timeFontSize)}>
          {timeDisplay}
        </p>
      </div>
    </div>
  )
}
