'use client'

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { Play, Plus, Trash2, ChevronDown, ChevronUp, Settings2, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { BaseWidgetProps, SpinWheelConfig } from '@/lib/widget-types'

const WHEEL_COLORS = [
  'oklch(0.70 0.18 260)',
  'oklch(0.72 0.19 142)',
  'oklch(0.75 0.18 75)',
  'oklch(0.70 0.18 330)',
  'oklch(0.65 0.22 290)',
  'oklch(0.63 0.24 25)',
  'oklch(0.70 0.14 195)',
  'oklch(0.70 0.18 50)',
  'oklch(0.68 0.16 160)',
  'oklch(0.72 0.17 320)',
]

type SizeMode = 'compact' | 'normal' | 'large' | 'xlarge'

/**
 * 随机转盘组件
 * @param props - 组件属性
 * @param props.id - 组件实例ID
 * @param props.config - 组件配置
 * @param props.className - 自定义样式类
 * @returns 随机转盘组件
 */
export function SpinWheelWidget({ id, config, className }: BaseWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [sizeMode, setSizeMode] = useState<SizeMode>('normal')
  
  const wheelConfig = config as Partial<SpinWheelConfig>
  const [options, setOptions] = useState<string[]>(
    wheelConfig.options || ['选项1', '选项2', '选项3', '选项4']
  )
  const [newOption, setNewOption] = useState('')
  const [isSpinning, setIsSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [result, setResult] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [history, setHistory] = useState<string[]>([])
  const wheelRef = useRef<HTMLDivElement>(null)

  const spinDuration = (config?.spinDuration as number) ?? 4000
  const showHistory = (config?.showHistory as boolean) ?? true
  const maxHistoryItems = (config?.maxHistoryItems as number) ?? 5

  useEffect(() => {
    const updateSizeMode = () => {
      const el = containerRef.current
      if (!el) return
      const { width, height } = el.getBoundingClientRect()
      const minDimension = Math.min(width, height)
      
      if (minDimension < 250) {
        setSizeMode('compact')
      } else if (minDimension > 450) {
        setSizeMode('xlarge')
      } else if (minDimension > 350) {
        setSizeMode('large')
      } else {
        setSizeMode('normal')
      }
    }

    updateSizeMode()
    window.addEventListener('resize', updateSizeMode)
    return () => window.removeEventListener('resize', updateSizeMode)
  }, [])

  const segmentAngle = 360 / options.length

  const spin = useCallback(() => {
    if (isSpinning || options.length < 2) return

    setIsSpinning(true)
    setResult(null)

    const randomIndex = Math.floor(Math.random() * options.length)
    const baseRotation = 360 * 5
    const segmentCenter = randomIndex * segmentAngle + segmentAngle / 2
    const finalRotation = baseRotation + (360 - segmentCenter) + 90

    setRotation((prev) => prev + finalRotation)

    setTimeout(() => {
      setIsSpinning(false)
      const selectedOption = options[randomIndex]
      setResult(selectedOption)
      setHistory(prev => [selectedOption, ...prev].slice(0, maxHistoryItems))
    }, spinDuration)
  }, [isSpinning, options, segmentAngle, spinDuration, maxHistoryItems])

  const addOption = useCallback(() => {
    if (newOption.trim()) {
      setOptions((prev) => [...prev, newOption.trim()])
      setNewOption('')
    }
  }, [newOption])

  const removeOption = useCallback((index: number) => {
    setOptions((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const resetWheel = useCallback(() => {
    setRotation(0)
    setResult(null)
    setIsSpinning(false)
  }, [])

  const clearHistory = useCallback(() => {
    setHistory([])
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        addOption()
      }
    },
    [addOption]
  )

  const wheelStyle = useMemo(
    () => ({
      transform: `rotate(${rotation}deg)`,
      transition: isSpinning ? `transform ${spinDuration}ms cubic-bezier(0.17, 0.67, 0.12, 0.99)` : 'none',
    }),
    [rotation, isSpinning, spinDuration]
  )

  const wheelSize = useMemo(() => {
    switch (sizeMode) {
      case 'compact': return 100
      case 'large': return 180
      case 'xlarge': return 220
      default: return 140
    }
  }, [sizeMode])

  const fontSize = useMemo(() => {
    switch (sizeMode) {
      case 'compact': return 3
      case 'large': return 5
      case 'xlarge': return 6
      default: return 4
    }
  }, [sizeMode])

  const textRadius = useMemo(() => {
    switch (sizeMode) {
      case 'compact': return 28
      case 'large': return 32
      case 'xlarge': return 35
      default: return 28
    }
  }, [sizeMode])

  const showSettingsButton = sizeMode !== 'compact'
  const showResultPanel = sizeMode !== 'compact' || result !== null
  const showHistoryPanel = showHistory && history.length > 0 && sizeMode !== 'compact'

  return (
    <div ref={containerRef} className={cn('flex flex-col h-full bg-card rounded-xl border border-border overflow-hidden', className)}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
        <span className={cn('font-medium', sizeMode === 'compact' ? 'text-xs' : 'text-sm')}>随机转盘</span>
        <div className="flex items-center gap-1">
          {showSettingsButton && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowSettings(!showSettings)}>
              {showSettings ? <ChevronUp className="w-4 h-4" /> : <Settings2 className="w-4 h-4" />}
            </Button>
          )}
        </div>
      </div>

      {showSettings && showSettingsButton && (
        <div className="p-3 border-b border-border bg-muted/20 space-y-2">
          <div className="flex gap-2">
            <Input
              value={newOption}
              onChange={(e) => setNewOption(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="添加选项..."
              className="h-8 text-sm"
            />
            <Button size="sm" className="h-8" onClick={addOption} disabled={!newOption.trim()}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="max-h-24 overflow-y-auto space-y-1">
            {options.map((option, index) => (
              <div key={index} className="flex items-center justify-between px-2 py-1 rounded bg-muted/50 text-xs">
                <span className="truncate flex-1">{option}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 ml-2 text-muted-foreground hover:text-destructive"
                  onClick={() => removeOption(index)}
                  disabled={options.length <= 2}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center p-4 relative">
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10">
          <div className={cn(
            'w-0 h-0 border-l-transparent border-r-transparent border-t-primary',
            sizeMode === 'compact' ? 'border-l-[6px] border-r-[6px] border-t-[10px]' :
            sizeMode === 'xlarge' ? 'border-l-[14px] border-r-[14px] border-t-[20px]' :
            'border-l-[10px] border-r-[10px] border-t-[16px]'
          )} />
        </div>

        <div ref={wheelRef} className="relative" style={{ width: wheelSize, height: wheelSize, ...wheelStyle }}>
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {options.map((option, index) => {
              const startAngle = index * segmentAngle - 90
              const endAngle = startAngle + segmentAngle
              const startRad = (startAngle * Math.PI) / 180
              const endRad = (endAngle * Math.PI) / 180

              const x1 = 50 + 45 * Math.cos(startRad)
              const y1 = 50 + 45 * Math.sin(startRad)
              const x2 = 50 + 45 * Math.cos(endRad)
              const y2 = 50 + 45 * Math.sin(endRad)

              const largeArc = segmentAngle > 180 ? 1 : 0

              const pathD = `M 50 50 L ${x1} ${y1} A 45 45 0 ${largeArc} 1 ${x2} ${y2} Z`

              const textAngle = startAngle + segmentAngle / 2
              const textRad = (textAngle * Math.PI) / 180
              const textX = 50 + textRadius * Math.cos(textRad)
              const textY = 50 + textRadius * Math.sin(textRad)

              const maxTextLength = sizeMode === 'compact' ? 4 : sizeMode === 'xlarge' ? 10 : 6
              const displayText = option.length > maxTextLength 
                ? option.slice(0, maxTextLength - 1) + '…' 
                : option

              return (
                <g key={index}>
                  <path d={pathD} fill={WHEEL_COLORS[index % WHEEL_COLORS.length]} stroke="white" strokeWidth="0.5" />
                  <text
                    x={textX}
                    y={textY}
                    fill="white"
                    fontSize={fontSize}
                    fontWeight="500"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${textAngle + 90}, ${textX}, ${textY})`}
                    className="select-none pointer-events-none"
                  >
                    {displayText}
                  </text>
                </g>
              )
            })}
            <circle cx="50" cy="50" r="8" fill="white" stroke="oklch(0.55 0.02 240)" strokeWidth="1" />
          </svg>
        </div>

        <div className="flex items-center gap-2 mt-4">
          <Button
            size={sizeMode === 'compact' ? 'sm' : 'default'}
            onClick={spin}
            disabled={isSpinning || options.length < 2}
          >
            <Play className={cn('mr-2', sizeMode === 'compact' ? 'w-3 h-3' : 'w-4 h-4')} />
            {isSpinning ? '转动中...' : '开始'}
          </Button>
          {result && (
            <Button
              size={sizeMode === 'compact' ? 'sm' : 'default'}
              variant="outline"
              onClick={resetWheel}
            >
              <RotateCcw className={cn('mr-2', sizeMode === 'compact' ? 'w-3 h-3' : 'w-4 h-4')} />
              重置
            </Button>
          )}
        </div>

        {result && showResultPanel && (
          <div className={cn(
            'mt-3 px-4 py-2 bg-primary/10 rounded-lg text-center',
            sizeMode === 'compact' ? 'mt-2 px-3 py-1' : ''
          )}>
            <p className={cn('text-muted-foreground', sizeMode === 'compact' ? 'text-[10px]' : 'text-xs')}>结果</p>
            <p className={cn('font-semibold text-primary', sizeMode === 'compact' ? 'text-xs' : 'text-sm')}>
              {result}
            </p>
          </div>
        )}
      </div>

      {showHistoryPanel && (
        <div className="px-3 py-2 border-t border-border bg-muted/20">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">历史记录</span>
            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={clearHistory}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-1">
            {history.slice(0, maxHistoryItems).map((item, index) => (
              <span 
                key={index} 
                className={cn(
                  'text-xs px-2 py-0.5 rounded-full bg-muted',
                  index === 0 && 'bg-primary/20 text-primary font-medium'
                )}
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
