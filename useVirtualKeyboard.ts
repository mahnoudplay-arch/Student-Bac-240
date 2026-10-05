import { useState, useEffect } from 'react';

/**
 * Hook to detect if the mobile device's virtual/software keyboard is open.
 * Uses both visualViewport resizing and focus tracking on editable elements.
 */
export function useVirtualKeyboard(): boolean {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkViewport = () => {
      if (window.visualViewport) {
        // If viewport height dropped significantly relative to window height, keyboard is open
        const heightDifference = window.innerHeight - window.visualViewport.height;
        if (heightDifference > 130) {
          setIsKeyboardOpen(true);
          return;
        }
      }
    };

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const tagName = target.tagName;
      const isInput = tagName === 'INPUT';
      const isTextarea = tagName === 'TEXTAREA';
      const isContentEditable = target.isContentEditable;

      if (isInput) {
        const input = target as HTMLInputElement;
        // If inputMode is 'none' or input is readOnly, virtual keyboard will NOT open
        if (input.readOnly || input.inputMode === 'none' || input.type === 'button' || input.type === 'submit') {
          return;
        }
        setIsKeyboardOpen(true);
      } else if (isTextarea) {
        const textarea = target as HTMLTextAreaElement;
        if (textarea.readOnly) return;
        setIsKeyboardOpen(true);
      } else if (isContentEditable) {
        setIsKeyboardOpen(true);
      }
    };

    const handleFocusOut = () => {
      // Slight delay to check if another element received focus or if viewport returned
      setTimeout(() => {
        if (window.visualViewport) {
          const heightDifference = window.innerHeight - window.visualViewport.height;
          if (heightDifference > 130) {
            setIsKeyboardOpen(true);
            return;
          }
        }
        
        const active = document.activeElement as HTMLElement | null;
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA') && (active as HTMLInputElement).inputMode !== 'none') {
          setIsKeyboardOpen(true);
        } else {
          setIsKeyboardOpen(false);
        }
      }, 120);
    };

    window.visualViewport?.addEventListener('resize', checkViewport);
    window.addEventListener('focusin', handleFocusIn);
    window.addEventListener('focusout', handleFocusOut);

    return () => {
      window.visualViewport?.removeEventListener('resize', checkViewport);
      window.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  return isKeyboardOpen;
}
