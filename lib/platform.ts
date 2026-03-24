'use client'

export type PlatformType = 'web' | 'windows' | 'macos' | 'linux'

export interface SystemTrayConfig {
  icon: string
  tooltip?: string
  menuItems: TrayMenuItem[]
}

export interface TrayMenuItem {
  id: string
  label: string
  enabled?: boolean
  separator?: boolean
  accelerator?: string
  submenu?: boolean
  children?: TrayMenuItem[]
}

export interface NotificationOptions {
  title: string
  body: string
  icon?: string
  sound?: boolean
}

export interface FileFilter {
  name: string
  extensions: string[]
}

export interface FileDialogOptions {
  title?: string
  defaultPath?: string
  filters?: FileFilter[]
  multiple?: boolean
}

export interface AutoLaunchConfig {
  enabled: boolean
  minimized?: boolean
}

export interface GlobalShortcutConfig {
  accelerator: string
  handler: () => void
}

export interface WindowState {
  x?: number
  y?: number
  width: number
  height: number
  isMaximized?: boolean
  isMinimized?: boolean
}

export interface PlatformCapabilities {
  isDesktop: boolean
  isWeb: boolean
  platform: PlatformType
  supportsSystemTray: boolean
  supportsAutoLaunch: boolean
  supportsGlobalShortcuts: boolean
  supportsLocalFileAccess: boolean
  supportsWindowControls: boolean
  supportsNativeNotifications: boolean
  supportsClipboardHistory: boolean
  supportsFocusMode: boolean
}

export interface PlatformAPI {
  capabilities: PlatformCapabilities
  
  openExternalLink: (url: string) => Promise<void>
  
  showNotification: (options: NotificationOptions) => Promise<void>
  
  setAutoLaunch: (config: AutoLaunchConfig) => Promise<void>
  getAutoLaunch: () => Promise<boolean>
  
  setCloseBehavior: (behavior: 'exit' | 'tray') => Promise<void>
  getCloseBehavior: () => Promise<'exit' | 'tray'>
  
  onTrayEvent: (callback: (eventId: string) => void) => () => void
  
  registerGlobalShortcut: (config: GlobalShortcutConfig) => Promise<boolean>
  unregisterGlobalShortcut: (accelerator: string) => Promise<void>
  
  openFilePicker: (options?: FileDialogOptions) => Promise<string[] | null>
  saveFilePicker: (options?: FileDialogOptions) => Promise<string | null>
  readFile: (path: string) => Promise<string>
  writeFile: (path: string, content: string) => Promise<void>
  
  getWindowState: () => Promise<WindowState>
  setWindowState: (state: Partial<WindowState>) => Promise<void>
  minimizeWindow: () => Promise<void>
  maximizeWindow: () => Promise<void>
  closeWindow: () => Promise<void>
  hideWindow: () => Promise<void>
  
  writeToClipboard: (text: string) => Promise<void>
  readFromClipboard: () => Promise<string>
  
  getPlatformInfo: () => Promise<{
    os: 'windows' | 'macos' | 'linux' | 'unknown'
    arch: string
    version: string
    appName: string
    appVersion: string
  }>
  
  enterFocusMode: () => Promise<void>
  exitFocusMode: () => Promise<void>
  isFocusModeActive: () => Promise<boolean>
}

const webCapabilities: PlatformCapabilities = {
  isDesktop: false,
  isWeb: true,
  platform: 'web',
  supportsSystemTray: false,
  supportsAutoLaunch: false,
  supportsGlobalShortcuts: false,
  supportsLocalFileAccess: false,
  supportsWindowControls: false,
  supportsNativeNotifications: typeof window !== 'undefined' && 'Notification' in window,
  supportsClipboardHistory: false,
  supportsFocusMode: false,
}

