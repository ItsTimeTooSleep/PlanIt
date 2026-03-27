'use client'

import { useLanguage } from '@/lib/store'
import { useTranslations } from '@/lib/i18n'
import type { Tag } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Plus, ArrowUpDown, List, Tag as TagIcon, Check, Calendar, Clock, ChevronDown, Eye } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export type TimeFilter = 'all' | 'today' | 'week' | 'month' | 'overdue' | 'upcoming'
export type StatusFilter = 'all' | 'pending' | 'completed' | 'skipped'
export type SortBy = 'date' | 'time' | 'title' | 'status'
export type GroupBy = 'none' | 'date' | 'status' | 'tag'
export type ViewMode = 'byDate' | 'byDueDate'

interface FilterBarProps {
  timeFilter: TimeFilter
  statusFilter: StatusFilter
  tagFilter: string | null
  sortBy: SortBy
  groupBy: GroupBy
  viewMode: ViewMode
  tags: Tag[]
  completedCount: number
  totalCount: number
  onTimeFilterChange: (filter: TimeFilter) => void
  onStatusFilterChange: (filter: StatusFilter) => void
  onTagFilterChange: (tagId: string | null) => void
  onSortByChange: (sort: SortBy) => void
  onGroupByChange: (group: GroupBy) => void
  onViewModeChange: (mode: ViewMode) => void
  onAddTask: () => void
}

