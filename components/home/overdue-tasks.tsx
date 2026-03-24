'use client'

import { AlertCircle } from 'lucide-react'
import type { Task, Tag } from '@/lib/types'
import { DEFAULT_TAG_COLOR } from '@/lib/colors'

interface OverdueTasksProps {
  tasks: Task[]
  tags: Tag[]
  lang: 'zh' | 'en'
  onTaskClick: (task: Task) => void
  onTaskDone: (task: Task) => void
  onTaskSkip: (task: Task) => void
}

export function OverdueTasks({ tasks, tags, lang, onTaskClick, onTaskDone, onTaskSkip }: OverdueTasksProps) {
  if (tasks.length === 0) return null

  return (
    <div className="shrink-0 px-6 py-4 border-b" style={{ backgroundColor: 'color-mix(in srgb, var(--warning) 10%, transparent)' }}>
      <div className="flex items-center gap-2 mb-2">
        <AlertCircle className="w-4 h-4 shrink-0" style={{ color: 'var(--warning)' }} />
        <span className="text-sm font-semibold" style={{ color: 'var(--warning-foreground)' }}>
          {lang === 'zh' ? `${tasks.length} 项任务已过期` : `${tasks.length} overdue task${tasks.length > 1 ? 's' : ''}`}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {tasks.map(task => (
          <OverdueRow
            key={task.id}
            task={task}
            tags={tags}
            lang={lang}
            onClick={() => onTaskClick(task)}
            onDone={() => onTaskDone(task)}
            onSkip={() => onTaskSkip(task)}
          />
        ))}
      </div>
    </div>
  )
}

function OverdueRow({ task, tags, lang, onClick, onDone, onSkip }: {
  task: Task
  tags: { id: string; color: string; name: string }[]
  lang: 'zh' | 'en'
  onClick: () => void
  onDone: () => void
  onSkip: () => void
}) {
  const primaryTag = tags.find(tg => task.tagIds[0] === tg.id)
  const color = primaryTag?.color ?? DEFAULT_TAG_COLOR

  return (
    <div className="flex items-center gap-3 rounded-lg px-3 py-2 border" style={{ backgroundColor: 'color-mix(in srgb, var(--background) 70%, transparent)', borderColor: 'color-mix(in srgb, var(--warning) 20%, transparent)' }}>
      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
      <button type="button" onClick={onClick} className="flex-1 text-sm font-medium text-foreground text-left truncate hover:underline">
        {task.title}
      </button>
      <span className="text-xs text-muted-foreground tabular-nums shrink-0">
        {task.startTime}–{task.endTime}
      </span>
      <button
        type="button"
        onClick={onDone}
        className="shrink-0 text-xs px-2 py-1 rounded font-medium transition-colors"
        style={{ backgroundColor: 'color-mix(in srgb, var(--success) 15%, transparent)', color: 'var(--success)' }}
      >
        {lang === 'zh' ? '完成' : 'Done'}
      </button>
      <button
        type="button"
        onClick={onSkip}
        className="shrink-0 text-xs px-2 py-1 rounded bg-muted text-muted-foreground font-medium hover:bg-muted/80 transition-colors"
      >
        {lang === 'zh' ? '跳过' : 'Skip'}
      </button>
    </div>
  )
}
