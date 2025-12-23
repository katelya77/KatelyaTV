'use client';

import { useCallback, useEffect, useRef } from 'react';

import { isInputElement } from '@/lib/tv-utils';

import { BACK_HANDLER_PRIORITY, TV_KEY_CODES } from './tv-constants';
import { useTVMode } from './TVModeProvider';
import { registerBackHandlerLayer } from './useTVBackHandler';

/**
 * TV Player Control Configuration
 */
const TV_PLAYER_CONFIG = {
  /** Seek step in seconds for single press */
  SEEK_STEP: 10,
  /** Volume step (0-1 scale) */
  VOLUME_STEP: 0.1,
  /** Long press threshold in milliseconds */
  LONG_PRESS_THRESHOLD: 500,
  /** Fast forward/rewind playback rate */
  FAST_PLAYBACK_RATE: 2,
  /** Normal playback rate */
  NORMAL_PLAYBACK_RATE: 1,
  /** Interval for repeated seek during long press (ms) */
  LONG_PRESS_REPEAT_INTERVAL: 200,
} as const;

interface ArtPlayerInstance {
  currentTime: number;
  duration: number;
  volume: number;
  playing: boolean;
  playbackRate: number;
  toggle: () => void;
  play: () => void;
  pause: () => void;
  notice: {
    show: string;
  };
  video?: HTMLVideoElement;
}

interface UseTVPlayerControlsOptions {
  /** Reference to the ArtPlayer instance */
  artPlayerRef: React.RefObject<ArtPlayerInstance | null>;
  /** Callback for next episode */
  onNextEpisode?: () => void;
  /** Callback for previous episode */
  onPreviousEpisode?: () => void;
  /** Callback when back key is pressed (for showing controls overlay) */
  onBack?: () => boolean;
  /** Whether controls are enabled (defaults to true when in TV mode) */
  enabled?: boolean;
  /** Whether the player is currently active/visible */
  isPlayerActive?: boolean;
}

interface UseTVPlayerControlsReturn {
  /** Seek forward by configured step */
  seekForward: () => void;
  /** Seek backward by configured step */
  seekBackward: () => void;
  /** Increase volume by configured step */
  volumeUp: () => void;
  /** Decrease volume by configured step */
  volumeDown: () => void;
  /** Toggle play/pause */
  togglePlayPause: () => void;
  /** Start fast forward (2x speed) */
  startFastForward: () => void;
  /** Stop fast forward (return to normal speed) */
  stopFastForward: () => void;
  /** Start rewind (seek backward repeatedly) */
  startRewind: () => void;
  /** Stop rewind */
  stopRewind: () => void;
}

