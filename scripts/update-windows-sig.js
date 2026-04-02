const fs = require('fs')
const path = require('path')

/**
 * 更新 latest.json 中的 Windows 签名
 * 从构建产物中读取 .sig 文件并更新到 latest.json
 * 保留其他平台的签名不变
 * 
 * 使用方法：
 *   node scripts/update-windows-sig.js [sig-file-path]
 * 
 * 参数：
 *   sig-file-path: 可选，指定 .sig 文件的路径
 *                  如果不指定，会自动从 nsis 目录查找
 */

const LATEST_JSON_FILE = path.join(__dirname, '..', 'latest.json')
const NSIS_DIR = path.join(__dirname, '..', 'src-tauri', 'target', 'release', 'bundle', 'nsis')
const VERSION_FILE = path.join(__dirname, '..', 'VERSION')

function readVersion() {
  try {
    return fs.readFileSync(VERSION_FILE, 'utf8').trim()
  } catch (e) {
    console.error('无法读取 VERSION 文件:', e.message)
    process.exit(1)
  }
}

function findSigFile(dir) {
  try {
    if (!fs.existsSync(dir)) {
      return null
    }
    const files = fs.readdirSync(dir)
    const sigFile = files.find(f => f.endsWith('.sig'))
    if (sigFile) {
      return path.join(dir, sigFile)
    }
  } catch (e) {
    console.warn(`警告: 无法在 ${dir} 中查找签名文件`)
  }
  return null
}

function main() {
  const args = process.argv.slice(2)
  let sigFilePath = args[0]

  if (!sigFilePath) {
    sigFilePath = findSigFile(NSIS_DIR)
    if (!sigFilePath) {
      console.error('❌ 未找到 Windows 签名文件')
      console.error('   请先构建项目或手动指定 .sig 文件路径')
      console.error('   用法: node scripts/update-windows-sig.js <sig-file-path>')
      process.exit(1)
    }
  }

  if (!fs.existsSync(sigFilePath)) {
    console.error(`❌ 签名文件不存在: ${sigFilePath}`)
    process.exit(1)
  }

  const signature = fs.readFileSync(sigFilePath, 'utf8').trim()
  console.log(`📄 读取签名文件: ${sigFilePath}`)

  if (!fs.existsSync(LATEST_JSON_FILE)) {
    console.error(`❌ latest.json 文件不存在: ${LATEST_JSON_FILE}`)
    process.exit(1)
  }

  const latestJson = JSON.parse(fs.readFileSync(LATEST_JSON_FILE, 'utf8'))
  const version = readVersion()

  if (!latestJson.platforms['windows-x86_64']) {
    latestJson.platforms['windows-x86_64'] = {}
  }

  latestJson.platforms['windows-x86_64'].signature = signature
  latestJson.platforms['windows-x86_64'].url = `https://github.com/itstimetoosleep/PlanIt/releases/download/v${version}/PlanIt_${version}_x64-setup.exe`

  latestJson.pub_date = new Date().toISOString()

  fs.writeFileSync(LATEST_JSON_FILE, JSON.stringify(latestJson, null, 2))

  console.log(`✅ 已更新 Windows 签名到 latest.json`)
  console.log(`   版本: ${version}`)
  console.log(`   URL: ${latestJson.platforms['windows-x86_64'].url}`)
}

main()
