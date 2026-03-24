'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useStore, useLanguage } from '@/lib/store'
import { useTranslations } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { Trash2, StickyNote } from 'lucide-react'

interface DateNoteModalProps {
  open: boolean
  onClose: () => void
  date: string
}

export function DateNoteModal({ open, onClose, date }: DateNoteModalProps) {
  const lang = useLanguage()
  const t = useTranslations(lang)
  const { getDateNote, setDateNote, deleteDateNote } = useStore()
  const [content, setContent] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (open) {
      const note = getDateNote(date)
      setContent(note?.content ?? '')
      setShowDeleteConfirm(false)
    }
  }, [open, date, getDateNote])

  function handleSave() {
    if (content.trim()) {
      setDateNote(date, content.trim())
    } else {
      deleteDateNote(date)
    }
    onClose()
  }

  function handleDelete() {
    deleteDateNote(date)
    onClose()
  }

  const formattedDate = (() => {
    try {
      const d = new Date(date)
      return lang === 'zh' 
        ? format(d, 'yyyy年M月d日 EEEE', { locale: undefined })
        : format(d, 'EEEE, MMMM d, yyyy')
    } catch {
      return date
    }
  })()

  const existingNote = getDateNote(date)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StickyNote className="w-5 h-5 text-primary" />
            {t.dateNote.title}
          </DialogTitle>
          <p className="text-sm text-muted-foreground font-medium">
            {formattedDate}
          </p>
        </DialogHeader>

        <div className="py-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t.dateNote.placeholder}
            className="min-h-[120px] resize-none"
            autoFocus
          />
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {existingNote && !showDeleteConfirm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              {t.dateNote.delete}
            </Button>
          )}
          
          {showDeleteConfirm && (
            <div className="flex items-center gap-2 mr-auto">
              <span className="text-sm text-muted-foreground">{t.dateNote.deleteConfirm}</span>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
              >
                {t.common.confirm}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
              >
                {t.common.cancel}
              </Button>
            </div>
          )}

          <div className="flex gap-2 ml-auto">
            <Button variant="outline" size="sm" onClick={onClose}>
              {t.common.cancel}
            </Button>
            <Button size="sm" onClick={handleSave}>
              {t.common.save}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function DateNoteIndicator({ 
  content, 
  maxLines = 2,
  className 
}: { 
  content: string
  maxLines?: number
  className?: string 
}) {
  const lines = content.split('\n')
  const hasMore = lines.length > maxLines || content.length > 50
  const displayContent = lines.slice(0, maxLines).join('\n').slice(0, 50)

  return (
    <div 
      className={cn(
        "text-[10px] text-muted-foreground leading-tight mt-0.5 px-0.5",
        "line-clamp-2 overflow-hidden",
        className
      )}
      title={content}
    >
      <span className="inline-flex items-center gap-0.5">
        <StickyNote className="w-2.5 h-2.5 shrink-0 opacity-60" />
        <span className="truncate">{displayContent}{hasMore ? '...' : ''}</span>
      </span>
    </div>
  )
}
