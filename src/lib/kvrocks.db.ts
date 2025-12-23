/* eslint-disable no-console, @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion */

import { createClient, RedisClientType } from 'redis';

import { AdminConfig } from './admin.types';
import { EpisodeSkipConfig, Favorite, IStorage, PlayRecord } from './types';

// 搜索历史最大条数
const SEARCH_HISTORY_LIMIT = 20;

// 数据类型转换辅助函数
function ensureStringArray(value: any[]): string[] {
  return value.map((item) => String(item));
}

// 添加Kvrocks操作重试包装器
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (err: any) {
      const isLastAttempt = i === maxRetries - 1;
      const isConnectionError =
        err.message?.includes('Connection') ||
        err.message?.includes('ECONNREFUSED') ||
        err.message?.includes('ENOTFOUND') ||
        err.code === 'ECONNRESET' ||
        err.code === 'EPIPE';

      if (isConnectionError && !isLastAttempt) {
        console.log(
          `Kvrocks operation failed, retrying... (${i + 1}/${maxRetries})`
        );
        console.error('Error:', err.message);

        // 等待一段时间后重试
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));

        // 尝试重新连接
        try {
          const client = getKvrocksClient();
          if (!client.isOpen) {
            await client.connect();
          }
        } catch (reconnectErr) {
          console.error('Failed to reconnect to Kvrocks:', reconnectErr);
        }

        continue;
      }

      throw err;
    }
  }

  throw new Error('Max retries exceeded');
}

export class KvrocksStorage implements IStorage {
  private client: RedisClientType;

  constructor() {
    this.client = getKvrocksClient();
  }

  // ---------- 播放记录 ----------
  private prKey(user: string, key: string) {
    return `u:${user}:pr:${key}`; // u:username:pr:source+id
  }

  async getPlayRecord(
    userName: string,
    key: string
  ): Promise<PlayRecord | null> {
    const val = await withRetry(() =>
      this.client.get(this.prKey(userName, key))
    );
    return val ? (JSON.parse(val) as PlayRecord) : null;
  }

  async setPlayRecord(
    userName: string,
    key: string,
    record: PlayRecord
  ): Promise<void> {
    await withRetry(() =>
      this.client.set(this.prKey(userName, key), JSON.stringify(record))
    );
  }

  async getAllPlayRecords(
    userName: string
  ): Promise<Record<string, PlayRecord>> {
    const pattern = `u:${userName}:pr:*`;
    const keys = await withRetry(() => this.client.keys(pattern));
    const result: Record<string, PlayRecord> = {};

    if (keys.length === 0) return result;

    const values = await withRetry(() => this.client.mGet(keys));
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const value = values[i];
      if (value) {
        const recordKey = key.replace(`u:${userName}:pr:`, '');
        result[recordKey] = JSON.parse(value) as PlayRecord;
      }
    }

