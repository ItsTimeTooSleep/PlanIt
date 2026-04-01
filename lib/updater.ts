/**
 * 应用程序更新管理器
 * 提供检查更新、显示更新对话框等功能
 *
 * @file lib/updater.ts
 */

import { checkUpdate, installUpdate } from '@tauri-apps/plugin-updater'
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
}

type UpdateInfo = {
  version: string
  body?: string
  date?: string
}

type UpdateDialogCallback = (update: UpdateInfo) => void

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
  private currentUpdate?: UpdateInfo
  private isDownloading = false

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
   * 检查更新
   *
   * @param {boolean} showToastIfLatest - 如果是最新版本是否显示提示
   * @param {boolean} forceCheck - 是否强制检查（忽略跳过的版本）
   * @returns {Promise<boolean>} 是否有可用更新
   */
  public async checkForUpdates(showToastIfLatest: boolean = true, forceCheck: boolean = false): Promise<boolean> {
    try {
      const update = await checkUpdate()

      if (update?.available) {
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
      toast.error(this.messages.updateError)
      return false
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

      await installUpdate()

      toast.dismiss()
      toast.success(this.messages.updateInstalled)

      await new Promise(resolve => setTimeout(resolve, 1500))
      await relaunch()
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
