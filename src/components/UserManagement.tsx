/* eslint-disable no-console, @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';

// 临时内联认证函数，避免导入问题
function getAuthInfoFromBrowserCookie(): {
  password?: string;
  username?: string;
  signature?: string;
  timestamp?: number;
} | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const cookies = document.cookie.split(';');
  const authCookie = cookies.find(cookie => cookie.trim().startsWith('auth='));
  
  if (!authCookie) {
    return null;
  }

  try {
    const cookieValue = authCookie.split('=')[1];
    const decoded = decodeURIComponent(cookieValue);
    const authData = JSON.parse(decoded);
    return authData;
  } catch (error) {
    console.error('Failed to parse auth cookie:', error);
    return null;
  }
}

interface UserInfo {
  username: string;
  role: string;
  created_at: string;
  filter_adult_content: boolean;
  can_disable_filter: boolean;
  managed_by_admin: boolean;
  last_filter_change?: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    // 获取当前用户信息
    const authInfo = getAuthInfoFromBrowserCookie();
    if (authInfo?.username) {
      setCurrentUser(authInfo.username);
      loadUsers();
    } else {
      setError('未登录或权限不足');
      setLoading(false);
    }
  }, []);

  const loadUsers = async () => {
    try {
      const authInfo = getAuthInfoFromBrowserCookie();
      if (!authInfo?.username) {
        throw new Error('未获取到用户认证信息');
      }

      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${encodeURIComponent(authInfo.username)}`,
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '获取用户列表失败');
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
      console.error('加载用户列表失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateUserSettings = async (username: string, action: string, settings?: any) => {
    try {
      const authInfo = getAuthInfoFromBrowserCookie();
      if (!authInfo?.username) {
        throw new Error('未获取到用户认证信息');
      }

      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${encodeURIComponent(authInfo.username)}`
        },
        body: JSON.stringify({
          action,
          username,
          settings
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '操作失败');
      }

      const data = await response.json();
      alert(data.message || '操作成功');
      
      // 重新加载用户列表
      await loadUsers();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '未知错误';
      alert(`操作失败: ${errorMsg}`);
      console.error('用户管理操作失败:', err);
    }
  };

  const handleForceFilter = (username: string) => {
    if (confirm(`确定要强制开启用户 ${username} 的成人内容过滤功能吗？`)) {
      updateUserSettings(username, 'force_filter');
    }
  };

  const handleAllowDisable = (username: string) => {
    if (confirm(`确定要允许用户 ${username} 自己管理过滤设置吗？`)) {
      updateUserSettings(username, 'allow_disable');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
        <div className="text-red-600 dark:text-red-400">{error}</div>
        <button 
          onClick={loadUsers}
          className="mt-2 text-sm text-red-600 dark:text-red-400 underline hover:no-underline"
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
          用户管理
        </h2>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          总计 {users.length} 个用户
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  用户名
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  角色
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  成人内容过滤
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  管理状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((user) => (
                <tr key={user.username} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {user.username}
                      </div>
                      {user.username === currentUser && (
                        <span className="ml-2 px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full">
                          当前用户
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.role === 'owner'
                        ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                    }`}>
                      {user.role === 'owner' ? '站长' : '用户'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.filter_adult_content
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                          : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                      }`}>
                        {user.filter_adult_content ? '已开启' : '已关闭'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {user.managed_by_admin ? (
                      <span className="text-orange-600 dark:text-orange-400">管理员控制</span>
                    ) : user.can_disable_filter ? (
                      <span className="text-green-600 dark:text-green-400">用户自主</span>
                    ) : (
                      <span className="text-gray-600 dark:text-gray-400">受限制</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {user.role !== 'owner' && user.username !== currentUser && (
                      <div className="flex space-x-2">
                        {!user.filter_adult_content || !user.managed_by_admin ? (
                          <button
                            onClick={() => handleForceFilter(user.username)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            强制过滤
                          </button>
                        ) : null}
                        {user.managed_by_admin || !user.can_disable_filter ? (
                          <button
                            onClick={() => handleAllowDisable(user.username)}
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                          >
                            允许自主
                          </button>
                        ) : null}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            暂无用户数据
          </div>
        )}
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
        <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
          说明
        </h3>
        <ul className="text-sm text-blue-600 dark:text-blue-300 space-y-1">
          <li>• <strong>强制过滤</strong>：开启用户的成人内容过滤，用户无法自己关闭</li>
          <li>• <strong>允许自主</strong>：允许用户自己管理成人内容过滤设置</li>
          <li>• 站长账户默认具有所有权限，无法被其他用户管理</li>
          <li>• 管理员控制的用户无法在用户设置中关闭成人内容过滤</li>
        </ul>
      </div>
    </div>
  );
}
