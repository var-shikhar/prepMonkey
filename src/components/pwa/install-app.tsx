'use client';

import { CheckCircle2, Download, Share, SquarePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { promptInstall, useInstallState } from '@/lib/install-prompt';

/** "Install app" controls for Settings: the browser's own dialog where it exists, short steps where it doesn't. */
export function InstallApp() {
  const state = useInstallState();

  if (state === 'unknown') return null;

  if (state === 'installed') {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <CheckCircle2 className="size-4 text-success" /> You&apos;re using the installed app.
      </p>
    );
  }

  if (state === 'promptable') {
    return (
      <Button variant="premium" onClick={() => void promptInstall()}>
        <Download /> Install PrepMonkey
      </Button>
    );
  }

  if (state === 'ios') {
    return (
      <ol className="space-y-2 text-sm text-muted-foreground">
        <li className="flex items-center gap-2"><Share className="size-4 shrink-0 text-primary" /> In Safari, tap <b className="text-foreground">Share</b>.</li>
        <li className="flex items-center gap-2"><SquarePlus className="size-4 shrink-0 text-primary" /> Choose <b className="text-foreground">Add to Home Screen</b>, then <b className="text-foreground">Add</b>.</li>
      </ol>
    );
  }

  return (
    <p className="text-sm text-muted-foreground">
      Open your browser&apos;s menu and choose <b className="text-foreground">Install app</b> (Chrome, Edge) or{' '}
      <b className="text-foreground">Add to Dock</b> (Safari on Mac).
    </p>
  );
}
