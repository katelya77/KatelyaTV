import { NextRequest, NextResponse } from 'next/server';

// 强制使用 Edge Runtime 以支持 Cloudflare Pages
export const runtime = 'edge';

// 常用的视频解析接口列表
const PARSE_APIS = [
  {
    name: '无名小站',
    url: 'https://jx.aidouer.net/?url=',
    support: ['qq', 'iqiyi', 'youku', 'mgtv', 'bilibili']
  },
  {
    name: '虾米解析',
    url: 'https://jx.xmflv.com/?url=',
    support: ['qq', 'iqiyi', 'youku', 'mgtv', 'bilibili', 'sohu']
  },
  {
    name: '爱豆解析',
    url: 'https://jx.aidouer.net/?url=',
    support: ['qq', 'iqiyi', 'youku', 'mgtv', 'bilibili']
  },
  {
    name: '8090解析',
    url: 'https://www.8090g.cn/?url=',
    support: ['qq', 'iqiyi', 'youku', 'mgtv', 'bilibili']
  },
  {
    name: 'OK解析',
    url: 'https://okjx.cc/?url=',
    support: ['qq', 'iqiyi', 'youku', 'mgtv', 'bilibili']
  }
];

// 检测视频URL的平台类型
function detectPlatform(url: string): string {
  if (url.includes('qq.com') || url.includes('v.qq.com')) return 'qq';
  if (url.includes('iqiyi.com') || url.includes('qiyi.com')) return 'iqiyi';
  if (url.includes('youku.com')) return 'youku';
  if (url.includes('mgtv.com')) return 'mgtv';
  if (url.includes('bilibili.com')) return 'bilibili';
  if (url.includes('sohu.com')) return 'sohu';
  if (url.includes('letv.com') || url.includes('le.com')) return 'letv';
  if (url.includes('tudou.com')) return 'tudou';
  if (url.includes('pptv.com')) return 'pptv';
  if (url.includes('1905.com')) return '1905';
  return 'unknown';
}

// 获取适用的解析接口
function getCompatibleParsers(platform: string) {
  return PARSE_APIS.filter(api => 
    api.support.includes(platform) || platform === 'unknown'
  );
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const parser = searchParams.get('parser'); // 指定解析器
    const format = searchParams.get('format') || 'json'; // 返回格式

    if (!url) {
      return NextResponse.json(
        { error: '缺少url参数' },
        { status: 400 }
      );
    }

    // 检测平台类型
    const platform = detectPlatform(url);
    const compatibleParsers = getCompatibleParsers(platform);

    if (compatibleParsers.length === 0) {
      return NextResponse.json(
        { 
          error: '暂不支持该平台的视频解析',
          platform,
          url 
        },
        { status: 400 }
      );
    }

    // 如果指定了解析器，优先使用
    let selectedParser = compatibleParsers[0];
    if (parser) {
      const customParser = PARSE_APIS.find(api => 
        api.name.toLowerCase().includes(parser.toLowerCase())
      );
      if (customParser && compatibleParsers.includes(customParser)) {
        selectedParser = customParser;
      }
    }

    const parseUrl = selectedParser.url + encodeURIComponent(url);

    // 根据format返回不同格式
    if (format === 'redirect') {
      // 直接重定向到解析页面
      return NextResponse.redirect(parseUrl);
    } else if (format === 'iframe') {
      // 返回可嵌入的HTML页面
      const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>视频播放</title>
    <style>
        body { margin: 0; padding: 0; background: #000; }
        iframe { width: 100%; height: 100vh; border: none; }
    </style>
</head>
<body>
    <iframe src="${parseUrl}" allowfullscreen></iframe>
</body>
</html>`;
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Access-Control-Allow-Origin': '*'
        }
      });
    } else {
      // 返回JSON格式的解析信息
      return NextResponse.json({
        success: true,
        data: {
          original_url: url,
          platform,
          parse_url: parseUrl,
          parser_name: selectedParser.name,
          available_parsers: compatibleParsers.map(p => p.name)
        }
      }, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Cache-Control': 'public, max-age=300' // 5分钟缓存
        }
      });
    }

  } catch (error) {
    return NextResponse.json(
      { 
        error: '视频解析失败',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// 支持CORS预检请求
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}
