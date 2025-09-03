# IPTV 直播功能文档

## 📺 功能概述

KatelyaTV 现在支持 IPTV 直播功能，可以观看各种电视频道和直播节目。管理员可以通过后台管理添加和管理直播源，用户可以通过简洁的界面选择和观看直播内容。

## 🚀 核心特性

### 管理员功能

- **直播源管理**: 添加、编辑、删除直播源配置
- **M3U/M3U8 解析**: 自动解析播放列表，提取频道信息
- **频道数量统计**: 实时显示每个直播源的频道数量
- **批量操作**: 支持批量启用/禁用/删除/刷新直播源
- **缓存机制**: 智能缓存频道数据，提高访问速度
- **拖拽排序**: 支持拖拽调整直播源显示顺序

### 用户功能

- **直播源选择**: 浏览可用的直播源列表
- **频道分组**: 按分组查看频道，方便导航
- **实时播放**: 支持多种视频格式播放
- **频道信息**: 显示频道名称、分组等详细信息

## 📁 文件结构

```
src/
├── app/
│   ├── live/                          # 直播相关页面
│   │   ├── page.tsx                   # 直播播放页面
│   │   └── sources/
│   │       └── page.tsx               # 直播源选择页面
│   └── api/
│       ├── admin/
│       │   └── live/
│       │       └── route.ts           # 直播源管理 API
│       └── live/
│           ├── channels/
│           │   └── route.ts           # 获取频道列表 API
│           └── sources/
│               └── route.ts           # 获取直播源列表 API
├── lib/
│   ├── m3u-parser.ts                  # M3U/M3U8 解析器
│   ├── types.ts                       # 直播相关类型定义
│   └── *.db.ts                        # 各存储后端的直播源支持
└── migrations/
    └── 003_live_sources.sql           # D1 数据库表结构
```

## 🛠️ 技术实现

### 数据模型

#### LiveConfig (直播源配置)

```typescript
interface LiveConfig {
  key: string; // 唯一标识
  name: string; // 直播源名称
  url: string; // M3U/M3U8 地址
  ua?: string; // User-Agent
  epg?: string; // 电子节目单URL
  from: 'config' | 'custom'; // 来源：配置文件或自定义
  channelNumber: number; // 频道数量
  disabled: boolean; // 启用状态
  order?: number; // 排序
}
```

#### LiveChannel (直播频道)

```typescript
interface LiveChannel {
  name: string; // 频道名称
  url: string; // 播放地址
  logo?: string; // 频道logo
  group?: string; // 频道分组
  epg_id?: string; // EPG节目单ID
}
```

### M3U/M3U8 解析

支持标准的 M3U/M3U8 格式解析：

```m3u
#EXTM3U
#EXTINF:-1 tvg-id="cctv1" tvg-name="CCTV1" tvg-logo="http://example.com/logo.png" group-title="央视频道",CCTV1综合
http://example.com/cctv1.m3u8
#EXTINF:-1 tvg-id="cctv2" tvg-name="CCTV2" tvg-logo="http://example.com/logo2.png" group-title="央视频道",CCTV2财经
http://example.com/cctv2.m3u8
```

### 缓存策略

- **频道列表缓存**: 30 分钟有效期，减少重复解析
- **过期自动刷新**: 缓存过期时自动重新获取
- **智能更新**: 仅在配置变化时更新缓存

## 🔧 部署配置

### 1. 环境支持

支持所有现有的存储后端：

- ✅ LocalStorage (浏览器本地存储)
- ✅ Redis (高性能缓存)
- ✅ Kvrocks (Redis 兼容，持久化存储)
- ✅ Cloudflare D1 (无服务器 SQLite)
- ✅ Upstash Redis (无服务器 Redis)

### 2. 配置文件

在 `config.json` 中添加默认直播源：

```json
{
  "live_sources": {
    "iptv_demo": {
      "name": "IPTV示例源",
      "url": "https://iptv-org.github.io/iptv/index.m3u",
      "ua": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "epg": "https://example.com/epg.xml"
    }
  }
}
```

### 3. 数据库迁移 (仅 D1)

对于 Cloudflare D1，需要执行数据库迁移：

```sql
-- 执行 migrations/003_live_sources.sql
npx wrangler d1 execute your-database --file=migrations/003_live_sources.sql
```

## 🎯 使用指南

### 管理员操作

1. **添加直播源**

   - 进入管理后台 → 直播源配置
   - 点击"添加"按钮
   - 填写直播源信息（名称、M3U 地址等）
   - 系统会自动解析并统计频道数量

2. **管理现有源**

   - 查看频道数量统计
   - 启用/禁用直播源
   - 批量操作多个源
   - 拖拽调整显示顺序

3. **刷新频道**
   - 单个刷新：点击频道数量旁的刷新按钮
   - 批量刷新：使用批量刷新功能

### 用户观看

1. **选择直播源**

   - 访问 `/live/sources` 查看可用直播源
   - 点击任意直播源进入观看界面

2. **观看直播**
   - 左侧频道列表：浏览所有可用频道
   - 分组筛选：按频道分组快速查找
   - 右侧播放器：点击频道即可播放

## 🔍 故障排除

### 常见问题

1. **直播源无法加载**

   - 检查 M3U/M3U8 地址是否有效
   - 确认网络连接和防火墙设置
   - 尝试设置合适的 User-Agent

2. **频道播放失败**

   - 检查频道播放地址是否可访问
   - 确认浏览器支持视频格式
   - 尝试使用不同的播放器

3. **频道数量显示为 0**
   - 点击刷新按钮重新解析
   - 检查 M3U 文件格式是否正确
   - 确认网络可以访问直播源地址

### 性能优化

- **缓存利用**: 合理设置缓存时间，平衡性能和实时性
- **并发控制**: 避免同时刷新过多直播源
- **网络优化**: 使用 CDN 加速 M3U 文件访问

## 🚧 未来计划

- [ ] **EPG 电子节目单**: 显示节目时间表和详情
- [ ] **录制功能**: 支持直播节目录制
- [ ] **收藏频道**: 用户可收藏常看频道
- [ ] **回看功能**: 支持时移播放
- [ ] **多画面**: 同时观看多个频道
- [ ] **弹幕功能**: 实时互动弹幕系统

## 🔒 安全考虑

- **权限控制**: 只有管理员可以添加/删除直播源
- **URL 验证**: 验证 M3U/M3U8 地址格式
- **缓存控制**: 防止缓存过度占用存储空间
- **访问限制**: 可配置直播功能的访问权限

---

> 📝 **注意**: 请确保所使用的直播源内容符合相关法律法规，KatelyaTV 仅提供技术支持，不承担内容相关责任。
