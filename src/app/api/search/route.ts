import { NextResponse } from 'next/server';

import { getAvailableApiSites, getCacheTime } from '@/lib/config';
import { addCorsHeaders, handleOptionsRequest } from '@/lib/cors';
import { getStorage } from '@/lib/db';
import { searchFromApi } from '@/lib/downstream';

export const runtime = 'edge';

// 成人内容关键词过滤
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function filterAdultKeywords(results: any[]): any[] {
  const adultKeywords = [
    '成人',
    '色情',
    '三级',
    '激情',
    '情色',
    '性感',
    '诱惑',
    '限制级',
    'R级',
    '18+',
    '禁片',
    '伦理',
    '写真',
    'adult',
    'porn',
    'sex',
    'erotic',
    'xxx',
    '色',
    '黄',
  ];

  return results.filter((result) => {
    const title = (result.vod_name || result.title || '').toLowerCase();
    const description = (
      result.vod_content ||
      result.description ||
      ''
    ).toLowerCase();
    const category = (result.type_name || result.category || '').toLowerCase();

    const content = `${title} ${description} ${category}`;

    return !adultKeywords.some((keyword) =>
      content.includes(keyword.toLowerCase())
    );
  });
}

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
      userName = decodeURIComponent(authHeader.substring(7)); // 修复中文用户名问题
    }
  } else {
    userName = decodeURIComponent(userName); // 修复URL参数中的中文用户名
  }

  if (!query) {
    const cacheTime = await getCacheTime();

    const response = NextResponse.json(
      {
        regular_results: [],
        adult_results: [],
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
    // 获取用户的成人内容过滤设置
    let shouldFilterAdult = true; // 默认过滤
    let userSettings = null;

    if (userName) {
      try {
        const storage = getStorage();
        userSettings = await storage.getUserSettings(userName);
        // 如果用户设置存在且明确设为false，则不过滤；否则默认过滤
        shouldFilterAdult = userSettings?.filter_adult_content !== false;
      } catch (error) {
        // 出错时默认过滤成人内容
        shouldFilterAdult = true;
      }
    }

    // 获取所有可用的资源站
    let regularSites = [];
    let adultSites = [];

    try {
      regularSites = await getAvailableApiSites(true); // 只获取非成人内容源
      adultSites = shouldFilterAdult ? [] : await getAvailableApiSites(false); // 如果不过滤，获取所有源再过滤出成人源
      if (!shouldFilterAdult && adultSites.length > 0) {
        // 获取纯成人内容源
        const allSites = adultSites;
        const regularSiteKeys = new Set(regularSites.map((s) => s.key));
        adultSites = allSites.filter((s) => !regularSiteKeys.has(s.key));
      }
    } catch (error) {
      // 获取资源站失败，返回空结果
      const cacheTime = await getCacheTime();
      const response = NextResponse.json(
        {
          regular_results: [],
          adult_results: [],
          error: '获取资源站配置失败',
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

    if (regularSites.length === 0 && adultSites.length === 0) {
      const cacheTime = await getCacheTime();
      const response = NextResponse.json(
        {
          regular_results: [],
          adult_results: [],
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

    // 并行搜索常规源和成人源
    const searchPromises = [];

    if (regularSites.length > 0) {
      searchPromises.push(
        ...regularSites.map((site) => searchFromApi(site, query))
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let adultSearchPromises: Promise<any>[] = [];
    if (adultSites.length > 0 && !shouldFilterAdult) {
      adultSearchPromises = adultSites.map((site) =>
        searchFromApi(site, query)
      );
      searchPromises.push(...adultSearchPromises);
    }

    const searchResults = (await Promise.all(searchPromises)).flat();

    // 分离结果
    let regularResults = searchResults;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let adultResults: any[] = [];

    if (adultSearchPromises.length > 0) {
      // 获取成人源的搜索结果
      const adultSearchResults = (
        await Promise.all(adultSearchPromises)
      ).flat();
      adultResults = adultSearchResults;

      // 从常规结果中移除成人源结果
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const adultResultIds = new Set(
        adultResults.map((r: any) => r.id || r.vod_id)
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      regularResults = regularResults.filter(
        (r: any) => !adultResultIds.has(r.id || r.vod_id)
      );
    }

    // 内容关键词过滤（额外安全措施）
    if (shouldFilterAdult) {
      regularResults = filterAdultKeywords(regularResults);
      adultResults = []; // 确保成人结果为空
    }

    const cacheTime = await getCacheTime();
    const response = NextResponse.json(
      {
        regular_results: regularResults,
        adult_results: adultResults,
        filtered: shouldFilterAdult,
        user_settings: userSettings
          ? { filter_adult_content: userSettings.filter_adult_content }
          : null,
      },
      {
        headers: {
          'Cache-Control': shouldFilterAdult
            ? `public, max-age=${cacheTime}, s-maxage=${cacheTime}`
            : 'no-cache, no-store, must-revalidate', // 成人内容不缓存
          'CDN-Cache-Control': shouldFilterAdult
            ? `public, s-maxage=${cacheTime}`
            : 'no-cache',
          'Vercel-CDN-Cache-Control': shouldFilterAdult
            ? `public, s-maxage=${cacheTime}`
            : 'no-cache',
        },
      }
    );
    return addCorsHeaders(response);
  } catch (error) {
    const response = NextResponse.json(
      {
        regular_results: [],
        adult_results: [],
        error: '搜索失败',
      },
      { status: 500 }
    );
    return addCorsHeaders(response);
  }
}
