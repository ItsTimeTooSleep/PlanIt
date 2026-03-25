'use client'

import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useStore, useLanguage } from '@/lib/store'
import { useTranslations } from '@/lib/i18n'
import { isDesktop } from '@/lib/platform'
import { useDesktopOnly, usePlatform } from '@/components/platform-provider'
import { cn } from '@/lib/utils'
import { useState, useEffect, useCallback } from 'react'
import { ChevronDown } from 'lucide-react'

const LOG_PREFIX = '[PlanIt Notification Settings]'

const ADVANCE_MINUTE_OPTIONS = [5, 10, 15, 30, 60]

export function NotificationSettings() {
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
            updateSettings({ 
              notifications: { 
                ...state.settings.notifications, 
                enabled: true 
              } 
            })
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
        updateSettings({ 
          notifications: { 
            ...state.settings.notifications, 
            enabled: false 
          } 
        })
      }
    } else if (enabled && 'Notification' in window) {
      console.log(`${LOG_PREFIX} Browser environment, current permission:`, Notification.permission)
      
      if (Notification.permission === 'granted') {
        console.log(`${LOG_PREFIX} Permission already granted, enabling notifications`)
        updateSettings({ 
          notifications: { 
            ...state.settings.notifications, 
            enabled: true 
          } 
        })
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
            updateSettings({ 
              notifications: { 
                ...state.settings.notifications, 
                enabled: true 
              } 
            })
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
      updateSettings({ 
        notifications: { 
          ...state.settings.notifications, 
          enabled: enabled 
        } 
      })
    }
  }

  const isDesktopEnv = typeof window !== 'undefined' && isDesktop()
  
  const notifPermission = isDesktopEnv
    ? (desktopPermission ?? 'default')
    : typeof window !== 'undefined' && 'Notification' in window
    ? Notification.permission
    : 'default'
    
  console.log(`${LOG_PREFIX} Current state - notificationsEnabled:`, state.settings.notifications?.enabled, 'permission:', notifPermission)

  const handleAdvanceMinutesChange = (minutes: number | null) => {
    updateSettings({
      notifications: {
        ...state.settings.notifications,
        advanceMinutes: minutes
      }
    })
  }

  const handleShowStartNotificationChange = (show: boolean) => {
    updateSettings({
      notifications: {
        ...state.settings.notifications,
        showStartNotification: show
      }
    })
  }

  const handleShowEndNotificationChange = (show: boolean) => {
    updateSettings({
      notifications: {
        ...state.settings.notifications,
        showEndNotification: show
      }
    })
  }

  const getAdvanceMinutesLabel = () => {
    if (state.settings.notifications?.advanceMinutes === null) {
      return t.settings.never
    }
    return `${state.settings.notifications?.advanceMinutes} ${t.settings.minutes}`
  }

  return (
    <div className="space-y-5">
      <SettingRow label={t.settings.enableNotifications} description={isDesktopEnv ? t.settings.notificationsDesc : t.settings.notificationsDescWeb}>
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
            checked={state.settings.notifications?.enabled && notifPermission === 'granted'}
            onCheckedChange={handleToggleNotifications}
            disabled={notifPermission === 'denied'}
          />
        </div>
      </SettingRow>

      {state.settings.notifications?.enabled && (
        <>
          <SettingRow label={t.settings.advanceNotification} description={t.settings.advanceNotificationDesc}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-[140px] justify-between">
                  {getAdvanceMinutesLabel()}
                  <ChevronDown className="w-4 h-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[140px]">
                <DropdownMenuItem onClick={() => handleAdvanceMinutesChange(null)}>
                  {t.settings.never}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {ADVANCE_MINUTE_OPTIONS.map((minutes) => (
                  <DropdownMenuItem key={minutes} onClick={() => handleAdvanceMinutesChange(minutes)}>
                    {minutes} {t.settings.minutes}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </SettingRow>

          <SettingRow label={t.settings.showStartNotification} description={t.settings.showStartNotificationDesc}>
            <Switch
              checked={state.settings.notifications?.showStartNotification ?? true}
              onCheckedChange={handleShowStartNotificationChange}
            />
          </SettingRow>

          <SettingRow label={t.settings.showEndNotification} description={t.settings.showEndNotificationDesc}>
            <Switch
              checked={state.settings.notifications?.showEndNotification ?? false}
              onCheckedChange={handleShowEndNotificationChange}
            />
          </SettingRow>
        </>
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
