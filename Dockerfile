# ---- 第 1 阶段：安装依赖 ----
FROM --platform=$BUILDPLATFORM node:20-alpine AS deps
WORKDIR /app

# 仅复制依赖清单，提高构建缓存利用率
COPY package.json pnpm-lock.yaml ./

# 针对ARM架构优化：设置更大的内存限制和超时时间
ENV NODE_OPTIONS="--max-old-space-size=4096"

# 使用 pnpm 安装依赖
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --frozen-lockfile

# ---- 第 2 阶段：构建项目 ----
FROM --platform=$BUILDPLATFORM node:20-alpine AS builder
WORKDIR /app

# 针对ARM架构优化：设置更大的内存限制
ENV NODE_OPTIONS="--max-old-space-size=4096"

# 安装 pnpm（因为这是新的 Alpine 镜像实例）
RUN corepack enable && corepack prepare pnpm@latest --activate

# 复制依赖
COPY --from=deps /app/node_modules ./node_modules
# 复制全部源代码
COPY . .

# 在构建阶段也显式设置 DOCKER_ENV，
# 确保 Next.js 在编译时即选择 Node Runtime 而不是 Edge Runtime
RUN find ./src -type f -name "route.ts" -print0 \
  | xargs -0 sed -i "s/export const runtime = 'edge';/export const runtime = 'nodejs';/g"
ENV DOCKER_ENV=true

# For Docker builds, force dynamic rendering to read runtime environment variables.
RUN sed -i "/const inter = Inter({ subsets: \['latin'] });/a export const dynamic = 'force-dynamic';" src/app/layout.tsx

# 生成生产构建
RUN pnpm run build

# ---- 第 3 阶段：生成运行时镜像 ----
FROM node:20-alpine AS runner

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && adduser -u 1001 -S nextjs -G nodejs

WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV DOCKER_ENV=true

# 从构建器中复制 standalone 输出
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# 从构建器中复制 scripts 目录
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
# 从构建器中复制 start.js
COPY --from=builder --chown=nextjs:nodejs /app/start.js ./start.js
# 从构建器中复制 public 和 .next/static 目录
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/config.json ./config.json

# 切换到非特权用户
USER nextjs

EXPOSE 3000

# 使用自定义启动脚本，先预加载配置再启动服务器
CMD ["node", "start.js"] 