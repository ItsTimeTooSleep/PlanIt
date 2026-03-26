'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * 设置行组件属性
 * @property label - 设置项标签
 * @property description - 设置项描述（可选）
 * @property children - 右侧控件
 * @property indent - 是否缩进（用于子选项）
 * @property className - 自定义类名
 */
interface SettingRowProps {
  label: string
  description?: string
  children: React.ReactNode
  indent?: boolean
  className?: string
}

/**
 * 设置行组件
 * 提供统一的设置项布局，包含标签、描述和控件区域
 */
export function SettingRow({
  label,
  description,
  children,
  indent = false,
  className,
}: SettingRowProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 min-h-[36px]',
        indent && 'pl-2',
        className
      )}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-tight">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            {description}
          </p>
        )}
      </div>
      <div className="shrink-0 flex items-center">{children}</div>
    </div>
  )
}

/**
 * 设置分组组件属性
 * @property label - 分组标签（可选）
 * @property children - 分组内容
 * @property className - 自定义类名
 * @property bordered - 是否有上边框
 */
interface SettingGroupProps {
  label?: string
  children: React.ReactNode
  className?: string
  bordered?: boolean
}

/**
 * 设置分组组件
 * 用于将相关的设置项分组显示，可选带边框分隔
 */
export function SettingGroup({
  label,
  children,
  className,
  bordered = false,
}: SettingGroupProps) {
  return (
    <div
      className={cn(
        'space-y-4',
        bordered && 'pt-4 border-t border-border/50',
        className
      )}
    >
      {label && (
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {label}
        </p>
      )}
      {children}
    </div>
  )
}

/**
 * 设置子项分组组件属性
 * @property children - 子项内容
 * @property className - 自定义类名
 * @property show - 是否显示（用于动画控制）
 */
interface SettingSubGroupProps {
  children: React.ReactNode
  className?: string
  show?: boolean
}

/**
 * 设置子项分组组件
 * 用于嵌套的子设置项，带有左侧缩进和边框指示
 * 支持展开/收起动画
 */
export function SettingSubGroup({ children, className, show = true }: SettingSubGroupProps) {
  return (
    <div
      className={cn(
        'overflow-hidden transition-all duration-300 ease-out',
        show ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0'
      )}
    >
      <div
        className={cn(
          'space-y-3 pl-3 border-l-2 border-border/40',
          'transition-transform duration-300 ease-out',
          show ? 'translate-y-0' : '-translate-y-2',
          className
        )}
      >
        {children}
      </div>
    </div>
  )
}
