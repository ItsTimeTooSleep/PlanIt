declare module '@tauri-apps/api/core' {
  export function invoke<T = unknown>(cmd: string, args?: Record<string, unknown>): Promise<T>
}

declare module '@tauri-apps/plugin-shell' {
  export function open(url: string): Promise<void>
}

declare module '@tauri-apps/plugin-clipboard-manager' {
  export interface ClipboardExt {
    writeText(text: string): Promise<void>
    readText(): Promise<string>
  }
}

declare module '@tauri-apps/api/window' {
  import { PhysicalPosition, PhysicalSize } from '@tauri-apps/api/window'
  
  export interface WebviewWindow {
    outerPosition(): Promise<PhysicalPosition>
    outerSize(): Promise<PhysicalSize>
    isMaximized(): Promise<boolean>
    maximize(): Promise<void>
    unmaximize(): Promise<void>
    minimize(): Promise<void>
    close(): Promise<void>
    show(): Promise<void>
    setFocus(): Promise<void>
    setPosition(position: PhysicalPosition): Promise<void>
    setSize(size: PhysicalSize): Promise<void>
    setFullscreen(fullscreen: boolean): Promise<void>
  }
  
  export function getCurrentWindow(): WebviewWindow
  
  export interface PhysicalPosition {
    type: 'Physical'
    x: number
    y: number
  }
  
  export interface PhysicalSize {
    type: 'Physical'
    width: number
    height: number
  }
}

declare module '@tauri-apps/api/event' {
  export interface Event<T> {
    payload: T
    id: number
  }
  
  export function listen<T>(
    event: string,
    handler: (event: Event<T>) => void
  ): Promise<() => void>
  
  export function once<T>(
    event: string,
    handler: (event: Event<T>) => void
  ): Promise<() => void>
  
  export function emit(event: string, payload?: unknown): Promise<void>
}
