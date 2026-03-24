'use client'

import { format } from 'date-fns'

interface HeaderViewProps {
  now: Date
  lang: 'zh' | 'en'
}

export function HeaderView({ now, lang }: HeaderViewProps) {
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  const dateDisplay = lang === 'zh'
    ? `${format(now, 'M月d日')} 周${weekdays[now.getDay()]}`
    : format(now, 'MMM d, EEEE')

  return (
    <div className="flex items-start justify-between">
      <div>
        <p className="text-base font-medium text-foreground tracking-wide">
          {dateDisplay}
        </p>
      </div>
      <div className="text-right">
        <p className="text-2xl font-mono font-semibold text-primary tabular-nums leading-none">
          {format(now, 'HH:mm:ss')}
        </p>
      </div>
    </div>
  )
}
