# Cloudflare Pages 部署指南

## 🚨 500 Internal Server Error 解决方案

### 问题：部署成功但运行时500错误

**原因分析：**

部署日志显示构建成功，但访问网站时出现500错误，通常是由于环境变量配置问题导致的运行时错误。

**主要原因：**

1. **USERNAME 环境变量缺失** - 这是最常见的原因
2. D1 数据库绑定问题
3. 其他关键环境变量未设置

### 🎯 解决步骤

#### 第一步：设置必需的环境变量

在 Cloudflare Pages 控制台中：

1. 进入您的项目设置
2. 点击 "Settings" → "Environment variables"
3. 添加以下**必需**环境变量：

   **USERNAME 变量：**
   - **Variable name**: `USERNAME`
   - **Value**: `katelya` (您的站长用户名)
   - **Type**: Plain text
   - **Environment**: Production 和 Preview 都要添加

   **PASSWORD 变量：** ⭐ **关键变量**
   - **Variable name**: `PASSWORD`
   - **Value**: `您设置的访问密码`
   - **Type**: Plain text (**重要：不要选择密码类型**)
   - **Environment**: Production 和 Preview 都要添加

4. 点击 "Save"
5. 重新部署项目

#### 第二步：验证其他环境变量

确保以下环境变量已正确设置：

```bash
# ⭐ 关键必需变量（缺一不可）
USERNAME=katelya                          # 站长用户名
PASSWORD=your-secure-password             # 访问密码
NEXT_PUBLIC_STORAGE_TYPE=d1              # 存储类型
NEXT_PUBLIC_SITE_NAME=KatelyaTV          # 站点名称
NODE_ENV=production                      # 运行环境

# 推荐设置
NEXTAUTH_URL=https://your-domain.pages.dev
IMAGE_PROXY_ENABLED=true
```

**⚠️ 重要提醒：**

- `PASSWORD` 必须设置为 "Plain text" 类型，不要选择 "Secret" 或 "Password" 类型
- `PASSWORD` 的值应该与您之前在本地或其他环境中使用的密码一致

#### 第三步：检查 D1 数据库绑定

1. 确保在 Cloudflare Pages 中绑定了 D1 数据库
2. 绑定名称应为 `DB`
3. 数据库应已初始化（运行过初始化脚本）

## 部署问题修复

### 问题1：Edge Runtime 配置错误

**错误信息：**

```text
The following routes were not configured to run with the Edge Runtime:
  - /api/test/simple

Please make sure that all your non-static routes export the following edge runtime route segment config:
  export const runtime = 'edge';
```

**解决方案：**

✅ 已修复：删除了空的 `/api/test/simple/route.ts` 文件和相关目录。

**验证：**

所有API路由现在都正确配置了 `export const runtime = 'edge';`

### 问题2：Windows环境下的bash依赖问题

**错误信息：**

```text
Error: spawn bash ENOENT
```

**原因：**

`@cloudflare/next-on-pages` 在Windows环境下需要bash来执行构建过程。

**解决方案选项：**

#### 选项1：使用 WSL (推荐)

1. 安装 Windows Subsystem for Linux (WSL)
2. 在WSL环境中运行构建命令

#### 选项2：使用 Git Bash

1. 确保已安装 Git for Windows
2. 在Git Bash中运行构建命令：

   ```bash
   pnpm run pages:build
   ```

#### 选项3：云端构建

直接在Cloudflare Pages的CI/CD环境中构建，因为云环境通常是Linux系统。

## 正确的部署步骤

### 1. 本地验证构建

```bash
# 生成运行时配置
pnpm run gen:runtime

# 生成manifest
pnpm run gen:manifest

# Next.js 构建
npx next build

# Cloudflare Pages 适配 (在Linux/WSL环境中)
npx @cloudflare/next-on-pages
```

### 2. Cloudflare Pages 配置

在Cloudflare Pages控制台中设置：

**构建配置：**

