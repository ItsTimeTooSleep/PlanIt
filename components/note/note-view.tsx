'use client'

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { Plus, ChevronLeft, ChevronRight, Calendar, Trash2, Edit2, StickyNote, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Empty } from '@/components/ui/empty'
import { useStore, useLanguage } from '@/lib/store'
import { useTranslations } from '@/lib/i18n'
import { NoteEditor } from './note-editor'
import { NoteCard } from './note-card'
import { NoteLineComponent } from './note-line'
import { NoteSearchPanel } from './note-search'
import { formatDate, getRelativeDateStr, createEmptyNote, NOTE_COLORS, getNextZIndex, clampToBounds, NOTE_LINE_COLORS } from './note-utils'
import { cn } from '@/lib/utils'
import type { Note, NoteColor, NoteLineType, NoteLineColor, NoteLine } from '@/lib/types'

export function NoteView() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [deleteNoteToDelete, setDeleteNoteToDelete] = useState<string | null>(null)
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null)
  const [connectingMousePos, setConnectingMousePos] = useState<{ x: number; y: number } | null>(null)
  const [editingLine, setEditingLine] = useState<NoteLine | null>(null)
  const [viewingConnectionsNote, setViewingConnectionsNote] = useState<string | null>(null)
  const [deleteLineToDelete, setDeleteLineToDelete] = useState<string | null>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 800 })
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragMouseY, setDragMouseY] = useState(0)
  const canvasRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const autoScrollRef = useRef<number | null>(null)
  const { state, addNote, updateNote, deleteNote, getNotesByDate, addNoteLine, updateNoteLine, deleteNoteLine, getNoteLinesByDate } = useStore()
  const lang = useLanguage()
  const t = useTranslations(lang)

  const dateStr = formatDate(currentDate)
  const todayStr = formatDate(new Date())
  const isToday = dateStr === todayStr
  const notes = getNotesByDate(dateStr)
  const noteLines = getNoteLinesByDate(dateStr)
  const activeNotes = notes.filter(n => n.status === 'active')
  const completedNotes = notes.filter(n => n.status === 'completed')

  const sortedNotes = useMemo(() => {
    return [...notes].sort((a, b) => (a.zIndex || 1) - (b.zIndex || 1))
  }, [notes])

  const getNoteConnections = useCallback((noteId: string) => {
    return noteLines.filter(l => l.fromNoteId === noteId || l.toNoteId === noteId)
  }, [noteLines])

  const hasConnections = useCallback((noteId: string) => {
    return getNoteConnections(noteId).length > 0
  }, [getNoteConnections])

  useEffect(() => {
    const updateSize = () => {
      if (innerRef.current) {
        setCanvasSize({
          width: innerRef.current.clientWidth,
          height: innerRef.current.clientHeight,
        })
      }
    }

    const resizeObserver = new ResizeObserver(updateSize)
    if (innerRef.current) {
      resizeObserver.observe(innerRef.current)
      updateSize()
    }

    return () => resizeObserver.disconnect()
  }, [])

  /**
   * 处理拖拽时的自动滚动
   * @param isDragging - 是否正在拖拽
   * @param mouseY - 鼠标Y坐标
   */
  const handleDragStateChange = useCallback((isDragging: boolean, mouseY: number) => {
    setIsDragging(isDragging)
    setDragMouseY(mouseY)
  }, [])

  useEffect(() => {
    if (!isDragging || !canvasRef.current) {
      if (autoScrollRef.current) {
        cancelAnimationFrame(autoScrollRef.current)
        autoScrollRef.current = null
      }
      return
    }

    const AUTO_SCROLL_ZONE = 80
    const AUTO_SCROLL_SPEED = 8

    const autoScroll = () => {
      if (!canvasRef.current || !isDragging) return

      const rect = canvasRef.current.getBoundingClientRect()
      const scrollTop = canvasRef.current.scrollTop
      const viewportHeight = rect.height
      const mouseY = dragMouseY

      if (mouseY < rect.top + AUTO_SCROLL_ZONE) {
        const distance = rect.top + AUTO_SCROLL_ZONE - mouseY
        const speed = Math.min(AUTO_SCROLL_SPEED, distance * 0.1)
        canvasRef.current.scrollTop = Math.max(0, scrollTop - speed)
      } else if (mouseY > rect.bottom - AUTO_SCROLL_ZONE) {
        const distance = mouseY - (rect.bottom - AUTO_SCROLL_ZONE)
        const speed = Math.min(AUTO_SCROLL_SPEED, distance * 0.1)
        canvasRef.current.scrollTop = scrollTop + speed

        if (innerRef.current) {
          const innerHeight = innerRef.current.clientHeight
          const scrollBottom = scrollTop + viewportHeight
          if (scrollBottom >= innerHeight - 50) {
            const newHeight = innerHeight + 200
            innerRef.current.style.minHeight = `${newHeight}px`
            setCanvasSize(prev => ({ ...prev, height: newHeight }))
          }
        }
      }

      autoScrollRef.current = requestAnimationFrame(autoScroll)
    }

    autoScrollRef.current = requestAnimationFrame(autoScroll)

    return () => {
      if (autoScrollRef.current) {
        cancelAnimationFrame(autoScrollRef.current)
        autoScrollRef.current = null
      }
    }
  }, [isDragging, dragMouseY])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsSearchOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (!connectingFrom) {
      setConnectingMousePos(null)
      return
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect()
        setConnectingMousePos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        })
      }
    }

    const handleMouseUp = (e: MouseEvent) => {
      if (connectingFrom) {
        const target = e.target as HTMLElement
        const cardElement = target.closest('[data-note-id]')
        if (cardElement) {
          const toId = cardElement.getAttribute('data-note-id')
          if (toId && toId !== connectingFrom) {
            const now = new Date().toISOString()
            addNoteLine({
              id: `line-${Date.now()}`,
              date: dateStr,
              fromNoteId: connectingFrom,
              toNoteId: toId,
              type: 'arrow',
              color: 'gray',
              createdAt: now,
            })
          }
        }
      }
      setConnectingFrom(null)
      setConnectingMousePos(null)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [connectingFrom, dateStr, addNoteLine])

  const handleCreateNote = useCallback(() => {
    const now = new Date().toISOString()
    const empty = createEmptyNote(dateStr, notes)
    const newNote: Note = {
      id: `note-${Date.now()}`,
      date: dateStr,
      ...empty,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    }
    setEditingNote(newNote)
    setIsEditorOpen(true)
  }, [dateStr, notes])

  const handleEditNote = useCallback((note: Note) => {
    setEditingNote({ ...note })
    setIsEditorOpen(true)
  }, [])

  const handleSaveNote = useCallback(() => {
    if (!editingNote) return
    const existing = state.notes.find(n => n.id === editingNote.id)
    if (existing) {
      updateNote(editingNote.id, editingNote)
    } else {
      addNote(editingNote)
    }
    setIsEditorOpen(false)
    setEditingNote(null)
  }, [editingNote, state.notes, addNote, updateNote])

  const handleDeleteNote = useCallback((id: string) => {
    setDeleteNoteToDelete(id)
  }, [])

  const confirmDelete = useCallback(() => {
    if (deleteNoteToDelete) {
      deleteNote(deleteNoteToDelete)
      const linesToDelete = noteLines.filter(
        l => l.fromNoteId === deleteNoteToDelete || l.toNoteId === deleteNoteToDelete
      )
      linesToDelete.forEach(l => deleteNoteLine(l.id))
      setDeleteNoteToDelete(null)
    }
  }, [deleteNoteToDelete, deleteNote, noteLines, deleteNoteLine])

  const handleBringToFront = useCallback((id: string) => {
    const nextZIndex = getNextZIndex(notes)
    updateNote(id, { zIndex: nextZIndex })
  }, [notes, updateNote])

  const handleUpdateNote = useCallback((id: string, updates: Partial<Note>) => {
    if (updates.x !== undefined && updates.y !== undefined) {
      const note = notes.find(n => n.id === id)
      if (note) {
        const clamped = clampToBounds(
          updates.x,
          updates.y,
          note.width,
          note.height,
          canvasSize.width,
          canvasSize.height
        )
        updateNote(id, { ...updates, x: clamped.x, y: clamped.y })
        return
      }
    }
    updateNote(id, updates)
  }, [notes, canvasSize, updateNote])

  const handleStartConnection = useCallback((id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setConnectingFrom(id)
  }, [])

  const handleLineClick = useCallback((line: NoteLine) => {
    setEditingLine({ ...line })
  }, [])

  const handleSaveLine = useCallback(() => {
    if (editingLine) {
      updateNoteLine(editingLine.id, editingLine)
    }
    setEditingLine(null)
  }, [editingLine, updateNoteLine])

  const handleDeleteLine = useCallback((id: string) => {
    setDeleteLineToDelete(id)
  }, [])

  const confirmDeleteLine = useCallback(() => {
    if (deleteLineToDelete) {
      deleteNoteLine(deleteLineToDelete)
      setDeleteLineToDelete(null)
      setEditingLine(null)
    }
  }, [deleteLineToDelete, deleteNoteLine])

  const handleShowConnections = useCallback((id: string) => {
    setViewingConnectionsNote(id)
  }, [])

  const changeDate = useCallback((days: number) => {
    setCurrentDate(prev => {
      const next = new Date(prev)
      next.setDate(next.getDate() + days)
      return next
    })
  }, [])

  const goToToday = useCallback(() => {
    setCurrentDate(new Date())
  }, [])

  const previewLine: NoteLine | null = useMemo(() => {
    if (!connectingFrom) return null
    return {
      id: 'preview-line',
      date: dateStr,
      fromNoteId: connectingFrom,
      toNoteId: '',
      type: 'arrow',
      color: 'gray',
      createdAt: new Date().toISOString(),
    }
  }, [connectingFrom, dateStr])

  return (
    <div className="h-[calc(100vh-2.25rem)] flex flex-col p-6 ml-16">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t.note.title}</h1>
          <p className="text-muted-foreground">{t.note.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsSearchOpen(true)}>
            <Search className="w-4 h-4 mr-2" />
            {lang === 'zh' ? '搜索' : 'Search'}
            <kbd className="ml-2 px-1.5 py-0.5 text-[10px] rounded bg-muted border text-muted-foreground">
              ⌘K
            </kbd>
          </Button>
          <Button onClick={handleCreateNote}>
            <Plus className="w-4 h-4 mr-2" />
            {t.note.newNote}
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => changeDate(-1)}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex flex-col items-center">
          <h2 className="text-xl font-semibold">
            {getRelativeDateStr(currentDate, lang)}
          </h2>
          <p className="text-sm text-muted-foreground">
            {currentDate.toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => changeDate(1)}>
          <ChevronRight className="w-5 h-5" />
        </Button>
        {!isToday && (
          <Button variant="secondary" onClick={goToToday}>
            <Calendar className="w-4 h-4 mr-2" />
            {t.note.today}
          </Button>
        )}
      </div>

      <div
        ref={canvasRef}
        className="relative bg-muted/30 rounded-xl overflow-y-auto overflow-x-hidden flex-1"
      >
        <div
          ref={innerRef}
          className="relative w-full h-full min-w-[1200px] min-h-[800px]"
        >
          {notes.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Empty
                title={t.note.noNotes}
                description={t.note.noNotesDesc}
                icon={<StickyNote className="w-6 h-6" />}
                action={
                  <Button onClick={handleCreateNote}>
                    <Plus className="w-4 h-4 mr-2" />
                    {t.note.newNote}
                  </Button>
                }
              />
            </div>
          ) : (
            <>
              <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                {noteLines.map(line => (
                  <NoteLineComponent
                    key={line.id}
                    line={line}
                    notes={notes}
                    onClick={handleLineClick}
                  />
                ))}
              </svg>

              {previewLine && connectingMousePos && (
                <NoteLineComponent
                  line={previewLine}
                  notes={notes}
                  isPreview
                  previewTo={connectingMousePos}
                />
              )}

              {sortedNotes.map(note => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onUpdate={handleUpdateNote}
                  onDelete={handleDeleteNote}
                  onEdit={handleEditNote}
                  onBringToFront={handleBringToFront}
                  isConnecting={connectingFrom !== null}
                  onStartConnection={!connectingFrom ? handleStartConnection : undefined}
                  onShowConnections={handleShowConnections}
                  hasConnections={hasConnections(note.id)}
                  onDragStateChange={handleDragStateChange}
                />
              ))}
            </>
          )}
        </div>
      </div>

      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingNote && state.notes.find(n => n.id === editingNote.id)
                ? t.note.editNote
                : t.note.newNote}
            </DialogTitle>
          </DialogHeader>
          {editingNote && (
            <div className="space-y-4">
              <div>
                <Label>{t.task.title}</Label>
                <Input
                  value={editingNote.title}
                  onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                  placeholder={t.note.titlePlaceholder}
                />
              </div>
              <div>
                <Label>{t.note.colors.yellow.replace('黄色', '颜色')}</Label>
                <ToggleGroup
                  type="single"
                  value={editingNote.color}
                  onValueChange={(value) => {
                    if (value) {
                      setEditingNote({ ...editingNote, color: value as NoteColor })
                    }
                  }}
                  className="gap-3 py-2"
                >
                  {(Object.keys(NOTE_COLORS) as NoteColor[]).map(color => (
                    <ToggleGroupItem
                      key={color}
                      value={color}
                      className={cn(
                        'w-9 h-9 rounded-full transition-all duration-200',
                        NOTE_COLORS[color].bg,
                        NOTE_COLORS[color].border,
                        'border-2',
                        'hover:scale-110',
                        'data-[state=on]:ring-4 data-[state=on]:ring-primary/60',
                        'data-[state=on]:ring-offset-2',
                        'data-[state=on]:scale-110',
                        'data-[state=on]:shadow-lg'
                      )}
                      aria-label={t.note.colors[color]}
                    />
                  ))}
                </ToggleGroup>
              </div>
              <NoteEditor
                content={editingNote.content}
                onChange={(content) => setEditingNote({ ...editingNote, content })}
                placeholder={t.note.contentPlaceholder}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsEditorOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button onClick={handleSaveNote}>
              {t.common.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingLine} onOpenChange={(open) => !open && setEditingLine(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t.note.line.editLine}</DialogTitle>
          </DialogHeader>
          {editingLine && (
            <div className="space-y-4">
              <div>
                <Label>{t.note.line.lineType}</Label>
                <ToggleGroup
                  type="single"
                  value={editingLine.type}
                  onValueChange={(value) => {
                    if (value) {
                      setEditingLine({ ...editingLine, type: value as NoteLineType })
                    }
                  }}
                  className="gap-2"
                >
                  <ToggleGroupItem value="straight">{t.note.line.straight}</ToggleGroupItem>
                  <ToggleGroupItem value="arrow">{t.note.line.arrow}</ToggleGroupItem>
                </ToggleGroup>
              </div>
              <div>
                <Label>{t.note.line.lineColor}</Label>
                <ToggleGroup
                  type="single"
                  value={editingLine.color}
                  onValueChange={(value) => {
                    if (value) {
                      setEditingLine({ ...editingLine, color: value as NoteLineColor })
                    }
                  }}
                  className="gap-3 flex-wrap py-2"
                >
                  {(Object.keys(NOTE_LINE_COLORS) as NoteLineColor[]).map(color => (
                    <ToggleGroupItem
                      key={color}
                      value={color}
                      className="w-9 h-9 rounded-full border-2 transition-all duration-200 hover:scale-110 data-[state=on]:ring-4 data-[state=on]:ring-primary/60 data-[state=on]:ring-offset-2 data-[state=on]:scale-110 data-[state=on]:shadow-lg"
                      style={{ backgroundColor: NOTE_LINE_COLORS[color] }}
                      aria-label={color}
                    />
                  ))}
                </ToggleGroup>
              </div>
            </div>
          )}
          <DialogFooter className="flex justify-between">
            <Button
              variant="destructive"
              onClick={() => handleDeleteLine(editingLine?.id || '')}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {t.note.line.deleteLine}
            </Button>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setEditingLine(null)}>
                {t.common.cancel}
              </Button>
              <Button onClick={handleSaveLine}>
                {t.common.save}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingConnectionsNote} onOpenChange={(open) => !open && setViewingConnectionsNote(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t.note.line.viewConnections}</DialogTitle>
          </DialogHeader>
          {viewingConnectionsNote && (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {getNoteConnections(viewingConnectionsNote).length === 0 ? (
                <p className="text-muted-foreground text-center py-4">{t.note.line.noConnections}</p>
              ) : (
                getNoteConnections(viewingConnectionsNote).map(line => {
                  const fromNote = notes.find(n => n.id === line.fromNoteId)
                  const toNote = notes.find(n => n.id === line.toNoteId)
                  const isFrom = line.fromNoteId === viewingConnectionsNote
                  const otherNote = isFrom ? toNote : fromNote
                  return (
                    <div
                      key={line.id}
                      className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50"
                      onClick={() => {
                        setViewingConnectionsNote(null)
                        setEditingLine({ ...line })
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: NOTE_LINE_COLORS[line.color] }}
                        />
                        <span>
                          {isFrom ? '→ ' : '← '}
                          {otherNote?.title || (otherNote?.content.slice(0, 20) + '...') || '未命名'}
                        </span>
                      </div>
                      <Edit2 className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )
                })
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="secondary" onClick={() => setViewingConnectionsNote(null)}>
              {t.common.close}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteNoteToDelete} onOpenChange={(open) => !open && setDeleteNoteToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.note.deleteNote}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.note.deleteConfirm}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              <Trash2 className="w-4 h-4 mr-2" />
              {t.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteLineToDelete} onOpenChange={(open) => !open && setDeleteLineToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.note.line.deleteLine}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.note.line.deleteLineConfirm}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteLine} className="bg-destructive hover:bg-destructive/90">
              <Trash2 className="w-4 h-4 mr-2" />
              {t.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <NoteSearchPanel
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onJumpToDate={(date) => setCurrentDate(date)}
      />
    </div>
  )
}
