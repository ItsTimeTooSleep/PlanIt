'use client'

import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/store'
import { useTranslations } from '@/lib/i18n'
import { useDataExport, useDataImport } from './use-data-management'
import { ImportDialog } from './import-dialog'
import { Download, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'

export function DataManagement() {
  const lang = useLanguage()
  const t = useTranslations(lang)
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between py-1">
        <div>
          <p className="text-sm font-medium">{t.settings.export}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{t.settings.exportDesc}</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport} className="h-8 text-xs">
          <Download className="w-3.5 h-3.5 mr-1.5" />
          {t.settings.export}
        </Button>
      </div>

      <div className="border-t border-border/50 pt-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-medium">{t.settings.import}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t.settings.importDesc}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={openFilePicker} className="h-8 text-xs">
          <Upload className="w-3.5 h-3.5 mr-1.5" />
          {t.settings.import}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleFileSelect}
        />
        {importStatus && (
          <p className={cn(
            'text-xs mt-2',
            importStatus === 'success'
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-destructive'
          )}>
            {importStatus === 'success' ? t.settings.importSuccess : t.settings.importError}
          </p>
        )}
      </div>

      <ImportDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        parsedData={parsedData}
        onConfirm={handleImportConfirm}
      />
    </div>
  )
}
