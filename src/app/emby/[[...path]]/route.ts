/* eslint-disable no-console, @typescript-eslint/no-explicit-any */
// Emby Server 兼容 API。
// 让 Hills / Infuse / Emby 官方客户端等把本站当作 Emby Server 添加。
// 添加地址填：http(s)://<host>/emby  （或直接 http(s)://<host>）
//
// 仅实现浏览 + 播放所需的最小 Emby REST 子集，数据来源于项目自身的
// 聚合搜索 / 详情能力（苹果 CMS 源）。

import { NextRequest, NextResponse } from 'next/server';

import { getConfig, getAvailableApiSites } from '@/lib/config';
import { addCorsHeaders, handleOptionsRequest } from '@/lib/cors';
import { getDetailFromApi, searchFromApi } from '@/lib/downstream';
import {
  buildEpisode,
  buildItemFromResult,
  buildMediaSource,
  buildSeason,
  buildView,
  decodeItemId,
  EMBY_SERVER_ID,
  EMBY_VERSION,
} from '@/lib/emby';

export const runtime = 'edge';

export async function OPTIONS() {
  return handleOptionsRequest();
}

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}

function json(data: any, init?: ResponseInit): Response {
  return addCorsHeaders(NextResponse.json(data, init));
}

// 把 /emby/... 前缀和 query 去掉，得到规范化的路径段数组。
function getSegments(request: NextRequest): string[] {
  const { pathname } = new URL(request.url);
  const parts = pathname.split('/').filter(Boolean);
  if (parts[0] === 'emby') parts.shift();
  return parts;
}

async function handle(request: NextRequest): Promise<Response> {
  const segments = getSegments(request);
  const path = segments.join('/').toLowerCase();
  const { searchParams } = new URL(request.url);

  try {
    // ---- 服务器发现 / 信息 ----
    if (path === 'system/info/public') {
      return json(await systemInfoPublic(request));
    }
    if (path === 'system/info') {
      return json(await systemInfo(request));
    }
    if (path === 'system/endpoint') {
      return json({ IsLocal: false, IsInNetwork: false });
    }

    // ---- 认证 ----
    // POST /Users/AuthenticateByName
    if (path === 'users/authenticatebyname') {
      return json(await authenticate(request));
    }
    // GET /Users/Public
    if (path === 'users/public') {
      return json([publicUser()]);
    }

    // ---- 媒体库列表 ----
    // GET /Users/{userId}/Views  或  /Library/VirtualFolders
    if (
      (segments[0] === 'Users' && segments[2] === 'Views') ||
      path === 'library/mediafolders'
    ) {
      return json(await views());
    }

    // ---- 浏览 / 搜索 Items ----
    // GET /Users/{userId}/Items  或  GET /Items
    if (
      (segments[0] === 'Users' && segments[2] === 'Items' && !segments[3]) ||
      (segments[0] === 'Items' && !segments[1])
    ) {
      return json(await items(searchParams));
    }

    // GET /Users/{userId}/Items/{id}  —— 单个 Item 详情
    if (segments[0] === 'Users' && segments[2] === 'Items' && segments[3]) {
      return json(await itemDetail(segments[3]));
    }

    // GET /Shows/{id}/Seasons
    if (segments[0] === 'Shows' && segments[2] === 'Seasons') {
      return json(await seasons(segments[1]));
    }

    // GET /Shows/{id}/Episodes
    if (segments[0] === 'Shows' && segments[2] === 'Episodes') {
      return json(await episodes(segments[1], searchParams));
    }

    // ---- 图片代理 ----
    // GET /Items/{id}/Images/{type}
    if (segments[0] === 'Items' && segments[2] === 'Images') {
      return imageProxy(segments[1]);
    }

    // ---- 播放信息 ----
    // GET|POST /Items/{id}/PlaybackInfo
    if (segments[0] === 'Items' && segments[2] === 'PlaybackInfo') {
      return json(await playbackInfo(segments[1]));
    }

    // ---- 直连视频流 ----
    // GET /Videos/{id}/stream(.m3u8)?  或  /Videos/{id}/master.m3u8
    if (segments[0] === 'Videos' && segments[1]) {
      return videoStream(segments[1]);
    }

    // 其它未实现端点返回空对象，避免客户端报错。
    return json({});
  } catch (err) {
    console.error('[emby] handler error:', err);
    return json({ error: 'internal error' }, { status: 500 });
  }
}

