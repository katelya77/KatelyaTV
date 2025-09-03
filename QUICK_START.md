# KatelyaTV IPTV 使用指南 🎬

## 🎉 恭喜！IPTV 功能已成功集成

你的 KatelyaTV 现在支持完整的 IPTV 直播功能！根据测试结果，所有核心组件都已正确安装和配置。

## 🚀 立即开始使用

### 第一步：启动服务器

```bash
pnpm dev
# 或
npm run dev
```

### 第二步：访问应用

- **用户界面**: http://localhost:3000
- **管理后台**: http://localhost:3000/admin
- **直播页面**: http://localhost:3000/live/sources

### 第三步：配置直播源 (管理员)

1. **登录管理后台**

   - 用户名: `admin`
   - 密码: `password123`

2. **添加直播源**

   - 进入 "直播源配置" 选项卡
   - 点击 "添加" 按钮
   - 填写直播源信息：
     ```
     名称: 我的直播源
     M3U地址: https://your-m3u-url.com/playlist.m3u
     User-Agent: Mozilla/5.0... (可选)
     EPG地址: https://your-epg-url.com/epg.xml (可选)
     ```

3. **管理直播源**
   - ✅ 启用/禁用直播源
   - 🔄 刷新频道数据
   - 📊 查看频道统计
   - ↕️ 拖拽调整顺序
   - 🗑️ 删除不需要的源

## 📺 用户观看体验

### 选择直播源

- 访问 `/live/sources` 查看所有可用直播源
- 每个直播源显示频道数量
- 点击任意直播源进入观看界面

### 观看直播

- **左侧频道列表**: 浏览所有可用频道
- **分组筛选**: 按频道分组快速查找
- **右侧播放器**: 点击频道名称即可播放

## 🛠️ 当前配置状态

根据测试结果，你的系统已配置：

### ✅ 已验证的功能

- **配置文件**: 包含 1 个示例直播源
- **核心文件**: 所有必要的文件都已创建
- **依赖包**: Next.js、React、图标库、弹窗组件
- **网络连接**: 成功解析示例 M3U (10,986 个频道)

### 📋 示例直播源

- **名称**: 示例直播源
- **来源**: iptv-org 公共播放列表
- **频道数**: 10,986 个国际频道
- **格式**: M3U8 标准格式

## 🔧 自定义配置

### 添加你自己的直播源

1. **通过管理后台** (推荐)

   - 访问 `/admin` → 直播源配置
   - 实时添加、编辑、管理

2. **通过配置文件**
   ```json
   // config.json
   {
     "live_sources": {
       "my_custom_source": {
         "name": "我的自定义源",
         "url": "https://your-domain.com/playlist.m3u",
         "ua": "Mozilla/5.0 (compatible; KatelyaTV)",
         "epg": "https://your-domain.com/epg.xml"
       }
     }
   }
   ```

### 支持的直播源格式

✅ **M3U 格式**

```m3u
#EXTM3U
#EXTINF:-1 tvg-name="频道名称" group-title="分组",频道显示名
http://stream-url.com/channel.m3u8
```

✅ **M3U8 格式**

```m3u8
#EXTM3U
#EXTINF:-1 tvg-id="ch001" tvg-logo="logo.png" group-title="央视",CCTV1
http://live-stream.com/cctv1.m3u8
```

## 📱 多平台访问

### 桌面端

- **Chrome/Edge**: 完美支持，推荐使用
- **Firefox**: 支持，某些视频格式可能需要额外插件
- **Safari**: 支持，自动处理 HLS 流

### 移动端

- **安卓浏览器**: 完整支持
- **iOS Safari**: 原生 HLS 支持
- **PWA 模式**: 可添加到主屏幕

### 智能电视/机顶盒

- **Android TV**: 通过浏览器访问
- **Apple TV**: 通过 AirPlay 投屏
- **其他设备**: 通过内置浏览器访问

## 🎯 高级特性

### 🚀 性能优化

- **智能缓存**: 频道数据缓存 30 分钟
- **懒加载**: 频道列表按需加载
- **预加载**: 智能预加载常用频道

### 🔒 安全特性

- **权限控制**: 只有管理员可管理直播源
- **输入验证**: M3U URL 格式验证
- **错误处理**: 优雅的错误提示和恢复

### 📊 管理功能

- **批量操作**: 一键管理多个直播源
- **拖拽排序**: 直观的顺序调整
- **实时统计**: 频道数量实时显示
- **缓存管理**: 手动刷新功能

## 🐛 故障排除

### 常见问题解决

1. **直播源加载失败**

   ```bash
   # 检查网络连接
   curl -I "https://your-m3u-url.com/playlist.m3u"

   # 验证 M3U 格式
   curl "https://your-m3u-url.com/playlist.m3u" | head -20
   ```

2. **频道播放失败**

   - 检查播放地址是否支持 CORS
   - 尝试设置适当的 User-Agent
   - 确认视频格式浏览器支持

3. **管理后台无法访问**
   ```bash
   # 重置管理员密码 (如需要)
   # 检查 config.json 中的认证设置
   ```

### 性能优化建议

1. **缓存设置**

   - 保持默认 30 分钟缓存
   - 根据直播源稳定性调整

2. **网络优化**

   - 使用 CDN 加速 M3U 文件
   - 选择地理位置较近的直播源

3. **存储选择**
   - 小型部署: LocalStorage
   - 多用户: Redis/Kvrocks
   - 云部署: D1/Upstash

## 📚 更多资源

- **📖 详细文档**: [docs/LIVE_TV.md](docs/LIVE_TV.md)
- **🔧 API 文档**: README_IPTV.md#API 文档
- **🚀 部署指南**: README_IPTV.md#部署指南
- **🤝 贡献指南**: README_IPTV.md#贡献指南

## 🎉 开始享受直播吧！

你的 KatelyaTV 现在已经具备完整的 IPTV 功能。无论是观看国际新闻、体育赛事还是娱乐节目，都能获得出色的观看体验。

**立即开始：**

```bash
pnpm dev
```

然后访问 http://localhost:3000/live/sources 开始体验！

---

> 💡 **提示**: 如果你在使用过程中遇到任何问题，欢迎查看文档或提交 Issue。我们持续改进和优化这个项目！
