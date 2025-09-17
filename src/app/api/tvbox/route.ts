import { NextRequest, NextResponse } from 'next/server';

import { getConfig } from '@/lib/config';

// 强制使用 Edge Runtime 以支持 Cloudflare Pages
export const runtime = 'edge';

// TVBox源格式接口
interface TVBoxSource {
  key: string;
  name: string;
  type: number; // 0=影视源, 1=直播源, 3=解析源
  api: string;
  searchable?: number; // 0=不可搜索, 1=可搜索
  quickSearch?: number; // 0=不支持快速搜索, 1=支持快速搜索
  filterable?: number; // 0=不支持分类筛选, 1=支持分类筛选
  ext?: string; // 扩展参数
  jar?: string; // jar包地址
  playUrl?: string; // 播放解析地址
  categories?: string[]; // 分类
  timeout?: number; // 超时时间(秒)
}

interface TVBoxConfig {
  spider?: string; // 爬虫jar包地址
  wallpaper?: string; // 壁纸地址
  lives?: Array<{
    name: string;
    type: number;
    url: string;
    epg?: string;
    logo?: string;
  }>; // 直播源
  sites: TVBoxSource[]; // 影视源
  parses?: Array<{
    name: string;
    type: number;
    url: string;
    ext?: Record<string, unknown>;
    header?: Record<string, string>;
  }>; // 解析源
  flags?: string[]; // 播放标识
  ijk?: Record<string, unknown>; // IJK播放器配置
  ads?: string[]; // 广告过滤规则
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json'; // 支持json和base64格式
    const adult = searchParams.get('adult') === '1' || searchParams.get('adult') === 'true'; // 是否包含成人源，默认不包含
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const baseUrl = `${protocol}://${host}`;

    // 读取当前配置
    const config = await getConfig();

    // 从配置中获取源站列表
    let sourceConfigs = config.SourceConfig || [];

    // 过滤掉标记为成人的源（如果adult参数未设置）
    if (!adult) {
      sourceConfigs = sourceConfigs.filter(source => !source.is_adult);
    }

    if (sourceConfigs.length === 0) {
      return NextResponse.json({ error: '没有配置任何视频源' }, { status: 500 });
    }

    // 转换为TVBox格式
    const tvboxConfig: TVBoxConfig = {
      // 基础配置
      spider: '', // 可以根据需要添加爬虫jar包
      wallpaper: `${baseUrl}/screenshot1.png`, // 使用项目截图作为壁纸

      // 影视源配置
      sites: sourceConfigs.map((source) => {
        // 更智能的type判断逻辑：
        // 1. 如果api地址包含 "/provide/vod" 且不包含 "at/xml"，则认为是JSON类型 (type=1)
        // 2. 如果api地址包含 "at/xml"，则认为是XML类型 (type=0)
        // 3. 如果api地址以 ".json" 结尾，则认为是JSON类型 (type=1)
        // 4. 其他情况默认为JSON类型 (type=1)，因为现在大部分都是JSON
        let type = 1; // 默认为JSON类型

        const apiLower = source.api.toLowerCase();
        if (apiLower.includes('at/xml') || apiLower.endsWith('.xml')) {
          type = 0; // XML类型
        }

        return {
          key: source.key || source.name,
          name: source.name,
          type: type, // 使用智能判断的type
          api: source.api,
          searchable: 1, // 可搜索
          quickSearch: 1, // 支持快速搜索
          filterable: 1, // 支持分类筛选
          ext: source.detail || '', // 详情页地址作为扩展参数
          timeout: 30, // 30秒超时
          categories: [
            "电影", "电视剧", "综艺", "动漫", "纪录片", "短剧"
          ]
        };
      }),

      // 解析源配置（添加一些常用的解析源）
      parses: [
        {
          name: "Json并发",
          type: 2,
          url: "Parallel"
        },
        {
          name: "Json轮询",
          type: 2,
          url: "Sequence"
        },
        {
          name: "KatelyaTV内置解析",
          type: 1,
          url: `${baseUrl}/api/parse?url=`,
          ext: {
            flag: ["qiyi", "qq", "letv", "sohu", "youku", "mgtv", "bilibili", "wasu", "xigua", "1905"]
          }
        }
      ],

      // 播放标识
      flags: [
        "youku", "qq", "iqiyi", "qiyi", "letv", "sohu", "tudou", "pptv",
        "mgtv", "wasu", "bilibili", "le", "duoduozy", "renrenmi", "xigua",
        "优酷", "腾讯", "爱奇艺", "奇艺", "乐视", "搜狐", "土豆", "PPTV",
        "芒果", "华数", "哔哩", "1905"
      ],

      // 直播源（可选）
      lives: [
        {
          name: "KatelyaTV直播",
          type: 0,
          url: `${baseUrl}/api/live/channels`,
          epg: "",
          logo: ""
        }
      ],

      // 广告过滤规则
      ads: [
        "mimg.0c1q0l.cn",
        "www.googletagmanager.com",
        "www.google-analytics.com",
        "mc.usihnbcq.cn",
        "mg.g1mm3d.cn",
        "mscs.svaeuzh.cn",
        "cnzz.hhurm.com",
        "tp.vinuxhome.com",
        "cnzz.mmstat.com",
        "www.baihuillq.com",
        "s23.cnzz.com",
        "z3.cnzz.com",
        "c.cnzz.com",
        "stj.v1vo.top",
        "z12.cnzz.com",
        "img.mosflower.cn",
        "tips.gamevvip.com",
        "ehwe.yhdtns.com",
        "xdn.cqqc3.com",
        "www.jixunkyy.cn",
        "sp.chemacid.cn",
        "hm.baidu.com",
        "s9.cnzz.com",
        "z6.cnzz.com",
        "um.cavuc.com",
        "mav.mavuz.com",
        "wofwk.aoidf3.com",
        "z5.cnzz.com",
        "xc.hubeijieshikj.cn",
        "tj.tianwenhu.com",
        "xg.gars57.cn",
        "k.jinxiuzhilv.com",
        "cdn.bootcss.com",
        "ppl.xunzhuo123.com",
        "xomk.jiangjunmh.top",
        "img.xunzhuo123.com",
        "z1.cnzz.com",
        "s13.cnzz.com",
        "xg.huataisangao.cn",
        "z7.cnzz.com",
        "xg.huataisangao.cn",
        "z2.cnzz.com",
        "s96.cnzz.com",
        "q11.cnzz.com",
        "thy.dacedsfa.cn",
        "xg.whsbpw.cn",
        "s19.cnzz.com",
        "z8.cnzz.com",
        "s4.cnzz.com",
        "f5w.as12df.top",
        "ae01.alicdn.com",
        "www.92424.cn",
        "k.wudejia.com",
        "vivovip.mmszxc.top",
        "qiu.xixiqiu.com",
        "cdnjs.hnfenxun.com",
        "cms.qdwght.com"
      ]
    };

    // 根据format参数返回不同格式
    if (format === 'txt') {
      // 返回base64编码的配置（TVBox常用格式）
      const configStr = JSON.stringify(tvboxConfig, null, 2);
      const base64Config = Buffer.from(configStr).toString('base64');

      return new NextResponse(base64Config, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Cache-Control': 'public, max-age=3600'
        }
      });
    } else {
      // 返回JSON格式
      return NextResponse.json(tvboxConfig, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Cache-Control': 'public, max-age=3600'
        }
      });
    }

  } catch (error) {
    return NextResponse.json(
      { error: 'TVBox配置生成失败', details: error instanceof Error ? error.message : String(error) },
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
