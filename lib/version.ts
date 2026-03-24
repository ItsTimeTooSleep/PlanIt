/**
 * 版本号管理工具
 * 提供获取应用程序版本号的功能
 *
 * @file lib/version.ts
 */

import { invoke } from "@tauri-apps/api/core";

/**
 * 平台信息接口
 */
export interface PlatformInfo {
  /** 操作系统 */
  os: string;
  /** 系统架构 */
  arch: string;
  /** 操作系统版本 */
  version: string;
  /** 应用名称 */
  app_name: string;
  /** 应用版本号 */
  app_version: string;
}

/**
 * 获取平台信息，包括应用版本号
 *
 * @returns {Promise<PlatformInfo>} 平台信息对象
 * @throws {Error} 当调用 Tauri 命令失败时抛出异常
 */
export async function getPlatformInfo(): Promise<PlatformInfo> {
  return await invoke<PlatformInfo>("get_platform_info");
}

/**
 * 获取应用版本号
 *
 * @returns {Promise<string>} 应用版本号字符串
 * @throws {Error} 当调用 Tauri 命令失败时抛出异常
 */
export async function getAppVersion(): Promise<string> {
  const info = await getPlatformInfo();
  return info.app_version;
}

/**
 * 获取应用完整信息字符串
 * 格式: PlanIt v1.0.0 (Windows x86_64)
 *
 * @returns {Promise<string>} 应用完整信息字符串
 * @throws {Error} 当调用 Tauri 命令失败时抛出异常
 */
export async function getAppFullInfo(): Promise<string> {
  const info = await getPlatformInfo();
  return `PlanIt v${info.app_version} (${info.os} ${info.arch})`;
}
