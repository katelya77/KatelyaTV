/* eslint-disable no-console, @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';

import { getStorage } from '@/lib/db';
import { User } from '@/lib/types';

export const runtime = 'edge';

// 检查是否为站长账户
function isOwnerAccount(username: string): boolean {
  const ownerUsername = process.env.USERNAME || 'admin';
  return username === ownerUsername;
}

export async function GET(request: NextRequest) {
  try {
    // 从Authorization头获取当前用户
    const auth = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!auth) {
      return NextResponse.json({ error: '需要认证' }, { status: 401 });
    }

    const currentUsername = decodeURIComponent(auth);
    
    // 检查是否为站长账户
    if (!isOwnerAccount(currentUsername)) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    // 获取所有用户及其设置
    const storage = getStorage();
    const users: User[] = await storage.getAllUsers();
    const usersWithSettings = await Promise.all(
      users.map(async (user) => {
        const settings = await storage.getUserSettings(user.username);
        return {
          username: user.username,
          role: user.role || 'user',
          created_at: user.created_at,
          filter_adult_content: settings?.filter_adult_content ?? true,
          can_disable_filter: settings?.can_disable_filter ?? true,
          managed_by_admin: settings?.managed_by_admin ?? false,
          last_filter_change: settings?.last_filter_change
        };
      })
    );

    return NextResponse.json({ 
      users: usersWithSettings,
      total: usersWithSettings.length
    });

  } catch (error) {
    console.error('获取用户列表失败:', error);
    return NextResponse.json({ error: '获取用户列表失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // 从Authorization头获取当前用户
    const auth = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!auth) {
      return NextResponse.json({ error: '需要认证' }, { status: 401 });
    }

    const currentUsername = decodeURIComponent(auth);
    
    // 检查是否为站长账户
    if (!isOwnerAccount(currentUsername)) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    const storage = getStorage();
    const { action, username, settings } = await request.json();

    switch (action) {
      case 'update_settings': {
        // 更新用户设置
        const currentSettings = await storage.getUserSettings(username);
        const newSettings = {
          ...currentSettings,
          ...settings,
          last_filter_change: new Date().toISOString()
        };
        
        await storage.setUserSettings(username, newSettings);
        
        return NextResponse.json({ 
          success: true,
          message: `已更新用户 ${username} 的设置` 
        });
      }

      case 'force_filter': {
        // 强制开启某用户的成人内容过滤
        const currentSettings = await storage.getUserSettings(username) || {
          filter_adult_content: true,
          theme: 'auto' as const,
          language: 'zh-CN',
          auto_play: false,
          video_quality: 'auto'
        };
        
        await storage.setUserSettings(username, {
          ...currentSettings,
          filter_adult_content: true,
          can_disable_filter: false,
          managed_by_admin: true,
          last_filter_change: new Date().toISOString()
        });
        
        return NextResponse.json({ 
          success: true,
          message: `已强制开启用户 ${username} 的成人内容过滤` 
        });
      }

      case 'allow_disable': {
        // 允许用户自己管理过滤设置
        const existingSettings = await storage.getUserSettings(username) || {
          filter_adult_content: true,
          theme: 'auto' as const,
          language: 'zh-CN',
          auto_play: false,
          video_quality: 'auto'
        };
        
        await storage.setUserSettings(username, {
          ...existingSettings,
          filter_adult_content: existingSettings.filter_adult_content ?? true,
          theme: existingSettings.theme || 'auto',
          language: existingSettings.language || 'zh-CN',
          auto_play: existingSettings.auto_play ?? false,
          video_quality: existingSettings.video_quality || 'auto',
          can_disable_filter: true,
          managed_by_admin: false,
          last_filter_change: new Date().toISOString()
        });
        
        return NextResponse.json({ 
          success: true,
          message: `已允许用户 ${username} 自己管理过滤设置` 
        });
      }

      default:
        return NextResponse.json({ error: '未知操作' }, { status: 400 });
    }

  } catch (error) {
    console.error('用户管理操作失败:', error);
    return NextResponse.json({ error: '操作失败' }, { status: 500 });
  }
}
