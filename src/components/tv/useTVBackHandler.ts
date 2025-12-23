'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';

import { isInputElement } from '@/lib/tv-utils';

import { TV_KEY_CODES } from './tv-constants';
import { useTVMode } from './TVModeProvider';

/**
 * Modal/Overlay registration for back key priority handling
 * Higher priority modals are closed first
 */
export interface TVBackHandlerLayer {
  id: string;
  priority: number;
  onClose: () => boolean; // Returns true if handled, false to pass to next layer
}

// Global registry for back handler layers
const backHandlerLayers: TVBackHandlerLayer[] = [];

/**
 * Register a modal/overlay layer for back key handling
 * @param layer - The layer to register
 * @returns Unregister function
 */
export function registerBackHandlerLayer(
  layer: TVBackHandlerLayer
): () => void {
  backHandlerLayers.push(layer);
  // Sort by priority (higher priority first)
  backHandlerLayers.sort((a, b) => b.priority - a.priority);

  return () => {
    const index = backHandlerLayers.findIndex((l) => l.id === layer.id);
    if (index !== -1) {
      backHandlerLayers.splice(index, 1);
    }
  };
}

/**
 * Check if any modal/overlay layers are registered
 */
export function hasBackHandlerLayers(): boolean {
  return backHandlerLayers.length > 0;
}

/**
 * Get the current back handler layers (for debugging)
 */
export function getBackHandlerLayers(): readonly TVBackHandlerLayer[] {
  return backHandlerLayers;
}

interface UseTVBackHandlerOptions {
  /** Callback when exit confirmation should be shown (on home page) */
  onShowExitConfirm?: () => void;
  /** Whether this is the home page */
  isHomePage?: boolean;
  /** Whether back handling is enabled */
  enabled?: boolean;
}

interface UseTVBackHandlerReturn {
  /** Register a layer for back key handling */
  registerLayer: (layer: Omit<TVBackHandlerLayer, 'id'>) => () => void;
  /** Manually trigger back navigation */
  handleBack: () => void;
}

/**
 * Hook for TV back key handling with modal/overlay priority
 *
 * Implements the following priority order:
 * 1. Close any open modal/overlay (highest priority first)
 * 2. Navigate back in history
 * 3. Show exit confirmation on home page
 *
 * Requirements: 11.1, 11.2, 11.3
 */
export function useTVBackHandler(
  options: UseTVBackHandlerOptions = {}
): UseTVBackHandlerReturn {
  const { onShowExitConfirm, isHomePage = false, enabled } = options;
  const { isTVMode } = useTVMode();
  const router = useRouter();
  const pathname = usePathname();

  const isEnabled = enabled ?? isTVMode;
  const layerIdCounter = useRef(0);

  /**
   * Register a layer for back key handling
   */
  const registerLayer = useCallback(
    (layer: Omit<TVBackHandlerLayer, 'id'>): (() => void) => {
      const id = `layer-${++layerIdCounter.current}`;
      return registerBackHandlerLayer({ ...layer, id });
    },
    []
  );

  /**
   * Handle back key press
   */
  const handleBack = useCallback(() => {
    // First, try to close any registered modal/overlay layers
    for (const layer of backHandlerLayers) {
      const handled = layer.onClose();
      if (handled) {
        return; // Layer handled the back action
      }
    }

    // No layers handled the back action
    // Check if we're on the home page
    const isOnHomePage = isHomePage || pathname === '/';

    if (isOnHomePage) {
      // Show exit confirmation dialog
      if (onShowExitConfirm) {
        onShowExitConfirm();
      }
    } else {
      // Navigate back in history
      router.back();
    }
  }, [isHomePage, pathname, onShowExitConfirm, router]);

  /**
   * Global keyboard event handler for back key
   */
  useEffect(() => {
    if (!isEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if back key is pressed
      if (!TV_KEY_CODES.BACK.includes(e.key)) return;

      // Don't handle Backspace in input elements
      if (e.key === 'Backspace' && isInputElement(e.target)) {
        return;
      }

      e.preventDefault();
      handleBack();
    };

    // Use capture phase to handle before other handlers
    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isEnabled, handleBack]);

  return {
    registerLayer,
    handleBack,
  };
}

export default useTVBackHandler;
