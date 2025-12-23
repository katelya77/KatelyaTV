'use client';

import { useCallback, useEffect, useRef } from 'react';

import {
  getFocusableElements,
  getRectCenter,
  isInDirection,
  isInputElement,
  scrollIntoViewIfNeeded,
  setTVFocus,
} from '@/lib/tv-utils';

import { BACK_HANDLER_PRIORITY, TV_KEY_CODES } from './tv-constants';
import { useTVMode } from './TVModeProvider';
import { registerBackHandlerLayer } from './useTVBackHandler';

type Direction = 'up' | 'down' | 'left' | 'right';

interface UseTVNavigationOptions {
  /** Container ref for scoped navigation (optional, defaults to document) */
  containerRef?: React.RefObject<HTMLElement>;
  /** Callback when Enter/OK is pressed on focused element */
  onSelect?: (element: HTMLElement) => void;
  /** Callback when Back key is pressed (registers with global back handler) */
  onBack?: () => boolean;
  /** Priority for back handler registration */
  backHandlerPriority?: number;
  /** Whether navigation is enabled (defaults to true when in TV mode) */
  enabled?: boolean;
}

interface UseTVNavigationReturn {
  /** Navigate focus in a direction */
  navigateFocus: (direction: Direction) => void;
  /** Activate (click) the currently focused element */
  activateFocusedElement: () => void;
  /** Get all focusable elements in the container */
  getFocusables: () => HTMLElement[];
  /** Focus a specific element */
  focusElement: (element: HTMLElement) => void;
}

/**
 * Calculate weighted distance between two elements for spatial navigation
 * Primary axis (direction of movement) has higher weight than secondary axis
 *
 * @param from - Source element's bounding rect
 * @param to - Target element's bounding rect
 * @param direction - Direction of navigation
 * @returns Weighted distance value
 */
export function calculateDistance(
  from: DOMRect,
  to: DOMRect,
  direction: Direction
): number {
  const fromCenter = getRectCenter(from);
  const toCenter = getRectCenter(to);

  const primaryAxis = direction === 'up' || direction === 'down' ? 'y' : 'x';
  const secondaryAxis = primaryAxis === 'y' ? 'x' : 'y';

  const primaryDist = Math.abs(toCenter[primaryAxis] - fromCenter[primaryAxis]);
  const secondaryDist = Math.abs(
    toCenter[secondaryAxis] - fromCenter[secondaryAxis]
  );

  // Primary axis weight 1.0, secondary axis weight 0.3
  // This prioritizes elements that are more directly in the navigation direction
  return primaryDist + secondaryDist * 0.3;
}

/**
 * Find the next focusable element in a given direction using spatial navigation
 *
 * @param currentElement - The currently focused element
 * @param direction - Direction to navigate
 * @param container - Container to search within
 * @returns The next focusable element or null if none found
 */
export function findNextFocusableElement(
  currentElement: HTMLElement,
  direction: Direction,
  container: HTMLElement | Document = document
): HTMLElement | null {
  const currentRect = currentElement.getBoundingClientRect();
  const focusables = getFocusableElements(container);

  // Filter to elements in the specified direction
  const candidates = focusables.filter((el) => {
    if (el === currentElement) return false;
    const rect = el.getBoundingClientRect();
    return isInDirection(currentRect, rect, direction);
  });

  if (candidates.length === 0) return null;

  // Find the closest element by weighted distance
  let closest = candidates[0];
  let closestDistance = calculateDistance(
    currentRect,
    closest.getBoundingClientRect(),
    direction
  );

  for (let i = 1; i < candidates.length; i++) {
    const distance = calculateDistance(
      currentRect,
      candidates[i].getBoundingClientRect(),
      direction
    );
    if (distance < closestDistance) {
      closest = candidates[i];
      closestDistance = distance;
    }
  }

  return closest;
}

/**
 * Hook for TV D-Pad navigation
 * Implements spatial navigation algorithm and global keyboard event handling
 *
 * Requirements: 2.1, 2.2, 2.5, 2.6, 2.7
 */
