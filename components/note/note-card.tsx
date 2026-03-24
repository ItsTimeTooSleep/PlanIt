'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { X, CheckCircle2, Circle, Edit2, Trash2, GripVertical, Link2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Note, NoteColor, NoteStatus } from '@/lib/types'
import { NOTE_COLORS } from './note-utils'
import { useLanguage } from '@/lib/store'
import { useTranslations } from '@/lib/i18n'

interface NoteCardProps {
  note: Note
  onUpdate: (id: string, updates: Partial<Note>) => void
  onDelete: (id: string) => void
  onEdit: (note: Note) => void
  onBringToFront: (id: string) => void
  onStartConnection?: (id: string, e: React.MouseEvent) => void
  onShowConnections?: (id: string) => void
  hasConnections?: boolean
  isConnecting?: boolean
  onDragStateChange?: (isDragging: boolean, mouseY: number) => void
}

export function NoteCard({
  note,
  onUpdate,
  onDelete,
  onEdit,
  onBringToFront,
  onStartConnection,
  onShowConnections,
  hasConnections = false,
  isConnecting = false,
  onDragStateChange,
}: NoteCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const cardRef = useRef<HTMLDivElement>(null)
  const lang = useLanguage()
  const t = useTranslations(lang)

  const colorClasses = NOTE_COLORS[note.color]

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isConnecting) return
    if ((e.target as HTMLElement).closest('button')) return
    setIsDragging(true)
    setDragOffset({
      x: e.clientX - note.x,
      y: e.clientY - note.y,
    })
    onBringToFront(note.id)
    onDragStateChange?.(true, e.clientY)
  }, [note.id, note.x, note.y, onBringToFront, isConnecting, onDragStateChange])

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - dragOffset.x
      const newY = e.clientY - dragOffset.y
      onUpdate(note.id, { x: newX, y: newY })
      onDragStateChange?.(true, e.clientY)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      onDragStateChange?.(false, 0)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragOffset, note.id, onUpdate, onDragStateChange])

  const handleStatusToggle = useCallback(() => {
    onUpdate(note.id, {
      status: note.status === 'active' ? 'completed' : 'active',
    })
  }, [note.id, note.status, onUpdate])

  const handleConnectionStart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (onStartConnection) {
      onStartConnection(note.id, e)
    }
  }, [note.id, onStartConnection])

  return (
    <div
      ref={cardRef}
      data-note-id={note.id}
      className={cn(
        'absolute rounded-lg shadow-md cursor-move select-none',
        colorClasses.bg,
        colorClasses.border,
        colorClasses.text,
        'border-2',
        isHovered && !isDragging && !isConnecting && 'shadow-lg scale-[1.02]',
        isDragging && 'shadow-2xl scale-[1.03] opacity-90',
        note.status === 'completed' && 'opacity-60',
        isConnecting && 'ring-2 ring-primary ring-offset-2',
        isConnecting && 'cursor-pointer'
      )}
      style={{
        left: note.x,
        top: note.y,
        width: note.width,
        height: note.height,
        zIndex: note.zIndex || 1,
        transition: isDragging ? 'none' : 'transform 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={handleMouseDown}
    >
      {isHovered && onStartConnection && (
        <div
          className="absolute -top-4 left-1/2 -translate-x-1/2 z-50"
          onMouseDown={handleConnectionStart}
        >
          <Button
            variant="secondary"
            size="sm"
            className="h-7 w-7 p-0 rounded-full shadow-lg border-2 border-background"
          >
            <Link2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}

      <div className="relative h-full flex flex-col">
        <div
          className={cn(
            'flex items-center justify-between px-3 py-2 cursor-grab active:cursor-grabbing',
            'border-b',
            colorClasses.border
          )}
        >
          <div className="flex items-center gap-2">
            <GripVertical className="w-4 h-4 opacity-50" />
            <button
              onClick={handleStatusToggle}
              className="hover:scale-110 transition-transform"
              title={note.status === 'active' ? t.note.markComplete : t.note.markActive}
            >
              {note.status === 'completed' ? (
                <CheckCircle2 className="w-5 h-5 text-success" />
              ) : (
                <Circle className="w-5 h-5" />
              )}
            </button>
            {note.title && (
              <h3 className={cn(
                'font-semibold truncate',
                note.status === 'completed' && 'line-through'
              )}>
                {note.title}
              </h3>
            )}
          </div>
          {isHovered && (
            <div className="flex items-center gap-1">
              {hasConnections && onShowConnections && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    onShowConnections(note.id)
                  }}
                  title={t.note.line.viewConnections}
                >
                  <Link2 className="w-3.5 h-3.5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(note)
                }}
                title={t.note.editNote}
              >
                <Edit2 className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-destructive hover:text-destructive/80"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(note.id)
                }}
                title={t.note.deleteNote}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>
        <div className="flex-1 p-3 overflow-hidden">
          <div
            className={cn(
              'text-sm leading-relaxed overflow-hidden',
              note.status === 'completed' && 'line-through'
            )}
            dangerouslySetInnerHTML={{ __html: note.content }}
          />
        </div>
        <div className="px-3 pb-2 text-xs opacity-60">
          {new Date(note.updatedAt).toLocaleTimeString(lang === 'zh' ? 'zh-CN' : 'en-US', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  )
}
