// M3U/M3U8 播放列表解析器
export interface M3UChannel {
  name: string;
  url: string;
  logo?: string;
  group?: string;
  epgId?: string;
}

/**
 * 解析 M3U/M3U8 格式的直播源文件
 * @param content M3U文件内容
 * @returns 解析出的频道列表
 */
export function parseM3U(content: string): M3UChannel[] {
  const channels: M3UChannel[] = [];
  const lines = content.split('\n').map(line => line.trim()).filter(line => line);
  
  let currentChannel: Partial<M3UChannel> = {};
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // 跳过文件头
    if (line.startsWith('#EXTM3U')) {
      continue;
    }
    
    // 解析频道信息行
    if (line.startsWith('#EXTINF:')) {
      const infoMatch = line.match(/#EXTINF:([^,]*),(.*)$/);
      if (infoMatch) {
        const [, duration, name] = infoMatch;
        currentChannel.name = name.trim();
        
        // 解析扩展属性
        const extendedMatch = duration.match(/tvg-logo="([^"]*)"(?:\s+tvg-id="([^"]*)")?(?:\s+group-title="([^"]*)")?/);
        if (extendedMatch) {
          const [, logo, epgId, group] = extendedMatch;
          if (logo) currentChannel.logo = logo;
          if (epgId) currentChannel.epgId = epgId;
          if (group) currentChannel.group = group;
        }
        
        // 或者解析简单的属性格式
        const logoMatch = line.match(/tvg-logo="([^"]*)"/);
        const epgIdMatch = line.match(/tvg-id="([^"]*)"/);
        const groupMatch = line.match(/group-title="([^"]*)"/);
        
        if (logoMatch) currentChannel.logo = logoMatch[1];
        if (epgIdMatch) currentChannel.epgId = epgIdMatch[1];
        if (groupMatch) currentChannel.group = groupMatch[1];
      }
    }
    
    // 解析频道URL
    if (!line.startsWith('#') && line.startsWith('http')) {
      if (currentChannel.name) {
        channels.push({
          name: currentChannel.name,
          url: line,
          logo: currentChannel.logo,
          group: currentChannel.group || '未分类',
          epgId: currentChannel.epgId,
        });
      }
      currentChannel = {}; // 重置当前频道
    }
  }
  
  return channels;
}

/**
 * 获取并解析远程 M3U/M3U8 文件
 * @param url M3U文件URL
 * @param userAgent 可选的User-Agent
 * @returns 解析出的频道列表
 */
export async function fetchAndParseM3U(url: string, userAgent?: string): Promise<M3UChannel[]> {
  try {
    const headers: Record<string, string> = {};
    if (userAgent) {
      headers['User-Agent'] = userAgent;
    }
    
    const response = await fetch(url, {
      headers,
      // 设置超时时间
      signal: AbortSignal.timeout(30000),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const content = await response.text();
    return parseM3U(content);
  } catch (error) {
    // 开发环境下输出错误日志
    // eslint-disable-next-line no-console
    if (process.env.NODE_ENV === 'development') console.error('Failed to fetch and parse M3U:', error);
    throw error;
  }
}

/**
 * 验证 M3U URL 是否有效
 * @param url 要验证的URL
 * @returns 是否为有效的M3U URL
 */
export function isValidM3UUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol;
    const pathname = urlObj.pathname.toLowerCase();
    
    // 检查协议
    if (protocol !== 'http:' && protocol !== 'https:') {
      return false;
    }
    
    // 检查文件扩展名
    if (pathname.endsWith('.m3u') || pathname.endsWith('.m3u8')) {
      return true;
    }
    
    // 检查是否包含 content-type 参数或其他迹象表明这是一个 M3U 文件
    return pathname.includes('m3u') || urlObj.search.includes('m3u');
  } catch {
    return false;
  }
}
