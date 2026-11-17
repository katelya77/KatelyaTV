/* eslint-disable @typescript-eslint/no-explicit-any, no-console */
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  deleteSkipConfig,
  EpisodeSkipConfig,
  getSkipConfig,
  saveSkipConfig,
  SkipSegment,
} from '@/lib/db.client';

interface SkipControllerProps {
  source: string;
  id: string;
  title: string;
  artPlayerRef: React.MutableRefObject<any>;
  currentTime?: number;
  duration?: number;
  isSettingMode?: boolean;
  onSettingModeChange?: (isOpen: boolean) => void;
  onNextEpisode?: () => void; // 新增：跳转下一集的回调
}

export default function SkipController({
  source,
  id,
  title,
  artPlayerRef,
  currentTime = 0,
  duration = 0,
  isSettingMode = false,
  onSettingModeChange,
  onNextEpisode,
}: SkipControllerProps) {
  const [skipConfig, setSkipConfig] = useState<EpisodeSkipConfig | null>(null);
  const [showSkipButton, setShowSkipButton] = useState(false);
  const [currentSkipSegment, setCurrentSkipSegment] = useState<SkipSegment | null>(null);
  const [newSegment, setNewSegment] = useState<Partial<SkipSegment>>({});
  
  // 新增状态：批量设置模式 - 支持分:秒格式
  const [batchSettings, setBatchSettings] = useState({
    openingStart: '0:00',   // 片头开始时间（分:秒格式）
    openingEnd: '1:30',     // 片头结束时间（分:秒格式，90秒=1分30秒）
    endingMode: 'remaining', // 片尾模式：'remaining'(剩余时间) 或 'absolute'(绝对时间)
    endingStart: '2:00',    // 片尾开始时间（剩余时间模式：还剩多少时间开始倒计时；绝对时间模式：从视频开始多长时间）
    endingEnd: '',          // 片尾结束时间（可选，空表示直接跳转下一集）
    autoSkip: true,         // 自动跳过开关
    autoNextEpisode: true,  // 自动下一集开关
  });
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(0);

  const lastSkipTimeRef = useRef<number>(0);
  const skipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoSkipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 时间格式转换函数
  const timeToSeconds = useCallback((timeStr: string): number => {
    if (!timeStr || timeStr.trim() === '') return 0;
    
    // 支持多种格式: "2:10", "2:10.5", "130", "130.5"
    if (timeStr.includes(':')) {
      const parts = timeStr.split(':');
      const minutes = parseInt(parts[0]) || 0;
      const seconds = parseFloat(parts[1]) || 0;
      return minutes * 60 + seconds;
    } else {
      return parseFloat(timeStr) || 0;
    }
  }, []);

  const secondsToTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const decimal = seconds % 1;
    if (decimal > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}.${Math.floor(decimal * 10)}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // 加载跳过配置
  const loadSkipConfig = useCallback(async () => {
    try {
      const config = await getSkipConfig(source, id);
      setSkipConfig(config);
    } catch (err) {
      console.error('加载跳过配置失败:', err);
    }
  }, [source, id]);

  // 自动跳过逻辑
  const handleAutoSkip = useCallback((segment: SkipSegment) => {
    if (!artPlayerRef.current) return;

    const targetTime = segment.end + 1;
    artPlayerRef.current.currentTime = targetTime;
    lastSkipTimeRef.current = Date.now();

    // 显示跳过提示
    if (artPlayerRef.current.notice) {
      const segmentName = segment.type === 'opening' ? '片头' : '片尾';
      artPlayerRef.current.notice.show = `自动跳过${segmentName}`;
    }
    
    setCurrentSkipSegment(null);
  }, [artPlayerRef]);

  // 开始片尾倒计时
  const startEndingCountdown = useCallback((seconds: number) => {
    setShowCountdown(true);
    setCountdownSeconds(seconds);

    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    countdownIntervalRef.current = setInterval(() => {
      setCountdownSeconds(prev => {
        if (prev <= 1) {
          // 倒计时结束，跳转下一集
          if (onNextEpisode) {
            onNextEpisode();
          }
          setShowCountdown(false);
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [onNextEpisode]);

  // 检查片尾倒计时
  const checkEndingCountdown = useCallback((time: number) => {
    if (!skipConfig?.segments?.length || !duration || !onNextEpisode) return;

    const endingSegments = skipConfig.segments.filter(s => s.type === 'ending' && s.autoNextEpisode !== false);
    if (!endingSegments.length) return;

    for (const segment of endingSegments) {
      const timeToEnd = duration - time;
      const timeToSegmentStart = duration - segment.start;
      
      // 当距离视频结束的时间等于设定的片尾开始时间时，开始倒计时
      if (timeToEnd <= timeToSegmentStart && timeToEnd > 0 && !showCountdown) {
        startEndingCountdown(Math.ceil(timeToEnd));
        break;
      }
    }
  }, [skipConfig, duration, onNextEpisode, showCountdown, startEndingCountdown]);

  // 检查当前播放时间是否在跳过区间内
  const checkSkipSegment = useCallback(
    (time: number) => {
      if (!skipConfig?.segments?.length) return;

      const currentSegment = skipConfig.segments.find(
        (segment) => time >= segment.start && time <= segment.end
      );

      if (currentSegment && currentSegment !== currentSkipSegment) {
        setCurrentSkipSegment(currentSegment);
        
        // 检查是否开启自动跳过
        const hasAutoSkipSetting = skipConfig.segments.some(s => s.autoSkip !== false);
        
        if (hasAutoSkipSetting) {
          // 自动跳过：延迟1秒执行跳过
          if (autoSkipTimeoutRef.current) {
            clearTimeout(autoSkipTimeoutRef.current);
          }
          autoSkipTimeoutRef.current = setTimeout(() => {
            handleAutoSkip(currentSegment);
          }, 1000);
          
          setShowSkipButton(false); // 自动跳过时不显示按钮
        } else {
          // 手动模式：显示跳过按钮
          setShowSkipButton(true);
          
          // 自动隐藏跳过按钮
          if (skipTimeoutRef.current) {
            clearTimeout(skipTimeoutRef.current);
          }
          skipTimeoutRef.current = setTimeout(() => {
            setShowSkipButton(false);
            setCurrentSkipSegment(null);
          }, 8000);
        }
      } else if (!currentSegment && currentSkipSegment) {
        setCurrentSkipSegment(null);
        setShowSkipButton(false);
        if (skipTimeoutRef.current) {
          clearTimeout(skipTimeoutRef.current);
        }
        if (autoSkipTimeoutRef.current) {
          clearTimeout(autoSkipTimeoutRef.current);
        }
      }

      // 检查片尾倒计时
      checkEndingCountdown(time);
    },
    [skipConfig, currentSkipSegment, handleAutoSkip, checkEndingCountdown]
  );

  // 执行跳过
  const handleSkip = useCallback(() => {
    if (!currentSkipSegment || !artPlayerRef.current) return;

    const targetTime = currentSkipSegment.end + 1; // 跳到片段结束后1秒
    artPlayerRef.current.currentTime = targetTime;
    lastSkipTimeRef.current = Date.now();

    setShowSkipButton(false);
    setCurrentSkipSegment(null);

    if (skipTimeoutRef.current) {
      clearTimeout(skipTimeoutRef.current);
    }

    // 显示跳过提示
    if (artPlayerRef.current.notice) {
      const segmentName = currentSkipSegment.type === 'opening' ? '片头' : '片尾';
      artPlayerRef.current.notice.show = `已跳过${segmentName}`;
    }
  }, [currentSkipSegment, artPlayerRef]);

  // 保存新的跳过片段（单个片段模式）
  const handleSaveSegment = useCallback(async () => {
    if (!newSegment.start || !newSegment.end || !newSegment.type) {
      alert('请填写完整的跳过片段信息');
      return;
    }

    if (newSegment.start >= newSegment.end) {
      alert('开始时间必须小于结束时间');
      return;
    }

    try {
      const segment: SkipSegment = {
        start: newSegment.start,
        end: newSegment.end,
        type: newSegment.type as 'opening' | 'ending',
        title: newSegment.title || (newSegment.type === 'opening' ? '片头' : '片尾'),
        autoSkip: true, // 默认开启自动跳过
        autoNextEpisode: newSegment.type === 'ending', // 片尾默认开启自动下一集
      };

      const updatedConfig: EpisodeSkipConfig = {
        source,
        id,
        title,
        segments: skipConfig?.segments ? [...skipConfig.segments, segment] : [segment],
        updated_time: Date.now(),
      };

      await saveSkipConfig(source, id, updatedConfig);
      setSkipConfig(updatedConfig);
      onSettingModeChange?.(false);
      setNewSegment({});

      alert('跳过片段已保存');
    } catch (err) {
      console.error('保存跳过片段失败:', err);
      alert('保存失败，请重试');
    }
  }, [newSegment, skipConfig, source, id, title, onSettingModeChange]);

  // 保存批量设置的跳过配置
  const handleSaveBatchSettings = useCallback(async () => {
    const segments: SkipSegment[] = [];

    // 添加片头设置
    if (batchSettings.openingStart && batchSettings.openingEnd) {
      const start = timeToSeconds(batchSettings.openingStart);
      const end = timeToSeconds(batchSettings.openingEnd);
      
      if (start >= end) {
        alert('片头开始时间必须小于结束时间');
        return;
      }
      
      segments.push({
        start,
        end,
        type: 'opening',
        title: '片头',
        autoSkip: batchSettings.autoSkip,
      });
    }

    // 添加片尾设置
    if (batchSettings.endingStart) {
      const endingStartSeconds = timeToSeconds(batchSettings.endingStart);
      
      // 根据模式计算实际的开始时间
      let actualStartSeconds: number;
      if (batchSettings.endingMode === 'remaining') {
        // 剩余时间模式：从视频总长度减去剩余时间
        actualStartSeconds = duration - endingStartSeconds;
      } else {
        // 绝对时间模式：使用输入的时间
        actualStartSeconds = endingStartSeconds;
      }
      
      // 确保开始时间在有效范围内
      if (actualStartSeconds < 0) {
        actualStartSeconds = 0;
      } else if (actualStartSeconds >= duration) {
        alert(`片尾开始时间超出视频长度（总长：${secondsToTime(duration)}）`);
        return;
      }
      
      // 如果没有设置结束时间，则直接跳转到下一集
      if (!batchSettings.endingEnd || batchSettings.endingEnd.trim() === '') {
        // 直接从指定时间跳转下一集
        segments.push({
          start: actualStartSeconds,
          end: duration, // 设置为视频总长度
          type: 'ending',
          title: batchSettings.endingMode === 'remaining' 
            ? `剩余${batchSettings.endingStart}时跳转下一集` 
            : '片尾跳转下一集',
          autoSkip: batchSettings.autoSkip,
          autoNextEpisode: batchSettings.autoNextEpisode,
        });
      } else {
        let actualEndSeconds: number;
        const endingEndSeconds = timeToSeconds(batchSettings.endingEnd);
        
        if (batchSettings.endingMode === 'remaining') {
          actualEndSeconds = duration - endingEndSeconds;
        } else {
          actualEndSeconds = endingEndSeconds;
        }
        
        if (actualStartSeconds >= actualEndSeconds) {
          alert('片尾开始时间必须小于结束时间');
          return;
        }
        
        segments.push({
          start: actualStartSeconds,
          end: actualEndSeconds,
          type: 'ending',
          title: batchSettings.endingMode === 'remaining' ? '片尾（剩余时间模式）' : '片尾',
          autoSkip: batchSettings.autoSkip,
          autoNextEpisode: batchSettings.autoNextEpisode,
        });
      }
    }

    if (segments.length === 0) {
      alert('请至少设置片头或片尾时间');
      return;
    }

    try {
      const updatedConfig: EpisodeSkipConfig = {
        source,
        id,
        title,
        segments,
        updated_time: Date.now(),
      };

      await saveSkipConfig(source, id, updatedConfig);
      setSkipConfig(updatedConfig);
      onSettingModeChange?.(false);
      
      // 重置批量设置
      setBatchSettings({
        openingStart: '0:00',
        openingEnd: '1:30',
        endingMode: 'remaining',
        endingStart: '2:00',
        endingEnd: '',
        autoSkip: true,
        autoNextEpisode: true,
      });

      alert('跳过配置已保存');
    } catch (err) {
      console.error('保存跳过配置失败:', err);
      alert('保存失败，请重试');
    }
  }, [batchSettings, duration, source, id, title, onSettingModeChange, timeToSeconds, secondsToTime]);

  // 删除跳过片段
  const handleDeleteSegment = useCallback(
    async (index: number) => {
      if (!skipConfig?.segments) return;

      try {
        const updatedSegments = skipConfig.segments.filter((_, i) => i !== index);
        
        if (updatedSegments.length === 0) {
          // 如果没有片段了，删除整个配置
          await deleteSkipConfig(source, id);
          setSkipConfig(null);
        } else {
          // 更新配置
          const updatedConfig: EpisodeSkipConfig = {
            ...skipConfig,
            segments: updatedSegments,
            updated_time: Date.now(),
          };
          await saveSkipConfig(source, id, updatedConfig);
          setSkipConfig(updatedConfig);
        }

        alert('跳过片段已删除');
      } catch (err) {
        console.error('删除跳过片段失败:', err);
        alert('删除失败，请重试');
      }
    },
    [skipConfig, source, id]
  );

  // 格式化时间显示
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 初始化加载配置
  useEffect(() => {
    loadSkipConfig();
  }, [loadSkipConfig]);

  // 监听播放时间变化
  useEffect(() => {
    if (currentTime > 0) {
      checkSkipSegment(currentTime);
    }
  }, [currentTime, checkSkipSegment]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (skipTimeoutRef.current) {
        clearTimeout(skipTimeoutRef.current);
      }
      if (autoSkipTimeoutRef.current) {
        clearTimeout(autoSkipTimeoutRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className="skip-controller">
      {/* 倒计时显示 - 片尾自动跳转下一集 */}
      {showCountdown && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[9999] bg-blue-600/90 text-white px-6 py-3 rounded-lg backdrop-blur-sm border border-white/20 shadow-lg animate-fade-in">
          <div className="flex items-center space-x-3">
            <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium">
              {countdownSeconds}秒后自动播放下一集
            </span>
            <button
              onClick={() => {
                setShowCountdown(false);
                if (countdownIntervalRef.current) {
                  clearInterval(countdownIntervalRef.current);
                }
              }}
              className="px-2 py-1 bg-white/20 hover:bg-white/30 rounded text-xs transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 跳过按钮 */}
      {showSkipButton && currentSkipSegment && (
        <div className="fixed top-20 right-4 z-[9999] bg-black/80 text-white px-4 py-2 rounded-lg backdrop-blur-sm border border-white/20 shadow-lg animate-fade-in">
          <div className="flex items-center space-x-3">
            <span className="text-sm">
              {currentSkipSegment.type === 'opening' ? '检测到片头' : '检测到片尾'}
            </span>
            <button
              onClick={handleSkip}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm font-medium transition-colors"
            >
              跳过
            </button>
          </div>
        </div>
      )}

      {/* 设置模式面板 - 增强版批量设置 */}
      {isSettingMode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
              智能跳过设置
            </h3>
            
            {/* 全局开关 */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={batchSettings.autoSkip}
                    onChange={(e) => setBatchSettings({...batchSettings, autoSkip: e.target.checked})}
                    className="rounded"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    启用自动跳过
                  </span>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={batchSettings.autoNextEpisode}
                    onChange={(e) => setBatchSettings({...batchSettings, autoNextEpisode: e.target.checked})}
                    className="rounded"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    片尾自动播放下一集
                  </span>
                </label>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                开启后将自动跳过设定的片头片尾，无需手动点击
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 片头设置 */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 border-b pb-2">
                  🎬 片头设置
                </h4>
                
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    开始时间 (分:秒)
                  </label>
                  <input
                    type="text"
                    value={batchSettings.openingStart}
                    onChange={(e) => setBatchSettings({...batchSettings, openingStart: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="0:00"
                  />
                  <p className="text-xs text-gray-500 mt-1">格式: 分:秒 (如 0:00)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    结束时间 (分:秒)
                  </label>
                  <input
                    type="text"
                    value={batchSettings.openingEnd}
                    onChange={(e) => setBatchSettings({...batchSettings, openingEnd: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="1:30"
                  />
                  <p className="text-xs text-gray-500 mt-1">格式: 分:秒 (如 1:30)</p>
                </div>
              </div>

              {/* 片尾设置 */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 border-b pb-2">
                  🎭 片尾设置
                </h4>
                
                {/* 片尾模式选择 */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    计时模式
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="endingMode"
                        value="remaining"
                        checked={batchSettings.endingMode === 'remaining'}
                        onChange={(e) => setBatchSettings({...batchSettings, endingMode: e.target.value})}
                        className="mr-2"
                      />
                      剩余时间（推荐）
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="endingMode"
                        value="absolute"
                        checked={batchSettings.endingMode === 'absolute'}
                        onChange={(e) => setBatchSettings({...batchSettings, endingMode: e.target.value})}
                        className="mr-2"
                      />
                      绝对时间
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {batchSettings.endingMode === 'remaining' 
                      ? '基于剩余时间倒计时（如：还剩2分钟时开始）' 
                      : '基于播放时间（如：播放到第20分钟时开始）'
                    }
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    {batchSettings.endingMode === 'remaining' ? '剩余时间 (分:秒)' : '开始时间 (分:秒)'}
                  </label>
                  <input
                    type="text"
                    value={batchSettings.endingStart}
                    onChange={(e) => setBatchSettings({...batchSettings, endingStart: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder={batchSettings.endingMode === 'remaining' ? '2:00' : '20:00'}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {batchSettings.endingMode === 'remaining' 
                      ? '当剩余时间达到此值时开始倒计时' 
                      : '从视频开始播放此时间后开始检测片尾'
                    }
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    结束时间 (分:秒) - 可选
                  </label>
                  <input
                    type="text"
                    value={batchSettings.endingEnd}
                    onChange={(e) => setBatchSettings({...batchSettings, endingEnd: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="留空直接跳下一集"
                  />
                  <p className="text-xs text-gray-500 mt-1">空白=直接跳下一集</p>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <p><strong>当前播放时间:</strong> {secondsToTime(currentTime)}</p>
                {duration > 0 && (
                  <p><strong>视频总长度:</strong> {secondsToTime(duration)}</p>
                )}
                <div className="text-xs mt-2 text-gray-500 space-y-1">
                  <p>💡 <strong>片头示例:</strong> 从 0:00 自动跳到 1:30</p>
                  <p>💡 <strong>片尾示例:</strong> 从 20:00 开始倒计时，自动跳下一集</p>
                  <p>💡 支持格式: 1:30 (1分30秒) 或 90 (90秒)</p>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleSaveBatchSettings}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium transition-colors"
              >
                保存智能配置
              </button>
              <button
                onClick={() => {
                  onSettingModeChange?.(false);
                  setBatchSettings({
                    openingStart: '0:00',
                    openingEnd: '1:30',
                    endingMode: 'remaining',
                    endingStart: '2:00',
                    endingEnd: '',
                    autoSkip: true,
                    autoNextEpisode: true,
                  });
                }}
                className="flex-1 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded font-medium transition-colors"
              >
                取消
              </button>
            </div>

            {/* 分割线 */}
            <div className="my-6 border-t border-gray-200 dark:border-gray-600"></div>

            {/* 传统单个设置模式 */}
            <details className="mb-4">
              <summary className="cursor-pointer text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                高级设置：添加单个片段
              </summary>
              <div className="mt-4 space-y-4 pl-4 border-l-2 border-gray-200 dark:border-gray-600">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    类型
                  </label>
                  <select
                    value={newSegment.type || ''}
                    onChange={(e) => setNewSegment({ ...newSegment, type: e.target.value as 'opening' | 'ending' })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">选择类型</option>
                    <option value="opening">片头</option>
                    <option value="ending">片尾</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                      开始时间 (秒)
                    </label>
                    <input
                      type="number"
                      value={newSegment.start || ''}
                      onChange={(e) => setNewSegment({ ...newSegment, start: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                      结束时间 (秒)
                    </label>
                    <input
                      type="number"
                      value={newSegment.end || ''}
                      onChange={(e) => setNewSegment({ ...newSegment, end: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSaveSegment}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
                >
                  添加片段
                </button>
              </div>
            </details>
          </div>
        </div>
      )}

      {/* 管理已有片段 - 优化布局避免重叠 */}
      {skipConfig && skipConfig.segments && skipConfig.segments.length > 0 && !isSettingMode && (
        <div className="fixed bottom-4 left-4 z-[9998] max-w-sm bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 animate-fade-in">
          <div className="p-3">
            <h4 className="font-medium mb-2 text-gray-900 dark:text-gray-100 text-sm flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
              跳过配置
            </h4>
            <div className="space-y-1">
              {skipConfig.segments.map((segment, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded text-xs"
                >
                  <span className="text-gray-800 dark:text-gray-200 flex-1 mr-2">
                    <span className="font-medium">
                      {segment.type === 'opening' ? '🎬片头' : '🎭片尾'}
                    </span>
                    <br />
                    <span className="text-gray-600 dark:text-gray-400">
                      {formatTime(segment.start)} - {formatTime(segment.end)}
                    </span>
                    {segment.autoSkip && (
                      <span className="ml-1 px-1 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 rounded text-xs">
                        自动
                      </span>
                    )}
                  </span>
                  <button
                    onClick={() => handleDeleteSegment(index)}
                    className="px-1.5 py-0.5 bg-red-500 hover:bg-red-600 text-white rounded text-xs transition-colors flex-shrink-0"
                    title="删除"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
              <button
                onClick={() => onSettingModeChange?.(true)}
                className="w-full px-2 py-1 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 rounded text-xs transition-colors"
              >
                修改配置
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

// 导出跳过控制器的设置按钮组件
export function SkipSettingsButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center space-x-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded text-sm text-gray-700 dark:text-gray-300 transition-colors"
      title="设置跳过片头片尾"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
      </svg>
      <span>跳过设置</span>
    </button>
  );
}
