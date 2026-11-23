import { existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * An event's photo: its own `image`, else public/images/events/<slug>.jpg when that file exists, else null
 * (pages then show the coloured placeholder and share cards fall back to the club photo). Server only.
 */
export function eventPhoto(e) {
  if (e.image) return e.image;
  const rel = `/images/events/${e.slug}.jpg`;
  return existsSync(join(process.cwd(), 'public', rel)) ? rel : null;
}