/**
 * Hook for TV D-Pad player controls
 * Implements D-Pad direction key controls for video playback
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */
export function useTVPlayerControls(
  options: UseTVPlayerControlsOptions
): UseTVPlayerControlsReturn {
  const {
    artPlayerRef,
    onNextEpisode: _onNextEpisode,
    onPreviousEpisode: _onPreviousEpisode,
    onBack,
    enabled,
    isPlayerActive = true,
  } = options;

  const { isTVMode } = useTVMode();
  const isEnabled = enabled ?? isTVMode;

  // Long press state
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const repeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressActiveRef = useRef(false);
  const currentLongPressKeyRef = useRef<string | null>(null);

  // Register back handler layer for player overlay controls
  useEffect(() => {
    if (!isEnabled || !isPlayerActive || !onBack) return;

    const unregister = registerBackHandlerLayer({
      id: 'tv-player-controls',
      priority: BACK_HANDLER_PRIORITY.OVERLAY,
      onClose: onBack,
    });

    return unregister;
  }, [isEnabled, isPlayerActive, onBack]);

  /**
   * Get the player instance safely
   */
  const getPlayer = useCallback((): ArtPlayerInstance | null => {
    return artPlayerRef.current;
  }, [artPlayerRef]);

  /**
   * Show a notice on the player
   */
  const showNotice = useCallback(
    (message: string): void => {
      const player = getPlayer();
      if (player?.notice) {
        player.notice.show = message;
      }
    },
    [getPlayer]
  );

  /**
   * Seek forward by configured step
   * Requirement: 5.3
   */
  const seekForward = useCallback((): void => {
    const player = getPlayer();
    if (!player) return;

    const newTime = Math.min(
      player.currentTime + TV_PLAYER_CONFIG.SEEK_STEP,
      player.duration
    );
    player.currentTime = newTime;
    showNotice(`快进 ${TV_PLAYER_CONFIG.SEEK_STEP}秒`);
  }, [getPlayer, showNotice]);

  /**
   * Seek backward by configured step
   * Requirement: 5.2
   */
  const seekBackward = useCallback((): void => {
    const player = getPlayer();
    if (!player) return;

    const newTime = Math.max(
      player.currentTime - TV_PLAYER_CONFIG.SEEK_STEP,
      0
    );
    player.currentTime = newTime;
    showNotice(`快退 ${TV_PLAYER_CONFIG.SEEK_STEP}秒`);
  }, [getPlayer, showNotice]);

  /**
   * Increase volume by configured step
   * Requirement: 5.4
   */
  const volumeUp = useCallback((): void => {
    const player = getPlayer();
    if (!player) return;

    const newVolume = Math.min(
      Math.round((player.volume + TV_PLAYER_CONFIG.VOLUME_STEP) * 10) / 10,
      1
    );
    player.volume = newVolume;
    showNotice(`音量: ${Math.round(newVolume * 100)}%`);
  }, [getPlayer, showNotice]);

  /**
   * Decrease volume by configured step
   * Requirement: 5.5
   */
  const volumeDown = useCallback((): void => {
    const player = getPlayer();
    if (!player) return;

    const newVolume = Math.max(
      Math.round((player.volume - TV_PLAYER_CONFIG.VOLUME_STEP) * 10) / 10,
      0
    );
    player.volume = newVolume;
    showNotice(`音量: ${Math.round(newVolume * 100)}%`);
  }, [getPlayer, showNotice]);

  /**
   * Toggle play/pause
   * Requirement: 5.1
   */
  const togglePlayPause = useCallback((): void => {
    const player = getPlayer();
    if (!player) return;

    player.toggle();
    // Notice will be shown by the player itself
  }, [getPlayer]);

  /**
   * Start fast forward (2x speed)
   * Requirement: 5.6
   */
  const startFastForward = useCallback((): void => {
    const player = getPlayer();
    if (!player) return;

    player.playbackRate = TV_PLAYER_CONFIG.FAST_PLAYBACK_RATE;
    showNotice(`快进 ${TV_PLAYER_CONFIG.FAST_PLAYBACK_RATE}x`);
  }, [getPlayer, showNotice]);

  /**
   * Stop fast forward (return to normal speed)
   */
  const stopFastForward = useCallback((): void => {
    const player = getPlayer();
    if (!player) return;

    player.playbackRate = TV_PLAYER_CONFIG.NORMAL_PLAYBACK_RATE;
  }, [getPlayer]);

  /**
   * Start rewind (seek backward repeatedly)
   * Requirement: 5.6
   */
  const startRewind = useCallback((): void => {
    // Start repeated seeking backward
    repeatIntervalRef.current = setInterval(() => {
      seekBackward();
    }, TV_PLAYER_CONFIG.LONG_PRESS_REPEAT_INTERVAL);
    showNotice('快退中...');
  }, [seekBackward, showNotice]);

  /**
   * Stop rewind
   */
  const stopRewind = useCallback((): void => {
    if (repeatIntervalRef.current) {
      clearInterval(repeatIntervalRef.current);
      repeatIntervalRef.current = null;
    }
  }, []);

  /**
   * Clear all timers
   */
  const clearAllTimers = useCallback((): void => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (repeatIntervalRef.current) {
      clearInterval(repeatIntervalRef.current);
      repeatIntervalRef.current = null;
    }
    isLongPressActiveRef.current = false;
    currentLongPressKeyRef.current = null;
  }, []);

  /**
   * Handle keydown events for TV player controls
   */
  useEffect(() => {
    if (!isEnabled || !isPlayerActive) return;

    const handleKeyDown = (e: KeyboardEvent): void => {
      // Ignore if target is an input element
      if (isInputElement(e.target)) return;

      const key = e.key;
      const player = getPlayer();
      if (!player) return;

      // Handle D-Pad controls for player
      // Left arrow - seek backward
      if (TV_KEY_CODES.DPAD_LEFT.includes(key)) {
        e.preventDefault();
        e.stopPropagation();

        // Start long press detection
        if (!longPressTimerRef.current && !isLongPressActiveRef.current) {
          currentLongPressKeyRef.current = key;
          longPressTimerRef.current = setTimeout(() => {
            isLongPressActiveRef.current = true;
            startRewind();
          }, TV_PLAYER_CONFIG.LONG_PRESS_THRESHOLD);

          // Immediate seek on first press
          seekBackward();
        }
        return;
      }

      // Right arrow - seek forward
      if (TV_KEY_CODES.DPAD_RIGHT.includes(key)) {
        e.preventDefault();
        e.stopPropagation();

        // Start long press detection
        if (!longPressTimerRef.current && !isLongPressActiveRef.current) {
          currentLongPressKeyRef.current = key;
          longPressTimerRef.current = setTimeout(() => {
            isLongPressActiveRef.current = true;
            startFastForward();
          }, TV_PLAYER_CONFIG.LONG_PRESS_THRESHOLD);

          // Immediate seek on first press
          seekForward();
        }
        return;
      }

      // Up arrow - volume up
      if (TV_KEY_CODES.DPAD_UP.includes(key)) {
        e.preventDefault();
        e.stopPropagation();
        volumeUp();
        return;
      }

      // Down arrow - volume down
      if (TV_KEY_CODES.DPAD_DOWN.includes(key)) {
        e.preventDefault();
        e.stopPropagation();
        volumeDown();
        return;
      }

      // Enter/Center - play/pause
      if (TV_KEY_CODES.DPAD_CENTER.includes(key)) {
        e.preventDefault();
        e.stopPropagation();
        togglePlayPause();
        return;
      }

      // Play/Pause media key
      if (TV_KEY_CODES.PLAY_PAUSE.includes(key)) {
        e.preventDefault();
        e.stopPropagation();
        togglePlayPause();
        return;
      }
    };

    const handleKeyUp = (e: KeyboardEvent): void => {
      const key = e.key;

      // Handle long press release
      if (
        currentLongPressKeyRef.current &&
        (TV_KEY_CODES.DPAD_LEFT.includes(key) ||
          TV_KEY_CODES.DPAD_RIGHT.includes(key))
      ) {
        // Clear long press timer
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }

        // Stop fast forward or rewind if active
        if (isLongPressActiveRef.current) {
          if (TV_KEY_CODES.DPAD_RIGHT.includes(key)) {
            stopFastForward();
          } else if (TV_KEY_CODES.DPAD_LEFT.includes(key)) {
            stopRewind();
          }
        }

        isLongPressActiveRef.current = false;
        currentLongPressKeyRef.current = null;
      }
    };

    // Use capture phase to intercept events before other handlers
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('keyup', handleKeyUp, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('keyup', handleKeyUp, true);
      clearAllTimers();
    };
  }, [
    isEnabled,
    isPlayerActive,
    getPlayer,
    seekForward,
    seekBackward,
    volumeUp,
    volumeDown,
    togglePlayPause,
    startFastForward,
    stopFastForward,
    startRewind,
    stopRewind,
    clearAllTimers,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  return {
    seekForward,
    seekBackward,
    volumeUp,
    volumeDown,
    togglePlayPause,
    startFastForward,
    stopFastForward,
    startRewind,
    stopRewind,
  };
}

export default useTVPlayerControls;
export { TV_PLAYER_CONFIG };
