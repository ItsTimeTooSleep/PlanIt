'use client'

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { Search, X, Clock, Trash2, Mic, Image } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { BaseWidgetProps, SearchConfig, SearchEngine, SearchEngineConfig } from '@/lib/widget-types'
import { SEARCH_ENGINES } from '@/lib/widget-types'

type SizeMode = 'compact' | 'normal' | 'large' | 'wide'

interface ContainerSize {
  width: number
  height: number
}

/**
 * 搜索输入框组件
 * @param props - 组件属性
 * @param props.id - 组件实例ID
 * @param props.config - 组件配置
 * @param props.className - 自定义样式类
 * @returns 搜索输入框组件
 */
export function SearchWidget({ id, config, className }: BaseWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [sizeMode, setSizeMode] = useState<SizeMode>('normal')
  const [containerSize, setContainerSize] = useState<ContainerSize>({ width: 320, height: 100 })
  
  const searchConfig = config as Partial<SearchConfig>
  const [query, setQuery] = useState('')
  const [selectedEngine, setSelectedEngine] = useState<SearchEngine>(
    (searchConfig.defaultEngine as SearchEngine) || 'google'
  )
  const [searchHistory, setSearchHistory] = useState<string[]>(
    (searchConfig.searchHistory as string[]) || []
  )
  const [showHistory, setShowHistory] = useState(false)

  const showQuickButtons = (config?.showQuickButtons as boolean) ?? true
  const showHistoryPanel = (config?.showHistoryPanel as boolean) ?? true
  const maxHistoryItems = (config?.maxHistoryItems as number) ?? 10
  const placeholder = (config?.placeholder as string) || ''

  useEffect(() => {
    const updateSizeMode = () => {
      const el = containerRef.current
      if (!el) return
      const { width, height } = el.getBoundingClientRect()
      setContainerSize({ width, height })
      
      const isShort = height < 60
      
      if (height < 60) {
        setSizeMode('compact')
      } else if (width > 500) {
        setSizeMode('wide')
      } else if (height > 140) {
        setSizeMode('large')
      } else {
        setSizeMode('normal')
      }
    }

    updateSizeMode()
    window.addEventListener('resize', updateSizeMode)
    return () => window.removeEventListener('resize', updateSizeMode)
  }, [])

  const currentEngine = useMemo(() => {
    return SEARCH_ENGINES.find((e) => e.id === selectedEngine) || SEARCH_ENGINES[0]
  }, [selectedEngine])

  const handleSearch = useCallback(() => {
    if (!query.trim()) return

    const searchUrl = `${currentEngine.searchUrl}${encodeURIComponent(query.trim())}`
    
    setSearchHistory((prev) => {
      const newHistory = [query.trim(), ...prev.filter((h) => h !== query.trim())].slice(0, maxHistoryItems)
      return newHistory
    })

    window.open(searchUrl, '_blank')
  }, [query, currentEngine, maxHistoryItems])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSearch()
      }
    },
    [handleSearch]
  )

  const clearHistory = useCallback(() => {
    setSearchHistory([])
  }, [])

  const selectHistoryItem = useCallback((item: string) => {
    setQuery(item)
    setShowHistory(false)
  }, [])

  const inputHeight = useMemo(() => {
    switch (sizeMode) {
      case 'compact': return 'h-8'
      case 'large': return 'h-12'
      default: return 'h-9'
    }
  }, [sizeMode])

  const fontSize = useMemo(() => {
    switch (sizeMode) {
      case 'compact': return 'text-xs'
      case 'large': return 'text-base'
      default: return 'text-sm'
    }
  }, [sizeMode])

  const showSelect = sizeMode !== 'compact' && containerSize.width >= 280
  const showEngineButtons = showQuickButtons && sizeMode !== 'compact' && containerSize.height >= 80
  const displayEngineCount = containerSize.width >= 450 ? 6 : containerSize.width >= 350 ? 5 : 4

  return (
    <div ref={containerRef} className={cn('flex flex-col h-full bg-card rounded-xl border border-border overflow-hidden', className)}>
      <div className={cn(
        'flex items-center gap-2',
        sizeMode === 'compact' ? 'p-2' : sizeMode === 'large' ? 'p-4' : 'p-3'
      )}>
        {showSelect && (
          <Select value={selectedEngine} onValueChange={(v) => setSelectedEngine(v as SearchEngine)}>
            <SelectTrigger className={cn('w-auto min-w-[80px]', inputHeight, fontSize)}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SEARCH_ENGINES.map((engine) => (
                <SelectItem key={engine.id} value={engine.id} className="text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-muted flex items-center justify-center text-[10px] font-bold">
                      {engine.icon}
                    </span>
                    {engine.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <div className="flex-1 relative">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => showHistoryPanel && setShowHistory(true)}
            onBlur={() => setTimeout(() => setShowHistory(false), 200)}
            placeholder={placeholder || `在 ${currentEngine.name} 搜索...`}
            className={cn('pr-16', inputHeight, fontSize)}
          />
          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {query && (
              <Button
                variant="ghost"
                size="icon"
                className={cn(sizeMode === 'compact' ? 'h-6 w-6' : 'h-7 w-7')}
                onClick={() => setQuery('')}
              >
                <X className={cn(sizeMode === 'compact' ? 'w-2.5 h-2.5' : 'w-3 h-3')} />
              </Button>
            )}
            <Button
              size="sm"
              className={cn(sizeMode === 'compact' ? 'h-6 px-2' : 'h-7 px-2')}
              onClick={handleSearch}
              disabled={!query.trim()}
            >
              <Search className={cn(sizeMode === 'compact' ? 'w-2.5 h-2.5' : 'w-3 h-3')} />
            </Button>
          </div>

          {showHistory && showHistoryPanel && searchHistory.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
                <span className={cn('text-muted-foreground flex items-center gap-1', fontSize)}>
                  <Clock className={cn(sizeMode === 'compact' ? 'w-2.5 h-2.5' : 'w-3 h-3')} />
                  搜索历史
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn('text-muted-foreground hover:text-destructive', fontSize)}
                  onClick={clearHistory}
                >
                  <Trash2 className={cn('mr-1', sizeMode === 'compact' ? 'w-2.5 h-2.5' : 'w-3 h-3')} />
                  清除
                </Button>
              </div>
              <div className="max-h-40 overflow-y-auto">
                {searchHistory.map((item, index) => (
                  <button
                    key={index}
                    className={cn('w-full text-left px-3 py-2 hover:bg-muted/50 transition-colors truncate', fontSize)}
                    onClick={() => selectHistoryItem(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showEngineButtons && (
        <div className={cn(
          'flex justify-center gap-1 px-3 pb-3',
          sizeMode === 'large' ? 'flex-wrap' : ''
        )}>
          {SEARCH_ENGINES.slice(0, displayEngineCount).map((engine) => (
            <Button
              key={engine.id}
              variant={selectedEngine === engine.id ? 'default' : 'outline'}
              size="sm"
              className={cn('text-xs px-2 h-7', selectedEngine === engine.id && 'shadow-sm')}
              onClick={() => setSelectedEngine(engine.id)}
            >
              <span className="rounded bg-muted/50 flex items-center justify-center font-bold mr-1 w-4 h-4 text-[9px]">
                {engine.icon}
              </span>
              {engine.name}
            </Button>
          ))}
        </div>
      )}

      {sizeMode === 'compact' && (
        <div className="flex justify-center gap-1 px-2 pb-2">
          {SEARCH_ENGINES.slice(0, 4).map((engine) => (
            <button
              key={engine.id}
              className={cn(
                'w-6 h-6 rounded flex items-center justify-center text-[9px] font-bold transition-colors',
                selectedEngine === engine.id 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted hover:bg-muted/80'
              )}
              onClick={() => setSelectedEngine(engine.id)}
            >
              {engine.icon}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
