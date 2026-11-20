import {ALL_PAGES, avenues, events, posts, SITE_URL} from '../data/club';

export default function sitemap(){
  const paths = [...new Set([...ALL_PAGES.map(([, href]) => href), ...avenues.map((a) => `/avenues/${a.slug}`), ...events.map((e) => `/events/${e.slug}`), ...posts.map((p) => `/blog/${p.slug}`)])];
  return paths.map((path) => ({ url: SITE_URL + path, lastModified: new Date(), changeFrequency: path.startsWith('/events') ? 'weekly' : 'monthly', priority: path === '/' ? 1 : 0.7 }));
}
