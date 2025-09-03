# Cloudflare Pages 更新检查清单

## 🔄 你需要更新的 Cloudflare Pages 配置

### 1. D1 数据库配置 (必须手动创建)

#### 创建 D1 数据库

```bash
# 安装Wrangler CLI (如果还没安装)
npm install -g wrangler

# 登录Cloudflare账户
npx wrangler login

# 创建生产环境数据库
npx wrangler d1 create katelyatv-production

# 创建预览环境数据库
npx wrangler d1 create katelyatv-preview
```

#### 更新 wrangler.toml 中的数据库 ID

创建数据库后，你会得到类似这样的输出：

```
[[d1_databases]]
binding = "DB"
database_name = "katelyatv-production"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**请复制这些 ID，然后更新 `wrangler.toml` 文件:**

```toml
# 在 [env.production] 部分
[[env.production.d1_databases]]
binding = "DB"
database_name = "katelyatv-production"
database_id = "你的生产环境数据库ID"

# 在 [env.preview] 部分
[[env.preview.d1_databases]]
binding = "DB"
database_name = "katelyatv-preview"
database_id = "你的预览环境数据库ID"
```

### 2. Cloudflare Pages 项目设置更新

#### 构建配置

- **构建命令**: `npm run cloudflare:build`
- **构建输出目录**: `out`
- **根目录**: `/` (保持默认)

#### 环境变量设置

在 Cloudflare Pages 项目设置 → Environment variables 中添加:

**生产环境变量:**

```
CLOUDFLARE_PAGES=1
STORAGE_TYPE=d1
NEXT_PUBLIC_SITE_NAME=KatelyaTV
NEXT_PUBLIC_DESCRIPTION=Live Streaming Platform
```

**可选环境变量 (如需要):**

```
ADMIN_PASSWORD=your_secure_password
JWT_SECRET=your_jwt_secret_key
NEXT_PUBLIC_VERSION=0.5.0-katelya
```

### 3. 初始化 D1 数据库表结构

**创建数据库表** (生产和预览环境都需要执行):

```bash
# 为生产环境创建表
npx wrangler d1 execute katelyatv-production --command="
CREATE TABLE IF NOT EXISTS live_sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT DEFAULT 'm3u',
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS live_channels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id INTEGER,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  logo TEXT,
  group_title TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (source_id) REFERENCES live_sources (id)
);

CREATE TABLE IF NOT EXISTS play_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_id TEXT NOT NULL,
  content_type TEXT NOT NULL,
  title TEXT,
  progress REAL DEFAULT 0,
  duration REAL DEFAULT 0,
  user_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_favorites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  content_id TEXT NOT NULL,
  content_type TEXT NOT NULL,
  title TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS search_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  query TEXT NOT NULL,
  results_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
"

# 为预览环境创建表 (同样的命令，只是数据库名不同)
npx wrangler d1 execute katelyatv-preview --command="[同样的CREATE TABLE命令]"
```

## 🐳 Docker 部署状态检查

**检测结果**: ❌ Docker 未安装在当前系统

### 安装 Docker (可选)

如果你想使用 Docker 部署，需要先安装 Docker Desktop:

1. 下载 [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/)
2. 安装并重启系统
3. 启动 Docker Desktop

### Docker 部署测试

安装 Docker 后，可以运行以下命令测试:

```bash
# 构建Docker镜像
docker build -t katelyatv .

# 运行容器
docker run -p 3000:3000 -e STORAGE_TYPE=localstorage katelyatv
```

## ✅ 其他平台部署状态

### Vercel 部署 - ✅ 完全就绪

- 配置文件: `vercel.json` ✅
- 构建命令: `npm run build` ✅
- 环境变量: 支持所有存储后端 ✅

### 传统 VPS 部署 - ✅ 完全就绪

- Node.js 环境: 支持 ✅
- PM2 配置: 可用 ✅
- 存储后端: 全部支持 ✅

## 🚀 推荐的部署顺序

1. **立即可用**: Vercel + LocalStorage

   - 无需额外配置
   - 免费额度足够小型应用

2. **功能完整**: Cloudflare Pages + D1

   - 需要按上述步骤配置 D1 数据库
   - 全球 CDN，性能优秀

3. **企业级**: Docker + Redis (需要先安装 Docker)
   - 功能最完整
   - 适合自建服务器

## 📝 下一步行动

### 对于 Cloudflare Pages:

1. ✅ 已更新 `wrangler.toml` 构建输出目录
2. 🔄 **你需要**: 创建 D1 数据库并更新数据库 ID
3. 🔄 **你需要**: 在 Cloudflare Pages 中更新构建配置
4. 🔄 **你需要**: 设置环境变量
5. 🔄 **你需要**: 初始化数据库表结构

### 对于其他平台:

- Vercel: ✅ 随时可以部署
- VPS: ✅ 随时可以部署
- Docker: ❌ 需要先安装 Docker (可选)
