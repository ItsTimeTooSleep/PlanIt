'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useLanguage } from '@/lib/store'
import { useTranslations } from '@/lib/i18n'
import { ChevronRight, ExternalLink, Loader2, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AppIcon } from '@/components/app-icon'
import { getAppVersion } from '@/lib/version'
import { OFFICIAL_WEBSITE } from '@/lib/config'
import { UpdaterManager } from '@/lib/updater'
import { Button } from '@/components/ui/button'
import { usePlatform } from '@/components/platform-provider'
import {
  GeneralSettings,
  NotificationSettings,
  TagManagement,
  CalendarSettings,
  PomodoroSettings,
  DataManagement,
} from '@/components/settings'

export function SettingsView() {
  const lang = useLanguage()
  const t = useTranslations(lang)
  const { api } = usePlatform()
  const [expandedSection, setExpandedSection] = useState<string | null>('general')
  const [appVersion, setAppVersion] = useState<string>('')
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [updateErrorDetail, setUpdateErrorDetail] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    getAppVersion().then(setAppVersion).catch(() => setAppVersion(''))
  }, [])

  useEffect(() => {
    const updater = UpdaterManager.getInstance({
      updateAvailable: t.settings.updateAvailable,
      updateLatest: t.settings.updateLatest,
      updateError: t.settings.updateError,
      updateDownloading: t.settings.updateDownloading,
      updateInstalled: t.settings.updateInstalled,
      updateConfirmTitle: t.settings.updateAvailable,
      updateConfirmBody: lang === 'zh' ? '点击确定开始更新' : 'Click OK to start updating',
      updateChecking: lang === 'zh' ? '正在检查更新...' : 'Checking for updates...',
      updateNetworkError: lang === 'zh' ? '网络错误，请检查网络连接' : 'Network error. Please check your connection.',
      updateTimeoutError: lang === 'zh' ? '请求超时，请重试' : 'Request timed out. Please try again.',
    })

    updater.setOnCheckStateChange((isChecking) => {
      setIsCheckingUpdate(isChecking)
      if (isChecking) {
        setUpdateError(null)
        setUpdateErrorDetail(null)
        if (errorTimeoutRef.current) {
          clearTimeout(errorTimeoutRef.current)
          errorTimeoutRef.current = null
        }
      }
    })

    updater.setOnUpdateError((error, detail) => {
      setUpdateError(error)
      setUpdateErrorDetail(detail || null)
      // 10秒后自动清除错误
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current)
      }
      errorTimeoutRef.current = setTimeout(() => {
        setUpdateError(null)
        setUpdateErrorDetail(null)
      }, 10000)
    })

    return () => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current)
      }
    }
  }, [lang, t.settings])

  const handleCheckUpdate = useCallback(async () => {
    setUpdateError(null)
    setUpdateErrorDetail(null)
    setCopied(false)
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current)
      errorTimeoutRef.current = null
    }
    const updater = UpdaterManager.getInstance()
    await updater.checkForUpdates(true, true)
  }, [])

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
          id="notifications"
          title={t.settings.notifications}
          expanded={expandedSection}
          onToggle={setExpandedSection}
        >
          <NotificationSettings />
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
              <div className="flex-1">
                <p className="text-sm font-medium">PlanIt</p>
                <p className="text-xs text-muted-foreground">
                  {appVersion ? `${t.settings.versionPrefix || (lang === 'zh' ? '版本 ' : 'Version ')}${appVersion}` : ''}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleCheckUpdate}
                  disabled={isCheckingUpdate}
                  className="min-w-[100px]"
                >
                  {isCheckingUpdate ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      {lang === 'zh' ? '检查中...' : 'Checking...'}
                    </>
                  ) : (
                    t.settings.checkUpdate
                  )}
                </Button>
                {updateError && (
                  <button
                    onClick={async () => {
                      if (updateErrorDetail && api) {
                        try {
                          await api.writeToClipboard(updateErrorDetail)
                          setCopied(true)
                          setTimeout(() => setCopied(false), 2000)
                        } catch (e) {
                          console.error('Failed to copy error:', e)
                        }
                      }
                    }}
                    className={cn(
                      'text-xs max-w-[180px] text-right flex items-center gap-1 transition-colors',
                      updateErrorDetail
                        ? 'text-destructive hover:text-destructive/80 cursor-pointer'
                        : 'text-destructive cursor-default'
                    )}
                    title={updateErrorDetail || updateError}
                  >
                    <span className="truncate">{updateError}</span>
                    {updateErrorDetail && (
                      copied ? (
                        <Check className="w-3 h-3 flex-shrink-0" />
                      ) : (
                        <Copy className="w-3 h-3 flex-shrink-0" />
                      )
                    )}
                  </button>
                )}
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
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">{t.settings.officialWebsite || '官网'}:</span>
                <a
                  href={OFFICIAL_WEBSITE}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  {OFFICIAL_WEBSITE.replace('https://', '')}
                  <ExternalLink className="w-3 h-3" />
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
            <div className="pt-4 mt-3 border-t border-border/40">
              <p className="text-xs text-muted-foreground mb-3">{t.settings.otherProjectsDesc}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ProjectCard
                  href="http://econgrapher.pages.dev/"
                  imageSrc="/project-econgrapher.png"
                  title={t.settings.econgrapher}
                  description={t.settings.econgrapherDesc}
                  tag={t.settings.econgrapherTag}
                  color="violet"
                />
                <ProjectCard
                  href="https://itstimetoosleep.github.io/gpa-calculator/"
                  imageSrc="/project-gpacalculator.png"
                  title={t.settings.gpaCalculator}
                  description={t.settings.gpaCalculatorDesc}
                  tag={t.settings.gpaCalculatorTag}
                  color="amber"
                />
                <ProjectCard
                  href="https://teamscrypt.pages.dev/"
                  imageSrc="/project-teamscrypt.png"
                  title={t.settings.teamsCrypt}
                  description={t.settings.teamsCryptDesc}
                  tag={t.settings.teamsCryptTag}
                  color="slate"
                />
                <ProjectCard
                  href="https://canvahelper.pages.dev/"
                  imageSrc="/project-canvahelper.png"
                  title={t.settings.canvaHelper}
                  description={t.settings.canvaHelperDesc}
                  tag={t.settings.canvaHelperTag}
                  color="cyan"
                />
              </div>
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

