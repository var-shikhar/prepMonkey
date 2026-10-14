'use client';

import { useEffect } from 'react';
import { listenForInstallPrompt } from '@/lib/install-prompt';

/**
 * Registers the service worker (public/sw.js) in production. In development it
 * removes any worker left over from a production build on localhost, so cached
 * assets never hide code changes. It also catches the browser's install prompt
 * for the "Install app" button (src/lib/install-prompt.ts).
 */
export function PwaRegister() {
  useEffect(() => listenForInstallPrompt(), []);
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    if (process.env.NODE_ENV !== 'production') {
      void navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => void r.unregister()));
      return;
    }
    const register = () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).catch(() => {
        // Registration is an enhancement: the site works the same without it.
      });
    };
    // Wait for the page to finish loading so registration never competes with it.
    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register, { once: true });
  }, []);
  return null;
}
