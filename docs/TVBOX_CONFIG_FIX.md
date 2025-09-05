# TVBox 配置生成问题修复

## 问题描述

用户反馈 TVBox 配置生成失败，错误信息：
```
{"error":"TVBox配置生成失败","details":"D1_ERROR: no such table: admin_config: SQLITE_ERROR"}
```

## 问题原因

这是一个数据库表名不一致的问题：

1. **SQL初始化脚本** (`scripts/d1-init.sql`)：创建的表名是 `admin_configs`（复数）
2. **应用代码** (`src/lib/d1.db.ts`)：查询的表名是 `admin_config`（单数）

## 修复方案

### 1. 代码修复
已修改 `src/lib/d1.db.ts` 中的 `getAdminConfig()` 和 `setAdminConfig()` 方法，使其使用正确的表名 `admin_configs`。

### 2. 数据迁移
创建了迁移脚本 `scripts/d1-migrate-admin-config.sql` 来处理现有数据。

## 部署步骤

### 对于新部署用户
直接使用最新版本部署即可，无需额外操作。

### 对于现有用户
需要运行数据迁移脚本：

```bash
# 运行迁移脚本
wrangler d1 execute your-database-name --file=./scripts/d1-migrate-admin-config.sql
```

## 验证修复
修复后，TVBox 配置生成应该能正常工作：

```bash
# 测试 TVBox 配置 API
curl "https://your-domain.pages.dev/api/tvbox?format=json"
```

## 影响范围
- 仅影响使用 Cloudflare Pages + D1 部署的用户
- 其他部署方式（Docker + Redis、Vercel + Upstash 等）不受影响
- 不影响其他功能（用户认证、播放记录、收藏等）
