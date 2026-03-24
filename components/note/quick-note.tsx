'use client'

import { useState, useCallback } from 'react'
import { Lightbulb, Send, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useStore, useLanguage } from '@/lib/store'
import { toast } from 'sonner'
import type { Note } from '@/lib/types'
import { getNextZIndex } from './note-utils'
import { cn } from '@/lib/utils'

interface QuickNoteProps {
  className?: string
}

export function QuickNote({ className }: QuickNoteProps) {
  const [content, setContent] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const { addNote, getNotesByDate } = useStore()
  const lang = useLanguage()

  const todayStr = new Date().toISOString().split('T')[0]
  const todayNotes = getNotesByDate(todayStr)

  const hasContent = content.trim().length > 0

  const handleSubmit = useCallback(() => {
    if (!hasContent) {
      toast.error(lang === 'zh' ? '请输入内容' : 'Please enter content')
      return
    }

    setIsSubmitting(true)

    const now = new Date().toISOString()
    const title = content.trim().slice(0, 20) + (content.trim().length > 20 ? '...' : '')
    const nextZIndex = getNextZIndex(todayNotes)

    const newNote: Note = {
      id: `note-${Date.now()}`,
      date: todayStr,
      title,
      content: content.trim(),
      color: 'yellow',
      status: 'active',
      width: 200,
      height: 150,
      x: 20 + (todayNotes.length % 5) * 30,
      y: 20 + (todayNotes.length % 5) * 30,
      zIndex: nextZIndex,
      createdAt: now,
      updatedAt: now,
    }

    addNote(newNote)
    setContent('')
    setIsSubmitting(false)
    setIsFocused(false)
    setJustSaved(true)

    setTimeout(() => {
      setJustSaved(false)
    }, 1500)
  }, [hasContent, content, lang, addNote, todayStr, todayNotes])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }, [handleSubmit])

  return (
    <div className={cn('relative group', className)}>
      <div 
        className={cn(
          'relative rounded-xl border transition-all duration-300 overflow-hidden bg-card'
        )}
        style={{
          borderColor: isFocused ? 'var(--warning)' : undefined,
          boxShadow: isFocused ? '0 4px 6px -1px color-mix(in srgb, var(--warning) 10%, transparent)' : undefined
        }}
      >
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50">
          <div className="relative">
            <Lightbulb className="w-4 h-4 text-warning" />
            {isFocused && (
              <Sparkles className="absolute -top-1 -right-1 w-2.5 h-2.5 text-warning/70 animate-pulse" />
            )}
          </div>
          <span className="text-xs font-medium text-warning">
            {lang === 'zh' ? '快速记录' : 'Quick Note'}
          </span>
        </div>

        <div className="p-2">
          {justSaved ? (
            <div className="min-h-[50px] flex items-center justify-center text-green-500 font-medium text-sm animate-fade-in">
              {lang === 'zh' ? '已成功保存' : 'Saved successfully'}
            </div>
          ) : (
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={handleKeyDown}
              placeholder={lang === 'zh' ? '记录你的瞬间想法...' : 'Capture your fleeting thoughts...'}
              className={cn(
                'min-h-[50px] max-h-[100px] resize-none text-sm bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-1 placeholder:text-muted-foreground/60',
                'scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent'
              )}
              rows={2}
            />
          )}

          <div 
            className={cn(
              'flex items-center justify-end transition-all duration-300 overflow-hidden',
              hasContent && !justSaved ? 'max-h-10 opacity-100 mt-2' : 'max-h-0 opacity-0'
            )}
          >
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={cn(
                'h-7 px-3 text-xs rounded-lg transition-all duration-300',
                'bg-warning text-warning-foreground shadow-md'
              )}
            >
              <Send className="w-3 h-3 mr-1.5" />
              {lang === 'zh' ? '保存' : 'Save'}
            </Button>
          </div>
        </div>

        {!hasContent && isFocused && !justSaved && (
          <div className="absolute bottom-2 right-2 text-[10px] text-muted-foreground/50">
            {lang === 'zh' ? '⌘ + Enter' : 'Ctrl/⌘ + ↵'}
          </div>
        )}
      </div>
    </div>
  )
}
