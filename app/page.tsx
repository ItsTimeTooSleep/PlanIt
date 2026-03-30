'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'

/**
 * 根页面重定向组件
 * 根据用户设置的启动页面进行重定向
 * @returns null - 不渲染任何内容
 */
export default function RootPage() {
  const router = useRouter()
  const { state } = useStore()

  useEffect(() => {
    const startupPage = state.settings.startupPage || '/home'
    router.replace(startupPage)
  }, [state.settings.startupPage, router])

  return null
}
