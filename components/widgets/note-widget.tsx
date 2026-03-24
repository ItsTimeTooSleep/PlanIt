'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { Lightbulb, Send, Sparkles, Save, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useStore, useLanguage } from '@/lib/store'
import { toast } from 'sonner'
import type { Note } from '@/lib/types'
import { cn } from '@/lib/utils'
import type { BaseWidgetProps } from '@/lib/widget-types'

type SizeMode = 'compact' | 'normal' | 'large' | 'wide'

interface ContainerSize {
  width: number
  height: number
}

function getNextZIndex(notes: Note[]): number {
  if (notes.length === 0) return 1
  return Math.max(...notes.map(n => n.zIndex)) + 1
}

/**
 * 快速笔记组件
 * @param props - 组件属性
 * @param props.id - 组件实例ID
 * @param props.config - 组件配置
 * @param props.className - 自定义样式类
 * @returns 快速笔记组件
 */
export function NoteWidget({ id, config, className }: BaseWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [sizeMode, setSizeMode] = useState<SizeMode>('normal')
  const [containerSize, setContainerSize] = useState<ContainerSize>({ width: 280, height: 150 })
  
  const [content, setContent] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const { addNote, getNotesByDate } = useStore()
  const lang = useLanguage()

  const showHeader = (config?.showHeader as boolean) ?? true
  const placeholder = (config?.placeholder as string) || ''
  const autoSave = (config?.autoSave as boolean) ?? false
  const maxLength = (config?.maxLength as number) ?? 1000

  useEffect(() => {
    const updateSizeMode = () => {
      const el = containerRef.current
      if (!el) return
      const { width, height } = el.getBoundingClientRect()
      setContainerSize({ width, height })
      
      const isShort = height < 100
      
      if (height < 100) {
        setSizeMode('compact')
      } else if (width > 380 && height > 200) {
        setSizeMode('wide')
      } else if (height > 250) {
        setSizeMode('large')
      } else {
        setSizeMode('normal')
      }
    }

    updateSizeMode()
    window.addEventListener('resize', updateSizeMode)
    return () => window.removeEventListener('resize', updateSizeMode)
  }, [])

  const todayStr = new Date().toISOString().split('T')[0]
  const todayNotes = getNotesByDate(todayStr)

  const hasContent = content.trim().length > 0
  const charCount = content.length
  const showCharCount = maxLength > 0 && sizeMode !== 'compact'

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

  const titleFontSize = useMemo(() => {
    switch (sizeMode) {
      case 'compact': return 'text-[10px]'
      case 'large': return 'text-sm'
      default: return 'text-xs'
    }
  }, [sizeMode])

  const textFontSize = useMemo(() => {
    switch (sizeMode) {
      case 'compact': return 'text-xs'
      case 'large': return 'text-base'
      default: return 'text-sm'
    }
  }, [sizeMode])

  const showHeaderSection = showHeader

  return (
    <div ref={containerRef} className={cn('flex flex-col h-full bg-card rounded-xl border border-border overflow-hidden', className)}>
      {showHeaderSection && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50 bg-muted/30">
          <div className="relative">
            <Lightbulb className={cn('text-warning', 'w-4 h-4')} />
            {isFocused && (
              <Sparkles className="absolute -top-1 -right-1 w-2.5 h-2.5 text-warning/70 animate-pulse" />
            )}
          </div>
          <span className={cn('font-medium text-warning', titleFontSize)}>
            {lang === 'zh' ? '快速记录' : 'Quick Note'}
          </span>
        </div>
      )}

      <div className={cn('flex-1 flex flex-col', sizeMode === 'compact' ? 'p-1.5' : 'p-2')}>
        {justSaved ? (
          <div className={cn(
            'flex-1 flex items-center justify-center text-green-500 font-medium animate-fade-in',
            textFontSize
          )}>
            {lang === 'zh' ? '已成功保存' : 'Saved successfully'}
          </div>
        ) : (
          <>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, maxLength))}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder || (lang === 'zh' ? '记录你的瞬间想法...' : 'Capture your fleeting thoughts...')}
              className={cn(
                'flex-1 resize-none bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-1 placeholder:text-muted-foreground/60',
                textFontSize,
                sizeMode === 'compact' ? 'min-h-[40px]' : 'min-h-[50px]',
                'scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent'
              )}
            />

            <div
              className={cn(
                'flex items-center transition-all duration-300 overflow-hidden',
                hasContent && !justSaved ? 'max-h-10 opacity-100 mt-2' : 'max-h-0 opacity-0'
              )}
            >
              <div className="flex-1">
                {showCharCount && (
                  <span className="text-muted-foreground text-[10px]">
                    {charCount}/{maxLength}
                  </span>
                )}
              </div>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="rounded-lg bg-warning text-warning-foreground shadow-md h-7 px-3 text-xs"
              >
                <Send className="w-3 h-3 mr-1.5" />
                {lang === 'zh' ? '保存' : 'Save'}
              </Button>
            </div>
          </>
        )}

        {!hasContent && isFocused && !justSaved && (
          <div className="text-[10px] text-muted-foreground/50 text-right mt-1">
            {lang === 'zh' ? '⌘ + Enter' : 'Ctrl/⌘ + ↵'}
          </div>
        )}
      </div>
    </div>
  )
}
