-- ========================================
-- KatelyaTV Cloudflare D1 数据库初始化脚本
-- 版本: 2025-09-05 (适配当前代码结构)
-- ========================================

-- 1. 用户表 (必需)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    login_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    role TEXT DEFAULT 'user'
);

-- 2. 用户设置表 (成人内容过滤必需)
CREATE TABLE IF NOT EXISTS user_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    filter_adult_content BOOLEAN DEFAULT 1,
    can_disable_filter BOOLEAN DEFAULT 1,
    managed_by_admin BOOLEAN DEFAULT 0,
    last_filter_change DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
);

-- 3. 播放记录表 (观看历史)
CREATE TABLE IF NOT EXISTS play_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    video_id TEXT NOT NULL,
    video_title TEXT,
    video_url TEXT,
    video_cover TEXT,
    current_time REAL DEFAULT 0,
    duration REAL DEFAULT 0,
    progress REAL DEFAULT 0,
    episode_index INTEGER DEFAULT 0,
    episode_url TEXT,
    last_watched DATETIME DEFAULT CURRENT_TIMESTAMP,
    watch_count INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE,
    UNIQUE(username, video_id)
);

-- 4. 收藏表
CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    video_id TEXT NOT NULL,
    video_title TEXT,
    video_cover TEXT,
    video_url TEXT,
    rating REAL,
    year TEXT,
    area TEXT,
    category TEXT,
    actors TEXT,
    director TEXT,
    description TEXT,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(username, video_id),
    FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
);

-- 5. 搜索历史表
CREATE TABLE IF NOT EXISTS search_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    keyword TEXT NOT NULL,
    search_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
);

-- 6. 跳过配置表 (跳过片头片尾)
CREATE TABLE IF NOT EXISTS skip_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    video_id TEXT NOT NULL,
    skip_start INTEGER DEFAULT 0,
    skip_end INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(username, video_id),
    FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
);

-- ========================================
-- 索引优化
-- ========================================

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_user_settings_username ON user_settings(username);
CREATE INDEX IF NOT EXISTS idx_play_records_username ON play_records(username);
CREATE INDEX IF NOT EXISTS idx_play_records_last_watched ON play_records(last_watched);
CREATE INDEX IF NOT EXISTS idx_favorites_username ON favorites(username);
CREATE INDEX IF NOT EXISTS idx_search_history_username ON search_history(username);
CREATE INDEX IF NOT EXISTS idx_skip_configs_username ON skip_configs(username);

-- ========================================
-- 触发器
-- ========================================

-- 自动更新 user_settings 时间戳
CREATE TRIGGER IF NOT EXISTS update_user_settings_timestamp 
    AFTER UPDATE ON user_settings
    FOR EACH ROW
BEGIN
    UPDATE user_settings SET updated_at = CURRENT_TIMESTAMP WHERE username = NEW.username;
END;

-- 新用户注册时创建默认设置
CREATE TRIGGER IF NOT EXISTS create_default_user_settings
    AFTER INSERT ON users
    FOR EACH ROW
BEGIN
    INSERT OR IGNORE INTO user_settings (username, filter_adult_content, can_disable_filter, managed_by_admin)
    VALUES (NEW.username, 1, 1, 0);
END;

-- 更新播放记录时间戳
CREATE TRIGGER IF NOT EXISTS update_play_records_timestamp 
    AFTER UPDATE ON play_records
    FOR EACH ROW
BEGIN
    UPDATE play_records SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- 更新跳过配置时间戳
CREATE TRIGGER IF NOT EXISTS update_skip_configs_timestamp 
    AFTER UPDATE ON skip_configs
    FOR EACH ROW
BEGIN
    UPDATE skip_configs SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
