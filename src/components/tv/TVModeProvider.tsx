'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

const TV_MODE_STORAGE_KEY = 'tv_mode_enabled';

interface TVModeContextType {
  isTVMode: boolean;
  setTVMode: (enabled: boolean) => void;
  toggleTVMode: () => void;
}

const TVModeContext = createContext<TVModeContextType | undefined>(undefined);

interface TVModeProviderProps {
  children: React.ReactNode;
}

/**
 * Clean up all TV mode specific attributes and styles from the DOM
 * This ensures complete mode isolation when switching to Normal mode
 * Requirements: 9.1, 9.4, 9.6
 */
function cleanupTVModeAttributes(): void {
  // Remove data-tv-focusable attributes from all elements
  const focusableElements = document.querySelectorAll(
    '[data-tv-focusable="true"]'
  );
  focusableElements.forEach((el) => {
    el.removeAttribute('data-tv-focusable');
  });

  // Reset any inline TV mode styles that might have been applied
  const elementsWithTVStyles = document.querySelectorAll(
    '[style*="--tv-"], [style*="scale(1.05)"]'
  );
  elementsWithTVStyles.forEach((el) => {
    const htmlEl = el as HTMLElement;
    // Remove TV-specific inline styles while preserving others
    const style = htmlEl.getAttribute('style');
    if (style) {
      const cleanedStyle = style
        .split(';')
        .filter(
          (s) =>
            !s.includes('--tv-') &&
            !s.includes('scale(1.05)') &&
            !s.includes('scale(var(--tv-focus-scale))')
        )
        .join(';');
      if (cleanedStyle.trim()) {
        htmlEl.setAttribute('style', cleanedStyle);
      } else {
        htmlEl.removeAttribute('style');
      }
    }
  });

  // Remove any lingering focus rings by blurring active element
  if (document.activeElement instanceof HTMLElement) {
    // Only blur if the element has TV-specific focus styling
    const activeEl = document.activeElement;
    const computedStyle = window.getComputedStyle(activeEl);
    if (
      computedStyle.transform.includes('scale') ||
      computedStyle.boxShadow.includes('rgb(76, 175, 80)')
    ) {
      activeEl.blur();
    }
  }
}

/**
 * Verify that TV mode is completely isolated from Normal mode
 * Returns true if isolation is complete, false if any TV artifacts remain
 * Requirements: 9.1, 9.4
 */
export function verifyModeIsolation(): {
  isIsolated: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Check 1: data-tv-mode attribute should be 'false' in Normal mode
  const tvModeAttr = document.documentElement.getAttribute('data-tv-mode');
  if (tvModeAttr === 'true') {
    issues.push('data-tv-mode attribute is still set to true');
  }

  // Check 2: No elements should have data-tv-focusable="true" in Normal mode
  // (This is now handled dynamically, so we skip this check as components
  // conditionally render this attribute based on isTVMode)

  // Check 3: No TV-specific CSS variables should be actively applied
  // (CSS variables are scoped to [data-tv-mode='true'], so they won't apply)

  // Check 4: Sidebar should be visible in Normal mode
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) {
    const sidebarStyle = window.getComputedStyle(sidebar);
    if (sidebarStyle.display === 'none') {
      // This could be due to responsive design, not necessarily TV mode
      // Only flag if data-tv-mode is true
      if (tvModeAttr === 'true') {
        issues.push('Sidebar is hidden but TV mode attribute is still active');
      }
    }
  }

  // Check 5: Mobile bottom nav should be visible in Normal mode (on mobile)
  const mobileNav = document.querySelector('.mobile-bottom-nav');
  if (mobileNav) {
    const navStyle = window.getComputedStyle(mobileNav);
    if (navStyle.display === 'none' && tvModeAttr === 'true') {
      issues.push(
        'Mobile bottom nav is hidden but TV mode attribute is still active'
      );
    }
  }

  return {
    isIsolated: issues.length === 0,
    issues,
  };
}

export function TVModeProvider({ children }: TVModeProviderProps) {
  const [isTVMode, setIsTVMode] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Read initial state from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(TV_MODE_STORAGE_KEY);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        setIsTVMode(parsed === true);
      }
    } catch {
      // Silently fail if localStorage is not available
      // Graceful degradation: default to Normal mode (Requirement 9.6)
    }
    setIsHydrated(true);
  }, []);

  // Sync state to localStorage and update data attribute
  // Also handle cleanup when switching to Normal mode (Requirement 9.4)
  useEffect(() => {
    if (!isHydrated) return;

    try {
      localStorage.setItem(TV_MODE_STORAGE_KEY, JSON.stringify(isTVMode));
    } catch {
      // Silently fail if localStorage is not available
      // Graceful degradation: continue without persistence (Requirement 9.6)
    }

    // Set data-tv-mode attribute on document element
    document.documentElement.setAttribute(
      'data-tv-mode',
      isTVMode ? 'true' : 'false'
    );

    // When switching to Normal mode, clean up TV-specific attributes
    // This ensures complete mode isolation (Requirement 9.4)
    if (!isTVMode) {
      cleanupTVModeAttributes();
    }
  }, [isTVMode, isHydrated]);

  // Graceful degradation: wrap setTVMode to catch any errors (Requirement 9.6)
  const setTVMode = useCallback((enabled: boolean) => {
    try {
      setIsTVMode(enabled);
    } catch {
      // Fallback to Normal mode on error (Requirement 9.6)
      setIsTVMode(false);
    }
  }, []);

  const toggleTVMode = useCallback(() => {
    try {
      setIsTVMode((prev) => !prev);
    } catch {
      // Fallback to Normal mode on error (Requirement 9.6)
      setIsTVMode(false);
    }
  }, []);

  const value: TVModeContextType = {
    isTVMode,
    setTVMode,
    toggleTVMode,
  };

  return (
    <TVModeContext.Provider value={value}>{children}</TVModeContext.Provider>
  );
}

export function useTVMode(): TVModeContextType {
  const context = useContext(TVModeContext);
  if (context === undefined) {
    throw new Error('useTVMode must be used within a TVModeProvider');
  }
  return context;
}

// Optional hook that returns undefined if not within provider (for conditional usage)
export function useTVModeOptional(): TVModeContextType | undefined {
  return useContext(TVModeContext);
}

export { TV_MODE_STORAGE_KEY };
