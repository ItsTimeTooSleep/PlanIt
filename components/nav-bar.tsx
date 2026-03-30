'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CalendarDays, BarChart2, Settings, LayoutDashboard, Timer, CheckSquare, StickyNote } from 'lucide-react'
import { useLanguage, useStore } from '@/lib/store'
import { useTranslations } from '@/lib/i18n'
import { usePomodoroDialog } from '@/lib/pomodoro-context'
import { usePomodoro } from '@/lib/pomodoro-hooks'
import { cn } from '@/lib/utils'
import { AppIcon } from '@/components/app-icon'

const NAV_ITEMS = [
  { href: '/home', labelKey: 'home' as const, icon: LayoutDashboard },
  { href: '/calendar', labelKey: 'calendar' as const, icon: CalendarDays },
  { href: '/todo', labelKey: 'todo' as const, icon: CheckSquare },
  { href: '/note', labelKey: 'note' as const, icon: StickyNote },
  { href: '/stats', labelKey: 'stats' as const, icon: BarChart2 },
  { href: '/settings', labelKey: 'settings' as const, icon: Settings },
]

export function NavBar() {
  const pathname = usePathname()
  const lang = useLanguage()
  const t = useTranslations(lang)
  const { state } = useStore()
  const { open } = usePomodoroDialog()
  const { resetToToolMode } = usePomodoro()
  const isPomodoroActive = state.pomodoro.status !== 'idle'

  const handleOpenToolPomodoro = () => {
    resetToToolMode()
    open()
  }

  return (
    <>
      {/* Desktop: left sidebar 64px wide */}
      <nav className="hidden md:flex fixed top-9 left-0 h-[calc(100vh-2.25rem)] w-16 flex-col items-center py-5 gap-1 bg-card border-r border-border z-50">
        {/* Logo */}
        <AppIcon size={36} variant="neutral" className="mb-4 shrink-0" />

        {NAV_ITEMS.map(({ href, labelKey, icon: Icon }) => {
          const isActive = href === '/home' 
            ? pathname === '/home' || pathname === '/' 
            : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              title={t.nav[labelKey]}
              className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center transition-colors shrink-0',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              <Icon className="w-5 h-5" />
            </Link>
          )
        })}

        <div className="flex-1" />

        <button
          onClick={handleOpenToolPomodoro}
          title={t.pomodoro.title}
          className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center transition-colors shrink-0',
            isPomodoroActive
              ? 'bg-destructive/20 text-destructive hover:bg-destructive/30'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
        >
          <Timer className="w-5 h-5" />
        </button>
      </nav>

      {/* Mobile: bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur border-t border-border">
        <div className="flex items-center justify-around h-16 px-2">
          {NAV_ITEMS.map(({ href, labelKey, icon: Icon }) => {
            const isActive = href === '/home' 
              ? pathname === '/home' || pathname === '/' 
              : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-xl transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] leading-none font-medium">{t.nav[labelKey]}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
