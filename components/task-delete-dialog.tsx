'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useLanguage } from '@/lib/store'
import { useTranslations } from '@/lib/i18n'
import type { DeleteRecurringOption } from '@/lib/types'

interface TaskDeleteDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: (option: DeleteRecurringOption) => void
  isRecurring: boolean
}

export function TaskDeleteDialog({ open, onClose, onConfirm, isRecurring }: TaskDeleteDialogProps) {
  const lang = useLanguage()
  const t = useTranslations(lang)
  const [selectedOption, setSelectedOption] = useState<DeleteRecurringOption>('only_this')

  useEffect(() => {
    if (open) {
      setSelectedOption('only_this')
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t.task.deleteConfirmTitle}</DialogTitle>
          <DialogDescription>
            {t.task.deleteConfirm}
          </DialogDescription>
        </DialogHeader>

        {isRecurring && (
          <div className="py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="delete-option-select">{lang === 'zh' ? '删除选项' : 'Delete Options'}</Label>
              <Select value={selectedOption} onValueChange={(v) => setSelectedOption(v as DeleteRecurringOption)}>
                <SelectTrigger id="delete-option-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="only_this">{t.task.deleteOptionOnlyThis}</SelectItem>
                  <SelectItem value="all">{t.task.deleteOptionAll}</SelectItem>
                  <SelectItem value="future">{t.task.deleteOptionFuture}</SelectItem>
                  <SelectItem value="pending">{t.task.deleteOptionPending}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <DialogFooter className="flex sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => onConfirm(isRecurring ? selectedOption : 'only_this')}
          >
            {t.common.delete}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
