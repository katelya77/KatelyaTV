#!/usr/bin/env node

/**
 * Kvrocks 部署测试脚本
 * 用于验证 Docker + Kvrocks 部署是否正常工作
 */

const { createClient } = require('redis');
const { spawn } = require('child_process');
const fs = require('fs');

// 配置
const TEST_CONFIG = {
  KVROCKS_URL: process.env.KVROCKS_URL || 'redis://localhost:6666',
  KVROCKS_PASSWORD: process.env.KVROCKS_PASSWORD,
  KVROCKS_DATABASE: parseInt(process.env.KVROCKS_DATABASE || '0'),
  TEST_TIMEOUT: 30000, // 30秒超时
};

console.log('🧪 Kvrocks 部署测试开始...\n');

// 测试结果统计
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

// 辅助函数
function logTest(name, status, message = '') {
  testResults.total++;
  if (status === 'PASS') {
    testResults.passed++;
    console.log(`✅ ${name}: PASS ${message}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${name}: FAIL ${message}`);
    testResults.errors.push(`${name}: ${message}`);
  }
}

// 测试1：检查 Docker Compose 文件
async function testDockerComposeFiles() {
  console.log('📁 测试 Docker Compose 配置文件...');
  
  const files = [
    'docker-compose.kvrocks.yml',
    'docker-compose.kvrocks.auth.yml'
  ];
  
  for (const file of files) {
    try {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('kvrocks:') && content.includes('katelyatv:')) {
          logTest(`Docker Compose 文件 ${file}`, 'PASS', '配置正确');
        } else {
          logTest(`Docker Compose 文件 ${file}`, 'FAIL', '配置缺失');
        }
      } else {
        logTest(`Docker Compose 文件 ${file}`, 'FAIL', '文件不存在');
      }
    } catch (error) {
      logTest(`Docker Compose 文件 ${file}`, 'FAIL', error.message);
    }
  }
}

// 测试2：检查环境变量配置
async function testEnvironmentConfig() {
  console.log('\n🔧 测试环境变量配置...');
  
  // 检查必需的环境变量
  const requiredVars = ['NEXT_PUBLIC_STORAGE_TYPE'];
  const optionalVars = ['KVROCKS_PASSWORD', 'NEXTAUTH_SECRET'];
  
  for (const varName of requiredVars) {
    if (process.env[varName]) {
      logTest(`环境变量 ${varName}`, 'PASS', `值: ${process.env[varName]}`);
    } else {
      logTest(`环境变量 ${varName}`, 'FAIL', '未设置');
    }
  }
  
  for (const varName of optionalVars) {
    if (process.env[varName]) {
      logTest(`环境变量 ${varName}`, 'PASS', '已设置');
    } else {
      logTest(`环境变量 ${varName}`, 'PASS', '未设置（可选）');
    }
  }
  
  // 检查存储类型
  if (process.env.NEXT_PUBLIC_STORAGE_TYPE === 'kvrocks') {
    logTest('存储类型配置', 'PASS', 'kvrocks');
  } else {
    logTest('存储类型配置', 'FAIL', `期望 kvrocks，实际 ${process.env.NEXT_PUBLIC_STORAGE_TYPE}`);
  }
}