export function FilterBar({
  timeFilter,
  statusFilter,
  tagFilter,
  sortBy,
  groupBy,
  viewMode,
  tags,
  completedCount,
  totalCount,
  onTimeFilterChange,
  onStatusFilterChange,
  onTagFilterChange,
  onSortByChange,
  onGroupByChange,
  onViewModeChange,
  onAddTask,
}: FilterBarProps) {
  const lang = useLanguage()
  const t = useTranslations(lang)

  const selectedTagName = tagFilter 
    ? tags.find(tag => tag.id === tagFilter)?.name 
    : null

  return (
    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/60">
      <div className="max-w-5xl mx-auto px-6 py-3 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight">{t.todo.title}</h1>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mr-2">
              <Progress
                value={totalCount > 0 ? (completedCount / totalCount) * 100 : 0}
                className="h-1.5 w-16"
              />
              <span className="tabular-nums">{completedCount}/{totalCount}</span>
            </div>
            <Button onClick={onAddTask} size="sm" className="shadow-sm h-7">
              <Plus className="w-3.5 h-3.5 mr-1" />
              {t.todo.addTask}
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 shadow-sm gap-1">
                <Eye className="w-3.5 h-3.5" />
                <span className="text-xs">{t.todo.viewMode[viewMode]}</span>
                <ChevronDown className="w-3 h-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-32">
              <DropdownMenuLabel className="text-xs">{t.todo.viewMode.label}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onViewModeChange('byDate')} className="flex items-center justify-between text-xs">
                {t.todo.viewMode.byDate}
                {viewMode === 'byDate' && <Check className="w-3.5 h-3.5" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onViewModeChange('byDueDate')} className="flex items-center justify-between text-xs">
                {t.todo.viewMode.byDueDate}
                {viewMode === 'byDueDate' && <Check className="w-3.5 h-3.5" />}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 shadow-sm gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span className="text-xs">{t.todo.timeFilter[timeFilter]}</span>
                <ChevronDown className="w-3 h-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-32">
              <DropdownMenuLabel className="text-xs">{t.todo.timeFilter.label}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onTimeFilterChange('today')} className="flex items-center justify-between text-xs">
                {t.todo.timeFilter.today}
                {timeFilter === 'today' && <Check className="w-3.5 h-3.5" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onTimeFilterChange('week')} className="flex items-center justify-between text-xs">
                {t.todo.timeFilter.week}
                {timeFilter === 'week' && <Check className="w-3.5 h-3.5" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onTimeFilterChange('month')} className="flex items-center justify-between text-xs">
                {t.todo.timeFilter.month}
                {timeFilter === 'month' && <Check className="w-3.5 h-3.5" />}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onTimeFilterChange('overdue')} className="flex items-center justify-between text-xs">
                {t.todo.timeFilter.overdue}
                {timeFilter === 'overdue' && <Check className="w-3.5 h-3.5" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onTimeFilterChange('upcoming')} className="flex items-center justify-between text-xs">
                {t.todo.timeFilter.upcoming}
                {timeFilter === 'upcoming' && <Check className="w-3.5 h-3.5" />}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onTimeFilterChange('all')} className="flex items-center justify-between text-xs">
                {t.todo.timeFilter.all}
                {timeFilter === 'all' && <Check className="w-3.5 h-3.5" />}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 shadow-sm gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-xs">{t.todo.statusFilter[statusFilter]}</span>
                <ChevronDown className="w-3 h-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-28">
              <DropdownMenuLabel className="text-xs">{t.todo.statusFilter.label}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onStatusFilterChange('pending')} className="flex items-center justify-between text-xs">
                {t.todo.statusFilter.pending}
                {statusFilter === 'pending' && <Check className="w-3.5 h-3.5" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusFilterChange('completed')} className="flex items-center justify-between text-xs">
                {t.todo.statusFilter.completed}
                {statusFilter === 'completed' && <Check className="w-3.5 h-3.5" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusFilterChange('skipped')} className="flex items-center justify-between text-xs">
                {t.todo.statusFilter.skipped}
                {statusFilter === 'skipped' && <Check className="w-3.5 h-3.5" />}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onStatusFilterChange('all')} className="flex items-center justify-between text-xs">
                {t.todo.statusFilter.all}
                {statusFilter === 'all' && <Check className="w-3.5 h-3.5" />}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {tags.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 shadow-sm gap-1">
                  <TagIcon className="w-3.5 h-3.5" />
                  <span className="text-xs max-w-16 truncate">{selectedTagName || t.todo.tagFilter.all}</span>
                  <ChevronDown className="w-3 h-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-36">
                <DropdownMenuLabel className="text-xs">{t.todo.tagFilter.label}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onTagFilterChange(null)}
                  className="flex items-center justify-between text-xs"
                >
                  {t.todo.tagFilter.all}
                  {tagFilter === null && <Check className="w-3.5 h-3.5" />}
                </DropdownMenuItem>
                {tags.map(tag => (
                  <DropdownMenuItem 
                    key={tag.id}
                    onClick={() => onTagFilterChange(tag.id)}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="flex items-center gap-1.5">
                      <span 
                        className="w-2 h-2 rounded-full shrink-0" 
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="truncate">{tag.name}</span>
                    </span>
                    {tagFilter === tag.id && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <div className="flex-1" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 shadow-sm gap-1">
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span className="text-xs">{t.todo.sortBy[sortBy]}</span>
                <ChevronDown className="w-3 h-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-28">
              <DropdownMenuLabel className="text-xs">{t.todo.sortBy.label}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onSortByChange('date')} className="flex items-center justify-between text-xs">
                {t.todo.sortBy.date}
                {sortBy === 'date' && <Check className="w-3.5 h-3.5" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSortByChange('time')} className="flex items-center justify-between text-xs">
                {t.todo.sortBy.time}
                {sortBy === 'time' && <Check className="w-3.5 h-3.5" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSortByChange('title')} className="flex items-center justify-between text-xs">
                {t.todo.sortBy.title}
                {sortBy === 'title' && <Check className="w-3.5 h-3.5" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSortByChange('status')} className="flex items-center justify-between text-xs">
                {t.todo.sortBy.status}
                {sortBy === 'status' && <Check className="w-3.5 h-3.5" />}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 shadow-sm gap-1">
                <List className="w-3.5 h-3.5" />
                <span className="text-xs">{t.todo.groupBy[groupBy]}</span>
                <ChevronDown className="w-3 h-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-28">
              <DropdownMenuLabel className="text-xs">{t.todo.groupBy.label}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onGroupByChange('none')} className="flex items-center justify-between text-xs">
                {t.todo.groupBy.none}
                {groupBy === 'none' && <Check className="w-3.5 h-3.5" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onGroupByChange('date')} className="flex items-center justify-between text-xs">
                {t.todo.groupBy.date}
                {groupBy === 'date' && <Check className="w-3.5 h-3.5" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onGroupByChange('status')} className="flex items-center justify-between text-xs">
                {t.todo.groupBy.status}
                {groupBy === 'status' && <Check className="w-3.5 h-3.5" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onGroupByChange('tag')} className="flex items-center justify-between text-xs">
                {t.todo.groupBy.tag}
                {groupBy === 'tag' && <Check className="w-3.5 h-3.5" />}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
