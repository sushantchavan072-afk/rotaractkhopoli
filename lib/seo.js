import { SITE_URL, club, clubEmail, contact } from '../data/club';
import { to24 } from './calendar';

const DEFAULT_IMAGE = '/og-stage.jpg';
const MAX_TITLE = 65; // about what Google shows before cutting a title off
const MAX_DESCRIPTION = 158;

/** The page title as it will appear in search results, kept short enough not to be cut off. */
function fitTitle(title) {
  if (!title) return undefined;
  if (`${title} | ${club.name}`.length <= MAX_TITLE) return title; // the layout adds " | Rotaract Club of Khopoli"
  if (`${title} | ${club.shortName}`.length <= MAX_TITLE) return { absolute: `${title} | ${club.shortName}` };
  return { absolute: title };
}

/** Descriptions longer than search results show are cut at a word, with an ellipsis. */
function fitDescription(text) {
  if (!text || text.length <= MAX_DESCRIPTION) return text;
  const cut = text.slice(0, MAX_DESCRIPTION - 1);
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:.]$/, '')}…`;
}

/**
 * Standard metadata for a page: title, description, canonical URL and social share card.
 * `article` ({ publishedTime }) marks blog posts as articles for link previews.
 */
export function pageMeta(path, title, description, image = DEFAULT_IMAGE, { article } = {}) {
  const t = fitTitle(title);
  const shareTitle = title ? (typeof t === 'string' ? `${t} | ${club.name}` : t.absolute) : club.name;
  const desc = fitDescription(description);
  const img = image ?? DEFAULT_IMAGE;
  return {
    title: t,
    description: desc,
    alternates: { canonical: path },
    openGraph: {
      title: shareTitle,
      description: desc,
      url: path,
      siteName: club.name,
      locale: 'en_IN',
      type: article ? 'article' : 'website',
      ...(article && { publishedTime: article.publishedTime, authors: [club.name] }),
      images: [{ url: img, alt: title ?? club.name }],
    },
    twitter: { card: 'summary_large_image', title: shareTitle, description: desc, images: [img] },
  };
}

const ORG_ID = `${SITE_URL}/#organization`;
const SITE_ID = `${SITE_URL}/#website`;

/** Site-wide structured data: the club as an organisation, and the website itself. */
export const siteJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'NGO',
      '@id': ORG_ID,
      name: club.name,
      alternateName: club.shortName,
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/images/logos/rotaract-khopoli.png` },
      image: `${SITE_URL}${DEFAULT_IMAGE}`,
      foundingDate: '2020-11',
      description: club.intro,
      email: clubEmail,
      areaServed: { '@type': 'Place', name: 'Khopoli, Raigad district, Maharashtra, India' },
      address: { '@type': 'PostalAddress', addressLocality: 'Khopoli', addressRegion: 'Maharashtra', addressCountry: 'IN' },
      parentOrganization: { '@type': 'Organization', name: 'Rotary Club of Khopoli' },
      memberOf: { '@type': 'Organization', name: 'Rotary International', url: 'https://www.rotary.org' },
      sameAs: Object.values(contact.social ?? {}).filter(Boolean),
    },
    { '@type': 'WebSite', '@id': SITE_ID, url: SITE_URL, name: club.name, inLanguage: 'en-IN', publisher: { '@id': ORG_ID } },
  ],
};

/** Breadcrumb trail for search results, e.g. [['Events', '/events'], ['Road Safety Awareness Drive', '/events/road-safety-drive']]. */
export function breadcrumbJsonLd(trail) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [['Home', '/'], ...trail].map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: `${SITE_URL}${path}` })),
  };
}

/** Structured data for a club event: dates in India time when the time is known, place or online. */
export function eventJsonLd(e, photo) {
  const [start, end] = String(e.time ?? '').split(/\s*-\s*/).map(to24);
  const when = (date, hhmm) => (hhmm ? `${date}T${hhmm}:00+05:30` : date);
  const online = /online/i.test(e.venue);
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: e.title,
    description: e.summary,
    url: `${SITE_URL}/events/${e.slug}`,
    startDate: when(e.date, start),
    endDate: when(e.endDate ?? e.date, end ?? (e.endDate ? null : start)),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: online ? 'https://schema.org/OnlineEventAttendanceMode' : 'https://schema.org/OfflineEventAttendanceMode',
    location: online
      ? { '@type': 'VirtualLocation', url: `${SITE_URL}/events/${e.slug}` }
      : { '@type': 'Place', name: e.venue, address: { '@type': 'PostalAddress', streetAddress: e.venue, addressCountry: 'IN' } },
    image: `${SITE_URL}${photo ?? DEFAULT_IMAGE}`,
    organizer: { '@type': 'Organization', '@id': ORG_ID, name: club.name, url: SITE_URL },
    ...(e.partner && { contributor: { '@type': 'Organization', name: e.partner } }),
  };
}

/** Structured data for a blog post. */
export function postJsonLd(p) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: p.title,
    description: p.excerpt,
    datePublished: p.date,
    dateModified: p.date,
    image: `${SITE_URL}${p.image}`,
    url: `${SITE_URL}/blog/${p.slug}`,
    mainEntityOfPage: `${SITE_URL}/blog/${p.slug}`,
    inLanguage: 'en-IN',
    author: { '@type': 'Organization', '@id': ORG_ID, name: club.name, url: SITE_URL },
    publisher: { '@type': 'Organization', '@id': ORG_ID, name: club.name, logo: { '@type': 'ImageObject', url: `${SITE_URL}/images/logos/rotaract-khopoli.png` } },
  };
}

/** Structured data for a list of questions and answers. */
export function faqJsonLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
}
