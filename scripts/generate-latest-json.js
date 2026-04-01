const fs = require('fs')
const path = require('path')

/**
 * 自动生成 latest.json 文件
 * 从构建产物中读取签名文件并生成更新配置
 * 
 * 使用方法：
 *   node scripts/generate-latest-json.js [macos-artifacts-dir] [--empty-notes] [--empty-windows]
 * 
 * 参数：
 *   macos-artifacts-dir: 可选，macOS artifacts 解压后的目录路径
 *                       如果不指定，会自动从项目根目录查找 .sig 文件
 *   --empty-notes:       留空 notes 字段
 *   --empty-windows:     留空 windows 平台配置
 */

const VERSION_FILE = path.join(__dirname, '..', 'VERSION')
const TEMPLATE_FILE = path.join(__dirname, '..', 'latest.template.json')
const OUTPUT_FILE = path.join(__dirname, '..', 'latest.json')
const BUNDLE_DIR = path.join(__dirname, '..', 'src-tauri', 'target', 'release', 'bundle')
const ROOT_DIR = path.join(__dirname, '..')

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

function findSigFileRecursive(dir, pattern) {
  try {
    if (!fs.existsSync(dir)) {
      return null
    }
    
    const items = fs.readdirSync(dir, { withFileTypes: true })
    
    for (const item of items) {
      const fullPath = path.join(dir, item.name)
      
      if (item.isDirectory()) {
        const result = findSigFileRecursive(fullPath, pattern)
        if (result) return result
      } else if (item.isFile() && item.name.endsWith('.sig') && item.name.includes(pattern)) {
        return fs.readFileSync(fullPath, 'utf8').trim()
      }
    }
  } catch (e) {
    console.warn(`警告: 递归搜索 ${dir} 时出错:`, e.message)
  }
  return null
}

function findMacOsSigsInRoot() {
  const result = {
    x64: null,
    aarch64: null
  }
  
  const searchDirs = [ROOT_DIR, path.join(ROOT_DIR, 'sigs')]
  
  for (const dir of searchDirs) {
    try {
      if (!fs.existsSync(dir)) {
        continue
      }
      
      const files = fs.readdirSync(dir)
      
      const x64SigFile = files.find(f => 
        f.endsWith('.sig') && 
        (f.includes('x64') || f.includes('x86_64')) &&
        !f.includes('aarch64') &&
        !f.includes('arm64')
      )
      
      const aarch64SigFile = files.find(f => 
        f.endsWith('.sig') && 
        (f.includes('aarch64') || f.includes('arm64'))
      )
      
      if (x64SigFile && !result.x64) {
        result.x64 = fs.readFileSync(path.join(dir, x64SigFile), 'utf8').trim()
        console.log(`  找到 x86_64 签名: ${path.join(dir, x64SigFile)}`)
      }
      
      if (aarch64SigFile && !result.aarch64) {
        result.aarch64 = fs.readFileSync(path.join(dir, aarch64SigFile), 'utf8').trim()
        console.log(`  找到 aarch64 签名: ${path.join(dir, aarch64SigFile)}`)
      }
    } catch (e) {
      console.warn(`警告: 搜索 ${dir} 时出错:`, e.message)
    }
  }
  
  return result
}

function main() {
  const version = readVersion()
  const template = readTemplate()
  
  const args = process.argv.slice(2)
  let macosArtifactsDir = null
  let emptyNotes = false
  let emptyWindows = false
  
  for (const arg of args) {
    if (arg === '--empty-notes') {
      emptyNotes = true
    } else if (arg === '--empty-windows') {
      emptyWindows = true
    } else if (!arg.startsWith('--')) {
      macosArtifactsDir = arg
    }
  }

  console.log(`正在生成 latest.json (版本: ${version})...`)
  console.log('')

  template.version = version
  template.pub_date = new Date().toISOString()
  
  if (emptyNotes) {
    template.notes = ''
    console.log('📝 留空 notes 字段')
  }
  
  if (emptyWindows) {
    if (template.platforms['windows-x86_64']) {
      template.platforms['windows-x86_64'].signature = ''
      template.platforms['windows-x86_64'].url = ''
    }
    console.log('🗑  留空 Windows 平台配置')
  } else {
    console.log('\n📦 Windows 签名:')
    const nsisDir = path.join(BUNDLE_DIR, 'nsis')
    const windowsSig = findSigFile(nsisDir, 'setup')
    if (windowsSig && template.platforms['windows-x86_64']) {
      template.platforms['windows-x86_64'].signature = windowsSig
      template.platforms['windows-x86_64'].url = `https://github.com/itstimetoosleep/PlanIt/releases/download/v${version}/PlanIt_${version}_x64-setup.exe`
      console.log('  ✓ Windows 签名已添加')
    } else {
      console.warn('  ⚠ 未找到 Windows 签名文件')
    }
  }

  console.log('\n🍎 macOS 签名:')
  
  let macX64Sig = null
  let macArm64Sig = null
  
  if (macosArtifactsDir) {
    console.log(`  从指定目录读取: ${macosArtifactsDir}`)
    macX64Sig = findSigFileRecursive(macosArtifactsDir, 'x64') || findSigFileRecursive(macosArtifactsDir, 'x86_64')
    macArm64Sig = findSigFileRecursive(macosArtifactsDir, 'aarch64') || findSigFileRecursive(macosArtifactsDir, 'arm64')
  } else {
    console.log('  从项目根目录自动查找 .sig 文件...')
    const rootSigs = findMacOsSigsInRoot()
    macX64Sig = rootSigs.x64
    macArm64Sig = rootSigs.aarch64
  }

  if (macX64Sig && template.platforms['darwin-x86_64']) {
    template.platforms['darwin-x86_64'].signature = macX64Sig
    template.platforms['darwin-x86_64'].url = `https://github.com/itstimetoosleep/PlanIt/releases/download/v${version}/PlanIt_${version}_x64.app.tar.gz`
    console.log('  ✓ macOS x86_64 签名已添加')
  } else {
    console.warn('  ⚠ 未找到 macOS x86_64 签名文件')
  }

  if (macArm64Sig && template.platforms['darwin-aarch64']) {
    template.platforms['darwin-aarch64'].signature = macArm64Sig
    template.platforms['darwin-aarch64'].url = `https://github.com/itstimetoosleep/PlanIt/releases/download/v${version}/PlanIt_${version}_aarch64.app.tar.gz`
    console.log('  ✓ macOS aarch64 签名已添加')
  } else {
    console.warn('  ⚠ 未找到 macOS aarch64 签名文件')
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(template, null, 2))
  console.log(`\n✅ 已生成 ${OUTPUT_FILE}`)
  console.log('\n📝 请记得:')
  if (!emptyNotes) {
    console.log('   1. 修改 notes 字段为实际的更新说明')
  }
  console.log('   2. 上传到 GitHub Release')
}

main()