// ---------------- 各端点实现 ----------------

async function systemInfoPublic(request: NextRequest) {
  const config = await getConfig();
  const { host } = new URL(request.url);
  return {
    LocalAddress: `${new URL(request.url).protocol}//${host}`,
    ServerName: config.SiteConfig?.SiteName || 'KatelyaTV',
    Version: EMBY_VERSION,
    ProductName: 'Emby Server',
    OperatingSystem: 'Linux',
    Id: EMBY_SERVER_ID,
    StartupWizardCompleted: true,
  };
}

async function systemInfo(request: NextRequest) {
  const pub = await systemInfoPublic(request);
  return {
    ...pub,
    HasPendingRestart: false,
    IsShuttingDown: false,
    SupportsLibraryMonitor: false,
    WebSocketPortNumber: 0,
    CanSelfRestart: false,
    CanLaunchWebBrowser: false,
    HasUpdateAvailable: false,
    SystemUpdateLevel: 'Release',
  };
}

function publicUser() {
  return {
    Name: 'guest',
    ServerId: EMBY_SERVER_ID,
    Id: 'katelyauser00000000000000000000',
    HasPassword: false,
    HasConfiguredPassword: false,
    Policy: {
      IsAdministrator: true,
      IsDisabled: false,
      EnableAllFolders: true,
      EnabledFolders: [],
    },
    Configuration: {
      PlayDefaultAudioTrack: true,
      EnableNextEpisodeAutoPlay: true,
    },
  };
}

async function authenticate(request: NextRequest) {
  // 认证是可选的：本项目的检索接口本身公开，这里主要为满足客户端流程。
  let username = 'guest';
  let password = '';
  try {
    const body = await request.json();
    username = body?.Username || body?.username || 'guest';
    password = body?.Pw || body?.Password || body?.password || '';
  } catch {
    // 无 body 也允许（部分客户端仅探测）。
  }

  // 若服务端配置了访问密码，做一次校验；否则直接放行。
  const envPassword = process.env.AUTH_PASSWORD;
  if (envPassword && password && password !== envPassword) {
    // 密码错误时也返回一个可用会话，避免不同客户端流程卡死；
    // 真正的资源检索不依赖此凭据。此处保留最小语义。
  }

  const user = { ...publicUser(), Name: username };
  const token = `katelya-${Date.now().toString(36)}`;
  return {
    User: user,
    SessionInfo: {
      Id: token,
      UserId: user.Id,
      ServerId: EMBY_SERVER_ID,
      Client: 'Emby',
      DeviceName: 'KatelyaTV',
    },
    AccessToken: token,
    ServerId: EMBY_SERVER_ID,
  };
}

async function views() {
  const sites = await getAvailableApiSites();
  const items = sites.map((s) => buildView(s));
  return {
    Items: items,
    TotalRecordCount: items.length,
    StartIndex: 0,
  };
}

// 浏览一个库（ParentId=view~source）或全局搜索（SearchTerm）。
async function items(searchParams: URLSearchParams) {
  const parentId = searchParams.get('ParentId');
  const searchTerm =
    searchParams.get('SearchTerm') || searchParams.get('searchTerm') || '';

  // 情况一：带搜索词。
  if (searchTerm) {
    let sites = await getAvailableApiSites();
    // 若指定了库（源），只搜该源。
    if (parentId) {
      const decoded = decodeItemId(parentId);
      if (decoded?.type === 'view') {
        sites = sites.filter((s) => s.key === decoded.source);
      }
    }
    const settled = await Promise.all(
      sites.map((s) => searchFromApi(s, searchTerm).catch(() => []))
    );
    const results = settled.flat();
    const embyItems = results.map((r) => buildItemFromResult(r));
    return {
      Items: embyItems,
      TotalRecordCount: embyItems.length,
      StartIndex: 0,
    };
  }

  // 情况二：进入某个库但无搜索词 —— maccms 源需要关键词才能列内容，
  // 因此返回空列表并提示客户端使用搜索。
  return { Items: [], TotalRecordCount: 0, StartIndex: 0 };
}

