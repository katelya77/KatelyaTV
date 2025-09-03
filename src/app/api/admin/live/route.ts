import { NextRequest, NextResponse } from 'next/server';

import { getStorage } from '@/lib/db';
import { fetchAndParseM3U, isValidM3UUrl } from '@/lib/m3u-parser';
import { LiveConfig } from '@/lib/types';

// 针对不同部署模式的配置
export const runtime = process.env.CLOUDFLARE_PAGES === '1' ? 'edge' : 'nodejs';
// 注意：dynamic = "force-dynamic" 不能与 output: export 一起使用

// 验证管理员权限的中间件
async function checkAdminAuth(request: NextRequest) {
  const auth = request.headers.get('authorization');
  if (!auth || !auth.startsWith('Bearer ')) {
    return { error: '未授权访问', status: 401 };
  }

  const token = auth.substring(7);
  // 这里应该验证 JWT token，暂时简化处理
  if (!token) {
    return { error: '令牌无效', status: 401 };
  }

  return { success: true };
}

// 从配置文件加载默认直播源
async function loadDefaultLiveSources(): Promise<LiveConfig[]> {
  try {
    // 动态导入配置文件
    const configModule = await import('../../../../../config.json');
    const config = configModule.default || configModule;
    
    const liveSources: LiveConfig[] = [];
    const configLiveSources = config.live_sources || {};
    
    let order = 0;
    for (const [key, source] of Object.entries(configLiveSources)) {
      if (typeof source === 'object' && source !== null) {
        const liveSource = source as { name?: string; url?: string; ua?: string; epg?: string };
        liveSources.push({
          key,
          name: liveSource.name || key,
          url: liveSource.url || '',
          ua: liveSource.ua,
          epg: liveSource.epg,
          from: 'config',
          channelNumber: 0, // 初始为0，会在刷新时更新
          disabled: false,
          order: order++,
        });
      }
    }
    
    return liveSources;
  } catch (error) {
    // eslint-disable-next-line no-console
    if (process.env.NODE_ENV === 'development') console.error('Failed to load default live sources:', error);
    return [];
  }
}

