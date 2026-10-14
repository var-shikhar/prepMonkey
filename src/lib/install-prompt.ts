'use client';

import { useSyncExternalStore } from 'react';

// Chromium fires `beforeinstallprompt` once, early in the page's life. PwaRegister
// listens for it from the root layout and parks it here, so an "Install app"
// button anywhere in the app can show the browser's install dialog later.

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export type InstallState = 'installed' | 'promptable' | 'ios' | 'manual' | 'unknown';

let deferred: BeforeInstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function listenForInstallPrompt() {
  const onPrompt = (e: Event) => { e.preventDefault(); deferred = e as BeforeInstallPromptEvent; emit(); };
  const onInstalled = () => { installed = true; deferred = null; emit(); };
  window.addEventListener('beforeinstallprompt', onPrompt);
  window.addEventListener('appinstalled', onInstalled);
  return () => {
    window.removeEventListener('beforeinstallprompt', onPrompt);
    window.removeEventListener('appinstalled', onInstalled);
  };
}

function snapshot(): InstallState {
  const standalone = window.matchMedia('(display-mode: standalone)').matches
    || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (installed || standalone) return 'installed';
  if (deferred) return 'promptable';
  // iPhone and iPad (iPadOS reports as a Mac with touch) install from Safari's Share menu.
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  return ios ? 'ios' : 'manual';
}

export function useInstallState(): InstallState {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    snapshot,
    () => 'unknown',
  );
}

/** Shows the browser's install dialog; resolves true if the user accepted. */
export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false;
  const event = deferred;
  deferred = null;
  await event.prompt();
  const { outcome } = await event.userChoice;
  emit();
  return outcome === 'accepted';
}
