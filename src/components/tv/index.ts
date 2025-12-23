/**
 * TV Mode Components and Hooks
 * Central export file for all TV mode functionality
 */

// Constants
export { BACK_HANDLER_PRIORITY, TV_KEY_CODES } from './tv-constants';

// Provider and Context
export { TVModeProvider, useTVMode, useTVModeOptional } from './TVModeProvider';

// Hooks
export {
  getBackHandlerLayers,
  hasBackHandlerLayers,
  registerBackHandlerLayer,
  useTVBackHandler,
} from './useTVBackHandler';
export type { TVBackHandlerLayer } from './useTVBackHandler';

export {
  calculateDistance,
  findNextFocusableElement,
  useTVNavigation,
} from './useTVNavigation';

export { useTVPlayerControls } from './useTVPlayerControls';

// Components
export { TVExitConfirmDialog } from './TVExitConfirmDialog';
export { TVModeToggle } from './TVModeToggle';
export { TVNavigationDrawer } from './TVNavigationDrawer';
export type { NavigationItem } from './TVNavigationDrawer';
export { TVNextEpisodePrompt } from './TVNextEpisodePrompt';
