'use client'

import { useState, useCallback } from 'react'
import { usePlatform, useDesktopOnly } from '@/components/platform-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface LocalFileExportProps {
  className?: string
  onDataExport?: () => string
  onDataImport?: (data: string) => void
}

/**
 * 本地文件导入导出组件
 * 仅在桌面端显示，允许用户导入导出数据到本地文件
 * @param props.className - 自定义样式类名
 * @param props.onDataExport - 导出数据回调
 * @param props.onDataImport - 导入数据回调
 */
export function LocalFileExport({
  className,
  onDataExport,
  onDataImport,
}: LocalFileExportProps) {
  const shouldRender = useDesktopOnly()
  const { api, isReady } = usePlatform()
  const [isLoading, setIsLoading] = useState(false)

  const handleExport = useCallback(async () => {
    if (!api || !onDataExport) return

    setIsLoading(true)
    try {
      const filePath = await api.saveFilePicker({
        title: '导出数据',
        defaultPath: `planit-backup-${new Date().toISOString().split('T')[0]}.json`,
        filters: [{ name: 'JSON', extensions: ['json'] }],
      })

      if (filePath) {
        const data = onDataExport()
        await api.writeFile(filePath, data)
      }
    } catch (error) {
      console.error('[LocalFileExport] Export failed:', error)
    } finally {
      setIsLoading(false)
    }
  }, [api, onDataExport])

  const handleImport = useCallback(async () => {
    if (!api || !onDataImport) return

    setIsLoading(true)
    try {
      const filePaths = await api.openFilePicker({
        title: '导入数据',
        filters: [{ name: 'JSON', extensions: ['json'] }],
        multiple: false,
      })

      if (filePaths && filePaths.length > 0) {
        const data = await api.readFile(filePaths[0])
        onDataImport(data)
      }
    } catch (error) {
      console.error('[LocalFileExport] Import failed:', error)
    } finally {
      setIsLoading(false)
    }
  }, [api, onDataImport])

  if (!shouldRender || !isReady) {
    return null
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>本地文件</CardTitle>
        <CardDescription>
          将数据导出到本地文件或从本地文件导入
        </CardDescription>
      </CardHeader>
      <CardContent className="flex gap-2">
        <Button
          variant="outline"
          onClick={handleExport}
          disabled={isLoading || !onDataExport}
        >
          导出到文件
        </Button>
        <Button
          variant="outline"
          onClick={handleImport}
          disabled={isLoading || !onDataImport}
        >
          从文件导入
        </Button>
      </CardContent>
    </Card>
  )
}
