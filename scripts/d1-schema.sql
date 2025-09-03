-- KatelyaTV D1 Database Schema
-- 这个文件包含了所有必需的数据库表结构

-- 直播源表
CREATE TABLE IF NOT EXISTS live_sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT DEFAULT 'm3u',
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 直播频道表
CREATE TABLE IF NOT EXISTS live_channels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id INTEGER,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  logo TEXT,
  group_title TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (source_id) REFERENCES live_sources (id)
);

-- 播放记录表
CREATE TABLE IF NOT EXISTS play_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_id TEXT NOT NULL,
  content_type TEXT NOT NULL,
  title TEXT,
  progress REAL DEFAULT 0,
  duration REAL DEFAULT 0,
  user_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 用户收藏表
CREATE TABLE IF NOT EXISTS user_favorites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  content_id TEXT NOT NULL,
  content_type TEXT NOT NULL,
  title TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 搜索历史表
CREATE TABLE IF NOT EXISTS search_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  query TEXT NOT NULL,
  results_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_live_channels_source_id ON live_channels(source_id);
CREATE INDEX IF NOT EXISTS idx_play_records_user_id ON play_records(user_id);
CREATE INDEX IF NOT EXISTS idx_play_records_content ON play_records(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id);
