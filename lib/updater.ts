/**
 * 应用程序更新管理器
 * 提供检查更新、显示更新对话框等功能
 *
 * @file lib/updater.ts
 */

import { check } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'
import { toast } from 'sonner'

type UpdateMessages = {
  updateAvailable: string
  updateLatest: string
  updateError: string
  updateDownloading: string
  updateInstalled: string
  updateConfirmTitle: string
  updateConfirmBody: string
  updateChecking: string
  updateNetworkError: string
  updateTimeoutError: string
}

type UpdateInfo = {
  version: string
  body?: string
  date?: string
}

type UpdateDialogCallback = (update: UpdateInfo) => void
type CheckStateCallback = (isChecking: boolean) => void
type UpdateErrorCallback = (errorMessage: string, errorDetail?: string) => void

type UpdateErrorType = 'network' | 'timeout' | 'unknown'

type UpdateError = {
  type: UpdateErrorType
  message: string
  originalError?: unknown
}

/**
 * 更新管理器类
 * 负责处理应用程序的更新检查和安装
 */
export class UpdaterManager {
  private static instance: UpdaterManager
  private lastCheckDateKey = 'last_update_check_date'
  private skippedVersionKey = 'skipped_update_version'
  private messages: UpdateMessages
  private onUpdateAvailableCallback?: UpdateDialogCallback
  private onCheckStateChangeCallback?: CheckStateCallback
  private onUpdateErrorCallback?: UpdateErrorCallback
  private currentUpdate?: UpdateInfo
  private isDownloading = false
  private isChecking = false

  /**
   * 获取 UpdaterManager 单例实例
   *
   * @param {UpdateMessages} messages - 更新相关的翻译消息
   * @returns {UpdaterManager} 单例实例
   */
  public static getInstance(messages?: UpdateMessages): UpdaterManager {
    if (!UpdaterManager.instance) {
      UpdaterManager.instance = new UpdaterManager(messages)
    } else if (messages) {
      UpdaterManager.instance.messages = { ...UpdaterManager.instance.messages, ...messages }
    }
    return UpdaterManager.instance
  }

  private constructor(messages?: UpdateMessages) {
    this.messages = {
      updateAvailable: 'New version available',
      updateLatest: 'You are up to date',
      updateError: 'Failed to check for updates',
      updateDownloading: 'Downloading update...',
      updateInstalled: 'Update complete, restarting app...',
      updateConfirmTitle: 'New version available',
      updateConfirmBody: 'Click OK to start updating',
      updateChecking: 'Checking for updates...',
      updateNetworkError: 'Network error. Please check your connection.',
      updateTimeoutError: 'Request timed out. Please try again.',
      ...messages
    }
  }

  /**
   * 设置更新可用时的回调函数
   *
   * @param {UpdateDialogCallback} callback - 回调函数
   */
  public setOnUpdateAvailable(callback: UpdateDialogCallback): void {
    this.onUpdateAvailableCallback = callback
  }

  /**
   * 设置检查状态变化的回调函数
   *
   * @param {CheckStateCallback} callback - 回调函数
   */
  public setOnCheckStateChange(callback: CheckStateCallback): void {
    this.onCheckStateChangeCallback = callback
  }

  /**
   * 设置更新错误时的回调函数
   *
   * @param {UpdateErrorCallback} callback - 回调函数
   */
  public setOnUpdateError(callback: UpdateErrorCallback): void {
    this.onUpdateErrorCallback = callback
  }

  /**
   * 获取当前检查状态
   *
   * @returns {boolean} 是否正在检查
   */
  public getIsChecking(): boolean {
    return this.isChecking
  }

  /**
   * 设置翻译消息
   *
   * @param {Partial<UpdateMessages>} messages - 更新相关的翻译消息
   */
  public setMessages(messages: Partial<UpdateMessages>): void {
    this.messages = { ...this.messages, ...messages }
  }

  /**
   * 检查是否需要每天检查更新
   *
   * @returns {boolean} 如果距离上次检查超过一天则返回 true
   */
  public shouldCheckDaily(): boolean {
    try {
      const lastCheck = localStorage.getItem(this.lastCheckDateKey)
      if (!lastCheck) {
        return true
      }

      const lastCheckDate = new Date(lastCheck)
      const today = new Date()

      const diffTime = today.getTime() - lastCheckDate.getTime()
      const diffDays = diffTime / (1000 * 60 * 60 * 24)

      return diffDays >= 1
    } catch (error) {
      console.error('[UpdaterManager] Failed to check daily update:', error)
      return true
    }
  }

  /**
   * 更新上次检查日期为今天
   */
  public updateLastCheckDate(): void {
    try {
      localStorage.setItem(this.lastCheckDateKey, new Date().toISOString())
    } catch (error) {
      console.error('[UpdaterManager] Failed to update last check date:', error)
    }
  }

  /**
   * 检查是否已跳过某个版本
   *
   * @param {string} version - 版本号
   * @returns {boolean} 是否跳过
   */
  public isVersionSkipped(version: string): boolean {
    try {
      const skipped = localStorage.getItem(this.skippedVersionKey)
      return skipped === version
    } catch (error) {
      console.error('[UpdaterManager] Failed to check skipped version:', error)
      return false
    }
  }

