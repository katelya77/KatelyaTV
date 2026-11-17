#!/usr/bin/env node

/* eslint-disable @typescript-eslint/no-var-requires, no-console */

/**
 * 智能包管理器检测和推荐脚本
 * 帮助用户选择最适合的包管理器
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔍 检测包管理器环境...\n');

// 检测函数
function checkCommand(command) {
  try {
    execSync(`${command} --version`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function getVersion(command) {
  try {
    const version = execSync(`${command} --version`, { encoding: 'utf8' }).trim();
    return version;
  } catch {
    return 'unknown';
  }
}

// 检测包管理器
const hasNpm = checkCommand('npm');
const hasPnpm = checkCommand('pnpm');
const hasYarn = checkCommand('yarn');

const npmVersion = hasNpm ? getVersion('npm') : null;
const pnpmVersion = hasPnpm ? getVersion('pnpm') : null;
const yarnVersion = hasYarn ? getVersion('yarn') : null;

// 检测锁文件
const hasPnpmLock = fs.existsSync('pnpm-lock.yaml');
const hasNpmLock = fs.existsSync('package-lock.json');
const hasYarnLock = fs.existsSync('yarn.lock');

console.log('📦 包管理器检测结果:');
console.log(`   npm:  ${hasNpm ? '✅ ' + npmVersion : '❌ 未安装'}`);
console.log(`   pnpm: ${hasPnpm ? '✅ ' + pnpmVersion : '❌ 未安装'}`);
console.log(`   yarn: ${hasYarn ? '✅ ' + yarnVersion : '❌ 未安装'}`);

console.log('\n🔒 锁文件检测结果:');
console.log(`   pnpm-lock.yaml:   ${hasPnpmLock ? '✅ 存在' : '❌ 不存在'}`);
console.log(`   package-lock.json: ${hasNpmLock ? '✅ 存在' : '❌ 不存在'}`);
console.log(`   yarn.lock:        ${hasYarnLock ? '✅ 存在' : '❌ 不存在'}`);

// 智能推荐
console.log('\n💡 智能推荐:');

if (hasPnpm && hasPnpmLock) {
  console.log('   🎯 推荐使用 pnpm (已安装且有锁文件)');
  console.log('   📝 运行命令: pnpm install && pnpm dev');
} else if (hasNpm && hasNpmLock) {
  console.log('   🎯 推荐使用 npm (已安装且有锁文件)');
  console.log('   📝 运行命令: npm install && npm run dev');
} else if (hasPnpm) {
  console.log('   🎯 推荐使用 pnpm (性能更好)');
  console.log('   📝 运行命令: pnpm install && pnpm dev');
} else if (hasNpm) {
  console.log('   🎯 使用 npm (已安装)');
  console.log('   📝 运行命令: npm install && npm run dev');
} else {
  console.log('   ❌ 未检测到任何包管理器，请先安装 Node.js');
}

// 安装建议
if (!hasPnpm && hasNpm) {
  console.log('\n🚀 pnpm 安装建议 (可选):');
  console.log('   npm install -g pnpm           # 通过npm安装');
  console.log('   corepack enable && corepack prepare pnpm@latest --activate  # 通过corepack');
}

console.log('\n✨ KatelyaTV 支持智能包管理器检测，任何包管理器都可以正常工作！');
