// Renders public/og.png (1200x630) from an inline SVG. Run: node scripts/og.mjs
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const fontPath = path.join(root, 'node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2');
const font = readFileSync(fontPath).toString('base64');

const logo = readFileSync(path.join(root, 'src/assets/logo.txt'), 'utf8').trimEnd().split('\n');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const logoText = logo
  .map((l, i) => `<tspan x="80" dy="${i === 0 ? 0 : 26}" xml:space="preserve">${esc(l)}</tspan>`)
  .join('');

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <style>
    @font-face { font-family: "JB"; src: url(data:font/woff2;base64,${font}) format("woff2"); }
    text { font-family: "JB", "JetBrains Mono", ui-monospace, monospace; }
  </style>
  <rect width="1200" height="630" fill="#fcfcfc"/>
  <text y="120" font-size="24" fill="#18181b" font-weight="700">${logoText}</text>
  <text x="80" y="330" font-size="26" fill="#a1a1aa">${'='.repeat(60)}</text>
  <text x="80" y="385" font-size="30" fill="#27272a">JavaScript on Kubernetes</text>
  <text x="80" y="435" font-size="22" fill="#52525b">Recipes for running Node.js on Kubernetes.</text>
  <text x="80" y="470" font-size="22" fill="#52525b">Images, signals, probes, manifests, Helm, Kustomize.</text>
  <text x="80" y="540" font-size="20" fill="#1d4ed8">js-on-k8s.dev</text>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile(path.join(root, 'public/og.png'));
console.log('wrote public/og.png');
