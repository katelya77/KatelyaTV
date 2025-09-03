#!/usr/bin/env node

/**
 * 直播功能测试脚本
 * 用于验证 IPTV 功能的基本可用性
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// 测试配置
const TEST_CONFIG = {
  // 测试用的公开 M3U 地址
  testM3uUrl: 'https://iptv-org.github.io/iptv/index.m3u',
  // 本地配置文件路径
  configPath: path.join(__dirname, '../config.json'),
  // 超时设置（毫秒）
  timeout: 10000
};

console.log('🚀 KatelyaTV 直播功能测试开始...\n');

// 1. 检查配置文件
function checkConfigFile() {
  console.log('📋 检查配置文件...');
  
  try {
    if (!fs.existsSync(TEST_CONFIG.configPath)) {
      console.log('❌ config.json 文件不存在');
      return false;
    }
    
    const config = JSON.parse(fs.readFileSync(TEST_CONFIG.configPath, 'utf8'));
    
    if (!config.live_sources) {
      console.log('❌ 配置文件中缺少 live_sources 配置');
      return false;
    }
    
    const liveSourcesCount = Object.keys(config.live_sources).length;
    console.log(`✅ 配置文件正常，包含 ${liveSourcesCount} 个直播源配置`);
    
    // 显示配置的直播源
    Object.entries(config.live_sources).forEach(([key, source]) => {
      console.log(`   - ${key}: ${source.name}`);
    });
    
    return true;
  } catch (error) {
    console.log(`❌ 读取配置文件失败: ${error.message}`);
    return false;
  }
}

// 2. 测试 M3U 文件访问
function testM3uAccess() {
  return new Promise((resolve) => {
    console.log('\n🌐 测试 M3U 文件访问...');
    console.log(`请求地址: ${TEST_CONFIG.testM3uUrl}`);
    
    const request = https.get(TEST_CONFIG.testM3uUrl, {
      timeout: TEST_CONFIG.timeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        if (response.statusCode === 200) {
          // 简单解析 M3U 内容
          const lines = data.split('\n');
          const extinf_lines = lines.filter(line => line.startsWith('#EXTINF:'));
          const channel_count = extinf_lines.length;
          
          console.log(`✅ M3U 文件访问成功`);
          console.log(`   状态码: ${response.statusCode}`);
          console.log(`   内容长度: ${data.length} 字符`);
          console.log(`   检测到频道数: ${channel_count}`);
          
          if (channel_count > 0) {
            console.log(`   示例频道: ${extinf_lines[0].split(',')[1] || '未知'}`);
          }
          
          resolve(true);
        } else {
          console.log(`❌ M3U 文件访问失败，状态码: ${response.statusCode}`);
          resolve(false);
        }
      });
    });
    
    request.on('error', (error) => {
      console.log(`❌ 网络请求失败: ${error.message}`);
      resolve(false);
    });
    
    request.on('timeout', () => {
      console.log(`❌ 请求超时 (${TEST_CONFIG.timeout}ms)`);
      request.destroy();
      resolve(false);
    });
  });
}

// 3. 检查必要文件
function checkRequiredFiles() {
  console.log('\n📁 检查必要文件...');
  
  const requiredFiles = [
    'src/lib/types.ts',
    'src/lib/m3u-parser.ts',
    'src/app/api/admin/live/route.ts',
    'src/app/api/live/channels/route.ts',
    'src/app/api/live/sources/route.ts',
    'src/app/live/page.tsx',
    'src/app/live/sources/page.tsx'
  ];
  
  let allFilesExist = true;
  
  requiredFiles.forEach(file => {
    const fullPath = path.join(__dirname, '..', file);
    if (fs.existsSync(fullPath)) {
      console.log(`✅ ${file}`);
    } else {
      console.log(`❌ ${file} - 文件不存在`);
      allFilesExist = false;
    }
  });
  
  return allFilesExist;
}

// 4. 检查依赖包
function checkDependencies() {
  console.log('\n📦 检查项目依赖...');
  
  try {
    const packageJsonPath = path.join(__dirname, '../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    const requiredDeps = [
      'next',
      'react',
      'lucide-react',
      'sweetalert2'
    ];
    
    const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    let allDepsInstalled = true;
    
    requiredDeps.forEach(dep => {
      if (allDeps[dep]) {
        console.log(`✅ ${dep}: ${allDeps[dep]}`);
      } else {
        console.log(`❌ ${dep} - 依赖缺失`);
        allDepsInstalled = false;
      }
    });
    
    return allDepsInstalled;
  } catch (error) {
    console.log(`❌ 检查依赖失败: ${error.message}`);
    return false;
  }
}

// 主测试函数
async function runTests() {
  const results = {
    config: checkConfigFile(),
    files: checkRequiredFiles(),
    dependencies: checkDependencies(),
    m3u: await testM3uAccess()
  };
  
  console.log('\n📊 测试结果汇总:');
  console.log('='.repeat(50));
  console.log(`配置文件: ${results.config ? '✅ 通过' : '❌ 失败'}`);
  console.log(`必要文件: ${results.files ? '✅ 通过' : '❌ 失败'}`);
  console.log(`项目依赖: ${results.dependencies ? '✅ 通过' : '❌ 失败'}`);
  console.log(`M3U访问: ${results.m3u ? '✅ 通过' : '❌ 失败'}`);
  
  const allPassed = Object.values(results).every(result => result);
  
  if (allPassed) {
    console.log('\n🎉 所有测试通过！直播功能已准备就绪。');
    console.log('\n🚀 下一步操作:');
    console.log('1. 启动开发服务器: pnpm dev');
    console.log('2. 访问管理后台: http://localhost:3000/admin');
    console.log('3. 在"直播源配置"中添加更多直播源');
    console.log('4. 访问直播页面: http://localhost:3000/live/sources');
  } else {
    console.log('\n⚠️  部分测试失败，请检查上述错误并修复。');
  }
  
  console.log('\n📚 更多信息请查看: docs/LIVE_TV.md');
}

// 运行测试
runTests().catch(console.error);
