@echo off
chcp 65001 >nul
title PlanIt 一键启动
cd /d "%~dp0"

echo ============================================
echo           PlanIt 一键启动脚本
echo ============================================
echo.

REM ===== 步骤 1：检查 pnpm 是否可用 =====
where pnpm >nul 2>nul
if errorlevel 1 (
    echo [错误] 未检测到 pnpm，请先安装 pnpm
    echo        安装命令: npm install -g pnpm
    pause
    exit /b 1
)
echo [1/4] 已检测到 pnpm
echo.

REM ===== 步骤 2：检查依赖是否已安装 =====
if not exist "node_modules" (
    echo [2/4] 未检测到 node_modules，开始安装依赖...
    call pnpm install
    if errorlevel 1 (
        echo.
        echo [错误] 依赖安装失败，请检查网络或 pnpm 配置
        pause
        exit /b 1
    )
) else (
    echo [2/4] 依赖已安装，跳过安装步骤
)
echo.

REM ===== 步骤 3：构建原生模块 =====
echo [3/4] 构建原生模块 (sharp, unrs-resolver)...
call pnpm rebuild sharp unrs-resolver
echo.

REM ===== 步骤 4：启动 Tauri 开发模式 =====
echo [4/4] 启动 Tauri 开发模式...
echo        - Next.js 开发服务器: http://localhost:3000
echo        - Tauri 桌面窗口将自动打开
echo.
echo        按 Ctrl+C 可停止服务
echo ============================================
echo.

call pnpm tauri dev

if errorlevel 1 (
    echo.
    echo [错误] 启动失败，请查看上方错误信息
    pause
)

exit /b 0
