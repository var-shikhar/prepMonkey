'use client';

import { useSyncExternalStore } from 'react';

// motion's useReducedMotion reads the media query on the very first client
// render, so a visitor with reduced motion (Windows "Animation effects" off, for
// one) gets different markup from the server and hydration fails. This reports
// "no preference" until hydration is done, then the real setting, and follows changes.

const QUERY = '(prefers-reduced-motion: reduce)';

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}

export function useReducedMotionSafe(): boolean {
  return useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false);
}
