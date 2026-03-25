'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePlatform, useDesktopOnly } from '@/components/platform-provider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useLanguage } from '@/lib/store'
import { useTranslations } from '@/lib/i18n'

interface AutoLaunchToggleProps {
  className?: string
  disabled?: boolean
}

/**
 * 开机自启开关组件
 * 仅在桌面端显示，允许用户配置应用开机自动启动
 * @param props.className - 自定义样式类名
 * @param props.disabled - 是否禁用
 */
export function AutoLaunchToggle({ className, disabled }: AutoLaunchToggleProps) {
  const shouldRender = useDesktopOnly()
  const { api, isReady } = usePlatform()
  const { language } = useLanguage()
  const t = useTranslations(language)
  const [isEnabled, setIsEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!api?.capabilities.supportsAutoLaunch) return

    api.getAutoLaunch()
      .then(setIsEnabled)
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [api])

  const handleToggle = useCallback(async (checked: boolean) => {
    if (!api) return

    setIsLoading(true)
    try {
      await api.setAutoLaunch({ enabled: checked, minimized: false })
      setIsEnabled(checked)
    } catch (error) {
      console.error('[AutoLaunchToggle] Failed to set auto launch:', error)
    } finally {
      setIsLoading(false)
    }
  }, [api])

  if (!shouldRender || !isReady) {
    return null
  }

  return (
    <div className={`flex items-center justify-between ${className || ''}`}>
      <div className="space-y-0.5">
        <Label htmlFor="auto-launch">{t.settings.autoLaunch}</Label>
        <p className="text-xs text-muted-foreground">
          {t.settings.autoLaunchDesc}
        </p>
      </div>
      <Switch
        id="auto-launch"
        checked={isEnabled}
        onCheckedChange={handleToggle}
        disabled={disabled || isLoading}
      />
    </div>
  )
}
