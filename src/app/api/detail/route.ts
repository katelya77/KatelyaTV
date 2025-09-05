import { NextResponse } from 'next/server';

import { getAvailableApiSites, getCacheTime } from '@/lib/config';
import { addCorsHeaders, handleOptionsRequest } from '@/lib/cors';
import { getDetailFromApi } from '@/lib/downstream';

export const runtime = 'edge';

// 处理OPTIONS预检请求（OrionTV客户端需要）
export async function OPTIONS() {
  return handleOptionsRequest();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const sourceCode = searchParams.get('source');

  if (!id || !sourceCode) {
    const response = NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    return addCorsHeaders(response);
  }

  if (!/^[\w-]+$/.test(id)) {
    const response = NextResponse.json({ error: '无效的视频ID格式' }, { status: 400 });
    return addCorsHeaders(response);
  }

  try {
    const apiSites = await getAvailableApiSites();
    const apiSite = apiSites.find((site) => site.key === sourceCode);

    if (!apiSite) {
      const response = NextResponse.json({ error: '无效的API来源' }, { status: 400 });
      return addCorsHeaders(response);
    }

    const result = await getDetailFromApi(apiSite, id);
    const cacheTime = await getCacheTime();

    const response = NextResponse.json(result, {
      headers: {
        'Cache-Control': `public, max-age=${cacheTime}, s-maxage=${cacheTime}`,
        'CDN-Cache-Control': `public, s-maxage=${cacheTime}`,
        'Vercel-CDN-Cache-Control': `public, s-maxage=${cacheTime}`,
      },
    });
    return addCorsHeaders(response);
  } catch (error) {
    const response = NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
    return addCorsHeaders(response);
  }
}
