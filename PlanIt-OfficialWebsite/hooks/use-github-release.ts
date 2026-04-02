"use client";

import { useEffect, useState } from "react";

/**
 * GitHub Release 资源信息
 */
export interface ReleaseAsset {
  /** 资源名称 */
  name: string;
  /** 资源大小（字节） */
  size: number;
  /** 下载地址 */
  browser_download_url: string;
}

/**
 * GitHub Release 信息
 */
export interface GitHubRelease {
  /** 版本标签 */
  tag_name: string;
  /** 资源列表 */
  assets: ReleaseAsset[];
}

/**
 * 格式化文件大小
 * @param bytes - 字节数
 * @returns 格式化后的大小字符串（如 "68 MB"）
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = parseFloat((bytes / Math.pow(k, i)).toFixed(0));
  return `${size} ${units[i]}`;
}

/**
 * 平台类型
 */
export type PlatformType = "macos" | "windows" | "linux";

/**
 * 根据文件名判断平台类型
 * @param filename - 文件名
 * @returns 平台类型或 null
 */
function getPlatformFromFilename(filename: string): PlatformType | null {
  const lower = filename.toLowerCase();
  if (lower.includes("darwin") || lower.includes("mac") || lower.endsWith(".dmg") || lower.endsWith(".app")) {
    return "macos";
  }
  if (lower.includes("win") || lower.endsWith(".exe") || lower.endsWith(".msi")) {
    return "windows";
  }
  if (lower.includes("linux") || lower.endsWith(".appimage") || lower.endsWith(".deb") || lower.endsWith(".rpm")) {
    return "linux";
  }
  return null;
}

/**
 * Hook: 获取 GitHub Release 信息
 * @param owner - 仓库所有者
 * @param repo - 仓库名称
 * @returns Release 信息和加载状态
 */
export function useGitHubRelease(owner: string, repo: string) {
  const [release, setRelease] = useState<GitHubRelease | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRelease = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/releases/latest`
        );
        
        if (!response.ok) {
          throw new Error(`Failed to fetch release: ${response.status}`);
        }
        
        const data: GitHubRelease = await response.json();
        setRelease(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setRelease(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRelease();
  }, [owner, repo]);

  return { release, loading, error };
}

/**
 * 平台下载链接信息
 */
export interface PlatformDownloadUrls {
  windows: string;
  macos: {
    aarch64: string;
    x64: string;
  };
  linux: string;
}

/**
 * 平台文件大小信息
 */
export interface PlatformSizes {
  windows: string;
  macos: {
    aarch64: string;
    x64: string;
  };
  linux: string;
}

/**
 * 获取各平台的下载链接
 * @param release - GitHub Release 信息
 * @returns 各平台下载链接映射
 */
export function getPlatformDownloadUrls(release: GitHubRelease | null): PlatformDownloadUrls {
  const urls: PlatformDownloadUrls = {
    windows: "",
    macos: {
      aarch64: "",
      x64: "",
    },
    linux: "",
  };

  if (!release || !release.assets) {
    return urls;
  }

  for (const asset of release.assets) {
    const lower = asset.name.toLowerCase();
    if (lower.includes("win") || lower.endsWith(".exe") || lower.endsWith(".msi")) {
      if (!urls.windows) {
        urls.windows = asset.browser_download_url;
      }
    } else if (lower.includes("darwin") || lower.includes("mac") || lower.endsWith(".dmg")) {
      if (lower.includes("aarch64") || lower.includes("arm64")) {
        urls.macos.aarch64 = asset.browser_download_url;
      } else if (lower.includes("x64") || lower.includes("x86_64")) {
        urls.macos.x64 = asset.browser_download_url;
      } else if (!urls.macos.aarch64 && !urls.macos.x64) {
        urls.macos.aarch64 = asset.browser_download_url;
      }
    } else if (lower.includes("linux") || lower.endsWith(".appimage") || lower.endsWith(".deb") || lower.endsWith(".rpm")) {
      if (!urls.linux) {
        urls.linux = asset.browser_download_url;
      }
    }
  }

  return urls;
}

/**
 * 获取各平台的文件大小
 * @param release - GitHub Release 信息
 * @returns 各平台大小映射
 */
export function getPlatformSizes(release: GitHubRelease | null): PlatformSizes {
  const sizes: PlatformSizes = {
    windows: "",
    macos: {
      aarch64: "",
      x64: "",
    },
    linux: "",
  };

  if (!release || !release.assets) {
    return sizes;
  }

  for (const asset of release.assets) {
    const lower = asset.name.toLowerCase();
    if (lower.includes("win") || lower.endsWith(".exe") || lower.endsWith(".msi")) {
      if (!sizes.windows) {
        sizes.windows = formatFileSize(asset.size);
      }
    } else if (lower.includes("darwin") || lower.includes("mac") || lower.endsWith(".dmg")) {
      if (lower.includes("aarch64") || lower.includes("arm64")) {
        sizes.macos.aarch64 = formatFileSize(asset.size);
      } else if (lower.includes("x64") || lower.includes("x86_64")) {
        sizes.macos.x64 = formatFileSize(asset.size);
      } else if (!sizes.macos.aarch64 && !sizes.macos.x64) {
        sizes.macos.aarch64 = formatFileSize(asset.size);
      }
    } else if (lower.includes("linux") || lower.endsWith(".appimage") || lower.endsWith(".deb") || lower.endsWith(".rpm")) {
      if (!sizes.linux) {
        sizes.linux = formatFileSize(asset.size);
      }
    }
  }

  return sizes;
}
