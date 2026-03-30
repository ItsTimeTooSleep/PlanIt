'use client'

import { useState } from 'react'
import { CheckCircle, Plus, Coffee, Battery } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { usePomodoro } from '@/lib/pomodoro-hooks'
import { useLanguage } from '@/lib/store'
import { useTranslations } from '@/lib/i18n'
import { TaskModal } from '@/components/task-modal'
import { POMODORO_COLORS } from '@/lib/colors'

interface PomodoroSummaryProps {
  onClose: () => void
}

export function PomodoroSummary({ onClose }: PomodoroSummaryProps) {
  const lang = useLanguage()
  const t = useTranslations(lang)
  const { pomodoro, stopTimer, calculateBreakCount } = usePomodoro()
  const [showTaskModal, setShowTaskModal] = useState(false)

  const { shortBreakCount, longBreakCount } = calculateBreakCount()
  
  const totalFocusSeconds = pomodoro.startTime && pomodoro.actualEndTime
    ? Math.floor((pomodoro.actualEndTime.getTime() - pomodoro.startTime.getTime()) / 1000)
    : pomodoro.totalSeconds - pomodoro.remainingSeconds
  
  const totalFocusMinutes = Math.floor(totalFocusSeconds / 60)

  const formatDateTime = (date: Date | null) => {
    if (!date) return '-'
    return format(date, 'yyyy-MM-dd HH:mm')
  }

  const getDefaultDate = () => {
    if (pomodoro.startTime) {
      return format(pomodoro.startTime, 'yyyy-MM-dd')
    }
    return format(new Date(), 'yyyy-MM-dd')
  }

  const getDefaultStartTime = () => {
    if (pomodoro.startTime) {
      return format(pomodoro.startTime, 'HH:mm')
    }
    return ''
  }

  const getDefaultEndTime = () => {
    if (pomodoro.actualEndTime) {
      return format(pomodoro.actualEndTime, 'HH:mm')
    }
    return ''
  }

  return (
    <>
      <div className="relative z-10 flex flex-col items-center gap-10">
        <div className="flex flex-col items-center gap-6">
          <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle className="w-16 h-16 text-primary" />
          </div>
          
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold">
              {lang === 'zh' ? '专注完成！' : 'Focus Complete!'}
            </h2>
            <div className="text-2xl font-semibold text-primary">
              {totalFocusMinutes} {lang === 'zh' ? '分钟' : 'min'}
            </div>
            <p className="text-muted-foreground">
              {lang === 'zh' ? '专注时长' : 'Focus duration'}
            </p>
          </div>
        </div>

        <div className="w-full max-w-sm space-y-4">
          <div className="bg-muted/30 rounded-xl p-5 space-y-4">
            <div className="space-y-3">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                  {lang === 'zh' ? '开始时间' : 'Start Time'}
                </span>
                <span className="text-lg font-medium">
                  {formatDateTime(pomodoro.startTime)}
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                  {lang === 'zh' ? '计划结束时间' : 'Scheduled End'}
                </span>
                <span className="text-lg font-medium">
                  {formatDateTime(pomodoro.scheduledEndTime)}
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                  {lang === 'zh' ? '实际结束时间' : 'Actual End'}
                </span>
                <span className="text-lg font-medium">
                  {formatDateTime(pomodoro.actualEndTime)}
                </span>
              </div>
            </div>
            
            <div className="pt-4 border-t border-border/30">
              <div className="flex flex-col gap-2">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                  {lang === 'zh' ? '休息统计' : 'Breaks'}
                </span>
                <div className="flex items-center gap-4">
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${shortBreakCount > 0 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                    <Coffee className="w-4 h-4" />
                    <span className="text-sm font-medium">{shortBreakCount} {lang === 'zh' ? '短休息' : 'short'}</span>
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${longBreakCount > 0 ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'text-muted-foreground'}`}>
                    <Battery className="w-4 h-4" />
                    <span className="text-sm font-medium">{longBreakCount} {lang === 'zh' ? '长休息' : 'long'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3 w-full max-w-sm">
          <Button 
            onClick={() => setShowTaskModal(true)}
            className="rounded-full w-full py-6 text-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            {lang === 'zh' ? '快捷创建任务' : 'Quick Create Task'}
          </Button>
          
          <Button 
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="rounded-full"
          >
            {lang === 'zh' ? '关闭' : 'Close'}
          </Button>
        </div>
      </div>

      <TaskModal
        open={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        defaultDate={getDefaultDate()}
        defaultStartTime={getDefaultStartTime()}
        defaultEndTime={getDefaultEndTime()}
        defaultStatus="completed"
      />
    </>
  )
}
