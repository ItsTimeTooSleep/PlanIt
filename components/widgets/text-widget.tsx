'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Settings, Type, AlignLeft, AlignCenter, AlignRight, Bold } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { BaseWidgetProps, TextConfig } from '@/lib/widget-types'

type FontWeight = 'normal' | 'medium' | 'semibold' | 'bold'
type TextAlign = 'left' | 'center' | 'right'

/**
 * 文本组件
 * @param props - 组件属性
 * @param props.id - 组件实例ID
 * @param props.config - 组件配置
 * @param props.onConfigChange - 配置变更回调
 * @param props.className - 自定义样式类
 * @returns 文本组件
 */
export function TextWidget({ id, config, onConfigChange, className }: BaseWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const content = (config?.content as string) ?? ''
  const fontSize = (config?.fontSize as number) ?? 16
  const fontWeight = (config?.fontWeight as FontWeight) ?? 'normal'
  const textAlign = (config?.textAlign as TextAlign) ?? 'left'
  const color = (config?.color as string) ?? '#333333'
  const backgroundColor = (config?.backgroundColor as string) ?? 'transparent'

  const handleConfigChange = useCallback(
    (key: keyof TextConfig, value: string | number) => {
      onConfigChange?.({ [key]: value })
    },
    [onConfigChange]
  )

  const handleContentChange = useCallback(
    (value: string) => {
      onConfigChange?.({ content: value })
    },
    [onConfigChange]
  )

  const getFontWeightClass = useCallback(() => {
    switch (fontWeight) {
      case 'medium':
        return 'font-medium'
      case 'semibold':
        return 'font-semibold'
      case 'bold':
        return 'font-bold'
      default:
        return 'font-normal'
    }
  }, [fontWeight])

  const getTextAlignClass = useCallback(() => {
    switch (textAlign) {
      case 'center':
        return 'text-center'
      case 'right':
        return 'text-right'
      default:
        return 'text-left'
    }
  }, [textAlign])

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true)
    setTimeout(() => {
      textareaRef.current?.focus()
    }, 0)
  }, [])

  const handleBlur = useCallback(() => {
    setIsEditing(false)
  }, [])

  return (
    <div
      ref={containerRef}
      className={cn('relative w-full h-full group bg-card', className)}
      style={{ backgroundColor: backgroundColor === 'transparent' ? undefined : backgroundColor }}
    >
      {isEditing ? (
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          onBlur={handleBlur}
          className={cn(
            'w-full h-full resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-2',
            getFontWeightClass(),
            getTextAlignClass()
          )}
          style={{
            fontSize: `${fontSize}px`,
            color: color,
            backgroundColor: 'transparent',
          }}
          placeholder="在此输入文本..."
        />
      ) : (
        <div
          className={cn(
            'w-full h-full p-2 cursor-text overflow-auto whitespace-pre-wrap break-words',
            getFontWeightClass(),
            getTextAlignClass()
          )}
          style={{
            fontSize: `${fontSize}px`,
            color: color,
          }}
          onDoubleClick={handleDoubleClick}
        >
          {content || (
            <span className="text-muted-foreground/50 italic">双击编辑文本...</span>
          )}
        </div>
      )}

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
        <PopoverContent className="w-72" align="end">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">字体大小: {fontSize}px</Label>
              <Slider
                value={[fontSize]}
                onValueChange={(v) => handleConfigChange('fontSize', v[0])}
                min={10}
                max={48}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">字体粗细</Label>
              <div className="flex gap-1">
                {(['normal', 'medium', 'semibold', 'bold'] as const).map((w) => (
                  <Button
                    key={w}
                    variant={fontWeight === w ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1 text-xs h-7"
                    onClick={() => handleConfigChange('fontWeight', w)}
                  >
                    {w === 'normal' ? '常规' : w === 'medium' ? '中等' : w === 'semibold' ? '半粗' : '粗体'}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">对齐方式</Label>
              <div className="flex gap-1">
                <Button
                  variant={textAlign === 'left' ? 'default' : 'outline'}
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleConfigChange('textAlign', 'left')}
                >
                  <AlignLeft className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant={textAlign === 'center' ? 'default' : 'outline'}
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleConfigChange('textAlign', 'center')}
                >
                  <AlignCenter className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant={textAlign === 'right' ? 'default' : 'outline'}
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleConfigChange('textAlign', 'right')}
                >
                  <AlignRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">文字颜色</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => handleConfigChange('color', e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border border-border"
                />
                <input
                  type="text"
                  value={color}
                  onChange={(e) => handleConfigChange('color', e.target.value)}
                  className="flex-1 px-2 py-1 text-xs border rounded bg-background"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">背景颜色</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={backgroundColor === 'transparent' ? '#ffffff' : backgroundColor}
                  onChange={(e) => handleConfigChange('backgroundColor', e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border border-border"
                />
                <Button
                  variant={backgroundColor === 'transparent' ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => handleConfigChange('backgroundColor', 'transparent')}
                >
                  透明
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
