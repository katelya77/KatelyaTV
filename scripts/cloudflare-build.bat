@echo off
REM Cloudflare Pages build script for Windows

echo Setting up environment for Cloudflare Pages...

REM Set environment variable for Cloudflare Pages
set CLOUDFLARE_PAGES=1

REM Install dependencies
echo Installing dependencies...
call npm install

REM Generate necessary files
echo Generating manifest and version...
call npm run generate:manifest
call npm run generate:version

REM Build the application for export
echo Building application for static export...
call npm run build

echo Build completed successfully!
