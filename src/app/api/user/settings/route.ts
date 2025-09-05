import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { getStorage } from '@/lib/db';
import { UserSettings } from '@/lib/types';

// 设置运行时为 Edge Runtime，确保部署兼容性
export const runtime = 'edge';

// 获取用户设置
export async function GET(_request: NextRequest) {
  try {
    const headersList = headers();
    const authorization = headersList.get('Authorization');
    
    if (!authorization) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const userName = decodeURIComponent(authorization.split(' ')[1] || ''); // 修复中文用户名问题
    
    if (!userName) {
      return NextResponse.json({ error: '用户名不能为空' }, { status: 400 });
    }

    // 检查是否为站长账号
    const isOwner = await isOwnerAccount(userName);
    
    const storage = getStorage();
    let settings = await storage.getUserSettings(userName);
    
    // 如果是站长账号且没有设置，自动创建默认设置
    if (isOwner && !settings) {
      const defaultSettings: UserSettings = {
        filter_adult_content: false, // 站长默认关闭过滤
        theme: 'auto',
        language: 'zh-CN',
        auto_play: true,
        video_quality: 'auto'
      };
      
      try {
        // 尝试为站长创建用户记录
        await ensureOwnerUser(userName);
        await storage.updateUserSettings(userName, defaultSettings);
        settings = defaultSettings;
      } catch (error) {
        // 如果创建失败，返回默认设置但不保存
        settings = defaultSettings;
      }
    }
    
    return NextResponse.json({ 
      settings: settings || {
        filter_adult_content: true, // 普通用户默认开启过滤
        theme: 'auto',
        language: 'zh-CN',
        auto_play: true,
        video_quality: 'auto'
      },
      isOwner // 返回是否为站长账号
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error getting user settings:', error);
    return NextResponse.json({ error: '获取用户设置失败' }, { status: 500 });
  }
}

// 检查是否为站长账号
async function isOwnerAccount(userName: string): Promise<boolean> {
  const storageType = process.env.NEXT_PUBLIC_STORAGE_TYPE || 'localstorage';
  
  if (storageType === 'localstorage') {
    // localStorage模式下，只需检查环境变量
    return userName === (process.env.USERNAME || 'admin');
  }
  
  // 其他模式下，检查是否为环境变量中的站长账号
  return userName === (process.env.USERNAME || 'admin');
}

// 确保站长用户存在
async function ensureOwnerUser(userName: string): Promise<void> {
  const storage = getStorage();
  
  try {
    const userExists = await storage.checkUserExist(userName);
    if (!userExists && storage.registerUser) {
      // 为站长创建用户记录，使用环境变量中的密码
      await storage.registerUser(userName, process.env.PASSWORD || '');
    }
  } catch (error) {
    // 忽略注册错误，可能用户已存在
    // eslint-disable-next-line no-console
    console.warn('Failed to ensure owner user:', error);
  }
}

// 更新用户设置
export async function PATCH(request: NextRequest) {
  try {
    const headersList = headers();
    const authorization = headersList.get('Authorization');
    
    if (!authorization) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const userName = decodeURIComponent(authorization.split(' ')[1] || ''); // 修复中文用户名问题
    
    if (!userName) {
      return NextResponse.json({ error: '用户名不能为空' }, { status: 400 });
    }

    const body = await request.json();
    const { settings } = body as { settings: Partial<UserSettings> };
    
    if (!settings) {
      return NextResponse.json({ error: '设置数据不能为空' }, { status: 400 });
    }

    const storage = getStorage();
    
    // 检查是否为站长账号，如果是则确保用户存在
    const isOwner = await isOwnerAccount(userName);
    if (isOwner) {
      await ensureOwnerUser(userName);
    } else {
      // 验证普通用户存在
      const userExists = await storage.checkUserExist(userName);
      if (!userExists) {
        return NextResponse.json({ error: '用户不存在' }, { status: 404 });
      }
    }

    await storage.updateUserSettings(userName, settings);
    
    return NextResponse.json({ 
      success: true,
      message: '设置更新成功' 
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error updating user settings:', error);
    return NextResponse.json({ error: '更新用户设置失败' }, { status: 500 });
  }
}

// 重置用户设置
export async function PUT(request: NextRequest) {
  try {
    const headersList = headers();
    const authorization = headersList.get('Authorization');
    
    if (!authorization) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const userName = authorization.split(' ')[1];
    
    if (!userName) {
      return NextResponse.json({ error: '用户名不能为空' }, { status: 400 });
    }

    const body = await request.json();
    const { settings } = body as { settings: UserSettings };
    
    if (!settings) {
      return NextResponse.json({ error: '设置数据不能为空' }, { status: 400 });
    }

    const storage = getStorage();
    
    // 验证用户存在
    const userExists = await storage.checkUserExist(userName);
    if (!userExists) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    await storage.setUserSettings(userName, settings);
    
    return NextResponse.json({ 
      success: true,
      message: '设置已重置' 
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error resetting user settings:', error);
    return NextResponse.json({ error: '重置用户设置失败' }, { status: 500 });
  }
}
