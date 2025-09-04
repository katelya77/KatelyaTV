<div align="center">
  <img src="public/logo.png" alt="KatelyaTV Logo" width="128" />

  <h1>KatelyaTV</h1>
  <p><strong>跨平台 · 聚合搜索 · 即开即用 · 自托管影视聚合播放器</strong></p>
  <p>基于 <code>Next.js 14</code> · <code>TypeScript</code> · <code>Tailwind CSS</code> · 多源聚合 / 播放记录 / 收藏同步 / 跳过片头片尾 / PWA</p>
  
  <p>
    <a href="#-快速开始">🚀 快速开始</a> ·
    <a href="#-功能特性">✨ 功能特性</a> ·
    <a href="#-部署方案">📋 部署方案</a> ·
    <a href="#-配置说明">⚙️ 配置说明</a>
  </p>
</div>

---

## 📰 项目声明

本项目自「MoonTV」演进而来，为其二创/继承版本，持续维护与改进功能与体验。保留并致谢原作者与社区贡献者。

> **🔔 重要变更**：应用户社区建议，为确保项目长期稳定运行和合规性，内置视频源已移除。现需要用户自行配置资源站以使用完整功能。我们提供了经过测试的推荐配置文件，让您快速上手使用。

---

## ✨ 功能特性

### 🎬 核心功能

- **🔍 聚合搜索**：整合多个影视资源站，一键搜索全网内容
- **📺 高清播放**：基于 ArtPlayer 的强大播放器，支持多种格式
- **⏭️ 智能跳过**：自动检测并跳过片头片尾，手动设置跳过时间段
- **🎯 断点续播**：自动记录播放进度，跨设备同步观看位置
- **📱 响应式设计**：完美适配手机、平板、电脑各种屏幕

### 💾 数据管理

- **⭐ 收藏功能**：收藏喜欢的影视作品，支持跨设备同步
- **📖 播放历史**：自动记录观看历史，快速找回看过的内容
- **👥 多用户支持**：独立的用户系统，每个用户独享个人数据
- **🔄 数据同步**：支持多种存储后端（LocalStorage、Redis、D1、Upstash）

### 🚀 部署特性

- **🐳 Docker 一键部署**：提供完整的 Docker 镜像，开箱即用
- **☁️ 多平台支持**：Vercel、Docker、Cloudflare Pages 全兼容
- **🔧 灵活配置**：支持自定义资源站、代理设置、主题配置
- **📱 PWA 支持**：可安装为桌面/手机应用
- **📺 TVBox 兼容**：支持 TVBox 配置接口

---

## 🚀 快速开始

### 推荐方案选择

| 用户类型    | 推荐方案         | 特点                 |
| ----------- | ---------------- | -------------------- |
| 🆕 新手用户 | Docker 单容器    | 最简单，5 分钟部署   |
| 👥 多人使用 | Vercel + Upstash | 免费，支持多用户     |
| 🏠 自托管   | Docker + Redis   | 功能完整，数据可控   |
| 🏢 生产环境 | Docker + Kvrocks | 高可靠性，零丢失风险 |

---

## 📋 部署方案

### 方案一：Docker 单容器（推荐新手）

**适合场景**：个人使用，最简单的部署方式

```bash
# 一键启动
docker run -d \
  --name katelyatv \
  -p 3000:3000 \
  --env PASSWORD=your_password \
  --restart unless-stopped \
  ghcr.io/katelya77/katelyatv:latest

# 访问 http://localhost:3000
```

**自定义配置文件（可选）**：

```bash
# 挂载配置文件
docker run -d \
  --name katelyatv \
  -p 3000:3000 \
  --env PASSWORD=your_password \
  -v ./config.json:/app/config.json:ro \
  --restart unless-stopped \
  ghcr.io/katelya77/katelyatv:latest
```

### 方案二：Docker + Redis（多用户推荐）

**适合场景**：家庭/团队使用，支持多用户和数据同步

```bash
# 下载配置文件
curl -O https://raw.githubusercontent.com/katelya77/KatelyaTV/main/docker-compose.redis.yml
curl -O https://raw.githubusercontent.com/katelya77/KatelyaTV/main/.env.redis.example
cp .env.redis.example .env

# 编辑环境变量
nano .env

# 启动服务
docker compose -f docker-compose.redis.yml up -d
```

**重要环境变量配置**：

```bash
# 存储类型
NEXT_PUBLIC_STORAGE_TYPE=redis

# 管理员账号
USERNAME=admin
PASSWORD=your_admin_password

# Redis配置
REDIS_URL=redis://katelyatv-redis:6379

# 开启用户注册
NEXT_PUBLIC_ENABLE_REGISTER=true
```

