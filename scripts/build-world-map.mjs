// Builds public/images/world-dots.svg, the dotted world map behind the International Service map.
// dotted-map's own SVG writes one <circle> per dot (~590 KB); this writes every dot into a single
// path of round zero-length strokes, which looks the same at a fraction of the size.
// Run with: node scripts/build-world-map.mjs
import { writeFileSync } from 'node:fs';
import DottedMap from 'dotted-map';

const map = new DottedMap({ height: 100, grid: 'diagonal' });
const { width, height } = map.image;
const d = map.getPoints().map(({ x, y }) => `M${+x.toFixed(2)} ${+y.toFixed(2)}h0`).join('');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width * 8}" height="${height * 8}"><path d="${d}" stroke="#000" stroke-opacity=".26" stroke-width=".44" stroke-linecap="round" fill="none"/></svg>\n`;
writeFileSync(new URL('../public/images/world-dots.svg', import.meta.url), svg);
console.log(`world-dots.svg: ${map.getPoints().length} dots, ${(svg.length / 1024).toFixed(0)} KB, viewBox ${width}x${height}`);
