'use client';

import { Clover, Film, Home, Search, Settings, Tv, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { setTVFocus } from '@/lib/tv-utils';

import { BACK_HANDLER_PRIORITY, TV_KEY_CODES } from './tv-constants';
import { registerBackHandlerLayer } from './useTVBackHandler';

export interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

interface TVNavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeItem?: string;
}

/**
 * Default navigation items for the TV navigation drawer
 */
export const defaultNavigationItems: NavigationItem[] = [
  { id: 'home', label: '首页', icon: Home, href: '/' },
  { id: 'search', label: '搜索', icon: Search, href: '/search' },
  { id: 'movie', label: '电影', icon: Film, href: '/douban?type=movie' },
  { id: 'tv', label: '剧集', icon: Tv, href: '/douban?type=tv' },
  { id: 'show', label: '综艺', icon: Clover, href: '/douban?type=show' },
  { id: 'config', label: 'TVBox配置', icon: Settings, href: '/config' },
];

/**
 * TV Navigation Drawer Component
 *
 * Implements MD3 TV Left Overlay Template navigation drawer.
 * Supports D-Pad up/down navigation, Enter selection, and Back/Right close.
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */
export function TVNavigationDrawer({
  isOpen,
  onClose,
  activeItem,
}: TVNavigationDrawerProps) {
  const pathname = usePathname();
  const [focusedIndex, setFocusedIndex] = useState(0);
  const drawerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  // Use ref to track focusedIndex for event handlers to avoid stale closure
  const focusedIndexRef = useRef(focusedIndex);

  const items = defaultNavigationItems;

  // Keep ref in sync with state
  useEffect(() => {
    focusedIndexRef.current = focusedIndex;
  }, [focusedIndex]);

  /**
   * Determine if a navigation item is active based on current path
   */
  const isItemActive = useCallback(
    (item: NavigationItem): boolean => {
      if (activeItem) {
        return item.id === activeItem;
      }

      const decodedPathname = decodeURIComponent(pathname);
      const decodedHref = decodeURIComponent(item.href);

      // Exact match
      if (decodedPathname === decodedHref) return true;

      // Check for type parameter match (for douban pages)
      const typeMatch = item.href.match(/type=([^&]+)/)?.[1];
      if (
        typeMatch &&
        decodedPathname.startsWith('/douban') &&
        decodedPathname.includes(`type=${typeMatch}`)
      ) {
        return true;
      }

      return false;
    },
    [pathname, activeItem]
  );

  /**
   * Focus the item at the given index
   */
  const focusItem = useCallback((index: number) => {
    const item = itemRefs.current[index];
    if (item) {
      setTVFocus(item, { scrollIntoView: true });
      setFocusedIndex(index);
    }
  }, []);

  /**
   * Handle keyboard navigation within the drawer
   * Uses ref for focusedIndex to avoid stale closure issues
   */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      const key = e.key;
      const currentIndex = focusedIndexRef.current;

      // D-Pad Up - move focus up
      if (TV_KEY_CODES.DPAD_UP.includes(key)) {
        e.preventDefault();
        e.stopPropagation();
        const newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        focusItem(newIndex);
        return;
      }

      // D-Pad Down - move focus down
      if (TV_KEY_CODES.DPAD_DOWN.includes(key)) {
        e.preventDefault();
        e.stopPropagation();
        const newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        focusItem(newIndex);
        return;
      }

      // D-Pad Right - close drawer (Back key is handled by back handler system)
      if (TV_KEY_CODES.DPAD_RIGHT.includes(key)) {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }

      // Enter - select item (handled by Link click)
      if (TV_KEY_CODES.DPAD_CENTER.includes(key)) {
        // Let the default behavior handle the link click
        // Close drawer after navigation
        setTimeout(() => onClose(), 100);
        return;
      }

      // D-Pad Left - do nothing (already at left edge)
      if (TV_KEY_CODES.DPAD_LEFT.includes(key)) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
    },
    [isOpen, items.length, focusItem, onClose]
  );

  /**
   * Register as a back handler layer when drawer is open
   */
  useEffect(() => {
    if (!isOpen) return;

    const unregister = registerBackHandlerLayer({
      id: 'tv-navigation-drawer',
      priority: BACK_HANDLER_PRIORITY.DRAWER,
      onClose: () => {
        onClose();
        return true;
      },
    });

    return unregister;
  }, [isOpen, onClose]);

  /**
   * Store previous focus and set up keyboard listener when drawer opens
   */
  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element to restore later
      previousFocusRef.current = document.activeElement as HTMLElement;

      // Find the active item index or default to 0
      const activeIndex = items.findIndex((item) => isItemActive(item));
      const initialIndex = activeIndex >= 0 ? activeIndex : 0;

      // Focus the initial item after a short delay to ensure DOM is ready
      setTimeout(() => {
        focusItem(initialIndex);
      }, 50);

      // Add keyboard listener
      document.addEventListener('keydown', handleKeyDown, true);

      return () => {
        document.removeEventListener('keydown', handleKeyDown, true);
      };
    } else {
      // Restore focus when drawer closes
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
        previousFocusRef.current = null;
      }
    }
  }, [isOpen, items, isItemActive, focusItem, handleKeyDown]);

  /**
   * Handle click outside to close drawer
   */
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  if (!isOpen) return null;

  return (
    <div
      className='fixed inset-0 z-[1000] flex'
      onClick={handleOverlayClick}
      role='dialog'
      aria-modal='true'
      aria-label='导航菜单'
    >
      {/* Backdrop overlay */}
      <div
        className='absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300'
        style={{ opacity: isOpen ? 1 : 0 }}
      />

      {/* Navigation drawer - slides in from left */}
      <div
        ref={drawerRef}
        className='relative h-full w-72 bg-gray-900/95 backdrop-blur-xl border-r border-gray-700/50 shadow-2xl transform transition-transform duration-300 ease-out'
        style={{
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}
      >
        {/* Header */}
        <div className='flex items-center justify-between px-6 py-5 border-b border-gray-700/50'>
          <h2 className='text-xl font-semibold text-white'>导航</h2>
          <button
            onClick={onClose}
            className='p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors'
            aria-label='关闭导航'
            tabIndex={-1}
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        {/* Navigation items */}
        <nav className='py-4 px-3'>
          <ul className='space-y-1'>
            {items.map((item, index) => {
              const Icon = item.icon;
              const isActive = isItemActive(item);
              const isFocused = focusedIndex === index;

              return (
                <li key={item.id}>
                  <Link
                    ref={(el) => {
                      itemRefs.current[index] = el;
                    }}
                    href={item.href}
                    data-tv-focusable='true'
                    tabIndex={0}
                    className={`
                      flex items-center gap-4 px-4 py-3 rounded-xl
                      text-lg font-medium transition-all duration-200
                      outline-none
                      ${
                        isActive
                          ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                          : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                      }
                      ${
                        isFocused
                          ? 'ring-2 ring-green-500 ring-offset-2 ring-offset-gray-900 scale-105 bg-gray-700/70 text-white'
                          : ''
                      }
                    `}
                    onClick={() => {
                      setTimeout(() => onClose(), 100);
                    }}
                  >
                    <Icon
                      className={`w-6 h-6 ${isActive ? 'text-blue-400' : ''}`}
                    />
                    <span>{item.label}</span>
                    {isActive && (
                      <span className='ml-auto w-2 h-2 rounded-full bg-blue-400' />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer hint */}
        <div className='absolute bottom-0 left-0 right-0 px-6 py-4 border-t border-gray-700/50'>
          <div className='flex items-center justify-center gap-4 text-sm text-gray-500'>
            <span className='flex items-center gap-1'>
              <kbd className='px-2 py-0.5 bg-gray-700 rounded text-xs'>↑↓</kbd>
              <span>导航</span>
            </span>
            <span className='flex items-center gap-1'>
              <kbd className='px-2 py-0.5 bg-gray-700 rounded text-xs'>OK</kbd>
              <span>选择</span>
            </span>
            <span className='flex items-center gap-1'>
              <kbd className='px-2 py-0.5 bg-gray-700 rounded text-xs'>→</kbd>
              <span>关闭</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TVNavigationDrawer;
