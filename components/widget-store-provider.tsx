'use client'

import { createContext, useContext, ReactNode } from 'react'
import { WidgetStoreContextValue, WidgetStoreContext, useWidgetStoreState } from '@/lib/widget-store'

/**
 * 组件状态提供者
 * @param props - 组件属性
 * @param props.children - 子组件
 * @returns 组件状态提供者
 */
export function WidgetStoreProvider({ children }: { children: ReactNode }) {
  const store = useWidgetStoreState()

  return (
    <WidgetStoreContext.Provider value={store}>
      {children}
    </WidgetStoreContext.Provider>
  )
}

export function useWidgetStore(): WidgetStoreContextValue {
  const ctx = useContext(WidgetStoreContext)
  if (!ctx) throw new Error('useWidgetStore must be used within WidgetStoreProvider')
  return ctx
}
