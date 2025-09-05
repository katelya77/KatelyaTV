'use client';

import { Shield, ShieldOff } from 'lucide-react';
import { useEffect, useState } from 'react';

interface AdultContentFilterProps {
  userName: string;
  onUpdate?: (enabled: boolean) => void;
}

const AdultContentFilter: React.FC<AdultContentFilterProps> = ({ 
  userName, 
  onUpdate 
}) => {
  const [isEnabled, setIsEnabled] = useState(true); // 默认开启过滤
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取用户设置
  useEffect(() => {
    const fetchUserSettings = async () => {
      if (!userName) return;
      
      try {
        const response = await fetch('/api/user/settings', {
          headers: {
            'Authorization': `Bearer ${userName}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setIsEnabled(data.settings.filter_adult_content);
        } else {
          setError('获取用户设置失败');
        }
      } catch (err) {
        setError('网络连接失败');
        // eslint-disable-next-line no-console
        console.error('Failed to fetch user settings:', err);
      }
    };

    fetchUserSettings();
  }, [userName]);

  // 更新用户设置
  const handleToggle = async () => {
    if (!userName || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userName}`,
        },
        body: JSON.stringify({
          settings: {
            filter_adult_content: !isEnabled,
          },
        }),
      });

      if (response.ok) {
        const newState = !isEnabled;
        setIsEnabled(newState);
        
        // 强制刷新用户设置缓存 - 向搜索API发送一个空请求来刷新设置
        try {
          await fetch('/api/search?q=_cache_refresh_', {
            headers: {
              'Authorization': `Bearer ${userName}`,
            },
          });
        } catch {
          // 忽略刷新缓存的错误
        }
        
        onUpdate?.(newState);
      } else {
        const errorData = await response.json();
        setError(errorData.error || '更新设置失败');
      }
    } catch (err) {
      setError('网络连接失败');
      // eslint-disable-next-line no-console
      console.error('Failed to update user settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900">
            {isEnabled ? (
              <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            ) : (
              <ShieldOff className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              成人内容过滤
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {isEnabled 
                ? '已开启过滤，将自动隐藏所有标记为"成人"的资源站及其内容' 
                : '已关闭过滤，成人内容将在搜索结果中单独分组显示'
              }
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleToggle}
            disabled={isLoading || !userName}
            className={`
              relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed
              ${isEnabled 
                ? 'bg-blue-600' 
                : 'bg-gray-200 dark:bg-gray-700'
              }
            `}
          >
            <span
              className={`
                inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                ${isEnabled ? 'translate-x-6' : 'translate-x-1'}
              `}
            />
          </button>
          
          {isLoading && (
            <div className="w-5 h-5">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="ml-3">
            <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200">
              安全提示
            </h4>
            <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
              为了确保良好的使用体验和遵守相关法规，建议保持成人内容过滤开启。如需访问相关内容，请确保您已年满18周岁并承担相应法律责任。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdultContentFilter;
