'use client';

import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';

import PageLayout from '@/components/PageLayout';

interface LiveChannel {
  name: string;
  url: string;
  logo?: string;
  group?: string;
  epgId?: string;
}

function LivePageContent() {
  const searchParams = useSearchParams();
  const [channels, setChannels] = useState<LiveChannel[]>([]);
  const [currentChannel, setCurrentChannel] = useState<LiveChannel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string>('全部');

  // 从 URL 参数获取直播源
  const sourceKey = searchParams.get('source');

  // 获取直播频道列表
  const fetchChannels = useCallback(async () => {
    if (!sourceKey) {
      setError('缺少直播源参数');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/live/channels?source=${sourceKey}`);
      
      if (!response.ok) {
        throw new Error('获取频道列表失败');
      }

      const data = await response.json();
      setChannels(data.channels || []);
      
      // 自动选择第一个频道
      if (data.channels?.length > 0) {
        setCurrentChannel(data.channels[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取频道失败');
    } finally {
      setLoading(false);
    }
  }, [sourceKey]);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  // 获取频道分组
  const groups = ['全部', ...Array.from(new Set(channels.map(ch => ch.group || '未分类')))];
  
  // 过滤频道
  const filteredChannels = selectedGroup === '全部' 
    ? channels 
    : channels.filter(ch => (ch.group || '未分类') === selectedGroup);

  if (loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">加载频道列表中...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
              加载失败
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <button
              onClick={fetchChannels}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              重试
            </button>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 频道列表 */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                频道列表 ({channels.length})
              </h2>
              
              {/* 分组筛选 */}
              {groups.length > 2 && (
                <div className="mb-4">
                  <select
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                  >
                    {groups.map(group => (
                      <option key={group} value={group}>{group}</option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* 频道列表 */}
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {filteredChannels.map((channel, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentChannel(channel)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      currentChannel?.url === channel.url
                        ? 'bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-600 border'
                        : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {channel.logo && (
                        <Image
                          src={channel.logo}
                          alt={channel.name}
                          width={32}
                          height={32}
                          className="w-8 h-8 rounded object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {channel.name}
                        </p>
                        {channel.group && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {channel.group}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              
              {filteredChannels.length === 0 && (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  暂无频道
                </div>
              )}
            </div>
          </div>

          {/* 播放器区域 */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
              {currentChannel ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                      {currentChannel.name}
                    </h1>
                    {currentChannel.group && (
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded">
                        {currentChannel.group}
                      </span>
                    )}
                  </div>
                  
                  {/* 播放器 */}
                  <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                    <video
                      key={currentChannel.url}
                      controls
                      autoPlay
                      className="w-full h-full"
                      onError={(e) => {
                        // eslint-disable-next-line no-console
                        if (process.env.NODE_ENV === 'development') console.error('Video playback error:', e);
                      }}
                    >
                      <source src={currentChannel.url} type="application/x-mpegURL" />
                      <source src={currentChannel.url} type="video/mp4" />
                      您的浏览器不支持视频播放
                    </video>
                  </div>
                  
                  {/* 频道信息 */}
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                      播放信息
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">频道名称：</span>
                        <span className="text-gray-800 dark:text-gray-200">{currentChannel.name}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">分组：</span>
                        <span className="text-gray-800 dark:text-gray-200">{currentChannel.group || '未分类'}</span>
                      </div>
                      <div className="md:col-span-2">
                        <span className="text-gray-600 dark:text-gray-400">播放地址：</span>
                        <span className="text-gray-800 dark:text-gray-200 break-all">{currentChannel.url}</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">📺</div>
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    请选择频道
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    从左侧列表中选择一个频道开始观看
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

// Loading component for Suspense fallback
function LivePageLoading() {
  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
            <div className="lg:col-span-3">
              <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

export default function LivePage() {
  return (
    <Suspense fallback={<LivePageLoading />}>
      <LivePageContent />
    </Suspense>
  );
}
