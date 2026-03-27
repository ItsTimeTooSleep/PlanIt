'use client'

import { useState } from 'react'
import { PlayCircle } from 'lucide-react'
import type { Task, Tag } from '@/lib/types'
import { timeToMinutes } from '@/lib/task-utils'
import { cn } from '@/lib/utils'
import { useStore, useLanguage } from '@/lib/store'
import { useTranslations } from '@/lib/i18n'
import { usePomodoro } from '@/lib/pomodoro-hooks'
import { DEFAULT_TAG_COLOR, POMODORO_COLORS } from '@/lib/colors'

/**
 * 检查任务是否正在执行中
 * @param task - 任务对象
 * @returns 是否正在执行
 */
function isTaskCurrentlyExecuting(task: Task): boolean {
  if (!task.startTime || !task.endTime || task.status !== 'pending') return false
  const now = new Date()
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const startMinutes = timeToMinutes(task.startTime)
  const endMinutes = timeToMinutes(task.endTime)
  return nowMinutes >= startMinutes && nowMinutes < endMinutes
}

/**
 * 获取任务的所有标签颜色
 * @param task - 任务对象
 * @param tags - 标签列表
 * @returns 标签颜色数组
 */
function getTaskTagColors(task: Task, tags: Tag[]): string[] {
  const colors = task.tagIds
    .map(tagId => tags.find(tg => tg.id === tagId)?.color)
    .filter((c): c is string => !!c)
  return colors.length > 0 ? colors : [DEFAULT_TAG_COLOR]
}

/**
 * 为颜色添加透明度（支持 CSS 变量）
 * @param color - 颜色值（可以是 CSS 变量）
 * @param opacity - 透明度百分比（0-100）
 * @returns 带透明度的颜色值
 */
function colorWithOpacity(color: string, opacity: number): string {
  return `color-mix(in srgb, ${color} ${opacity}%, transparent)`
}

interface TaskBlockProps {
  task: Task
  tags: Tag[]
  hourHeight: number
  timelineLeft: number
  onClick: () => void
  onToggle: () => void
  onOpenPomodoro?: (taskId: string) => void
  overrideTop?: number
  overrideHeight?: number
  overrideLeft?: number
  overrideWidth?: number
  compact?: boolean
}

/**
 * 任务块组件
 * 用于时间线视图中显示任务，支持完成状态切换和番茄钟
 */
export function TaskBlock({ 
  task, 
  tags, 
  hourHeight, 
  timelineLeft, 
  onClick, 
  onToggle, 
  onOpenPomodoro, 
  overrideTop, 
  overrideHeight,
  overrideLeft,
  overrideWidth
}: TaskBlockProps) {
  const [hovered, setHovered] = useState(false)
  const lang = useLanguage()
  const t = useTranslations(lang)
  const { state } = useStore()
  const { pomodoro } = usePomodoro()

  if (!task.startTime || !task.endTime) return null

  const startMin = timeToMinutes(task.startTime)
  const endMin = timeToMinutes(task.endTime)
  const durationMin = Math.max(endMin - startMin, 15)

  const top = overrideTop !== undefined ? overrideTop : (startMin / 60) * hourHeight
  const height = overrideHeight !== undefined ? overrideHeight : (durationMin / 60) * hourHeight
  const left = overrideLeft !== undefined ? overrideLeft : 0
  const width = overrideWidth !== undefined ? overrideWidth : 100

  const tagColors = getTaskTagColors(task, tags)
  const primaryColor = tagColors[0]
  const isDone = task.status === 'completed'
  const isSkipped = task.status === 'skipped'
  const isActivePomodoroTask = pomodoro.taskId === task.id
  const isExecuting = isTaskCurrentlyExecuting(task)

  /**
   * 处理任务点击事件
   * @param e - 鼠标事件
   */
  function handleTaskClick(e: React.MouseEvent) {
    e.stopPropagation()
    if (isExecuting && onOpenPomodoro) {
      onOpenPomodoro(task.id)
    } else {
      onClick()
    }
  }

  const showTime = height >= 24
  const showNotes = height >= 48 && task.notes
  const fontSize = height < 24 ? 'text-[9px]' : height < 36 ? 'text-[10px]' : 'text-xs'

  return (
    <div
      data-task-block="true"
      className={cn(
        'h-full cursor-pointer group transition-colors duration-150',
        isDone && 'opacity-60',
        isSkipped && 'opacity-40',
        isActivePomodoroTask && 'ring-2 ring-offset-1'
      )}
      style={{
        position: 'absolute',
        top: 0,
        left: `${left}%`,
        width: `${width}%`,
        outlineColor: primaryColor,
      }}
      onClick={handleTaskClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex h-full rounded-md overflow-hidden">
        <div className="flex flex-col w-1 shrink-0 rounded-l-md overflow-hidden">
          {tagColors.map((color, idx) => (
            <div key={idx} className="flex-1" style={{ backgroundColor: color }} />
          ))}
        </div>
        
        <div 
          className="flex-1 relative rounded-r-md"
          style={{ backgroundColor: colorWithOpacity(primaryColor, isDone || isSkipped ? 10 : 16) }}
        >
          <div className="flex items-start gap-1.5 px-2 py-1 h-full">
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onToggle() }}
              className="w-3.5 h-3.5 mt-0.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors"
              style={{ borderColor: primaryColor, backgroundColor: isDone ? primaryColor : 'transparent' }}
            >
              {isDone && (
                <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {isSkipped && (
                <svg className="w-2 h-2" style={{ color: primaryColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>

            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="flex items-center gap-1.5 min-w-0">
                <p
                  className={cn(
                    'font-semibold leading-tight truncate',
                    isDone && 'line-through',
                    fontSize
                  )}
                  style={{ color: primaryColor }}
                >
                  {task.title}
                </p>
                {isActivePomodoroTask && (
                  <span 
                    className="shrink-0 flex items-center gap-0.5 text-[9px] px-1 py-0.5 rounded-full"
                    style={{ backgroundColor: POMODORO_COLORS.work, color: 'var(--primary-foreground)' }}
                  >
                    <PlayCircle className="w-2.5 h-2.5" />
                    {t.pomodoro.focusNow}
                  </span>
                )}
              </div>
              {showTime && (
                <p className="text-[9px] text-muted-foreground leading-tight mt-0.5 tabular-nums">
                  {task.startTime} – {task.endTime}
                </p>
              )}
              {showNotes && (
                <p className="text-[9px] text-muted-foreground leading-snug mt-0.5 line-clamp-1 italic">
                  {task.notes}
                </p>
              )}
            </div>
          </div>

          {hovered && (
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