const webAPI: PlatformAPI = {
  capabilities: webCapabilities,
  
  openExternalLink: async (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  },
  
  showNotification: async (options: NotificationOptions) => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        new Notification(options.title, {
          body: options.body,
          icon: options.icon,
        })
      }
    }
  },
  
  setAutoLaunch: async () => {
    console.warn('[Platform] Auto-launch is not supported on web platform')
  },
  
  getAutoLaunch: async () => false,
  
  setCloseBehavior: async () => {
    console.warn('[Platform] Close behavior is not supported on web platform')
  },
  
  getCloseBehavior: async () => 'exit',
  
  onTrayEvent: () => {
    console.warn('[Platform] System tray is not supported on web platform')
    return () => {}
  },
  
  registerGlobalShortcut: async () => {
    console.warn('[Platform] Global shortcuts are not supported on web platform')
    return false
  },
  
  unregisterGlobalShortcut: async () => {
    console.warn('[Platform] Global shortcuts are not supported on web platform')
  },
  
  openFilePicker: async () => {
    console.warn('[Platform] File picker is not supported on web platform')
    return null
  },
  
  saveFilePicker: async () => {
    console.warn('[Platform] File picker is not supported on web platform')
    return null
  },
  
  readFile: async () => {
    throw new Error('[Platform] File reading is not supported on web platform')
  },
  
  writeFile: async () => {
    throw new Error('[Platform] File writing is not supported on web platform')
  },
  
  getWindowState: async () => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }),
  
  setWindowState: async () => {
    console.warn('[Platform] Window controls are not supported on web platform')
  },
  
  minimizeWindow: async () => {
    console.warn('[Platform] Window controls are not supported on web platform')
  },
  
  maximizeWindow: async () => {
    console.warn('[Platform] Window controls are not supported on web platform')
  },
  
  closeWindow: async () => {
    console.warn('[Platform] Window controls are not supported on web platform')
  },
  
  hideWindow: async () => {
    console.warn('[Platform] Window controls are not supported on web platform')
  },
  
  writeToClipboard: async (text: string) => {
    await navigator.clipboard.writeText(text)
  },
  
  readFromClipboard: async () => {
    return await navigator.clipboard.readText()
  },
  
  getPlatformInfo: async () => ({
    os: 'unknown',
    arch: 'unknown',
    version: 'unknown',
    appName: 'PlanIt',
    appVersion: '1.0.0',
  }),
  
  enterFocusMode: async () => {
    console.warn('[Platform] Focus mode is not supported on web platform')
  },
  
  exitFocusMode: async () => {
    console.warn('[Platform] Focus mode is not supported on web platform')
  },
  
  isFocusModeActive: async () => false,
}

let cachedPlatformAPI: PlatformAPI | null = null
let cachedCapabilities: PlatformCapabilities | null = null

/**
 * 检测当前平台类型
 * @returns 平台类型
 */
export function detectPlatform(): PlatformType {
  if (typeof window === 'undefined') return 'web'
  
  const hasTauri = '__TAURI__' in window
  const hasTauriInternals = '__TAURI_INTERNALS__' in window
  
  if (hasTauri || hasTauriInternals) {
    const userAgent = navigator.userAgent.toLowerCase()
    if (userAgent.includes('win')) return 'windows'
    if (userAgent.includes('mac')) return 'macos'
    if (userAgent.includes('linux')) return 'linux'
    return 'windows'
  }
  
  return 'web'
}

/**
 * 快速检测是否为桌面环境
 * @returns 是否为桌面环境
 */
export function isDesktop(): boolean {
  if (typeof window === 'undefined') return false
  return '__TAURI__' in window || '__TAURI_INTERNALS__' in window
}

/**
 * 快速检测是否为 Web 环境
 * @returns 是否为 Web 环境
 */
export function isWeb(): boolean {
  return !isDesktop()
}

/**
 * 获取平台能力（同步版本，用于快速检测）
 * @returns 平台能力
 */
export function getPlatformCapabilities(): PlatformCapabilities {
  const platform = detectPlatform()
  const isDesktopEnv = platform !== 'web'
  
  return {
    isDesktop: isDesktopEnv,
    isWeb: !isDesktopEnv,
    platform,
    supportsSystemTray: isDesktopEnv,
    supportsAutoLaunch: isDesktopEnv,
    supportsGlobalShortcuts: isDesktopEnv,
    supportsLocalFileAccess: isDesktopEnv,
    supportsWindowControls: isDesktopEnv,
    supportsNativeNotifications: true,
    supportsClipboardHistory: isDesktopEnv,
    supportsFocusMode: isDesktopEnv,
  }
}

/**
 * 获取平台 API 实例
 * @returns 平台 API
 */
export async function getPlatformAPI(): Promise<PlatformAPI> {
  const platform = detectPlatform()
  
  if (platform === 'web') {
    cachedPlatformAPI = webAPI
    return webAPI
  }
  
  if (cachedPlatformAPI && cachedPlatformAPI !== webAPI) {
    return cachedPlatformAPI
  }
  
  try {
    const tauriAPI = await createTauriAPI(platform)
    cachedPlatformAPI = tauriAPI
    return tauriAPI
  } catch (error) {
    console.error('[Platform] Failed to load Tauri API, falling back to web API:', error)
    cachedPlatformAPI = webAPI
    return webAPI
  }
}