// 刷新直播源频道数量
async function refreshLiveSourceChannels(source: LiveConfig): Promise<number> {
  if (!isValidM3UUrl(source.url)) {
    throw new Error('无效的 M3U URL');
  }

  try {
    const storage = getStorage();
    
    // 检查缓存
    const cached = await storage.getCachedLiveChannels(source.key);
    const now = Date.now();
    
    if (cached && cached.expireTime > now) {
      return cached.channels.length;
    }

    // 获取并解析频道
    const channels = await fetchAndParseM3U(source.url, source.ua);
    
    // 缓存结果（缓存1小时）
    const cacheData = {
      channels,
      updateTime: now,
      expireTime: now + 60 * 60 * 1000, // 1小时后过期
    };
    
    await storage.setCachedLiveChannels(source.key, cacheData);
    
    return channels.length;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Failed to refresh channels for ${source.key}:`, error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    // 检查管理员权限
    const authResult = await checkAdminAuth(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const storage = getStorage();
    let liveConfigs = await storage.getLiveConfigs();
    
    // 如果没有配置，从默认配置加载
    if (liveConfigs.length === 0) {
      const defaultSources = await loadDefaultLiveSources();
      if (defaultSources.length > 0) {
        await storage.setLiveConfigs(defaultSources);
        liveConfigs = defaultSources;
      }
    }

    return NextResponse.json({ 
      success: true, 
      data: liveConfigs 
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    if (process.env.NODE_ENV === 'development') console.error('Failed to get live configs:', error);
    return NextResponse.json(
      { error: '获取直播源配置失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 检查管理员权限
    const authResult = await checkAdminAuth(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await request.json();
    const { action, ...data } = body;

    const storage = getStorage();
    const liveConfigs = await storage.getLiveConfigs();

    switch (action) {
      case 'add': {
        const { key, name, url, ua, epg } = data;
        
        if (!key || !name || !url) {
          return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
        }

        if (!isValidM3UUrl(url)) {
          return NextResponse.json({ error: '无效的 M3U URL' }, { status: 400 });
        }

        // 检查key是否已存在
        if (liveConfigs.some(config => config.key === key)) {
          return NextResponse.json({ error: '直播源标识已存在' }, { status: 400 });
        }

        const newConfig: LiveConfig = {
          key,
          name,
          url,
          ua,
          epg,
          from: 'custom',
          channelNumber: 0,
          disabled: false,
          order: liveConfigs.length,
        };

        // 尝试获取频道数量
        try {
          newConfig.channelNumber = await refreshLiveSourceChannels(newConfig);
        } catch (error) {
          // 如果获取失败，仍然添加但频道数量为0
          // eslint-disable-next-line no-console
          if (process.env.NODE_ENV === 'development') console.error('Failed to get channel count:', error);
        }

        liveConfigs.push(newConfig);
        await storage.setLiveConfigs(liveConfigs);

        return NextResponse.json({ success: true, data: newConfig });
      }

      case 'edit': {
        const { key, name, url, ua, epg } = data;
        
        const configIndex = liveConfigs.findIndex(config => config.key === key);
        if (configIndex === -1) {
          return NextResponse.json({ error: '直播源不存在' }, { status: 404 });
        }

        const config = liveConfigs[configIndex];
        if (config.from === 'config') {
          return NextResponse.json({ error: '无法编辑配置文件来源的直播源' }, { status: 400 });
        }

        if (!isValidM3UUrl(url)) {
          return NextResponse.json({ error: '无效的 M3U URL' }, { status: 400 });
        }

        // 更新配置
        config.name = name || config.name;
        config.url = url || config.url;
        config.ua = ua;
        config.epg = epg;

        // 如果URL变了，刷新频道数量
        if (url && url !== liveConfigs[configIndex].url) {
          try {
            config.channelNumber = await refreshLiveSourceChannels(config);
          } catch (error) {
            // eslint-disable-next-line no-console
            if (process.env.NODE_ENV === 'development') console.error('Failed to refresh channel count:', error);
          }
        }

        await storage.setLiveConfigs(liveConfigs);

        return NextResponse.json({ success: true, data: config });
      }

      case 'delete': {
        const { key } = data;
        
        const configIndex = liveConfigs.findIndex(config => config.key === key);
        if (configIndex === -1) {
          return NextResponse.json({ error: '直播源不存在' }, { status: 404 });
        }

        const config = liveConfigs[configIndex];
        if (config.from === 'config') {
          return NextResponse.json({ error: '无法删除配置文件来源的直播源' }, { status: 400 });
        }

        // 删除缓存
        await storage.deleteCachedLiveChannels(key);
        
        // 删除配置
        liveConfigs.splice(configIndex, 1);
        await storage.setLiveConfigs(liveConfigs);

        return NextResponse.json({ success: true });
      }

      case 'toggle': {
        const { key } = data;
        
        const config = liveConfigs.find(config => config.key === key);
        if (!config) {
          return NextResponse.json({ error: '直播源不存在' }, { status: 404 });
        }

        config.disabled = !config.disabled;
        await storage.setLiveConfigs(liveConfigs);

        return NextResponse.json({ success: true, data: config });
      }

      case 'refresh': {
        const { key } = data;
        
        if (key) {
          // 刷新单个直播源
          const config = liveConfigs.find(config => config.key === key);
          if (!config) {
            return NextResponse.json({ error: '直播源不存在' }, { status: 404 });
          }

          try {
            config.channelNumber = await refreshLiveSourceChannels(config);
            await storage.setLiveConfigs(liveConfigs);
            return NextResponse.json({ success: true, data: config });
          } catch (error) {
            return NextResponse.json({ 
              error: `刷新失败: ${error instanceof Error ? error.message : '未知错误'}` 
            }, { status: 500 });
          }
        } else {
          // 批量刷新所有直播源
          const results = [];
          for (const config of liveConfigs) {
            try {
              config.channelNumber = await refreshLiveSourceChannels(config);
              results.push({ key: config.key, success: true, channels: config.channelNumber });
            } catch (error) {
              results.push({ 
                key: config.key, 
                success: false, 
                error: error instanceof Error ? error.message : '未知错误' 
              });
            }
          }

          await storage.setLiveConfigs(liveConfigs);
          return NextResponse.json({ success: true, data: results });
        }
      }

      case 'reorder': {
        const { keys } = data;
        
        if (!Array.isArray(keys)) {
          return NextResponse.json({ error: '无效的排序数据' }, { status: 400 });
        }

        // 重新排序
        const orderedConfigs = keys.map((key, index) => {
          const config = liveConfigs.find(c => c.key === key);
          if (config) {
            config.order = index;
            return config;
          }
          return null;
        }).filter(Boolean) as LiveConfig[];

        await storage.setLiveConfigs(orderedConfigs);
        
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: '未知操作' }, { status: 400 });
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    if (process.env.NODE_ENV === 'development') console.error('Live API error:', error);
    return NextResponse.json(
      { error: '操作失败' },
      { status: 500 }
    );
  }
}
