'use client'

import { useMemo, useRef, useEffect, useState } from 'react'
import { Flame, Clock, Play, Pause, Target, Timer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useStore, useLanguage } from '@/lib/store'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import type { BaseWidgetProps } from '@/lib/widget-types'
import type { Task, Tag } from '@/lib/types'
import { usePomodoro } from '@/lib/pomodoro-hooks'
import { DEFAULT_TAG_COLOR } from '@/lib/colors'

type SizeMode = 'compact' | 'normal' | 'large'
type WidthMode = 'narrow' | 'medium' | 'wide'

interface ContainerSize {
  width: number
  height: number
}

/**
 * 当前任务组件
 * @param props - 组件属性
 * @param props.id - 组件实例ID
 * @param props.config - 组件配置
 * @param props.className - 自定义样式类
 * @returns 当前任务组件
 */
export function CurrentTaskWidget({ id, config, className }: BaseWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [sizeMode, setSizeMode] = useState<SizeMode>('normal')
  const [widthMode, setWidthMode] = useState<WidthMode>('medium')
  const [containerSize, setContainerSize] = useState<ContainerSize>({ width: 300, height: 100 })
  const [now, setNow] = useState(new Date())
  
  const lang = useLanguage()
  const { state } = useStore()
  const { pomodoro, startTimer, pauseTimer } = usePomodoro()

  useEffect(() => {
    const updateSizeMode = () => {
      const el = containerRef.current
      if (!el) return
      const { width, height } = el.getBoundingClientRect()
      setContainerSize({ width, height })
      
      if (height < 70) {
        setSizeMode('compact')
      } else if (height > 140) {
        setSizeMode('large')
      } else {
        setSizeMode('normal')
      }

      if (width < 200) {
        setWidthMode('narrow')
      } else if (width > 400) {
        setWidthMode('wide')
      } else {
        setWidthMode('medium')
      }
    }

    updateSizeMode()
    window.addEventListener('resize', updateSizeMode)
    return () => window.removeEventListener('resize', updateSizeMode)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(interval)
  }, [])

  const today = format(new Date(), 'yyyy-MM-dd')
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  const currentTask = useMemo(() => {
    const todayTasks = state.tasks.filter(t => t.date === today && t.status === 'pending' && !t.isAllDay)
    
    for (const task of todayTasks) {
      if (task.startTime && task.endTime) {
        const [startH, startM] = task.startTime.split(':').map(Number)
        const [endH, endM] = task.endTime.split(':').map(Number)
        const startMinutes = startH * 60 + startM
        const endMinutes = endH * 60 + endM

        if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
          return { ...task, isActive: true }
        }
      }
    }

    const upcomingTasks = todayTasks
      .filter(t => t.startTime)
      .sort((a, b) => {
        const aStart = a.startTime!.split(':').map(Number)
        const bStart = b.startTime!.split(':').map(Number)
        return (aStart[0] * 60 + aStart[1]) - (bStart[0] * 60 + bStart[1])
      })

    for (const task of upcomingTasks) {
      const [startH, startM] = task.startTime!.split(':').map(Number)
      const startMinutes = startH * 60 + startM
      if (startMinutes > currentMinutes) {
        return { ...task, isActive: false }
      }
    }

    return null
  }, [state.tasks, today, currentMinutes])

  const getTaskFirstTag = (task: Task): Tag | null => {
    if (!task.tagIds || task.tagIds.length === 0) return null
    return state.tags.find(tag => tag.id === task.tagIds[0]) || null
  }

  const taskTag = currentTask ? getTaskFirstTag(currentTask) : null
  const tagColor = taskTag?.color || DEFAULT_TAG_COLOR

  const progress = useMemo(() => {
    if (!currentTask || !currentTask.isActive || !currentTask.startTime || !currentTask.endTime) return 0
    
    const [startH, startM] = currentTask.startTime.split(':').map(Number)
    const [endH, endM] = currentTask.endTime.split(':').map(Number)
    const startMinutes = startH * 60 + startM
    const endMinutes = endH * 60 + endM
    const total = endMinutes - startMinutes
    const elapsed = currentMinutes - startMinutes
    
    return Math.min(100, Math.max(0, (elapsed / total) * 100))
  }, [currentTask, currentMinutes])

  const getTimeRemaining = useMemo(() => {
    if (!currentTask || !currentTask.endTime) return null
    
    const [endH, endM] = currentTask.endTime.split(':').map(Number)
    const endMinutes = endH * 60 + endM
    const remaining = endMinutes - currentMinutes
    
    if (remaining <= 0) return null
    const hours = Math.floor(remaining / 60)
    const mins = remaining % 60
    
    if (hours > 0) {
      return lang === 'zh' ? `${hours}小时${mins}分钟` : `${hours}h ${mins}m`
    }
    return lang === 'zh' ? `${mins}分钟` : `${mins}m`
  }, [currentTask, currentMinutes, lang])

  const getTimeUntilStart = useMemo(() => {
    if (!currentTask || currentTask.isActive || !currentTask.startTime) return null
    
    const [startH, startM] = currentTask.startTime.split(':').map(Number)
    const startMinutes = startH * 60 + startM
    const until = startMinutes - currentMinutes
    
    if (until <= 0) return null
    const hours = Math.floor(until / 60)
    const mins = until % 60
    
    if (hours > 0) {
      return lang === 'zh' ? `${hours}小时${mins}分钟后开始` : `Starts in ${hours}h ${mins}m`
    }
    return lang === 'zh' ? `${mins}分钟后开始` : `Starts in ${mins}m`
  }, [currentTask, currentMinutes, lang])

  const isPomodoroActive = currentTask && pomodoro.taskId === currentTask.id && 
    (pomodoro.status === 'running' || pomodoro.status === 'paused')
  const isPomodoroRunning = pomodoro.status === 'running'
  const isPomodoroPaused = pomodoro.status === 'paused'

  const handleFocusClick = () => {
    if (isPomodoroRunning) {
      pauseTimer()
    } else {
      startTimer()
    }
  }

  const isNarrow = widthMode === 'narrow'
  const isWide = widthMode === 'wide'
  const isLarge = sizeMode === 'large'
  
  const iconSize = cn(
    sizeMode === 'compact' ? 'w-8 h-8' : isLarge ? 'w-14 h-14' : 'w-12 h-12',
    isNarrow && 'w-8 h-8'
  )
  const iconInnerSize = cn(
    sizeMode === 'compact' ? 'w-4 h-4' : isLarge ? 'w-7 h-7' : 'w-6 h-6',
    isNarrow && 'w-4 h-4'
  )
  const titleSize = cn(
    sizeMode === 'compact' ? 'text-sm' : isLarge ? 'text-lg' : 'text-base',
    isNarrow && 'text-sm'
  )
  const timeSize = cn(
    sizeMode === 'compact' ? 'text-xs' : isLarge ? 'text-base' : 'text-sm',
    isNarrow && 'text-xs'
  )
  const badgeSize = cn(
    sizeMode === 'compact' ? 'text-[10px] px-1.5 py-0.5' : isLarge ? 'text-sm px-3 py-1' : 'text-xs px-2 py-0.5',
    isNarrow && 'text-[10px] px-1.5 py-0.5'
  )
  const buttonSize = cn(
    sizeMode === 'compact' ? 'h-7 text-xs px-2' : isLarge ? 'h-10 text-base px-4' : 'h-8 text-sm px-3',
    isNarrow && 'h-7 text-xs px-2'
  )
  const showButton = containerSize.width >= 180
  const showProgressBar = containerSize.height >= 90
  const showDescription = isLarge && currentTask?.notes && !isNarrow
  const showTimeInfo = !isNarrow || containerSize.width >= 160

  return (
    <div ref={containerRef} className={cn('relative overflow-hidden flex flex-col h-full bg-card rounded-xl border border-border', className)}>
      {currentTask ? (
        <>
          <div 
            className="absolute inset-0 opacity-5"
            style={{ 
              background: `linear-gradient(90deg, ${tagColor} 0%, transparent ${progress}%)` 
            }}
          />
          
          <div className={cn(
            'relative flex flex-1',
            isNarrow ? 'flex-col items-center justify-center p-2 gap-2' : 'items-center gap-4',
            sizeMode === 'compact' && !isNarrow ? 'p-2' : isLarge ? 'p-5' : 'p-4'
          )}>
            <div 
              className={cn(
                'flex-shrink-0 rounded-xl flex items-center justify-center transition-all duration-300',
                iconSize,
                isPomodoroActive && 'animate-pulse'
              )}
              style={{ backgroundColor: `${tagColor}20` }}
            >
              {isPomodoroActive ? (
                <Timer className={iconInnerSize} style={{ color: tagColor }} />
              ) : (
                <Flame className={iconInnerSize} style={{ color: tagColor }} />
              )}
            </div>
            
            <div className={cn('flex-1 min-w-0', isNarrow && 'text-center')}>
              <div className={cn('flex items-center gap-2 mb-1', isNarrow && 'justify-center flex-wrap')}>
                <span 
                  className={cn(
                    'font-semibold rounded-full transition-colors duration-300',
                    badgeSize,
                    isPomodoroRunning && 'bg-success text-success-foreground',
                    isPomodoroPaused && 'bg-warning text-warning-foreground',
                    !isPomodoroActive && ''
                  )}
                  style={!isPomodoroActive ? { backgroundColor: tagColor, color: 'white' } : {}}
                >
                  {isPomodoroRunning 
                    ? (lang === 'zh' ? '正在专注' : 'Focusing')
                    : isPomodoroPaused 
                      ? (lang === 'zh' ? '已暂停' : 'Paused')
                      : currentTask.isActive 
                        ? (lang === 'zh' ? '进行中' : 'In Progress')
                        : (lang === 'zh' ? '即将开始' : 'Upcoming')
                  }
                </span>
                {taskTag && !isNarrow && sizeMode !== 'compact' && (
                  <span className="text-xs text-muted-foreground">
                    {taskTag.name}
                  </span>
                )}
              </div>
              
              <h3 className={cn('font-semibold truncate', titleSize, isNarrow && 'text-center')}>
                {currentTask.title}
              </h3>
              
              {showTimeInfo && (
                <div className={cn('flex items-center gap-2 mt-1', timeSize, isNarrow && 'justify-center')}>
                  <Clock className={cn('text-muted-foreground flex-shrink-0', sizeMode === 'compact' || isNarrow ? 'w-2.5 h-2.5' : 'w-3 h-3')} />
                  {isPomodoroActive ? (
                    <span className="font-mono font-semibold tabular-nums" style={{ color: tagColor }}>
                      {formatTime(pomodoro.remainingSeconds)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground tabular-nums truncate">
                      {currentTask.startTime} – {currentTask.endTime}
                    </span>
                  )}
                  {!isNarrow && !isPomodoroActive && getTimeRemaining && currentTask.isActive && (
                    <span className="text-muted-foreground hidden sm:inline">
                      ({lang === 'zh' ? `${getTimeRemaining}剩余` : `${getTimeRemaining} left`})
                    </span>
                  )}
                  {!isNarrow && !isPomodoroActive && getTimeUntilStart && !currentTask.isActive && (
                    <span className="text-muted-foreground hidden sm:inline">
                      ({getTimeUntilStart})
                    </span>
                  )}
                </div>
              )}

              {showDescription && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  {currentTask.notes}
                </p>
              )}
            </div>
            
            {showButton && !isNarrow && (
              <Button
                onClick={handleFocusClick}
                className={cn(
                  'flex-shrink-0 transition-all duration-300',
                  buttonSize,
                  isPomodoroRunning && 'bg-success hover:bg-success/90',
                  isPomodoroPaused && 'bg-warning hover:bg-warning/90'
                )}
              >
                {isPomodoroRunning ? (
                  <>
                    <Pause className={cn('mr-1', sizeMode === 'compact' ? 'w-3 h-3' : 'w-4 h-4')} />
                    {lang === 'zh' ? '暂停' : 'Pause'}
                  </>
                ) : (
                  <>
                    <Play className={cn('mr-1', sizeMode === 'compact' ? 'w-3 h-3' : 'w-4 h-4')} />
                    {lang === 'zh' ? '开始专注' : 'Focus'}
                  </>
                )}
              </Button>
            )}
          </div>

          {isNarrow && showButton && (
            <div className="px-2 pb-2">
              <Button
                onClick={handleFocusClick}
                className={cn(
                  'w-full transition-all duration-300',
                  buttonSize,
                  isPomodoroRunning && 'bg-success hover:bg-success/90',
                  isPomodoroPaused && 'bg-warning hover:bg-warning/90'
                )}
              >
                {isPomodoroRunning ? (
                  <>
                    <Pause className="mr-1 w-3 h-3" />
                    {lang === 'zh' ? '暂停' : 'Pause'}
                  </>
                ) : (
                  <>
                    <Play className="mr-1 w-3 h-3" />
                    {lang === 'zh' ? '开始专注' : 'Focus'}
                  </>
                )}
              </Button>
            </div>
          )}

          {showProgressBar && (
            <div className={cn('bg-muted', isLarge ? 'h-1.5' : 'h-1')}>
              <div 
                className={cn(
                  'h-full transition-all duration-1000 ease-linear',
                  isPomodoroActive && 'animate-pulse'
                )}
                style={{ 
                  width: `${isPomodoroActive ? ((pomodoro.totalSeconds - pomodoro.remainingSeconds) / pomodoro.totalSeconds) * 100 : progress}%`,
                  backgroundColor: tagColor
                }}
              />
            </div>
          )}
        </>
      ) : (
        <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
          <Target className={cn('mb-2 opacity-30', sizeMode === 'compact' ? 'w-6 h-6' : isLarge ? 'w-10 h-10' : 'w-8 h-8')} />
          <p className={cn(sizeMode === 'compact' ? 'text-xs' : isLarge ? 'text-base' : 'text-sm')}>
            {lang === 'zh' ? '暂无进行中的任务' : 'No current task'}
          </p>
        </div>
      )}
    </div>
  )
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}
