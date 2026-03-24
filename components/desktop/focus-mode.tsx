'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { useDesktopOnly, usePlatform } from '@/components/platform-provider'
import { useLanguage } from '@/lib/store'
import { FocusModeExitDialog } from './focus-mode-exit-dialog'
import { Play, Pause, Square, Shield, Zap, Target, Timer, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { POMODORO_COLORS } from '@/lib/colors'

interface FocusModeProps {
  isOpen: boolean
  onClose: () => void
  pomodoroState: {
    phase: 'work' | 'shortBreak' | 'longBreak'
    status: 'idle' | 'running' | 'paused'
    remainingSeconds: number
    totalSeconds: number
    workSessions: number
  }
  formatTime: (seconds: number) => string
  onStart: () => void
  onPause: () => void
  onStop: () => void
}

const ENTER_ENCOURAGEMENT_ZH = [
  '准备好进入深度专注了吗？',
  '接下来的时间只属于你和你的目标',
  '关闭一切干扰，开启高效时刻',
  '专注模式将帮助你达成目标',
]

const ENTER_ENCOURAGEMENT_EN = [
  'Ready for deep focus?',
  'The next period belongs only to you and your goal',
  'Block all distractions, start your productive time',
  'Focus mode will help you achieve your goals',
]

/**
 * 专注模式组件
 * 全屏显示番茄钟，禁用系统快捷键
 * @param props.isOpen - 是否开启专注模式
 * @param props.onClose - 关闭回调
 * @param props.pomodoroState - 番茄钟状态
 * @param props.formatTime - 时间格式化函数
 * @param props.onStart - 开始计时
 * @param props.onPause - 暂停计时
 * @param props.onStop - 停止计时
 */
export function FocusMode({
  isOpen,
  onClose,
  pomodoroState,
  formatTime,
  onStart,
  onPause,
  onStop,
}: FocusModeProps) {
  const lang = useLanguage()
  const isZh = lang === 'zh'
  const { api, capabilities } = usePlatform()
  const [showEnterConfirm, setShowEnterConfirm] = useState(false)
  const [showExitDialog, setShowExitDialog] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const [enterEncouragement, setEnterEncouragement] = useState('')
  const [focusModeActive, setFocusModeActive] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setShowEnterConfirm(true)
      randomizeEnterEncouragement()
    }
  }, [isOpen])

  useEffect(() => {
    return () => {
      if (focusModeActive && api) {
        api.exitFocusMode().catch(console.error)
      }
    }
  }, [focusModeActive, api])

  function randomizeEnterEncouragement() {
    const phrases = isZh ? ENTER_ENCOURAGEMENT_ZH : ENTER_ENCOURAGEMENT_EN
    const randomIndex = Math.floor(Math.random() * phrases.length)
    setEnterEncouragement(phrases[randomIndex])
  }

  const handleEnterConfirm = useCallback(async () => {
    setShowEnterConfirm(false)
    if (api?.capabilities.supportsFocusMode) {
      try {
        await api.enterFocusMode()
        setFocusModeActive(true)
      } catch (error) {
        console.error('[FocusMode] Failed to enter focus mode:', error)
      }
    }
    if (pomodoroState.status === 'idle') {
      onStart()
    }
  }, [api, pomodoroState.status, onStart])

  const handleEnterCancel = useCallback(() => {
    setShowEnterConfirm(false)
    onClose()
  }, [onClose])

  const handleExitRequest = useCallback(() => {
    setShowExitDialog(true)
  }, [])

  const handleExitConfirm = useCallback(async () => {
    setShowExitDialog(false)
    setIsExiting(true)
    if (api?.capabilities.supportsFocusMode) {
      try {
        await api.exitFocusMode()
        setFocusModeActive(false)
      } catch (error) {
        console.error('[FocusMode] Failed to exit focus mode:', error)
      }
    }
    onStop()
    onClose()
  }, [api, onStop, onClose])

  const handleExitCancel = useCallback(() => {
    setShowExitDialog(false)
  }, [])

  const progress = pomodoroState.totalSeconds > 0
    ? ((pomodoroState.totalSeconds - pomodoroState.remainingSeconds) / pomodoroState.totalSeconds) * 100
    : 0

  const getPhaseColor = () => {
    switch (pomodoroState.phase) {
      case 'work': return POMODORO_COLORS.work
      case 'shortBreak': return POMODORO_COLORS.shortBreak
      case 'longBreak': return POMODORO_COLORS.longBreak
    }
  }

  const getPhaseLabel = () => {
    switch (pomodoroState.phase) {
      case 'work': return isZh ? '专注中' : 'Focusing'
      case 'shortBreak': return isZh ? '短休息' : 'Short Break'
      case 'longBreak': return isZh ? '长休息' : 'Long Break'
    }
  }

  if (!isOpen) return null

  return (
    <>
      <Dialog open={showEnterConfirm} onOpenChange={(open) => !open && handleEnterCancel()}>
        <DialogContent className="max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              {isZh ? '进入专注模式' : 'Enter Focus Mode'}
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm text-center italic text-muted-foreground">
                "{enterEncouragement}"
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Zap className="w-5 h-5 text-warning mt-0.5" />
                <div>
                  <p className="text-sm font-medium">{isZh ? '全屏专注' : 'Fullscreen Focus'}</p>
                  <p className="text-xs text-muted-foreground">
                    {isZh ? '番茄钟将占据整个屏幕' : 'Pomodoro timer will take the entire screen'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Shield className="w-5 h-5 text-info mt-0.5" />
                <div>
                  <p className="text-sm font-medium">{isZh ? '屏蔽干扰' : 'Block Distractions'}</p>
                  <p className="text-xs text-muted-foreground">
                    {isZh ? '禁用 Alt+Tab、Win+D 等系统快捷键' : 'Disable Alt+Tab, Win+D and other system shortcuts'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Target className="w-5 h-5 text-success mt-0.5" />
                <div>
                  <p className="text-sm font-medium">{isZh ? '深度工作' : 'Deep Work'}</p>
                  <p className="text-xs text-muted-foreground">
                    {isZh ? '专注于当前任务，直到番茄钟结束' : 'Focus on your task until the pomodoro ends'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm p-3 rounded-lg" style={{ color: 'var(--warning-foreground)', backgroundColor: 'color-mix(in srgb, var(--warning) 10%, transparent)' }}>
              <AlertCircle className="w-4 h-4" />
              <span>{isZh ? '退出时需要多重确认，请确保有足够时间' : 'Exit requires multiple confirmations, ensure you have enough time'}</span>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleEnterCancel} className="flex-1">
              {isZh ? '取消' : 'Cancel'}
            </Button>
            <Button onClick={handleEnterConfirm} className="flex-1">
              {isZh ? '开始专注' : 'Start Focus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {!showEnterConfirm && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
          <div className="absolute top-4 right-4 z-10">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExitRequest}
              className="bg-background/80 backdrop-blur-sm"
            >
              {isZh ? '退出专注模式' : 'Exit Focus Mode'}
            </Button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="text-center mb-8">
              <div 
                className="inline-block px-8 py-3 rounded-full text-2xl font-semibold mb-4"
                style={{ 
                  backgroundColor: getPhaseColor() + '20',
                  color: getPhaseColor()
                }}
              >
                {getPhaseLabel()}
              </div>
              <p className="text-sm text-muted-foreground">
                {isZh ? `第 ${pomodoroState.workSessions + 1} 个番茄钟` : `Pomodoro #${pomodoroState.workSessions + 1}`}
              </p>
            </div>

            <div className="relative w-[400px] h-[400px] mb-12">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  className="text-muted"
                  opacity="0.2"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke={getPhaseColor()}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray="283"
                  strokeDashoffset={283 - (progress / 100) * 283}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Timer className="w-8 h-8 text-muted-foreground mb-2" />
                <span className="text-8xl font-bold tracking-tighter tabular-nums">
                  {formatTime(pomodoroState.remainingSeconds)}
                </span>
              </div>
            </div>

            <div className="w-64 mb-8">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-center text-muted-foreground mt-2">
                {Math.round(progress)}% {isZh ? '完成' : 'complete'}
              </p>
            </div>

            <div className="flex items-center gap-6">
              {pomodoroState.status === 'running' && (
                <Button
                  size="icon"
                  className="w-20 h-20 rounded-full"
                  variant="secondary"
                  onClick={onPause}
                >
                  <Pause className="w-10 h-10" />
                </Button>
              )}

              {pomodoroState.status === 'paused' && (
                <Button
                  size="icon"
                  className="w-20 h-20 rounded-full"
                  onClick={onStart}
                >
                  <Play className="w-10 h-10" />
                </Button>
              )}
            </div>
          </div>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">
            {isZh ? '按 ESC 或点击右上角退出专注模式' : 'Press ESC or click top right to exit focus mode'}
          </div>
        </div>
      )}

      <FocusModeExitDialog
        isOpen={showExitDialog}
        onClose={handleExitCancel}
        onConfirm={handleExitConfirm}
      />
    </>
  )
}
