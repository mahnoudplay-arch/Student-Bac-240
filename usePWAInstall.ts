import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

// Global window cache to capture beforeinstallprompt early
declare global {
  interface Window {
    __bac240_deferred_install_prompt?: BeforeInstallPromptEvent | null;
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    window.__bac240_deferred_install_prompt = e as BeforeInstallPromptEvent;
  });
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => {
    return (typeof window !== 'undefined' && window.__bac240_deferred_install_prompt) || null;
  });
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect standalone mode (already installed and running as standalone app)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    // Detect persistent install flag saved upon installation
    let savedInstalled = false;
    try {
      savedInstalled = localStorage.getItem('bac240_pwa_installed') === 'true';
    } catch {}

    setIsInstalled(isStandalone || savedInstalled);

    // Also check getInstalledRelatedApps if supported by Chromium
    if ('getInstalledRelatedApps' in navigator) {
      try {
        (navigator as unknown as { getInstalledRelatedApps: () => Promise<unknown[]> })
          .getInstalledRelatedApps()
          .then((apps) => {
            if (Array.isArray(apps) && apps.length > 0) {
              setIsInstalled(true);
              try {
                localStorage.setItem('bac240_pwa_installed', 'true');
              } catch {}
            }
          })
          .catch(() => {});
      } catch {}
    }

    // Detect iOS devices (including iPadOS where userAgent can report as MacIntel)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice =
      /iphone|ipad|ipod/.test(userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      window.__bac240_deferred_install_prompt = e as BeforeInstallPromptEvent;
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      window.__bac240_deferred_install_prompt = null;
      setDeferredPrompt(null);
      try {
        localStorage.setItem('bac240_pwa_installed', 'true');
      } catch {}
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    const promptToUse = deferredPrompt || (typeof window !== 'undefined' ? window.__bac240_deferred_install_prompt : null);
    if (!promptToUse) return false;
    await promptToUse.prompt();
    const { outcome } = await promptToUse.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
      if (typeof window !== 'undefined') {
        window.__bac240_deferred_install_prompt = null;
      }
      try {
        localStorage.setItem('bac240_pwa_installed', 'true');
      } catch {}
      return true;
    }
    return false;
  };

  const resetInstalledStatus = () => {
    try {
      localStorage.removeItem('bac240_pwa_installed');
    } catch {}
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    install,
    resetInstalledStatus,
  };
}
