'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useStore, useLanguage } from '@/lib/store'
import { useTranslations } from '@/lib/i18n'
import { generateId } from '@/lib/task-utils'
import type { Tag } from '@/lib/types'
import { Pencil, Trash2, Plus, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PRESET_TAG_COLORS } from '@/lib/colors'

interface DraggableTagItemProps {
  tag: Tag
  index: number
  onDragStart: (index: number) => void
  onDragOver: (index: number) => void
  onDragEnd: () => void
  isDragging: boolean
  onEdit: (tag: Tag) => void
  onDelete: (tag: Tag) => void
  t: ReturnType<typeof useTranslations>
}

function DraggableTagItem({
  tag,
  index,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragging,
  onEdit,
  onDelete,
  t,
}: DraggableTagItemProps) {
  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => {
        e.preventDefault()
        onDragOver(index)
      }}
      onDragEnd={onDragEnd}
      className={cn(
        'group flex items-center gap-3 py-2 px-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors cursor-grab active:cursor-grabbing allow-drag',
        isDragging && 'opacity-50 bg-muted/50'
      )}
    >
      <GripVertical className="w-4 h-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div
        className="w-2.5 h-2.5 rounded-full shrink-0"
        style={{ backgroundColor: tag.color }}
      />
      <span className="flex-1 text-sm">{tag.name}</span>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(tag)}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onDelete(tag)}
          className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

export function TagManagement() {
  const lang = useLanguage()
  const t = useTranslations(lang)
  const { state, addTag, updateTag, deleteTag, reorderTags } = useStore()
  const [tagDialog, setTagDialog] = useState<{ mode: 'add' | 'edit'; tag?: Tag } | null>(null)
  const [tagName, setTagName] = useState('')
  const [tagColor, setTagColor] = useState(PRESET_TAG_COLORS[0])
  const [customTagColor, setCustomTagColor] = useState('#000000')
  const [useCustomColor, setUseCustomColor] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [localTagOrder, setLocalTagOrder] = useState<string[]>([])

  function openAddTag() {
    setTagName('')
    setTagColor(PRESET_TAG_COLORS[0])
    setCustomTagColor('#000000')
    setUseCustomColor(false)
    setTagDialog({ mode: 'add' })
  }

  function openEditTag(tag: Tag) {
    setTagName(tag.name)
    setTagColor(tag.color)
    setCustomTagColor(tag.color)
    setUseCustomColor(!PRESET_TAG_COLORS.includes(tag.color))
    setTagDialog({ mode: 'edit', tag })
  }

  function handleSaveTag() {
    if (!tagName.trim()) return
    const selectedColor = useCustomColor ? customTagColor : tagColor
    if (tagDialog?.mode === 'edit' && tagDialog.tag) {
      updateTag(tagDialog.tag.id, { name: tagName.trim(), color: selectedColor })
    } else {
      addTag({ id: generateId(), name: tagName.trim(), color: selectedColor })
    }
    setTagDialog(null)
  }

  function handleDeleteTag(tag: Tag) {
    if (confirm(t.settings.tagDeleteConfirm)) {
      deleteTag(tag.id)
    }
  }

  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index)
    setLocalTagOrder(state.tags.map(t => t.id))
  }, [state.tags])

  const handleDragOver = useCallback((index: number) => {
    if (draggedIndex === null || draggedIndex === index) return

    setLocalTagOrder(prev => {
      const newOrder = [...prev]
      const [removed] = newOrder.splice(draggedIndex, 1)
      newOrder.splice(index, 0, removed)
      return newOrder
    })
    setDraggedIndex(index)
  }, [draggedIndex])

  const handleDragEnd = useCallback(() => {
    if (draggedIndex !== null) {
      reorderTags(localTagOrder)
    }
    setDraggedIndex(null)
  }, [draggedIndex, localTagOrder, reorderTags])

  const displayTags = draggedIndex !== null
    ? localTagOrder.map(id => state.tags.find(t => t.id === id)).filter((t): t is Tag => t !== undefined)
    : state.tags

  return (
    <div className="space-y-2">
      {state.tags.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">{t.common.noData}</p>
      ) : (
        <div className="space-y-1">
          {displayTags.map((tag, index) => (
            <DraggableTagItem
              key={tag.id}
              tag={tag}
              index={index}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              isDragging={draggedIndex === index}
              onEdit={openEditTag}
              onDelete={handleDeleteTag}
              t={t}
            />
          ))}
        </div>
      )}
      <button
        onClick={openAddTag}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
      >
        <Plus className="w-4 h-4" />
        {t.settings.addTag}
      </button>

      <Dialog open={!!tagDialog} onOpenChange={v => !v && setTagDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {tagDialog?.mode === 'edit' ? t.settings.editTag : t.settings.addTag}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-medium">{t.settings.tagName}</Label>
              <Input
                value={tagName}
                onChange={e => setTagName(e.target.value)}
                placeholder={t.settings.tagNamePlaceholder}
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleSaveTag()}
                className="h-9"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium">{t.settings.tagColor}</Label>
              <div className="flex gap-1.5 flex-wrap">
                {PRESET_TAG_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setTagColor(c)
                      setUseCustomColor(false)
                    }}
                    className={cn(
                      'w-6 h-6 rounded-full transition-transform',
                      !useCustomColor && tagColor === c ? 'ring-2 ring-foreground ring-offset-2 scale-110' : 'hover:scale-105'
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => setUseCustomColor(true)}
                  className={cn(
                    'w-6 h-6 rounded-full transition-transform',
                    useCustomColor ? 'ring-2 ring-foreground ring-offset-2 scale-110' : 'hover:scale-105'
                  )}
                  style={{ 
                    backgroundColor: useCustomColor ? customTagColor : '#e5e7eb',
                    backgroundImage: useCustomColor ? 'none' : 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)',
                    backgroundSize: '8px 8px'
                  }}
                />
              </div>
              {useCustomColor && (
                <div className="flex items-center gap-2 pt-1">
                  <div 
                    className="w-5 h-5 rounded-full border" 
                    style={{ backgroundColor: customTagColor }}
                  />
                  <input
                    type="color"
                    value={customTagColor}
                    onChange={e => setCustomTagColor(e.target.value)}
                    className="h-7 w-24 rounded border border-border"
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setTagDialog(null)} className="h-8">
              {t.common.cancel}
            </Button>
            <Button size="sm" onClick={handleSaveTag} disabled={!tagName.trim()} className="h-8">
              {t.common.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
