'use client'

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { RefreshCw, Quote, ChevronLeft, ChevronRight, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { BaseWidgetProps, QuoteConfig, QuoteCategory } from '@/lib/widget-types'
import { QUOTES } from '@/lib/widget-types'
import { toast } from 'sonner'

const CATEGORY_LABELS: Record<QuoteCategory, { zh: string; en: string }> = {
  all: { zh: '全部', en: 'All' },
  motivational: { zh: '励志', en: 'Motivational' },
  philosophical: { zh: '哲理', en: 'Philosophical' },
  learning: { zh: '学习', en: 'Learning' },
  life: { zh: '生活', en: 'Life' },
}

type SizeMode = 'compact' | 'normal' | 'large' | 'wide'

interface ContainerSize {
  width: number
  height: number
}

/**
 * 名言组件
 * @param props - 组件属性
 * @param props.id - 组件实例ID
 * @param props.config - 组件配置
 * @param props.className - 自定义样式类
 * @returns 名言组件
 */
export function QuoteWidget({ id, config, className }: BaseWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [sizeMode, setSizeMode] = useState<SizeMode>('normal')
  const [containerSize, setContainerSize] = useState<ContainerSize>({ width: 300, height: 180 })
  
  const quoteConfig = config as Partial<QuoteConfig>
  const [category, setCategory] = useState<QuoteCategory>((quoteConfig.category as QuoteCategory) || 'all')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [copied, setCopied] = useState(false)

  const showCategory = (config?.showCategory as boolean) ?? true
  const showNavigation = (config?.showNavigation as boolean) ?? true
  const showCopyButton = (config?.showCopyButton as boolean) ?? true
  const autoRefresh = (config?.autoRefresh as boolean) ?? false
  const refreshInterval = (config?.refreshInterval as number) ?? 300

  useEffect(() => {
    const updateSizeMode = () => {
      const el = containerRef.current
      if (!el) return
      const { width, height } = el.getBoundingClientRect()
      setContainerSize({ width, height })
      
      if (height < 100) {
        setSizeMode('compact')
      } else if (width > 350) {
        setSizeMode('wide')
      } else if (height > 280) {
        setSizeMode('large')
      } else {
        setSizeMode('normal')
      }
    }

    updateSizeMode()
    window.addEventListener('resize', updateSizeMode)
    return () => window.removeEventListener('resize', updateSizeMode)
  }, [])

  const availableQuotes = useMemo(() => {
    return QUOTES[category] || QUOTES.all
  }, [category])

  const currentQuote = useMemo(() => {
    return availableQuotes[currentIndex] || { text: '', author: '' }
  }, [availableQuotes, currentIndex])

  const refreshQuote = useCallback(() => {
    setIsRefreshing(true)
    setTimeout(() => {
      const newIndex = Math.floor(Math.random() * availableQuotes.length)
      setCurrentIndex(newIndex)
      setIsRefreshing(false)
    }, 300)
  }, [availableQuotes.length])

  const prevQuote = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + availableQuotes.length) % availableQuotes.length)
  }, [availableQuotes.length])

  const nextQuote = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % availableQuotes.length)
  }, [availableQuotes.length])

  const copyQuote = useCallback(() => {
    const text = `"${currentQuote.text}" — ${currentQuote.author}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('已复制到剪贴板')
    setTimeout(() => setCopied(false), 2000)
  }, [currentQuote])

  useEffect(() => {
    setCurrentIndex(Math.floor(Math.random() * availableQuotes.length))
  }, [category, availableQuotes.length])

  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(refreshQuote, refreshInterval * 1000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval, refreshQuote])

  const textFontSize = useMemo(() => {
    switch (sizeMode) {
      case 'compact': return 'text-xs'
      case 'large': return 'text-lg'
      case 'wide': return 'text-base'
      default: return 'text-sm'
    }
  }, [sizeMode])

  const authorFontSize = useMemo(() => {
    switch (sizeMode) {
      case 'compact': return 'text-[10px]'
      case 'large': return 'text-base'
      default: return 'text-xs'
    }
  }, [sizeMode])

  const showHeader = (showCategory || sizeMode !== 'compact') && containerSize.height >= 80
  const showNavButtons = showNavigation && sizeMode !== 'compact' && containerSize.height >= 140
  const showCopy = showCopyButton && sizeMode !== 'compact' && containerSize.height >= 120

  return (
    <div ref={containerRef} className={cn('flex flex-col h-full bg-card rounded-xl border border-border overflow-hidden', className)}>
      {showHeader && (
        <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <Quote className={cn('text-primary', sizeMode === 'compact' ? 'w-3 h-3' : 'w-4 h-4')} />
            <span className={cn('font-medium', sizeMode === 'compact' ? 'text-xs' : 'text-sm')}>名言警句</span>
          </div>
          <div className="flex items-center gap-1">
            {showCategory && (
              <Select value={category} onValueChange={(v) => setCategory(v as QuoteCategory)}>
                <SelectTrigger className={cn('border-0 bg-transparent shadow-none px-1', sizeMode === 'compact' ? 'h-6 text-[10px]' : 'h-7 text-xs')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key} className="text-xs">
                      {label.zh}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button
              variant="ghost"
              size="icon"
              className={cn(sizeMode === 'compact' ? 'h-6 w-6' : 'h-7 w-7')}
              onClick={refreshQuote}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn(isRefreshing && 'animate-spin', sizeMode === 'compact' ? 'w-3 h-3' : 'w-4 h-4')} />
            </Button>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center p-4 text-center relative">
        <div
          className={cn(
            'transition-opacity duration-300',
            isRefreshing && 'opacity-0'
          )}
        >
          <p className={cn('leading-relaxed text-foreground mb-3 italic', textFontSize)}>
            "{currentQuote.text}"
          </p>
          <p className={cn('text-muted-foreground', authorFontSize)}>— {currentQuote.author}</p>
        </div>

        {showCopy && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute bottom-2 right-2 h-7 px-2 text-xs"
            onClick={copyQuote}
          >
            {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
            {copied ? '已复制' : '复制'}
          </Button>
        )}
      </div>

      <div className="px-3 py-2 border-t border-border bg-muted/20">
        <div className="flex items-center justify-between">
          {showNavButtons ? (
            <>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={prevQuote}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="flex justify-center gap-1">
                {availableQuotes.slice(0, 5).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={cn(
                      'w-1.5 h-1.5 rounded-full transition-all',
                      index === currentIndex
                        ? 'bg-primary w-3'
                        : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                    )}
                  />
                ))}
                {availableQuotes.length > 5 && (
                  <span className="text-[10px] text-muted-foreground ml-1">
                    +{availableQuotes.length - 5}
                  </span>
                )}
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={nextQuote}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <div className="flex justify-center gap-1 w-full">
              {availableQuotes.slice(0, 3).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={cn(
                    'w-1.5 h-1.5 rounded-full transition-all',
                    index === currentIndex
                      ? 'bg-primary w-2'
                      : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