async function findResult(source: string, vid: string) {
  const sites = await getAvailableApiSites();
  const site = sites.find((s) => s.key === source);
  if (!site) return null;
  return getDetailFromApi(site, vid);
}

async function itemDetail(itemId: string) {
  const decoded = decodeItemId(itemId);
  if (!decoded) return {};

  if (decoded.type === 'view') {
    const sites = await getAvailableApiSites();
    const site = sites.find((s) => s.key === decoded.source);
    return site ? buildView(site) : {};
  }

  const result = await findResult(decoded.source, decoded.vid);
  if (!result) return {};

  if (decoded.type === 'episode') {
    return buildEpisode(result, decoded.index >= 0 ? decoded.index : 0);
  }
  if (decoded.type === 'season') {
    return buildSeason(result);
  }
  return buildItemFromResult(result);
}

async function seasons(seriesItemId: string) {
  const decoded = decodeItemId(seriesItemId);
  if (!decoded) return { Items: [], TotalRecordCount: 0 };
  const result = await findResult(decoded.source, decoded.vid);
  if (!result) return { Items: [], TotalRecordCount: 0 };
  const season = buildSeason(result);
  return { Items: [season], TotalRecordCount: 1, StartIndex: 0 };
}

async function episodes(seriesItemId: string, _searchParams: URLSearchParams) {
  const decoded = decodeItemId(seriesItemId);
  if (!decoded) return { Items: [], TotalRecordCount: 0 };
  const result = await findResult(decoded.source, decoded.vid);
  if (!result) return { Items: [], TotalRecordCount: 0 };
  const eps = result.episodes.map((_, i) => buildEpisode(result, i));
  return { Items: eps, TotalRecordCount: eps.length, StartIndex: 0 };
}

async function imageProxy(itemId: string): Promise<Response> {
  const decoded = decodeItemId(itemId);
  if (!decoded || !decoded.vid) {
    return new Response(null, { status: 404 });
  }
  const result = await findResult(decoded.source, decoded.vid);
  if (!result?.poster) {
    return new Response(null, { status: 404 });
  }
  try {
    const upstream = await fetch(result.poster, {
      headers: {
        Referer: 'https://movie.douban.com/',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
    });
    if (!upstream.ok) return new Response(null, { status: upstream.status });
    const headers = new Headers();
    headers.set(
      'Content-Type',
      upstream.headers.get('content-type') || 'image/jpeg'
    );
    headers.set('Cache-Control', 'public, max-age=86400');
    headers.set('Access-Control-Allow-Origin', '*');
    return new Response(upstream.body, { status: 200, headers });
  } catch {
    return new Response(null, { status: 502 });
  }
}

// 从 Emby item id 解析出真正的 m3u8 播放地址。
async function resolvePlayUrl(itemId: string): Promise<string | null> {
  const decoded = decodeItemId(itemId);
  if (!decoded) return null;
  const result = await findResult(decoded.source, decoded.vid);
  if (!result || result.episodes.length === 0) return null;
  const idx = decoded.index >= 0 ? decoded.index : 0;
  return result.episodes[idx] || result.episodes[0] || null;
}

async function playbackInfo(itemId: string) {
  const url = await resolvePlayUrl(itemId);
  if (!url) {
    return { MediaSources: [], PlaySessionId: `katelya-${Date.now()}` };
  }
  return {
    MediaSources: [buildMediaSource(itemId, url)],
    PlaySessionId: `katelya-${Date.now()}`,
  };
}

async function videoStream(itemId: string): Promise<Response> {
  const url = await resolvePlayUrl(itemId);
  if (!url) {
    return new Response(null, { status: 404 });
  }
  // 302 重定向到上游 m3u8，客户端直连播放。
  const res = NextResponse.redirect(url, 302);
  return addCorsHeaders(res);
}
