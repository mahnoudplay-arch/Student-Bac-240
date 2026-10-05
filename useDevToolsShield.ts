import { useEffect } from 'react';

export function useDevToolsShield() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Silence sensitive console logging in student platform
    const originalLog = console.log;
    const originalInfo = console.info;
    const originalDebug = console.debug;
    const originalDir = console.dir;

    console.log = () => {};
    console.info = () => {};
    console.debug = () => {};
    console.dir = () => {};

    // 3. Block Context Menu (Right-Click)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    // 4. Block Keyboard Shortcuts (F12, Inspect, Source, Save)
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12 key
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      const isCtrlOrMeta = e.ctrlKey || e.metaKey;

      // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C (or Cmd+Option+I on Mac)
      if (
        (isCtrlOrMeta && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) ||
        (e.metaKey && e.altKey && (e.key === 'I' || e.key === 'i'))
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+U (View Source)
      if (isCtrlOrMeta && (e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+S / Cmd+S (Save Page to disk)
      if (isCtrlOrMeta && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+P / Cmd+P (Print page / Export to PDF)
      if (isCtrlOrMeta && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // 5. Block Clipboard Copy & Cut on sensitive content (allow in input and textarea)
    const handleCopyCut = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      e.preventDefault();
      return false;
    };

    // 6. Block dragging text or media elements
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };

    // 7. Active Window Dimension Discrepancy Detection for DevTools
    // Note: If running inside an iframe (e.g. AI Studio preview, Telegram Mini App),
    // window.outerWidth/Height is the parent window, causing false positives.
    // Also prevent infinite reload loop.
    let checkInterval: NodeJS.Timeout | null = null;
    let antiDebuggerInterval: NodeJS.Timeout | null = null;
    const isIframe = typeof window !== 'undefined' && window.self !== window.top;

    if (!isIframe) {
      let detectionFired = false;
      const checkDevToolsOpen = () => {
        if (detectionFired) return;

        const threshold = 200;
        const widthDiff = window.outerWidth - window.innerWidth > threshold;
        const heightDiff = window.outerHeight - window.innerHeight > threshold;

        if (widthDiff || heightDiff) {
          detectionFired = true;
          try {
            sessionStorage.removeItem('bac240_current_session');
          } catch {}
        }
      };

      checkInterval = setInterval(checkDevToolsOpen, 2000);

      // Lightweight anti-debugger barrier for unauthorized users
      antiDebuggerInterval = setInterval(() => {
        try {
          (function() {
            return false;
          }['constructor']('debugger')());
        } catch {}
      }, 3000);
    }

    window.addEventListener('contextmenu', handleContextMenu, true);
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('copy', handleCopyCut, true);
    window.addEventListener('cut', handleCopyCut, true);
    window.addEventListener('dragstart', handleDragStart, true);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu, true);
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('copy', handleCopyCut, true);
      window.removeEventListener('cut', handleCopyCut, true);
      window.removeEventListener('dragstart', handleDragStart, true);
      if (checkInterval) clearInterval(checkInterval);
      if (antiDebuggerInterval) clearInterval(antiDebuggerInterval);

      // Restore console on unmount
      console.log = originalLog;
      console.info = originalInfo;
      console.debug = originalDebug;
      console.dir = originalDir;
    };
  }, []);
}
