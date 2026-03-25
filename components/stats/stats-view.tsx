'use client'

import { useState, useMemo } from 'react'
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, parseISO, isWithinInterval } from 'date-fns'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'
import { useStore, useLanguage } from '@/lib/store'
import { useTranslations } from '@/lib/i18n'
import { taskDurationMinutes } from '@/lib/task-utils'
import type { Task } from '@/lib/types'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { DEFAULT_TAG_COLOR, CHART_COLORS } from '@/lib/colors'

type Range = 'day' | 'week' | 'month' | 'custom'

function getInterval(range: Range, customFrom: string, customTo: string): { start: Date; end: Date } {
  const today = new Date()
  switch (range) {
    case 'day':
      return { start: new Date(today.setHours(0,0,0,0)), end: new Date(today.setHours(23,59,59,999)) }
    case 'week':
      return { start: startOfWeek(new Date(), { weekStartsOn: 0 }), end: endOfWeek(new Date(), { weekStartsOn: 0 }) }
    case 'month':
      return { start: startOfMonth(new Date()), end: endOfMonth(new Date()) }
    case 'custom':
      return { start: parseISO(customFrom), end: parseISO(customTo) }
  }
}

function getPrevInterval(range: Range, cur: { start: Date; end: Date }): { start: Date; end: Date } {
  const diff = cur.end.getTime() - cur.start.getTime()
  return {
    start: new Date(cur.start.getTime() - diff - 1),
    end: new Date(cur.start.getTime() - 1),
  }
}

