# Cloudflare Pages 成人内容过滤配置指南

本文档详细说明如何在 Cloudflare Pages 部署中配置成人内容过滤功能。

## ⚠️ 重要说明

成人内容过滤功能需要**数据库存储支持**，不能使用默认的 `localstorage` 存储类型。在 Cloudflare Pages 环境下，必须配置 D1 数据库。

## 🚀 快速配置步骤

### 1. 创建 D1 数据库

```bash
# 安装并登录 Wrangler CLI
npm install -g wrangler
wrangler auth login

# 创建 D1 数据库
wrangler d1 create katelyatv-db
```

记录输出的数据库 ID，类似：

```
✅ Successfully created DB 'katelyatv-db' in region APAC
Created your database using D1's new storage backend.
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### 2. 初始化数据库表

```bash
# 克隆项目（如果还没有）
git clone https://github.com/your-username/KatelyaTV.git
cd KatelyaTV

# 初始化数据库表（包含 user_settings 表）
wrangler d1 execute katelyatv-db --file=./scripts/d1-init.sql
```

### 3. 配置 wrangler.toml

在项目根目录创建或更新 `wrangler.toml` 文件：

```toml
name = "katelyatv"
compatibility_date = "2023-12-01"
compatibility_flags = ["nodejs_compat"]

[[d1_databases]]
binding = "DB"
database_name = "katelyatv-db"
database_id = "your-database-id-here"  # 替换为步骤1中获得的ID

[build]
command = "pnpm install --frozen-lockfile && pnpm run pages:build"

[[build.environment_variables]]
NEXT_PUBLIC_STORAGE_TYPE = "d1"

[vars]
USERNAME = "admin"
PASSWORD = "your_password_here"
NEXT_PUBLIC_ENABLE_REGISTER = "true"
```

### 4. 部署到 Cloudflare Pages

#### 方法一：通过 Cloudflare Dashboard

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Pages** 服务
3. 点击 **Create a project**
4. 连接 GitHub 仓库并选择 KatelyaTV 项目
5. 配置构建设置：
   - **Build command**: `pnpm install --frozen-lockfile && pnpm run pages:build`
   - **Build output directory**: `.vercel/output/static`
   - **Root directory**: 留空
6. 在 **Environment variables** 中添加：
   ```
   NEXT_PUBLIC_STORAGE_TYPE = d1
   USERNAME = admin
   PASSWORD = your_password_here
   NEXT_PUBLIC_ENABLE_REGISTER = true
   ```
7. 在 **Functions** 标签页中：
   - 启用 **Compatibility flags**: `nodejs_compat`
   - 配置 **D1 database bindings**:
     - Variable name: `DB`
     - D1 database: 选择刚创建的数据库

#### 方法二：通过命令行部署

```bash
# 构建项目
pnpm install --frozen-lockfile
pnpm run pages:build

# 部署到 Pages
wrangler pages deploy .vercel/output/static --project-name katelyatv
```

## 🔍 验证配置

部署完成后，访问你的网站：

1. **登录系统**：使用配置的用户名密码登录
2. **访问设置页面**：点击用户菜单中的「内容过滤」
3. **检查功能**：应该能够看到成人内容过滤开关，而不是"获取用户设置失败"错误

## 🐛 故障排除

### 错误："获取用户设置失败"

**可能原因**：

- 未配置 D1 数据库
- `NEXT_PUBLIC_STORAGE_TYPE` 未设置为 `d1`
- 数据库中缺少 `user_settings` 表

**解决方案**：

1. 检查环境变量配置
2. 验证 D1 数据库绑定
3. 执行数据库迁移：
   ```bash
   wrangler d1 execute katelyatv-db --file=./scripts/d1-init.sql
   ```

### 错误：D1 数据库连接失败

**可能原因**：

- wrangler.toml 中的数据库配置错误
- Cloudflare Pages 中的 D1 绑定未正确配置

**解决方案**：

1. 验证 `wrangler.toml` 中的 database_id 是否正确
2. 在 Cloudflare Pages Dashboard 中检查 Functions → D1 database bindings
3. 确保绑定的变量名为 `DB`

### 🚨 错误：功能正常但开关无法操作（重要修复）

**问题描述**：

- 页面不再显示"获取用户设置失败"错误
- 但成人内容过滤开关无法切换，点击无响应

**根本原因**：
数据库表结构与代码期望的格式不匹配

**完整解决方案**：

#### 第一步：重建兼容表结构

在 Cloudflare D1 Console 中执行以下 SQL：

```sql
-- 删除现有的不兼容表
DROP TABLE IF EXISTS user_settings;

-- 创建与代码完全兼容的表结构
CREATE TABLE user_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  settings TEXT NOT NULL,
  updated_time INTEGER NOT NULL
);

-- 添加必要索引
CREATE INDEX IF NOT EXISTS idx_user_settings_username ON user_settings(username);
CREATE INDEX IF NOT EXISTS idx_user_settings_updated_time ON user_settings(updated_time DESC);
```

#### 第二步：插入用户设置数据

```sql
-- 插入设置数据（请替换 'your_username' 为实际用户名）
INSERT INTO user_settings (username, settings, updated_time) VALUES (
  'your_username',
  '{"filter_adult_content":true,"theme":"auto","language":"zh-CN","auto_play":true,"video_quality":"auto"}',
  strftime('%s', 'now')
);
```

#### 第三步：验证数据正确性

```sql
-- 验证数据插入成功
SELECT * FROM user_settings WHERE username = 'your_username';
```

#### 第四步：重新部署并测试

1. 在 Cloudflare Pages 中触发重新部署
2. 清除浏览器缓存并重新登录
3. 测试成人内容过滤开关功能

**重要说明**：

- `settings` 字段必须是有效的 JSON 字符串
- `filter_adult_content` 为 `true` 表示开启过滤
- `updated_time` 使用 Unix 时间戳格式

### 错误：构建失败

**可能原因**：

- Node.js 兼容性问题
- 依赖安装失败

**解决方案**：

1. 确保启用了 `nodejs_compat` 兼容性标志
2. 检查构建命令是否正确
3. 查看构建日志中的具体错误信息

## 📊 数据库监控

在 Cloudflare Dashboard 中可以监控 D1 数据库的使用情况：

1. 进入 **D1** 服务
2. 选择数据库实例
3. 查看 **Metrics** 标签页
4. 监控查询次数、存储使用量等指标

## 🔒 安全建议

1. **密码安全**：使用强密码，避免使用默认密码
2. **环境变量**：敏感信息通过环境变量配置，不要硬编码
3. **用户注册**：根据需要开启或关闭用户注册功能
4. **访问控制**：考虑使用 Cloudflare Access 进一步控制访问

## 🆕 更新和迁移

当项目更新包含数据库结构变更时：

1. **备份数据**：

   ```bash
   wrangler d1 export katelyatv-db --output backup.sql
   ```

2. **执行迁移**：

   ```bash
   wrangler d1 execute katelyatv-db --file=D1_MIGRATION.md的SQL脚本
   ```

3. **验证功能**：确保所有功能正常工作

## 📚 相关文档

- [D1 数据库迁移文档](./D1_MIGRATION.md)
- [Cloudflare Pages 官方文档](https://developers.cloudflare.com/pages/)
- [D1 数据库文档](https://developers.cloudflare.com/d1/)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)

## 💬 需要帮助？

如果在配置过程中遇到问题：

1. 检查本文档的故障排除部分
2. 查看项目的 GitHub Issues
3. 提交新的 Issue 并提供详细的错误信息和配置详情
