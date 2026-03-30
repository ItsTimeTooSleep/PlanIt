'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * 页面可见性 Hook
 * 检测页面是否在后台运行，当页面重新可见时触发回调
 * @returns isVisible - 页面是否可见
 * @returns lastHiddenTime - 上次隐藏的时间戳（用于计算后台运行时长）
 */
export function usePageVisibility() {
  const [isVisible, setIsVisible] = useState(true)
  const lastHiddenTimeRef = useRef<number | null>(null)
  const lastVisibleTimeRef = useRef<number>(Date.now())

  useEffect(() => {
    const handleVisibilityChange = () => {
      const now = Date.now()
      
      if (document.hidden) {
        lastHiddenTimeRef.current = now
        setIsVisible(false)
      } else {
        setIsVisible(true)
        lastVisibleTimeRef.current = now
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  /**
   * 获取页面在后台运行的时长（毫秒）
   * @returns 后台运行时长，如果页面一直可见则返回0
   */
  const getHiddenDuration = useCallback((): number => {
    if (lastHiddenTimeRef.current === null) return 0
    return lastVisibleTimeRef.current - lastHiddenTimeRef.current
  }, [])

  return {
    isVisible,
    getHiddenDuration,
    lastHiddenTime: lastHiddenTimeRef.current,
  }
}

/**
 * 时间戳校正计时器 Hook
 * 使用时间戳而非计数器来确保计时准确，即使页面在后台也能正确计算流逝的时间
 * @param isRunning - 计时器是否在运行
 * @param onTick - 每秒回调，传入实际流逝的秒数
 * @param intervalMs - 间隔时间（毫秒），默认1000
 */
export function useAccurateTimer(
  isRunning: boolean,
  onTick: (elapsedSeconds: number) => void,
  intervalMs: number = 1000
) {
  const startTimeRef = useRef<number | null>(null)
  const lastTickTimeRef = useRef<number | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now()
      lastTickTimeRef.current = Date.now()
      
      intervalRef.current = setInterval(() => {
        const now = Date.now()
        const elapsed = Math.floor((now - (lastTickTimeRef.current ?? now)) / 1000)
        
        if (elapsed >= 1) {
          lastTickTimeRef.current = now
          onTick(elapsed)
        }
      }, intervalMs)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      startTimeRef.current = null
      lastTickTimeRef.current = null
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isRunning, onTick, intervalMs])
}

/**
 * 页面重新可见时触发回调的 Hook
 * @param callback - 页面重新可见时的回调函数
 */
export function useOnVisible(callback: () => void) {
  const callbackRef = useRef(callback)
  
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        callbackRef.current()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])
}
