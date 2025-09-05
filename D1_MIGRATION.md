# D1 数据库迁移 - 添加成人内容过滤和跳过配置功能

如果您已经有一个运行中的 D1 数据库，需要执行以下 SQL 语句来添加成人内容过滤和跳过配置支持。

## 🗄️ 新增表结构

### user_settings 表（成人内容过滤功能 - 必需）

这个表用于存储用户## 🔧 故障排除

### 1. "获取用户设置失败" 错误

**原因**：缺少 `user_settings` 表
**解决**：执行上述迁移 SQL，确保 user_settings 表已创建

### 2. "表已存在" 错误

**原因**：表已经创建过了
**解决**：这是正常的，`CREATE TABLE IF NOT EXISTS` 语句是安全的

### 3. 外键约束错误

**原因**：users 表不存在或结构不匹配
**解决**：确保先运行完整的 `./scripts/d1-init.sql` 初始化脚本

### 4. 🚨 表结构不兼容问题（重要修复）

**问题描述**：即使表创建成功，仍然显示"获取用户设置失败"，开关无法操作

**原因**：代码期望的表结构与创建的表结构不匹配

**完整解决方案**：

#### 第一步：重建兼容的表结构

在 Cloudflare D1 Console 中执行：

```sql
-- 删除现有表，重新创建完全兼容的结构
DROP TABLE IF EXISTS user_settings;

-- 创建与代码完全匹配的表结构
CREATE TABLE user_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  settings TEXT NOT NULL,
  updated_time INTEGER NOT NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_settings_username ON user_settings(username);
CREATE INDEX IF NOT EXISTS idx_user_settings_updated_time ON user_settings(updated_time DESC);

-- 插入用户设置（JSON格式，替换为您的用户名）
INSERT INTO user_settings (username, settings, updated_time) VALUES (
  'your_username_here',
  '{"filter_adult_content":true,"theme":"auto","language":"zh-CN","auto_play":true,"video_quality":"auto"}',
  strftime('%s', 'now')
);
```

#### 第二步：验证数据插入

```sql
-- 验证设置是否正确插入
SELECT * FROM user_settings WHERE username = 'your_username_here';
```

#### 第三步：确认环境变量

在 Cloudflare Pages → Settings → Environment variables 中确认：

```
NEXT_PUBLIC_STORAGE_TYPE = d1
USERNAME = your_username_here
PASSWORD = your_password_here
```

#### 第四步：确认 D1 绑定

在 Cloudflare Pages → Settings → Functions → D1 database bindings：

- **Variable name**: `DB`
- **D1 database**: 选择您的数据库

#### 第五步：重新部署并清除缓存

1. 在 Cloudflare Pages → Deployments 中点击 "Retry deployment"
2. 清除浏览器缓存（Ctrl+Shift+Delete）
3. 重新登录并测试功能

**表结构说明**：

| 字段名         | 类型    | 说明                                  |
| -------------- | ------- | ------------------------------------- |
| `id`           | INTEGER | 主键，自动递增                        |
| `username`     | TEXT    | 用户名，必须与 users 表中的用户名匹配 |
| `settings`     | TEXT    | 用户设置的 JSON 字符串                |
| `updated_time` | INTEGER | 更新时间戳（Unix 时间戳）             |

**settings JSON 格式**：

````json
{
  "filter_adult_content": true,  // 成人内容过滤开关
  "theme": "auto",              // 主题设置
  "language": "zh-CN",          // 语言设置
  "auto_play": true,            // 自动播放
  "video_quality": "auto"       // 视频质量
}
```：

```sql
-- 创建用户设置表（成人内容过滤功能）
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

-- 为用户设置添加索引以优化查询性能
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_username ON user_settings(username);
````

### skip_configs 表（跳过功能 - 可选）

这个表用于存储用户的跳过片头片尾配置：

```sql
-- 创建跳过配置表
CREATE TABLE IF NOT EXISTS skip_configs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  config_key TEXT NOT NULL,
  start_time INTEGER DEFAULT 0,
  end_time INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (user_id, config_key)
);

-- 为跳过配置添加索引以优化查询性能
CREATE INDEX IF NOT EXISTS idx_skip_configs_user_id ON skip_configs(user_id);
```

## 🚀 执行迁移的方法

### ⚠️ 重要提示

如果您在 Cloudflare Pages 使用成人内容过滤功能时遇到"获取用户设置失败"错误，这是因为缺少 `user_settings` 表。**必须执行此迁移**才能使功能正常工作。

### 方法一：使用 Cloudflare Dashboard（推荐）

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入您的账户，找到 **D1** 服务
3. 选择您的数据库实例
4. 点击 **Console** 标签页
5. 在 SQL 查询界面中粘贴上面的 SQL 代码
6. 点击 **Execute** 执行

