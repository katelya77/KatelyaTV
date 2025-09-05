# Windows 构建权限问题解决方案

## 🚨 问题描述

构建失败，错误信息：
```
Error: EPERM: operation not permitted, symlink
```

这是 Windows 系统上的符号链接权限问题，在使用 pnpm 和 Next.js standalone 模式时常见。

## 🔧 解决方案

### 方案 1：临时禁用 standalone 模式（推荐用于开发）

修改 `next.config.js`：

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 临时注释掉 standalone 配置以避免 Windows 权限问题
  // output: 'standalone',
  
  // 其他配置保持不变...
  experimental: {
    outputFileTracingExcludes: {
      '*': [
        'node_modules/@swc/core-linux-x64-gnu',
        'node_modules/@swc/core-linux-x64-musl',
        'node_modules/@next/swc-linux-x64-gnu',
        'node_modules/@next/swc-linux-x64-musl',
      ],
    },
  },
  // ...
};

module.exports = nextConfig;
```

### 方案 2：以管理员身份运行（临时解决）

1. 以管理员身份打开 PowerShell
2. 运行构建命令：
   ```powershell
   cd "C:\Users\Katelya\Documents\VScode\KatelyaTV"
   npm run build
   ```

### 方案 3：启用开发者模式（推荐）

1. 打开 Windows 设置 → 更新和安全 → 开发者选项
2. 启用"开发者模式"
3. 重新运行构建

### 方案 4：修改 package.json 构建脚本

修改构建脚本以跳过有问题的文件追踪：

```json
{
  "scripts": {
    "build": "npm run gen:runtime && npm run gen:manifest && NEXT_DISABLE_FILE_TRACING=1 next build",
    "build:win": "npm run gen:runtime && npm run gen:manifest && set NEXT_DISABLE_FILE_TRACING=1 && next build"
  }
}
```

然后使用：
```powershell
npm run build:win
```

## 🎯 针对不同部署环境的建议

### 对于本地开发
使用方案 1（禁用 standalone）+ 方案 3（开发者模式）

### 对于 Cloudflare Pages 部署
不需要修改，Cloudflare Pages 会自动处理构建环境，不会有 Windows 权限问题

### 对于 Docker 部署
Docker 环境中不会有此问题，保持原配置即可

## 🔍 验证解决方案

运行以下命令验证修复：

```powershell
# 清理之前的构建文件
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue

# 重新构建
npm run build
```

如果成功，应该看到：
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages
✓ Collecting build traces
```

没有 EPERM 错误。

## 💡 长期解决方案

考虑迁移到使用 WSL2 (Windows Subsystem for Linux) 进行开发，这样可以避免 Windows 特有的文件系统权限问题：

1. 安装 WSL2
2. 在 WSL2 中克隆项目
3. 在 WSL2 环境中进行开发和构建

这样可以获得与 Linux 生产环境一致的开发体验。
