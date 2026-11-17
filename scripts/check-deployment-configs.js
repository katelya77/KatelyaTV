#!/usr/bin/env node

/**
 * KatelyaTV 全方案部署状态检查脚本
 * 检查所有部署方案的配置文件和环境是否完整
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 KatelyaTV 部署配置检查开始...\n');

// 检查结果统计
let checkResults = {
  total: 0,
  passed: 0,
  failed: 0,
  warnings: 0,
  errors: []
};

// 辅助函数
function logCheck(name, status, message = '') {
  checkResults.total++;
  if (status === 'PASS') {
    checkResults.passed++;
    console.log(`✅ ${name}: PASS ${message}`);
  } else if (status === 'WARN') {
    checkResults.warnings++;
    console.log(`⚠️  ${name}: WARN ${message}`);
  } else {
    checkResults.failed++;
    console.log(`❌ ${name}: FAIL ${message}`);
    checkResults.errors.push(`${name}: ${message}`);
  }
}

function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

function readJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

// 检查1：Docker 部署配置
function checkDockerConfigs() {
  console.log('🐳 检查 Docker 部署配置...');
  
  const dockerConfigs = [
    {
      name: 'Docker + Redis 配置',
      files: ['docker-compose.redis.yml', '.env.redis.example']
    },
    {
      name: 'Docker + Kvrocks 配置（无密码）',
      files: ['docker-compose.kvrocks.yml', '.env.kvrocks.example']
    },
    {
      name: 'Docker + Kvrocks 配置（密码认证）',
      files: ['docker-compose.kvrocks.auth.yml']
    },
    {
      name: 'Docker + Kvrocks 本地构建配置',
      files: ['docker-compose.kvrocks.local.yml']
    }
  ];
  
  for (const config of dockerConfigs) {
    let allFilesExist = true;
    let missingFiles = [];
    
    for (const file of config.files) {
      if (!fileExists(file)) {
        allFilesExist = false;
        missingFiles.push(file);
      }
    }
    
    if (allFilesExist) {
      logCheck(config.name, 'PASS', '所有配置文件存在');
    } else {
      logCheck(config.name, 'FAIL', `缺失文件: ${missingFiles.join(', ')}`);
    }
  }
}

// 检查2：Cloudflare 部署配置
function checkCloudflareConfigs() {
  console.log('\n☁️ 检查 Cloudflare 部署配置...');
  
  const cloudflareFiles = [
    'wrangler.toml',
    '.env.cloudflare.example',
    'scripts/d1-init.sql'
  ];
  
  for (const file of cloudflareFiles) {
    if (fileExists(file)) {
      logCheck(`Cloudflare 配置文件 ${file}`, 'PASS', '文件存在');
    } else {
      logCheck(`Cloudflare 配置文件 ${file}`, 'FAIL', '文件不存在');
    }
  }
  
  // 检查 wrangler.toml 内容
  if (fileExists('wrangler.toml')) {
    const content = fs.readFileSync('wrangler.toml', 'utf8');
    if (content.includes('d1_databases') && content.includes('pages:build')) {
      logCheck('wrangler.toml 内容', 'PASS', '包含必要配置');
    } else {
      logCheck('wrangler.toml 内容', 'WARN', '可能缺少部分配置');
    }
  }
}

// 检查3：Vercel 部署配置
function checkVercelConfigs() {
  console.log('\n▲ 检查 Vercel 部署配置...');
  
  const vercelFile = 'vercel.json';
  if (fileExists(vercelFile)) {
    logCheck('Vercel 配置文件', 'PASS', 'vercel.json 存在');
    
    const vercelConfig = readJsonFile(vercelFile);
    if (vercelConfig) {
      if (vercelConfig.build && vercelConfig.build.env) {
        logCheck('Vercel 构建配置', 'PASS', '包含环境变量配置');
      } else {
        logCheck('Vercel 构建配置', 'WARN', '可能缺少构建环境配置');
      }
    }
  } else {
    logCheck('Vercel 配置文件', 'FAIL', 'vercel.json 不存在');
  }
}

// 检查4：环境变量示例文件
function checkEnvExamples() {
  console.log('\n⚙️ 检查环境变量示例文件...');
  
  const envFiles = [
    '.env.example',
    '.env.redis.example',
    '.env.kvrocks.example',
    '.env.cloudflare.example'
  ];
  
  for (const envFile of envFiles) {
    if (fileExists(envFile)) {
      const content = fs.readFileSync(envFile, 'utf8');
      const hasStorageType = content.includes('NEXT_PUBLIC_STORAGE_TYPE');
      const hasAuthConfig = content.includes('NEXTAUTH_SECRET');
      
      if (hasStorageType && hasAuthConfig) {
        logCheck(`环境变量文件 ${envFile}`, 'PASS', '包含必要配置');
      } else {
        logCheck(`环境变量文件 ${envFile}`, 'WARN', '可能缺少部分配置');
      }
    } else {
      logCheck(`环境变量文件 ${envFile}`, 'FAIL', '文件不存在');
    }
  }
}

// 检查5：package.json 脚本
function checkPackageScripts() {
  console.log('\n📦 检查 package.json 构建脚本...');
  
  const packageJson = readJsonFile('package.json');
  if (packageJson && packageJson.scripts) {
    const requiredScripts = [
      'dev',
      'build',
      'start',
      'pages:build', // Cloudflare Pages
      'lint'
    ];
    
    for (const script of requiredScripts) {
      if (packageJson.scripts[script]) {
        logCheck(`package.json 脚本 ${script}`, 'PASS', '脚本存在');
      } else {
        logCheck(`package.json 脚本 ${script}`, 'WARN', '脚本不存在或未配置');
      }
    }
  } else {
    logCheck('package.json', 'FAIL', '文件不存在或格式错误');
  }
}

// 检查6：Kvrocks 配置文件
function checkKvrocksConfigs() {
  console.log('\n🏪 检查 Kvrocks 配置文件...');
  
  const kvrocksConfigs = [
    'docker/kvrocks/kvrocks.conf',
    'docker/kvrocks/kvrocks.auth.conf'
  ];
  
  for (const configFile of kvrocksConfigs) {
    if (fileExists(configFile)) {
      const content = fs.readFileSync(configFile, 'utf8');
      const hasBasicConfig = content.includes('bind') && content.includes('port');
      
      if (hasBasicConfig) {
        logCheck(`Kvrocks 配置 ${path.basename(configFile)}`, 'PASS', '包含基本配置');
      } else {
        logCheck(`Kvrocks 配置 ${path.basename(configFile)}`, 'WARN', '可能缺少基本配置');
      }
    } else {
      logCheck(`Kvrocks 配置 ${path.basename(configFile)}`, 'FAIL', '文件不存在');
    }
  }
}

// 检查7：文档文件
function checkDocumentation() {
  console.log('\n📚 检查文档文件...');
  
  const docFiles = [
    'README.md',
    'docs/KVROCKS.md',
    'docs/KVROCKS_DEPLOYMENT.md',
    'docs/TVBOX.md',
    'KVROCKS_FIX_REPORT.md'
  ];
  
  for (const docFile of docFiles) {
    if (fileExists(docFile)) {
      logCheck(`文档文件 ${docFile}`, 'PASS', '文件存在');
    } else {
      logCheck(`文档文件 ${docFile}`, 'WARN', '文件不存在');
    }
  }
}

// 主检查函数
async function runChecks() {
  try {
    await checkDockerConfigs();
    await checkCloudflareConfigs();
    await checkVercelConfigs();
    await checkEnvExamples();
    await checkPackageScripts();
    await checkKvrocksConfigs();
    await checkDocumentation();
    
  } catch (error) {
    console.error('检查执行出错:', error);
    checkResults.failed++;
    checkResults.errors.push(`检查执行出错: ${error.message}`);
  }
  
  // 输出检查结果
  console.log('\n' + '='.repeat(60));
  console.log('📊 部署配置检查结果汇总:');
  console.log(`   总计: ${checkResults.total} 项检查`);
  console.log(`   通过: ${checkResults.passed} 项 ✅`);
  console.log(`   警告: ${checkResults.warnings} 项 ⚠️`);
  console.log(`   失败: ${checkResults.failed} 项 ❌`);
  
  if (checkResults.failed > 0) {
    console.log('\n🚨 失败的检查项:');
    checkResults.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  }
  
  if (checkResults.warnings > 0) {
    console.log('\n⚠️  警告说明:');
    console.log('   - 警告项目不影响基本功能，但建议完善');
    console.log('   - 可能影响特定部署方案或高级功能');
  }
  
  if (checkResults.failed === 0) {
    console.log('\n🎉 所有必要配置文件检查通过！');
    console.log('   您可以选择以下任意部署方案：');
    console.log('   1. 🐳 Docker + Redis (docker-compose.redis.yml)');
    console.log('   2. 🏪 Docker + Kvrocks (docker-compose.kvrocks.yml)');
    console.log('   3. ☁️ Cloudflare Pages + D1 (wrangler.toml)');
    console.log('   4. ▲ Vercel + Upstash (vercel.json)');
  }
  
  console.log('='.repeat(60));
  
  // 退出代码
  process.exit(checkResults.failed > 0 ? 1 : 0);
}

// 运行检查
runChecks().catch(console.error);
