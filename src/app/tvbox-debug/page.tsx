'use client';

import { useEffect, useState } from 'react';

export default function TVBoxDebugPage() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [format, setFormat] = useState<'json' | 'base64'>('json');
  const [testResults, setTestResults] = useState<any[]>([]);
  const [customUrl, setCustomUrl] = useState('');
  const [currentUrl, setCurrentUrl] = useState('');
  const [baseUrl, setBaseUrl] = useState('');

  const fetchConfig = async (
    selectedFormat: 'json' | 'base64',
    url?: string
  ) => {
    setLoading(true);
    setError(null);

    const targetUrl = url || customUrl || `/api/tvbox?format=${selectedFormat}`;
    setCurrentUrl(targetUrl);

    try {
      const response = await fetch(targetUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');

      if (selectedFormat === 'base64' || contentType?.includes('text/plain')) {
        const base64Text = await response.text();
        try {
          // 尝试解码base64
          const jsonText = atob(base64Text);
          const parsedConfig = JSON.parse(jsonText);
          setConfig({ base64: base64Text, json: parsedConfig });
        } catch {
          // 如果不是base64，直接当作JSON处理
          try {
            const parsedConfig = JSON.parse(base64Text);
            setConfig(parsedConfig);
          } catch {
            setConfig({ raw: base64Text });
          }
        }
      } else {
        const jsonConfig = await response.json();
        setConfig(jsonConfig);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  const testSourceAPI = async (source: any) => {
    try {
      // 通过服务端代理测试，避免CORS问题
      const response = await fetch(
        `/api/tvbox/test-source?api=${encodeURIComponent(source.api)}`
      );
      const data = await response.json();
      return {
        source: source.name,
        status: data.status,
        count: data.count || 0,
        error: data.error,
      };
    } catch (err) {
      return {
        source: source.name,
        status: 'error',
        error: err instanceof Error ? err.message : '未知错误',
      };
    }
  };

  const testAllSources = async () => {
    const configData = config?.json || config;
    if (!configData?.sites) return;

    setLoading(true);
    const results = [];

    for (const source of configData.sites.slice(0, 5)) {
      // 只测试前5个源
      const result = await testSourceAPI(source);
      results.push(result);
    }

    setTestResults(results);
    setLoading(false);
  };

  useEffect(() => {
    // 初始化时设置默认URL
    const origin = window.location.origin;
    setBaseUrl(origin);
    setCustomUrl(`${origin}/api/tvbox`);
    fetchConfig('json', `${origin}/api/tvbox`);
  }, []);

  const configData = config?.json || config;

  return (
    <div className='container mx-auto p-6 max-w-6xl'>
      <h1 className='text-3xl font-bold mb-6'>TVBox 配置调试工具</h1>

      {/* 自定义URL输入 */}
      <div className='mb-6 p-4 bg-gray-50 rounded-lg'>
        <h2 className='text-lg font-semibold mb-3'>配置源地址</h2>
        <div className='flex gap-2 mb-3'>
          <input
            type='text'
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            placeholder='输入TVBox配置URL，如: https://example.com/api/tvbox'
            className='flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
          <button
            onClick={() => fetchConfig(format)}
            disabled={loading || !customUrl.trim()}
            className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed'
          >
            {loading ? '加载中...' : '加载配置'}
          </button>
        </div>

        {/* 快速选择预设URL */}
        <div className='flex flex-wrap gap-2'>
          <button
            onClick={() => {
              const url = `${baseUrl}/api/tvbox`;
              setCustomUrl(url);
              fetchConfig(format, url);
            }}
            className='px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300'
          >
            本地API
          </button>
          <button
            onClick={() => {
              const url = `${baseUrl}/tvbox-test.json`;
              setCustomUrl(url);
              fetchConfig(format, url);
            }}
            className='px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300'
          >
            测试配置
          </button>
          <button
            onClick={() => {
              const url = 'https://katelyatv-b3u.pages.dev/api/tvbox';
              setCustomUrl(url);
              fetchConfig(format, url);
            }}
            className='px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300'
          >
            线上配置
          </button>
          <button
            onClick={() => {
              const url =
                'https://ghproxy.net/https://raw.githubusercontent.com/Greatwallcorner/CatVodSpider/master/json/config.json';
              setCustomUrl(url);
              fetchConfig(format, url);
            }}
            className='px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300'
          >
            参考配置
          </button>
        </div>

        {currentUrl && (
          <div className='mt-3 text-sm text-gray-600'>
            <strong>当前加载:</strong>{' '}
            <code className='bg-white px-1 rounded'>{currentUrl}</code>
          </div>
        )}
      </div>

      {/* 格式选择 */}
      <div className='mb-6'>
        <div className='flex gap-4 mb-4'>
          <button
            onClick={() => {
              setFormat('json');
              fetchConfig('json');
            }}
            className={`px-4 py-2 rounded ${
              format === 'json'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            JSON 格式
          </button>
          <button
            onClick={() => {
              setFormat('base64');
              fetchConfig('base64');
            }}
            className={`px-4 py-2 rounded ${
              format === 'base64'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Base64 格式
          </button>
        </div>
      </div>

      {/* 配置链接 */}
      <div className='mb-6 p-4 bg-gray-100 rounded'>
        <h2 className='text-xl font-semibold mb-2'>常用配置链接</h2>
        <div className='space-y-2'>
          <div>
            <strong>本地JSON:</strong>
            <code className='ml-2 p-1 bg-white rounded text-sm'>
              {baseUrl}/api/tvbox
            </code>
          </div>
          <div>
            <strong>本地Base64:</strong>
            <code className='ml-2 p-1 bg-white rounded text-sm'>
              {baseUrl}/api/tvbox?format=base64
            </code>
          </div>
          <div>
            <strong>测试配置:</strong>
            <code className='ml-2 p-1 bg-white rounded text-sm'>
              {baseUrl}/tvbox-test.json
            </code>
          </div>
        </div>
      </div>

      {/* 错误显示 */}
      {error && (
        <div className='mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded'>
          <strong>错误:</strong> {error}
        </div>
      )}

      {/* 加载状态 */}
      {loading && (
        <div className='mb-6 p-4 bg-blue-100 text-blue-700 rounded'>
          加载中...
        </div>
      )}

      {/* 配置预览 */}
      {configData && (
        <div className='mb-6'>
          <div className='flex justify-between items-center mb-4'>
            <h2 className='text-xl font-semibold'>配置预览</h2>
            <button
              onClick={testAllSources}
              className='px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600'
              disabled={loading}
            >
              测试源站连接
            </button>
          </div>

          {/* 统计信息 */}
          <div className='grid grid-cols-4 gap-4 mb-4'>
            <div className='p-3 bg-blue-100 rounded'>
              <div className='text-sm text-gray-600'>影视源</div>
              <div className='text-xl font-bold'>
                {configData.sites?.length || 0}
              </div>
            </div>
            <div className='p-3 bg-green-100 rounded'>
              <div className='text-sm text-gray-600'>解析器</div>
              <div className='text-xl font-bold'>
                {configData.parses?.length || 0}
              </div>
            </div>
            <div className='p-3 bg-yellow-100 rounded'>
              <div className='text-sm text-gray-600'>播放标识</div>
              <div className='text-xl font-bold'>
                {configData.flags?.length || 0}
              </div>
            </div>
            <div className='p-3 bg-purple-100 rounded'>
              <div className='text-sm text-gray-600'>直播源</div>
              <div className='text-xl font-bold'>
                {configData.lives?.length || 0}
              </div>
            </div>
          </div>

          {/* 源站列表 */}
          {configData.sites && (
            <div className='mb-4'>
              <h3 className='text-lg font-semibold mb-2'>影视源列表</h3>
              <div className='overflow-x-auto'>
                <table className='min-w-full bg-white border border-gray-300'>
                  <thead>
                    <tr className='bg-gray-50'>
                      <th className='px-4 py-2 border-b text-left'>名称</th>
                      <th className='px-4 py-2 border-b text-left'>API</th>
                      <th className='px-4 py-2 border-b text-left'>类型</th>
                      <th className='px-4 py-2 border-b text-left'>状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {configData.sites.map((site: any, index: number) => (
                      <tr key={index} className='hover:bg-gray-50'>
                        <td className='px-4 py-2 border-b'>{site.name}</td>
                        <td className='px-4 py-2 border-b'>
                          <code className='text-sm bg-gray-100 px-1 rounded'>
                            {site.api}
                          </code>
                        </td>
                        <td className='px-4 py-2 border-b'>
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              site.type === 0
                                ? 'bg-blue-100 text-blue-800'
                                : site.type === 3
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {site.type === 0
                              ? 'API源'
                              : site.type === 3
                              ? '爬虫源'
                              : `类型${site.type}`}
                          </span>
                        </td>
                        <td className='px-4 py-2 border-b'>
                          {testResults.find((r) => r.source === site.name) ? (
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                testResults.find((r) => r.source === site.name)
                                  ?.status === 'success'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {testResults.find((r) => r.source === site.name)
                                ?.status === 'success'
                                ? '正常'
                                : '异常'}
                            </span>
                          ) : (
                            <span className='text-gray-500 text-xs'>
                              未测试
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 测试结果 */}
          {testResults.length > 0 && (
            <div className='mb-4'>
              <h3 className='text-lg font-semibold mb-2'>连接测试结果</h3>
              <div className='space-y-2'>
                {testResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded ${
                      result.status === 'success'
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-red-50 border border-red-200'
                    }`}
                  >
                    <div className='font-semibold'>{result.source}</div>
                    {result.status === 'success' ? (
                      <div className='text-sm text-green-700'>
                        ✅ 连接成功，返回 {result.count} 条数据
                      </div>
                    ) : (
                      <div className='text-sm text-red-700'>
                        ❌ 连接失败: {result.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 配置JSON */}
          <div>
            <h3 className='text-lg font-semibold mb-2'>完整配置</h3>
            <pre className='bg-gray-100 p-4 rounded overflow-auto text-sm max-h-96'>
              {format === 'base64' && config?.base64 ? (
                <>
                  <div className='mb-2 text-gray-600'>Base64 编码:</div>
                  <div className='mb-4 break-all'>{config.base64}</div>
                  <div className='mb-2 text-gray-600'>解码后的JSON:</div>
                  {JSON.stringify(config.json, null, 2)}
                </>
              ) : config?.raw ? (
                <>
                  <div className='mb-2 text-gray-600'>原始内容:</div>
                  {config.raw}
                </>
              ) : (
                JSON.stringify(configData, null, 2)
              )}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
