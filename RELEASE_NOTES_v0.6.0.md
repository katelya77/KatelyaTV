## 🎉 KatelyaTV v0.6.0-katelya

### ✨ 主要更新

#### 📺 TVBox 集成优化

- **新增用户菜单中的"TVBox 配置"按钮** - 提供便捷的配置入口
- **TVBox API 无需认证** - 解决客户端无法登录的问题，现在可直接使用配置链接
- **优化用户体验** - 支持一键复制配置 URL，直接在 TVBox 应用中使用

#### ☁️ Cloudflare Pages 完全支持

- **修复 Edge Runtime 兼容性** - 解决部署失败问题
- **重构 API 架构** - 使用 Edge Runtime 兼容的配置读取方式
- **生产环境稳定性提升** - 确保 Cloudflare Pages 部署成功

#### 🔧 技术改进

- 修复代码风格问题（ESLint 导入排序）
- 优化中间件配置，确保安全性
- 提升构建过程稳定性

### 📱 使用方式

**TVBox 配置 URL**（无需登录）：

- JSON 格式：`https://your-domain.com/api/tvbox?format=json`
- Base64 格式：`https://your-domain.com/api/tvbox?format=base64`

**访问配置页面**：

1. 登录后点击右上角用户头像
2. 选择"TVBox 配置"
3. 复制配置链接到 TVBox 应用

### 🌐 部署兼容性

- ✅ Cloudflare Pages（推荐）
- ✅ Vercel
- ✅ Docker
- ✅ 传统服务器

### 🔄 升级说明

- **向后兼容**：现有配置和数据完全兼容
- **推荐操作**：重新部署以获取 Cloudflare Pages 优化
- **新功能**：TVBox 配置功能可选使用

---

**重要提示**：本版本主要解决了 TVBox 客户端集成和 Cloudflare Pages 部署的关键问题，建议所有用户升级。
