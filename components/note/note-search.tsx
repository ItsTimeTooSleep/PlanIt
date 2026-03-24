'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { Search, X, Calendar, ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useStore, useLanguage } from '@/lib/store'
import { formatDate, NOTE_COLORS } from './note-utils'
import { cn } from '@/lib/utils'
import type { Note } from '@/lib/types'

interface NoteSearchPanelProps {
  isOpen: boolean
  onClose: () => void
  onJumpToDate: (date: Date) => void
}

interface SearchResult {
  note: Note
  matchedField: 'title' | 'content'
  matchedText: string
}

export function NoteSearchPanel({ isOpen, onClose, onJumpToDate }: NoteSearchPanelProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const { state } = useStore()
  const lang = useLanguage()

  const searchResults = useMemo((): SearchResult[] => {
    if (!searchQuery.trim()) return []

    const query = searchQuery.toLowerCase().trim()
    const results: SearchResult[] = []

    for (const note of state.notes) {
      const titleMatch = note.title.toLowerCase().includes(query)
      const contentText = note.content.replace(/<[^>]*>/g, '')
      const contentMatch = contentText.toLowerCase().includes(query)

      if (titleMatch || contentMatch) {
        let matchedText = ''
        if (titleMatch) {
          matchedText = note.title || (lang === 'zh' ? '(无标题)' : '(Untitled)')
        } else {
          const start = Math.max(0, contentText.toLowerCase().indexOf(query) - 20)
          const end = Math.min(contentText.length, start + query.length + 40)
          matchedText = (start > 0 ? '...' : '') + contentText.slice(start, end) + (end < contentText.length ? '...' : '')
        }

        results.push({
          note,
          matchedField: titleMatch ? 'title' : 'content',
          matchedText,
        })
      }
    }

    return results.sort((a, b) => {
      const dateA = new Date(a.note.date).getTime()
      const dateB = new Date(b.note.date).getTime()
      return dateB - dateA
    })
  }, [searchQuery, state.notes, lang])

  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {}

    for (const result of searchResults) {
      const date = result.note.date
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(result)
    }

    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]))
  }, [searchResults])

  const handleJumpToNote = useCallback((note: Note) => {
    onJumpToDate(new Date(note.date))
    onClose()
    setSearchQuery('')
  }, [onJumpToDate, onClose])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, searchResults.length - 1))
      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, 0))
      return
    }

    if (e.key === 'Enter' && searchResults[selectedIndex]) {
      e.preventDefault()
      handleJumpToNote(searchResults[selectedIndex].note)
      return
    }
  }, [onClose, searchResults, selectedIndex, handleJumpToNote])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
      setSelectedIndex(0)
    }
  }, [isOpen])

  useEffect(() => {
    setSelectedIndex(0)
  }, [searchQuery])

  const formatDateLabel = useCallback((dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const todayStr = formatDate(today)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = formatDate(yesterday)

    if (dateStr === todayStr) {
      return lang === 'zh' ? '今天' : 'Today'
    }
    if (dateStr === yesterdayStr) {
      return lang === 'zh' ? '昨天' : 'Yesterday'
    }

    return date.toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }, [lang])

  const highlightMatch = useCallback((text: string, query: string) => {
    if (!query.trim()) return text

    const lowerText = text.toLowerCase()
    const lowerQuery = query.toLowerCase()
    const index = lowerText.indexOf(lowerQuery)

    if (index === -1) return text

    const before = text.slice(0, index)
    const match = text.slice(index, index + query.length)
    const after = text.slice(index + query.length)

    return (
      <>
        {before}
        <mark className="bg-primary/30 text-foreground px-0.5 rounded">{match}</mark>
        {after}
      </>
    )
  }, [])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div
        className="absolute inset-0 bg-background/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl mx-4 animate-in slide-in-from-top-4 fade-in duration-300">
        <div className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border/50">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary">
              <Search className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <Input
                ref={inputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={lang === 'zh' ? '搜索笔记标题或内容...' : 'Search note title or content...'}
                className="border-0 bg-transparent px-0 h-10 text-lg placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchQuery('')}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {!searchQuery.trim() && (
            <div className="px-5 py-8">
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">
                    {lang === 'zh' ? '快速搜索你的笔记' : 'Quick Search Your Notes'}
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    {lang === 'zh'
                      ? '输入关键词搜索所有笔记的标题和内容，快速找到你需要的内容'
                      : 'Enter keywords to search all note titles and content, quickly find what you need'}
                  </p>
                </div>

                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/50 text-xs text-muted-foreground">
                    <kbd className="px-1.5 py-0.5 rounded bg-background border text-[10px] font-mono">↑</kbd>
                    <kbd className="px-1.5 py-0.5 rounded bg-background border text-[10px] font-mono">↓</kbd>
                    <span>{lang === 'zh' ? '导航' : 'Navigate'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/50 text-xs text-muted-foreground">
                    <kbd className="px-1.5 py-0.5 rounded bg-background border text-[10px] font-mono">Enter</kbd>
                    <span>{lang === 'zh' ? '跳转' : 'Jump'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/50 text-xs text-muted-foreground">
                    <kbd className="px-1.5 py-0.5 rounded bg-background border text-[10px] font-mono">Esc</kbd>
                    <span>{lang === 'zh' ? '关闭' : 'Close'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {searchQuery.trim() && searchResults.length === 0 && (
            <div className="px-5 py-12 text-center">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-muted/50 mx-auto mb-4">
                <Search className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">
                {lang === 'zh' ? `没有找到包含 "${searchQuery}" 的笔记` : `No notes found containing "${searchQuery}"`}
              </p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                {lang === 'zh' ? '尝试使用其他关键词' : 'Try different keywords'}
              </p>
            </div>
          )}

          {searchQuery.trim() && searchResults.length > 0 && (
            <ScrollArea className="max-h-[50vh]">
              <div className="px-3 py-2">
                <div className="flex items-center justify-between px-2 py-1.5 text-xs text-muted-foreground">
                  <span>
                    {lang === 'zh'
                      ? `找到 ${searchResults.length} 条笔记`
                      : `Found ${searchResults.length} note${searchResults.length > 1 ? 's' : ''}`}
                  </span>
                </div>

                {groupedResults.map(([date, results]) => (
                  <div key={date} className="mb-2">
                    <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{formatDateLabel(date)}</span>
                      <span className="text-muted-foreground/50">({results.length})</span>
                    </div>

                    {results.map((result, idx) => {
                      const globalIndex = searchResults.findIndex(r => r.note.id === result.note.id)
                      const isSelected = globalIndex === selectedIndex
                      const colorClasses = NOTE_COLORS[result.note.color]

                      return (
                        <button
                          key={result.note.id}
                          onClick={() => handleJumpToNote(result.note)}
                          onMouseEnter={() => setSelectedIndex(globalIndex)}
                          className={cn(
                            'w-full flex items-start gap-3 px-3 py-3 rounded-xl text-left transition-all duration-150',
                            isSelected
                              ? 'bg-primary/10 border border-primary/20'
                              : 'hover:bg-muted/50 border border-transparent'
                          )}
                        >
                          <div
                            className={cn(
                              'flex-shrink-0 w-3 h-3 rounded-full mt-1.5',
                              colorClasses.bg,
                              'border',
                              colorClasses.border
                            )}
                          />

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm truncate">
                                {highlightMatch(
                                  result.note.title || (lang === 'zh' ? '(无标题)' : '(Untitled)'),
                                  searchQuery
                                )}
                              </span>
                              {result.note.status === 'completed' && (
                                <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] rounded-full bg-success/20 text-success">
                                  {lang === 'zh' ? '已完成' : 'Done'}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {highlightMatch(result.matchedText, searchQuery)}
                            </p>
                          </div>

                          <div className="flex items-center gap-1 text-muted-foreground/50">
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {searchQuery.trim() && searchResults.length > 0 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-border/50 bg-muted/30 text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-background border text-[10px] font-mono">↑</kbd>
                  <kbd className="px-1.5 py-0.5 rounded bg-background border text-[10px] font-mono">↓</kbd>
                  <span className="ml-1">{lang === 'zh' ? '选择' : 'Select'}</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-background border text-[10px] font-mono">Enter</kbd>
                  <span className="ml-1">{lang === 'zh' ? '跳转到笔记' : 'Jump to note'}</span>
                </span>
              </div>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-background border text-[10px] font-mono">Esc</kbd>
                <span className="ml-1">{lang === 'zh' ? '关闭' : 'Close'}</span>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
