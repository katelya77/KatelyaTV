/**
 * TV Mode Utility Functions
 *
 * Provides helper functions for TV mode focus management and navigation.
 * Requirements: 2.4, 2.6, 9.1, 9.4, 9.6
 */

/**
 * Selector for focusable elements in TV mode
 */
const FOCUSABLE_SELECTOR = [
  '[data-tv-focusable="true"]',
  'a[href]:not([disabled])',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Get all focusable elements within a container
 * @param container - The container element to search within (defaults to document.body)
 * @returns Array of focusable HTML elements
 */
export function getFocusableElements(
  container: HTMLElement | Document = document
): HTMLElement[] {
  const root = container === document ? document.body : container;
  if (!root) return [];

  const elements = Array.from(
    root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
  );

  // Filter out hidden elements and elements with display:none
  return elements.filter((el) => {
    // Check if element is visible
    if (el.offsetParent === null && el.style.position !== 'fixed') {
      return false;
    }

    // Check computed styles
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') {
      return false;
    }

    // Check if element has dimensions
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      return false;
    }

    return true;
  });
}

/**
 * Scroll an element into view if it's not fully visible
 * Uses smooth scrolling for better TV UX
 * @param element - The element to scroll into view
 * @param options - Scroll options
 */
export function scrollIntoViewIfNeeded(
  element: HTMLElement,
  options: {
    behavior?: ScrollBehavior;
    block?: ScrollLogicalPosition;
    inline?: ScrollLogicalPosition;
    margin?: number;
  } = {}
): void {
  const {
    behavior = 'smooth',
    block = 'nearest',
    inline = 'nearest',
    margin = 50, // Extra margin to ensure element is comfortably visible
  } = options;

  const rect = element.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Check if element is fully visible with margin
  const isFullyVisible =
    rect.top >= margin &&
    rect.left >= margin &&
    rect.bottom <= viewportHeight - margin &&
    rect.right <= viewportWidth - margin;

  if (!isFullyVisible) {
    element.scrollIntoView({
      behavior,
      block,
      inline,
    });
  }
}

/**
 * Check if an element is an input element that should receive text input
 * Used to determine if D-Pad navigation should be disabled
 * @param target - The element to check
 * @returns True if the element is an input element
 */
export function isInputElement(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName.toLowerCase();

  // Check for input elements
  if (tagName === 'input') {
    const inputType = (target as HTMLInputElement).type.toLowerCase();
    // These input types should receive text input
    const textInputTypes = [
      'text',
      'password',
      'email',
      'number',
      'search',
      'tel',
      'url',
    ];
    return textInputTypes.includes(inputType);
  }

  // Check for textarea
  if (tagName === 'textarea') {
    return true;
  }

  // Check for contenteditable
  if (target.isContentEditable) {
    return true;
  }

  return false;
}

/**
 * Get the center point of an element's bounding rect
 * @param rect - The bounding client rect
 * @returns Object with x and y coordinates of the center
 */