export function useTVNavigation(
  options: UseTVNavigationOptions = {}
): UseTVNavigationReturn {
  const {
    containerRef,
    onSelect,
    onBack,
    backHandlerPriority = BACK_HANDLER_PRIORITY.DEFAULT,
    enabled,
  } = options;
  const { isTVMode } = useTVMode();

  // Track if navigation is active
  const isEnabled = enabled ?? isTVMode;

  // Track long press state for fast forward/rewind
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);

  /**
   * Get the container element for navigation
   */
  const getContainer = useCallback((): HTMLElement | Document => {
    return containerRef?.current ?? document;
  }, [containerRef]);

  /**
   * Get all focusable elements in the container
   */
  const getFocusables = useCallback((): HTMLElement[] => {
    return getFocusableElements(getContainer());
  }, [getContainer]);

  /**
   * Focus a specific element with TV mode handling
   */
  const focusElement = useCallback((element: HTMLElement): void => {
    setTVFocus(element, { scrollIntoView: true });
  }, []);

  /**
   * Navigate focus in a direction
   */
  const navigateFocus = useCallback(
    (direction: Direction): void => {
      const activeElement = document.activeElement as HTMLElement | null;

      if (!activeElement) {
        // No element focused, focus the first focusable element
        const firstFocusable = getFocusables()[0];
        if (firstFocusable) {
          focusElement(firstFocusable);
        }
        return;
      }

      const nextElement = findNextFocusableElement(
        activeElement,
        direction,
        getContainer()
      );

      if (nextElement) {
        focusElement(nextElement);
        scrollIntoViewIfNeeded(nextElement);
      }
      // If no element found in direction, maintain current focus (Requirement 2.7)
    },
    [getContainer, getFocusables, focusElement]
  );

  /**
   * Activate (click) the currently focused element
   */
  const activateFocusedElement = useCallback((): void => {
    const activeElement = document.activeElement as HTMLElement | null;

    if (activeElement && activeElement !== document.body) {
      // Trigger click event
      activeElement.click();

      // Call onSelect callback if provided
      if (onSelect) {
        onSelect(activeElement);
      }
    }
  }, [onSelect]);

  /**
   * Register onBack callback as a back handler layer
   */
  useEffect(() => {
    if (!isEnabled || !onBack) return;

    const unregister = registerBackHandlerLayer({
      id: `tv-navigation-${Math.random().toString(36).slice(2, 11)}`,
      priority: backHandlerPriority,
      onClose: onBack,
    });

    return unregister;
  }, [isEnabled, onBack, backHandlerPriority]);

  /**
   * Get direction from key
   */
  const getDirectionFromKey = useCallback((key: string): Direction | null => {
    if (TV_KEY_CODES.DPAD_UP.includes(key)) return 'up';
    if (TV_KEY_CODES.DPAD_DOWN.includes(key)) return 'down';
    if (TV_KEY_CODES.DPAD_LEFT.includes(key)) return 'left';
    if (TV_KEY_CODES.DPAD_RIGHT.includes(key)) return 'right';
    return null;
  }, []);

  /**
   * Handle keydown events for D-Pad navigation
   * Note: Back key handling is now done by useTVBackHandler
   */
  useEffect(() => {
    if (!isEnabled) return;

    const handleKeyDown = (e: KeyboardEvent): void => {
      // Ignore if target is an input element (allow normal text input)
      if (isInputElement(e.target)) {
        return;
      }

      const key = e.key;

      // Direction navigation
      const direction = getDirectionFromKey(key);
      if (direction) {
        e.preventDefault();
        navigateFocus(direction);
        return;
      }

      // Confirm/Enter key
      if (TV_KEY_CODES.DPAD_CENTER.includes(key)) {
        e.preventDefault();
        activateFocusedElement();
        return;
      }

      // Note: Back key is now handled by useTVBackHandler globally
    };

    const handleKeyUp = (_e: KeyboardEvent): void => {
      // Clear long press timer
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      isLongPressRef.current = false;
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);

      // Cleanup timer on unmount
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, [isEnabled, navigateFocus, activateFocusedElement, getDirectionFromKey]);

  return {
    navigateFocus,
    activateFocusedElement,
    getFocusables,
    focusElement,
  };
}

export default useTVNavigation;
