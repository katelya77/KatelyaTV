'use client';

import { LogOut, X } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { setTVFocus } from '@/lib/tv-utils';

import { BACK_HANDLER_PRIORITY, TV_KEY_CODES } from './tv-constants';
import { registerBackHandlerLayer } from './useTVBackHandler';

interface TVExitConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

/**
 * TV Exit Confirmation Dialog
 *
 * Displayed when user presses Back key on the home page.
 * Supports D-Pad navigation between Cancel and Confirm buttons.
 *
 * Requirements: 11.4, 11.5, 11.6
 */
export function TVExitConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
}: TVExitConfirmDialogProps) {
  const [focusedButton, setFocusedButton] = useState<'cancel' | 'confirm'>(
    'cancel'
  );
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  /**
   * Focus the specified button
   */
  const focusButton = useCallback((button: 'cancel' | 'confirm') => {
    const ref = button === 'cancel' ? cancelButtonRef : confirmButtonRef;
    if (ref.current) {
      setTVFocus(ref.current, { scrollIntoView: false });
      setFocusedButton(button);
    }
  }, []);

  /**
   * Handle confirm action
   */
  const handleConfirm = useCallback(() => {
    onConfirm();
    // Try to close the browser tab/window
    // Note: This may not work in all browsers due to security restrictions
    try {
      window.close();
    } catch {
      // If window.close() doesn't work, show instructions
      alert('请使用遥控器的主页键或返回键退出浏览器，或手动关闭此标签页。');
    }
  }, [onConfirm]);

  /**
   * Handle keyboard navigation within the dialog
   */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      const key = e.key;

      // D-Pad Left/Right - switch between buttons
      if (
        TV_KEY_CODES.DPAD_LEFT.includes(key) ||
        TV_KEY_CODES.DPAD_RIGHT.includes(key)
      ) {
        e.preventDefault();
        e.stopPropagation();
        const newButton = focusedButton === 'cancel' ? 'confirm' : 'cancel';
        focusButton(newButton);
        return;
      }

      // D-Pad Up/Down - also switch between buttons (for accessibility)
      if (
        TV_KEY_CODES.DPAD_UP.includes(key) ||
        TV_KEY_CODES.DPAD_DOWN.includes(key)
      ) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      // Enter - activate focused button
      if (TV_KEY_CODES.DPAD_CENTER.includes(key)) {
        e.preventDefault();
        e.stopPropagation();
        if (focusedButton === 'cancel') {
          onClose();
        } else {
          handleConfirm();
        }
        return;
      }

      // Back key - close dialog (cancel)
      if (TV_KEY_CODES.BACK.includes(key)) {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }
    },
    [isOpen, focusedButton, focusButton, onClose, handleConfirm]
  );

  /**
   * Register as highest priority back handler layer when open
   */
  useEffect(() => {
    if (!isOpen) return;

    const unregister = registerBackHandlerLayer({
      id: 'exit-confirm-dialog',
      priority: BACK_HANDLER_PRIORITY.EXIT_DIALOG,
      onClose: () => {
        onClose();
        return true;
      },
    });

    return unregister;
  }, [isOpen, onClose]);

  /**
   * Store previous focus and set up keyboard listener when dialog opens
   */
  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element to restore later
      previousFocusRef.current = document.activeElement as HTMLElement;

      // Focus the cancel button by default
      setTimeout(() => {
        focusButton('cancel');
      }, 50);

      // Add keyboard listener
      document.addEventListener('keydown', handleKeyDown, true);

      return () => {
        document.removeEventListener('keydown', handleKeyDown, true);
      };
    } else {
      // Restore focus when dialog closes
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
        previousFocusRef.current = null;
      }
    }
  }, [isOpen, focusButton, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      className='fixed inset-0 z-[2000] flex items-center justify-center'
      role='alertdialog'
      aria-modal='true'
      aria-labelledby='exit-dialog-title'
      aria-describedby='exit-dialog-description'
    >
      {/* Backdrop overlay */}
      <div className='absolute inset-0 bg-black/70 backdrop-blur-sm' />

      {/* Dialog content */}
      <div className='relative w-full max-w-md mx-4 bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden'>
        {/* Header */}
        <div className='flex items-center justify-between px-6 py-4 border-b border-gray-700/50'>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-red-500/20 rounded-lg'>
              <LogOut className='w-5 h-5 text-red-400' />
            </div>
            <h2
              id='exit-dialog-title'
              className='text-xl font-semibold text-white'
            >
              退出确认
            </h2>
          </div>
          <button
            onClick={onClose}
            className='p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors'
            aria-label='关闭'
            tabIndex={-1}
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        {/* Body */}
        <div className='px-6 py-6'>
          <p
            id='exit-dialog-description'
            className='text-gray-300 text-lg text-center'
          >
            确定要退出应用吗？
          </p>
        </div>

        {/* Footer with buttons */}
        <div className='flex gap-4 px-6 py-4 border-t border-gray-700/50'>
          <button
            ref={cancelButtonRef}
            onClick={onClose}
            data-tv-focusable='true'
            tabIndex={0}
            className={`
              flex-1 px-6 py-3 rounded-xl text-lg font-medium
              transition-all duration-200 outline-none
              ${
                focusedButton === 'cancel'
                  ? 'bg-gray-600 text-white ring-2 ring-green-500 ring-offset-2 ring-offset-gray-900 scale-105'
                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
              }
            `}
          >
            取消
          </button>
          <button
            ref={confirmButtonRef}
            onClick={handleConfirm}
            data-tv-focusable='true'
            tabIndex={0}
            className={`
              flex-1 px-6 py-3 rounded-xl text-lg font-medium
              transition-all duration-200 outline-none
              ${
                focusedButton === 'confirm'
                  ? 'bg-red-600 text-white ring-2 ring-green-500 ring-offset-2 ring-offset-gray-900 scale-105'
                  : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
              }
            `}
          >
            确定退出
          </button>
        </div>

        {/* Footer hint */}
        <div className='px-6 py-3 bg-gray-800/50 border-t border-gray-700/30'>
          <div className='flex items-center justify-center gap-4 text-sm text-gray-500'>
            <span className='flex items-center gap-1'>
              <kbd className='px-2 py-0.5 bg-gray-700 rounded text-xs'>←→</kbd>
              <span>切换</span>
            </span>
            <span className='flex items-center gap-1'>
              <kbd className='px-2 py-0.5 bg-gray-700 rounded text-xs'>OK</kbd>
              <span>确认</span>
            </span>
            <span className='flex items-center gap-1'>
              <kbd className='px-2 py-0.5 bg-gray-700 rounded text-xs'>
                返回
              </kbd>
              <span>取消</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TVExitConfirmDialog;
