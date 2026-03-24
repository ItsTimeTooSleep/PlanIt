'use client'

import { useState, useCallback, useRef } from 'react'
import { useStore } from '@/lib/store'
import type { AppState, ExportData, ImportOptions } from '@/lib/types'

export function useDataExport() {
  const { exportData: exportDataFunc } = useStore()

  const handleExport = useCallback(() => {
    const exportData = exportDataFunc()
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `planit-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [exportDataFunc])

  const getExportString = useCallback((): string => {
    return JSON.stringify(exportDataFunc(), null, 2)
  }, [exportDataFunc])

  return { handleExport, getExportString }
}

export function useDataImport() {
  const { importData } = useStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [parsedData, setParsedData] = useState<AppState | ExportData | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [importStatus, setImportStatus] = useState<'success' | 'error' | null>(null)

  const parseImportFile = useCallback((file: File): Promise<AppState | ExportData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = ev => {
        try {
          const parsed = JSON.parse(ev.target?.result as string)
          if ('meta' in parsed && 'data' in parsed) {
            resolve(parsed as ExportData)
          } else if (parsed.tasks !== undefined || parsed.tags !== undefined || parsed.settings !== undefined) {
            resolve(parsed as AppState)
          } else {
            reject(new Error('Invalid format'))
          }
        } catch {
          reject(new Error('Parse error'))
        }
      }
      reader.onerror = () => reject(new Error('Read error'))
      reader.readAsText(file)
    })
  }, [])

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const data = await parseImportFile(file)
      setParsedData(data)
      setDialogOpen(true)
      setImportStatus(null)
    } catch {
      setImportStatus('error')
      setTimeout(() => setImportStatus(null), 3000)
    }
    e.target.value = ''
  }, [parseImportFile])

  const handleImportConfirm = useCallback((mode: 'merge' | 'overwrite', options: ImportOptions) => {
    if (!parsedData) return
    importData(parsedData, mode, options)
    setParsedData(null)
    setImportStatus('success')
    setTimeout(() => setImportStatus(null), 3000)
  }, [parsedData, importData])

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  return {
    fileInputRef,
    dialogOpen,
    setDialogOpen,
    parsedData,
    importStatus,
    handleFileSelect,
    handleImportConfirm,
    openFilePicker,
  }
}
