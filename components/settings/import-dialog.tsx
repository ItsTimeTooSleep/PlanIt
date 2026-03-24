'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useLanguage } from '@/lib/store'
import { useTranslations } from '@/lib/i18n'
import type { ImportOptions, AppState, ExportData } from '@/lib/types'
import { cn } from '@/lib/utils'

interface ImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  parsedData: AppState | ExportData | null
  onConfirm: (mode: 'merge' | 'overwrite', options: ImportOptions) => void
}

const DEFAULT_OPTIONS: ImportOptions = {
  tasks: true,
  tags: true,
  dateNotes: true,
  notes: true,
  noteLines: true,
  settings: true,
  pomodoro: true,
}

export function ImportDialog({ open, onOpenChange, parsedData, onConfirm }: ImportDialogProps) {
  const lang = useLanguage()
  const t = useTranslations(lang)
  const [mode, setMode] = useState<'merge' | 'overwrite'>('merge')
  const [options, setOptions] = useState<ImportOptions>(DEFAULT_OPTIONS)

  useEffect(() => {
    if (open) {
      setMode('merge')
      setOptions(DEFAULT_OPTIONS)
    }
  }, [open])

  if (!parsedData) return null

  const actualData: AppState = 'meta' in parsedData ? parsedData.data : parsedData
  const hasMeta = 'meta' in parsedData

  const counts = {
    tasks: actualData.tasks.length,
    tags: actualData.tags.length,
    dateNotes: actualData.dateNotes.length,
    notes: actualData.notes.length,
    noteLines: actualData.noteLines.length,
  }

  function toggleOption(key: keyof ImportOptions) {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }))
  }

  function selectAll() {
    setOptions({
      tasks: true,
      tags: true,
      dateNotes: true,
      notes: true,
      noteLines: true,
      settings: true,
      pomodoro: true,
    })
  }

  function deselectAll() {
    setOptions({
      tasks: false,
      tags: false,
      dateNotes: false,
      notes: false,
      noteLines: false,
      settings: false,
      pomodoro: false,
    })
  }

  function handleConfirm() {
    onConfirm(mode, options)
    onOpenChange(false)
  }

  const importItems: { key: keyof ImportOptions; label: string; count?: number }[] = [
    { key: 'tasks', label: t.settings.importTasks, count: counts.tasks },
    { key: 'tags', label: t.settings.importTags, count: counts.tags },
    { key: 'dateNotes', label: t.settings.importDateNotes, count: counts.dateNotes },
    { key: 'notes', label: t.settings.importNotes, count: counts.notes },
    { key: 'noteLines', label: t.settings.importNoteLines, count: counts.noteLines },
    { key: 'settings', label: t.settings.importSettings },
    { key: 'pomodoro', label: t.settings.importPomodoro },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t.settings.importDialogTitle}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {hasMeta && (
            <div className="text-xs text-muted-foreground bg-muted/30 rounded-md px-3 py-2">
              <div className="flex justify-between">
                <span>{t.settings.importFileVersion}</span>
                <span>{(parsedData as ExportData).meta.version}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span>{t.settings.importFileDate}</span>
                <span>{new Date((parsedData as ExportData).meta.exportDate).toLocaleString()}</span>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <p className="text-sm font-medium">{t.settings.importMode}</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setMode('merge')}
                className={cn(
                  'flex-1 px-4 py-3 rounded-lg border-2 text-sm transition-all',
                  mode === 'merge'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <div className="font-medium">{t.settings.importMergeTitle}</div>
                <div className="text-xs text-muted-foreground mt-1">{t.settings.importMergeDesc}</div>
              </button>
              <button
                type="button"
                onClick={() => setMode('overwrite')}
                className={cn(
                  'flex-1 px-4 py-3 rounded-lg border-2 text-sm transition-all',
                  mode === 'overwrite'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <div className="font-medium">{t.settings.importOverwriteTitle}</div>
                <div className="text-xs text-muted-foreground mt-1">{t.settings.importOverwriteDesc}</div>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{t.settings.importSelectItems}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-xs text-primary hover:underline"
                >
                  {t.settings.selectAll}
                </button>
                <span className="text-xs text-muted-foreground">|</span>
                <button
                  type="button"
                  onClick={deselectAll}
                  className="text-xs text-primary hover:underline"
                >
                  {t.settings.deselectAll}
                </button>
              </div>
            </div>
            <div className="space-y-1">
              {importItems.map(item => (
                <label
                  key={item.key}
                  className="flex items-center justify-between py-2 px-3 -mx-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={options[item.key]}
                      onCheckedChange={() => toggleOption(item.key)}
                      className="data-[state=checked]:bg-primary"
                    />
                    <span className="text-sm">{item.label}</span>
                  </div>
                  {item.count !== undefined && (
                    <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                      {item.count}
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="h-8">
            {t.common.cancel}
          </Button>
          <Button size="sm" onClick={handleConfirm} className="h-8">
            {t.settings.importConfirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
