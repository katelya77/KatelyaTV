/* eslint-disable @typescript-eslint/no-explicit-any */
// Emby Server 兼容层的辅助工具：ID 编解码、Emby Item 构造器等。
// 目标：让 Hills / Infuse 等 Emby 客户端能把本项目当作 Emby Server 添加并浏览/播放。

import { ApiSite } from '@/lib/config';
import { SearchResult } from '@/lib/types';

// 固定的服务器标识，Emby 客户端用它区分不同服务器。
export const EMBY_SERVER_ID = 'katelyatv0000000000000000000000';
export const EMBY_VERSION = '4.8.0.0';

// Emby 时间单位：1 秒 = 10,000,000 ticks。默认给一个占位时长（45 分钟），
// 因为上游 maccms 源不提供每集时长。
export const DEFAULT_RUNTIME_TICKS = 45 * 60 * 10_000_000;

type EmbyItemType = 'view' | 'series' | 'movie' | 'season' | 'episode';

// 将 (类型, 源, 视频ID, 集索引) 编码为一个 URL 安全的 Emby ItemId。
// 使用 base64url，保证任意上游 id / source 都能安全往返。
export function encodeItemId(
  type: EmbyItemType,
  source: string,
  vid?: string,
  index?: number
): string {
  const raw = JSON.stringify({ t: type, s: source, v: vid ?? '', i: index ?? -1 });
  return base64UrlEncode(raw);
}

export interface DecodedItemId {
  type: EmbyItemType;
  source: string;
  vid: string;
  index: number;
}

export function decodeItemId(id: string): DecodedItemId | null {
  try {
    const raw = base64UrlDecode(id);
    const obj = JSON.parse(raw);
    if (!obj || typeof obj.t !== 'string' || typeof obj.s !== 'string') {
      return null;
    }
    return {
      type: obj.t as EmbyItemType,
      source: obj.s,
      vid: obj.v || '',
      index: typeof obj.i === 'number' ? obj.i : -1,
    };
  } catch {
    return null;
  }
}

function base64UrlEncode(str: string): string {
  // Edge runtime 提供全局 btoa；先 encodeURIComponent 处理非 ASCII。
  const b64 = btoa(unescape(encodeURIComponent(str)));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string): string {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
  return decodeURIComponent(escape(atob(padded)));
}

// 根据请求推断对外可访问的 base URL（含 /emby 前缀由调用方拼接）。
export function getBaseUrl(request: Request): string {
  const url = new URL(request.url);
  const host = request.headers.get('host') || url.host;
  const proto =
    request.headers.get('x-forwarded-proto') || url.protocol.replace(':', '');
  return `${proto}://${host}`;
}

// ---------------- Emby Item 构造器 ----------------

// 一个视频源对应一个 Emby 媒体库（CollectionFolder / View）。
export function buildView(site: ApiSite) {
  const id = encodeItemId('view', site.key);
  return {
    Name: site.name,
    ServerId: EMBY_SERVER_ID,
    Id: id,
    Guid: id,
    Type: 'CollectionFolder',
    CollectionType: 'movies',
    IsFolder: true,
    ImageTags: {},
    BackdropImageTags: [],
  };
}

// 判断是电影还是剧集。
function isMovie(result: SearchResult): boolean {
  return (result.episodes?.length ?? 0) <= 1;
}

// 把一条搜索/详情结果转换成 Emby 顶层 Item（Movie 或 Series）。
export function buildItemFromResult(result: SearchResult) {
  const movie = isMovie(result);
  const type = movie ? 'movie' : 'series';
  const id = encodeItemId(type, result.source, result.id);
  const year = /^\d{4}$/.test(result.year) ? parseInt(result.year, 10) : undefined;

  const base: any = {
    Name: result.title,
    ServerId: EMBY_SERVER_ID,
    Id: id,
    Guid: id,
    Overview: result.desc || '',
    ProductionYear: year,
    ImageTags: { Primary: result.source }, // 非空即可，触发客户端拉取封面
    BackdropImageTags: [],
    Genres: result.type_name ? [result.type_name] : [],
    UserData: {
      PlaybackPositionTicks: 0,
      PlayCount: 0,
      Played: false,
      IsFavorite: false,
    },
  };

  if (movie) {
    return {
      ...base,
      Type: 'Movie',
      IsFolder: false,
      MediaType: 'Video',
      RunTimeTicks: DEFAULT_RUNTIME_TICKS,
      CanDownload: false,
    };
  }

  return {
    ...base,
    Type: 'Series',
    IsFolder: true,
    ChildCount: result.episodes.length,
    RecursiveItemCount: result.episodes.length,
  };
}

// 剧集下唯一的 Season。
export function buildSeason(result: SearchResult) {
  const seriesId = encodeItemId('series', result.source, result.id);
  const id = encodeItemId('season', result.source, result.id, 1);
  return {
    Name: '第 1 季',
    ServerId: EMBY_SERVER_ID,
    Id: id,
    Guid: id,
    SeriesId: seriesId,
    SeriesName: result.title,
    Type: 'Season',
    IsFolder: true,
    IndexNumber: 1,
    ChildCount: result.episodes.length,
    ImageTags: { Primary: result.source },
  };
}

// 单集 Episode。
export function buildEpisode(result: SearchResult, index: number) {
  const seriesId = encodeItemId('series', result.source, result.id);
  const seasonId = encodeItemId('season', result.source, result.id, 1);
  const id = encodeItemId('episode', result.source, result.id, index);
  return {
    Name: `第 ${index + 1} 集`,
    ServerId: EMBY_SERVER_ID,
    Id: id,
    Guid: id,
    SeriesId: seriesId,
    SeriesName: result.title,
    SeasonId: seasonId,
    ParentIndexNumber: 1,
    IndexNumber: index + 1,
    Type: 'Episode',
    IsFolder: false,
    MediaType: 'Video',
    RunTimeTicks: DEFAULT_RUNTIME_TICKS,
    ImageTags: { Primary: result.source },
    UserData: {
      PlaybackPositionTicks: 0,
      PlayCount: 0,
      Played: false,
    },
  };
}

// 构造 PlaybackInfo / MediaSources 里的媒体源，直接指向上游 m3u8。
export function buildMediaSource(itemId: string, m3u8Url: string) {
  return {
    Protocol: 'Http',
    Id: itemId,
    Path: m3u8Url,
    Type: 'Default',
    Container: 'hls',
    IsRemote: true,
    SupportsDirectPlay: true,
    SupportsDirectStream: true,
    SupportsTranscoding: false,
    DirectStreamUrl: m3u8Url,
    RequiresOpening: false,
    RequiresClosing: false,
    ReadAtNativeFramerate: false,
    Name: 'HLS',
    RunTimeTicks: DEFAULT_RUNTIME_TICKS,
    MediaStreams: [
      {
        Codec: 'h264',
        Type: 'Video',
        Index: 0,
        IsDefault: true,
      },
      {
        Codec: 'aac',
        Type: 'Audio',
        Index: 1,
        IsDefault: true,
      },
    ],
  };
}
