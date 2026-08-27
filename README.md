<div align="center">
  <img src="public/logo.png" alt="KatelyaTV Logo" width="128" />

  <h1>KatelyaTV</h1>
  <p><strong>跨平台 · 聚合搜索 · Emby Server 兼容 · Cloudflare 一键部署</strong></p>
  <p>基于 <code>Next.js 14</code> · <code>TypeScript</code> · <code>Tailwind CSS</code> · 多源聚合 / 播放记录 / 收藏同步 / 跳过片头片尾 / Emby 兼容 API</p>
</div>

---

## 📰 项目声明

本项目自「MoonTV」演进而来，为其二创/继承版本。保留并致谢原作者与社区贡献者。

> **🔔 重要变更**：内置视频源已移除，需用户自行配置资源站。

> **本分支专注 Cloudflare Pages 部署**，并新增 **Emby Server 兼容层**，可在 Hills、Infuse、Emby 官方客户端等把本站当作 Emby 服务器添加。

---

## ✨ 功能特性

- **🔍 聚合搜索**：整合多个苹果 CMS 资源站，一键搜索
- **📺 高清播放**：基于 ArtPlayer，支持 HLS/m3u8
- **📡 Emby Server 兼容**：把本站作为 Emby 服务器添加到 Hills 等客户端
- **⏭️ 智能跳过**：自动/手动跳过片头片尾
- **🎯 断点续播**：跨设备同步观看进度
- **⭐ 收藏 & 历史**：多用户独立数据
- **🔒 内容过滤**：成人内容过滤，默认开启
- **📺 TVBox 兼容**：支持 TVBox 配置接口
- **☁️ Cloudflare Pages**：全球 CDN，免费部署

---

## 📡 Emby Server 兼容（Hills / Infuse 等）

本项目内置一个最小可用的 Emby REST 兼容层，路径前缀为 `/emby`。

### 在客户端添加服务器

在 Hills、Infuse、Emby 等支持 Emby 协议的客户端里，添加服务器时填写：

```
http(s)://你的域名/emby
```

- 用户名：任意（默认 guest 即可）
- 密码：若服务端设置了 `PASSWORD` 环境变量则填写该密码，否则留空

### 工作方式

- 每个**视频源**会映射为一个 Emby **媒体库**
- 进入库后使用客户端的**搜索**功能检索影片（上游苹果 CMS 源需要关键词才能返回列表）
- 单集内容识别为 **电影(Movie)**，多集内容识别为 **剧集(Series)**
- 播放时服务端将 Emby 请求解析为上游 `m3u8` 地址，通过 302 重定向直连播放

### 已实现的端点

| 端点 | 说明 |
| ---- | ---- |
| `GET /emby/System/Info/Public` | 服务器发现 |
| `POST /emby/Users/AuthenticateByName` | 登录鉴权 |
| `GET /emby/Users/{id}/Views` | 媒体库列表（=视频源） |
| `GET /emby/Users/{id}/Items?SearchTerm=` | 搜索影片 |
| `GET /emby/Shows/{id}/Seasons` · `Episodes` | 剧集/分集 |
| `GET /emby/Items/{id}/Images/Primary` | 封面代理 |
| `GET/POST /emby/Items/{id}/PlaybackInfo` | 播放信息 |
| `GET /emby/Videos/{id}/stream` | 视频流（302 → m3u8） |

> 说明：上游苹果 CMS 源只提供标题/封面/年份/简介等基础元数据，不含分集标题、时长、分辨率等，因此 Emby 里的相关字段会留空或使用占位值。

---

## 🚀 快速部署（Cloudflare Pages + D1）

**特点**：全球 CDN，无限带宽，免费 SSL。

### 1. Fork 项目

Fork 到你的 GitHub 账号：[GitHub 仓库](https://github.com/katelya77/KatelyaTV)

### 2. 创建 Pages 项目

登录 [Cloudflare Dashboard](https://dash.cloudflare.com/) → Pages → Connect to Git → 选择仓库。

构建设置：

```
Build command: pnpm install --frozen-lockfile && pnpm run pages:build
Build output directory: .vercel/output/static
```

兼容性标志：`nodejs_compat`

### 3. 环境变量

```bash
# 管理员账号
USERNAME=admin
PASSWORD=your_password

# 存储配置（Cloudflare 使用 D1）
NEXT_PUBLIC_STORAGE_TYPE=d1

# 功能开关
NEXT_PUBLIC_ENABLE_REGISTER=true
```

### 4. 创建 D1 数据库

```bash
# 安装 Wrangler CLI
npm install -g wrangler
wrangler auth login

# 创建数据库（在项目根目录运行）
wrangler d1 create katelyatv-db

# 初始化表结构
wrangler d1 execute katelyatv-db --file=./scripts/d1-init.sql
```

### 5. 配置数据库绑定

在 `wrangler.toml` 中添加：

```toml
[[d1_databases]]
binding = "DB"
database_name = "katelyatv-db"
database_id = "your-d1-database-id"
```

> 更多细节见 [Cloudflare Pages 部署指南](./CLOUDFLARE_PAGES_DEPLOYMENT.md)、[D1 数据库迁移说明](./D1_MIGRATION.md)。

---

## ⚙️ 配置说明

### 环境变量

| 变量名 | 必填 | 说明 | 示例值 |
| ------ | ---- | ---- | ------ |
| `USERNAME` | 多用户必填 | 管理员用户名 | `admin` |
| `PASSWORD` | 是 | 访问/管理员密码 | `your_password` |
| `NEXT_PUBLIC_STORAGE_TYPE` | 否 | 存储类型：`localstorage` / `d1` | `d1` |
| `NEXT_PUBLIC_ENABLE_REGISTER` | 否 | 是否开放注册 | `true` |

> 本分支仅支持 `d1`（Cloudflare Pages 推荐）与 `localstorage`（本地开发）两种存储。

### 视频源配置

编辑仓库根目录的 `config.json`，或登录 `/admin` 后台导入：

```json
{
  "cache_time": 7200,
  "api_site": {
    "example": {
      "api": "https://example.com/api.php/provide/vod",
      "name": "示例资源站",
      "detail": "https://example.com",
      "is_adult": false
    }
  }
}
```

推荐配置文件：

- 基础版（20+站点）：[config_isadult.json](https://www.mediafire.com/file/upztrjc0g1ynbzy/config_isadult.json/file)
- 增强版（94 站点）：[configplus_isadult.json](https://www.mediafire.com/file/ff60ynj6z21iqfb/configplus_isadult.json/file)

---

## 📱 其它功能

### TVBox 兼容

- 配置地址：`https://你的域名/api/tvbox?format=json`
- 详细说明：[TVBox 配置指南](docs/TVBOX.md)

### 成人内容过滤

- 默认开启，需数据库存储（`d1`）支持才能按用户保存开关
- 详见 [Cloudflare Pages 成人内容过滤配置指南](./CLOUDFLARE_PAGES_ADULT_FILTER.md)

### 跳过片头片尾

- 播放时在设置中配置片头结束/片尾开始时间，多设备同步（需 D1）

### AndroidTV（OrionTV）

配合 [OrionTV](https://github.com/zimplexing/OrionTV)：填入部署地址与 `PASSWORD` 即可。

---

## 🛠️ 本地开发

```bash
pnpm install
pnpm dev            # 本地开发（默认 localstorage）
pnpm pages:build    # Cloudflare Pages 构建
```

---

## 📄 License

[MIT](LICENSE)
