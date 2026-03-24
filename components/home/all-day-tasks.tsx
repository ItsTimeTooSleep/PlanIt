'use client'

import type { Task, Tag } from '@/lib/types'
import { cn } from '@/lib/utils'
import { DEFAULT_TAG_COLOR } from '@/lib/colors'

interface AllDayTasksProps {
  tasks: Task[]
  tags: Tag[]
  onTaskClick: (task: Task) => void
  onTaskToggle: (task: Task) => void
}

export function AllDayTasks({ tasks, tags, onTaskClick, onTaskToggle }: AllDayTasksProps) {
  if (tasks.length === 0) return null

  return (
    <div className="shrink-0 px-6 py-3 flex flex-wrap gap-2 border-b border-border bg-muted/30">
      {tasks.map(task => (
        <AllDayChip
          key={task.id}
          task={task}
          tags={tags}
          onClick={() => onTaskClick(task)}
          onToggle={() => onTaskToggle(task)}
        />
      ))}
    </div>
  )
}

function AllDayChip({ task, tags, onClick, onToggle }: {
  task: Task
  tags: { id: string; color: string; name: string }[]
  onClick: () => void
  onToggle: () => void
}) {
  const primaryTag = tags.find(tg => task.tagIds[0] === tg.id)
  const color = primaryTag?.color ?? DEFAULT_TAG_COLOR
  const isDone = task.status === 'completed'

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-opacity',
        isDone && 'opacity-50'
      )}
      style={{ backgroundColor: color + '18', color, border: `1px solid ${color}40` }}
    >
      <span
        onClick={e => { e.stopPropagation(); onToggle() }}
        className={cn(
          'w-4 h-4 rounded-full border flex items-center justify-center transition-colors',
        )}
        style={{ borderColor: color, backgroundColor: isDone ? color : 'transparent' }}
      >
        {isDone && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
      </span>
      <span className={cn(isDone && 'line-through')}>{task.title}</span>
    </button>
  )
}
