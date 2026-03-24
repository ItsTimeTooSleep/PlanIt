'use client'

import { Switch } from '@/components/ui/switch'
import { useStore, useLanguage } from '@/lib/store'
import { useTranslations } from '@/lib/i18n'
import { isDesktop } from '@/lib/platform'
import { useDesktopOnly, usePlatform } from '@/components/platform-provider'
import { AutoLaunchToggle } from '@/components/desktop/auto-launch-toggle'
import { cn } from '@/lib/utils'
import { useState, useEffect, useCallback } from 'react'
import type { CloseBehavior } from '@/lib/types'

const LOG_PREFIX = '[PlanIt Notification Settings]'

const LANGUAGES: { value: 'zh' | 'en'; label: string }[] = [
  { value: 'zh', label: '简体中文' },
  { value: 'en', label: 'English' },
]

export function GeneralSettings() {
  const lang = useLanguage()
  const t = useTranslations(lang)
  const { state, updateSettings } = useStore()
  const shouldShowDesktopSettings = useDesktopOnly()
  const { api } = usePlatform()
  const [desktopPermission, setDesktopPermission] = useState<'granted' | 'denied' | 'default' | null>(null)

  useEffect(() => {
    if (isDesktop()) {
      import('@tauri-apps/plugin-notification').then(({ isPermissionGranted }) => {
        isPermissionGranted().then((granted) => {
          console.log(`${LOG_PREFIX} Desktop permission status:`, granted)
          setDesktopPermission(granted ? 'granted' : 'default')
        })
      }).catch((error) => {
        console.error(`${LOG_PREFIX} Failed to check desktop permission:`, error)
        setDesktopPermission(null)
      })
    }
  }, [])

  useEffect(() => {
    if (shouldShowDesktopSettings && api) {
      api.getCloseBehavior().then((behavior) => {
        if (behavior !== state.settings.closeBehavior) {
          updateSettings({ closeBehavior: behavior as CloseBehavior })
        }
      }).catch(console.error)
    }
  }, [shouldShowDesktopSettings, api])

  const handleCloseBehaviorChange = useCallback((behavior: CloseBehavior) => {
    updateSettings({ closeBehavior: behavior })
    if (api) {
      api.setCloseBehavior(behavior).catch(console.error)
    }
  }, [updateSettings, api])

  async function handleToggleNotifications(enabled: boolean) {
    console.log(`${LOG_PREFIX} handleToggleNotifications called with enabled:`, enabled)
    
    if (isDesktop()) {
      console.log(`${LOG_PREFIX} Desktop environment`)
      
      if (enabled) {
        try {
          const { isPermissionGranted, requestPermission } = await import('@tauri-apps/plugin-notification')
          
          let granted = await isPermissionGranted()
          console.log(`${LOG_PREFIX} Current desktop permission:`, granted)
          
          if (!granted) {
            console.log(`${LOG_PREFIX} Requesting desktop notification permission...`)
            const permission = await requestPermission()
            granted = permission === 'granted'
            console.log(`${LOG_PREFIX} Permission request result:`, permission)
          }
          
          if (granted) {
            console.log(`${LOG_PREFIX} Permission granted, enabling notifications`)
            updateSettings({ notificationsEnabled: true })
            setDesktopPermission('granted')
          } else {
            console.warn(`${LOG_PREFIX} Permission denied`)
            setDesktopPermission('denied')
            alert(t.settings.notificationsDeniedAlert)
          }
        } catch (error) {
          console.error(`${LOG_PREFIX} Error handling desktop notification permission:`, error)
        }
      } else {
        console.log(`${LOG_PREFIX} Disabling notifications`)
        updateSettings({ notificationsEnabled: false })
      }
    } else if (enabled && 'Notification' in window) {
      console.log(`${LOG_PREFIX} Browser environment, current permission:`, Notification.permission)
      
      if (Notification.permission === 'granted') {
        console.log(`${LOG_PREFIX} Permission already granted, enabling notifications`)
        updateSettings({ notificationsEnabled: true })
      } else if (Notification.permission === 'denied') {
        console.warn(`${LOG_PREFIX} Permission denied by user, cannot enable notifications`)
        alert(t.settings.notificationsDeniedWeb)
      } else {
        console.log(`${LOG_PREFIX} Requesting notification permission...`)
        try {
          const perm = await Notification.requestPermission()
          console.log(`${LOG_PREFIX} Permission request result:`, perm)
          
          if (perm === 'granted') {
            console.log(`${LOG_PREFIX} Permission granted, enabling notifications`)
            updateSettings({ notificationsEnabled: true })
          } else if (perm === 'denied') {
            console.warn(`${LOG_PREFIX} Permission denied by user`)
            alert(t.settings.notificationsDeniedAlert)
          } else {
            console.warn(`${LOG_PREFIX} Permission dismissed by user`)
          }
        } catch (error) {
          console.error(`${LOG_PREFIX} Error requesting permission:`, error)
        }
      }
    } else {
      console.log(`${LOG_PREFIX} Notifications not supported or disabling, updating settings`)
      updateSettings({ notificationsEnabled: enabled })
    }
  }

  const isDesktopEnv = typeof window !== 'undefined' && isDesktop()
  
  const notifPermission = isDesktopEnv
    ? (desktopPermission ?? 'default')
    : typeof window !== 'undefined' && 'Notification' in window
    ? Notification.permission
    : 'default'
    
  console.log(`${LOG_PREFIX} Current state - notificationsEnabled:`, state.settings.notificationsEnabled, 'permission:', notifPermission)

  return (
    <div className="space-y-5">
      <SettingRow label={t.settings.language} description={t.settings.languageDesc}>
        <div className="flex gap-2">
          {LANGUAGES.map(l => (
            <button
              key={l.value}
              onClick={() => updateSettings({ language: l.value })}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm transition-colors',
                state.settings.language === l.value
                  ? 'bg-foreground text-background'
                  : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              {l.label}
            </button>
          ))}
        </div>
      </SettingRow>

      <SettingRow 
        label={t.settings.enableNotifications} 
        description={isDesktopEnv ? t.settings.notificationsDesc : t.settings.notificationsDescWeb}
      >
        <div className="flex items-center gap-3">
          <span className={cn(
            'text-xs px-2 py-0.5 rounded-full',
            notifPermission === 'granted'
              ? 'bg-success/10 text-success'
              : notifPermission === 'denied'
              ? 'bg-destructive/10 text-destructive'
              : 'bg-muted text-muted-foreground'
          )}>
            {notifPermission === 'granted'
              ? t.settings.notificationsGranted
              : notifPermission === 'denied'
              ? (isDesktopEnv ? t.settings.notificationsDenied : t.settings.notificationsDeniedWeb)
              : t.settings.notificationsDefault}
          </span>
          <Switch
            checked={state.settings.notificationsEnabled && notifPermission === 'granted'}
            onCheckedChange={handleToggleNotifications}
            disabled={notifPermission === 'denied'}
          />
        </div>
      </SettingRow>

      {shouldShowDesktopSettings && (
        <div className="pt-3 border-t border-border/50">
          <AutoLaunchToggle />
          <SettingRow 
            label={t.settings.closeBehavior} 
            description={t.settings.closeBehaviorDesc}
          >
            <div className="flex gap-2">
              <button
                onClick={() => handleCloseBehaviorChange('exit')}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm transition-colors',
                  state.settings.closeBehavior === 'exit'
                    ? 'bg-foreground text-background'
                    : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground'
                )}
              >
                {t.settings.closeBehaviorExit}
              </button>
              <button
                onClick={() => handleCloseBehaviorChange('tray')}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm transition-colors',
                  state.settings.closeBehavior === 'tray'
                    ? 'bg-foreground text-background'
                    : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground'
                )}
              >
                {t.settings.closeBehaviorTray}
              </button>
            </div>
          </SettingRow>
        </div>
      )}
    </div>
  )
}

function SettingRow({
  label,
  description,
  children
}: {
  label: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <div className="shrink-0">
        {children}
      </div>
    </div>
  )
}
