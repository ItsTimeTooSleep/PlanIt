'use client'

import { useState, useRef, useCallback } from 'react'
import { Settings2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface BookmarkTabProps {
  className?: string
}

/**
 * 可伸缩书签组件
 * @param props - 组件属性
 * @param props.className - 自定义样式类
 * @returns 可伸缩书签组件
 */
export function BookmarkTab({ className }: BookmarkTabProps) {
  const router = useRouter()
  const [isHovered, setIsHovered] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleMouseEnter = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setIsHovered(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      setIsHovered(false)
    }, 200)
  }, [])

  const handleClick = useCallback(() => {
    router.push('/custom-layout')
  }, [router])

  return (
    <div
      className={cn('fixed right-0 top-12 z-50', className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        onClick={handleClick}
        className="relative flex items-center justify-center transition-all duration-300 ease-out"
        style={{
          width: isHovered ? '100px' : '28px',
          height: '52px',
          borderRadius: isHovered ? '10px 0 0 10px' : '6px 0 0 6px',
          backgroundColor: 'oklch(0.52 0.18 260)',
          color: 'white',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        }}
      >
        {isHovered ? (
          <div className="flex items-center gap-2 whitespace-nowrap">
            <Settings2 className="w-4 h-4" />
            <span className="text-sm font-medium">自定义布局</span>
          </div>
        ) : (
          <Settings2 className="w-4 h-4" />
        )}
      </button>
    </div>
  )
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ')
}
