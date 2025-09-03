import { NextResponse } from 'next/server';

// 针对不同部署模式的配置
export const runtime = process.env.CLOUDFLARE_PAGES === '1' ? 'edge' : 'nodejs';
// 注意：dynamic = "force-dynamic" 不能与 output: export 一起使用

export async function GET() {
  try {
    // 为静态导出提供默认频道列表
    const defaultChannels = [
      {
        name: "CCTV-1 综合",
        url: "https://live.v1.mk/api/bestv.php?id=cctv1hd8m/8000000",
        logo: "",
        group: "央视频道",
        epgId: "cctv1"
      },
      {
        name: "CCTV-3 综艺", 
        url: "https://live.v1.mk/api/bestv.php?id=cctv3hd8m/8000000",
        logo: "",
        group: "央视频道",
        epgId: "cctv3"
      },
      {
        name: "CCTV-5 体育",
        url: "https://live.v1.mk/api/bestv.php?id=cctv5hd8m/8000000", 
        logo: "",
        group: "央视频道",
        epgId: "cctv5"
      },
      {
        name: "CCTV-6 电影",
        url: "https://live.v1.mk/api/bestv.php?id=cctv6hd8m/8000000",
        logo: "",
        group: "央视频道", 
        epgId: "cctv6"
      }
    ];

    return NextResponse.json({
      channels: defaultChannels,
      source: 'default',
      count: defaultChannels.length
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Live channels API error:', error);
    return NextResponse.json(
      { error: '获取频道列表失败' },
      { status: 500 }
    );
  }
}