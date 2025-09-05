/* eslint-disable no-console */
import { NextRequest, NextResponse } from 'next/server';

import { getStorage } from '@/lib/db';

export const runtime = 'edge';

export async function GET(_request: NextRequest) {
  try {
    // 在构建时跳过数据库操作
    if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
      return NextResponse.json({ 
        success: true, 
        message: 'Build time - database operations skipped',
        buildTime: true
      });
    }

    console.log('Testing admin config retrieval...');
    
    const storage = getStorage();
    const config = await storage.getAdminConfig();
    
    console.log('Admin config result:', config ? 'Found' : 'Not found');
    
    return NextResponse.json({ 
      success: true, 
      hasConfig: !!config,
      config: config,
      message: config ? '配置加载成功' : '未找到配置，但连接正常'
    });
    
  } catch (error) {
    console.error('Admin config test failed:', error);
    
    // 如果是构建时的数据库连接问题，返回友好的消息
    if (error instanceof Error && error.message.includes('prepare')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Database not available during build',
        message: '构建时数据库不可用（正常现象）',
        buildTime: true
      });
    }
    
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      message: '配置加载失败'
    }, { status: 500 });
  }
}
