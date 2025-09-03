# TVBox 配置接口使用指南

## 📺 功能介绍

KatelyaTV 现在支持 TVBox 配置接口，可以将您的视频源直接导入到 TVBox 应用中使用。这个功能会自动同步 KatelyaTV 中配置的所有视频源，并提供标准的 TVBox JSON 格式配置。

## 🚀 快速开始

### 1. 访问配置页面

在 KatelyaTV 网站中，点击左侧导航栏的"TVBox 配置"菜单，或直接访问：

```
https://your-domain.com/config
```

### 2. 生成配置链接

在配置页面中：

1. **选择格式类型**：

   - **JSON 格式（推荐）**：标准的 JSON 配置文件，便于调试和查看
   - **Base64 格式**：编码后的配置，适合某些特殊环境

2. **复制配置链接**：点击"复制"按钮，系统会自动生成对应格式的配置链接

**JSON 格式：**

```
https://your-domain.com/api/tvbox?format=json
```

**Base64 格式：**

```
https://your-domain.com/api/tvbox?format=base64
```

### 3. 导入到 TVBox

1. 打开 TVBox 应用
2. 进入设置 → 配置地址
3. 粘贴复制的配置链接
4. 点击确认导入

## 🔧 配置说明

### 🖥️ 配置页面功能

KatelyaTV 提供了直观的 TVBox 配置管理界面：

- **格式切换**：支持 JSON 和 Base64 两种格式切换
- **一键复制**：点击复制按钮快速获取配置链接
- **实时生成**：根据当前网站配置实时生成最新的 TVBox 配置
- **使用指南**：页面内置详细的使用说明和功能介绍

### 📋 支持的功能

- ✅ 自动同步 KatelyaTV 的所有视频源
- ✅ 支持搜索功能
- ✅ 支持快速搜索
- ✅ 支持分类筛选
- ✅ 内置视频解析接口
- ✅ 广告过滤规则
- ✅ CORS 跨域支持

### 内置解析接口

KatelyaTV 提供内置的视频解析服务：

```
https://your-domain.com/api/parse?url={视频地址}
```

支持的平台：

- 腾讯视频 (qq.com)
- 爱奇艺 (iqiyi.com)
- 优酷 (youku.com)
- 芒果 TV (mgtv.com)
- 哔哩哔哩 (bilibili.com)
- 搜狐视频 (sohu.com)
- 乐视 (letv.com)
- 土豆 (tudou.com)
- PPTV (pptv.com)
- 1905 电影网 (1905.com)

### 解析接口参数

- `url`: 要解析的视频地址（必填）
- `parser`: 指定解析器名称（可选）
- `format`: 返回格式，支持 `json`、`redirect`、`iframe`（可选，默认 json）

## 📝 API 端点说明

### TVBox 配置接口

**GET** `/api/tvbox`

**参数：**

- `format`: 返回格式
  - `json`（默认）：返回 JSON 格式配置
  - `base64`：返回 Base64 编码的配置

**响应：**

```json
{
  "sites": [...],      // 影视源列表
  "parses": [...],     // 解析源列表
  "flags": [...],      // 播放标识
  "ads": [...],        // 广告过滤规则
  "wallpaper": "...",  // 壁纸地址
  "lives": [...]       // 直播源（可选）
}
```

### 视频解析接口

**GET** `/api/parse`

**参数：**

- `url`: 视频地址
- `parser`: 解析器名称（可选）
- `format`: 返回格式（可选）

**响应：**

```json
{
  "success": true,
  "data": {
    "original_url": "...",
    "platform": "qq",
    "parse_url": "...",
    "parser_name": "...",
    "available_parsers": [...]
  }
}
```

## 🔄 配置更新

当您在 KatelyaTV 中添加、修改或删除视频源时：

1. TVBox 配置会自动同步最新的源站信息
2. 在 TVBox 中刷新配置即可获取最新源站
3. 无需手动更新配置链接

## ⚠️ 注意事项

1. **网络要求**：确保 TVBox 设备能够访问您的 KatelyaTV 服务器
2. **HTTPS 支持**：建议使用 HTTPS 协议确保安全性
3. **缓存设置**：配置会缓存 1 小时，如需立即更新请刷新 TVBox 配置
4. **兼容性**：支持 TVBox 及其衍生应用
5. **源站限制**：解析效果取决于原始视频源的可用性

## 🛠️ 故障排除

### 配置导入失败

- 检查网络连接
- 确认配置链接格式正确
- 尝试使用不同的 format 参数

### 视频无法播放

- 检查原始视频源是否可用
- 尝试使用不同的解析器
- 确认视频平台是否被支持

### 源站不显示

- 检查 KatelyaTV 中是否正确配置了视频源
- 确认视频源格式符合要求
- 刷新 TVBox 配置

## 📞 技术支持

如果您在使用过程中遇到问题，请：

1. 检查上述故障排除方案
2. 查看 KatelyaTV 和 TVBox 的日志信息
3. 向项目仓库提交 Issue

---

_此功能基于 TVBox 标准 JSON 配置格式开发，兼容大部分 TVBox 及其衍生应用。_
