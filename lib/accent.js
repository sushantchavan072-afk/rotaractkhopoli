/**
 * Shared accent colours for the background, cursor and click sparks.
 *
 * - Each page has its own cursor colour (PAGE_CURSOR).
 * - The dot grid, the glow around the mouse and the click sparks drift through the Rotary family
 *   palette as you scroll; each page starts the cycle at a different colour.
 * The background updates `accent.rgb` while scrolling and the cursor reads it for the sparks.
 */

// Rotaract cranberry, Rotary royal blue, Rotary gold, Interact sky blue, green, coral
export const SCROLL_PALETTE = [
  [212, 19, 103],
  [23, 69, 143],
  [247, 168, 27],
  [0, 162, 224],
  [47, 191, 104],
  [242, 119, 79],
];
/** Pixels of scrolling for the colour to move one step along the palette. */
export const SCROLL_STEP = 700;

const NAVY = 'hsl(220 65% 22%)'; // the rotaractscop.org cursor colour

/** Cursor colour and where the scroll colours start, per top-level page. */
const PAGES = {
  '': { cursor: NAVY, start: 0 },
  about: { cursor: '#b4492a', start: 5 },
  teams: { cursor: '#d41367', start: 0 },
  avenues: { cursor: '#1f7f45', start: 4 },
  events: { cursor: '#0077a8', start: 3 },
  blog: { cursor: '#a86d00', start: 2 },
  gallery: { cursor: '#17458f', start: 1 },
  reviews: { cursor: '#d41367', start: 0 },
  'district-3131': { cursor: '#d41367', start: 0 },
  'rotary-information': { cursor: '#17458f', start: 1 },
  join: { cursor: '#1f7f45', start: 4 },
  'bod-application': { cursor: '#1f7f45', start: 4 },
  sponsorship: { cursor: '#a86d00', start: 2 },
  contact: { cursor: '#b4492a', start: 5 },
  faqs: { cursor: '#0077a8', start: 3 },
};

export function pageAccent(pathname = '/') {
  const key = pathname.split('/')[1] ?? '';
  return PAGES[key] ?? { cursor: NAVY, start: 0 };
}

/** Colour at `steps` along the palette (fractions blend between neighbours). */
export function paletteAt(steps) {
  const n = SCROLL_PALETTE.length;
  const i = ((Math.floor(steps) % n) + n) % n;
  const f = steps - Math.floor(steps);
  const a = SCROLL_PALETTE[i];
  const b = SCROLL_PALETTE[(i + 1) % n];
  return [0, 1, 2].map((k) => Math.round(a[k] + (b[k] - a[k]) * f));
}

/** Current scroll colour, shared between the background and the click sparks. */
export const accent = { rgb: SCROLL_PALETTE[0] };
