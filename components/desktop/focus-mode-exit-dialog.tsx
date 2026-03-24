'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useDesktopOnly, usePlatform } from '@/components/platform-provider'
import { useLanguage } from '@/lib/store'
import { cn } from '@/lib/utils'
import { Shield, AlertTriangle, Heart, Sparkles, X } from 'lucide-react'
import { STATUS_COLORS } from '@/lib/colors'

const EXIT_PHRASES_ZH = [
  '不想努力了',
  '我要放弃',
  '让我出去',
  '坚持不住了',
]

const EXIT_PHRASES_EN = [
  'I give up',
  'Let me out',
  'I cannot focus',
  'Too hard for me',
]

const ENCOURAGEMENT_ZH = [
  '再坚持一下，你快要成功了！',
  '每一次专注都是成长的机会',
  '你的目标就在前方，别放弃！',
  '专注是一种超能力，你正在使用它',
  '成功的人只是比别人多坚持了一会儿',
  '现在的坚持，是未来的你感谢现在的自己',
  '困难只是暂时的，放弃才是永久的',
  '你已经完成了这么多，真的要放弃吗？',
]

const ENCOURAGEMENT_EN = [
  'Just a little more, you are almost there!',
  'Every focus session is a chance to grow',
  'Your goal is ahead, do not give up!',
  'Focus is a superpower, and you are using it',
  'Successful people just persist a little longer',
  'Your future self will thank you for persisting now',
  'Difficulty is temporary, giving up is permanent',
  'You have come so far, are you sure you want to give up?',
]

interface FocusModeExitDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

type ExitStep = 'initial' | 'typing' | 'holding'

/**
 * 专注模式退出确认对话框
 * 包含多步确认流程，防止用户轻易退出
 * @param props.isOpen - 是否打开对话框
 * @param props.onClose - 取消回调
 * @param props.onConfirm - 确认退出回调
 */
