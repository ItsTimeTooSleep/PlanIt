'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useLanguage } from '@/lib/store'
import { useTranslations } from '@/lib/i18n'

interface UpdateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  version: string
  body?: string
  onUpdateNow: () => void
  onRemindLater: (skipThisVersion: boolean) => void
  isDownloading?: boolean
}

export function UpdateDialog({
  open,
  onOpenChange,
  version,
  body,
  onUpdateNow,
  onRemindLater,
  isDownloading = false,
}: UpdateDialogProps) {
  const lang = useLanguage()
  const t = useTranslations(lang)
  const [skipThisVersion, setSkipThisVersion] = useState(false)

  useEffect(() => {
    if (open) {
      setSkipThisVersion(false)
    }
  }, [open])

  const renderMarkdown = (text: string) => {
    if (!text) return null
    return (
      <div className="text-sm text-muted-foreground whitespace-pre-wrap">
        {text}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {t.update.updateAvailable} {version}
          </DialogTitle>
          <DialogDescription>
            {t.update.updateDesc}
          </DialogDescription>
        </DialogHeader>

        {body && (
          <div className="mt-2">
            <ScrollArea className="h-40 rounded-md border p-3">
              {renderMarkdown(body)}
            </ScrollArea>
          </div>
        )}

        <div className="flex items-center space-x-2 mt-4">
          <Checkbox
            id="skip-this-version"
            checked={skipThisVersion}
            onCheckedChange={(checked) => setSkipThisVersion(checked as boolean)}
            disabled={isDownloading}
          />
          <label
            htmlFor="skip-this-version"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {t.update.skipThisVersion}
          </label>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0 mt-4">
          <Button
            variant="secondary"
            onClick={() => onRemindLater(skipThisVersion)}
            disabled={isDownloading}
          >
            {t.update.remindLater}
          </Button>
          <Button
            onClick={onUpdateNow}
            disabled={isDownloading}
          >
            {isDownloading ? t.update.downloading : t.update.updateNow}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
