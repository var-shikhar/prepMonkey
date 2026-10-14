import type { MetadataRoute } from 'next';
import { SITE_NAME } from '@/lib/site';

// Web app manifest: lets PrepMonkey be installed to the home screen or desktop
// and open in its own window. Icons are rendered by scripts/build-pwa-icons.ts.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: `${SITE_NAME} · Mock exams & interview practice`,
    short_name: SITE_NAME,
    description: 'Timed certification mocks, practice drills, readiness analytics and AI mock interviews, all in one place.',
    start_url: '/dashboard?source=pwa',
    scope: '/',
    display: 'standalone',
    display_override: ['window-controls-overlay', 'standalone'],
    orientation: 'any',
    background_color: '#1d1611',
    theme_color: '#1d1611',
    categories: ['education', 'productivity'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Dashboard', url: '/dashboard?source=pwa-shortcut', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
      { name: 'Explore exams', url: '/explore?source=pwa-shortcut', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
      { name: 'Mock interview', url: '/interviews?source=pwa-shortcut', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
    ],
  };
}
