@echo off
REM D1数据库初始化脚本 (Windows版本)

echo 🗄️ 开始初始化Cloudflare D1数据库...

REM 检查是否已安装wrangler
where wrangler >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Wrangler CLI未安装，正在安装...
    call npm install -g wrangler
)

REM 检查是否已登录
echo 🔐 检查Cloudflare登录状态...
call wrangler whoami >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo 📝 请先登录Cloudflare账户...
    call wrangler login
)

echo 📦 创建D1数据库...

REM 创建生产环境数据库
echo 🔨 创建生产环境数据库...
call wrangler d1 create katelyatv-production > temp_prod.txt 2>&1
type temp_prod.txt

REM 创建预览环境数据库
echo 🔨 创建预览环境数据库...
call wrangler d1 create katelyatv-preview > temp_preview.txt 2>&1
type temp_preview.txt

echo 📋 数据库创建完成！
echo 请手动从上面的输出中复制数据库ID到wrangler.toml文件中

REM 初始化数据库表结构
echo 🏗️ 初始化数据库表结构...
echo 正在初始化生产环境数据库...
call wrangler d1 execute katelyatv-production --file=scripts/d1-schema.sql

echo 正在初始化预览环境数据库...
call wrangler d1 execute katelyatv-preview --file=scripts/d1-schema.sql

REM 清理临时文件
del temp_prod.txt temp_preview.txt

echo ✅ D1数据库初始化完成！
echo.
echo 📚 下一步:
echo 1. 检查 wrangler.toml 文件中的数据库ID是否正确更新
echo 2. 在Cloudflare Pages项目中设置环境变量: STORAGE_TYPE=d1
echo 3. 使用构建命令: npm run cloudflare:build
echo 4. 部署到Cloudflare Pages

pause
