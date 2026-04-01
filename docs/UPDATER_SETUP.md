# Tauri 更新签名设置指南

## 1. 生成签名密钥

在项目根目录执行以下命令：

```powershell
# 创建 .tauri 目录
mkdir .tauri -Force | Out-Null

# 生成密钥对（会提示你输入密码，请记住这个密码！）
pnpm tauri signer generate -w .tauri\update.key
```

运行后会输出类似下面的内容：

```
Generating a new key pair
Please enter a password to encrypt the private key: [输入密码]
Please re-enter the password: [再次输入密码]

Public Key:
dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHRvb2wgaW4gZGV2IG1vZGUuIFlPVU1VU1QgUkVQTEFDRSBUSElTIFdJVEggWSBVUiBPR04gUFVCS0VZIElOIFBST0RVQ1RJT04h
```

**重要：**
- 复制上面的 "Public Key" 内容
- 将其粘贴到 `src-tauri/tauri.conf.json` 的 `plugins.updater.pubkey` 字段中

## 2. 更新 tauri.conf.json

将生成的公钥填入配置：

```json
{
  "plugins": {
    "updater": {
      "pubkey": "这里粘贴你的公钥",
      "endpoints": [
        "https://github.com/itstimetoosleep/PlanIt/releases/latest/download/latest.json"
      ]
    }
  }
}
```

## 3. 设置 GitHub Secrets

在 GitHub 仓库中添加以下 Secrets：

1. 打开你的仓库 → Settings → Secrets and variables → Actions → New repository secret

添加两个 Secret：

| Secret 名称 | 内容 |
|------------|------|
| `TAURI_SIGNING_PRIVATE_KEY` | `.tauri/update.key` 文件的完整内容（包括 -----BEGIN PRIVATE KEY----- 和 -----END PRIVATE KEY-----） |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | 你设置的密码 |

## 4. 本地构建时签名（可选）

如果你想在本地构建时也签名，设置环境变量：

```powershell
# PowerShell
$env:TAURI_SIGNING_PRIVATE_KEY = "d:\project\web\PlanIt\.tauri\update.key"
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = "你的密码"

# 然后构建
pnpm tauri:build
```

## 5. 关于 Apple 签名证书

### 问题：没有买 Apple 签名证书可以吗？

**可以！** 有两种签名是独立的：

| 签名类型 | 用途 | 是否必须 | 费用 |
|---------|------|---------|------|
| **Tauri Minisign** | 更新文件验证，确保更新来自你 | ✅ 必须（用于更新） | 免费 |
| **Apple Developer ID** | macOS 应用公证/签名 | ❌ 可选 | $99/年 |

### 不买 Apple 证书的后果：
- 用户首次打开会看到"无法验证开发者"警告
- 需要在"系统设置 > 安全性与隐私"中手动允许打开
- 但应用仍可正常使用

## 6. 发布流程

1. **生成本地密钥（只需做一次）
2. **配置 GitHub Secrets**
3. **推送 tag 触发 GitHub Action
4. **从 Draft Release 中获取构建产物
5. **手动上传 latest.json 到 Release

## 7. latest.json 格式

```json
{
  "version": "0.2.4",
  "notes": "## 更新内容\n\n- 修复了某些 bug\n- 新增功能 XXX",
  "pub_date": "2026-04-01T00:00:00Z",
  "platforms": {
    "windows-x86_64": {
      "signature": "base64编码的签名内容",
      "url": "https://github.com/itstimetoosleep/PlanIt/releases/download/v0.2.4/PlanIt_0.2.4_x64-setup.exe"
    },
    "darwin-x86_64": {
      "signature": "base64编码的签名内容",
      "url": "https://github.com/itstimetoosleep/PlanIt/releases/download/v0.2.4/PlanIt_0.2.4_x64.app.tar.gz"
    },
    "darwin-aarch64": {
      "signature": "base64编码的签名内容",
      "url": "https://github.com/itstimetoosleep/PlanIt/releases/download/v0.2.4/PlanIt_0.2.4_aarch64.app.tar.gz"
    }
  }
}
```
