/* eslint-disable no-console, @typescript-eslint/no-explicit-any */

/**
 * 验证 Kvrocks 密码处理修复
 * 模拟用户反馈的错误场景
 */

// 模拟用户的环境变量设置
process.env.NEXT_PUBLIC_STORAGE_TYPE = 'kvrocks';
process.env.KVROCKS_URL = 'redis://kvrocks:6666';
process.env.KVROCKS_PASSWORD = ''; // 用户设置了空密码，这是问题所在
process.env.KVROCKS_DATABASE = '0';

// 模拟 Redis 客户端创建函数
function createClient(config) {
  console.log('🔧 创建 Redis 客户端配置:', JSON.stringify(config, null, 2));
  
  if (config.password === '') {
    console.log('❌ 检测到空密码，这会导致认证错误！');
    return {
      connect: () => Promise.reject(new Error('ERR Client sent AUTH, but no password is set')),
      isOpen: false
    };
  } else if (config.password === undefined) {
    console.log('✅ 无密码配置，正常连接');
    return {
      connect: () => Promise.resolve(),
      isOpen: true
    };
  } else {
    console.log('✅ 有效密码配置，正常连接');
    return {
      connect: () => Promise.resolve(),
      isOpen: true
    };
  }
}

// 使用修复后的客户端创建逻辑
function getKvrocksClient() {
  const kvrocksUrl = process.env.KVROCKS_URL || 'redis://localhost:6666';
  const kvrocksPassword = process.env.KVROCKS_PASSWORD;
  const kvrocksDatabase = parseInt(process.env.KVROCKS_DATABASE || '0');

  console.log('🏪 Initializing Kvrocks client...');
  console.log('🔗 Kvrocks URL:', kvrocksUrl);
  console.log('🔑 Password configured:', kvrocksPassword ? 'Yes' : 'No');
  console.log('🔑 Password value:', JSON.stringify(kvrocksPassword));

  // 构建客户端配置
  const clientConfig = {
    url: kvrocksUrl,
    database: kvrocksDatabase,
    socket: {
      connectTimeout: 10000,
    },
  };

  // 只有当密码存在且不为空时才添加密码配置
  if (kvrocksPassword && kvrocksPassword.trim() !== '') {
    clientConfig.password = kvrocksPassword;
    console.log('🔐 Using password authentication');
  } else {
    console.log('🔓 No password authentication (connecting without password)');
  }

  return createClient(clientConfig);
}

async function testScenarios() {
  console.log('🧪 测试不同密码配置场景\n');
  
  // 场景1：用户的问题场景 - 空字符串密码
  console.log('📝 场景1：用户问题场景（空字符串密码）');
  console.log('环境变量: KVROCKS_PASSWORD=""');
  process.env.KVROCKS_PASSWORD = '';
  try {
    const client = getKvrocksClient();
    await client.connect();
    console.log('✅ 场景1通过：无认证错误\n');
  } catch (error) {
    console.log('❌ 场景1失败：', error.message, '\n');
  }
  
  // 场景2：未设置密码
  console.log('📝 场景2：未设置密码');
  console.log('环境变量: KVROCKS_PASSWORD=undefined');
  delete process.env.KVROCKS_PASSWORD;
  try {
    const client = getKvrocksClient();
    await client.connect();
    console.log('✅ 场景2通过：无认证错误\n');
  } catch (error) {
    console.log('❌ 场景2失败：', error.message, '\n');
  }
  
  // 场景3：有效密码
  console.log('📝 场景3：有效密码');
  console.log('环境变量: KVROCKS_PASSWORD="validpassword"');
  process.env.KVROCKS_PASSWORD = 'validpassword';
  try {
    const client = getKvrocksClient();
    await client.connect();
    console.log('✅ 场景3通过：正常密码认证\n');
  } catch (error) {
    console.log('❌ 场景3失败：', error.message, '\n');
  }
  
  // 场景4：只有空格的密码
  console.log('📝 场景4：只有空格的密码');
  console.log('环境变量: KVROCKS_PASSWORD="   "');
  process.env.KVROCKS_PASSWORD = '   ';
  try {
    const client = getKvrocksClient();
    await client.connect();
    console.log('✅ 场景4通过：空格密码被正确处理\n');
  } catch (error) {
    console.log('❌ 场景4失败：', error.message, '\n');
  }
}

testScenarios().catch(console.error);
