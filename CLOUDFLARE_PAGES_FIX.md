# Cloudflare Pages 部署修复指南

## 问题描述

Cloudflare Pages 部署遇到两个主要问题：

1. **绑定名称冲突**：
```
Error: Failed to publish your Function. Got error: Binding name 'PASSWORD' already in use.
```

2. **wrangler.toml 文件损坏**：
```
ParseError: Unterminated string
lineText: 'name = "katelyat[env.preview.vars]'
```

## 解决方案

✅ **第一步**：将环境变量名从 `PASSWORD` 更改为 `AUTH_PASSWORD` 以避免Cloudflare的保留绑定名称冲突。

✅ **第二步**：修复损坏的 `wrangler.toml` 文件，文件结构被损坏导致语法错误。

## 需要的操作

### 1. 更新 wrangler.toml 配置
✅ 已完成 - `PASSWORD` 已更改为 `AUTH_PASSWORD`

### 2. 更新代码中的引用  
✅ 已完成 - 所有 `process.env.PASSWORD` 已更改为 `process.env.AUTH_PASSWORD`

### 3. 在 Cloudflare Pages 控制台中设置环境变量

由于您提到无法在控制台中直接修改环境变量（因为通过 wrangler.toml 管理），我们需要：

1. **重新部署项目** - 新的 wrangler.toml 配置会自动设置 `AUTH_PASSWORD` 变量
2. **验证环境变量** - 确保 `AUTH_PASSWORD` 正确设置

### 4. 立即执行步骤

现在执行以下命令重新部署：

```powershell
git add -A
git commit -m "fix: 修复绑定名称冲突 - 将PASSWORD改为AUTH_PASSWORD"
git push origin main
```

## 更新说明

### 变更的文件：
- `wrangler.toml` - 更新环境变量名称
- `src/middleware.ts` - 更新认证逻辑
- `src/app/api/login/route.ts` - 更新登录验证
- `src/app/api/register/route.ts` - 更新注册逻辑

### 环境变量变更：
- `PASSWORD` → `AUTH_PASSWORD`
- 功能保持完全一致，只是变量名称改变

## 预期结果

部署成功后：
1. 不再出现绑定名称冲突错误
2. `AUTH_PASSWORD` 环境变量将自动通过 wrangler.toml 设置
3. 网站应该正常运行，认证功能正常

## 验证步骤

部署完成后：
1. 访问您的 Cloudflare Pages 网站
2. 尝试登录（用户名: katelya，密码: your-secure-password-here）
3. 如果能正常登录，说明修复成功

如果仍有问题，请检查 Cloudflare Pages 的部署日志。