- 构建命令: `pnpm install --frozen-lockfile && pnpm run pages:build`
- 构建输出目录: `.vercel/output/static`
- Node.js 版本: `20.x`

**环境变量：** (已在 `wrangler.toml` 中配置)

- `NEXT_PUBLIC_STORAGE_TYPE=d1`
- `NEXT_PUBLIC_SITE_NAME=KatelyaTV`
- 其他变量见 `wrangler.toml`

### 3. 验证部署

部署成功后，检查：

1. 所有API路由是否正常工作
2. 静态页面是否正确生成
3. Edge Runtime是否正常运行

## 常见问题排查

### API路由问题

确保所有API文件都包含：

```typescript
export const runtime = 'edge';
```

### 构建失败

1. 检查所有依赖是否安装完整
2. 确认TypeScript编译无错误
3. 验证环境变量配置

### 性能优化

- 已启用默认代码分割
- PWA缓存策略已配置
- 静态资源优化已开启

## 部署状态验证

部署完成后，访问以下端点验证：

- `/api/server-config` - 服务器配置
- `/api/debug/env` - 环境变量 (开发时)
- 主页 `/` - 前端页面

## 🔧 完整故障排除指南

### 500错误诊断清单

#### 1. 环境变量检查

```bash
# 在 Cloudflare Pages 控制台检查这些变量
USERNAME=katelya                          # ❌ 经常缺失
PASSWORD=your-password                    # ❌ 最关键，经常缺失或类型错误
NEXT_PUBLIC_STORAGE_TYPE=d1              # ✅ 通常已设置
NEXT_PUBLIC_SITE_NAME=KatelyaTV          # ✅ 通常已设置
NODE_ENV=production                       # ✅ 通常已设置
```

**特别注意 PASSWORD 变量：**

- ✅ 正确：类型选择 "Plain text"
- ❌ 错误：类型选择 "Secret" 或 "Password"
- ❌ 错误：值为空或包含特殊字符

#### 2. D1 数据库检查

- [ ] D1 数据库是否已创建
- [ ] 数据库是否正确绑定到 Pages 项目
- [ ] 绑定名称是否为 `DB`
- [ ] 数据库是否已初始化

#### 3. 常见错误模式

| 错误现象 | 原因 | 解决方案 |
|---------|------|----------|
| 500 错误 | PASSWORD 未设置或类型错误 | 设置 PASSWORD 为 Plain text 类型 |
| 500 + 管理页面无法访问 | USERNAME 未设置 | 添加 USERNAME 环境变量 |
| 重定向到 /warning 页面 | PASSWORD 环境变量缺失 | 检查 PASSWORD 变量设置 |
| 500 + 数据库相关错误 | D1 绑定问题 | 检查数据库绑定配置 |
| 构建成功但运行失败 | 关键环境变量缺失 | 检查 USERNAME 和 PASSWORD |

### 验证部署成功

部署完成后访问以下端点验证：

```bash
# 1. 基本页面
https://your-domain.pages.dev/          # 主页
https://your-domain.pages.dev/login     # 登录页

# 2. API 端点
https://your-domain.pages.dev/api/server-config  # 服务器配置
https://your-domain.pages.dev/api/debug/env      # 环境变量（开发时）

# 3. 管理功能
https://your-domain.pages.dev/admin     # 管理后台（需要正确的 USERNAME）
```

### 紧急恢复方案

如果新部署出现问题：

1. **立即回滚**

   ```bash
   # 在 Cloudflare Pages 控制台
   Deployments → 选择之前的工作版本 → Rollback
   ```

2. **保留环境变量**

   ```bash
   # 记录当前所有环境变量配置
   # 在新部署前先备份设置
   ```

3. **分步部署**

   ```bash
   # 1. 先部署代码（不修改环境变量）
   # 2. 验证基本功能
   # 3. 逐步添加/修改环境变量
   ```

## 后续维护

1. 定期更新依赖
2. 监控部署日志
3. 备份数据库配置
4. 关注Cloudflare Pages更新
5. 定期检查环境变量配置
6. 监控网站运行状态
