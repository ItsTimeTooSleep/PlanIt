'use client'

import { useLanguage } from '@/lib/store'
import { useTranslations } from '@/lib/i18n'
import type { Tag } from '@/lib/types'
import { Tabs, AnimatedTabsList, AnimatedTabsTrigger, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Plus, ArrowUpDown, List, Tag as TagIcon, Check } from 'lucide-react'
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

interface FilterBarProps {
  timeFilter: TimeFilter
  statusFilter: StatusFilter
  tagFilter: string | null
  sortBy: SortBy
  groupBy: GroupBy
  tags: Tag[]
  onTimeFilterChange: (filter: TimeFilter) => void
  onStatusFilterChange: (filter: StatusFilter) => void
  onTagFilterChange: (tagId: string | null) => void
  onSortByChange: (sort: SortBy) => void
  onGroupByChange: (group: GroupBy) => void
  onAddTask: () => void
}

export function FilterBar({
  timeFilter,
  statusFilter,
  tagFilter,
  sortBy,
  groupBy,
  tags,
  onTimeFilterChange,
  onStatusFilterChange,
  onTagFilterChange,
  onSortByChange,
  onGroupByChange,
  onAddTask,
}: FilterBarProps) {
  const lang = useLanguage()
  const t = useTranslations(lang)

  const selectedTagName = tagFilter 
    ? tags.find(tag => tag.id === tagFilter)?.name 
    : null

  return (
    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/60">
      <div className="max-w-5xl mx-auto px-6 py-5 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t.todo.title}</h1>
            <p className="text-muted-foreground text-sm mt-0.5">{t.todo.subtitle}</p>
          </div>
          <Button onClick={onAddTask} className="shadow-sm">
            <Plus className="w-4 h-4 mr-2" />
            {t.todo.addTask}
          </Button>
        </div>

        <div className="space-y-4">
          <Tabs value={timeFilter} onValueChange={(v) => onTimeFilterChange(v as TimeFilter)}>
            <AnimatedTabsList className="grid grid-cols-6 w-full max-w-2xl">
              <AnimatedTabsTrigger value="today">{t.todo.timeFilter.today}</AnimatedTabsTrigger>
              <AnimatedTabsTrigger value="week">{t.todo.timeFilter.week}</AnimatedTabsTrigger>
              <AnimatedTabsTrigger value="month">{t.todo.timeFilter.month}</AnimatedTabsTrigger>
              <AnimatedTabsTrigger value="overdue">{t.todo.timeFilter.overdue}</AnimatedTabsTrigger>
              <AnimatedTabsTrigger value="upcoming">{t.todo.timeFilter.upcoming}</AnimatedTabsTrigger>
              <AnimatedTabsTrigger value="all">{t.todo.timeFilter.all}</AnimatedTabsTrigger>
            </AnimatedTabsList>
          </Tabs>

          <div className="flex flex-wrap items-center gap-3">
            <Tabs value={statusFilter} onValueChange={(v) => onStatusFilterChange(v as StatusFilter)}>
              <TabsList className="h-8">
                <TabsTrigger value="pending" className="h-6 text-xs px-3">{t.todo.statusFilter.pending}</TabsTrigger>
                <TabsTrigger value="completed" className="h-6 text-xs px-3">{t.todo.statusFilter.completed}</TabsTrigger>
                <TabsTrigger value="skipped" className="h-6 text-xs px-3">{t.todo.statusFilter.skipped}</TabsTrigger>
                <TabsTrigger value="all" className="h-6 text-xs px-3">{t.todo.statusFilter.all}</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex-1" />

            {tags.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 shadow-sm">
                    <TagIcon className="w-3.5 h-3.5 mr-1.5" />
                    {selectedTagName || t.todo.tagFilter.all}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-40">
                  <DropdownMenuLabel>{t.todo.tagFilter.label}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onTagFilterChange(null)}
                    className="flex items-center justify-between"
                  >
                    {t.todo.tagFilter.all}
                    {tagFilter === null && <Check className="w-4 h-4" />}
                  </DropdownMenuItem>
                  {tags.map(tag => (
                    <DropdownMenuItem 
                      key={tag.id}
                      onClick={() => onTagFilterChange(tag.id)}
                      className="flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <span 
                          className="w-2.5 h-2.5 rounded-full" 
                          style={{ backgroundColor: tag.color }}
                        />
                        {tag.name}
                      </span>
                      {tagFilter === tag.id && <Check className="w-4 h-4" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 shadow-sm">
                  <ArrowUpDown className="w-3.5 h-3.5 mr-1.5" />
                  {t.todo.sortBy[sortBy]}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                <DropdownMenuLabel>{t.todo.sortBy.date}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onSortByChange('date')}>{t.todo.sortBy.date}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSortByChange('time')}>{t.todo.sortBy.time}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSortByChange('title')}>{t.todo.sortBy.title}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSortByChange('status')}>{t.todo.sortBy.status}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 shadow-sm">
                  <List className="w-3.5 h-3.5 mr-1.5" />
                  {t.todo.groupBy[groupBy]}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                <DropdownMenuLabel>{t.todo.groupBy.none}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onGroupByChange('none')}>{t.todo.groupBy.none}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onGroupByChange('date')}>{t.todo.groupBy.date}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onGroupByChange('status')}>{t.todo.groupBy.status}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onGroupByChange('tag')}>{t.todo.groupBy.tag}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  )
}
