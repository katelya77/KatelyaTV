import { NextResponse } from 'next/server';

import { getCacheTime, getFilteredApiSites } from '@/lib/config';
import { addCorsHeaders, handleOptionsRequest } from '@/lib/cors';
import { searchFromApi } from '@/lib/downstream';

export const runtime = 'edge';

// 处理OPTIONS预检请求（OrionTV客户端需要）
export async function OPTIONS() {
  return handleOptionsRequest();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  
  // 从 Authorization header 或 query parameter 获取用户名
  let userName: string | undefined = searchParams.get('user') || undefined;
  if (!userName) {
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      userName = authHeader.substring(7);
    }
  }

  if (!query) {
    const cacheTime = await getCacheTime();
    const response = NextResponse.json(
      { 
        regular_results: [],
        adult_results: []
      },
      {
        headers: {
          'Cache-Control': `public, max-age=${cacheTime}, s-maxage=${cacheTime}`,
          'CDN-Cache-Control': `public, s-maxage=${cacheTime}`,
          'Vercel-CDN-Cache-Control': `public, s-maxage=${cacheTime}`,
        },
      }
    );
    return addCorsHeaders(response);
  }

  try {
    // 使用新的动态过滤方法，根据用户设置自动过滤成人内容源
    const availableSites = await getFilteredApiSites(userName);
    
    if (!availableSites || availableSites.length === 0) {
      const cacheTime = await getCacheTime();
      const response = NextResponse.json({ 
        regular_results: [], 
        adult_results: [] 
      }, {
        headers: {
          'Cache-Control': `public, max-age=${cacheTime}, s-maxage=${cacheTime}`,
          'CDN-Cache-Control': `public, s-maxage=${cacheTime}`,
          'Vercel-CDN-Cache-Control': `public, s-maxage=${cacheTime}`,
        },
      });
      return addCorsHeaders(response);
    }

    // 搜索所有可用的资源站（已根据用户设置动态过滤）
    const searchPromises = availableSites.map((site) => searchFromApi(site, query));
    const searchResults = (await Promise.all(searchPromises)).flat();

    // 所有结果都作为常规结果返回，因为成人内容源已经在源头被过滤掉了
    const cacheTime = await getCacheTime();
    const response = NextResponse.json(
      { 
        regular_results: searchResults,
        adult_results: [] // 始终为空，因为成人内容在源头就被过滤了
      },
      {
        headers: {
          'Cache-Control': `public, max-age=${cacheTime}, s-maxage=${cacheTime}`,
          'CDN-Cache-Control': `public, s-maxage=${cacheTime}`,
          'Vercel-CDN-Cache-Control': `public, s-maxage=${cacheTime}`,
        },
      }
    );
    return addCorsHeaders(response);
  } catch (error) {
    const response = NextResponse.json(
      { 
        regular_results: [],
        adult_results: [],
        error: '搜索失败' 
      }, 
      { status: 500 }
    );
    return addCorsHeaders(response);
  }
}