export function StatsView() {
  const lang = useLanguage()
  const t = useTranslations(lang)
  const { state } = useStore()

  const [range, setRange] = useState<Range>('week')
  const [customFrom, setCustomFrom] = useState(format(subDays(new Date(), 6), 'yyyy-MM-dd'))
  const [customTo, setCustomTo] = useState(format(new Date(), 'yyyy-MM-dd'))

  const interval = useMemo(() => getInterval(range, customFrom, customTo), [range, customFrom, customTo])
  const prevInterval = useMemo(() => getPrevInterval(range, interval), [range, interval])

  function filterTasks(iv: { start: Date; end: Date }): Task[] {
    return state.tasks.filter(task => {
      if (!task.date) return false
      const d = parseISO(task.date)
      return isWithinInterval(d, { start: iv.start, end: iv.end })
    })
  }

  const curTasks = useMemo(() => filterTasks(interval), [state.tasks, interval])
  const prevTasks = useMemo(() => filterTasks(prevInterval), [state.tasks, prevInterval])

  // Stats
  const completedCur = curTasks.filter(t => t.status === 'completed')
  const completedPrev = prevTasks.filter(t => t.status === 'completed')

  const focusMinsCur = completedCur.reduce((s, t) => s + taskDurationMinutes(t), 0)
  const focusMinsPrev = completedPrev.reduce((s, t) => s + taskDurationMinutes(t), 0)

  function growth(cur: number, prev: number): number | null {
    if (prev === 0) return null
    return Math.round(((cur - prev) / prev) * 100)
  }

  // Tag breakdown for pie chart
  const tagMinutes: Record<string, number> = {}
  completedCur.forEach(task => {
    const mins = taskDurationMinutes(task)
    task.tagIds.forEach(tid => {
      tagMinutes[tid] = (tagMinutes[tid] ?? 0) + mins
    })
  })

  const pieData = Object.entries(tagMinutes)
    .map(([tagId, minutes]) => {
      const tag = state.tags.find(t => t.id === tagId)
      return { name: tag?.name ?? tagId, minutes, color: tag?.color ?? DEFAULT_TAG_COLOR }
    })
    .sort((a, b) => b.minutes - a.minutes)

  // Efficiency line chart: daily completed minutes in current range
  const days = eachDayOfInterval({ start: interval.start, end: interval.end })
  const prevDays = eachDayOfInterval({ start: prevInterval.start, end: prevInterval.end })

  const dailyCur = days.map(d => {
    const dateStr = format(d, 'yyyy-MM-dd')
    const mins = state.tasks
      .filter(t => t.date === dateStr && t.status === 'completed')
      .reduce((s, t) => s + taskDurationMinutes(t), 0)
    return { date: lang === 'zh' ? format(d, 'M/d') : format(d, 'M/d'), value: Math.round(mins / 60 * 10) / 10 }
  })

  const dailyPrev = prevDays.map(d => {
    const dateStr = format(d, 'yyyy-MM-dd')
    const mins = state.tasks
      .filter(t => t.date === dateStr && t.status === 'completed')
      .reduce((s, t) => s + taskDurationMinutes(t), 0)
    return { date: lang === 'zh' ? format(d, 'M/d') : format(d, 'M/d'), value: Math.round(mins / 60 * 10) / 10 }
  })

  // Merge for chart
  const maxLen = Math.max(dailyCur.length, dailyPrev.length)
  const lineData = Array.from({ length: maxLen }, (_, i) => ({
    name: dailyCur[i]?.date ?? dailyPrev[i]?.date ?? `Day ${i + 1}`,
    [t.stats.thisPeriod]: dailyCur[i]?.value ?? 0,
    [t.stats.prevPeriod]: dailyPrev[i]?.value ?? 0,
  }))

  // Streak: count consecutive days with at least one task (ending today)
  let streak = 0
  let checkDay = new Date()
  while (true) {
    const ds = format(checkDay, 'yyyy-MM-dd')
    if (state.tasks.some(t => t.date === ds)) {
      streak++
      checkDay = subDays(checkDay, 1)
    } else break
    if (streak > 365) break
  }

  const RANGES: { key: Range; label: string }[] = [
    { key: 'day', label: t.stats.day },
    { key: 'week', label: t.stats.week },
    { key: 'month', label: t.stats.month },
    { key: 'custom', label: t.stats.custom },
  ]

  const hasData = curTasks.length > 0

  return (
    <div className="flex flex-col h-[calc(100vh-2.25rem)] overflow-y-auto ml-16">
      <div className="px-4 pt-5 pb-3 shrink-0">
        <h1 className="text-xl font-semibold">{t.stats.title}</h1>
      </div>

      {/* Range picker */}
      <div className="flex gap-1 px-4 pb-3 shrink-0 flex-wrap">
        {RANGES.map(r => (
          <button
            key={r.key}
            onClick={() => setRange(r.key)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
              range === r.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            {r.label}
          </button>
        ))}
        {range === 'custom' && (
          <div className="flex gap-2 items-center mt-2 w-full">
            <input
              type="date"
              value={customFrom}
              onChange={e => setCustomFrom(e.target.value)}
              className="h-8 text-xs px-2 rounded border border-input bg-background"
            />
            <span className="text-xs text-muted-foreground">—</span>
            <input
              type="date"
              value={customTo}
              onChange={e => setCustomTo(e.target.value)}
              className="h-8 text-xs px-2 rounded border border-input bg-background"
            />
          </div>
        )}
      </div>

      <div className="px-4 pb-24 flex flex-col gap-5">
        {/* KPI cards */}
        <div className="grid grid-cols-3 gap-3">
          <KpiCard
            label={t.stats.totalFocus}
            value={focusMinsCur < 60
              ? `${focusMinsCur}${t.stats.minutes}`
              : `${(focusMinsCur / 60).toFixed(1)}${t.stats.hours}`}
            growth={growth(focusMinsCur, focusMinsPrev)}
            lang={lang}
            growthLabel={t.stats.growth}
          />
          <KpiCard
            label={t.stats.completedTasks}
            value={`${completedCur.length}`}
            growth={growth(completedCur.length, completedPrev.length)}
            lang={lang}
            growthLabel={t.stats.growth}
          />
          <KpiCard
            label={t.stats.streak}
            value={`${streak}`}
            unit={t.stats.days}
            lang={lang}
            growthLabel={t.stats.growth}
          />
        </div>

        {!hasData ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-muted-foreground font-medium">{t.stats.noData}</p>
            <p className="text-sm text-muted-foreground mt-1">{t.stats.noDataDesc}</p>
          </div>
        ) : (
          <>
            {/* Pie chart */}
            {pieData.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-4">
                <h2 className="text-sm font-semibold mb-1">{t.stats.tagBreakdown}</h2>
                <p className="text-xs text-muted-foreground mb-3">{t.stats.tagBreakdownDesc}</p>
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width={140} height={140}>
                    <PieChart>
                      <Pie data={pieData} dataKey="minutes" cx="50%" cy="50%" innerRadius={35} outerRadius={60}>
                        {pieData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v: number) => [`${Math.round(v)} min`, '']}
                        contentStyle={{ fontSize: 11 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-col gap-1.5 flex-1">
                    {pieData.map((entry, i) => {
                      const total = pieData.reduce((s, e) => s + e.minutes, 0)
                      const pct = total > 0 ? Math.round((entry.minutes / total) * 100) : 0
                      return (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                          <span className="flex-1 truncate text-muted-foreground">{entry.name}</span>
                          <span className="font-medium">{pct}%</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Line chart */}
            <div className="bg-card border border-border rounded-xl p-4">
              <h2 className="text-sm font-semibold mb-1">{t.stats.efficiency}</h2>
              <p className="text-xs text-muted-foreground mb-3">{t.stats.efficiencyDesc}</p>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={lineData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line
                    type="monotone"
                    dataKey={t.stats.thisPeriod}
                    stroke={CHART_COLORS.primary}
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey={t.stats.prevPeriod}
                    stroke={CHART_COLORS.secondary}
                    strokeWidth={1.5}
                    dot={false}
                    strokeDasharray="4 2"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Detail list */}
            {completedCur.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-4">
                <h2 className="text-sm font-semibold mb-3">{t.stats.details}</h2>
                <div className="flex flex-col gap-2">
                  {completedCur.map(task => {
                    const tag = state.tags.find(tg => task.tagIds[0] === tg.id)
                    const color = tag?.color ?? DEFAULT_TAG_COLOR
                    const mins = taskDurationMinutes(task)
                    return (
                      <div key={task.id} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                        <span className="flex-1 text-xs truncate">{task.title}</span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {mins < 60 ? `${mins}m` : `${(mins / 60).toFixed(1)}h`}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function KpiCard({ label, value, unit, growth, lang, growthLabel }: {
  label: string
  value: string
  unit?: string
  growth?: number | null
  lang: 'zh' | 'en'
  growthLabel: string
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-3 flex flex-col gap-1">
      <p className="text-[10px] text-muted-foreground leading-tight">{label}</p>
      <p className="text-lg font-bold leading-none">
        {value}
        {unit && <span className="text-xs font-normal text-muted-foreground ml-0.5">{unit}</span>}
      </p>
      {growth !== null && growth !== undefined && (
        <div className={cn(
          'flex items-center gap-0.5 text-[10px]',
          growth > 0 ? 'text-success' : growth < 0 ? 'text-destructive' : 'text-muted-foreground'
        )}>
          {growth > 0 ? <TrendingUp className="w-3 h-3" /> : growth < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
          <span>{growth > 0 ? '+' : ''}{growth}%</span>
        </div>
      )}
    </div>
  )
}