### 方案三：Docker + Kvrocks（高可靠性）

**适合场景**：生产环境，需要极高的数据可靠性

```bash
# 下载配置文件
curl -O https://raw.githubusercontent.com/katelya77/KatelyaTV/main/docker-compose.kvrocks.yml
curl -O https://raw.githubusercontent.com/katelya77/KatelyaTV/main/.env.kvrocks.example
cp .env.kvrocks.example .env

# 编辑环境变量
nano .env

# 启动服务（无密码版本）
docker compose -f docker-compose.kvrocks.yml up -d

# 如需密码认证版本，使用：
# docker compose -f docker-compose.kvrocks.auth.yml up -d
```

**重要环境变量配置**：

```bash
# 存储类型
NEXT_PUBLIC_STORAGE_TYPE=kvrocks

# 管理员账号（必填）
USERNAME=admin
PASSWORD=your_admin_password

# Kvrocks配置
KVROCKS_URL=redis://kvrocks:6666
# 密码配置（可选）
# KVROCKS_PASSWORD=your_kvrocks_password

# 开启用户注册
NEXT_PUBLIC_ENABLE_REGISTER=true
```

**Kvrocks 优势**：

- 🛡️ **极高可靠性**：基于 RocksDB，数据持久化到磁盘
- ⚡ **性能优异**：完全兼容 Redis 协议，性能更佳
- 💾 **节省内存**：数据存储在磁盘，内存使用量大幅降低

> 详细部署指南请查看：[Kvrocks 部署文档](docs/KVROCKS_DEPLOYMENT.md)

### 方案四：Vercel + Upstash（一键部署）

**适合场景**：无服务器，免费部署，支持多用户。利用 Vercel 自动集成，无需手动注册 Upstash 或配置密钥。

