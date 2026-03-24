'use client'

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { Delete, History, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { BaseWidgetProps } from '@/lib/widget-types'

type Operator = '+' | '-' | '×' | '÷' | null

interface CalculatorState {
  display: string
  previousValue: number | null
  operator: Operator
  waitingForOperand: boolean
}

interface HistoryItem {
  expression: string
  result: string
}

const initialState: CalculatorState = {
  display: '0',
  previousValue: null,
  operator: null,
  waitingForOperand: false,
}

type SizeMode = 'compact' | 'normal' | 'large' | 'xlarge'

interface ContainerSize {
  width: number
  height: number
}

/**
 * 计算器组件
 * @param props - 组件属性
 * @param props.id - 组件实例ID
 * @param props.config - 组件配置
 * @param props.className - 自定义样式类
 * @returns 计算器组件
 */
export function CalculatorWidget({ id, config, className }: BaseWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [sizeMode, setSizeMode] = useState<SizeMode>('normal')
  const [containerSize, setContainerSize] = useState<ContainerSize>({ width: 280, height: 350 })
  const [state, setState] = useState<CalculatorState>(initialState)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [showHistory, setShowHistory] = useState(false)

  const showHistoryPanel = (config?.showHistory as boolean) ?? true
  const maxHistoryItems = (config?.maxHistoryItems as number) ?? 10

  useEffect(() => {
    const updateSizeMode = () => {
      const el = containerRef.current
      if (!el) return
      const { width, height } = el.getBoundingClientRect()
      setContainerSize({ width, height })
      
      const isNarrow = width < 180
      const isShort = height < 240
      
      if (width < 180 || height < 240) {
        setSizeMode('compact')
      } else if (width > 380 && height > 480) {
        setSizeMode('xlarge')
      } else if (width > 320 && height > 400) {
        setSizeMode('large')
      } else {
        setSizeMode('normal')
      }
    }

    updateSizeMode()
    window.addEventListener('resize', updateSizeMode)
    return () => window.removeEventListener('resize', updateSizeMode)
  }, [])

  const addToHistory = useCallback((expression: string, result: string) => {
    setHistory(prev => {
      const newHistory = [{ expression, result }, ...prev].slice(0, maxHistoryItems)
      return newHistory
    })
  }, [maxHistoryItems])

  const inputDigit = useCallback((digit: string) => {
    setState((prev) => {
      if (prev.waitingForOperand) {
        return { ...prev, display: digit, waitingForOperand: false }
      }
      return { ...prev, display: prev.display === '0' ? digit : prev.display + digit }
    })
  }, [])

  const inputDecimal = useCallback(() => {
    setState((prev) => {
      if (prev.waitingForOperand) {
        return { ...prev, display: '0.', waitingForOperand: false }
      }
      if (prev.display.includes('.')) {
        return prev
      }
      return { ...prev, display: prev.display + '.' }
    })
  }, [])

  const clear = useCallback(() => {
    setState(initialState)
  }, [])

  const backspace = useCallback(() => {
    setState((prev) => {
      if (prev.display.length === 1 || (prev.display.length === 2 && prev.display[0] === '-')) {
        return { ...prev, display: '0' }
      }
      return { ...prev, display: prev.display.slice(0, -1) }
    })
  }, [])

  const performOperation = useCallback((nextOperator: Operator) => {
    setState((prev) => {
      const inputValue = parseFloat(prev.display)

      if (prev.previousValue === null) {
        return {
          ...prev,
          previousValue: inputValue,
          operator: nextOperator,
          waitingForOperand: true,
        }
      }

      if (prev.operator) {
        let result = 0
        switch (prev.operator) {
          case '+':
            result = prev.previousValue + inputValue
            break
          case '-':
            result = prev.previousValue - inputValue
            break
          case '×':
            result = prev.previousValue * inputValue
            break
          case '÷':
            result = inputValue !== 0 ? prev.previousValue / inputValue : 0
            break
        }

        const displayValue = String(parseFloat(result.toFixed(10)))

        if (nextOperator === null) {
          const expression = `${prev.previousValue} ${prev.operator} ${inputValue}`
          addToHistory(expression, displayValue)
          return {
            display: displayValue,
            previousValue: null,
            operator: null,
            waitingForOperand: true,
          }
        }

        return {
          display: displayValue,
          previousValue: parseFloat(displayValue),
          operator: nextOperator,
          waitingForOperand: true,
        }
      }

      return prev
    })
  }, [addToHistory])

  const calculate = useCallback(() => {
    performOperation(null)
  }, [performOperation])

  const handleOperator = useCallback((op: Operator) => {
    performOperation(op)
  }, [performOperation])

  const toggleSign = useCallback(() => {
    setState((prev) => ({
      ...prev,
      display: String(-parseFloat(prev.display)),
    }))
  }, [])

  const percentage = useCallback(() => {
    setState((prev) => ({
      ...prev,
      display: String(parseFloat(prev.display) / 100),
    }))
  }, [])

  const clearHistory = useCallback(() => {
    setHistory([])
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        inputDigit(e.key)
      } else if (e.key === '.') {
        inputDecimal()
      } else if (e.key === '+') {
        handleOperator('+')
      } else if (e.key === '-') {
        handleOperator('-')
      } else if (e.key === '*') {
        handleOperator('×')
      } else if (e.key === '/') {
        e.preventDefault()
        handleOperator('÷')
      } else if (e.key === 'Enter' || e.key === '=') {
        calculate()
      } else if (e.key === 'Escape' || e.key === 'c' || e.key === 'C') {
        clear()
      } else if (e.key === 'Backspace') {
        backspace()
      } else if (e.key === '%') {
        percentage()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [inputDigit, inputDecimal, handleOperator, calculate, clear, backspace, percentage])

  const displayFontSize = useMemo(() => {
    switch (sizeMode) {
      case 'compact': return 'text-xl'
      case 'large': return 'text-4xl'
      case 'xlarge': return 'text-5xl'
      default: return 'text-3xl'
    }
  }, [sizeMode])

  const buttonHeight = useMemo(() => {
    const headerHeight = 36
    const displayHeight = sizeMode === 'compact' ? 60 : sizeMode === 'xlarge' ? 100 : 80
    const padding = 16
    const gap = sizeMode === 'compact' ? 2 : 4
    
    const availableHeight = containerSize.height - headerHeight - displayHeight - padding
    const buttonRows = 5
    const totalGap = gap * (buttonRows - 1)
    const calculatedButtonHeight = (availableHeight - totalGap) / buttonRows
    
    const baseHeight = (() => {
      switch (sizeMode) {
        case 'compact': return 32
        case 'large': return 56
        case 'xlarge': return 64
        default: return 48
      }
    })()
    
    return Math.max(28, Math.min(baseHeight, calculatedButtonHeight))
  }, [sizeMode, containerSize])

  const buttonFontSize = useMemo(() => {
    if (containerSize.width < 160 || containerSize.height < 220) return 'text-xs'
    switch (sizeMode) {
      case 'compact': return 'text-sm'
      case 'large': return 'text-xl'
      case 'xlarge': return 'text-2xl'
      default: return 'text-lg'
    }
  }, [sizeMode, containerSize])

  const buttons = useMemo(() => [
    { label: 'C', action: clear, className: 'text-destructive' },
    { label: '±', action: toggleSign, className: '' },
    { label: '%', action: percentage, className: '' },
    { label: '÷', action: () => handleOperator('÷'), className: 'bg-primary/10 text-primary' },
    { label: '7', action: () => inputDigit('7'), className: '' },
    { label: '8', action: () => inputDigit('8'), className: '' },
    { label: '9', action: () => inputDigit('9'), className: '' },
    { label: '×', action: () => handleOperator('×'), className: 'bg-primary/10 text-primary' },
    { label: '4', action: () => inputDigit('4'), className: '' },
    { label: '5', action: () => inputDigit('5'), className: '' },
    { label: '6', action: () => inputDigit('6'), className: '' },
    { label: '-', action: () => handleOperator('-'), className: 'bg-primary/10 text-primary' },
    { label: '1', action: () => inputDigit('1'), className: '' },
    { label: '2', action: () => inputDigit('2'), className: '' },
    { label: '3', action: () => inputDigit('3'), className: '' },
    { label: '+', action: () => handleOperator('+'), className: 'bg-primary/10 text-primary' },
    { label: '⌫', action: backspace, className: '', icon: Delete },
    { label: '0', action: () => inputDigit('0'), className: '' },
    { label: '.', action: inputDecimal, className: '' },
    { label: '=', action: calculate, className: 'bg-primary text-primary-foreground' },
  ], [clear, toggleSign, percentage, handleOperator, inputDigit, backspace, calculate])

  const displayHistory = showHistoryPanel && history.length > 0 && sizeMode !== 'compact'

  return (
    <div ref={containerRef} className={cn('flex flex-col h-full bg-card rounded-xl border border-border overflow-hidden', className)}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
        <span className={cn('font-medium', sizeMode === 'compact' ? 'text-xs' : 'text-sm')}>计算器</span>
        {displayHistory && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6" 
            onClick={() => setShowHistory(!showHistory)}
          >
            <History className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      {showHistory && displayHistory && (
        <div className="border-b border-border bg-muted/20 max-h-24 overflow-y-auto">
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/50">
            <span className="text-xs text-muted-foreground">历史记录</span>
            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={clearHistory}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
          <div className="p-2 space-y-1">
            {history.map((item, index) => (
              <div key={index} className="text-xs flex justify-between px-2 py-1 rounded bg-muted/50">
                <span className="text-muted-foreground">{item.expression}</span>
                <span className="font-medium">= {item.result}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={cn(
        'flex flex-col items-end justify-end p-4 bg-muted/30',
        sizeMode === 'compact' ? 'min-h-[60px]' : sizeMode === 'xlarge' ? 'min-h-[100px]' : 'min-h-[80px]'
      )}>
        <div className={cn('text-muted-foreground h-4', sizeMode === 'compact' ? 'text-[10px]' : 'text-xs')}>
          {state.previousValue !== null && state.operator && (
            <span>
              {state.previousValue} {state.operator}
            </span>
          )}
        </div>
        <div className={cn(
          'font-mono font-semibold tracking-tight text-right w-full overflow-hidden text-ellipsis',
          displayFontSize
        )}>
          {state.display}
        </div>
      </div>

      <div className={cn(
        'grid grid-cols-4 gap-1 p-2 flex-1',
        sizeMode === 'compact' ? 'gap-0.5 p-1' : ''
      )}>
        {buttons.map((btn, index) => (
          <Button
            key={index}
            variant="ghost"
            size="icon"
            className={cn(
              'w-full font-medium rounded-lg transition-all active:scale-95',
              buttonFontSize,
              btn.className
            )}
            style={{ height: buttonHeight }}
            onClick={btn.action}
          >
            {btn.icon ? <btn.icon className={sizeMode === 'xlarge' ? 'w-6 h-6' : 'w-5 h-5'} /> : btn.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
