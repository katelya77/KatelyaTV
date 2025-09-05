-- D1 数据库迁移脚本：改进用户设置表，支持更好的成人内容过滤管理

-- 添加用户角色列
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user';

-- 更新站长用户的角色（如果存在的话）
-- 这里需要根据实际的USERNAME环境变量值来更新
UPDATE users SET role = 'owner' WHERE username = 'admin'; -- 替换为实际的站长用户名

-- 改进用户设置表结构，添加更多字段
ALTER TABLE user_settings ADD COLUMN can_disable_filter BOOLEAN DEFAULT 1;
ALTER TABLE user_settings ADD COLUMN managed_by_admin BOOLEAN DEFAULT 0;
ALTER TABLE user_settings ADD COLUMN last_filter_change DATETIME DEFAULT CURRENT_TIMESTAMP;

-- 为站长用户设置默认权限
UPDATE user_settings 
SET 
  filter_adult_content = 0,  -- 站长默认关闭过滤
  can_disable_filter = 1,    -- 允许切换
  managed_by_admin = 0       -- 不受管理员管理
WHERE username = 'admin'; -- 替换为实际的站长用户名

-- 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_user_settings_filter ON user_settings(filter_adult_content);
CREATE INDEX IF NOT EXISTS idx_user_settings_can_disable ON user_settings(can_disable_filter);

-- 插入一些默认的成人内容过滤规则到管理员配置中
INSERT OR IGNORE INTO admin_configs (config_key, config_value, description) VALUES
('adult_filter_keywords', '成人,色情,三级,激情,情色,性感,诱惑,限制级,R级,18+,禁片,伦理,写真,adult,porn,sex,erotic,xxx,色,黄', '成人内容关键词过滤列表'),
('adult_filter_enabled_by_default', 'true', '新用户是否默认开启成人内容过滤'),
('allow_users_disable_filter', 'true', '是否允许用户自己关闭过滤'),
('admin_can_force_filter', 'true', '管理员是否可以强制开启用户的过滤功能');
