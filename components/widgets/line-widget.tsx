'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Settings, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { BaseWidgetProps, LineConfig } from '@/lib/widget-types'

/**
 * 线条装饰组件
 * @param props - 组件属性
 * @param props.id - 组件实例ID
 * @param props.config - 组件配置
 * @param props.onConfigChange - 配置变更回调
 * @param props.className - 自定义样式类
 * @returns 线条装饰组件
 */
export function LineWidget({ id, config, onConfigChange, className }: BaseWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useState(false)

  const color = (config?.color as string) ?? '#888888'
  const thickness = (config?.thickness as number) ?? 2
  const opacity = (config?.opacity as number) ?? 100
  const style = (config?.style as 'solid' | 'dashed' | 'dotted') ?? 'solid'

  const handleConfigChange = useCallback(
    (key: keyof LineConfig, value: string | number) => {
      onConfigChange?.({ [key]: value })
    },
    [onConfigChange]
  )

  const getBorderStyle = useCallback(() => {
    switch (style) {
      case 'dashed':
        return 'dashed'
      case 'dotted':
        return 'dotted'
      default:
        return 'solid'
    }
  }, [style])

  return (
    <div ref={containerRef} className={cn('relative w-full h-full flex items-center justify-center group', className)}>
      <div
        className="w-full transition-all duration-200"
        style={{
          borderTopColor: color,
          borderTopWidth: thickness,
          borderTopStyle: getBorderStyle(),
          opacity: opacity / 100,
        }}
      />

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'absolute top-1/2 right-2 -translate-y-1/2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity',
              isOpen && 'opacity-100'
            )}
          >
            <Settings className="w-3.5 h-3.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64" align="end">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">颜色</Label>
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
              <Label className="text-xs">粗细: {thickness}px</Label>
              <Slider
                value={[thickness]}
                onValueChange={(v) => handleConfigChange('thickness', v[0])}
                min={1}
                max={10}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">透明度: {opacity}%</Label>
              <Slider
                value={[opacity]}
                onValueChange={(v) => handleConfigChange('opacity', v[0])}
                min={10}
                max={100}
                step={5}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">样式</Label>
              <div className="flex gap-1">
                {(['solid', 'dashed', 'dotted'] as const).map((s) => (
                  <Button
                    key={s}
                    variant={style === s ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1 text-xs h-7"
                    onClick={() => handleConfigChange('style', s)}
                  >
                    {s === 'solid' ? '实线' : s === 'dashed' ? '虚线' : '点线'}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