    return result;
  }

  async deletePlayRecord(userName: string, key: string): Promise<void> {
    await withRetry(() => this.client.del(this.prKey(userName, key)));
  }

  // ---------- 收藏 ----------
  private favKey(user: string, key: string) {
    return `u:${user}:fav:${key}`; // u:username:fav:source+id
  }

  async getFavorite(userName: string, key: string): Promise<Favorite | null> {
    const val = await withRetry(() =>
      this.client.get(this.favKey(userName, key))
    );
    return val ? (JSON.parse(val) as Favorite) : null;
  }

  async setFavorite(
    userName: string,
    key: string,
    favorite: Favorite
  ): Promise<void> {
    await withRetry(() =>
      this.client.set(this.favKey(userName, key), JSON.stringify(favorite))
    );
  }

  async getAllFavorites(userName: string): Promise<Record<string, Favorite>> {
    const pattern = `u:${userName}:fav:*`;
    const keys = await withRetry(() => this.client.keys(pattern));
    const result: Record<string, Favorite> = {};

    if (keys.length === 0) return result;

    const values = await withRetry(() => this.client.mGet(keys));
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const value = values[i];
      if (value) {
        const favKey = key.replace(`u:${userName}:fav:`, '');
        result[favKey] = JSON.parse(value) as Favorite;
      }
    }

    return result;
  }

  async deleteFavorite(userName: string, key: string): Promise<void> {
    await withRetry(() => this.client.del(this.favKey(userName, key)));
  }

  // ---------- 搜索历史 ----------
  private searchHistoryKey(user: string) {
    return `u:${user}:search_history`;
  }

  async getSearchHistory(userName: string): Promise<string[]> {
    const items = await withRetry(() =>
      this.client.lRange(this.searchHistoryKey(userName), 0, -1)
    );
    return ensureStringArray(items);
  }

  async addSearchHistory(userName: string, query: string): Promise<void> {
    const key = this.searchHistoryKey(userName);
    await withRetry(async () => {
      // 先移除可能存在的重复项
      await this.client.lRem(key, 0, query);
      // 添加到开头
      await this.client.lPush(key, query);
      // 保持数量限制
      await this.client.lTrim(key, 0, SEARCH_HISTORY_LIMIT - 1);
    });
  }

  async deleteSearchHistory(userName: string, query?: string): Promise<void> {
    if (query) {
      // 删除特定搜索项
      const key = this.searchHistoryKey(userName);
      await withRetry(() => this.client.lRem(key, 0, query));
    } else {
      // 清空全部搜索历史
      await withRetry(() => this.client.del(this.searchHistoryKey(userName)));
    }
  }

  // ---------- 片头片尾跳过配置 ----------
  private skipConfigKey(userName: string, key: string) {
    return `u:${userName}:skip_config:${key}`;
  }

  async getSkipConfig(
    userName: string,
    key: string
  ): Promise<EpisodeSkipConfig | null> {
    const val = await withRetry(() =>
      this.client.get(this.skipConfigKey(userName, key))
    );
    return val ? (JSON.parse(val) as EpisodeSkipConfig) : null;
  }

  async setSkipConfig(
    userName: string,
    key: string,
    config: EpisodeSkipConfig
  ): Promise<void> {
    await withRetry(() =>
      this.client.set(this.skipConfigKey(userName, key), JSON.stringify(config))
    );
  }

  async deleteSkipConfig(userName: string, key: string): Promise<void> {
    await withRetry(() => this.client.del(this.skipConfigKey(userName, key)));
  }

  async getAllSkipConfigs(
    userName: string
  ): Promise<Record<string, EpisodeSkipConfig>> {
    const pattern = `u:${userName}:skip_config:*`;
    const keys = await withRetry(() => this.client.keys(pattern));
    const result: Record<string, EpisodeSkipConfig> = {};

    if (keys.length === 0) return result;

    const values = await withRetry(() => this.client.mGet(keys));
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const value = values[i];
      if (value) {
        const configKey = key.replace(`u:${userName}:skip_config:`, '');
        result[configKey] = JSON.parse(value) as EpisodeSkipConfig;
      }
    }

    return result;
  }

  // ---------- 用户相关 ----------
  private userKey(userName: string) {
    return `user:${userName}`;
  }

  private userListKey() {
    return 'user_list';
  }

  async getUser(userName: string): Promise<any> {
    const val = await withRetry(() => this.client.get(this.userKey(userName)));
    return val ? JSON.parse(val) : null;
  }

  async setUser(userName: string, userData: any): Promise<void> {
    await withRetry(async () => {
      await this.client.set(this.userKey(userName), JSON.stringify(userData));
      // 同时添加到用户列表
      await this.client.sAdd(this.userListKey(), userName);
    });
  }

  async getAllUsers(): Promise<string[]> {
    const users = await withRetry(() =>
      this.client.sMembers(this.userListKey())
    );
    return ensureStringArray(users);
  }

  async registerUser(userName: string, password: string): Promise<void> {
    const userData = {
      username: userName,
      password: password, // 这里传入的应该是已经hash的密码
      created_at: Date.now(),
    };
    await this.setUser(userName, userData);
  }

  async verifyUser(userName: string, password: string): Promise<boolean> {
    const userData = await this.getUser(userName);
    return userData && userData.password === password;
  }

  async checkUserExist(userName: string): Promise<boolean> {
    const userData = await this.getUser(userName);
    return userData !== null;
  }

  async changePassword(userName: string, newPassword: string): Promise<void> {
    const userData = await this.getUser(userName);
    if (userData) {
      userData.password = newPassword;
      await this.setUser(userName, userData);
    }
  }

  async deleteUser(userName: string): Promise<void> {
    await withRetry(async () => {
      // 删除用户数据
      await this.client.del(this.userKey(userName));
      // 从用户列表中移除
      await this.client.sRem(this.userListKey(), userName);

      // 删除用户的所有相关数据
      const patterns = [
        `u:${userName}:pr:*`, // 播放记录
        `u:${userName}:fav:*`, // 收藏
        `u:${userName}:search_history`, // 搜索历史
        `u:${userName}:skip_config:*`, // 跳过配置
      ];

      for (const pattern of patterns) {
        const keys = await this.client.keys(pattern);
        if (keys.length > 0) {
          await this.client.del(keys);
        }
      }
    });
  }

  // ---------- 管理员配置 ----------
  private adminConfigKey() {
    return 'admin_config';
  }

  async getAdminConfig(): Promise<AdminConfig | null> {
    const val = await withRetry(() => this.client.get(this.adminConfigKey()));
    return val ? (JSON.parse(val) as AdminConfig) : null;
  }

  async setAdminConfig(config: AdminConfig): Promise<void> {
    await withRetry(() =>
      this.client.set(this.adminConfigKey(), JSON.stringify(config))
    );
  }
}

// Kvrocks客户端单例
let kvrocksClient: RedisClientType | null = null;

export function getKvrocksClient(): RedisClientType {
  if (!kvrocksClient) {
    // 从环境变量读取Kvrocks连接信息
    const kvrocksUrl = process.env.KVROCKS_URL || 'redis://localhost:6666';
    const kvrocksPassword = process.env.KVROCKS_PASSWORD;
    const kvrocksDatabase = parseInt(process.env.KVROCKS_DATABASE || '0');

    console.log('🏪 Initializing Kvrocks client...');
    console.log('🔗 Kvrocks URL:', kvrocksUrl.replace(/\/\/.*@/, '//***:***@'));

    kvrocksClient = createClient({
      url: kvrocksUrl,
      password: kvrocksPassword,
      database: kvrocksDatabase,
      socket: {
        connectTimeout: 10000, // 10秒连接超时
        reconnectStrategy: (retries: number) => {
          const delay = Math.min(retries * 50, 2000);
          console.log(
            `🔄 Kvrocks reconnecting in ${delay}ms (attempt ${retries})`
          );
          return delay;
        },
      },
    });

    kvrocksClient.on('error', (err) => {
      console.error('❌ Kvrocks Client Error:', err);
    });

    kvrocksClient.on('connect', () => {
      console.log('✅ Kvrocks Client Connected');
    });

    kvrocksClient.on('reconnecting', () => {
      console.log('🔄 Kvrocks Client Reconnecting...');
    });

    kvrocksClient.on('ready', () => {
      console.log('🚀 Kvrocks Client Ready');
    });

    // 初始连接
    kvrocksClient.connect().catch((err) => {
      console.error('❌ Failed to connect to Kvrocks:', err);
    });
  }

  return kvrocksClient;
}
