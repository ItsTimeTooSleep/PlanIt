'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import type { Note, NoteLine, NoteLineType, NoteLineColor } from '@/lib/types'
import { NOTE_LINE_COLORS } from './note-utils'
import { NOTE_LINE_COLORS as CSS_NOTE_LINE_COLORS } from '@/lib/colors'

interface NoteLineComponentProps {
  line: NoteLine
  notes: Note[]
  onClick?: (line: NoteLine) => void
  isPreview?: boolean
  previewTo?: { x: number; y: number }
}

function getConnectionPoints(
  fromNote: Note,
  toNote: Note
): { x1: number; y1: number; x2: number; y2: number } {
  const fromCenterX = fromNote.x + fromNote.width / 2
  const fromCenterY = fromNote.y + fromNote.height / 2
  const toCenterX = toNote.x + toNote.width / 2
  const toCenterY = toNote.y + toNote.height / 2

  const dx = toCenterX - fromCenterX
  const dy = toCenterY - fromCenterY

  let x1 = fromCenterX
  let y1 = fromCenterY
  let x2 = toCenterX
  let y2 = toCenterY

  const arrowOffset = 12

  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 0) {
      x1 = fromNote.x + fromNote.width
      x2 = toNote.x - arrowOffset
    } else {
      x1 = fromNote.x
      x2 = toNote.x + toNote.width + arrowOffset
    }
  } else {
    if (dy > 0) {
      y1 = fromNote.y + fromNote.height
      y2 = toNote.y - arrowOffset
    } else {
      y1 = fromNote.y
      y2 = toNote.y + toNote.height + arrowOffset
    }
  }

  return { x1, y1, x2, y2 }
}

function getPreviewConnectionPoints(
  fromNote: Note,
  toX: number,
  toY: number
): { x1: number; y1: number; x2: number; y2: number } {
  const fromCenterX = fromNote.x + fromNote.width / 2
  const fromCenterY = fromNote.y + fromNote.height / 2

  const dx = toX - fromCenterX
  const dy = toY - fromCenterY

  let x1 = fromCenterX
  let y1 = fromCenterY

  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 0) {
      x1 = fromNote.x + fromNote.width
    } else {
      x1 = fromNote.x
    }
  } else {
    if (dy > 0) {
      y1 = fromNote.y + fromNote.height
    } else {
      y1 = fromNote.y
    }
  }

  return { x1, y1, x2: toX, y2: toY }
}

export function NoteLineComponent({ line, notes, onClick, isPreview, previewTo }: NoteLineComponentProps) {
  const fromNote = notes.find(n => n.id === line.fromNoteId)

  const linePath = useMemo(() => {
    if (!fromNote) return null

    if (isPreview && previewTo) {
      return getPreviewConnectionPoints(fromNote, previewTo.x, previewTo.y)
    }

    const toNote = notes.find(n => n.id === line.toNoteId)
    if (!toNote) return null

    return getConnectionPoints(fromNote, toNote)
  }, [fromNote, notes, line.toNoteId, isPreview, previewTo])

  if (!linePath) return null

  const color = isPreview ? CSS_NOTE_LINE_COLORS.blue : NOTE_LINE_COLORS[line.color]

  return (
    <svg
      className="absolute top-0 left-0 w-full h-full pointer-events-none"
      style={{ zIndex: isPreview ? 9999 : 0 }}
    >
      <defs>
        <marker
          id={`arrow-${line.id}`}
          markerWidth="12"
          markerHeight="12"
          refX="11"
          refY="6"
          orient="auto"
        >
          <polygon points="0 0, 12 6, 0 12" fill={color} />
        </marker>
      </defs>
      <line
        x1={linePath.x1}
        y1={linePath.y1}
        x2={linePath.x2}
        y2={linePath.y2}
        stroke={color}
        strokeWidth={isPreview ? 3 : 2}
        strokeLinecap="round"
        strokeDasharray={isPreview ? '5,5' : undefined}
        markerEnd={line.type === 'arrow' ? `url(#arrow-${line.id})` : undefined}
        className={cn(
          isPreview ? 'pointer-events-none' : 'pointer-events-auto cursor-pointer transition-all hover:stroke-3 hover:opacity-80'
        )}
        onClick={() => !isPreview && onClick?.(line)}
      />
    </svg>
  )
}
