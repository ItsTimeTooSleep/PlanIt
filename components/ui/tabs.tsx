'use client'

import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'

import { cn } from '@/lib/utils'

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn('flex flex-col gap-2', className)}
      {...props}
    />
  )
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        'bg-muted text-muted-foreground relative inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]',
        className,
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "data-[state=active]:bg-background dark:data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 text-foreground dark:text-muted-foreground relative z-10 inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-colors focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn('flex-1 outline-none', className)}
      {...props}
    />
  )
}

interface AnimatedTabsListProps extends React.ComponentProps<typeof TabsPrimitive.List> {
  children: React.ReactNode
}

function AnimatedTabsList({
  className,
  children,
  ...props
}: AnimatedTabsListProps) {
  const [indicatorStyle, setIndicatorStyle] = React.useState({
    left: 0,
    width: 0,
  })
  const listRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const updateIndicator = () => {
      if (!listRef.current) return
      const activeTrigger = listRef.current.querySelector('[data-state="active"]') as HTMLElement
      if (activeTrigger) {
        const listRect = listRef.current.getBoundingClientRect()
        const triggerRect = activeTrigger.getBoundingClientRect()
        setIndicatorStyle({
          left: triggerRect.left - listRect.left,
          width: triggerRect.width,
        })
      }
    }

    updateIndicator()

    const observer = new MutationObserver(updateIndicator)
    if (listRef.current) {
      observer.observe(listRef.current, {
        attributes: true,
        subtree: true,
        attributeFilter: ['data-state'],
      })
    }

    return () => observer.disconnect()
  }, [children])

  return (
    <TabsPrimitive.List
      ref={listRef}
      data-slot="tabs-list"
      className={cn(
        'bg-muted/60 text-muted-foreground relative inline-flex h-10 w-fit items-center justify-center rounded-xl p-1',
        className,
      )}
      {...props}
    >
      <div
        className="absolute h-[calc(100%-8px)] rounded-lg bg-background shadow-sm transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{
          left: `${indicatorStyle.left}px`,
          width: `${indicatorStyle.width}px`,
          top: '4px',
        }}
      />
      {children}
    </TabsPrimitive.List>
  )
}

interface AnimatedTabsTriggerProps extends React.ComponentProps<typeof TabsPrimitive.Trigger> {
  children: React.ReactNode
}

function AnimatedTabsTrigger({
  className,
  children,
  ...props
}: AnimatedTabsTriggerProps) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "relative z-10 inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      {children}
    </TabsPrimitive.Trigger>
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, AnimatedTabsList, AnimatedTabsTrigger }
