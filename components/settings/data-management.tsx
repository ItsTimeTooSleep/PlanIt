'use client'

import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/store'
import { useTranslations } from '@/lib/i18n'
import { useDataExport, useDataImport } from './use-data-management'
import { ImportDialog } from './import-dialog'
import { Download, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SettingRow, SettingGroup } from './setting-row'
import { useToast } from '@/hooks/use-toast'

export function DataManagement() {
  const lang = useLanguage()
  const t = useTranslations(lang)
  const { toast } = useToast()
  const { handleExport } = useDataExport()
  const {
    fileInputRef,
    dialogOpen,
    setDialogOpen,
    parsedData,
    importStatus,
    handleFileSelect,
    handleImportConfirm,
    openFilePicker,
  } = useDataImport()

  const handleExportWithToast = () => {
    handleExport()
    toast({
      title: t.common.success,
      description: t.settings.exportSuccess,
    })
  }

  return (
    <div className="space-y-4">
      <SettingRow label={t.settings.export} description={t.settings.exportDesc}>
        <Button variant="outline" size="sm" onClick={handleExportWithToast} className="h-8 text-xs gap-1.5">
          <Download className="w-3.5 h-3.5" />
          {t.settings.export}
        </Button>
      </SettingRow>

      <SettingGroup bordered>
        <SettingRow label={t.settings.import} description={t.settings.importDesc}>
          <Button variant="outline" size="sm" onClick={openFilePicker} className="h-8 text-xs gap-1.5">
            <Upload className="w-3.5 h-3.5" />
            {t.settings.import}
          </Button>
        </SettingRow>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleFileSelect}
        />
        {importStatus && (
          <p className={cn(
            'text-xs mt-1',
            importStatus === 'success'
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-destructive'
          )}>
            {importStatus === 'success' ? t.settings.importSuccess : t.settings.importError}
          </p>
        )}
      </SettingGroup>

      <ImportDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        parsedData={parsedData}
        onConfirm={handleImportConfirm}
      />
    </div>
  )
}
