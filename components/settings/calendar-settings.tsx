'use client'

import { Switch } from '@/components/ui/switch'
import { useStore, useLanguage } from '@/lib/store'
import { useTranslations } from '@/lib/i18n'
import { SettingRow, SettingGroup, SettingSubGroup } from './setting-row'
import { SelectControl, NumberInput } from '@/components/ui/segmented-control'

export function CalendarSettings() {
  const lang = useLanguage()
  const t = useTranslations(lang)
  const { state, updateSettings } = useStore()
  const calendarSettings = state.settings.calendar

  function updateCalendarSetting<K extends keyof typeof calendarSettings>(key: K, value: (typeof calendarSettings)[K]) {
    updateSettings({
      calendar: { ...calendarSettings, [key]: value }
    })
  }

  const hourOptions = Array.from({ length: 25 }, (_, i) => ({
    value: i,
    label: i === 24 ? '24:00' : `${String(i).padStart(2, '0')}:00`
  }))

  const timeSnapOptions = [1, 5, 10, 15].map(m => ({
    value: m,
    label: `${m} ${lang === 'zh' ? '分钟' : 'min'}`
  }))

  const snapThresholdOptions = [5, 10, 15, 20, 30].map(m => ({
    value: m,
    label: `${m} ${lang === 'zh' ? '分钟' : 'min'}`
  }))

  const hourDivisionOptions = [1, 2, 3, 4, 6].map(i => ({
    value: i,
    label: `${60 / i} ${lang === 'zh' ? '分钟' : 'min'}`
  }))

  return (
    <div className="space-y-4">
      <SettingRow label={t.calendarSettings.timeRange}>
        <div className="flex items-center gap-2">
          <SelectControl
            options={hourOptions.slice(0, 24)}
            value={calendarSettings.dayStartTime}
            onChange={(v) => updateCalendarSetting('dayStartTime', v)}
          />
          <span className="text-muted-foreground text-sm">—</span>
          <SelectControl
            options={hourOptions}
            value={calendarSettings.dayEndTime}
            onChange={(v) => updateCalendarSetting('dayEndTime', v)}
          />
        </div>
      </SettingRow>

      <SettingRow label={t.calendarSettings.timeSnap} description={t.calendarSettings.timeSnapDesc}>
        <SelectControl
          options={timeSnapOptions}
          value={calendarSettings.timeSnap}
          onChange={(v) => updateCalendarSetting('timeSnap', v)}
        />
      </SettingRow>

      <SettingGroup bordered>
        <SettingRow label={t.calendarSettings.snapEnabled} description={t.calendarSettings.snapEnabledDesc}>
          <Switch
            checked={calendarSettings.snapEnabled}
            onCheckedChange={(v) => updateCalendarSetting('snapEnabled', v)}
          />
        </SettingRow>

        <SettingSubGroup show={calendarSettings.snapEnabled}>
          <SettingRow label={t.calendarSettings.snapThreshold} description={t.calendarSettings.snapThresholdDesc}>
            <SelectControl
              options={snapThresholdOptions}
              value={calendarSettings.snapThreshold}
              onChange={(v) => updateCalendarSetting('snapThreshold', v)}
            />
          </SettingRow>
        </SettingSubGroup>
      </SettingGroup>

      <SettingRow label={lang === 'zh' ? '每小时分割' : 'Hour divisions'}>
        <SelectControl
          options={hourDivisionOptions}
          value={calendarSettings.hourDivisions}
          onChange={(v) => updateCalendarSetting('hourDivisions', v)}
        />
      </SettingRow>

      <SettingRow label={lang === 'zh' ? '行高' : 'Row height'}>
        <NumberInput
          value={calendarSettings.hourHeight}
          onChange={(v) => updateCalendarSetting('hourHeight', v)}
          min={24}
          max={300}
          unit="px"
        />
      </SettingRow>
    </div>
  )
}
