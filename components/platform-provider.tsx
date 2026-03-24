'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import {
  PlatformAPI,
  PlatformCapabilities,
  getPlatformAPI,
  resetPlatformCache,
  PlatformType,
} from '@/lib/platform'

interface PlatformContextValue {
  api: PlatformAPI | null
  capabilities: PlatformCapabilities
  platform: PlatformType
  isLoading: boolean
  isReady: boolean
}

const defaultCapabilities: PlatformCapabilities = {
  isDesktop: false,
  isWeb: true,
  platform: 'web',
  supportsSystemTray: false,
  supportsAutoLaunch: false,
  supportsGlobalShortcuts: false,
  supportsLocalFileAccess: false,
  supportsWindowControls: false,
  supportsNativeNotifications: false,
  supportsClipboardHistory: false,
  supportsFocusMode: false,
}

const PlatformContext = createContext<PlatformContextValue>({
  api: null,
  capabilities: defaultCapabilities,
  platform: 'web',
  isLoading: true,
  isReady: false,
})

interface PlatformProviderProps {
  children: ReactNode
}

/**
 * 平台 Provider 组件
 * 提供平台检测和平台特定 API 的访问
 * @param props.children - 子组件
 */
export function PlatformProvider({ children }: PlatformProviderProps) {
  const [api, setAPI] = useState<PlatformAPI | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [capabilities, setCapabilities] = useState<PlatformCapabilities>(defaultCapabilities)
  const [platform, setPlatform] = useState<PlatformType>('web')

  useEffect(() => {
    let mounted = true

    async function initPlatform() {
      try {
        resetPlatformCache()
        const platformAPI = await getPlatformAPI()
        
        if (mounted) {
          setAPI(platformAPI)
          setCapabilities(platformAPI.capabilities)
          setPlatform(platformAPI.capabilities.platform)
        }
      } catch (error) {
        console.error('[PlatformProvider] Failed to initialize platform:', error)
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    initPlatform()

    return () => {
      mounted = false
    }
  }, [])

  const value: PlatformContextValue = {
    api,
    capabilities,
    platform,
    isLoading,
    isReady: !isLoading && api !== null,
  }

  return (
    <PlatformContext.Provider value={value}>
      {children}
    </PlatformContext.Provider>
  )
}

/**
 * 获取平台上下文
 * @returns 平台上下文值
 * @throws 如果在 PlatformProvider 外部使用
 */
export function usePlatform(): PlatformContextValue {
  const context = useContext(PlatformContext)
  if (!context) {
    throw new Error('usePlatform must be used within a PlatformProvider')
  }
  return context
}

/**
 * 获取平台 API
 * @returns 平台 API 实例，如果未初始化完成则返回 null
 */
export function usePlatformAPI(): PlatformAPI | null {
  const { api } = usePlatform()
  return api
}

/**
 * 获取平台能力
 * @returns 平台能力描述
 */
export function usePlatformCapabilities(): PlatformCapabilities {
  const { capabilities } = usePlatform()
  return capabilities
}

/**
 * 检测是否为桌面环境
 * @returns 是否为桌面环境
 */
export function useIsDesktop(): boolean {
  const { capabilities } = usePlatform()
  return capabilities.isDesktop
}

/**
 * 检测是否为 Web 环境
 * @returns 是否为 Web 环境
 */
export function useIsWeb(): boolean {
  const { capabilities } = usePlatform()
  return capabilities.isWeb
}

/**
 * 条件渲染钩子 - 仅在桌面环境渲染
 * @returns 是否应该渲染
 */
export function useDesktopOnly(): boolean {
  const { capabilities, isReady } = usePlatform()
  return isReady && capabilities.isDesktop
}

/**
 * 条件渲染钩子 - 仅在 Web 环境渲染
 * @returns 是否应该渲染
 */
export function useWebOnly(): boolean {
  const { capabilities, isReady } = usePlatform()
  return isReady && capabilities.isWeb
}

/**
 * 获取特定平台功能的支持状态
 * @param capability - 功能名称
 * @returns 是否支持该功能
 */
export function useCapability<K extends keyof PlatformCapabilities>(
  capability: K
): PlatformCapabilities[K] {
  const { capabilities } = usePlatform()
  return capabilities[capability]
}

/**
 * 平台条件渲染组件
 * @param props.desktop - 桌面端渲染内容
 * @param props.web - Web 端渲染内容
 * @param props.fallback - 默认渲染内容
 */
export function PlatformSwitch({
  desktop,
  web,
  fallback,
}: {
  desktop?: ReactNode
  web?: ReactNode
  fallback?: ReactNode
}): ReactNode {
  const { capabilities, isReady, isLoading } = usePlatform()

  if (isLoading) {
    return fallback ?? null
  }

  if (!isReady) {
    return fallback ?? null
  }

  if (capabilities.isDesktop && desktop) {
    return desktop
  }

  if (capabilities.isWeb && web) {
    return web
  }

  return fallback ?? null
}

/**
 * 仅在桌面端渲染子组件
 * @param props.children - 子组件
 */
export function DesktopOnly({ children }: { children: ReactNode }): ReactNode {
  const shouldRender = useDesktopOnly()
  return shouldRender ? children : null
}

/**
 * 仅在 Web 端渲染子组件
 * @param props.children - 子组件
 */
export function WebOnly({ children }: { children: ReactNode }): ReactNode {
  const shouldRender = useWebOnly()
  return shouldRender ? children : null
}
