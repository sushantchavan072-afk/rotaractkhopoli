'use client';

import dynamic from 'next/dynamic';

/**
 * The team cards and the world map use the `motion` animation library. Importing them through here
 * puts it in its own file that the browser downloads only on pages that show a team section or the
 * map. They are still rendered on the server, so the content is in the page from the start.
 */
export const Team = dynamic(() => import('./team-02'));
export const WorldMap = dynamic(() => import('./map').then((m) => m.WorldMap));
