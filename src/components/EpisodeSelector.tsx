'use client';

/* eslint-disable @next/next/no-img-element */

import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { scrollIntoViewIfNeeded } from '@/lib/tv-utils';
import { SearchResult } from '@/lib/types';
import { getVideoResolutionFromM3u8, processImageUrl } from '@/lib/utils';

import { useTVMode } from '@/components/tv/TVModeProvider';

// 定义视频信息类型
interface VideoInfo {
  quality: string;
  loadSpeed: string;
  pingTime: number;
  hasError?: boolean;
}

interface EpisodeSelectorProps {
  /** 总集数 */
  totalEpisodes: number;
  /** 每页显示多少集，默认 10 */
  episodesPerPage?: number;
  /** 当前选中的集数（1 开始） */
  value?: number;
  /** 用户点击选集后的回调 */
  onChange?: (episodeNumber: number) => void;
  /** 换源相关 */
  onSourceChange?: (source: string, id: string, title: string) => void;
  currentSource?: string;
  currentId?: string;
  videoTitle?: string;
  videoYear?: string;
  availableSources?: SearchResult[];
  sourceSearchLoading?: boolean;
  sourceSearchError?: string | null;
  /** 预计算的测速结果，避免重复测速 */
  precomputedVideoInfo?: Map<string, VideoInfo>;
}

/**
 * 选集组件，支持分页、自动滚动聚焦当前分页标签，以及换源功能。
 */
