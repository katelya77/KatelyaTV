'use client';

import { useCallback, useEffect, useState } from 'react';

import MobileBottomNav from './MobileBottomNav';
import Sidebar from './Sidebar';
import TopSearchBar from './TopSearchBar';
import { useTVModeOptional } from './tv/TVModeProvider';
import { TVNavigationDrawer } from './tv/TVNavigationDrawer';
import { TV_KEY_CODES } from './tv/tv-constants';

interface PageLayoutProps {
  children: React.ReactNode;
  activePath?: string;
}

const PageLayout = ({ children, activePath = '/' }: PageLayoutProps) => {
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Use optional hook to avoid errors when not within TVModeProvider
  const tvModeContext = useTVModeOptional();
  const isTVMode = tvModeContext?.isTVMode ?? false;

  /**
   * Open the TV navigation drawer
   */
  const openDrawer = useCallback(() => {
    setIsDrawerOpen(true);
  }, []);

  /**
   * Close the TV navigation drawer
   */
  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  /**
   * Handle D-Pad left key to open navigation drawer in TV mode
   * Only triggers when drawer is closed and focus is at the left edge of content
   */
  useEffect(() => {
    if (!isTVMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle D-Pad left when drawer is closed
      if (isDrawerOpen) return;

      if (TV_KEY_CODES.DPAD_LEFT.includes(e.key)) {
        const activeElement = document.activeElement as HTMLElement | null;

        // Check if we should open the drawer
        // Open if: no focused element, or focused element is at the left edge
        if (!activeElement || activeElement === document.body) {
          e.preventDefault();
          openDrawer();
          return;
        }

        // Check if the focused element is at the left edge of the viewport
        const rect = activeElement.getBoundingClientRect();
        const isAtLeftEdge = rect.left < 150; // Within 150px of left edge

        if (isAtLeftEdge) {
          // Check if there's no focusable element to the left
          const focusables = Array.from(
            document.querySelectorAll<HTMLElement>(
              '[data-tv-focusable="true"], a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
            )
          ).filter((el) => {
            const elRect = el.getBoundingClientRect();
            return (
              elRect.right <= rect.left &&
              el !== activeElement &&
              el.offsetParent !== null
            );
          });

          if (focusables.length === 0) {
            e.preventDefault();
            openDrawer();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isTVMode, isDrawerOpen, openDrawer]);

  useEffect(() => {
    const handleSidebarVisibilityChange = (event: CustomEvent) => {
      setIsSidebarVisible(event.detail.visible);
    };

    window.addEventListener(
      'sidebarVisibilityChange',
      handleSidebarVisibilityChange as EventListener
    );

    return () => {
      window.removeEventListener(
        'sidebarVisibilityChange',
        handleSidebarVisibilityChange as EventListener
      );
    };
  }, []);

  return (
    <div className='w-full min-h-screen bg-white dark:bg-black'>
      {/* 顶部搜索栏 - 在所有设备上显示 */}
      <TopSearchBar />
      {/* 主内容区域 - YouTube 风格布局 */}
      <div className='relative min-w-0 transition-all duration-300'>
        {/* 桌面端侧边栏 - TV 模式下隐藏 */}
        {!isTVMode && (
          <div
            className={`hidden md:block transition-all duration-300 ${
              isSidebarVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <Sidebar activePath={activePath} />
          </div>
        )}

        {/* 主内容容器 - YouTube 风格布局 */}
        <main
          className={`mb-14 md:mb-0 pt-2 transition-all duration-300 ${
            isSidebarVisible && !isTVMode ? 'md:pl-64' : 'md:pl-0'
          }`}
        >
          <div className='flex w-full min-h-screen'>
            {/* 主内容区 - 全宽度 */}
            <div className='flex-1 w-full'>
              <div
                className='p-4 md:p-6 lg:p-8'
                style={{
                  paddingBottom: isTVMode
                    ? '2rem'
                    : 'calc(3.5rem + env(safe-area-inset-bottom))',
                }}
              >
                {children}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* 移动端底部导航 - TV 模式下隐藏 */}
      {!isTVMode && (
        <div className='md:hidden'>
          <MobileBottomNav activePath={activePath} />
        </div>
      )}

      {/* TV 导航抽屉 - 仅在 TV 模式下可用 */}
      {isTVMode && (
        <TVNavigationDrawer
          isOpen={isDrawerOpen}
          onClose={closeDrawer}
          activeItem={activePath === '/' ? 'home' : undefined}
        />
      )}
    </div>
  );
};

export default PageLayout;
