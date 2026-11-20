import {ALL_PAGES, events} from '../data/club';

const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
export default function sitemap(){
  return [...ALL_PAGES.map(([, href]) => href), ...events.map((e) => `/events/${e.slug}`)]
    .map((path) => ({ url: base + path, lastModified: new Date() }));
}
