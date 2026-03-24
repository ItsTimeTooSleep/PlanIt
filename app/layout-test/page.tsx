'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { LayoutTestWidget, LayoutTestWidgetRef, ContentVisibilityOption, DEFAULT_TASK_CONTENT_CONFIGS } from '@/components/widgets/layout-test-widget'
import { SmartResizable } from '@/components/ui/smart-resizable'
import { cn } from '@/lib/utils'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

export default function LayoutTestPage() {
  const resizableRef = useRef<LayoutTestWidgetRef>(null)
  const [layoutInfo, setLayoutInfo] = useState<ReturnType<LayoutTestWidgetRef['getLayoutInfo']>>()
  const [minSize, setMinSize] = useState({ minWidth: 0, minHeight: 0 })

  const [contentOptions, setContentOptions] = useState<ContentVisibilityOption[]>(
    DEFAULT_TASK_CONTENT_CONFIGS.map((c) => ({
      id: c.id,
      enabled: c.defaultEnabled,
      required: false,
    }))
  )

  const toggleContent = (id: string) => {
    setContentOptions((prev) =>
      prev.map((opt) => (opt.id === id ? { ...opt, enabled: !opt.enabled } : opt))
    )
  }

  const toggleRequired = (id: string) => {
    setContentOptions((prev) =>
      prev.map((opt) => (opt.id === id ? { ...opt, required: !opt.required } : opt))
    )
  }

  const getMinSize = useCallback(() => {
    if (resizableRef.current) {
      const size = resizableRef.current.getMinSize()
      setMinSize(size)
      return size
    }
    return { minWidth: 100, minHeight: 60 }
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      if (resizableRef.current) {
        setLayoutInfo(resizableRef.current.getLayoutInfo())
        setMinSize(resizableRef.current.getMinSize())
      }
    }, 50)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-background p-6">
      <h1 className="text-2xl font-bold mb-6">布局测试 - 自适应内容显示</h1>

      <div className="grid gap-8">
        <div className="p-4 border rounded-lg bg-muted/30">
          <h2 className="text-lg font-semibold mb-4">内容可见性配置</h2>
          <p className="text-sm text-muted-foreground mb-4">
            配置哪些内容是可选的，以及是否强制显示。当空间足够时，启用的可选内容会自动显示。
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {DEFAULT_TASK_CONTENT_CONFIGS.map((config) => {
              const option = contentOptions.find((o) => o.id === config.id)
              return (
                <div key={config.id} className="flex flex-col gap-2 p-3 border rounded-lg bg-background">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`toggle-${config.id}`} className="font-medium">
                      {config.labelZh}
                    </Label>
                    <Switch
                      id={`toggle-${config.id}`}
                      checked={option?.enabled ?? false}
                      onCheckedChange={() => toggleContent(config.id)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`required-${config.id}`}
                      checked={option?.required ?? false}
                      onCheckedChange={() => toggleRequired(config.id)}
                      disabled={!option?.enabled}
                    />
                    <Label
                      htmlFor={`required-${config.id}`}
                      className={cn(
                        'text-xs',
                        !option?.enabled && 'text-muted-foreground'
                      )}
                    >
                      强制显示
                    </Label>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    最小宽度: {config.minWidth}px | 优先级: {config.priority}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-3">拖拽调整大小测试</h2>
          <p className="text-sm text-muted-foreground mb-2">
            拖拽组件右下角调整大小，观察可选内容的显示/隐藏变化
          </p>
          <div className="flex gap-6 items-start flex-wrap">
            <SmartResizable
              initialWidth={400}
              initialHeight={200}
              getMinSize={getMinSize}
            >
              <LayoutTestWidget
                ref={resizableRef}
                className="!border-0"
                contentOptions={contentOptions}
              />
            </SmartResizable>
            <div className="text-xs text-muted-foreground space-y-3 min-w-[280px]">
              {layoutInfo && (
                <>
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">尺寸状态:</p>
                    <p>容器: {Math.round(layoutInfo.containerWidth)} × {Math.round(layoutInfo.containerHeight)}</p>
                    <p>内容区: {Math.round(layoutInfo.contentAreaWidth)}</p>
                    <p className="text-orange-600 font-medium">最小尺寸: {Math.round(minSize.minWidth)} × {Math.round(minSize.minHeight)}</p>
                  </div>

                  <div className="border-t pt-3 space-y-1">
                    <p className="font-medium text-foreground">布局状态:</p>
                    <p>按钮换行: {layoutInfo.needsButtonWrap ? '是' : '否'}</p>
                    <p>标题截断: {layoutInfo.needsTitleTruncate ? '是' : '否'}</p>
                    <p>标题最大字符: {layoutInfo.titleMaxChars}</p>
                  </div>

                  <div className="border-t pt-3 space-y-1">
                    <p className="font-medium text-foreground">可见内容:</p>
                    <div className="flex flex-wrap gap-1">
                      {layoutInfo.visibleContents.map((id) => {
                        const config = DEFAULT_TASK_CONTENT_CONFIGS.find((c) => c.id === id)
                        return (
                          <span
                            key={id}
                            className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs"
                          >
                            {config?.labelZh || id}
                          </span>
                        )
                      })}
                      {layoutInfo.visibleContents.length === 0 && (
                        <span className="text-muted-foreground">无可选内容显示</span>
                      )}
                    </div>
                  </div>

                  <div className="border-t pt-3 space-y-1">
                    <p className="font-medium text-foreground">元素尺寸:</p>
                    <p>图标: {Math.round(layoutInfo.iconSize)}</p>
                    <p>按钮: {layoutInfo.buttonWidth}</p>
                    <p>标题宽度: {Math.round(layoutInfo.titleWidth)}</p>
                    <p>时间宽度: {Math.round(layoutInfo.timeWidth)}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-3">预设尺寸对比</h2>
          <p className="text-sm text-muted-foreground mb-4">
            不同尺寸下可选内容的显示效果对比
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { width: 250, height: 100 },
              { width: 320, height: 120 },
              { width: 400, height: 140 },
              { width: 500, height: 160 },
            ].map((size) => (
              <div key={size.width}>
                <p className="text-xs text-muted-foreground mb-1">{size.width} × {size.height}</p>
                <div
                  className="border rounded-lg overflow-hidden"
                  style={{ width: size.width, height: size.height }}
                >
                  <LayoutTestWidget contentOptions={contentOptions} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-3">高度变化测试</h2>
          <p className="text-sm text-muted-foreground mb-4">
            固定宽度，测试不同高度下的显示效果（备注需要足够高度）
          </p>
          <div className="flex gap-4 items-end flex-wrap">
            {[
              { width: 350, height: 80 },
              { width: 350, height: 100 },
              { width: 350, height: 130 },
              { width: 350, height: 160 },
            ].map((size) => (
              <div key={size.height}>
                <p className="text-xs text-muted-foreground mb-1">{size.height}px 高</p>
                <div
                  className="border rounded-lg overflow-hidden"
                  style={{ width: size.width, height: size.height }}
                >
                  <LayoutTestWidget contentOptions={contentOptions} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