// 测试3：Kvrocks 连接测试
async function testKvrocksConnection() {
  console.log('\n🔌 测试 Kvrocks 连接...');
  
  let client;
  try {
    // 构建客户端配置
    const clientConfig = {
      url: TEST_CONFIG.KVROCKS_URL,
      database: TEST_CONFIG.KVROCKS_DATABASE,
      socket: {
        connectTimeout: 5000,
      },
    };
    
    // 只有当密码存在且不为空时才添加密码配置
    if (TEST_CONFIG.KVROCKS_PASSWORD && TEST_CONFIG.KVROCKS_PASSWORD.trim() !== '') {
      clientConfig.password = TEST_CONFIG.KVROCKS_PASSWORD;
      console.log('🔐 使用密码认证连接');
    } else {
      console.log('🔓 无密码认证连接');
    }
    
    client = createClient(clientConfig);
    
    // 连接
    await client.connect();
    logTest('Kvrocks 连接', 'PASS', '连接成功');
    
    // 测试 PING
    const pong = await client.ping();
    if (pong === 'PONG') {
      logTest('Kvrocks PING', 'PASS', 'PONG');
    } else {
      logTest('Kvrocks PING', 'FAIL', `响应: ${pong}`);
    }
    
    // 测试基本操作
    const testKey = 'test:' + Date.now();
    const testValue = 'test-value-' + Math.random();
    
    await client.set(testKey, testValue);
    const getValue = await client.get(testKey);
    
    if (getValue === testValue) {
      logTest('Kvrocks 读写操作', 'PASS', '数据一致');
    } else {
      logTest('Kvrocks 读写操作', 'FAIL', `期望 ${testValue}，实际 ${getValue}`);
    }
    
    // 清理测试数据
    await client.del(testKey);
    
    // 测试数据库信息
    const info = await client.info();
    if (info.includes('kvrocks_version')) {
      const version = info.match(/kvrocks_version:([^\r\n]+)/)?.[1];
      logTest('Kvrocks 版本信息', 'PASS', `版本: ${version}`);
    } else {
      logTest('Kvrocks 版本信息', 'FAIL', '无法获取版本信息');
    }
    
  } catch (error) {
    logTest('Kvrocks 连接', 'FAIL', error.message);
  } finally {
    if (client && client.isOpen) {
      await client.quit();
    }
  }
}

// 测试4：Docker 服务状态检查
async function testDockerServices() {
  console.log('\n🐳 测试 Docker 服务状态...');
  
  return new Promise((resolve) => {
    const docker = spawn('docker-compose', ['ps'], { stdio: 'pipe' });
    let output = '';
    
    docker.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    docker.on('close', (code) => {
      if (code === 0) {
        if (output.includes('kvrocks') && output.includes('Up')) {
          logTest('Docker Kvrocks 服务', 'PASS', '服务运行中');
        } else {
          logTest('Docker Kvrocks 服务', 'FAIL', '服务未运行');
        }
        
        if (output.includes('katelyatv') && output.includes('Up')) {
          logTest('Docker KatelyaTV 服务', 'PASS', '服务运行中');
        } else {
          logTest('Docker KatelyaTV 服务', 'FAIL', '服务未运行或未启动');
        }
      } else {
        logTest('Docker 服务检查', 'FAIL', 'docker-compose 命令执行失败');
      }
      resolve();
    });
    
    docker.on('error', (error) => {
      logTest('Docker 服务检查', 'FAIL', `Docker 未安装或不可用: ${error.message}`);
      resolve();
    });
  });
}

// 主测试函数
async function runTests() {
  console.log(`🏗️  测试配置:`);
  console.log(`   Kvrocks URL: ${TEST_CONFIG.KVROCKS_URL}`);
  console.log(`   密码认证: ${TEST_CONFIG.KVROCKS_PASSWORD ? '是' : '否'}`);
  console.log(`   数据库: ${TEST_CONFIG.KVROCKS_DATABASE}`);
  console.log('');
  
  try {
    await testDockerComposeFiles();
    await testEnvironmentConfig();
    await testDockerServices();
    await testKvrocksConnection();
    
  } catch (error) {
    console.error('测试执行出错:', error);
    testResults.failed++;
    testResults.errors.push(`测试执行出错: ${error.message}`);
  }
  
  // 输出测试结果
  console.log('\n' + '='.repeat(50));
  console.log('📊 测试结果汇总:');
  console.log(`   总计: ${testResults.total} 项测试`);
  console.log(`   通过: ${testResults.passed} 项 ✅`);
  console.log(`   失败: ${testResults.failed} 项 ❌`);
  
  if (testResults.failed > 0) {
    console.log('\n🚨 失败的测试项:');
    testResults.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
    
    console.log('\n💡 解决建议:');
    console.log('   1. 检查 Docker 服务是否正常启动');
    console.log('   2. 验证环境变量配置是否正确');
    console.log('   3. 确认网络连接是否正常');
    console.log('   4. 查看详细部署指南: docs/KVROCKS_DEPLOYMENT.md');
  } else {
    console.log('\n🎉 所有测试通过！Kvrocks 部署正常工作。');
  }
  
  console.log('='.repeat(50));
  
  // 退出代码
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// 运行测试
runTests().catch(console.error);
