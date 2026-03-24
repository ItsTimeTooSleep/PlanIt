/**
 * 版本号同步脚本
 * 从 VERSION 文件读取版本号，同步到所有需要的地方
 *
 * @file scripts/sync-version.js
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

/**
 * 读取 VERSION 文件中的版本号
 *
 * @returns {string} 版本号
 * @throws {Error} 当 VERSION 文件不存在或读取失败时抛出异常
 */
function getVersion() {
  const versionFile = path.join(ROOT_DIR, 'VERSION');
  if (!fs.existsSync(versionFile)) {
    throw new Error('VERSION file not found');
  }
  return fs.readFileSync(versionFile, 'utf-8').trim();
}

/**
 * 更新 package.json 中的版本号
 *
 * @param {string} version - 新版本号
 * @throws {Error} 当 package.json 不存在或写入失败时抛出异常
 */
function updatePackageJson(version) {
  const packagePath = path.join(ROOT_DIR, 'package.json');
  const content = fs.readFileSync(packagePath, 'utf-8');
  const pkg = JSON.parse(content);
  pkg.version = version;
  fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n');
  console.log(`✓ Updated package.json to version ${version}`);
}

/**
 * 更新 tauri.conf.json 中的版本号
 *
 * @param {string} version - 新版本号
 * @throws {Error} 当 tauri.conf.json 不存在或写入失败时抛出异常
 */
function updateTauriConf(version) {
  const confPath = path.join(ROOT_DIR, 'src-tauri', 'tauri.conf.json');
  const content = fs.readFileSync(confPath, 'utf-8');
  const conf = JSON.parse(content);
  conf.version = version;
  fs.writeFileSync(confPath, JSON.stringify(conf, null, 2) + '\n');
  console.log(`✓ Updated tauri.conf.json to version ${version}`);
}

/**
 * 更新 Cargo.toml 中的版本号
 *
 * @param {string} version - 新版本号
 * @throws {Error} 当 Cargo.toml 不存在或写入失败时抛出异常
 */
function updateCargoToml(version) {
  const cargoPath = path.join(ROOT_DIR, 'src-tauri', 'Cargo.toml');
  let content = fs.readFileSync(cargoPath, 'utf-8');
  content = content.replace(/^version = ".*"$/m, `version = "${version}"`);
  fs.writeFileSync(cargoPath, content);
  console.log(`✓ Updated Cargo.toml to version ${version}`);
}

/**
 * 主函数：执行版本号同步
 *
 * @returns {Promise<void>}
 */
async function main() {
  try {
    const version = getVersion();
    console.log(`Syncing version: ${version}\n`);

    updatePackageJson(version);
    updateTauriConf(version);
    updateCargoToml(version);

    console.log('\n✓ Version sync completed successfully!');
  } catch (error) {
    console.error('✗ Version sync failed:', error.message);
    process.exit(1);
  }
}

main();