export function FocusModeExitDialog({ isOpen, onClose, onConfirm }: FocusModeExitDialogProps) {
  const lang = useLanguage()
  const isZh = lang === 'zh'
  const [step, setStep] = useState<ExitStep>('initial')
  const [inputValue, setInputValue] = useState('')
  const [targetPhrase, setTargetPhrase] = useState('')
  const [holdProgress, setHoldProgress] = useState(0)
  const [isHolding, setIsHolding] = useState(false)
  const [encouragement, setEncouragement] = useState('')
  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (isOpen) {
      setStep('initial')
      setInputValue('')
      setHoldProgress(0)
      setIsHolding(false)
      randomizePhrase()
      randomizeEncouragement()
    }
  }, [isOpen])

  useEffect(() => {
    return () => {
      if (holdIntervalRef.current) {
        clearInterval(holdIntervalRef.current)
      }
    }
  }, [])

  function randomizePhrase() {
    const phrases = isZh ? EXIT_PHRASES_ZH : EXIT_PHRASES_EN
    const randomIndex = Math.floor(Math.random() * phrases.length)
    setTargetPhrase(phrases[randomIndex])
  }

  function randomizeEncouragement() {
    const phrases = isZh ? ENCOURAGEMENT_ZH : ENCOURAGEMENT_EN
    const randomIndex = Math.floor(Math.random() * phrases.length)
    setEncouragement(phrases[randomIndex])
  }

  const handleStartExit = useCallback(() => {
    setStep('typing')
    randomizeEncouragement()
  }, [])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }, [])

  const handleInputSubmit = useCallback(() => {
    if (inputValue.trim() === targetPhrase) {
      setStep('holding')
      randomizeEncouragement()
    }
  }, [inputValue, targetPhrase])

  const handleHoldStart = useCallback(() => {
    setIsHolding(true)
    setHoldProgress(0)
    
    const startTime = Date.now()
    const duration = 5000

    holdIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min((elapsed / duration) * 100, 100)
      setHoldProgress(progress)

      if (progress >= 100) {
        if (holdIntervalRef.current) {
          clearInterval(holdIntervalRef.current)
        }
        onConfirm()
      }
    }, 50)
  }, [onConfirm])

  const handleHoldEnd = useCallback(() => {
    setIsHolding(false)
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current)
    }
    if (holdProgress < 100) {
      setHoldProgress(0)
      randomizeEncouragement()
    }
  }, [holdProgress])

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" style={{ color: 'var(--warning)' }}>
            <AlertTriangle className="w-5 h-5" />
            {isZh ? '确认退出专注模式？' : 'Confirm Exit Focus Mode?'}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {step === 'initial' && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg border" style={{ backgroundColor: 'color-mix(in srgb, var(--warning) 10%, transparent)', borderColor: 'color-mix(in srgb, var(--warning) 30%, transparent)' }}>
                <p className="text-sm" style={{ color: 'var(--warning-foreground)' }}>
                  {isZh 
                    ? '专注尚未结束，确认退出？你的进度将会保存，但中断专注可能会影响你的效率。' 
                    : 'Your focus session is not over yet. Your progress will be saved, but interrupting may affect your productivity.'}
                </p>
              </div>
              
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm text-center italic text-muted-foreground">
                  "{encouragement}"
                </p>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Heart className="w-4 h-4" style={{ color: 'var(--tag-pink)' }} />
                <span>{isZh ? '我们相信你可以坚持到底！' : 'We believe you can make it to the end!'}</span>
              </div>
            </div>
          )}

          {step === 'typing' && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground mb-2">
                  {isZh ? '请输入以下文字以确认退出：' : 'Please type the following to confirm exit:'}
                </p>
                <p className="text-lg font-semibold text-center py-2">
                  "{targetPhrase}"
                </p>
              </div>

              <Input
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={(e) => e.key === 'Enter' && handleInputSubmit()}
                placeholder={isZh ? '输入上方文字...' : 'Type the text above...'}
                className="text-center"
                autoFocus
              />

              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm text-center italic text-muted-foreground">
                  "{encouragement}"
                </p>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="w-4 h-4 text-warning" />
                <span>{isZh ? '再想一想，真的要放弃吗？' : 'Think again, do you really want to give up?'}</span>
              </div>
            </div>
          )}

          {step === 'holding' && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground mb-2">
                  {isZh ? '按住下方按钮 5 秒以退出专注模式' : 'Hold the button below for 5 seconds to exit focus mode'}
                </p>
              </div>

              <div className="space-y-3">
                <Progress value={holdProgress} className="h-3" />
                <p className="text-xs text-center text-muted-foreground">
                  {isZh ? `${Math.round(holdProgress)}% 完成` : `${Math.round(holdProgress)}% complete`}
                </p>
              </div>

              <Button
                ref={buttonRef}
                variant="destructive"
                className="w-full h-14 text-lg"
                onMouseDown={handleHoldStart}
                onMouseUp={handleHoldEnd}
                onMouseLeave={handleHoldEnd}
                onTouchStart={handleHoldStart}
                onTouchEnd={handleHoldEnd}
              >
                {isHolding 
                  ? (isZh ? '继续按住...' : 'Keep holding...')
                  : (isZh ? '按住以退出' : 'Hold to exit')}
              </Button>

              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm text-center italic text-muted-foreground">
                  "{encouragement}"
                </p>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="w-4 h-4 text-info" />
                <span>{isZh ? '这是最后一步，松手就会重置进度' : 'This is the last step, releasing will reset progress'}</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {step === 'initial' && (
            <>
              <Button variant="outline" onClick={onClose} className="flex-1">
                {isZh ? '继续专注' : 'Continue Focus'}
              </Button>
              <Button variant="destructive" onClick={handleStartExit} className="flex-1">
                {isZh ? '确认退出' : 'Confirm Exit'}
              </Button>
            </>
          )}
          
          {step === 'typing' && (
            <>
              <Button variant="outline" onClick={onClose} className="flex-1">
                {isZh ? '继续专注' : 'Continue Focus'}
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleInputSubmit}
                disabled={inputValue.trim() !== targetPhrase}
                className="flex-1"
              >
                {isZh ? '下一步' : 'Next Step'}
              </Button>
            </>
          )}
          
          {step === 'holding' && (
            <Button variant="outline" onClick={onClose} className="w-full">
              {isZh ? '继续专注' : 'Continue Focus'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
