'use client'

import { Switch } from '@/components/ui/switch'
import { useStore, useLanguage } from '@/lib/store'
import { useTranslations } from '@/lib/i18n'
import { SettingRow, SettingGroup } from './setting-row'
import { SelectControl } from '@/components/ui/segmented-control'

const WORK_DURATION_OPTIONS = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60]
const SHORT_BREAK_OPTIONS = [1, 3, 5, 7, 10, 15]
const LONG_BREAK_OPTIONS = [5, 10, 15, 20, 25, 30]
const SESSIONS_OPTIONS = [2, 3, 4, 5, 6]

export function PomodoroSettings() {
  const lang = useLanguage()
  const t = useTranslations(lang)
  const { state, updatePomodoro } = useStore()
  const pomodoroSettings = state.pomodoro.settings

  function updatePomodoroSetting<K extends keyof typeof pomodoroSettings>(key: K, value: (typeof pomodoroSettings)[K]) {
    updatePomodoro({ settings: { ...pomodoroSettings, [key]: value } })
  }

  const formatOption = (value: number, unit: string) => ({ value, label: `${value} ${unit}` })

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        <SettingRow label={t.pomodoro.workDuration}>
          <SelectControl
            options={WORK_DURATION_OPTIONS.map(m => formatOption(m, lang === 'zh' ? '分钟' : 'min'))}
            value={pomodoroSettings.workDuration}
            onChange={(v) => updatePomodoroSetting('workDuration', v)}
          />
        </SettingRow>
        <SettingRow label={t.pomodoro.shortBreakDuration}>
          <SelectControl
            options={SHORT_BREAK_OPTIONS.map(m => formatOption(m, lang === 'zh' ? '分钟' : 'min'))}
            value={pomodoroSettings.shortBreakDuration}
            onChange={(v) => updatePomodoroSetting('shortBreakDuration', v)}
          />
        </SettingRow>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        <SettingRow label={t.pomodoro.longBreakDuration}>
          <SelectControl
            options={LONG_BREAK_OPTIONS.map(m => formatOption(m, lang === 'zh' ? '分钟' : 'min'))}
            value={pomodoroSettings.longBreakDuration}
            onChange={(v) => updatePomodoroSetting('longBreakDuration', v)}
          />
        </SettingRow>
        <SettingRow label={t.pomodoro.workSessionsBeforeLongBreak}>
          <SelectControl
            options={SESSIONS_OPTIONS.map(n => formatOption(n, lang === 'zh' ? '个' : 'sessions'))}
            value={pomodoroSettings.workSessionsBeforeLongBreak}
            onChange={(v) => updatePomodoroSetting('workSessionsBeforeLongBreak', v)}
          />
        </SettingRow>
      </div>

      <SettingGroup bordered>
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
      </SettingGroup>
    </div>
  )
}
