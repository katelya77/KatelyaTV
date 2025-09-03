#!/usr/bin/env node

/**
 * 跨平台部署验证脚本
 * 验证KatelyaTV在不同平台和存储后端的兼容性
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// 测试配置
const DEPLOYMENT_TESTS = {
  // 存储后端测试
  storageBackends: [
    {
      name: 'LocalStorage',
      env: { STORAGE_TYPE: 'localstorage' },
      platforms: ['Vercel', 'Netlify', 'CloudflarePages', 'Docker'],
      description: '浏览器本地存储，适合小型部署'
    },
    {
      name: 'Redis',
      env: { STORAGE_TYPE: 'redis', REDIS_URL: 'redis://localhost:6379' },
      platforms: ['Docker', 'VPS', 'Railway'],
      description: '高性能内存数据库，适合高并发'
    },
    {
      name: 'Kvrocks',
      env: { STORAGE_TYPE: 'kvrocks', KVROCKS_URL: 'redis://localhost:6666' },
      platforms: ['Docker', 'VPS'],
      description: 'Redis兼容的持久化存储'
    },
    {
      name: 'Cloudflare D1',
      env: { STORAGE_TYPE: 'd1' },
      platforms: ['CloudflarePages'],
      description: '无服务器SQLite数据库'
    },
    {
      name: 'Upstash Redis',
      env: { STORAGE_TYPE: 'upstash' },
      platforms: ['Vercel', 'Netlify', 'CloudflarePages'],
      description: '无服务器Redis，按使用付费'
    }
  ],
  
  // 部署平台测试
  platforms: [
    {
      name: 'Vercel',
      buildCommand: 'npm run build',
      startCommand: 'npm start',
      envSupport: ['STORAGE_TYPE', 'REDIS_URL', 'UPSTASH_REDIS_REST_URL'],
      features: ['SSR', 'EdgeFunctions', 'AutoScaling'],
      limitations: ['NoFileSystem', 'StatelessOnly']
    },
    {
      name: 'Cloudflare Pages',
      buildCommand: 'npm run pages:build',
      startCommand: 'wrangler pages dev',
      envSupport: ['STORAGE_TYPE', 'D1_DATABASE'],
      features: ['EdgeRuntime', 'D1Database', 'KVStore'],
      limitations: ['NodejsLimited', 'NoRedis']
    },
    {
      name: 'Docker',
      buildCommand: 'docker build -t katelyatv .',
      startCommand: 'docker run -p 3000:3000 katelyatv',
      envSupport: ['All'],
      features: ['FullNodejs', 'AllStorageBackends', 'Portable'],
      limitations: ['RequiresDocker']
    },
    {
      name: 'Traditional VPS',
      buildCommand: 'npm run build',
      startCommand: 'npm start',
      envSupport: ['All'],
      features: ['FullControl', 'AllStorageBackends', 'CustomConfig'],
      limitations: ['ManualMaintenance']
    }
  ]
};

console.log('🚀 KatelyaTV 跨平台部署验证开始...\n');

// 1. 检查项目构建文件
function checkBuildFiles() {
  console.log('📋 检查构建相关文件...');
  
  const requiredFiles = [
    { file: 'package.json', description: 'Node.js项目配置' },
    { file: 'next.config.js', description: 'Next.js配置' },
    { file: 'Dockerfile', description: 'Docker容器配置' },
    { file: 'vercel.json', description: 'Vercel部署配置' },
    { file: 'tsconfig.json', description: 'TypeScript配置' },
    { file: 'tailwind.config.ts', description: 'Tailwind CSS配置' }
  ];
  
  let allFilesExist = true;
  
  requiredFiles.forEach(({ file, description }) => {
    const fullPath = path.join(__dirname, '..', file);
    if (fs.existsSync(fullPath)) {
      console.log(`✅ ${file} - ${description}`);
    } else {
      console.log(`❌ ${file} - ${description} (缺失)`);
      allFilesExist = false;
    }
  });
  
  return allFilesExist;
}

// 2. 验证存储后端兼容性
function checkStorageBackends() {
  console.log('\n💾 验证存储后端兼容性...');
  
  const storageFiles = [
    'src/lib/localstorage.db.ts',
    'src/lib/redis.db.ts', 
    'src/lib/kvrocks.db.ts',
    'src/lib/d1.db.ts',
    'src/lib/upstash.db.ts'
  ];
  
  let allStorageSupported = true;
  
  storageFiles.forEach(file => {
    const fullPath = path.join(__dirname, '..', file);
    if (fs.existsSync(fullPath)) {
      console.log(`✅ ${path.basename(file)} - 存储后端已实现`);
    } else {
      console.log(`❌ ${path.basename(file)} - 存储后端缺失`);
      allStorageSupported = false;
    }
  });
  
  return allStorageSupported;
}

// 3. 检查API端点
function checkAPIEndpoints() {
  console.log('\n🔌 检查API端点...');
  
  const apiEndpoints = [
    'src/app/api/admin/live/route.ts',
    'src/app/api/live/channels/route.ts',
    'src/app/api/live/sources/route.ts',
    'src/app/api/login/route.ts',
    'src/app/api/search/route.ts'
  ];
  
  let allEndpointsExist = true;
  
  apiEndpoints.forEach(endpoint => {
    const fullPath = path.join(__dirname, '..', endpoint);
    if (fs.existsSync(fullPath)) {
      const routeName = endpoint.split('/').slice(-2, -1)[0];
      console.log(`✅ ${routeName} API - 端点已实现`);
    } else {
      console.log(`❌ ${endpoint} - API端点缺失`);
      allEndpointsExist = false;
    }
  });
  
  return allEndpointsExist;
}

// 4. 验证前端页面
function checkFrontendPages() {
  console.log('\n🖥️ 验证前端页面...');
  
  const pages = [
    { path: 'src/app/page.tsx', name: '首页' },
    { path: 'src/app/admin/page.tsx', name: '管理后台' },
    { path: 'src/app/live/page.tsx', name: '直播播放页' },
    { path: 'src/app/live/sources/page.tsx', name: '直播源选择页' },
    { path: 'src/app/search/page.tsx', name: '搜索页面' },
    { path: 'src/app/play/page.tsx', name: '视频播放页' }
  ];
  
  let allPagesExist = true;
  
  pages.forEach(({ path: pagePath, name }) => {
    const fullPath = path.join(__dirname, '..', pagePath);
    if (fs.existsSync(fullPath)) {
      console.log(`✅ ${name} - 页面已实现`);
    } else {
      console.log(`❌ ${name} - 页面缺失`);
      allPagesExist = false;
    }
  });
  
  return allPagesExist;
}

// 5. 生成部署兼容性报告
function generateCompatibilityReport() {
  console.log('\n📊 部署兼容性分析...');
  console.log('='.repeat(80));
  
  DEPLOYMENT_TESTS.storageBackends.forEach(backend => {
    console.log(`\n🗄️ ${backend.name}`);
    console.log(`   描述: ${backend.description}`);
    console.log(`   兼容平台: ${backend.platforms.join(', ')}`);
    console.log(`   环境变量: ${Object.keys(backend.env).join(', ')}`);
  });
  
  console.log('\n🌐 部署平台分析:');
  DEPLOYMENT_TESTS.platforms.forEach(platform => {
    console.log(`\n📦 ${platform.name}`);
    console.log(`   构建命令: ${platform.buildCommand}`);
    console.log(`   启动命令: ${platform.startCommand}`);
    console.log(`   特性: ${platform.features.join(', ')}`);
    console.log(`   限制: ${platform.limitations.join(', ')}`);
  });
}

// 6. 生成部署建议
function generateDeploymentRecommendations() {
  console.log('\n💡 部署建议...');
  console.log('='.repeat(50));
  
  const recommendations = [
    {
      scenario: '个人项目/小型应用',
      platform: 'Vercel + LocalStorage',
      reason: '免费额度足够，配置简单，快速部署'
    },
    {
      scenario: '团队协作/中型应用',  
      platform: 'Docker + Redis',
      reason: '功能完整，性能稳定，易于扩展'
    },
    {
      scenario: '企业级/大型应用',
      platform: 'Kubernetes + Kvrocks',
      reason: '高可用性，数据持久化，零数据丢失'
    },
    {
      scenario: '无服务器优先',
      platform: 'Cloudflare Pages + D1',
      reason: '全球CDN，边缘计算，按使用付费'
    },
    {
      scenario: '混合云部署',
      platform: 'VPS + Upstash Redis',
      reason: '灵活控制，云端缓存，成本可控'
    }
  ];
  
  recommendations.forEach(rec => {
    console.log(`\n🎯 ${rec.scenario}`);
    console.log(`   推荐方案: ${rec.platform}`);
    console.log(`   推荐理由: ${rec.reason}`);
  });
}

// 7. 检查生产环境优化
function checkProductionOptimizations() {
  console.log('\n⚡ 检查生产环境优化...');
  
  const optimizations = [
    {
      check: () => fs.existsSync(path.join(__dirname, '..', 'next.config.js')),
      name: 'Next.js配置优化',
      status: null
    },
    {
      check: () => {
        const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
        return packageJson.scripts && packageJson.scripts.build;
      },
      name: '生产构建脚本',
      status: null
    },
    {
      check: () => fs.existsSync(path.join(__dirname, '..', 'Dockerfile')),
      name: 'Docker容器化',
      status: null
    },
    {
      check: () => fs.existsSync(path.join(__dirname, '..', 'public', 'manifest.json')),
      name: 'PWA配置',
      status: null
    }
  ];
  
  optimizations.forEach(opt => {
    opt.status = opt.check();
    console.log(`${opt.status ? '✅' : '⚠️'} ${opt.name}`);
  });
  
  return optimizations.every(opt => opt.status);
}

// 主函数
async function runDeploymentValidation() {
  const results = {
    buildFiles: checkBuildFiles(),
    storageBackends: checkStorageBackends(), 
    apiEndpoints: checkAPIEndpoints(),
    frontendPages: checkFrontendPages(),
    productionOptimizations: checkProductionOptimizations()
  };
  
  // 生成报告
  generateCompatibilityReport();
  generateDeploymentRecommendations();
  
  console.log('\n📊 验证结果汇总:');
  console.log('='.repeat(50));
  console.log(`构建文件: ${results.buildFiles ? '✅ 完整' : '❌ 不完整'}`);
  console.log(`存储后端: ${results.storageBackends ? '✅ 全支持' : '❌ 有缺失'}`);
  console.log(`API端点: ${results.apiEndpoints ? '✅ 完整' : '❌ 有缺失'}`);
  console.log(`前端页面: ${results.frontendPages ? '✅ 完整' : '❌ 有缺失'}`);
  console.log(`生产优化: ${results.productionOptimizations ? '✅ 完整' : '⚠️ 可改进'}`);
  
  const allPassed = Object.values(results).every(result => result);
  
  if (allPassed) {
    console.log('\n🎉 恭喜！KatelyaTV已准备好在所有支持的平台上部署！');
    console.log('\n🚀 推荐的部署流程:');
    console.log('1. 选择适合的存储后端和部署平台组合');
    console.log('2. 配置相应的环境变量');
    console.log('3. 执行对应平台的构建命令');
    console.log('4. 验证所有功能正常运行');
    console.log('5. 设置监控和备份策略');
  } else {
    console.log('\n⚠️ 发现一些问题，建议修复后再进行部署。');
  }
  
  console.log('\n📚 更多部署信息请查看:');
  console.log('- README_IPTV.md (项目文档)');
  console.log('- docs/LIVE_TV.md (功能文档)');
  console.log('- QUICK_START.md (快速开始)');
}

// 运行验证
runDeploymentValidation().catch(console.error);
