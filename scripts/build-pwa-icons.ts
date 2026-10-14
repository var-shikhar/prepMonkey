// Renders the install icons in public/icons/ from src/app/icon.svg.
//
//   npx tsx scripts/build-pwa-icons.ts
//
// - icon-192.png and icon-512.png: the mark on a transparent background ("any").
// - maskable-512.png: the mark inside Android's safe zone (the central 80%) on the
//   dark cocoa brand colour, so launchers can crop it to a circle or squircle.
// - badge-96.png: a single-colour silhouette for notification badges.

import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const SVG = fs.readFileSync(path.join('src', 'app', 'icon.svg'));
const OUT = path.join('public', 'icons');
const COCOA = '#1d1611';

async function plain(size: number) {
  await sharp(SVG, { density: 512 }).resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(path.join(OUT, `icon-${size}.png`));
}

async function maskable(size: number) {
  const inner = Math.round(size * 0.66);
  const mark = await sharp(SVG, { density: 512 }).resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: COCOA } })
    .composite([{ input: mark, gravity: 'center' }])
    .png()
    .toFile(path.join(OUT, `maskable-${size}.png`));
}

async function badge(size: number) {
  // White silhouette with alpha: Android tints badges and ignores colour.
  const alpha = await sharp(SVG, { density: 512 }).resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).ensureAlpha().extractChannel('alpha').toBuffer();
  await sharp({ create: { width: size, height: size, channels: 3, background: '#ffffff' } }).joinChannel(alpha).png().toFile(path.join(OUT, `badge-${size}.png`));
}

fs.mkdirSync(OUT, { recursive: true });
await Promise.all([plain(192), plain(512), maskable(192), maskable(512), badge(96)]);
console.log(`wrote ${fs.readdirSync(OUT).join(', ')} to ${OUT}`);
