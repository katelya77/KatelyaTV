-- D1 数据库初始化脚本
-- 用于创建 SHTTV 所需的数据表

-- 用户表
CREATE TABLE IF NOT EXISTS users (
   id INTEGER PRIMARY KEY AUTOINCREMENT,
   username TEXT UNIQUE NOT NULL,
   password TEXT NOT NULL,
   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
   updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 播放记录表
CREATE TABLE IF NOT EXISTS play_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  video_url TEXT,
  current_time REAL DEFAULT 0,
  duration REAL DEFAULT 0,
  episode_index INTEGER DEFAULT 0,
  episode_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  "username" TEXT,
  "source_name" TEXT,
  "save_time" INTEGER,
  "key" TEXT,
  "title" TEXT,
  "cover" TEXT,
  "year" TEXT,
  "index_episode" INTEGER,
  "total_episodes" INTEGER,
  "play_time" INTEGER,
  "total_time" INTEGER,
  "search_title" TEXT,
  UNIQUE (username, key)
);

-- 收藏表
CREATE TABLE IF NOT EXISTS favorites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  cover_url TEXT,
  rating REAL,
  year TEXT,
  area TEXT,
  category TEXT,
  actors TEXT,
  director TEXT,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, "username" TEXT, "save_time" INTEGER, "key" TEXT, "source_name" TEXT, "cover" TEXT, "total_episodes" INTEGER, "search_title" TEXT
);

-- 搜索历史表
CREATE TABLE IF NOT EXISTS search_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  keyword TEXT NOT NULL,
  username TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
);

-- 跳过配置表
CREATE TABLE IF NOT EXISTS skip_configs (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 start_time INTEGER DEFAULT 0,
 end_time INTEGER DEFAULT 0,
 created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
 updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
 username TEXT,
 "key" TEXT, "source" TEXT, "video_id" TEXT, "title" TEXT, "segments" TEXT, "updated_time" TEXT,
 UNIQUE (username, key)
);

-- 用户设置表
CREATE TABLE IF NOT EXISTS user_settings (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 filter_adult_content BOOLEAN DEFAULT 1,
 theme TEXT DEFAULT 'auto',
 language TEXT DEFAULT 'zh-CN',
 auto_play BOOLEAN DEFAULT 1,
 video_quality TEXT DEFAULT 'auto',
 created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
 updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, "settings" TEXT, "updated_time" TEXT, "username" TEXT NOT NULL,
 UNIQUE (username)
);

-- 管理员配置表
CREATE TABLE IF NOT EXISTS admin_configs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  config_key TEXT UNIQUE NOT NULL,
  config_value TEXT,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 插入默认管理员配置
INSERT OR IGNORE INTO admin_configs (config_key, config_value, description) VALUES
('site_name', 'SHT TV', '站点名称'),
('site_description', '影视播放平台', '站点描述'),
('enable_register', 'true', '是否允许用户注册'),
('max_users', '100', '最大用户数量'),
('cache_ttl', '3600', '缓存时间（秒）');

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_play_records_username ON play_records(username);
CREATE INDEX IF NOT EXISTS idx_play_records_key ON play_records(key);
CREATE INDEX IF NOT EXISTS idx_favorites_username ON favorites(username);
CREATE INDEX IF NOT EXISTS idx_search_history_username ON search_history(username);
CREATE INDEX IF NOT EXISTS idx_skip_configs_username ON skip_configs(username);
CREATE INDEX IF NOT EXISTS idx_user_settings_username ON user_settings(username);
CREATE INDEX IF NOT EXISTS idx_user_settings_username ON user_settings(username);

-- 创建视图以简化查询
CREATE VIEW IF NOT EXISTS user_stats AS
SELECT 
  u.id,
  u.username,
  COUNT(DISTINCT pr.id) as play_count,
  COUNT(DISTINCT f.id) as favorite_count,
  COUNT(DISTINCT sh.id) as search_count,
  u.created_at
FROM users u
LEFT JOIN play_records pr ON u.id = pr.username
LEFT JOIN favorites f ON u.id = f.username
LEFT JOIN search_history sh ON u.id = sh.username
GROUP BY u.id, u.username, u.created_at;
