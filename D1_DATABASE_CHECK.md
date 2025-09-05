# D1 数据库检查与修复指南

## 🔍 问题诊断

根据你遇到的问题，可能的原因包括：

1. **D1 数据库缺少新的表结构**（最可能）
2. **admin_config 表名不兼容问题**
3. **数据库权限或连接问题**

## 📝 检查清单

### 1. 检查 D1 数据库是否包含所有必需的表

在 Cloudflare Dashboard → D1 → 你的数据库 → Console 中运行：

```sql
-- 检查所有表是否存在
SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;
```

**应该包含的表：**
- `admin_configs` (新表名，推荐)
- `admin_config` (旧表名，兼容性)
- `favorites`
- `play_records`
- `search_history`
- `skip_configs`
- `user_settings`
- `users`

### 2. 检查 admin_configs 表结构

```sql
-- 检查新的 admin_configs 表
PRAGMA table_info(admin_configs);

-- 如果不存在，检查旧表
PRAGMA table_info(admin_config);
```

### 3. 检查管理员配置数据

```sql
-- 检查新表中的数据
SELECT * FROM admin_configs LIMIT 5;

-- 如果新表为空，检查旧表
SELECT * FROM admin_config LIMIT 5;
```

## 🔧 修复步骤

### 步骤 1：创建缺失的表（如果需要）

如果检查发现缺少表，在 D1 Console 中运行：

```sql
-- 创建新的 admin_configs 表（推荐的表名）
CREATE TABLE IF NOT EXISTS admin_configs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  config_key TEXT UNIQUE NOT NULL,
  config_value TEXT,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建用户设置表（如果不存在）
CREATE TABLE IF NOT EXISTS user_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  username TEXT NOT NULL,
  filter_adult_content BOOLEAN DEFAULT 1,
  theme TEXT DEFAULT 'auto',
  language TEXT DEFAULT 'zh-CN',
  auto_play BOOLEAN DEFAULT 1,
  video_quality TEXT DEFAULT 'auto',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (user_id, username)
);
```

### 步骤 2：迁移旧数据（如果存在旧表）

```sql
-- 如果存在旧的 admin_config 表，迁移数据
INSERT OR IGNORE INTO admin_configs (config_key, config_value, description)
SELECT 
  'main_config' as config_key,
  config as config_value,
  '从旧表迁移的管理员配置' as description
FROM admin_config 
WHERE id = 1;
```

### 步骤 3：插入默认管理员配置

```sql
-- 插入默认配置
INSERT OR IGNORE INTO admin_configs (config_key, config_value, description) VALUES
('site_name', 'KatelyaTV', '站点名称'),
('site_description', '高性能影视播放平台', '站点描述'),
('enable_register', 'true', '是否允许用户注册'),
('max_users', '100', '最大用户数量'),
('cache_ttl', '3600', '缓存时间（秒）');
```

### 步骤 4：创建索引（性能优化）

```sql
-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_username ON user_settings(username);
CREATE INDEX IF NOT EXISTS idx_admin_configs_key ON admin_configs(config_key);
```

## 🚨 常见问题及解决方案

### 问题 1："获取管理员配置失败"

**原因**：缺少 `admin_configs` 表或表为空

**解决方案**：
1. 执行上述步骤 1 和步骤 3
2. 验证数据是否插入成功：
   ```sql
   SELECT COUNT(*) FROM admin_configs;
   SELECT * FROM admin_configs WHERE config_key = 'site_name';
   ```

### 问题 2："both admin_configs and admin_config tables failed"

**原因**：两个表都不存在或都无法访问

**解决方案**：
1. 确认 D1 数据库绑定正确配置在 wrangler.toml 中
2. 检查环境变量是否正确设置
3. 重新创建 admin_configs 表

### 问题 3：构建时数据库错误

**原因**：构建时尝试访问数据库

**解决方案**：已在代码中添加了构建时保护，不需要额外操作

## 🔍 验证修复

### 1. 在 D1 Console 中验证

```sql
-- 验证表存在
SELECT name FROM sqlite_master WHERE type='table' AND name IN ('admin_configs', 'user_settings');

-- 验证数据
SELECT config_key, config_value FROM admin_configs;

-- 验证表结构
PRAGMA table_info(admin_configs);
```

### 2. 在网站中验证

1. 访问 `/admin` 页面
2. 检查是否能正常加载，不再显示"获取配置失败"
3. 尝试修改配置并保存

### 3. API 端点验证

访问测试端点：`/api/test/admin-config`

应该返回：
```json
{
  "success": true,
  "message": "Admin config test completed successfully",
  "newTable": true,
  "config": {...}
}
```

## 📋 完整修复脚本

如果你想一次性执行所有修复，可以在 D1 Console 中运行以下完整脚本：

```sql
-- 完整的 D1 数据库修复脚本
BEGIN TRANSACTION;

-- 创建新表
CREATE TABLE IF NOT EXISTS admin_configs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  config_key TEXT UNIQUE NOT NULL,
  config_value TEXT,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 插入默认配置
INSERT OR IGNORE INTO admin_configs (config_key, config_value, description) VALUES
('site_name', 'KatelyaTV', '站点名称'),
('site_description', '高性能影视播放平台', '站点描述'),
('enable_register', 'true', '是否允许用户注册'),
('max_users', '100', '最大用户数量'),
('cache_ttl', '3600', '缓存时间（秒）');

-- 如果存在旧表，迁移数据
INSERT OR IGNORE INTO admin_configs (config_key, config_value, description)
SELECT 
  'main_config' as config_key,
  config as config_value,
  '从旧表迁移的管理员配置' as description
FROM admin_config 
WHERE id = 1;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_admin_configs_key ON admin_configs(config_key);

COMMIT;
```

运行此脚本后，你的 `/admin` 页面应该能正常工作了！
