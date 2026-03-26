'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown, Check } from 'lucide-react'
import * as SelectPrimitive from '@radix-ui/react-select'

/**
 * 分段控制器组件属性
 * @template T - 选项值的类型
 * @property options - 选项数组，包含 value 和 label
 * @property value - 当前选中的值
 * @property onChange - 值变化时的回调函数
 * @property size - 控制器尺寸，可选 'sm' | 'md'
 * @property className - 自定义类名
 */
interface SegmentedControlProps<T extends string | number> {
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
  size?: 'sm' | 'md'
  className?: string
}

/**
 * 分段控制器组件
 * 用于在多个选项中进行单选，提供统一的视觉风格
 * @template T - 选项值的类型
 */
export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  size = 'sm',
  className,
}: SegmentedControlProps<T>) {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
  }

  return (
    <div className={cn('flex gap-1.5', className)}>
      {options.map((option) => (
        <button
          key={String(option.value)}
          onClick={() => onChange(option.value)}
          className={cn(
            'rounded-md transition-all duration-200 font-medium',
            sizeClasses[size],
            value === option.value
              ? 'bg-foreground text-background shadow-sm'
              : 'bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

/**
 * 下拉选择器组件属性
 * @template T - 选项值的类型
 * @property options - 选项数组，包含 value 和 label
 * @property value - 当前选中的值
 * @property onChange - 值变化时的回调函数
 * @property placeholder - 占位文本
 * @property className - 自定义类名
 * @property width - 选择器宽度
 */
interface SelectControlProps<T extends string | number> {
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
  placeholder?: string
  className?: string
  width?: string | number
}

/**
 * 下拉选择器组件
 * 使用 Radix UI Select 实现美观的下拉选择器
 * @template T - 选项值的类型
 */
export function SelectControl<T extends string | number>({
  options,
  value,
  onChange,
  placeholder,
  className,
  width,
}: SelectControlProps<T>) {
  const selectedOption = options.find(opt => opt.value === value)
  const stringValue = String(value)
  
  const handleValueChange = (v: string) => {
    const originalOption = options.find(opt => String(opt.value) === v)
    if (originalOption) {
      onChange(originalOption.value)
    }
  }

  return (
    <SelectPrimitive.Root
      value={stringValue}
      onValueChange={handleValueChange}
    >
      <SelectPrimitive.Trigger
        data-slot="select-trigger"
        style={{ width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined }}
        className={cn(
          'flex items-center justify-between gap-2 rounded-md',
          'bg-muted/60 hover:bg-muted text-sm font-medium text-foreground',
          'px-3 py-1.5 min-w-[100px]',
          'focus:outline-none focus:ring-2 focus:ring-primary/30',
          'transition-colors cursor-pointer',
          'data-[state=open]:ring-2 data-[state=open]:ring-primary/30',
          'ring-inset',
          className
        )}
      >
        <SelectPrimitive.Value>
          <span className="truncate text-left text-foreground">{selectedOption?.label || placeholder}</span>
        </SelectPrimitive.Value>
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="w-4 h-4 opacity-50 shrink-0 ml-1" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          data-slot="select-content"
          className={cn(
            'relative z-50 overflow-hidden rounded-lg',
            'bg-popover border border-border/50 shadow-lg',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2'
          )}
          position="popper"
          sideOffset={4}
        >
          <SelectPrimitive.Viewport
            className="p-1 w-[var(--radix-select-trigger-width)] min-w-[100px]"
          >
            {options.map((option) => (
              <SelectPrimitive.Item
                key={String(option.value)}
                value={String(option.value)}
                className={cn(
                  'relative flex items-center justify-between gap-2',
                  'px-3 py-2 rounded-md text-sm',
                  'cursor-pointer select-none',
                  'outline-none transition-colors',
                  'text-foreground',
                  'data-[highlighted]:bg-muted',
                  'data-[state=checked]:bg-muted/50 data-[state=checked]:text-foreground'
                )}
              >
                <SelectPrimitive.ItemText>
                  <span className="truncate">{option.label}</span>
                </SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator>
                  <Check className="w-4 h-4 text-primary shrink-0" />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}

/**
 * 数字输入组件属性
 * @property value - 当前值
 * @property onChange - 值变化时的回调函数
 * @property min - 最小值
 * @property max - 最大值
 * @property step - 步进值
 * @property unit - 单位文本
 * @property width - 输入框宽度
 * @property className - 自定义类名
 */
interface NumberInputProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  unit?: string
  width?: number
  className?: string
}

/**
 * 数字输入组件
 * 用于输入数字值，支持最小/最大值限制和单位显示
 */
export function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  width = 72,
  className,
}: NumberInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value)
    if (!isNaN(newValue)) {
      if (min !== undefined && newValue < min) return
      if (max !== undefined && newValue > max) return
      onChange(newValue)
    }
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value)
    if (isNaN(newValue)) {
      if (min !== undefined) onChange(min)
    } else if (min !== undefined && newValue < min) {
      onChange(min)
    } else if (max !== undefined && newValue > max) {
      onChange(max)
    }
  }

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <input
        type="number"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        min={min}
        max={max}
        step={step}
        style={{ width: `${width}px` }}
        className={cn(
          'px-2.5 py-1.5 rounded-md border-0 bg-muted/60 text-sm font-medium',
          'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-muted',
          'hover:bg-muted transition-colors text-right',
          'ring-inset',
          '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
        )}
      />
      {unit && <span className="text-xs text-muted-foreground font-medium">{unit}</span>}
    </div>
  )
}
