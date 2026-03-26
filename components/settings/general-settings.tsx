'use client'

import { Switch } from '@/components/ui/switch'
import { useStore, useLanguage } from '@/lib/store'
import { useTranslations } from '@/lib/i18n'
import { useDesktopOnly, usePlatform } from '@/components/platform-provider'
import { AutoLaunchToggle } from '@/components/desktop/auto-launch-toggle'
import { useState, useEffect, useCallback } from 'react'
import type { CloseBehavior } from '@/lib/types'
import { SettingRow, SettingGroup, SettingSubGroup } from './setting-row'
import { SegmentedControl } from '@/components/ui/segmented-control'

const LANGUAGES: { value: 'zh' | 'en'; label: string }[] = [
  { value: 'zh', label: '简体中文' },
  { value: 'en', label: 'English' },
]

const CLOSE_BEHAVIORS: { value: CloseBehavior; labelKey: 'closeBehaviorExit' | 'closeBehaviorTray' }[] = [
  { value: 'exit', labelKey: 'closeBehaviorExit' },
  { value: 'tray', labelKey: 'closeBehaviorTray' },
]

export function GeneralSettings() {
  const lang = useLanguage()
  const t = useTranslations(lang)
  const { state, updateSettings } = useStore()
  const shouldShowDesktopSettings = useDesktopOnly()
  const { api } = usePlatform()

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

  return (
    <div className="space-y-4">
      <SettingRow label={t.settings.language} description={t.settings.languageDesc}>
        <SegmentedControl
          options={LANGUAGES}
          value={state.settings.language}
          onChange={(value) => updateSettings({ language: value })}
        />
      </SettingRow>

      <SettingGroup bordered>
        <SettingRow 
          label={t.settings.sound} 
          description={t.settings.soundDesc}
        >
          <Switch
            checked={state.settings.sound.enabled}
            onCheckedChange={(checked) => updateSettings({ 
              sound: { ...state.settings.sound, enabled: checked } 
            })}
          />
        </SettingRow>

        <SettingSubGroup show={state.settings.sound.enabled}>
          <SettingRow label={t.settings.playOnTaskStart}>
            <Switch
              checked={state.settings.sound.playOnTaskStart}
              onCheckedChange={(checked) => updateSettings({ 
                sound: { ...state.settings.sound, playOnTaskStart: checked } 
              })}
            />
          </SettingRow>

          <SettingRow label={t.settings.playOnTaskEnd}>
            <Switch
              checked={state.settings.sound.playOnTaskEnd}
              onCheckedChange={(checked) => updateSettings({ 
                sound: { ...state.settings.sound, playOnTaskEnd: checked } 
              })}
            />
          </SettingRow>

          <SettingRow label={t.settings.playOnTaskComplete}>
            <Switch
              checked={state.settings.sound.playOnTaskComplete}
              onCheckedChange={(checked) => updateSettings({ 
                sound: { ...state.settings.sound, playOnTaskComplete: checked } 
              })}
            />
          </SettingRow>
        </SettingSubGroup>
      </SettingGroup>

      {shouldShowDesktopSettings && (
        <SettingGroup bordered>
          <AutoLaunchToggle />
          <SettingRow 
            label={t.settings.closeBehavior} 
            description={t.settings.closeBehaviorDesc}
          >
            <SegmentedControl
              options={CLOSE_BEHAVIORS.map(b => ({ value: b.value, label: t.settings[b.labelKey] }))}
              value={state.settings.closeBehavior}
              onChange={handleCloseBehaviorChange}
            />
          </SettingRow>
        </SettingGroup>
      )}
    </div>
  )
}