function ProjectCard({
  href,
  imageSrc,
  title,
  description,
  tag,
  color,
}: {
  href: string
  imageSrc: string
  title: string
  description: string
  tag: string
  color: 'violet' | 'amber' | 'slate' | 'cyan'
}) {
  const cardRef = useRef<HTMLAnchorElement>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)

  const colorStyles = {
    violet: {
      border: 'hover:border-violet-500/30 dark:hover:border-violet-500/40',
      tagBg: 'bg-violet-500/15 dark:bg-violet-400/20',
      tagText: 'text-violet-600 dark:text-violet-400',
      glowColor: 'rgba(139, 92, 246, 0.15)',
      glowColorDark: 'rgba(167, 139, 250, 0.2)',
    },
    amber: {
      border: 'hover:border-amber-500/30 dark:hover:border-amber-500/40',
      tagBg: 'bg-amber-500/15 dark:bg-amber-400/20',
      tagText: 'text-amber-600 dark:text-amber-400',
      glowColor: 'rgba(245, 158, 11, 0.15)',
      glowColorDark: 'rgba(251, 191, 36, 0.2)',
    },
    slate: {
      border: 'hover:border-slate-400/40 dark:hover:border-slate-400/50',
      tagBg: 'bg-slate-400/15 dark:bg-slate-400/20',
      tagText: 'text-slate-600 dark:text-slate-400',
      glowColor: 'rgba(148, 163, 184, 0.15)',
      glowColorDark: 'rgba(203, 213, 225, 0.2)',
    },
    cyan: {
      border: 'hover:border-cyan-500/30 dark:hover:border-cyan-500/40',
      tagBg: 'bg-cyan-500/15 dark:bg-cyan-400/20',
      tagText: 'text-cyan-600 dark:text-cyan-400',
      glowColor: 'rgba(6, 182, 212, 0.15)',
      glowColorDark: 'rgba(34, 211, 238, 0.2)',
    },
  }

  const styles = colorStyles[color]

  /**
   * 处理鼠标移动事件
   * @param e - 鼠标事件对象
   */
  function handleMouseMove(e: React.MouseEvent<HTMLAnchorElement>) {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  return (
    <a
      ref={cardRef}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'group relative flex items-start gap-3 p-3 rounded-lg border border-border/50 transition-all duration-300 overflow-hidden',
        styles.border
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-lg transition-opacity duration-500 ease-out"
        style={{
          background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, ${styles.glowColor}, transparent 40%)`,
          opacity: isHovered ? 1 : 0,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 rounded-lg transition-opacity duration-500 ease-out"
        style={{
          background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, ${styles.glowColorDark}, transparent 40%)`,
          opacity: isHovered ? 0.5 : 0,
        }}
      />
      <div className="flex-shrink-0 w-9 h-9 rounded-lg overflow-hidden relative z-10 bg-muted/50">
        <img src={imageSrc} alt={title} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0 relative z-10">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">{title}</p>
          <span className={cn('px-1.5 py-0.5 text-[10px] font-medium rounded', styles.tagBg, styles.tagText)}>
            {tag}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{description}</p>
      </div>
      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-muted-foreground group-hover:opacity-100 opacity-0 transition-all duration-200 flex-shrink-0 mt-1 relative z-10" />
    </a>
  )
}
