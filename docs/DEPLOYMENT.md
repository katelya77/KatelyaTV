# 各平台部署配置示例

## 🚀 一键部署模板

### 1. Vercel 部署

**环境变量配置：**

```bash
STORAGE_TYPE=localstorage
# 或者使用 Upstash Redis
# STORAGE_TYPE=upstash
# UPSTASH_REDIS_REST_URL=your_upstash_url
# UPSTASH_REDIS_REST_TOKEN=your_upstash_token
```

**部署步骤：**

```bash
# 1. 推送代码到GitHub
git push origin main

# 2. 连接Vercel
# 访问 https://vercel.com/new
# 导入你的GitHub仓库

# 3. 配置环境变量
# 在Vercel项目设置中添加上述环境变量

# 4. 部署
# Vercel会自动构建和部署
```

### 2. Cloudflare Pages 部署

**wrangler.toml 配置：**

```toml
name = "katelyatv"
compatibility_date = "2024-09-01"

[env.production]
vars = { STORAGE_TYPE = "d1" }

[[env.production.d1_databases]]
binding = "DB"
database_name = "katelyatv-production"
database_id = "your-d1-database-id"
```

**部署步骤：**

```bash
# 1. 安装Wrangler CLI
npm install -g wrangler

# 2. 登录Cloudflare
wrangler login

# 3. 创建D1数据库
wrangler d1 create katelyatv-production

# 4. 执行数据库迁移
wrangler d1 execute katelyatv-production --file=migrations/003_live_sources.sql

# 5. 构建项目
npm run pages:build

# 6. 部署到Pages
wrangler pages publish
```

### 3. Docker 部署

**docker-compose.yml：**

```yaml
version: '3.8'

services:
  katelyatv:
    build: .
    ports:
      - '3000:3000'
    environment:
      - STORAGE_TYPE=redis
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  redis_data:
```

**部署步骤：**

```bash
# 1. 构建和启动
docker-compose up -d

# 2. 查看日志
docker-compose logs -f katelyatv

# 3. 访问应用
# http://localhost:3000
```

### 4. VPS 部署（使用 PM2）

**ecosystem.config.js：**

```javascript
module.exports = {
  apps: [
    {
      name: 'katelyatv',
      script: 'npm',
      args: 'start',
      cwd: '/path/to/katelyatv',
      env: {
        NODE_ENV: 'production',
        STORAGE_TYPE: 'redis',
        REDIS_URL: 'redis://localhost:6379',
      },
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
    },
  ],
};
```

**部署步骤：**

```bash
# 1. 安装依赖
npm install
npm install -g pm2

# 2. 构建项目
npm run build

# 3. 启动Redis (如果使用Redis存储)
sudo systemctl start redis

# 4. 启动应用
pm2 start ecosystem.config.js

# 5. 设置开机自启
pm2 startup
pm2 save
```

## 🔧 存储后端配置

### LocalStorage

```bash
# 环境变量
STORAGE_TYPE=localstorage

# 特点：
# - 无需额外配置
# - 数据存储在浏览器中
# - 适合个人使用或演示
```

### Redis

```bash
# 环境变量
STORAGE_TYPE=redis
REDIS_URL=redis://localhost:6379
# 或
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password

# Docker启动Redis
docker run -d --name redis -p 6379:6379 redis:7-alpine
```

### Kvrocks

```bash
# 环境变量
STORAGE_TYPE=kvrocks
KVROCKS_URL=redis://localhost:6666

# Docker启动Kvrocks
docker run -d --name kvrocks -p 6666:6666 apache/kvrocks
```

### Cloudflare D1

```bash
# 环境变量
STORAGE_TYPE=d1

# 需要wrangler.toml配置
# 数据库会自动连接
```

### Upstash Redis

```bash
# 环境变量
STORAGE_TYPE=upstash
UPSTASH_REDIS_REST_URL=https://your-region.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token

# 在Upstash控制台获取连接信息
```

## 🌍 CDN 和性能优化

### Cloudflare CDN 配置

```javascript
// next.config.js 添加
module.exports = {
  images: {
    domains: ['your-cdn-domain.com'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};
```

### 图片优化配置

```bash
# 环境变量
NEXT_PUBLIC_CDN_URL=https://your-cdn.com
IMAGE_PROXY_URL=https://your-image-proxy.com
```

## 🔐 安全配置

### 环境变量安全

```bash
# 生产环境安全配置
NODE_ENV=production
ADMIN_PASSWORD=your_secure_password
JWT_SECRET=your_jwt_secret
API_RATE_LIMIT=100
```

### HTTPS 配置

```nginx
# Nginx配置示例
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 📊 监控和日志

### 应用监控

```javascript
// 添加到next.config.js
module.exports = {
  experimental: {
    instrumentationHook: true,
  },
};
```

### 错误监控

```bash
# 环境变量
SENTRY_DSN=your_sentry_dsn
LOG_LEVEL=info
```

## 🔄 CI/CD 配置

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm run test
      # 添加你的部署步骤
```

## 💾 备份策略

### Redis 备份

```bash
# 自动备份脚本
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
redis-cli --rdb /backup/dump_$DATE.rdb
# 保留最近30天的备份
find /backup -name "dump_*.rdb" -mtime +30 -delete
```

### D1 备份

```bash
# Cloudflare D1 导出
wrangler d1 export your-database --output backup.sql
```

## 🚨 故障恢复

### 快速恢复检查清单

1. ✅ 检查服务状态
2. ✅ 验证环境变量
3. ✅ 检查存储后端连接
4. ✅ 查看应用日志
5. ✅ 验证网络连接
6. ✅ 检查资源使用情况

### 常见问题解决

```bash
# 应用无法启动
pm2 logs katelyatv

# 存储连接问题
redis-cli ping

# 端口占用检查
netstat -tlnp | grep :3000
```

---

> 💡 **提示**: 选择适合你需求的部署方案，从简单的 Vercel 开始，根据需要逐步升级到更复杂的解决方案。
