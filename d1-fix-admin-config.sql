-- 🔧 KatelyaTV D1 数据库修复脚本
-- 解决 admin_config 表名不兼容问题
-- 运行日期: 2025年9月5日

BEGIN TRANSACTION;

-- 1. 创建新的 admin_configs 表
CREATE TABLE IF NOT EXISTS admin_configs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  config_key TEXT UNIQUE NOT NULL,
  config_value TEXT,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. 从旧表迁移现有数据（如果存在）
INSERT OR IGNORE INTO admin_configs (config_key, config_value, description)
SELECT 
  'main_config' as config_key,
  config as config_value,
  '从旧 admin_config 表迁移的管理员配置' as description
FROM admin_config 
WHERE id = 1;

-- 3. 插入默认管理员配置
INSERT OR IGNORE INTO admin_configs (config_key, config_value, description) VALUES
('site_name', 'KatelyaTV', '站点名称'),
('site_description', '高性能影视播放平台', '站点描述'),
('enable_register', 'true', '是否允许用户注册'),
('max_users', '100', '最大用户数量'),
('cache_ttl', '3600', '缓存时间（秒）');

-- 4. 创建性能优化索引
CREATE INDEX IF NOT EXISTS idx_admin_configs_key ON admin_configs(config_key);

-- 5. 验证数据迁移
SELECT 'Migration completed. Records in admin_configs:' as status, COUNT(*) as count FROM admin_configs;

COMMIT;

-- 6. 最终验证查询
SELECT 'Final verification - admin_configs data:' as info;
SELECT config_key, config_value, description FROM admin_configs ORDER BY config_key;
