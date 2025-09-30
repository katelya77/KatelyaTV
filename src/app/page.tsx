/* eslint-disable react-hooks/exhaustive-deps */

'use client';

import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';

// 客户端收藏 API
import {
  type Favorite,
  clearAllFavorites,
  getAllFavorites,
  getAllPlayRecords,
  subscribeToDataUpdates,
} from '@/lib/db.client';
import { getDoubanCategories } from '@/lib/douban.client';
import { DoubanItem } from '@/lib/types';

import CapsuleSwitch from '@/components/CapsuleSwitch';
import ContinueWatching from '@/components/ContinueWatching';
import PageLayout from '@/components/PageLayout';
import PaginatedRow from '@/components/PaginatedRow';
import { useSite } from '@/components/SiteProvider';
import VideoCard from '@/components/VideoCard';

// 主内容区大型 KatelyaTV Logo 组件
const MainKatelyaLogo = () => {
  return (
    <div className='main-logo-container'>
      {/* 背景光效 */}
      <div className='logo-background-glow'></div>

      {/* 主 Logo */}
      <div className='main-katelya-logo'>KatelyaTV</div>

      {/* 副标题 */}
      <div className='mt-3 text-center'>
        <div className='main-logo-subtitle'>极致影视体验，尽在指尖</div>
      </div>

      {/* 装饰性粒子效果 */}
      <div className='logo-particles'>
        <div className='particle particle-1'></div>
        <div className='particle particle-2'></div>
        <div className='particle particle-3'></div>
        <div className='particle particle-4'></div>
        <div className='particle particle-5'></div>
        <div className='particle particle-6'></div>
      </div>
    </div>
  );
};

// KatelyaTV 底部 Logo 组件
const BottomKatelyaLogo = () => {
  return (
    <div className='bottom-logo-container'>
      {/* 浮动几何形状装饰 */}
      <div className='floating-shapes'>
        <div className='shape'></div>
        <div className='shape'></div>
        <div className='shape'></div>
        <div className='shape'></div>
      </div>

      <div className='text-center'>
        <div className='bottom-logo'>KatelyaTV</div>
        <div className='mt-2 text-sm text-gray-500 dark:text-gray-400 opacity-75'>
          Powered by KatelyaTV Core
        </div>
      </div>
    </div>
  );
};

