const fs = require('fs')
const path = require('path')

/**
 * 自动生成 latest.json 文件
 * 从构建产物中读取签名文件并生成更新配置
 */

const VERSION_FILE = path.join(__dirname, '..', 'VERSION')
const TEMPLATE_FILE = path.join(__dirname, '..', 'latest.template.json')
const OUTPUT_FILE = path.join(__dirname, '..', 'latest.json')
const BUNDLE_DIR = path.join(__dirname, '..', 'src-tauri', 'target', 'release', 'bundle')

function readVersion() {
  try {
    return fs.readFileSync(VERSION_FILE, 'utf8').trim()
  } catch (e) {
    console.error('无法读取 VERSION 文件:', e.message)
    process.exit(1)
  }
}

function readTemplate() {
  try {
    return JSON.parse(fs.readFileSync(TEMPLATE_FILE, 'utf8'))
  } catch (e) {
    console.error('无法读取 latest.template.json:', e.message)
    process.exit(1)
  }
}

function findSigFile(dir, pattern) {
  try {
    if (!fs.existsSync(dir)) {
      return null
    }
    const files = fs.readdirSync(dir)
    const sigFile = files.find(f => f.endsWith('.sig') && f.includes(pattern))
    if (sigFile) {
      return fs.readFileSync(path.join(dir, sigFile), 'utf8').trim()
    }
  } catch (e) {
    console.warn(`警告: 无法在 ${dir} 中找到签名文件`)
  }
  return null
}

function main() {
  const version = readVersion()
  const template = readTemplate()

  console.log(`正在生成 latest.json (版本: ${version})...`)

  template.version = version
  template.pub_date = new Date().toISOString()

  const nsisDir = path.join(BUNDLE_DIR, 'nsis')
  const windowsSig = findSigFile(nsisDir, 'setup')
  if (windowsSig && template.platforms['windows-x86_64']) {
    template.platforms['windows-x86_64'].signature = windowsSig
    template.platforms['windows-x86_64'].url = `https://github.com/itstimetoosleep/PlanIt/releases/download/v${version}/PlanIt_${version}_x64-setup.exe`
    console.log('✓ Windows 签名已添加')
  }

  const macosDir = path.join(BUNDLE_DIR, 'macos')
  const macX64Sig = findSigFile(macosDir, 'x64')
  const macArm64Sig = findSigFile(macosDir, 'aarch64') || findSigFile(macosDir, 'arm64')

  if (macX64Sig && template.platforms['darwin-x86_64']) {
    template.platforms['darwin-x86_64'].signature = macX64Sig
    template.platforms['darwin-x86_64'].url = `https://github.com/itstimetoosleep/PlanIt/releases/download/v${version}/PlanIt_${version}_x64.app.tar.gz`
    console.log('✓ macOS x86_64 签名已添加')
  }

  if (macArm64Sig && template.platforms['darwin-aarch64']) {
    template.platforms['darwin-aarch64'].signature = macArm64Sig
    template.platforms['darwin-aarch64'].url = `https://github.com/itstimetoosleep/PlanIt/releases/download/v${version}/PlanIt_${version}_aarch64.app.tar.gz`
    console.log('✓ macOS aarch64 签名已添加')
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(template, null, 2))
  console.log(`\n✓ 已生成 ${OUTPUT_FILE}`)
  console.log('\n请记得:')
  console.log('1. 修改 notes 字段为实际的更新说明')
  console.log('2. 上传到 GitHub Release 时重命名为 latest.json')
}

main()