export function getRectCenter(rect: DOMRect): { x: number; y: number } {
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

/**
 * Check if element A is in a specific direction relative to element B
 * @param fromRect - The source element's rect
 * @param toRect - The target element's rect
 * @param direction - The direction to check
 * @returns True if toRect is in the specified direction from fromRect
 */
export function isInDirection(
  fromRect: DOMRect,
  toRect: DOMRect,
  direction: 'up' | 'down' | 'left' | 'right'
): boolean {
  switch (direction) {
    case 'up':
      return toRect.bottom <= fromRect.top;
    case 'down':
      return toRect.top >= fromRect.bottom;
    case 'left':
      return toRect.right <= fromRect.left;
    case 'right':
      return toRect.left >= fromRect.right;
    default:
      return false;
  }
}

/**
 * Set focus on an element with TV mode specific handling
 * @param element - The element to focus
 * @param options - Focus options
 */
export function setTVFocus(
  element: HTMLElement,
  options: { preventScroll?: boolean; scrollIntoView?: boolean } = {}
): void {
  const { preventScroll = false, scrollIntoView = true } = options;

  element.focus({ preventScroll });

  if (scrollIntoView && !preventScroll) {
    scrollIntoViewIfNeeded(element);
  }
}

/**
 * Find the first focusable element in a container
 * @param container - The container to search
 * @returns The first focusable element or null
 */
export function findFirstFocusable(
  container: HTMLElement | Document = document
): HTMLElement | null {
  const focusables = getFocusableElements(container);
  return focusables.length > 0 ? focusables[0] : null;
}

/**
 * Find the last focusable element in a container
 * @param container - The container to search
 * @returns The last focusable element or null
 */
export function findLastFocusable(
  container: HTMLElement | Document = document
): HTMLElement | null {
  const focusables = getFocusableElements(container);
  return focusables.length > 0 ? focusables[focusables.length - 1] : null;
}

export { FOCUSABLE_SELECTOR };

/**
 * Check if TV mode is currently active based on DOM state
 * @returns True if TV mode is active
 */
export function isTVModeActive(): boolean {
  return document.documentElement.getAttribute('data-tv-mode') === 'true';
}

/**
 * Get all elements with TV-specific attributes
 * Used for mode isolation verification
 * @returns Object containing counts of TV-specific elements
 */
export function getTVModeElementCounts(): {
  focusableElements: number;
  tvModeAttribute: boolean;
} {
  const focusableElements = document.querySelectorAll(
    '[data-tv-focusable="true"]'
  ).length;
  const tvModeAttribute =
    document.documentElement.getAttribute('data-tv-mode') === 'true';

  return {
    focusableElements,
    tvModeAttribute,
  };
}

/**
 * Verify that Normal mode is completely isolated from TV mode
 * This function checks that no TV-specific artifacts remain when TV mode is disabled
 * Requirements: 9.1, 9.4
 *
 * @returns Object with isolation status and any issues found
 */
export function verifyNormalModeIsolation(): {
  isIsolated: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Check 1: data-tv-mode should be 'false' in Normal mode
  const tvModeAttr = document.documentElement.getAttribute('data-tv-mode');
  if (tvModeAttr === 'true') {
    issues.push('TV mode attribute is still active');
    return { isIsolated: false, issues };
  }

  // Check 2: Verify CSS variables are not being applied
  // In Normal mode, TV-specific CSS variables should not affect elements
  // This is handled by CSS scoping with [data-tv-mode='true'] selector

  // Check 3: Verify no TV-specific transforms are applied to non-focused elements
  const elementsWithTVTransform = document.querySelectorAll(
    '[style*="scale(1.05)"]'
  );
  if (elementsWithTVTransform.length > 0) {
    issues.push(
      `Found ${elementsWithTVTransform.length} elements with TV-specific transforms`
    );
  }

  return {
    isIsolated: issues.length === 0,
    issues,
  };
}

/**
 * Clean up any residual TV mode artifacts from the DOM
 * Called when switching from TV mode to Normal mode
 * Requirements: 9.4
 */
export function cleanupTVModeArtifacts(): void {
  // Remove any inline styles that might have been applied during TV mode
  const elementsWithInlineStyles = document.querySelectorAll(
    '[style*="scale(1.05)"], [style*="--tv-"]'
  );

  elementsWithInlineStyles.forEach((el) => {
    const htmlEl = el as HTMLElement;
    const currentStyle = htmlEl.getAttribute('style');
    if (currentStyle) {
      // Remove TV-specific style properties
      const cleanedStyle = currentStyle
        .split(';')
        .filter((prop) => {
          const trimmed = prop.trim().toLowerCase();
          return (
            !trimmed.startsWith('--tv-') &&
            !trimmed.includes('scale(1.05)') &&
            !trimmed.includes('scale(var(--tv-focus-scale))')
          );
        })
        .join(';')
        .trim();

      if (cleanedStyle) {
        htmlEl.setAttribute('style', cleanedStyle);
      } else {
        htmlEl.removeAttribute('style');
      }
    }
  });

  // Blur any element that might have TV-specific focus styling
  const activeElement = document.activeElement as HTMLElement | null;
  if (activeElement && activeElement !== document.body) {
    const computedStyle = window.getComputedStyle(activeElement);
    // Check for TV-specific focus ring color (green: rgb(76, 175, 80))
    if (computedStyle.boxShadow.includes('76, 175, 80')) {
      activeElement.blur();
    }
  }
}

/**
 * Check if an element has TV mode specific styling applied
 * @param element - The element to check
 * @returns True if the element has TV-specific styling
 */
export function hasTVModeStyles(element: HTMLElement): boolean {
  const computedStyle = window.getComputedStyle(element);

  // Check for TV-specific transform (scale 1.05)
  if (computedStyle.transform.includes('matrix')) {
    // matrix(1.05, 0, 0, 1.05, 0, 0) represents scale(1.05)
    if (computedStyle.transform.includes('1.05')) {
      return true;
    }
  }

  // Check for TV-specific focus ring color
  if (computedStyle.boxShadow.includes('76, 175, 80')) {
    return true;
  }

  return false;
}
