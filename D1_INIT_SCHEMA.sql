-- D1 数据库初始化 SQL 脚本
-- 用于 KatelyaTV 项目的用户管理和成人内容过滤系统

-- 用户表
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    login_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    role TEXT DEFAULT 'user' -- 'owner', 'admin', 'user'
);

-- 用户设置表 (用于成人内容过滤等设置)
CREATE TABLE user_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    filter_adult_content BOOLEAN DEFAULT 1, -- 是否过滤成人内容
    can_disable_filter BOOLEAN DEFAULT 1,   -- 是否可以自己关闭过滤
    managed_by_admin BOOLEAN DEFAULT 0,     -- 是否由管理员管理
    last_filter_change DATETIME,            -- 最后一次修改过滤设置时间
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
);

-- 会话表 (可选，用于会话管理)
CREATE TABLE user_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    session_token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip_address TEXT,
    user_agent TEXT,
    FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
);

-- 用户观看历史表 (可选，用于记录观看记录)
CREATE TABLE watch_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    video_id TEXT NOT NULL,
    video_title TEXT,
    video_url TEXT,
    watch_progress REAL DEFAULT 0, -- 观看进度 (0-1)
    last_watched DATETIME DEFAULT CURRENT_TIMESTAMP,
    watch_count INTEGER DEFAULT 1,
    FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
);

-- 用户收藏表 (可选，用于收藏功能)
CREATE TABLE user_favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    video_id TEXT NOT NULL,
    video_title TEXT,
    video_cover TEXT,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(username, video_id),
    FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
);

-- 管理日志表 (用于记录管理员操作)
CREATE TABLE admin_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_username TEXT NOT NULL,
    action TEXT NOT NULL,
    target_username TEXT,
    details TEXT,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_username) REFERENCES users(username)
);

-- 创建索引以提高查询性能
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_user_settings_username ON user_settings(username);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX idx_watch_history_username ON watch_history(username);
CREATE INDEX idx_watch_history_video_id ON watch_history(video_id);
CREATE INDEX idx_watch_history_last_watched ON watch_history(last_watched);
CREATE INDEX idx_user_favorites_username ON user_favorites(username);
CREATE INDEX idx_admin_logs_admin_username ON admin_logs(admin_username);
CREATE INDEX idx_admin_logs_created_at ON admin_logs(created_at);

-- 创建触发器以自动更新 user_settings 的 updated_at
CREATE TRIGGER update_user_settings_timestamp 
    AFTER UPDATE ON user_settings
    FOR EACH ROW
BEGIN
    UPDATE user_settings SET updated_at = CURRENT_TIMESTAMP WHERE username = NEW.username;
END;

-- 创建触发器以在用户注册时自动创建默认设置
CREATE TRIGGER create_default_user_settings
    AFTER INSERT ON users
    FOR EACH ROW
BEGIN
    INSERT INTO user_settings (username, filter_adult_content, can_disable_filter, managed_by_admin)
    VALUES (NEW.username, 1, 1, 0);
END;

-- 清理过期会话的触发器 (可选)
CREATE TRIGGER cleanup_expired_sessions
    AFTER INSERT ON user_sessions
    FOR EACH ROW
BEGIN
    DELETE FROM user_sessions WHERE expires_at < datetime('now');
END;