/**
 * 创建 Tauri 平台 API
 * @param platform 平台类型
 * @returns Tauri 平台 API
 */
async function createTauriAPI(platform: PlatformType): Promise<PlatformAPI> {
  const tauriModules = await loadTauriModules()
  
  const { invoke, open, getCurrentWindow, listen } = tauriModules
  
  const capabilities: PlatformCapabilities = {
    isDesktop: true,
    isWeb: false,
    platform,
    supportsSystemTray: true,
    supportsAutoLaunch: true,
    supportsGlobalShortcuts: true,
    supportsLocalFileAccess: true,
    supportsWindowControls: true,
    supportsNativeNotifications: true,
    supportsClipboardHistory: true,
    supportsFocusMode: true,
  }
  
  const trayCallbacks = new Set<(eventId: string) => void>()
  
  listen<string>('tray-pomodoro-action', (event) => {
    trayCallbacks.forEach(cb => cb(event.payload))
  }).catch(console.error)
  
  listen<string>('open-settings', () => {
    trayCallbacks.forEach(cb => cb('settings'))
  }).catch(console.error)
  
  listen<string>('check-for-updates', () => {
    trayCallbacks.forEach(cb => cb('check-update'))
  }).catch(console.error)
  
  listen<boolean>('focus-mode-changed', (event) => {
    if (event.payload) {
      trayCallbacks.forEach(cb => cb('enter-focus-mode'))
    } else {
      trayCallbacks.forEach(cb => cb('exit-focus-mode'))
    }
  }).catch(console.error)
  
  listen<string>('global-shortcut-triggered', (event) => {
    trayCallbacks.forEach(cb => cb(`shortcut:${event.payload}`))
  }).catch(console.error)
  
  return {
    capabilities,
    
    openExternalLink: async (url: string) => {
      await open(url)
    },
    
    showNotification: async (options: NotificationOptions) => {
      await invoke('show_notification', {
        title: options.title,
        body: options.body,
        icon: options.icon,
        sound: options.sound ?? true,
      })
    },
    
    setAutoLaunch: async (config: AutoLaunchConfig) => {
      await invoke('set_auto_launch', {
        enabled: config.enabled,
        minimized: config.minimized ?? false,
      })
    },
    
    getAutoLaunch: async () => {
      return await invoke<boolean>('get_auto_launch')
    },
    
    setCloseBehavior: async (behavior: 'exit' | 'tray') => {
      await invoke('set_close_behavior', { behavior })
    },
    
    getCloseBehavior: async () => {
      return await invoke<'exit' | 'tray'>('get_close_behavior')
    },
    
    onTrayEvent: (callback: (eventId: string) => void) => {
      trayCallbacks.add(callback)
      
      return () => {
        trayCallbacks.delete(callback)
      }
    },
    
    registerGlobalShortcut: async (config: GlobalShortcutConfig) => {
      return await invoke<boolean>('register_global_shortcut', {
        accelerator: config.accelerator,
      })
    },
    
    unregisterGlobalShortcut: async (accelerator: string) => {
      await invoke('unregister_global_shortcut', { accelerator })
    },
    
    openFilePicker: async (options?: FileDialogOptions) => {
      return await invoke<string[] | null>('open_file_picker', {
        title: options?.title,
        defaultPath: options?.defaultPath,
        filters: options?.filters,
        multiple: options?.multiple ?? false,
      })
    },
    
    saveFilePicker: async (options?: FileDialogOptions) => {
      return await invoke<string | null>('save_file_picker', {
        title: options?.title,
        defaultPath: options?.defaultPath,
        filters: options?.filters,
      })
    },
    
    readFile: async (path: string) => {
      return await invoke<string>('read_file', { path })
    },
    
    writeFile: async (path: string, content: string) => {
      await invoke('write_file', { path, content })
    },
    
    getWindowState: async () => {
      const win = getCurrentWindow()
      const [position, size, isMaximized] = await Promise.all([
        win.outerPosition(),
        win.outerSize(),
        win.isMaximized(),
      ])
      
      return {
        x: position.x,
        y: position.y,
        width: size.width,
        height: size.height,
        isMaximized,
      }
    },
    
    setWindowState: async (state: Partial<WindowState>) => {
      const win = getCurrentWindow()
      
      if (state.x !== undefined && state.y !== undefined) {
        await win.setPosition({ type: 'Physical', x: state.x, y: state.y })
      }
      if (state.width !== undefined && state.height !== undefined) {
        await win.setSize({ type: 'Physical', width: state.width, height: state.height })
      }
    },
    
    minimizeWindow: async () => {
      await getCurrentWindow().minimize()
    },
    
    maximizeWindow: async () => {
      const win = getCurrentWindow()
      if (await win.isMaximized()) {
        await win.unmaximize()
      } else {
        await win.maximize()
      }
    },
    
    closeWindow: async () => {
      await getCurrentWindow().close()
    },
    
    writeToClipboard: async (text: string) => {
      await invoke('write_clipboard', { text })
    },
    
    readFromClipboard: async () => {
      return await invoke<string>('read_clipboard')
    },
    
    getPlatformInfo: async () => {
      return await invoke<{
        os: 'windows' | 'macos' | 'linux' | 'unknown'
        arch: string
        version: string
        appName: string
        appVersion: string
      }>('get_platform_info')
    },
    
    enterFocusMode: async () => {
      await invoke('enter_focus_mode')
    },
    
    exitFocusMode: async () => {
      await invoke('exit_focus_mode')
    },
    
    isFocusModeActive: async () => {
      return await invoke<boolean>('is_focus_mode_active')
    },
  }
}

