'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { format } from 'date-fns'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BookmarkTab } from '@/components/home/bookmark-tab'
import { WidgetDisplay } from '@/components/widget-panel/widget-display'
import { WidgetStoreProvider, useWidgetStore } from '@/components/widget-store-provider'
import { useStore, useLanguage } from '@/lib/store'
import { useTranslations } from '@/lib/i18n'
import { TaskModal } from '@/components/task-modal'
import type { Task, TaskStatus } from '@/lib/types'
import { minutesToTime } from '@/lib/task-utils'

function HomeViewContent() {
  const lang = useLanguage()
  const t = useTranslations(lang)
  const { state, updateTask } = useStore()
  const { getWidgets } = useWidgetStore()

  const today = format(new Date(), 'yyyy-MM-dd')
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [defaultStart, setDefaultStart] = useState<string | undefined>()
  const [defaultEnd, setDefaultEnd] = useState<string | undefined>()
  const [isFabHovered, setIsFabHovered] = useState(false)
  const fabTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleFabMouseEnter = useCallback(() => {
    if (fabTimeoutRef.current) clearTimeout(fabTimeoutRef.current)
    setIsFabHovered(true)
  }, [])

  const handleFabMouseLeave = useCallback(() => {
    fabTimeoutRef.current = setTimeout(() => {
      setIsFabHovered(false)
    }, 200)
  }, [])

  function openCreate(startMin?: number) {
    const start = startMin !== undefined ? minutesToTime(startMin) : undefined
    const end = startMin !== undefined ? minutesToTime(Math.min(startMin + 60, 23 * 60)) : undefined
    setDefaultStart(start)
    setDefaultEnd(end)
    setEditTask(null)
    setModalOpen(true)
  }

  function handleTaskClick(task: Task) {
    setEditTask(task)
    setModalOpen(true)
  }

  function handleTaskToggle(task: Task) {
    const newStatus: TaskStatus = task.status === 'completed' ? 'pending' : 'completed'
    updateTask(task.id, { status: newStatus })
  }

  return (
    <div className="flex flex-col h-[calc(100vh-2.25rem)] bg-background">
      <BookmarkTab />
      <main className="min-h-[calc(100vh-2.25rem)] flex flex-col">
        <WidgetDisplay 
          className="flex-1 ml-16" 
          onTaskClick={handleTaskClick}
          onTaskToggle={handleTaskToggle}
          onOpenCreate={openCreate}
        />
      </main>

      <button
        onClick={() => openCreate()}
        onMouseEnter={handleFabMouseEnter}
        onMouseLeave={handleFabMouseLeave}
        className="fixed bottom-20 right-5 md:bottom-6 z-40 flex items-center justify-center overflow-hidden transition-all duration-300 ease-out"
        style={{
          width: isFabHovered ? '140px' : '56px',
          height: '56px',
          borderRadius: isFabHovered ? '28px' : '50%',
          background: 'linear-gradient(135deg, oklch(0.55 0.20 260) 0%, oklch(0.45 0.18 280) 100%)',
          boxShadow: isFabHovered 
            ? '0 8px 32px rgba(88, 28, 135, 0.4), 0 4px 16px rgba(0,0,0,0.2)' 
            : '0 6px 24px rgba(88, 28, 135, 0.3), 0 2px 8px rgba(0,0,0,0.15)',
          transform: isFabHovered ? 'scale(1.02)' : 'scale(1)',
        }}
      >
        <div className="flex items-center justify-center text-white w-full" style={{ gap: isFabHovered ? '8px' : '0px' }}>
          <Plus className={`w-6 h-6 flex-shrink-0 transition-transform duration-300 ${isFabHovered ? 'rotate-90' : ''}`} />
          <span 
            className="text-sm font-medium whitespace-nowrap transition-all duration-300 overflow-hidden"
            style={{
              width: isFabHovered ? '80px' : '0px',
              opacity: isFabHovered ? 1 : 0,
            }}
          >
            新建任务
          </span>
        </div>
      </button>

      <TaskModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditTask(null) }}
        task={editTask}
        defaultStartTime={defaultStart}
        defaultEndTime={defaultEnd}
      />
    </div>
  )
}

export default function HomeView() {
  return (
    <WidgetStoreProvider>
      <HomeViewContent />
    </WidgetStoreProvider>
  )
}