### 方法二：使用 Wrangler CLI

如果您有 Wrangler CLI，可以在本地执行：

```bash
# 首先登录 Cloudflare
wrangler auth login

# 创建迁移文件
echo "-- 上面的SQL代码" > user_settings_migration.sql

# 执行数据库迁移
wrangler d1 execute your-database-name --file=user_settings_migration.sql
```

### 方法三：使用项目内置迁移脚本

```bash
# 克隆或更新项目代码
git pull origin main

# 执行完整的D1初始化（包含新表）
wrangler d1 execute your-database-name --file=./scripts/d1-init.sql
```

## 📋 字段说明

### user_settings 表字段

| 字段名                 | 类型     | 默认值   | 说明                   |
| ---------------------- | -------- | -------- | ---------------------- |
| `id`                   | INTEGER  | 自增     | 主键                   |
| `user_id`              | INTEGER  | 无       | 用户 ID，关联 users 表 |
| `username`             | TEXT     | 无       | 用户名                 |
| `filter_adult_content` | BOOLEAN  | 1(true)  | 成人内容过滤开关       |
| `theme`                | TEXT     | 'auto'   | 界面主题设置           |
| `language`             | TEXT     | 'zh-CN'  | 语言设置               |
| `auto_play`            | BOOLEAN  | 1(true)  | 自动播放开关           |
| `video_quality`        | TEXT     | 'auto'   | 视频质量偏好           |
| `created_at`           | DATETIME | 当前时间 | 创建时间               |
| `updated_at`           | DATETIME | 当前时间 | 更新时间               |

### skip_configs 表字段

| 字段名       | 类型     | 默认值   | 说明                            |
| ------------ | -------- | -------- | ------------------------------- |
| `id`         | INTEGER  | 自增     | 主键                            |
| `user_id`    | INTEGER  | 无       | 用户 ID，关联 users 表          |
| `config_key` | TEXT     | 无       | 配置键，格式：`source+video_id` |
| `start_time` | INTEGER  | 0        | 跳过开始时间（秒）              |
| `end_time`   | INTEGER  | 0        | 跳过结束时间（秒）              |
| `created_at` | DATETIME | 当前时间 | 创建时间                        |
| `updated_at` | DATETIME | 当前时间 | 更新时间                        |

## ✅ 迁移验证

执行迁移后，可以通过以下 SQL 验证表是否创建成功：

```sql
-- 检查 user_settings 表是否存在
SELECT name FROM sqlite_master WHERE type='table' AND name='user_settings';

-- 检查 skip_configs 表是否存在
SELECT name FROM sqlite_master WHERE type='table' AND name='skip_configs';

-- 查看 user_settings 表结构
PRAGMA table_info(user_settings);

-- 查看 skip_configs 表结构
PRAGMA table_info(skip_configs);
```

## 🔧 故障排除

### 1. "获取用户设置失败" 错误

**原因**：缺少 `user_settings` 表
**解决**：执行上述迁移 SQL，确保 user_settings 表已创建

### 2. "表已存在" 错误

**原因**：表已经创建过了
**解决**：这是正常的，`CREATE TABLE IF NOT EXISTS` 语句是安全的

### 3. 外键约束错误

**原因**：users 表不存在或结构不匹配
**解决**：确保先运行完整的 `./scripts/d1-init.sql` 初始化脚本

## 📞 需要帮助？

如果在迁移过程中遇到问题：

1. 检查 Cloudflare D1 Dashboard 中的数据库状态
2. 确认环境变量 `NEXT_PUBLIC_STORAGE_TYPE=d1` 已设置
3. 验证 `wrangler.toml` 中的数据库配置
4. 查看项目 Issues 或提交新的问题报告

```sql
-- 检查表是否存在
SELECT name FROM sqlite_master WHERE type='table' AND name='skip_configs';

-- 检查表结构
PRAGMA table_info(skip_configs);

-- 检查索引是否创建
SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='skip_configs';
```

## ⚠️ 重要提示

1. **备份数据**：执行迁移前建议备份数据库
2. **测试环境**：建议先在测试环境执行迁移
3. **版本兼容**：这个迁移向后兼容，不会影响现有功能
4. **只需执行一次**：这个迁移脚本可以安全地重复执行（使用了 `IF NOT EXISTS`）

## 🔄 如果您是新部署

如果您是新部署的 D1 数据库，直接使用更新后的 `D1初始化.md` 中的完整 SQL 即可，无需单独执行迁移。

---

执行完迁移后，跳过功能就可以在您的 D1 部署中正常使用了！🎉
