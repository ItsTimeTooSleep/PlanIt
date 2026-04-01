<div align="center">
  <img src="public/icon.svg" alt="PlanIt Logo" width="120" height="120">
  <h1>PlanIt</h1>
  <p><strong>规划时间，掌控生活</strong></p>
  <p>跨平台桌面任务管理应用，帮助学生和知识工作者更好地规划任务、保持专注、提升效率</p>

  <p>
    <img src="https://img.shields.io/badge/version-1.0.0-blue.svg?style=flat-square" alt="Version">
    <img src="https://img.shields.io/badge/license-AGPL--3.0-green.svg?style=flat-square" alt="License">
    <img src="https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey.svg?style=flat-square" alt="Platform">
  </p>

  <p>
    <a href="#✨-主要功能">主要功能</a> ·
    <a href="#🚀-快速开始">快速开始</a> ·
    <a href="#🛠️-技术栈">技术栈</a> ·
    <a href="#📄-许可证">许可证</a>
  </p>
</div>

---

## ✨ 主要功能

### 📋 任务管理
创建任务、添加标签、追踪状态，让每一项待办都井井有条

### 📅 日历视图
周视图与月视图灵活切换，支持日期笔记，规划一目了然

### 🍅 番茄钟计时器
专注模式帮助你保持高效，科学管理工作与休息时间

### 📝 笔记系统
多彩笔记卡片，随时记录灵感，让想法不再流失

### 🧩 桌面小组件
可拖拽的多种类型小组件，打造专属工作空间

### 📊 数据统计
图表可视化展示效率数据，了解自己的工作习惯

---

## 🚀 快速开始

### 下载安装

访问 [Releases](https://github.com/itstimetoosleep/PlanIt/releases/latest) 页面下载最新版本。

支持的平台：
- 🍎 macOS
- 🪟 Windows
- 🐧 Linux

### 开发环境

#### 前置要求

- Node.js 18+
- pnpm
- Rust (用于 Tauri)

#### 安装依赖

```bash
pnpm install
```

#### 开发模式

```bash
pnpm tauri:dev
```

#### 构建应用

```bash
pnpm tauri:build
```

---

## 🛠️ 技术栈

### 前端
- **框架**: Next.js 16
- **UI库**: React 19
- **样式**: Tailwind CSS 4
- **组件**: Radix UI + shadcn/ui
- **状态管理**: Zustand (内置)
- **图标**: Lucide React

### 桌面应用
- **框架**: Tauri 2
- **语言**: Rust
- **插件**: 
  - Autostart
  - Clipboard Manager
  - Dialog
  - Global Shortcut
  - Notification
  - Shell
  - Updater

### 工具
- **包管理**: pnpm
- **TypeScript**: 5.7
- **ESLint**: 9
- **构建**: Turbopack

---

## 📁 项目结构

```
PlanIt/
├── app/                      # Next.js 应用页面
│   ├── calendar/
│   ├── custom-layout/
│   ├── home/
│   ├── note/
│   ├── settings/
│   ├── stats/
│   └── todo/
├── components/              # React 组件
│   ├── calendar/           # 日历相关组件
│   ├── desktop/            # 桌面功能组件
│   ├── home/               # 首页组件
│   ├── note/               # 笔记组件
│   ├── pomodoro/           # 番茄钟组件
│   ├── settings/           # 设置组件
│   ├── stats/              # 统计组件
│   ├── todo/               # 待办组件
│   ├── ui/                 # UI 基础组件
│   ├── widget-panel/       # 小组件面板
│   └── widgets/            # 各种小组件
├── lib/                    # 工具库和状态管理
├── hooks/                  # React Hooks
├── public/                 # 静态资源
├── src-tauri/              # Tauri Rust 代码
└── PlanIt-OfficialWebsite/ # 官方网站
```

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📄 许可证

本项目采用 [GNU Affero General Public License v3.0](LICENSE) 许可证。

---

## 👤 作者

**ItsTimeTooSleep**

---

<div align="center">
  <p>如果这个项目对你有帮助，请给它一个 ⭐️</p>
</div>
