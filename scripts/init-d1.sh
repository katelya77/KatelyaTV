#!/bin/bash
# D1数据库初始化脚本

echo "🗄️ 开始初始化Cloudflare D1数据库..."

# 检查是否已安装wrangler
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI未安装，正在安装..."
    npm install -g wrangler
fi

# 检查是否已登录
echo "🔐 检查Cloudflare登录状态..."
if ! wrangler whoami &> /dev/null; then
    echo "📝 请先登录Cloudflare账户..."
    wrangler login
fi

echo "📦 创建D1数据库..."

# 创建生产环境数据库
echo "🔨 创建生产环境数据库..."
PROD_OUTPUT=$(wrangler d1 create katelyatv-production 2>&1)
echo "$PROD_OUTPUT"

# 提取生产环境数据库ID
PROD_DB_ID=$(echo "$PROD_OUTPUT" | grep -o 'database_id = "[^"]*"' | head -1 | cut -d'"' -f2)

# 创建预览环境数据库
echo "🔨 创建预览环境数据库..."
PREVIEW_OUTPUT=$(wrangler d1 create katelyatv-preview 2>&1)
echo "$PREVIEW_OUTPUT"

# 提取预览环境数据库ID
PREVIEW_DB_ID=$(echo "$PREVIEW_OUTPUT" | grep -o 'database_id = "[^"]*"' | head -1 | cut -d'"' -f2)

echo "📋 数据库创建完成！"
echo "生产环境数据库ID: $PROD_DB_ID"
echo "预览环境数据库ID: $PREVIEW_DB_ID"

# 更新wrangler.toml文件
echo "📝 更新wrangler.toml配置..."
sed -i "s/database_id = \"\" # Production/database_id = \"$PROD_DB_ID\"/" wrangler.toml
sed -i "s/database_id = \"\" # Preview/database_id = \"$PREVIEW_DB_ID\"/" wrangler.toml

# 初始化数据库表结构
echo "🏗️ 初始化数据库表结构..."
echo "正在初始化生产环境数据库..."
wrangler d1 execute katelyatv-production --file=scripts/d1-schema.sql

echo "正在初始化预览环境数据库..."
wrangler d1 execute katelyatv-preview --file=scripts/d1-schema.sql

echo "✅ D1数据库初始化完成！"
echo ""
echo "📚 下一步:"
echo "1. 检查 wrangler.toml 文件中的数据库ID是否正确更新"
echo "2. 在Cloudflare Pages项目中设置环境变量: STORAGE_TYPE=d1"
echo "3. 使用构建命令: npm run cloudflare:build"
echo "4. 部署到Cloudflare Pages"
