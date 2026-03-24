'use client'

import { Switch } from '@/components/ui/switch'
import { useStore, useLanguage } from '@/lib/store'
import { useTranslations } from '@/lib/i18n'

export function PomodoroSettings() {
  const lang = useLanguage()
  const t = useTranslations(lang)
  const { state, updatePomodoro } = useStore()
  const pomodoroSettings = state.pomodoro.settings

  function updatePomodoroSetting<K extends keyof typeof pomodoroSettings>(key: K, value: (typeof pomodoroSettings)[K]) {
    updatePomodoro({ settings: { ...pomodoroSettings, [key]: value } })
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <SettingRow label={t.pomodoro.workDuration}>
          <select
            value={pomodoroSettings.workDuration}
            onChange={(e) => updatePomodoroSetting('workDuration', parseInt(e.target.value))}
            className="px-2 py-1 rounded-md border-0 bg-muted/50 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20"
          >
            {[5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60].map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </SettingRow>
        <SettingRow label={t.pomodoro.shortBreakDuration}>
          <select
            value={pomodoroSettings.shortBreakDuration}
            onChange={(e) => updatePomodoroSetting('shortBreakDuration', parseInt(e.target.value))}
            className="px-2 py-1 rounded-md border-0 bg-muted/50 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20"
          >
            {[1, 3, 5, 7, 10, 15].map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </SettingRow>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <SettingRow label={t.pomodoro.longBreakDuration}>
          <select
            value={pomodoroSettings.longBreakDuration}
            onChange={(e) => updatePomodoroSetting('longBreakDuration', parseInt(e.target.value))}
            className="px-2 py-1 rounded-md border-0 bg-muted/50 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20"
          >
            {[5, 10, 15, 20, 25, 30].map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </SettingRow>
        <SettingRow label={t.pomodoro.workSessionsBeforeLongBreak}>
          <select
            value={pomodoroSettings.workSessionsBeforeLongBreak}
            onChange={(e) => updatePomodoroSetting('workSessionsBeforeLongBreak', parseInt(e.target.value))}
            className="px-2 py-1 rounded-md border-0 bg-muted/50 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20"
          >
            {[2, 3, 4, 5, 6].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </SettingRow>
      </div>

      <div className="pt-2 border-t border-border/50 space-y-3">
        <SettingRow label={t.pomodoro.autoStartBreaks}>
          <Switch
            checked={pomodoroSettings.autoStartBreaks}
            onCheckedChange={(v) => updatePomodoroSetting('autoStartBreaks', v)}
          />
        </SettingRow>
        <SettingRow label={t.pomodoro.autoStartWork}>
          <Switch
            checked={pomodoroSettings.autoStartWork}
            onCheckedChange={(v) => updatePomodoroSetting('autoStartWork', v)}
          />
        </SettingRow>
      </div>
    </div>
  )
}

function SettingRow({
  label,
  children
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm">{label}</p>
      </div>
      <div className="shrink-0">
        {children}
      </div>
    </div>
  )
}
