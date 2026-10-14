'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Share, SquarePlus, X } from 'lucide-react';
import { LogoMark } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { promptInstall, useInstallState } from '@/lib/install-prompt';
import { cn } from '@/lib/utils';

const DISMISS_KEY = 'prepmonkey.install-dismissed';
const QUIET_DAYS = 14;
const SHOW_AFTER_MS = 3500;

function dismissedRecently() {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY));
    return Boolean(at) && Date.now() - at < QUIET_DAYS * 86_400_000;
  } catch {
    return false;
  }
}

/**
 * A small "install the app" card on phones. On Android it opens the browser's
 * own install dialog; Safari on iPhone and iPad has no such dialog, so it shows
 * the two Share-menu steps instead. Appears a few seconds after load, never
 * when already installed, and stays away for two weeks once dismissed.
 */
export function InstallBanner({ aboveTabBar }: { aboveTabBar: boolean }) {
  const state = useInstallState();
  const [ready, setReady] = useState(false);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    if (dismissedRecently()) return;
    const t = setTimeout(() => setReady(true), SHOW_AFTER_MS);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    setClosed(true);
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* private mode: just hide it */ }
  };

  const open = ready && !closed && (state === 'promptable' || state === 'ios');

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          role="dialog"
          aria-label="Install PrepMonkey"
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          className={cn('pb-safe fixed inset-x-3 z-50 md:hidden print:hidden', aboveTabBar ? 'bottom-24' : 'bottom-3')}
        >
          <div className="glass mx-auto flex max-w-md items-start gap-3 rounded-[1.4rem] p-3.5 shadow-lg backdrop-blur-2xl">
            <LogoMark className="size-11 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Get the PrepMonkey app</p>
              {state === 'promptable' ? (
                <>
                  <p className="text-xs text-muted-foreground">Opens from your home screen, full screen, in a tap.</p>
                  <Button variant="premium" size="sm" className="mt-2.5" onClick={() => { void promptInstall().then((ok) => ok && setClosed(true)); }}>
                    Install
                  </Button>
                </>
              ) : (
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  Tap <Share className="mx-0.5 inline size-3.5 -translate-y-px text-primary" aria-label="Share" /> in Safari, then{' '}
                  <b className="text-foreground">Add to Home Screen</b> <SquarePlus className="mx-0.5 inline size-3.5 -translate-y-px text-primary" aria-hidden />.
                </p>
              )}
            </div>
            <button type="button" onClick={dismiss} aria-label="Not now" className="-m-1 grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-wash hover:text-foreground">
              <X className="size-4" />
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
