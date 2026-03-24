'use client'

import { useState } from 'react'
import { useLanguage } from '@/lib/store'
import { useTranslations } from '@/lib/i18n'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AppIcon } from '@/components/app-icon'
import {
  GeneralSettings,
  TagManagement,
  CalendarSettings,
  PomodoroSettings,
  DataManagement,
} from '@/components/settings'

export function SettingsView() {
  const lang = useLanguage()
  const t = useTranslations(lang)
  const [expandedSection, setExpandedSection] = useState<string | null>('general')

  return (
    <div className="flex flex-col h-[calc(100vh-2.25rem)] overflow-y-auto ml-16">
      <header className="px-6 pt-6 pb-4">
        <h1 className="text-lg font-medium tracking-tight">{t.settings.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t.settings.aboutDesc}</p>
      </header>

      <div className="px-6 pb-24 flex flex-col gap-8">
        <Section
          id="general"
          title={lang === 'zh' ? '通用' : 'General'}
          expanded={expandedSection}
          onToggle={setExpandedSection}
        >
          <GeneralSettings />
        </Section>

        <Section
          id="tags"
          title={t.settings.tags}
          expanded={expandedSection}
          onToggle={setExpandedSection}
        >
          <TagManagement />
        </Section>

        <Section
          id="calendar"
          title={t.calendarSettings.title}
          expanded={expandedSection}
          onToggle={setExpandedSection}
        >
          <CalendarSettings />
        </Section>

        <Section
          id="pomodoro"
          title={t.pomodoro.title}
          expanded={expandedSection}
          onToggle={setExpandedSection}
        >
          <PomodoroSettings />
        </Section>

        <Section
          id="data"
          title={t.settings.dataManagement}
          expanded={expandedSection}
          onToggle={setExpandedSection}
        >
          <DataManagement />
        </Section>

        <Section
          id="about"
          title={t.settings.about}
          expanded={expandedSection}
          onToggle={setExpandedSection}
        >
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <AppIcon size={32} variant="inverted" />
              <div>
                <p className="text-sm font-medium">PlanIt</p>
                <p className="text-xs text-muted-foreground">{t.settings.version}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{t.settings.madeWith}</p>
            <div className="pt-2 space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">{t.settings.author}:</span>
                <a
                  href="http://itstimetoosleep.pages.dev/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  William Zhang
                </a>
              </div>
              <a
                href="https://afdian.com/a/itstimetoosleep"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                {t.settings.sponsor}
              </a>
            </div>
          </div>
        </Section>
      </div>
    </div>
  )
}

function Section({
  id,
  title,
  expanded,
  onToggle,
  children
}: {
  id: string
  title: string
  expanded: string | null
  onToggle: (id: string | null) => void
  children: React.ReactNode
}) {
  const isOpen = expanded === id

  return (
    <section className="relative">
      <button
        onClick={() => onToggle(isOpen ? null : id)}
        className={cn(
          'w-full flex items-center gap-2.5 text-left py-1 -mt-1 group',
          isOpen && 'mb-2'
        )}
      >
        <span className={cn(
          'flex items-center justify-center w-5 h-5 rounded transition-all duration-200',
          isOpen ? 'bg-foreground text-background' : 'bg-muted/50 text-muted-foreground group-hover:bg-muted'
        )}>
          <ChevronRight className={cn(
            'w-3 h-3 transition-transform duration-200',
            isOpen && 'rotate-90'
          )} />
        </span>
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
      </button>

      <div className={cn(
        'overflow-hidden transition-all duration-200 ease-out',
        isOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
      )}>
        <div className="pl-[30px] border-l border-border/40 ml-2.5">
          {children}
        </div>
      </div>
    </section>
  )
}
