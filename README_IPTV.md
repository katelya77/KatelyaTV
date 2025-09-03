# KatelyaTV 🚀

> 一个功能丰富的在线视频流媒体平台，支持视频点播和 IPTV 直播功能

[![Next.js](https://img.shields.io/badge/Next.js-14.x-blueviolet.svg)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC.svg)](https://tailwindcss.com/)

## ✨ 最新更新：IPTV 直播功能

🎉 **版本 0.5.0-katelya 重大更新**：

- 🆕 **完整 IPTV 直播支持**：支持 M3U/M3U8 播放列表格式
- 🛠️ **直播源管理**：管理员可在后台添加、编辑、管理直播源
- 📺 **频道分组浏览**：按分组查看和选择直播频道
- ⚡ **智能缓存**：30 分钟频道数据缓存，提升访问速度
- 🔄 **批量操作**：支持批量启用/禁用/删除/刷新直播源
- 📱 **全平台支持**：所有存储后端都支持直播功能

## 🎬 主要功能

### 📺 IPTV 直播功能 (新增)

- **🎯 直播源管理**: 管理员可添加/编辑/删除直播源
- **📋 M3U/M3U8 支持**: 支持标准播放列表格式
- **📂 频道分组**: 按分组浏览直播频道
- **⚡ 智能缓存**: 30 分钟频道数据缓存
- **🔄 批量操作**: 支持批量管理直播源
- **↕️ 拖拽排序**: 直播源顺序可调整
- **🔍 实时解析**: 自动解析播放列表，统计频道数量

### 🎥 视频点播功能

- **🔍 多源搜索**: 支持多个视频资源站点
- **📱 响应式播放**: 完美适配各种设备
- **⭐ 收藏系统**: 用户可收藏喜爱的内容
- **📖 观看记录**: 自动记录观看进度
- **🗂️ 分类浏览**: 按类型浏览影视内容

### 🛠️ 技术特性

- **💾 多存储后端**: LocalStorage、Redis、Kvrocks、D1、Upstash
- **📱 PWA 支持**: 可安装为桌面应用
- **🌗 主题切换**: 支持暗色/亮色主题
- **⚡ 性能优化**: 图片懒加载、代码分割
- **🔐 权限管理**: 完整的用户认证和权限系统

## 🚀 快速开始

### 环境要求

- Node.js >= 18.x
- pnpm (推荐) 或 npm

### 安装步骤

1. **克隆项目**

```bash
git clone <repository-url>
cd KatelyaTV
```

2. **安装依赖**

```bash
pnpm install
# 或
npm install
```

3. **启动开发服务器**

```bash
pnpm dev
# 或
npm run dev
```

4. **访问应用**

- 用户界面: http://localhost:3000
- 管理后台: http://localhost:3000/admin
- 直播页面: http://localhost:3000/live/sources

### 📋 测试直播功能

运行直播功能测试脚本：

```bash
pnpm run test:live
# 或
npm run test:live
```

## 📁 项目结构

```
KatelyaTV/
├── 📁 src/
│   ├── 📁 app/                    # Next.js App Router
│   │   ├── 📁 api/                # API 路由
│   │   │   ├── 📁 admin/          # 管理 API
│   │   │   │   └── 📁 live/       # 直播源管理 API
│   │   │   └── 📁 live/           # 直播相关 API
│   │   │       ├── 📁 channels/   # 频道列表 API
│   │   │       └── 📁 sources/    # 直播源列表 API
│   │   ├── 📁 admin/              # 管理后台
│   │   ├── 📁 live/               # 直播相关页面
│   │   │   ├── page.tsx           # 直播播放页面
│   │   │   └── 📁 sources/        # 直播源选择页面
│   │   ├── 📁 search/             # 搜索页面
│   │   └── 📁 play/               # 播放页面
│   ├── 📁 components/             # React 组件
│   ├── 📁 lib/                    # 工具库和配置
│   │   ├── m3u-parser.ts          # M3U/M3U8 解析器
│   │   ├── types.ts               # 类型定义
│   │   └── *.db.ts                # 存储后端支持
│   └── 📁 styles/                 # 样式文件
├── 📁 public/                     # 静态资源
├── 📁 scripts/                    # 构建和工具脚本
│   └── test-live-tv.js            # 直播功能测试脚本
├── 📁 docs/                       # 项目文档
│   └── LIVE_TV.md                 # 直播功能详细文档
└── 📁 migrations/                 # 数据库迁移文件
    └── 003_live_sources.sql       # 直播源表结构
```

## 🎯 直播功能详解

### 架构图

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│  管理员后台  │───▶│  直播源管理   │───▶│ M3U/M3U8   │
│             │    │              │    │    解析     │
└─────────────┘    └──────────────┘    └─────────────┘
                            │                  │
                            ▼                  ▼
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│   用户界面   │◀───│  频道数据     │◀───│  缓存系统   │
│             │    │   存储       │    │             │
└─────────────┘    └──────────────┘    └─────────────┘
        │                   │
        ▼                   ▼
┌─────────────┐    ┌──────────────┐
│  视频播放器  │    │  多存储后端   │
│             │    │   支持       │
└─────────────┘    └──────────────┘
```

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

## 🔧 部署指南

### 存储后端对比

| 后端类型      | 适用场景      | 特点                     | 直播功能支持 |
| ------------- | ------------- | ------------------------ | ------------ |
| LocalStorage  | 开发/小型部署 | 无需配置，浏览器本地存储 | ✅ 完整支持  |
| Redis         | 高性能需求    | 内存缓存，高并发支持     | ✅ 完整支持  |
| Kvrocks       | 持久化存储    | Redis 兼容，数据持久化   | ✅ 完整支持  |
| Cloudflare D1 | 无服务器部署  | SQLite，全球分布         | ✅ 完整支持  |
| Upstash Redis | 无服务器缓存  | Redis 兼容，按使用付费   | ✅ 完整支持  |

### Vercel 部署

1. **连接 GitHub**

   ```bash
   git push origin main
   ```

2. **环境变量配置**

   ```env
   STORAGE_TYPE=localstorage
   # 或其他存储后端配置
   ```

3. **自动部署**
   - Vercel 会自动检测 Next.js 项目并部署

### Cloudflare Pages 部署

1. **构建配置**

   ```bash
   pnpm run pages:build
   ```

2. **D1 数据库设置 (可选)**

   ```bash
   # 创建数据库
   npx wrangler d1 create katelyatv

   # 执行迁移
   npx wrangler d1 execute katelyatv --file=migrations/003_live_sources.sql
   ```

### Docker 部署

```dockerfile
FROM node:18-alpine

WORKDIR /app

# 复制依赖文件
COPY package*.json ./
RUN npm ci --only=production

# 复制应用代码
COPY . .

# 构建应用
RUN npm run build

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["npm", "start"]
```

## 🔐 管理后台使用

### 默认管理员账户

- 用户名: `admin`
- 密码: `password123`

### 直播源管理功能

1. **添加直播源**

   - 进入管理后台 → 直播源配置
   - 点击"添加"按钮
   - 填写直播源信息（名称、M3U 地址、User-Agent 等）
   - 系统会自动解析并统计频道数量

2. **管理操作**

   - ✅ 启用/禁用直播源
   - 📊 查看频道数量统计
   - 🔄 刷新频道数据
   - 🗑️ 删除不需要的源
   - ↕️ 拖拽调整显示顺序
   - 📦 批量操作多个源

3. **高级功能**
   - 🎯 支持自定义 User-Agent
   - 📺 EPG 电子节目单集成 (规划中)
   - ⚡ 智能缓存管理
   - 🔍 M3U 格式验证

## 📱 移动端体验

- **📱 响应式设计**: 自适应各种屏幕尺寸
- **🔽 移动端导航**: 底部导航栏，操作便捷
- **👆 触控优化**: 支持触摸手势操作
- **📲 PWA 功能**: 可添加到主屏幕，类原生体验
- **⚡ 性能优化**: 移动端专门优化，流畅播放

## 🎨 主题和界面

### 内置主题

- 🌞 **亮色主题**: 清爽明亮，适合白天使用
- 🌙 **暗色主题**: 护眼舒适，适合夜间观看
- 🎯 **自动切换**: 跟随系统主题设置

### 界面特色

- 🎨 **现代化设计**: 基于 Tailwind CSS 的精美界面
- 🔄 **流畅动画**: Framer Motion 提供的丝滑体验
- 📐 **一致性**: 统一的设计语言和交互规范
- 🎯 **用户友好**: 直观的操作流程和清晰的信息展示

## 🛠️ 开发相关

### 脚本命令

```bash
# 开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 启动生产服务器
pnpm start

# 代码格式化
pnpm run format

# 代码检查
pnpm run lint

# 类型检查
pnpm run typecheck

# 测试直播功能
pnpm run test:live

# 生成配置文件
pnpm run gen:runtime

# 生成 PWA 清单
pnpm run gen:manifest
```

### 技术栈详情

| 分类   | 技术选择      | 版本   | 说明                       |
| ------ | ------------- | ------ | -------------------------- |
| 框架   | Next.js       | 14.x   | React 全栈框架，App Router |
| 语言   | TypeScript    | 5.x    | 类型安全的 JavaScript      |
| 样式   | Tailwind CSS  | 3.x    | 实用优先的 CSS 框架        |
| 图标   | Lucide React  | latest | 漂亮的开源图标库           |
| 动画   | Framer Motion | 12.x   | 生产就绪的动画库           |
| 播放器 | ArtPlayer     | 5.x    | 现代化的 HTML5 播放器      |
| 弹窗   | SweetAlert2   | 11.x   | 美观的警告框替代           |
| 拖拽   | @dnd-kit      | 6.x    | 现代化的拖拽库             |

## 📊 API 文档

### 直播相关 API

| 端点                            | 方法   | 描述                   | 权限   |
| ------------------------------- | ------ | ---------------------- | ------ |
| `/api/live/sources`             | GET    | 获取公开直播源列表     | 公开   |
| `/api/live/channels?source=xxx` | GET    | 获取指定源的频道列表   | 公开   |
| `/api/admin/live`               | GET    | 获取所有直播源管理信息 | 管理员 |
| `/api/admin/live`               | POST   | 添加新的直播源         | 管理员 |
| `/api/admin/live`               | PUT    | 更新直播源信息         | 管理员 |
| `/api/admin/live`               | DELETE | 删除直播源             | 管理员 |

### 请求示例

```javascript
// 获取直播源列表
fetch('/api/live/sources')
  .then((res) => res.json())
  .then((data) => console.log(data));

// 添加直播源 (管理员权限)
fetch('/api/admin/live', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'add',
    config: {
      key: 'my_source',
      name: '我的直播源',
      url: 'http://example.com/playlist.m3u',
      ua: 'Mozilla/5.0...',
    },
  }),
});
```

## 🔍 故障排除

### 常见问题

#### 直播相关问题

1. **Q: 直播源无法加载？**

   - A: 检查 M3U/M3U8 地址是否有效，确认网络连接，尝试设置 User-Agent

2. **Q: 频道播放失败？**

   - A: 检查频道播放地址是否可访问，确认浏览器支持视频格式

3. **Q: 频道数量显示为 0？**
   - A: 点击刷新按钮重新解析，检查 M3U 文件格式

#### 部署相关问题

4. **Q: Vercel 部署后无法访问直播功能？**

   - A: 确保环境变量 `STORAGE_TYPE` 设置正确，LocalStorage 适合 Vercel

5. **Q: D1 数据库连接失败？**
   - A: 检查 wrangler.toml 配置，确保数据库已创建并执行了迁移

### 性能优化建议

- **缓存策略**: 合理设置缓存时间，平衡性能和实时性
- **并发控制**: 避免同时刷新过多直播源
- **网络优化**: 使用 CDN 加速 M3U 文件访问
- **存储选择**: 根据用户量选择合适的存储后端

## 🗺️ 发展路线图

### 🎯 即将推出 (v0.6.0)

- [ ] **EPG 电子节目单**: 显示节目时间表和详情
- [ ] **收藏频道**: 用户可收藏常看频道
- [ ] **频道搜索**: 在直播频道中快速搜索
- [ ] **播放历史**: 记录最近观看的频道

### 🚀 计划功能 (v0.7.0+)

- [ ] **录制功能**: 支持直播节目录制
- [ ] **回看功能**: 支持时移播放
- [ ] **多画面**: 同时观看多个频道
- [ ] **弹幕功能**: 实时互动弹幕系统
- [ ] **直播预约**: 节目提醒和预约录制

### 🌍 长期目标

- [ ] **多语言支持**: 国际化界面
- [ ] **插件系统**: 支持第三方插件扩展
- [ ] **移动端 APP**: 原生移动应用
- [ ] **智能推荐**: 基于观看历史的内容推荐

## 🤝 贡献指南

我们欢迎社区的贡献！无论是 bug 报告、功能建议还是代码贡献。

### 开发流程

1. **Fork 项目** 到你的 GitHub 账户
2. **创建特性分支** (`git checkout -b feature/AmazingFeature`)
3. **编写代码** 并确保通过所有测试
4. **提交更改** (`git commit -m 'Add some AmazingFeature'`)
5. **推送分支** (`git push origin feature/AmazingFeature`)
6. **创建 Pull Request**

### 开发规范

```bash
# 安装依赖
pnpm install

