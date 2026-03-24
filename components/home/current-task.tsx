'use client'

import { Clock, Play, Flame, Pause, Timer } from 'lucide-react'
import { useStore, useLanguage } from '@/lib/store'
import { useTranslations } from '@/lib/i18n'
import { format } from 'date-fns'
import { timeToMinutes } from '@/lib/task-utils'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatTime } from '@/lib/pomodoro-hooks'
import { DEFAULT_TAG_COLOR } from '@/lib/colors'

interface CurrentTaskProps {
  className?: string
  onOpenPomodoro?: (taskId: string) => void
}

export function CurrentTask({ className, onOpenPomodoro }: CurrentTaskProps) {
  const lang = useLanguage()
  const t = useTranslations(lang)
  const { state } = useStore()
  const { pomodoro, tasks } = state

  const today = format(new Date(), 'yyyy-MM-dd')
  const now = new Date()
  const nowMinutes = now.getHours() * 60 + now.getMinutes()

  const todayTasks = tasks.filter(task => task.date === today && !task.isAllDay && task.status === 'pending')

  let currentTask = null

  for (const task of todayTasks) {
    if (!task.startTime || !task.endTime) continue
    
    const startMinutes = timeToMinutes(task.startTime)
    const endMinutes = timeToMinutes(task.endTime)
    
    if (nowMinutes >= startMinutes && nowMinutes < endMinutes) {
      currentTask = task
      break
    }
  }

  if (!currentTask) {
    return null
  }

  const primaryTag = state.tags.find(tag => currentTask.tagIds[0] === tag.id)
  const color = primaryTag?.color ?? DEFAULT_TAG_COLOR

  const startMinutes = timeToMinutes(currentTask.startTime!)
  const endMinutes = timeToMinutes(currentTask.endTime!)
  const duration = endMinutes - startMinutes
  const elapsed = nowMinutes - startMinutes
  const progress = Math.min(Math.max(elapsed / duration, 0), 1)

  const isPomodoroActive = pomodoro.taskId === currentTask.id && 
    (pomodoro.status === 'running' || pomodoro.status === 'paused')
  const isPomodoroRunning = pomodoro.status === 'running'
  const isPomodoroPaused = pomodoro.status === 'paused'

  return (
    <div className={cn('px-4 py-3', className)}>
      <div className="relative overflow-hidden rounded-xl bg-card border border-border shadow-sm">
        <div 
          className="absolute inset-0 opacity-5"
          style={{ 
            background: `linear-gradient(90deg, ${color} 0%, transparent ${progress * 100}%)` 
          }}
        />
        
        <div className="relative flex items-center gap-4 p-4">
          <div 
            className={cn(
              'flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300',
              isPomodoroActive && 'animate-pulse'
            )}
            style={{ backgroundColor: color + '20' }}
          >
            {isPomodoroActive ? (
              <Timer className="w-6 h-6" style={{ color }} />
            ) : (
              <Flame className="w-6 h-6" style={{ color }} />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span 
                className={cn(
                  'text-xs font-semibold px-2 py-0.5 rounded-full transition-colors duration-300',
                  isPomodoroRunning && 'bg-success text-success-foreground',
                  isPomodoroPaused && 'bg-warning text-warning-foreground',
                  !isPomodoroActive && ''
                )}
                style={!isPomodoroActive ? { backgroundColor: color, color: 'var(--primary-foreground)' } : {}}
              >
                {isPomodoroRunning 
                  ? (lang === 'zh' ? '正在专注' : 'Focusing')
                  : isPomodoroPaused 
                    ? (lang === 'zh' ? '已暂停' : 'Paused')
                    : t.pomodoro.focusNow
                }
              </span>
              {primaryTag && (
                <span className="text-xs text-muted-foreground">
                  {primaryTag.name}
                </span>
              )}
            </div>
            <h3 className="text-base font-semibold truncate">{currentTask.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Clock className="w-3 h-3 text-muted-foreground" />
              {isPomodoroActive ? (
                <span className="text-sm font-mono font-semibold tabular-nums" style={{ color }}>
                  {formatTime(pomodoro.remainingSeconds)}
                </span>
              ) : (
                <span className="text-sm text-muted-foreground tabular-nums">
                  {currentTask.startTime} – {currentTask.endTime}
                </span>
              )}
              {!isPomodoroActive && (
                <span className="text-xs text-muted-foreground">
                  ({Math.round((1 - progress) * duration)}{lang === 'zh' ? '分钟剩余' : 'min left'})
                </span>
              )}
            </div>
          </div>

          {onOpenPomodoro && (
            <Button
              size="sm"
              onClick={() => onOpenPomodoro(currentTask.id)}
              className={cn(
                'flex-shrink-0 transition-all duration-300',
                isPomodoroRunning && 'bg-success hover:bg-success/90',
                isPomodoroPaused && 'bg-warning hover:bg-warning/90'
              )}
            >
              {isPomodoroRunning ? (
                <>
                  <Pause className="w-4 h-4 mr-1" />
                  {lang === 'zh' ? '专注中' : 'Focusing'}
                </>
              ) : isPomodoroPaused ? (
                <>
                  <Play className="w-4 h-4 mr-1" />
                  {lang === 'zh' ? '继续专注' : 'Resume'}
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-1" />
                  {lang === 'zh' ? '开始专注' : 'Focus'}
                </>
              )}
            </Button>
          )}
        </div>

        <div className="h-1 bg-muted">
          <div 
            className={cn(
              'h-full transition-all duration-1000 ease-linear',
              isPomodoroActive && 'animate-pulse'
            )}
            style={{ 
              width: `${isPomodoroActive ? ((pomodoro.totalSeconds - pomodoro.remainingSeconds) / pomodoro.totalSeconds) * 100 : progress * 100}%`,
              backgroundColor: color
            }}
          />
        </div>
      </div>
    </div>
  )
}
