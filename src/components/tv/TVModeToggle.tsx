'use client';

import { Monitor, Tv } from 'lucide-react';

import { useTVMode } from './TVModeProvider';

interface TVModeToggleProps {
  /** Show label text next to the icon */
  showLabel?: boolean;
  /** Custom class name for the container */
  className?: string;
  /** Variant style */
  variant?: 'button' | 'switch' | 'menu-item';
}

/**
 * TVModeToggle component for switching between TV mode and normal mode.
 * Connects to TVModeProvider context to manage TV mode state.
 *
 * Requirements: 1.1, 1.2
 */
export function TVModeToggle({
  showLabel = true,
  className = '',
  variant = 'button',
}: TVModeToggleProps) {
  const { isTVMode, toggleTVMode } = useTVMode();

  // Menu item variant - for use in UserMenu
  if (variant === 'menu-item') {
    return (
      <button
        onClick={toggleTVMode}
        className={`w-full px-3 py-2 text-left flex items-center justify-between text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors text-sm ${className}`}
        aria-label={isTVMode ? '关闭 TV 模式' : '开启 TV 模式'}
        data-tv-focusable='true'
      >
        <div className='flex items-center gap-2.5'>
          {isTVMode ? (
            <Tv className='w-4 h-4 text-green-500' />
          ) : (
            <Monitor className='w-4 h-4 text-gray-500 dark:text-gray-400' />
          )}
          {showLabel && <span className='font-medium'>TV 模式</span>}
        </div>
        {/* Toggle switch indicator */}
        <div className='relative'>
          <div
            className={`w-9 h-5 rounded-full transition-colors ${
              isTVMode ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <div
              className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                isTVMode ? 'translate-x-4' : 'translate-x-0.5'
              }`}
            />
          </div>
        </div>
      </button>
    );
  }

  // Switch variant - toggle switch style
  if (variant === 'switch') {
    return (
      <label
        className={`flex items-center cursor-pointer gap-3 ${className}`}
        data-tv-focusable='true'
      >
        {showLabel && (
          <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
            TV 模式
          </span>
        )}
        <div className='relative'>
          <input
            type='checkbox'
            className='sr-only peer'
            checked={isTVMode}
            onChange={toggleTVMode}
            aria-label={isTVMode ? '关闭 TV 模式' : '开启 TV 模式'}
          />
          <div className='w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-green-500 transition-colors dark:bg-gray-600' />
          <div className='absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-5' />
        </div>
      </label>
    );
  }

  // Default button variant
  return (
    <button
      onClick={toggleTVMode}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
        isTVMode
          ? 'bg-green-500/20 text-green-500 hover:bg-green-500/30'
          : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
      } ${className}`}
      aria-label={isTVMode ? '关闭 TV 模式' : '开启 TV 模式'}
      aria-pressed={isTVMode}
      data-tv-focusable='true'
    >
      {isTVMode ? <Tv className='w-5 h-5' /> : <Monitor className='w-5 h-5' />}
      {showLabel && (
        <span className='text-sm font-medium'>
          {isTVMode ? 'TV 模式' : '普通模式'}
        </span>
      )}
    </button>
  );
}

export default TVModeToggle;
