/**
 * TV Mode Constants
 * Shared constants for TV mode functionality
 */

/**
 * D-Pad key code mappings for TV remote control
 */
export const TV_KEY_CODES = {
  // Direction keys
  DPAD_UP: ['ArrowUp', 'Up'] as readonly string[],
  DPAD_DOWN: ['ArrowDown', 'Down'] as readonly string[],
  DPAD_LEFT: ['ArrowLeft', 'Left'] as readonly string[],
  DPAD_RIGHT: ['ArrowRight', 'Right'] as readonly string[],

  // Confirm key
  DPAD_CENTER: ['Enter', ' '] as readonly string[],

  // Back key
  BACK: ['Escape', 'Backspace', 'XF86Back'] as readonly string[],

  // Media control keys
  PLAY_PAUSE: ['MediaPlayPause', 'p', 'P'] as readonly string[],
  FAST_FORWARD: ['MediaFastForward'] as readonly string[],
  REWIND: ['MediaRewind'] as readonly string[],
} as const;

/**
 * Priority levels for back handler layers
 */
export const BACK_HANDLER_PRIORITY = {
  EXIT_DIALOG: 1000, // Highest priority - exit confirmation dialog
  MODAL: 500, // Modal dialogs
  DRAWER: 400, // Navigation drawer
  OVERLAY: 300, // Overlays (player controls, etc.)
  DROPDOWN: 200, // Dropdown menus
  DEFAULT: 100, // Default priority
} as const;
