-- D1 数据库迁移脚本：修复 admin_config 表名问题
-- 将旧的 admin_config 表数据迁移到新的 admin_configs 表结构

-- 首先确保新的 admin_configs 表存在
CREATE TABLE IF NOT EXISTS admin_configs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  config_key TEXT UNIQUE NOT NULL,
  config_value TEXT,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 检查是否存在旧的 admin_config 表
-- 如果存在，迁移数据到新表
INSERT OR IGNORE INTO admin_configs (config_key, config_value, description)
SELECT 
  'main_config' as config_key,
  config as config_value,
  '从旧表迁移的主要管理员配置' as description
FROM admin_config 
WHERE id = 1;

-- 插入默认管理员配置（如果不存在）
INSERT OR IGNORE INTO admin_configs (config_key, config_value, description) VALUES
('site_name', 'KatelyaTV', '站点名称'),
('site_description', '高性能影视播放平台', '站点描述'),
('enable_register', 'true', '是否允许用户注册'),
('max_users', '100', '最大用户数量'),
('cache_ttl', '3600', '缓存时间（秒）');

-- 可选：删除旧表（请谨慎使用，建议先备份数据）
-- DROP TABLE IF EXISTS admin_config;