function HomeClient() {
  const [activeTab, setActiveTab] = useState<'home' | 'favorites'>('home');
  const [hotMovies, setHotMovies] = useState<DoubanItem[]>([]);
  const [hotTvShows, setHotTvShows] = useState<DoubanItem[]>([]);
  const [hotVarietyShows, setHotVarietyShows] = useState<DoubanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { announcement } = useSite();

  // 分页状态管理
  const [moviePage, setMoviePage] = useState(0);
  const [tvShowPage, setTvShowPage] = useState(0);
  const [varietyShowPage, setVarietyShowPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState({
    movies: false,
    tvShows: false,
    varietyShows: false,
  });
  const [hasMoreData, setHasMoreData] = useState({
    movies: true,
    tvShows: true,
    varietyShows: true,
  });

  const [showAnnouncement, setShowAnnouncement] = useState(false);

  // 检查公告弹窗状态
  useEffect(() => {
    if (typeof window !== 'undefined' && announcement) {
      const hasSeenAnnouncement = localStorage.getItem('hasSeenAnnouncement');
      if (hasSeenAnnouncement !== announcement) {
        setShowAnnouncement(true);
      } else {
        setShowAnnouncement(Boolean(!hasSeenAnnouncement && announcement));
      }
    }
  }, [announcement]);

  // 收藏夹数据
  type FavoriteItem = {
    id: string;
    source: string;
    title: string;
    poster: string;
    episodes: number;
    source_name: string;
    currentEpisode?: number;
    search_title?: string;
  };

  const [favoriteItems, setFavoriteItems] = useState<FavoriteItem[]>([]);

  useEffect(() => {
    const fetchDoubanData = async () => {
      try {
        setLoading(true);

        // 并行获取热门电影、热门剧集和热门综艺
        const [moviesData, tvShowsData, varietyShowsData] = await Promise.all([
          getDoubanCategories({
            kind: 'movie',
            category: '热门',
            type: '全部',
          }),
          getDoubanCategories({ kind: 'tv', category: 'tv', type: 'tv' }),
          getDoubanCategories({ kind: 'tv', category: 'show', type: 'show' }),
        ]);

        if (moviesData.code === 200) {
          setHotMovies(moviesData.list);
        }

        if (tvShowsData.code === 200) {
          setHotTvShows(tvShowsData.list);
        }

        if (varietyShowsData.code === 200) {
          setHotVarietyShows(varietyShowsData.list);
        }
      } catch (error) {
        // 静默处理错误，避免控制台警告
        // console.error('获取豆瓣数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDoubanData();
  }, []);

  // 加载更多电影
  const loadMoreMovies = async () => {
    if (loadingMore.movies || !hasMoreData.movies) return;

    setLoadingMore(prev => ({ ...prev, movies: true }));
    try {
      const nextPage = moviePage + 1;
      const moviesData = await getDoubanCategories({
        kind: 'movie',
        category: '热门',
        type: '全部',
        pageStart: nextPage * 20,
        pageLimit: 20,
      });

      if (moviesData.code === 200 && moviesData.list.length > 0) {
        setHotMovies(prev => [...prev, ...moviesData.list]);
        setMoviePage(nextPage);
        // 如果返回的数据少于请求的数量，说明没有更多数据了
        if (moviesData.list.length < 20) {
          setHasMoreData(prev => ({ ...prev, movies: false }));
        }
      } else {
        setHasMoreData(prev => ({ ...prev, movies: false }));
      }
    } catch (error) {
      // 静默处理错误
    } finally {
      setLoadingMore(prev => ({ ...prev, movies: false }));
    }
  };

  // 加载更多剧集
  const loadMoreTvShows = async () => {
    if (loadingMore.tvShows || !hasMoreData.tvShows) return;

    setLoadingMore(prev => ({ ...prev, tvShows: true }));
    try {
      const nextPage = tvShowPage + 1;
      const tvShowsData = await getDoubanCategories({
        kind: 'tv',
        category: 'tv',
        type: 'tv',
        pageStart: nextPage * 20,
        pageLimit: 20,
      });

      if (tvShowsData.code === 200 && tvShowsData.list.length > 0) {
        setHotTvShows(prev => [...prev, ...tvShowsData.list]);
        setTvShowPage(nextPage);
        if (tvShowsData.list.length < 20) {
          setHasMoreData(prev => ({ ...prev, tvShows: false }));
        }
      } else {
        setHasMoreData(prev => ({ ...prev, tvShows: false }));
      }
    } catch (error) {
      // 静默处理错误
    } finally {
      setLoadingMore(prev => ({ ...prev, tvShows: false }));
    }
  };

  // 加载更多综艺
  const loadMoreVarietyShows = async () => {
    if (loadingMore.varietyShows || !hasMoreData.varietyShows) return;

    setLoadingMore(prev => ({ ...prev, varietyShows: true }));
    try {
      const nextPage = varietyShowPage + 1;
      const varietyShowsData = await getDoubanCategories({
        kind: 'tv',
        category: 'show',
        type: 'show',
        pageStart: nextPage * 20,
        pageLimit: 20,
      });

      if (varietyShowsData.code === 200 && varietyShowsData.list.length > 0) {
        setHotVarietyShows(prev => [...prev, ...varietyShowsData.list]);
        setVarietyShowPage(nextPage);
        if (varietyShowsData.list.length < 20) {
          setHasMoreData(prev => ({ ...prev, varietyShows: false }));
        }
      } else {
        setHasMoreData(prev => ({ ...prev, varietyShows: false }));
      }
    } catch (error) {
      // 静默处理错误
    } finally {
      setLoadingMore(prev => ({ ...prev, varietyShows: false }));
    }
  };

  // 处理收藏数据更新的函数
  const updateFavoriteItems = async (allFavorites: Record<string, Favorite>) => {
    const allPlayRecords = await getAllPlayRecords();

    // 根据保存时间排序（从近到远）
    const sorted = Object.entries(allFavorites)
      .sort(([, a], [, b]) => b.save_time - a.save_time)
      .map(([key, fav]) => {
        const plusIndex = key.indexOf('+');
        const source = key.slice(0, plusIndex);
        const id = key.slice(plusIndex + 1);

        // 查找对应的播放记录，获取当前集数
        const playRecord = allPlayRecords[key];
        const currentEpisode = playRecord?.index;

        return {
          id,
          source,
          title: fav.title,
          year: fav.year,
          poster: fav.cover,
          episodes: fav.total_episodes,
          source_name: fav.source_name,
          currentEpisode,
          search_title: fav?.search_title,
        } as FavoriteItem;
      });
    setFavoriteItems(sorted);
  };

  // 当切换到收藏夹时加载收藏数据
  useEffect(() => {
    if (activeTab !== 'favorites') return;

    const loadFavorites = async () => {
      const allFavorites = await getAllFavorites();
      await updateFavoriteItems(allFavorites);
    };

    loadFavorites();

    // 监听收藏更新事件
    const unsubscribe = subscribeToDataUpdates(
      'favoritesUpdated',
      (newFavorites: Record<string, Favorite>) => {
        updateFavoriteItems(newFavorites);
      }
    );

    return unsubscribe;
  }, [activeTab]);

  const handleCloseAnnouncement = (announcement: string) => {
    setShowAnnouncement(false);
    localStorage.setItem('hasSeenAnnouncement', announcement); // 记录已查看弹窗
  };

  return (
    <PageLayout>
      <div className='px-4 sm:px-8 lg:px-12 py-4 sm:py-8 overflow-visible'>
        {/* 主内容区大型 KatelyaTV Logo - 仅在首页显示 */}
        {activeTab === 'home' && <MainKatelyaLogo />}

        {/* 顶部 Tab 切换 */}
        <div className='mb-8 flex justify-center'>
          <CapsuleSwitch
            options={[
              { label: '首页', value: 'home' },
              { label: '收藏夹', value: 'favorites' },
            ]}
            active={activeTab}
            onChange={(value) => setActiveTab(value as 'home' | 'favorites')}
          />
        </div>

        {/* 主内容区域 - 优化为完全居中布局 */}
        <div className='w-full max-w-none mx-auto'>
          {activeTab === 'favorites' ? (
            // 收藏夹视图
            <>
              <section className='mb-8'>
                <div className='mb-4 flex items-center justify-between'>
                  <h2 className='text-xl font-bold text-gray-800 dark:text-gray-200'>
                    我的收藏
                  </h2>
                  {favoriteItems.length > 0 && (
                    <button
                      className='text-sm text-gray-500 hover:text-purple-700 dark:text-gray-400 dark:hover:text-purple-300 transition-colors'
                      onClick={async () => {
                        await clearAllFavorites();
                        setFavoriteItems([]);
                      }}
                    >
                      清空
                    </button>
                  )}
                </div>
                {/* 优化收藏夹网格布局，确保在新的居中布局下完美对齐 */}
                <div className='grid grid-cols-3 gap-x-2 gap-y-14 sm:gap-y-20 px-0 sm:px-2 sm:grid-cols-[repeat(auto-fill,_minmax(11rem,_1fr))] sm:gap-x-6 lg:gap-x-8 justify-items-center'>
                  {favoriteItems.map((item) => (
                    <div
                      key={item.id + item.source}
                      className='w-full max-w-44'
                    >
                      <VideoCard
                        query={item.search_title}
                        {...item}
                        from='favorite'
                        type={item.episodes > 1 ? 'tv' : ''}
                      />
                    </div>
                  ))}
                  {favoriteItems.length === 0 && (
                    <div className='col-span-full text-center text-gray-500 py-8 dark:text-gray-400'>
                      暂无收藏内容
                    </div>
                  )}
                </div>
              </section>

              {/* 收藏夹页面底部 Logo */}
              <BottomKatelyaLogo />
            </>
          ) : (
            // 首页视图
            <>
              {/* 继续观看 */}
              <ContinueWatching />

              {/* 热门电影 */}
              <section className='mb-8'>
                <div className='mb-4 flex items-center justify-between'>
                  <h2 className='text-xl font-bold text-gray-800 dark:text-gray-200'>
                    热门电影
                  </h2>
                  <Link
                    href='/douban?type=movie'
                    className='flex items-center text-sm text-gray-500 hover:text-purple-700 dark:text-gray-400 dark:hover:text-purple-300 transition-colors'
                  >
                    查看更多
                    <ChevronRight className='w-4 h-4 ml-1' />
                  </Link>
                </div>
                <PaginatedRow 
                  itemsPerPage={10}
                  onLoadMore={loadMoreMovies}
                  hasMoreData={hasMoreData.movies}
                  isLoading={loadingMore.movies}
                >
                  {loading
                    ? // 加载状态显示灰色占位数据 (显示10个，2行x5列)
                      Array.from({ length: 10 }).map((_, index) => (
                        <div
                          key={index}
                          className='w-full'
                        >
                          <div className='relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-purple-200 animate-pulse dark:bg-purple-800'>
                            <div className='absolute inset-0 bg-purple-300 dark:bg-purple-700'></div>
                          </div>
                          <div className='mt-2 h-4 bg-purple-200 rounded animate-pulse dark:bg-purple-800'></div>
                        </div>
                      ))
                    : // 显示真实数据
                      hotMovies.map((movie, index) => (
                        <div
                          key={index}
                          className='w-full'
                        >
                          <VideoCard
                            from='douban'
                            title={movie.title}
                            poster={movie.poster}
                            douban_id={movie.id}
                            rate={movie.rate}
                            year={movie.year}
                            type='movie'
                          />
                        </div>
                      ))}
                </PaginatedRow>
              </section>

              {/* 热门剧集 */}
              <section className='mb-8'>
                <div className='mb-4 flex items-center justify-between'>
                  <h2 className='text-xl font-bold text-gray-800 dark:text-gray-200'>
                    热门剧集
                  </h2>
                  <Link
                    href='/douban?type=tv'
                    className='flex items-center text-sm text-gray-500 hover:text-purple-700 dark:text-gray-400 dark:hover:text-purple-300 transition-colors'
                  >
                    查看更多
                    <ChevronRight className='w-4 h-4 ml-1' />
                  </Link>
                </div>
                <PaginatedRow 
                  itemsPerPage={10}
                  onLoadMore={loadMoreTvShows}
                  hasMoreData={hasMoreData.tvShows}
                  isLoading={loadingMore.tvShows}
                >
                  {loading
                    ? // 加载状态显示灰色占位数据 (显示10个，2行x5列)
                      Array.from({ length: 10 }).map((_, index) => (
                        <div
                          key={index}
                          className='w-full'
                        >
                          <div className='relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-purple-200 animate-pulse dark:bg-purple-800'>
                            <div className='absolute inset-0 bg-purple-300 dark:bg-purple-700'></div>
                          </div>
                          <div className='mt-2 h-4 bg-purple-200 rounded animate-pulse dark:bg-purple-800'></div>
                        </div>
                      ))
                    : // 显示真实数据
                      hotTvShows.map((show, index) => (
                        <div
                          key={index}
                          className='w-full'
                        >
                          <VideoCard
                            from='douban'
                            title={show.title}
                            poster={show.poster}
                            douban_id={show.id}
                            rate={show.rate}
                            year={show.year}
                          />
                        </div>
                      ))}
                </PaginatedRow>
              </section>

              {/* 热门综艺 */}
              <section className='mb-8'>
                <div className='mb-4 flex items-center justify-between'>
                  <h2 className='text-xl font-bold text-gray-800 dark:text-gray-200'>
                    热门综艺
                  </h2>
                  <Link
                    href='/douban?type=show'
                    className='flex items-center text-sm text-gray-500 hover:text-purple-700 dark:text-gray-400 dark:hover:text-purple-300 transition-colors'
                  >
                    查看更多
                    <ChevronRight className='w-4 h-4 ml-1' />
                  </Link>
                </div>
                <PaginatedRow 
                  itemsPerPage={10}
                  onLoadMore={loadMoreVarietyShows}
                  hasMoreData={hasMoreData.varietyShows}
                  isLoading={loadingMore.varietyShows}
                >
                  {loading
                    ? // 加载状态显示灰色占位数据 (显示10个，2行x5列)
                      Array.from({ length: 10 }).map((_, index) => (
                        <div
                          key={index}
                          className='w-full'
                        >
                          <div className='relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-purple-200 animate-pulse dark:bg-purple-800'>
                            <div className='absolute inset-0 bg-purple-300 dark:bg-purple-700'></div>
                          </div>
                          <div className='mt-2 h-4 bg-purple-200 rounded animate-pulse dark:bg-purple-800'></div>
                        </div>
                      ))
                    : // 显示真实数据
                      hotVarietyShows.map((show, index) => (
                        <div
                          key={index}
                          className='w-full'
                        >
                          <VideoCard
                            from='douban'
                            title={show.title}
                            poster={show.poster}
                            douban_id={show.id}
                            rate={show.rate}
                            year={show.year}
                          />
                        </div>
                      ))}
                </PaginatedRow>
              </section>

              {/* 首页底部 Logo */}
              <BottomKatelyaLogo />
            </>
          )}
        </div>
      </div>
      {announcement && showAnnouncement && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm dark:bg-black/70 p-4 transition-opacity duration-300 ${
            showAnnouncement ? '' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className='w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900 transform transition-all duration-300 hover:shadow-2xl'>
            <div className='flex justify-between items-start mb-4'>
              <h3 className='text-2xl font-bold tracking-tight text-gray-800 dark:text-white border-b border-purple-500 pb-1'>
                提示
              </h3>
              <button
                onClick={() => handleCloseAnnouncement(announcement)}
                className='text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-white transition-colors'
                aria-label='关闭'
              ></button>
            </div>
            <div className='mb-6'>
              <div className='relative overflow-hidden rounded-lg mb-4 bg-purple-50 dark:bg-purple-900/20'>
                <div className='absolute inset-y-0 left-0 w-1.5 bg-purple-500 dark:bg-purple-400'></div>
                <p className='ml-4 text-gray-600 dark:text-gray-300 leading-relaxed'>
                  {announcement}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleCloseAnnouncement(announcement)}
              className='w-full rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 px-4 py-3 text-white font-medium shadow-md hover:shadow-lg hover:from-purple-700 hover:to-purple-800 dark:from-purple-600 dark:to-purple-700 dark:hover:from-purple-700 dark:hover:to-purple-800 transition-all duration-300 transform hover:-translate-y-0.5'
            >
              我知道了
            </button>
          </div>
        </div>
      )}
    </PageLayout>
  );
}

export default function Home() {
  return (
    <Suspense>
      <HomeClient />
    </Suspense>
  );
}