# 代码格式化
pnpm run format

# 代码检查
pnpm run lint:fix

# 类型检查
pnpm run typecheck

# 运行测试
pnpm run test

# 测试直播功能
pnpm run test:live
```

### 贡献类型

- 🐛 **Bug 修复**: 发现并修复问题
- ✨ **新功能**: 提议和实现新功能
- 📝 **文档改进**: 完善项目文档
- 🎨 **界面优化**: 改进用户界面和体验
- ⚡ **性能优化**: 提升应用性能
- 🔧 **工具改进**: 优化开发工具和流程

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE)。

## 🙏 致谢

### 开源项目致谢

- [Next.js](https://nextjs.org/) - 强大的 React 全栈框架
- [Tailwind CSS](https://tailwindcss.com/) - 实用优先的 CSS 框架
- [ArtPlayer](https://artplayer.org/) - 现代化的视频播放器
- [Lucide React](https://lucide.dev/) - 精美的图标库
- [SweetAlert2](https://sweetalert2.github.io/) - 美观的弹窗组件
- [Framer Motion](https://www.framer.com/motion/) - 流畅的动画库

### 社区贡献者

感谢所有为项目做出贡献的开发者和用户！

### 原项目致谢

感谢 MoonTV 项目的原作者和所有贡献者，为我们提供了坚实的基础。

---

<div align="center">
  
### 🌟 如果这个项目对你有帮助，请给个 Star 支持！

[![Stars](https://img.shields.io/github/stars/yourusername/KatelyaTV?style=social)](https://github.com/yourusername/KatelyaTV/stargazers)
[![Forks](https://img.shields.io/github/forks/yourusername/KatelyaTV?style=social)](https://github.com/yourusername/KatelyaTV/network/members)

**📧 问题反馈** · **💡 功能建议** · **🤝 参与贡献**

[提交 Issue](https://github.com/yourusername/KatelyaTV/issues) · [功能请求](https://github.com/yourusername/KatelyaTV/issues/new?template=feature_request.md) · [文档](docs/LIVE_TV.md)

</div>