  /**
   * 跳过某个版本
   *
   * @param {string} version - 版本号
   */
  public skipVersion(version: string): void {
    try {
      localStorage.setItem(this.skippedVersionKey, version)
    } catch (error) {
      console.error('[UpdaterManager] Failed to skip version:', error)
    }
  }

  /**
   * 清除跳过的版本
   */
  public clearSkippedVersion(): void {
    try {
      localStorage.removeItem(this.skippedVersionKey)
    } catch (error) {
      console.error('[UpdaterManager] Failed to clear skipped version:', error)
    }
  }

  /**
   * 解析错误类型
   *
   * @param {unknown} error - 原始错误
   * @returns {UpdateError} 解析后的错误信息
   */
  private parseError(error: unknown): UpdateError {
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase()
      
      if (
        errorMessage.includes('network') ||
        errorMessage.includes('fetch') ||
        errorMessage.includes('connection') ||
        errorMessage.includes('offline') ||
        errorMessage.includes('enetunreach') ||
        errorMessage.includes('econnrefused')
      ) {
        return {
          type: 'network',
          message: this.messages.updateNetworkError,
          originalError: error
        }
      }
      
      if (
        errorMessage.includes('timeout') ||
        errorMessage.includes('etimedout')
      ) {
        return {
          type: 'timeout',
          message: this.messages.updateTimeoutError,
          originalError: error
        }
      }
    }
    
    return {
      type: 'unknown',
      message: this.messages.updateError,
      originalError: error
    }
  }

  /**
   * 检查更新
   *
   * @param {boolean} showToastIfLatest - 如果是最新版本是否显示提示
   * @param {boolean} forceCheck - 是否强制检查（忽略跳过的版本）
   * @returns {Promise<boolean>} 是否有可用更新
   */
  public async checkForUpdates(showToastIfLatest: boolean = true, forceCheck: boolean = false): Promise<boolean> {
    if (this.isChecking) {
      return false
    }

    this.isChecking = true
    this.onCheckStateChangeCallback?.(true)

    const checkingToastId = toast.loading(this.messages.updateChecking)

    try {
      const update = await check()
      toast.dismiss(checkingToastId)

      if (update) {
        this.currentUpdate = {
          version: update.version,
          body: update.body,
          date: update.date,
        }

        if (!forceCheck && this.isVersionSkipped(update.version)) {
          console.log(`[UpdaterManager] Version ${update.version} has been skipped`)
          return false
        }

        if (this.onUpdateAvailableCallback) {
          this.onUpdateAvailableCallback(this.currentUpdate)
        } else {
          this.showFallbackDialog(this.currentUpdate)
        }
        return true
      } else {
        this.currentUpdate = undefined
        if (showToastIfLatest) {
          toast.success(this.messages.updateLatest)
        }
        return false
      }
    } catch (error) {
      console.error('[UpdaterManager] Failed to check for updates:', error)
      toast.dismiss(checkingToastId)

      const parsedError = this.parseError(error)
      toast.error(parsedError.message)
      // 构建详细错误信息
      const errorDetail = error instanceof Error
        ? `[UpdaterManager] Failed to check for updates: "${error.message}"`
        : `[UpdaterManager] Failed to check for updates: "${String(error)}"`
      this.onUpdateErrorCallback?.(parsedError.message, errorDetail)
      return false
    } finally {
      this.isChecking = false
      this.onCheckStateChangeCallback?.(false)
    }
  }

  /**
   * 获取当前更新信息
   *
   * @returns {UpdateInfo | undefined} 更新信息
   */
  public getCurrentUpdate(): UpdateInfo | undefined {
    return this.currentUpdate
  }

  /**
   * 显示备用对话框（当没有设置回调时使用）
   *
   * @param {UpdateInfo} update - 更新信息
   */
  private async showFallbackDialog(update: UpdateInfo): Promise<void> {
    const shouldInstall = confirm(
      `${this.messages.updateAvailable} ${update.version}\n\n${update.body || this.messages.updateConfirmBody}`
    )

    if (shouldInstall) {
      await this.installUpdate()
    }
  }

  /**
   * 安装更新
   */
  public async installUpdate(): Promise<void> {
    if (!this.currentUpdate || this.isDownloading) {
      return
    }

    try {
      this.isDownloading = true
      toast.loading(this.messages.updateDownloading)

      const update = await check()
      if (update) {
        await update.downloadAndInstall()
        toast.dismiss()
        toast.success(this.messages.updateInstalled)

        await new Promise(resolve => setTimeout(resolve, 1500))
        await relaunch()
      }
    } catch (error) {
      console.error('[UpdaterManager] Failed to install update:', error)
      toast.dismiss()
      toast.error(this.messages.updateError)
    } finally {
      this.isDownloading = false
    }
  }

  /**
   * 获取下载状态
   *
   * @returns {boolean} 是否正在下载
   */
  public getIsDownloading(): boolean {
    return this.isDownloading
  }
}