1. **Fork 仓库**：将 [KatelyaTV](https://github.com/katelya77/KatelyaTV) Fork 到你的 GitHub 账户。

2. **部署到 Vercel**：

   - 登录 [Vercel](https://vercel.com/)，通过你的 GitHub 账户导入刚刚 Fork 的仓库并部署。

3. **关联 Upstash（关键步骤）**：

   - 在 Vercel 项目的控制面板中，进入 **Settings** > **Integrations**。
   - 搜索 "Upstash" 并点击 **Add Integration**。
   - 按照指引授权并创建一个新的 Redis 数据库。Vercel 会自动将数据库凭证（`UPSTASH_REDIS_REST_URL` 和 `UPSTASH_REDIS_REST_TOKEN`）添加到你的项目环境变量中。

4. **配置项目环境变量**：

   - 下载环境变量配置模板：
     ```bash
     curl -O https://raw.githubusercontent.com/katelya77/KatelyaTV/main/.env.vercel.example
     ```
   - 在 Vercel 项目的 **Settings** > **Environment Variables** 中，添加以下变量：

     ```bash
     # 启用 Upstash 作为存储后端
     NEXT_PUBLIC_STORAGE_TYPE=upstash

     # 设置管理员账号
     USERNAME=admin
     PASSWORD=your_admin_password

     # （可选）允许新用户注册
     NEXT_PUBLIC_ENABLE_REGISTER=true
     ```

   - **重要**：你不再需要手动从 Upstash 官网复制和粘贴 `UPSTASH_URL` 和 `UPSTASH_TOKEN`。

5. **重新部署**：
   - 添加完环境变量后，进入项目的 **Deployments** 页面，对最新的部署记录选择 **Redeploy**，以使所有配置生效。

部署成功后，你就可以使用设置的管理员账号密码登录了。

### 方案五：Cloudflare + D1（技术爱好者）

**适合场景**：全球 CDN 加速，免费但配置稍复杂

```bash
# 下载配置文件
curl -O https://raw.githubusercontent.com/katelya77/KatelyaTV/main/wrangler.toml
curl -O https://raw.githubusercontent.com/katelya77/KatelyaTV/main/.env.cloudflare.example

# 创建 D1 数据库
wrangler d1 create katelyatv-db
wrangler d1 execute katelyatv-db --file=./scripts/d1-init.sql

# 部署
wrangler pages deploy
```

---

## ⚙️ 配置说明

### 🔧 环境变量

| 变量名                        | 说明             | 默认值       |
| ----------------------------- | ---------------- | ------------ |
| `PASSWORD`                    | 访问密码（必填） | 无           |
| `USERNAME`                    | 管理员用户名     | 无           |
| `SITE_NAME`                   | 站点名称         | KatelyaTV    |
| `NEXT_PUBLIC_STORAGE_TYPE`    | 存储类型         | localstorage |
| `REDIS_URL`                   | Redis 连接地址   | 无           |
| `NEXT_PUBLIC_ENABLE_REGISTER` | 开启用户注册     | false        |

### 📁 视频源配置

> **重要**：为保障项目合规性，需要配置视频源才能正常使用。

#### 方法一：使用推荐配置（推荐）

1. 下载配置文件：

   - [基础版 config.json](https://www.mediafire.com/file/xl3yo7la2ci378w/config.json/file)
   - [Plus 版（94 个片源）](https://www.mediafire.com/file/fbpk1mlupxp3u3v/configplus.json/file)

2. 配置方式：
   - **Docker**：挂载配置文件 `-v ./config.json:/app/config.json:ro`
   - **Vercel**：替换仓库中的 `config.json` 文件内容
   - **管理员界面**：登录后台 `/admin` 导入配置

#### 方法二：手动配置

编辑 `config.json` 文件：

```json
{
  "cache_time": 7200,
  "api_site": {
    "example": {
      "api": "https://example.com/api.php/provide/vod",
      "name": "示例资源站",
      "detail": "https://example.com"
    }
  }
}
```

---

## 📱 高级功能

### TVBox 兼容

支持 TVBox 配置接口，可以将视频源导入到各种电视盒子应用：

- **配置地址**：`https://your-domain.com/api/tvbox?format=json`
- **详细说明**：查看 [TVBox 配置指南](docs/TVBOX.md)

### 跳过片头片尾

智能跳过片头片尾功能：

- 🎯 自动检测已设置的跳过片段
- ⚙️ 手动设置跳过时间段（精确到秒）
- 🔄 支持多设备同步（需配置 Redis/D1/Upstash）

### AndroidTV 支持

配合 [OrionTV](https://github.com/zimplexing/OrionTV) 在 Android TV 上使用：

1. 在 OrionTV 中填入 KatelyaTV 部署地址
2. 输入设置的 PASSWORD
3. 即可在电视上观看

---

## 🛠️ 管理与维护

### 升级更新

```bash
# Docker 升级
docker compose pull && docker compose up -d

# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f
```

### 数据备份

```bash
# Redis 数据备份
docker compose exec redis redis-cli BGSAVE

# Kvrocks 数据备份
docker run --rm \
  -v katelyatv_kvrocks-data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/kvrocks-backup.tar.gz /data
```

### 常见问题

| 问题             | 解决方案                                    |
| ---------------- | ------------------------------------------- |
| 无法访问         | 检查端口 3000 是否开放                      |
| 密码错误         | 检查 PASSWORD 环境变量                      |
| Redis 连接失败   | 检查 Redis 容器状态和网络                   |
| Kvrocks 认证错误 | 查看 [详细文档](docs/KVROCKS_DEPLOYMENT.md) |

---

## 🔒 安全提醒

### 强烈建议

- **设置密码**：避免公开访问，防范法律风险
- **个人使用**：请勿公开分享实例链接
- **遵守法律**：确保使用行为符合当地法规

### 免责声明

- 本项目仅供学习和个人使用
- 请勿用于商业用途或公开服务
- 用户需对使用行为承担法律责任

---

## 🤝 贡献与支持

### 技术栈

- **前端**：Next.js 14, TypeScript, Tailwind CSS
- **播放器**：ArtPlayer, HLS.js
- **存储**：Redis, Kvrocks, Cloudflare D1, Upstash
- **部署**：Docker, Vercel, Cloudflare Pages

### Star History

[![Star History Chart](https://api.star-history.com/svg?repos=katelya77/KatelyaTV&type=Date)](https://star-history.com/#katelya77/KatelyaTV&Date)

### 支持项目

如果这个项目对您有帮助，欢迎给个 ⭐ Star！

<div align="center">
  <img src="public/wechat.jpg" alt="微信支付" width="200">
  <br>
  <strong>请开发者喝杯咖啡 ☕</strong>
</div>

---

## 📄 License

[MIT](LICENSE) © 2025 KatelyaTV & Contributors

## 🙏 致谢

- [LibreTV](https://github.com/LibreSpark/LibreTV) — 项目启发
- [LunaTV](https://github.com/MoonTechLab/LunaTV) — 原始项目基础
- [ArtPlayer](https://github.com/zhw2590582/ArtPlayer) — 强大的网页视频播放器
- 感谢所有贡献者和支持者

---

<div align="center">
  <p>❤️ Made with love by KatelyaTV Community</p>
</div>
