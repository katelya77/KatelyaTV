'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useTVMode } from './TVModeProvider';

interface TVNextEpisodePromptProps {
  /** Whether to show the prompt */
  isVisible: boolean;
  /** Current episode number (1-based) */
  currentEpisode: number;
  /** Total number of episodes */
  totalEpisodes: number;
  /** Callback when user confirms to play next episode */
  onPlayNext: () => void;
  /** Callback when user cancels/dismisses the prompt */
  onCancel: () => void;
  /** Auto-play countdown in seconds (0 to disable) */
  autoPlayCountdown?: number;
}

/**
 * TV Next Episode Prompt Component
 * Shows a prompt when video ends with option to play next episode
 * Auto-focuses the "Play Next" button for TV remote navigation
 *
 * Requirement: 5.7
 */
export function TVNextEpisodePrompt({
  isVisible,
  currentEpisode,
  totalEpisodes,
  onPlayNext,
  onCancel,
  autoPlayCountdown = 10,
}: TVNextEpisodePromptProps) {
  const { isTVMode } = useTVMode();
  const [countdown, setCountdown] = useState(autoPlayCountdown);
  const playNextButtonRef = useRef<HTMLButtonElement>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Reset countdown when prompt becomes visible
  useEffect(() => {
    if (isVisible) {
      setCountdown(autoPlayCountdown);
    }
  }, [isVisible, autoPlayCountdown]);

  // Auto-focus the play next button when prompt appears (TV mode)
  useEffect(() => {
    if (isVisible && isTVMode && playNextButtonRef.current) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        playNextButtonRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isVisible, isTVMode]);

  // Countdown timer for auto-play
  useEffect(() => {
    if (!isVisible || autoPlayCountdown <= 0) return;

    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Auto-play next episode
          onPlayNext();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, [isVisible, autoPlayCountdown, onPlayNext]);

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Backspace') {
        e.preventDefault();
        onCancel();
      }
    },
    [onCancel]
  );

  if (!isVisible) return null;

  const hasNextEpisode = currentEpisode < totalEpisodes;

  return (
    <div
      className='absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[600] transition-opacity duration-300'
      onKeyDown={handleKeyDown}
      role='dialog'
      aria-modal='true'
      aria-labelledby='next-episode-title'
    >
      <div className='bg-gray-900/95 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border border-gray-700/50'>
        {/* Title */}
        <h2
          id='next-episode-title'
          className='text-2xl font-bold text-white text-center mb-4'
        >
          {hasNextEpisode ? '播放完毕' : '已是最后一集'}
        </h2>

        {/* Episode info */}
        <p className='text-gray-300 text-center mb-6'>
          {hasNextEpisode ? (
            <>
              第 {currentEpisode} 集已播放完毕
              <br />
              <span className='text-green-400 font-semibold'>
                即将播放第 {currentEpisode + 1} 集
              </span>
            </>
          ) : (
            <>
              第 {currentEpisode} 集已播放完毕
              <br />
              <span className='text-gray-400'>已是本剧最后一集</span>
            </>
          )}
        </p>

        {/* Countdown indicator */}
        {hasNextEpisode && autoPlayCountdown > 0 && countdown > 0 && (
          <div className='mb-6'>
            <div className='flex items-center justify-center gap-2 text-gray-400 text-sm mb-2'>
              <span>{countdown} 秒后自动播放</span>
            </div>
            <div className='w-full bg-gray-700 rounded-full h-1.5 overflow-hidden'>
              <div
                className='h-full bg-green-500 transition-all duration-1000 ease-linear'
                style={{
                  width: `${(countdown / autoPlayCountdown) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className='flex flex-col gap-3'>
          {hasNextEpisode && (
            <button
              ref={playNextButtonRef}
              onClick={onPlayNext}
              className='w-full px-6 py-4 bg-green-600 hover:bg-green-500 text-white rounded-xl font-semibold text-lg transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-green-500/50 focus:scale-105 data-[tv-focusable]:focus:scale-105'
              data-tv-focusable='true'
              tabIndex={0}
            >
              ▶ 播放下一集
            </button>
          )}

          <button
            onClick={onCancel}
            className='w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-gray-500/50 focus:scale-105 data-[tv-focusable]:focus:scale-105'
            data-tv-focusable='true'
            tabIndex={0}
          >
            {hasNextEpisode ? '取消' : '关闭'}
          </button>
        </div>

        {/* TV mode hint */}
        {isTVMode && (
          <p className='text-gray-500 text-xs text-center mt-4'>
            使用遥控器方向键选择，确认键确定
          </p>
        )}
      </div>
    </div>
  );
}

export default TVNextEpisodePrompt;
