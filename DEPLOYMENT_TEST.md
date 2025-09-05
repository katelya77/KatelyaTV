# Docker构建测试脚本

## 在本地测试Docker构建的步骤：

### 1. 基本构建测试（不启动容器）
```bash
docker build -t katelyatv-test .
```

### 2. 多平台构建测试（GitHub Actions环境）
```bash
docker buildx build --platform linux/amd64,linux/arm64 -t katelyatv-test .
```

### 3. 构建并运行容器测试
```bash
docker build -t katelyatv-test .
docker run -p 3000:3000 -e NEXT_PUBLIC_STORAGE_TYPE=localstorage katelyatv-test
```

## 注意事项：

1. **Windows权限问题**：Windows上的符号链接权限问题只影响本地构建的standalone输出，不影响Docker构建
2. **多架构支持**：Dockerfile支持ARM64和AMD64架构
3. **环境变量**：确保在运行时设置正确的环境变量
4. **存储类型**：Docker环境建议使用Redis、KvRocks或D1，避免使用LocalStorage

## Cloudflare Pages构建

确保wrangler.toml配置正确：
```toml
[build]
command = "pnpm pages:build"
environment = { NODE_VERSION = "18" }
```

## 环境变量配置

### Docker环境
```env
NEXT_PUBLIC_STORAGE_TYPE=redis
REDIS_URL=redis://localhost:6379
USERNAME=admin
```

### Cloudflare Pages环境
```env
NEXT_PUBLIC_STORAGE_TYPE=d1
USERNAME=admin
```

## 健康检查

所有部署都应该在以下端点正常响应：
- GET /api/health - 系统健康检查
- GET /api/admin - 管理员接口（需要认证）
- GET /api/search?q=test - 搜索接口测试
