'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePlatform, useDesktopOnly } from '@/components/platform-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface GlobalShortcutConfigProps {
  className?: string
}

interface ShortcutItem {
  id: string
  accelerator: string
  description: string
  action: string
}

const defaultShortcuts: ShortcutItem[] = [
  { id: 'toggle-pomodoro', accelerator: 'CommandOrControl+Shift+P', description: '切换番茄钟', action: 'togglePomodoro' },
  { id: 'quick-add-task', accelerator: 'CommandOrControl+N', description: '快速添加任务', action: 'quickAddTask' },
  { id: 'show-hide', accelerator: 'CommandOrControl+Shift+Space', description: '显示/隐藏窗口', action: 'toggleWindow' },
]

/**
 * 全局快捷键配置组件
 * 仅在桌面端显示，允许用户配置系统级快捷键
 * @param props.className - 自定义样式类名
 */
export function GlobalShortcutConfig({ className }: GlobalShortcutConfigProps) {
  const shouldRender = useDesktopOnly()
  const { api, isReady } = usePlatform()
  const [shortcuts, setShortcuts] = useState<ShortcutItem[]>(defaultShortcuts)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const registerShortcuts = useCallback(async () => {
    if (!api) return

    for (const shortcut of shortcuts) {
      try {
        await api.registerGlobalShortcut({
          accelerator: shortcut.accelerator,
          handler: () => {
            window.dispatchEvent(new CustomEvent(`shortcut:${shortcut.action}`))
          },
        })
      } catch (error) {
        console.error(`[GlobalShortcutConfig] Failed to register ${shortcut.accelerator}:`, error)
      }
    }
  }, [api, shortcuts])

  useEffect(() => {
    if (api?.capabilities.supportsGlobalShortcuts && isReady) {
      registerShortcuts()
    }
  }, [api, isReady, registerShortcuts])

  const handleEditShortcut = useCallback((id: string) => {
    setEditingId(id)
  }, [])

  const handleSaveShortcut = useCallback(async (id: string, newAccelerator: string) => {
    if (!api) return

    setIsLoading(true)
    try {
      const oldShortcut = shortcuts.find(s => s.id === id)
      if (oldShortcut) {
        await api.unregisterGlobalShortcut(oldShortcut.accelerator)
      }

      await api.registerGlobalShortcut({
        accelerator: newAccelerator,
        handler: () => {
          const shortcut = shortcuts.find(s => s.id === id)
          if (shortcut) {
            window.dispatchEvent(new CustomEvent(`shortcut:${shortcut.action}`))
          }
        },
      })

      setShortcuts(prev =>
        prev.map(s => (s.id === id ? { ...s, accelerator: newAccelerator } : s))
      )
    } catch (error) {
      console.error('[GlobalShortcutConfig] Failed to update shortcut:', error)
    } finally {
      setEditingId(null)
      setIsLoading(false)
    }
  }, [api, shortcuts])

  if (!shouldRender || !isReady) {
    return null
  }

  return (
    <div className={className}>
      <h4 className="text-sm font-medium mb-3">全局快捷键</h4>
      <div className="space-y-3">
        {shortcuts.map(shortcut => (
          <div key={shortcut.id} className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {shortcut.description}
            </span>
            {editingId === shortcut.id ? (
              <Input
                className="w-32 h-8"
                defaultValue={shortcut.accelerator}
                onBlur={e => handleSaveShortcut(shortcut.id, e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    handleSaveShortcut(shortcut.id, e.currentTarget.value)
                  } else if (e.key === 'Escape') {
                    setEditingId(null)
                  }
                }}
                disabled={isLoading}
                autoFocus
              />
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="w-32"
                onClick={() => handleEditShortcut(shortcut.id)}
              >
                {shortcut.accelerator}
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
