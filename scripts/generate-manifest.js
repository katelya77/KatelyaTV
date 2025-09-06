#!/usr/bin/env node
/* eslint-disable */
// 根据 SITE_NAME 动态生成 manifest.json

const fs = require('fs');
const path = require('path');

// 获取项目根目录
const projectRoot = path.resolve(__dirname, '..');
const publicDir = path.join(projectRoot, 'public');
const manifestPath = path.join(publicDir, 'manifest.json');

// 从环境变量获取站点名称
const siteName = process.env.SITE_NAME || 'JiabanTV';

// manifest.json 模板
const manifestTemplate = {
  name: siteName,
  short_name: siteName,
  description: '影视聚合',
  start_url: '/',
  scope: '/',
  display: 'standalone',
  background_color: '#000000',
  'apple-mobile-web-app-capable': 'yes',
  'apple-mobile-web-app-status-bar-style': 'black',
  icons: [
    {
      src: '/icons/icon-192x192.jpg',
      sizes: '192x192',
      type: 'image/jpg',
    },
    {
      src: '/icons/icon-256x256.jpg',
      sizes: '256x256',
      type: 'image/jpg',
    },
    {
      src: '/icons/icon-384x384.jpg',
      sizes: '384x384',
      type: 'image/jpg',
    },
    {
      src: '/icons/icon-512x512.jpg',
      sizes: '512x512',
      type: 'image/jpg',
    },
  ],
};

try {
  // 确保 public 目录存在
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // 写入 manifest.json
  fs.writeFileSync(manifestPath, JSON.stringify(manifestTemplate, null, 2));
  console.log(`✅ Generated manifest.json with site name: ${siteName}`);
} catch (error) {
  console.error('❌ Error generating manifest.json:', error);
  process.exit(1);
}
