import { NextRequest, NextResponse } from 'next/server';

import { getStorage } from '@/lib/db';

// 强制动态渲染
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  try {
    const storage = getStorage();
    const liveConfigs = await storage.getLiveConfigs();
    
    // 只返回启用的直播源
    const enabledSources = liveConfigs
      .filter(config => !config.disabled)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map(config => ({
        key: config.key,
        name: config.name,
        channelNumber: config.channelNumber || 0,
        from: config.from,
      }));

    return NextResponse.json({
      success: true,
      sources: enabledSources,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Live sources API error:', error);
    return NextResponse.json(
      { error: '获取直播源列表失败' },
      { status: 500 }
    );
  }
}
