'use client'

import { useEffect } from 'react'

/**
 * 禁用右键菜单的组件
 * 
 * 该组件会阻止浏览器的右键菜单显示，适用于桌面应用
 */
export function DisableContextMenu() {
  useEffect(() => {
    /**
     * 处理右键菜单事件
     * @param e - 鼠标事件对象
     */
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      return false
    }

    document.addEventListener('contextmenu', handleContextMenu, true)

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu, true)
    }
  }, [])

  return null
}
