-- 直播源配置表
CREATE TABLE IF NOT EXISTS live_configs (
  key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  ua TEXT,
  epg TEXT,
  from_source TEXT NOT NULL DEFAULT 'custom',
  channel_number INTEGER DEFAULT 0,
  disabled INTEGER DEFAULT 0,
  order_index INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 直播频道缓存表
CREATE TABLE IF NOT EXISTS live_channel_cache (
  source_key TEXT PRIMARY KEY,
  channels TEXT NOT NULL, -- JSON格式存储频道列表
  update_time INTEGER NOT NULL,
  expire_time INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 为性能优化创建索引
CREATE INDEX IF NOT EXISTS idx_live_configs_order ON live_configs(order_index);
CREATE INDEX IF NOT EXISTS idx_live_configs_from_source ON live_configs(from_source);
CREATE INDEX IF NOT EXISTS idx_live_cache_expire ON live_channel_cache(expire_time);
