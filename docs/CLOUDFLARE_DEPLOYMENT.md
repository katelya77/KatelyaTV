# Cloudflare Pages 部署指南

## 部署前准备

### 1. 确保项目配置正确

项目已经配置了适用于 Cloudflare Pages 的设置：

- ✅ `wrangler.toml` - Cloudflare 配置文件
- ✅ API 路由已配置为 `runtime='edge'` 和 `dynamic='force-dynamic'`
- ✅ D1 数据库集成和错误处理
- ✅ Next.js 配置优化
- ✅ Suspense 边界处理

### 2. 创建 D1 数据库

在 Cloudflare Dashboard 中创建 D1 数据库：

```bash
# 登录Cloudflare
npx wrangler login

# 创建D1数据库
npx wrangler d1 create katelyatv-db

# 创建预览环境数据库
npx wrangler d1 create katelyatv-db-preview
```

### 3. 更新 wrangler.toml

将创建的数据库 ID 添加到 `wrangler.toml` 文件中：

```toml
[[d1_databases]]
binding = "DB"
database_name = "katelyatv-db"
database_id = "你的数据库ID"
preview_database_id = "你的预览数据库ID"
```

## 部署步骤

### 方法 1: 通过 Cloudflare Dashboard 部署

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 Pages 选项卡
3. 点击 "Create a project"
4. 连接你的 GitHub 仓库
5. 配置构建设置：
   - **Build command**: `npm run cloudflare:build`
   - **Build output directory**: `out`
   - **Root directory**: `/` (默认)

### 方法 2: 通过 Wrangler CLI 部署

```bash
# 安装Wrangler CLI
npm install -g wrangler

# 登录Cloudflare
npx wrangler login

# 构建项目
npm run cloudflare:build

# 部署到Cloudflare Pages
npx wrangler pages deploy out --project-name katelyatv
```

## 环境变量配置

在 Cloudflare Pages 项目设置中添加以下环境变量：

### 生产环境变量

```
CLOUDFLARE_PAGES=1
STORAGE_TYPE=d1
NEXT_PUBLIC_SITE_NAME=KatelyaTV
NEXT_PUBLIC_DESCRIPTION=Live Streaming Platform
```

### 可选环境变量（如需要）

```
REDIS_URL=your_redis_url
UPSTASH_REDIS_REST_URL=your_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token
ADMIN_PASSWORD=your_admin_password
JWT_SECRET=your_jwt_secret
```

## 故障排除

### 常见问题

1. **D1 数据库连接错误**

   - 确保在 `wrangler.toml` 中正确配置了数据库绑定
   - 验证数据库 ID 是否正确

2. **静态生成错误**

   - 所有动态 API 路由已配置为 `runtime='edge'` 和 `dynamic='force-dynamic'`
   - 使用了 Suspense 边界包装客户端 hooks

3. **构建失败**
   - 检查 `CLOUDFLARE_PAGES=1` 环境变量是否正确设置
   - 确保所有依赖项都已正确安装

### 验证部署

部署完成后，访问以下页面验证功能：

- 主页: `https://your-site.pages.dev`
- 管理面板: `https://your-site.pages.dev/admin`
- IPTV 直播: `https://your-site.pages.dev/live`
- API 健康检查: `https://your-site.pages.dev/api/server-config`

## 性能优化建议

1. **启用 Cloudflare 缓存**

   - 在 Cloudflare Dashboard 中配置适当的缓存规则
   - 对静态资源启用长期缓存

2. **压缩和优化**

   - 项目已配置了图片优化和代码压缩
   - 考虑启用 Cloudflare 的 Auto Minify 功能

3. **监控和分析**
   - 使用 Cloudflare Analytics 监控性能
   - 设置 Uptime 监控确保服务可用性

## 更新部署

当代码有更新时：

1. 推送代码到 GitHub 仓库
2. Cloudflare Pages 会自动触发新的构建和部署
3. 或者手动使用 Wrangler CLI 重新部署

```bash
npm run cloudflare:build
npx wrangler pages deploy out --project-name katelyatv
```