const EpisodeSelector: React.FC<EpisodeSelectorProps> = ({
  totalEpisodes,
  episodesPerPage = 10,
  value = 1,
  onChange,
  onSourceChange,
  currentSource,
  currentId,
  videoTitle,
  availableSources = [],
  sourceSearchLoading = false,
  sourceSearchError = null,
  precomputedVideoInfo,
}) => {
  const router = useRouter();
  const { isTVMode } = useTVMode();
  const pageCount = Math.ceil(totalEpisodes / episodesPerPage);

  // 存储每个源的视频信息
  const [videoInfoMap, setVideoInfoMap] = useState<Map<string, VideoInfo>>(
    new Map()
  );
  const [attemptedSources, setAttemptedSources] = useState<Set<string>>(
    new Set()
  );

  // 使用 ref 来避免闭包问题
  const attemptedSourcesRef = useRef<Set<string>>(new Set());
  const videoInfoMapRef = useRef<Map<string, VideoInfo>>(new Map());

  // 同步状态到 ref
  useEffect(() => {
    attemptedSourcesRef.current = attemptedSources;
  }, [attemptedSources]);

  useEffect(() => {
    videoInfoMapRef.current = videoInfoMap;
  }, [videoInfoMap]);

  // 主要的 tab 状态：'episodes' 或 'sources'
  // 当只有一集时默认展示 "换源"，并隐藏 "选集" 标签
  const [activeTab, setActiveTab] = useState<'episodes' | 'sources'>(
    totalEpisodes > 1 ? 'episodes' : 'sources'
  );

  // 当前分页索引（0 开始）
  const initialPage = Math.floor((value - 1) / episodesPerPage);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);

  // 是否倒序显示
  const [descending, setDescending] = useState<boolean>(false);

  // 获取视频信息的函数
  const getVideoInfo = useCallback(async (source: SearchResult) => {
    const sourceKey = `${source.source}-${source.id}`;

    // 使用 ref 获取最新的状态，避免闭包问题
    if (attemptedSourcesRef.current.has(sourceKey)) {
      return;
    }

    // 获取第一集的URL
    if (!source.episodes || source.episodes.length === 0) {
      return;
    }
    const episodeUrl =
      source.episodes.length > 1 ? source.episodes[1] : source.episodes[0];

    // 标记为已尝试
    setAttemptedSources((prev) => new Set(prev).add(sourceKey));

    try {
      const info = await getVideoResolutionFromM3u8(episodeUrl);
      setVideoInfoMap((prev) => new Map(prev).set(sourceKey, info));
    } catch (error) {
      // 失败时保存错误状态
      setVideoInfoMap((prev) =>
        new Map(prev).set(sourceKey, {
          quality: '错误',
          loadSpeed: '未知',
          pingTime: 0,
          hasError: true,
        })
      );
    }
  }, []);

  // 当有预计算结果时，先合并到videoInfoMap中
  useEffect(() => {
    if (precomputedVideoInfo && precomputedVideoInfo.size > 0) {
      setVideoInfoMap((prev) => {
        const newMap = new Map(prev);
        precomputedVideoInfo.forEach((value, key) => {
          newMap.set(key, value);
        });
        return newMap;
      });

      setAttemptedSources((prev) => {
        const newSet = new Set(prev);
        precomputedVideoInfo.forEach((info, key) => {
          newSet.add(key);
        });
        return newSet;
      });
    }
  }, [precomputedVideoInfo]);

  // 当换源Tab激活且没有测速过时，开始测速
  useEffect(() => {
    if (activeTab === 'sources') {
      availableSources.forEach((source) => {
        const sourceKey = `${source.source}-${source.id}`;
        if (!attemptedSourcesRef.current.has(sourceKey)) {
          getVideoInfo(source);
        }
      });
    }
  }, [activeTab, availableSources, getVideoInfo]);

  // 分类标签容器和按钮的引用
  const categoryContainerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // TV mode refs for tab navigation
  const episodesTabRef = useRef<HTMLDivElement>(null);
  const sourcesTabRef = useRef<HTMLDivElement>(null);
  const episodeGridRef = useRef<HTMLDivElement>(null);
  const sourceListRef = useRef<HTMLDivElement>(null);

  // 自动滚动到当前分页标签
  useEffect(() => {
    if (categoryContainerRef.current && buttonRefs.current[currentPage]) {
      const container = categoryContainerRef.current;
      const button = buttonRefs.current[currentPage];

      if (button) {
        const containerRect = container.getBoundingClientRect();
        const buttonRect = button.getBoundingClientRect();
        const scrollLeft = container.scrollLeft;

        if (buttonRect.left < containerRect.left) {
          container.scrollTo({
            left: scrollLeft - (containerRect.left - buttonRect.left) - 20,
            behavior: 'smooth',
          });
        } else if (buttonRect.right > containerRect.right) {
          container.scrollTo({
            left: scrollLeft + (buttonRect.right - containerRect.right) + 20,
            behavior: 'smooth',
          });
        }
      }
    }
  }, [currentPage]);

  // TV mode: Handle D-Pad left/right for tab switching
  useEffect(() => {
    if (!isTVMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;

      // Check if focus is on a tab element
      const isOnEpisodesTab = episodesTabRef.current?.contains(
        activeElement as Node
      );
      const isOnSourcesTab = sourcesTabRef.current?.contains(
        activeElement as Node
      );
      const isOnTab = isOnEpisodesTab || isOnSourcesTab;

      if (isOnTab) {
        if (e.key === 'ArrowLeft' || e.key === 'Left') {
          e.preventDefault();
          if (activeTab === 'sources' && totalEpisodes > 1) {
            setActiveTab('episodes');
            // Focus the episodes tab after state update
            setTimeout(() => {
              episodesTabRef.current?.focus();
            }, 0);
          }
        } else if (e.key === 'ArrowRight' || e.key === 'Right') {
          e.preventDefault();
          if (activeTab === 'episodes') {
            setActiveTab('sources');
            // Focus the sources tab after state update
            setTimeout(() => {
              sourcesTabRef.current?.focus();
            }, 0);
          }
        } else if (e.key === 'ArrowDown' || e.key === 'Down') {
          e.preventDefault();
          // Move focus to the first item in the active tab content
          if (activeTab === 'episodes' && episodeGridRef.current) {
            const firstButton = episodeGridRef.current.querySelector('button');
            if (firstButton) {
              (firstButton as HTMLElement).focus();
              scrollIntoViewIfNeeded(firstButton as HTMLElement);
            }
          } else if (activeTab === 'sources' && sourceListRef.current) {
            const firstItem = sourceListRef.current.querySelector(
              '[data-tv-focusable="true"]'
            );
            if (firstItem) {
              (firstItem as HTMLElement).focus();
              scrollIntoViewIfNeeded(firstItem as HTMLElement);
            }
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isTVMode, activeTab, totalEpisodes]);

  // 生成分页标签 - 优化显示逻辑
  const categories = Array.from({ length: pageCount }, (_, i) => {
    const start = i * episodesPerPage + 1;
    const end = Math.min(start + episodesPerPage - 1, totalEpisodes);

    // 对于很大的数字，使用更紧凑的显示方式
    if (start === end) {
      return `${start}`;
    } else if (start >= 1000 || end >= 1000) {
      // 对于千位数以上，使用缩写形式
      const formatNumber = (num: number) => {
        if (num >= 1000) {
          return `${Math.floor(num / 100) / 10}k`;
        }
        return num.toString();
      };
      return `${formatNumber(start)}-${formatNumber(end)}`;
    } else {
      return `${start}-${end}`;
    }
  });

  // 处理换源tab点击，只在点击时才搜索
  const handleSourceTabClick = () => {
    setActiveTab('sources');
  };

  const handleCategoryClick = useCallback((index: number) => {
    setCurrentPage(index);
  }, []);

  const handleEpisodeClick = useCallback(
    (episodeNumber: number) => {
      onChange?.(episodeNumber);
    },
    [onChange]
  );

  const handleSourceClick = useCallback(
    (source: SearchResult) => {
      onSourceChange?.(source.source, source.id, source.title);
    },
    [onSourceChange]
  );

  const currentStart = currentPage * episodesPerPage + 1;
  const currentEnd = Math.min(
    currentStart + episodesPerPage - 1,
    totalEpisodes
  );

  return (
    <div className='md:ml-2 px-4 py-0 min-h-[200px] max-h-[600px] rounded-xl bg-black/10 dark:bg-white/5 flex flex-col border border-white/0 dark:border-white/30 overflow-hidden'>
      {/* 主要的 Tab 切换 - 无缝融入设计 */}
      <div className='flex mb-1 -mx-6 flex-shrink-0' role='tablist'>
        {totalEpisodes > 1 && (
          <div
            ref={episodesTabRef}
            role='tab'
            aria-selected={activeTab === 'episodes'}
            tabIndex={isTVMode ? 0 : -1}
            onClick={() => setActiveTab('episodes')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setActiveTab('episodes');
              }
            }}
            data-tv-focusable={isTVMode ? 'true' : undefined}
            className={`flex-1 py-3 px-6 text-center cursor-pointer transition-all duration-200 font-medium
                ${
                  activeTab === 'episodes'
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-gray-700 hover:text-green-600 bg-black/5 dark:bg-white/5 dark:text-gray-300 dark:hover:text-green-400 hover:bg-black/3 dark:hover:bg-white/3'
                }
                ${
                  isTVMode
                    ? 'focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-black/10 dark:focus:ring-offset-white/5'
                    : ''
                }
            `.trim()}
          >
            选集
          </div>
        )}
        <div
          ref={sourcesTabRef}
          role='tab'
          aria-selected={activeTab === 'sources'}
          tabIndex={isTVMode ? 0 : -1}
          onClick={handleSourceTabClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleSourceTabClick();
            }
          }}
          data-tv-focusable={isTVMode ? 'true' : undefined}
          className={`flex-1 py-3 px-6 text-center cursor-pointer transition-all duration-200 font-medium
                ${
                  activeTab === 'sources'
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-gray-700 hover:text-green-600 bg-black/5 dark:bg-white/5 dark:text-gray-300 dark:hover:text-green-400 hover:bg-black/3 dark:hover:bg-white/3'
                }
                ${
                  isTVMode
                    ? 'focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-black/10 dark:focus:ring-offset-white/5'
                    : ''
                }
            `.trim()}
        >
          换源
        </div>
      </div>

      {/* 选集 Tab 内容 */}
      {activeTab === 'episodes' && (
        <div className='flex flex-col flex-1 min-h-0'>
          {/* 分类标签 */}
          <div className='flex items-center gap-4 mb-4 border-b border-gray-300 dark:border-gray-700 -mx-6 px-6 flex-shrink-0'>
            <div className='flex-1 relative overflow-hidden'>
              {/* 滾動容器 */}
              <div
                className='overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600 hover:[&::-webkit-scrollbar-thumb]:bg-gray-400 dark:hover:[&::-webkit-scrollbar-thumb]:bg-gray-500 snap-x snap-mandatory scroll-smooth'
                ref={categoryContainerRef}
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgb(209 213 219) transparent',
                  msOverflowStyle: 'none',
                  WebkitOverflowScrolling: 'touch',
                }}
              >
                <div className='flex gap-2 min-w-max px-6 py-1'>
                  {categories.map((label, idx) => {
                    const isActive = idx === currentPage;
                    // 动态计算按钮宽度，根据标签长度和内容调整
                    const getButtonWidth = (text: string) => {
                      if (text.length <= 2) return 'w-12'; // 单个数字
                      if (text.length <= 5) return 'w-16'; // 如 "1-10"
                      if (text.length <= 8) return 'w-20'; // 如 "101-110"
                      if (text.length <= 11) return 'w-24'; // 如 "1001-1010"
                      return 'w-28'; // 更长的标签
                    };

                    const buttonWidth = getButtonWidth(label);

                    return (
                      <button
                        key={label}
                        ref={(el) => {
                          buttonRefs.current[idx] = el;
                        }}
                        tabIndex={isTVMode ? 0 : undefined}
                        data-tv-focusable={isTVMode ? 'true' : undefined}
                        onClick={() => handleCategoryClick(idx)}
                        className={`${buttonWidth} relative py-2 px-1 text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 text-center
                          ${
                            isActive
                              ? 'text-green-500 dark:text-green-400'
                              : 'text-gray-700 hover:text-green-600 dark:text-gray-300 dark:hover:text-green-400'
                          }
                          ${
                            isTVMode
                              ? 'focus:outline-none focus:ring-2 focus:ring-green-500 focus:rounded'
                              : ''
                          }
                        `.trim()}
                        title={`第 ${idx * episodesPerPage + 1}-${Math.min(
                          (idx + 1) * episodesPerPage,
                          totalEpisodes
                        )} 集`}
                      >
                        <span className='block truncate'>{label}</span>
                        {isActive && (
                          <div className='absolute bottom-0 left-0 right-0 h-0.5 bg-green-500 dark:bg-green-400' />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            {/* 向上/向下按钮 */}
            <button
              tabIndex={isTVMode ? 0 : undefined}
              data-tv-focusable={isTVMode ? 'true' : undefined}
              className={`flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center text-gray-700 hover:text-green-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-green-400 dark:hover:bg-white/20 transition-colors transform translate-y-[-4px]
                ${
                  isTVMode
                    ? 'focus:outline-none focus:ring-2 focus:ring-green-500'
                    : ''
                }
              `.trim()}
              onClick={() => {
                // 切换集数排序（正序/倒序）
                setDescending((prev) => !prev);
              }}
            >
              <svg
                className='w-4 h-4'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4'
                />
              </svg>
            </button>
          </div>

          {/* 集数网格 */}
          <div
            ref={episodeGridRef}
            className={`flex-1 grid grid-cols-[repeat(auto-fill,minmax(48px,1fr))] justify-center gap-2 overflow-y-auto pb-4 ${
              isTVMode ? 'tv-episode-grid' : ''
            }`}
            role='tabpanel'
          >
            {(() => {
              const len = currentEnd - currentStart + 1;
              const episodes = Array.from({ length: len }, (_, i) =>
                descending ? currentEnd - i : currentStart + i
              );
              return episodes;
            })().map((episodeNumber) => {
              const isActive = episodeNumber === value;
              return (
                <button
                  key={episodeNumber}
                  tabIndex={isTVMode ? 0 : undefined}
                  data-tv-focusable={isTVMode ? 'true' : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleEpisodeClick(episodeNumber);
                  }}
                  className={`w-full h-10 flex items-center justify-center text-sm font-medium rounded-md transition-all duration-200 cursor-pointer episode-btn
                    ${
                      isActive
                        ? 'bg-green-500 text-white shadow-lg shadow-green-500/25 dark:bg-green-600'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:scale-105 dark:bg-white/10 dark:text-gray-300 dark:hover:bg-white/20'
                    }
                    ${
                      isTVMode
                        ? 'focus:outline-none focus:ring-2 focus:ring-green-500 focus:scale-110 focus:z-10'
                        : ''
                    }
                  `.trim()}
                  type='button'
                >
                  {episodeNumber}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 换源 Tab 内容 */}
      {activeTab === 'sources' && (
        <div className='flex flex-col flex-1 min-h-0 mt-4'>
          {sourceSearchLoading && (
            <div className='flex items-center justify-center py-8'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-green-500'></div>
              <span className='ml-2 text-sm text-gray-600 dark:text-gray-300'>
                搜索中...
              </span>
            </div>
          )}

          {sourceSearchError && (
            <div className='flex items-center justify-center py-8'>
              <div className='text-center'>
                <div className='text-red-500 text-2xl mb-2'>⚠️</div>
                <p className='text-sm text-red-600 dark:text-red-400'>
                  {sourceSearchError}
                </p>
              </div>
            </div>
          )}

          {!sourceSearchLoading &&
            !sourceSearchError &&
            availableSources.length === 0 && (
              <div className='flex items-center justify-center py-8'>
                <div className='text-center'>
                  <div className='text-gray-400 text-2xl mb-2'>📺</div>
                  <p className='text-sm text-gray-600 dark:text-gray-300'>
                    暂无可用的换源
                  </p>
                </div>
              </div>
            )}

          {!sourceSearchLoading &&
            !sourceSearchError &&
            availableSources.length > 0 && (
              <div
                ref={sourceListRef}
                className='flex-1 overflow-y-auto space-y-2 pb-4'
                role='tabpanel'
              >
                {availableSources
                  .sort((a, b) => {
                    const aIsCurrent =
                      a.source?.toString() === currentSource?.toString() &&
                      a.id?.toString() === currentId?.toString();
                    const bIsCurrent =
                      b.source?.toString() === currentSource?.toString() &&
                      b.id?.toString() === currentId?.toString();
                    if (aIsCurrent && !bIsCurrent) return -1;
                    if (!aIsCurrent && bIsCurrent) return 1;
                    return 0;
                  })
                  .map((source, index) => {
                    const isCurrentSource =
                      source.source?.toString() === currentSource?.toString() &&
                      source.id?.toString() === currentId?.toString();
                    return (
                      <div
                        key={`${source.source}-${source.id}`}
                        tabIndex={isTVMode ? 0 : undefined}
                        data-tv-focusable={isTVMode ? 'true' : undefined}
                        role='option'
                        aria-selected={isCurrentSource}
                        onClick={() =>
                          !isCurrentSource && handleSourceClick(source)
                        }
                        onKeyDown={(e) => {
                          if (
                            isTVMode &&
                            (e.key === 'Enter' || e.key === ' ')
                          ) {
                            e.preventDefault();
                            if (!isCurrentSource) {
                              handleSourceClick(source);
                            }
                          }
                        }}
                        className={`flex items-start gap-3 px-2 py-3 rounded-lg transition-all select-none duration-200 relative
                          ${
                            isCurrentSource
                              ? 'bg-green-500/10 dark:bg-green-500/20 border-green-500/30 border'
                              : 'hover:bg-gray-200/50 dark:hover:bg-white/10 hover:scale-[1.02] cursor-pointer'
                          }
                          ${
                            isTVMode
                              ? 'focus:outline-none focus:ring-2 focus:ring-green-500 focus:scale-[1.02] focus:bg-gray-200/50 dark:focus:bg-white/10'
                              : ''
                          }
                        `.trim()}
                      >
                        {/* 封面 */}
                        <div className='flex-shrink-0 w-12 h-20 bg-gray-300 dark:bg-gray-600 rounded overflow-hidden'>
                          {source.episodes && source.episodes.length > 0 && (
                            <img
                              src={processImageUrl(source.poster)}
                              alt={source.title}
                              className='w-full h-full object-cover'
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                          )}
                        </div>

                        {/* 信息区域 */}
                        <div className='flex-1 min-w-0 flex flex-col justify-between h-20'>
                          {/* 标题和分辨率 - 顶部 */}
                          <div className='flex items-start justify-between gap-3 h-6'>
                            <div className='flex-1 min-w-0 relative group/title'>
                              <h3 className='font-medium text-base truncate text-gray-900 dark:text-gray-100 leading-none'>
                                {source.title}
                              </h3>
                              {/* 标题级别的 tooltip - 第一个元素不显示 */}
                              {index !== 0 && (
                                <div className='absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-800 text-white text-xs rounded-md shadow-lg opacity-0 invisible group-hover/title:opacity-100 group-hover/title:visible transition-all duration-200 ease-out delay-100 whitespace-nowrap z-[500] pointer-events-none'>
                                  {source.title}
                                  <div className='absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800'></div>
                                </div>
                              )}
                            </div>
                            {(() => {
                              const sourceKey = `${source.source}-${source.id}`;
                              const videoInfo = videoInfoMap.get(sourceKey);
                              if (videoInfo && videoInfo.quality !== '未知') {
                                if (videoInfo.hasError) {
                                  return (
                                    <div className='bg-gray-500/10 dark:bg-gray-400/20 text-red-600 dark:text-red-400 px-1.5 py-0 rounded text-xs flex-shrink-0 min-w-[50px] text-center'>
                                      检测失败
                                    </div>
                                  );
                                } else {
                                  // 根据分辨率设置不同颜色：2K、4K为紫色，1080p、720p为绿色，其他为黄色
                                  const isUltraHigh = ['4K', '2K'].includes(
                                    videoInfo.quality
                                  );
                                  const isHigh = ['1080p', '720p'].includes(
                                    videoInfo.quality
                                  );
                                  const textColorClasses = isUltraHigh
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : isHigh
                                    ? 'text-green-600 dark:text-green-400'
                                    : 'text-yellow-600 dark:text-yellow-400';

                                  return (
                                    <div
                                      className={`bg-gray-500/10 dark:bg-gray-400/20 ${textColorClasses} px-1.5 py-0 rounded text-xs flex-shrink-0 min-w-[50px] text-center`}
                                    >
                                      {videoInfo.quality}
                                    </div>
                                  );
                                }
                              }

                              return null;
                            })()}
                          </div>

                          {/* 源名称和集数信息 - 垂直居中 */}
                          <div className='flex items-center justify-between'>
                            <span className='text-xs px-2 py-1 border border-gray-500/60 rounded text-gray-700 dark:text-gray-300'>
                              {source.source_name}
                            </span>
                            {source.episodes.length > 1 && (
                              <span className='text-xs text-gray-500 dark:text-gray-400 font-medium'>
                                {source.episodes.length} 集
                              </span>
                            )}
                          </div>

                          {/* 网络信息 - 底部 */}
                          <div className='flex items-end h-6'>
                            {(() => {
                              const sourceKey = `${source.source}-${source.id}`;
                              const videoInfo = videoInfoMap.get(sourceKey);
                              if (videoInfo) {
                                if (!videoInfo.hasError) {
                                  return (
                                    <div className='flex items-end gap-3 text-xs'>
                                      <div className='text-green-600 dark:text-green-400 font-medium text-xs'>
                                        {videoInfo.loadSpeed}
                                      </div>
                                      <div className='text-orange-600 dark:text-orange-400 font-medium text-xs'>
                                        {videoInfo.pingTime}ms
                                      </div>
                                    </div>
                                  );
                                } else {
                                  return (
                                    <div className='text-red-500/90 dark:text-red-400 font-medium text-xs'>
                                      无测速数据
                                    </div>
                                  );
                                }
                              }
                            })()}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                <div className='flex-shrink-0 mt-auto pt-2 border-t border-gray-400 dark:border-gray-700'>
                  <button
                    tabIndex={isTVMode ? 0 : undefined}
                    data-tv-focusable={isTVMode ? 'true' : undefined}
                    onClick={() => {
                      if (videoTitle) {
                        router.push(
                          `/search?q=${encodeURIComponent(videoTitle)}`
                        );
                      }
                    }}
                    className={`w-full text-center text-xs text-gray-500 dark:text-gray-400 hover:text-green-500 dark:hover:text-green-400 transition-colors py-2
                      ${
                        isTVMode
                          ? 'focus:outline-none focus:ring-2 focus:ring-green-500 focus:text-green-500 dark:focus:text-green-400 rounded'
                          : ''
                      }
                    `.trim()}
                  >
                    影片匹配有误？点击去搜索
                  </button>
                </div>
              </div>
            )}
        </div>
      )}
    </div>
  );
};

export default EpisodeSelector;
