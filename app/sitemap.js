import {ALL_PAGES, avenues, events, SITE_URL} from '../data/club';

export default function sitemap(){
  const paths = [...ALL_PAGES.map(([, href]) => href), ...avenues.map((a) => `/avenues/${a.slug}`), ...events.map((e) => `/events/${e.slug}`)];
  return paths.map((path) => ({ url: SITE_URL + path, lastModified: new Date(), changeFrequency: path.startsWith('/events') ? 'weekly' : 'monthly', priority: path === '/' ? 1 : 0.7 }));
}
