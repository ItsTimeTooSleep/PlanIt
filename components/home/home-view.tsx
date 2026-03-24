'use client'

import { useState, useEffect } from 'react'
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

  function openCreate(startMin?: number) {
    const start = startMin !== undefined ? minutesToTime(startMin) : '09:00'
    const end = startMin !== undefined ? minutesToTime(Math.min(startMin + 60, 23 * 60)) : '10:00'
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

      <Button
        size="icon"
        className="fixed bottom-20 right-5 md:bottom-6 w-14 h-14 rounded-full shadow-lg z-40"
        onClick={() => openCreate()}
      >
        <Plus className="w-6 h-6" />
      </Button>

      <TaskModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditTask(null) }}
        task={editTask}
        defaultDate={today}
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
