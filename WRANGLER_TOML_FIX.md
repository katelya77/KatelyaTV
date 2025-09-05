# Cloudflare Pages wrangler.toml 修复说明

## 🚨 问题原因

Cloudflare Pages 部署失败，错误信息：
- "Unexpected fields found in build field: environment, environment_variables"
- "Configuration file for Pages projects does not support 'build'"

**根本原因**：`wrangler.toml` 中包含了 Workers 专用的 `[build]` 配置，这在 Cloudflare Pages 中不被支持。

## ✅ 已修复的问题

### 删除的不兼容配置：
```toml
# ❌ 这些配置在 Cloudflare Pages 中不被支持，已删除
[build]
command = "pnpm pages:build"
environment = { NODE_VERSION = "18" }

[[build.environment_variables]]
name = "NPM_FLAGS"
value = "--prefix=/opt/buildhome/.asdf/installs/nodejs/18.17.1/.npm"
```

### ✅ 保留的正确配置：
- `name = "katelyatv"`
- `compatibility_date = "2024-09-01"`
- `pages_build_output_dir = ".vercel/output/static"`
- `[env.production.vars]` - 环境变量
- `[[env.production.d1_databases]]` - D1 数据库绑定

## 🔧 Cloudflare Pages 构建配置

**Cloudflare Pages 的构建配置应该在 Pages 控制台中设置，而不是在 wrangler.toml 中：**

### 在 Cloudflare Pages Dashboard 中设置：

1. **Framework preset**: `Next.js`
2. **Build command**: `pnpm install --frozen-lockfile && pnpm pages:build`
3. **Build output directory**: `.vercel/output/static`
4. **Root directory**: `/`
5. **Node.js version**: `18.x`

### 环境变量设置：
在 Cloudflare Pages → Settings → Environment variables 中添加：
```
NEXT_PUBLIC_STORAGE_TYPE = d1
NEXT_PUBLIC_SITE_NAME = KatelyaTV
NEXT_PUBLIC_SITE_DESCRIPTION = 高性能影视播放平台
NODE_ENV = production
```

## 🎯 修复后的部署流程

1. ✅ **wrangler.toml 已修复** - 删除了不兼容的 build 配置
2. ✅ **D1 数据库已修复** - admin_configs 表已创建并填充数据
3. ✅ **Edge Runtime 已配置** - 所有 API 路由都有正确的运行时配置

### 下一步：
1. 提交修复后的 wrangler.toml 到 GitHub
2. 在 Cloudflare Pages 中重新触发部署
3. 确认 D1 数据库正确绑定到 Pages 项目

## 📋 验证清单

部署成功后，验证以下功能：
- [ ] 网站首页正常加载
- [ ] `/admin` 页面不再显示"获取配置失败"
- [ ] API 端点正常工作
- [ ] D1 数据库连接正常

现在 Cloudflare Pages 应该能够成功部署了！🚀