interface TauriGlobalAPI {
  core: {
    invoke: <T>(cmd: string, args?: Record<string, unknown>) => Promise<T>
  }
  shell: {
    open: (url: string) => Promise<void>
  }
  window: {
    getCurrentWindow: () => {
      outerPosition: () => Promise<{ x: number; y: number }>
      outerSize: () => Promise<{ width: number; height: number }>
      isMaximized: () => Promise<boolean>
      maximize: () => Promise<void>
      unmaximize: () => Promise<void>
      minimize: () => Promise<void>
      close: () => Promise<void>
      show: () => Promise<void>
      setFocus: () => Promise<void>
      setPosition: (pos: { type: 'Physical'; x: number; y: number }) => Promise<void>
      setSize: (size: { type: 'Physical'; width: number; height: number }) => Promise<void>
      setFullscreen: (fullscreen: boolean) => Promise<void>
    }
  }
  event: {
    listen: <T>(event: string, handler: (event: { payload: T }) => void) => Promise<() => void>
  }
}

declare global {
  interface Window {
    __TAURI__?: TauriGlobalAPI
    __TAURI_INTERNALS__?: object
  }
}

/**
 * 获取 Tauri 全局 API
 * @returns Tauri API 模块
 */
function getTauriModules(): TauriGlobalAPI | null {
  if (typeof window === 'undefined') return null
  return window.__TAURI__ || null
}

/**
 * 动态加载 Tauri 模块
 */
async function loadTauriModules(): Promise<{
  invoke: <T>(cmd: string, args?: Record<string, unknown>) => Promise<T>
  open: (url: string) => Promise<void>
  getCurrentWindow: () => {
    outerPosition: () => Promise<{ x: number; y: number }>
    outerSize: () => Promise<{ width: number; height: number }>
    isMaximized: () => Promise<boolean>
    maximize: () => Promise<void>
    unmaximize: () => Promise<void>
    minimize: () => Promise<void>
    close: () => Promise<void>
    show: () => Promise<void>
    setFocus: () => Promise<void>
    setPosition: (pos: { type: 'Physical'; x: number; y: number }) => Promise<void>
    setSize: (size: { type: 'Physical'; width: number; height: number }) => Promise<void>
    setFullscreen: (fullscreen: boolean) => Promise<void>
  }
  listen: <T>(event: string, handler: (event: { payload: T }) => void) => Promise<() => void>
}> {
  const tauri = getTauriModules()
  
  if (!tauri) {
    throw new Error('Tauri API not available')
  }
  
  return {
    invoke: tauri.core.invoke,
    open: tauri.shell.open,
    getCurrentWindow: tauri.window.getCurrentWindow,
    listen: tauri.event.listen,
  }
}

/**
 * 重置平台 API 缓存（用于测试或热重载）
 */
export function resetPlatformCache(): void {
  cachedPlatformAPI = null
  cachedCapabilities = null
}

export const platform = {
  detect: detectPlatform,
  isDesktop,
  isWeb,
  getCapabilities: getPlatformCapabilities,
  getAPI: getPlatformAPI,
  resetCache: resetPlatformCache,
}
