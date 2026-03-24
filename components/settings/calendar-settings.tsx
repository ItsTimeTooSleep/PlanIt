'use client'

import { Switch } from '@/components/ui/switch'
import { useStore, useLanguage } from '@/lib/store'
import { useTranslations } from '@/lib/i18n'

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

  return (
    <div className="space-y-5">
      <SettingRow label={t.calendarSettings.timeRange}>
        <div className="flex items-center gap-2 text-sm">
          <select
            value={calendarSettings.dayStartTime}
            onChange={(e) => updateCalendarSetting('dayStartTime', parseInt(e.target.value))}
            className="px-2 py-1 rounded-md border-0 bg-muted/50 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20"
          >
            {Array.from({ length: 24 }, (_, i) => (
              <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>
            ))}
          </select>
          <span className="text-muted-foreground">—</span>
          <select
            value={calendarSettings.dayEndTime}
            onChange={(e) => updateCalendarSetting('dayEndTime', parseInt(e.target.value))}
            className="px-2 py-1 rounded-md border-0 bg-muted/50 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20"
          >
            {Array.from({ length: 25 }, (_, i) => (
              <option key={i} value={i}>{i === 24 ? '24:00' : String(i).padStart(2, '0') + ':00'}</option>
            ))}
          </select>
        </div>
      </SettingRow>

      <SettingRow label={t.calendarSettings.timeSnap} description={t.calendarSettings.timeSnapDesc}>
        <select
          value={calendarSettings.timeSnap}
          onChange={(e) => updateCalendarSetting('timeSnap', parseInt(e.target.value))}
          className="px-2 py-1 rounded-md border-0 bg-muted/50 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20"
        >
          {[1, 5, 10, 15].map(m => (
            <option key={m} value={m}>{m} {lang === 'zh' ? '分钟' : 'min'}</option>
          ))}
        </select>
      </SettingRow>

      <SettingRow label={t.calendarSettings.snapEnabled} description={t.calendarSettings.snapEnabledDesc}>
        <Switch
          checked={calendarSettings.snapEnabled}
          onCheckedChange={(v) => updateCalendarSetting('snapEnabled', v)}
        />
      </SettingRow>

      {calendarSettings.snapEnabled && (
        <SettingRow label={t.calendarSettings.snapThreshold} description={t.calendarSettings.snapThresholdDesc}>
          <select
            value={calendarSettings.snapThreshold}
            onChange={(e) => updateCalendarSetting('snapThreshold', parseInt(e.target.value))}
            className="px-2 py-1 rounded-md border-0 bg-muted/50 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20"
          >
            {[5, 10, 15, 20, 30].map(m => (
              <option key={m} value={m}>{m} {lang === 'zh' ? '分钟' : 'min'}</option>
            ))}
          </select>
        </SettingRow>
      )}

      <SettingRow label={lang === 'zh' ? '每小时分割' : 'Hour divisions'}>
        <select
          value={calendarSettings.hourDivisions}
          onChange={(e) => updateCalendarSetting('hourDivisions', parseInt(e.target.value))}
          className="px-2 py-1 rounded-md border-0 bg-muted/50 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20"
        >
          {[1, 2, 3, 4, 6].map(i => (
            <option key={i} value={i}>{60 / i} {lang === 'zh' ? '分钟' : 'min'}</option>
          ))}
        </select>
      </SettingRow>

      <SettingRow label={lang === 'zh' ? '行高' : 'Row height'}>
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={calendarSettings.hourHeight}
            onChange={(e) => {
              const value = parseInt(e.target.value)
              if (!isNaN(value) && value >= 24 && value <= 300) {
                updateCalendarSetting('hourHeight', value)
              }
            }}
            onBlur={(e) => {
              const value = parseInt(e.target.value)
              if (isNaN(value) || value < 24) {
                updateCalendarSetting('hourHeight', 24)
              } else if (value > 300) {
                updateCalendarSetting('hourHeight', 300)
              }
            }}
            min={24}
            max={300}
            className="w-16 px-2 py-1 rounded-md border-0 bg-muted/50 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 text-right"
          />
          <span className="text-xs text-muted-foreground">px</span>
        </div>
      </SettingRow>
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
