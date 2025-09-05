#!/usr/bin/env node

/* eslint-disable @typescript-eslint/no-var-requires, no-console, unused-imports/no-unused-vars */

/**
 * MoonTV 版本管理脚本
 * 用于自动化版本号更新、CHANGELOG 生成和发布管理
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 配置文件路径
const PACKAGE_JSON = path.join(__dirname, '../package.json');
const VERSION_TXT = path.join(__dirname, '../VERSION.txt');
const CHANGELOG_MD = path.join(__dirname, '../CHANGELOG.md');
const _README_MD = path.join(__dirname, '../README.md');

// 版本类型
const VERSION_TYPES = {
  MAJOR: 'major',    // 主版本号 (x.0.0)
  MINOR: 'minor',    // 次版本号 (0.x.0)
  PATCH: 'patch',    // 修订版本号 (0.0.x)
  PRE: 'pre',        // 预发布版本
  BUILD: 'build'     // 构建版本
};

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
  log(`❌ ${message}`, 'red');
  process.exit(1);
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function info(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// 读取当前版本
function getCurrentVersion() {
  try {
    const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf8'));
    return packageJson.version;
  } catch (err) {
    error('无法读取 package.json 文件');
  }
}

// 读取 VERSION.txt
function getVersionTxt() {
  try {
    return fs.readFileSync(VERSION_TXT, 'utf8').trim();
  } catch (err) {
    error('无法读取 VERSION.txt 文件');
  }
}

// 更新版本号
function updateVersion(type, preRelease = null) {
  const currentVersion = getCurrentVersion();
  const [major, minor, patch] = currentVersion.split('.').map(Number);
  
  let newVersion;
  let newVersionTxt;
  
  switch (type) {
    case VERSION_TYPES.MAJOR:
      newVersion = `${major + 1}.0.0`;
      break;
    case VERSION_TYPES.MINOR:
      newVersion = `${major}.${minor + 1}.0`;
      break;
    case VERSION_TYPES.PATCH:
      newVersion = `${major}.${minor}.${patch + 1}`;
      break;
    case VERSION_TYPES.PRE:
      if (!preRelease) {
        error('预发布版本需要指定标识符 (如: alpha, beta, rc)');
      }
      newVersion = `${major}.${minor}.${patch + 1}-${preRelease}.1`;
      break;
    case VERSION_TYPES.BUILD:
      newVersion = `${major}.${minor}.${patch + 1}`;
      break;
    default:
      error(`不支持的版本类型: ${type}`);
  }
  
  // 生成新的版本时间戳
  const now = new Date();
  newVersionTxt = now.getFullYear().toString() +
                  String(now.getMonth() + 1).padStart(2, '0') +
                  String(now.getDate()).padStart(2, '0') +
                  String(now.getHours()).padStart(2, '0') +
                  String(now.getMinutes()).padStart(2, '0') +
                  String(now.getSeconds()).padStart(2, '0');
  
  return { newVersion, newVersionTxt };
}

// 更新 package.json
function updatePackageJson(newVersion) {
  try {
    const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf8'));
    packageJson.version = newVersion;
    fs.writeFileSync(PACKAGE_JSON, JSON.stringify(packageJson, null, 2) + '\n');
    success(`package.json 版本已更新为 ${newVersion}`);
  } catch (err) {
    error(`更新 package.json 失败: ${err.message}`);
  }
}

// 更新 VERSION.txt
function updateVersionTxt(newVersionTxt) {
  try {
    fs.writeFileSync(VERSION_TXT, newVersionTxt + '\n');
    success(`VERSION.txt 已更新为 ${newVersionTxt}`);
  } catch (err) {
    error(`更新 VERSION.txt 失败: ${err.message}`);
  }
}

// 更新 CHANGELOG.md
function updateChangelog(newVersion, type) {
  try {
    const changelog = fs.readFileSync(CHANGELOG_MD, 'utf8');
    const today = new Date().toISOString().split('T')[0];
    
    // 创建新版本条目
    const newEntry = `## [${newVersion}] - ${today}

### ✨ 新功能
- 新增功能描述

### 🐛 问题修复
- 修复问题描述

### 🔧 改进
- 改进内容描述

### 📝 文档更新
- 文档更新内容

### 🚀 部署说明

#### Docker 部署
\`\`\`bash
docker pull ghcr.io/katelya77/katelyatv:v${newVersion}
docker run -d --name katelyatv -p 3000:3000 --env PASSWORD=your_password ghcr.io/katelya77/katelyatv:v${newVersion}
\`\`\`

#### 环境变量更新
请查看 [README.md](README.md) 了解最新的环境变量配置。

### 📋 完整更新日志
查看 [CHANGELOG.md](CHANGELOG.md) 了解详细的更新历史。

### 🔗 相关链接
- [项目主页](https://github.com/katelya77/KatelyaTV)
- [在线演示](https://katelyatv.vercel.app)
- [问题反馈](https://github.com/katelya77/KatelyaTV/issues)
- [功能建议](https://github.com/katelya77/KatelyaTV/discussions)

`;

    // 在未发布部分后插入新版本
    const updatedChangelog = changelog.replace(
      '## [未发布]',
      `## [未发布]\n\n### 计划中\n- 弹幕系统支持\n- 字幕文件支持\n- 下载功能\n- 社交分享功能\n- 用户评分系统\n\n${newEntry}`
    );
    
    fs.writeFileSync(CHANGELOG_MD, updatedChangelog);
    success('CHANGELOG.md 已更新');
  } catch (err) {
    error(`更新 CHANGELOG.md 失败: ${err.message}`);
  }
}

// 创建 Git 标签
function createGitTag(version) {
  try {
    execSync(`git tag v${version}`, { stdio: 'inherit' });
    success(`Git 标签 v${version} 已创建`);
  } catch (err) {
    warning(`创建 Git 标签失败: ${err.message}`);
  }
}

// 提交更改
function commitChanges(version) {
  try {
    execSync('git add .', { stdio: 'inherit' });
    execSync(`git commit -m "chore: bump version to ${version}"`, { stdio: 'inherit' });
    success('版本更改已提交到 Git');
  } catch (err) {
    warning(`Git 提交失败: ${err.message}`);
  }
}

// 显示帮助信息
function showHelp() {
  console.log(`
${colors.bright}MoonTV 版本管理脚本${colors.reset}

用法: node scripts/version-manager.js <命令> [选项]

命令:
  ${colors.cyan}major${colors.reset}          增加主版本号 (x.0.0)
  ${colors.cyan}minor${colors.reset}          增加次版本号 (0.x.0)
  ${colors.cyan}patch${colors.reset}          增加修订版本号 (0.0.x)
  ${colors.cyan}pre <标识符>${colors.reset}   创建预发布版本 (如: alpha, beta, rc)
  ${colors.cyan}build${colors.reset}          增加构建版本号
  ${colors.cyan}show${colors.reset}           显示当前版本信息
  ${colors.cyan}help${colors.reset}           显示此帮助信息

选项:
  --no-commit    不自动提交 Git 更改
  --no-tag      不自动创建 Git 标签
  --no-changelog 不更新 CHANGELOG.md

示例:
  node scripts/version-manager.js patch
  node scripts/version-manager.js minor --no-commit
  node scripts/version-manager.js pre alpha
  node scripts/version-manager.js show

注意: 此脚本会自动更新以下文件:
  - package.json
  - VERSION.txt
  - CHANGELOG.md
`);
}

// 显示当前版本信息
function showVersionInfo() {
  const packageVersion = getCurrentVersion();
  const versionTxt = getVersionTxt();
  
  console.log(`
${colors.bright}当前版本信息:${colors.reset}

📦 Package.json 版本: ${colors.green}${packageVersion}${colors.reset}
📅 VERSION.txt: ${colors.blue}${versionTxt}${colors.reset}
📋 版本类型: ${colors.yellow}${packageVersion.includes('-') ? '预发布版本' : '正式版本'}${colors.reset}

💡 使用 'node scripts/version-manager.js help' 查看所有可用命令
`);
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('help') || args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }
  
  if (args.includes('show')) {
    showVersionInfo();
    return;
  }
  
  const command = args[0];
  const options = {
    noCommit: args.includes('--no-commit'),
    noTag: args.includes('--no-tag'),
    noChangelog: args.includes('--no-changelog')
  };
  
  // 验证命令
  if (!Object.values(VERSION_TYPES).includes(command)) {
    error(`无效的命令: ${command}`);
  }
  
  // 获取预发布标识符
  let preRelease = null;
  if (command === VERSION_TYPES.PRE) {
    if (args.length < 2) {
      error('预发布版本需要指定标识符 (如: alpha, beta, rc)');
    }
    preRelease = args[1];
  }
  
  info(`开始更新版本...`);
  info(`当前版本: ${getCurrentVersion()}`);
  
  // 更新版本
  const { newVersion, newVersionTxt } = updateVersion(command, preRelease);
  info(`新版本: ${newVersion}`);
  
  // 更新文件
  updatePackageJson(newVersion);
  updateVersionTxt(newVersionTxt);
  
  if (!options.noChangelog) {
    updateChangelog(newVersion, command);
  }
  
  // Git 操作
  if (!options.noCommit) {
    commitChanges(newVersion);
  }
  
  if (!options.noTag) {
    createGitTag(newVersion);
  }
  
  success(`\n🎉 版本更新完成!`);
  success(`新版本: ${newVersion}`);
  success(`时间戳: ${newVersionTxt}`);
  
  if (!options.noCommit) {
    info('提示: 使用 "git push --tags" 推送标签到远程仓库');
  }
}

// 运行脚本
if (require.main === module) {
  main();
}

module.exports = {
  VERSION_TYPES,
  getCurrentVersion,
  getVersionTxt,
  updateVersion,
  updatePackageJson,
  updateVersionTxt,
  updateChangelog
};