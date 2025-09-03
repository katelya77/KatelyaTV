'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import PageLayout from '@/components/PageLayout';

// 强制动态渲染
export const dynamic = 'force-dynamic';

interface LiveSource {
  key: string;
  name: string;
  channelNumber: number;
  from: 'config' | 'custom';
}

export default function LiveSourcesPage() {
  const [sources, setSources] = useState<LiveSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 获取直播源列表
  const fetchSources = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/live/sources');
      
      if (!response.ok) {
        throw new Error('获取直播源列表失败');
      }

      const data = await response.json();
      setSources(data.sources || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  if (loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">加载直播源列表中...</p>
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
              onClick={fetchSources}
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
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-4">
            📺 直播电视
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            选择一个直播源开始观看电视节目
          </p>
        </div>

        {sources.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sources.map((source) => (
              <Link
                key={source.key}
                href={`/live?source=${source.key}`}
                className="block group"
              >
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-all duration-200 hover:shadow-lg hover:scale-105">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xl font-bold">📺</span>
                    </div>
                    {source.from === 'config' && (
                      <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 text-xs rounded-full">
                        示例源
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {source.name}
                  </h3>
                  
                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>频道数量</span>
                    <span className="font-medium text-blue-600 dark:text-blue-400">
                      {source.channelNumber > 0 ? `${source.channelNumber} 个` : '未知'}
                    </span>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex-1">点击观看</span>
                      <span className="text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform">
                        →
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📺</div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
              暂无可用直播源
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              请联系管理员添加直播源配置
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              返回首页
            </Link>
          </div>
        )}

        {/* 使用说明 */}
        <div className="mt-12 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-3">
            使用说明
          </h3>
          <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
            <li className="flex items-start space-x-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>选择上方任意一个直播源即可开始观看电视节目</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>支持多种视频格式，包括 M3U8、MP4 等</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>可以按频道分组浏览，方便快速找到想看的节目</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>部分直播源可能需要一定时间加载，请耐心等待</span>
            </li>
          </ul>
        </div>
      </div>
    </PageLayout>
  );
}
