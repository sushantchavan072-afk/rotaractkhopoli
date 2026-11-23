import { ALL_PAGES, avenues, events, posts, SITE_URL } from '../data/club';

/**
 * Every public page, for search engines. Events and blog posts give their own dates; the main pages
 * are marked as changed at each deploy.
 */
export default function sitemap() {
  const built = new Date();
  const entry = (path, priority, lastModified = built, changeFrequency = 'monthly') => ({ url: SITE_URL + path, lastModified, changeFrequency, priority });
  const main = [...new Set([...ALL_PAGES.map(([, href]) => href), ...avenues.map((a) => `/avenues/${a.slug}`)])]
    .filter((path) => !path.startsWith('/events/') && !path.startsWith('/blog/'))
    .map((path) => entry(path, path === '/' ? 1 : ['/events', '/join', '/about', '/teams'].includes(path) ? 0.9 : 0.7, built, path === '/events' ? 'weekly' : 'monthly'));
  const notAfterBuild = (iso) => new Date(Math.min(built.getTime(), new Date(`${iso}T00:00:00+05:30`).getTime()));
  const eventPages = events.map((e) => entry(`/events/${e.slug}`, 0.6, notAfterBuild(e.endDate ?? e.date)));
  const postPages = posts.map((p) => entry(`/blog/${p.slug}`, 0.6, notAfterBuild(p.date)));
  return [...main, ...eventPages, ...postPages];
}
