'use client'

interface ProgressBarProps {
  completedCount: number
  totalCount: number
  lang: 'zh' | 'en'
  compact?: boolean
}

export function ProgressBar({ completedCount, totalCount, lang, compact = false }: ProgressBarProps) {
  const percentage = totalCount ? Math.round((completedCount / totalCount) * 100) : 0

  if (compact) {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            {lang === 'zh' ? '今日任务' : 'Today\'s Tasks'}
          </span>
          <span className="text-xs font-semibold tabular-nums">
            {completedCount}/{totalCount}
          </span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-700"
          style={{ width: totalCount ? `${(completedCount / totalCount) * 100}%` : '0%' }}
        />
      </div>
      <span className="text-sm font-medium text-muted-foreground shrink-0 tabular-nums">
        {lang === 'zh' ? `今日任务：${completedCount}/${totalCount} 已完成` : `${completedCount}/${totalCount} tasks completed`}
      </span>
    </div>
  )
}
