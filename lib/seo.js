import { SITE_URL, club } from '../data/club';

/** Standard metadata for a page: title, description, canonical URL and social share card. */
export function pageMeta(path, title, description, image = '/og-team.jpg') {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: title ? `${title} | ${club.name}` : club.name,
      description,
      url: path,
      siteName: club.name,
      locale: 'en_IN',
      type: 'website',
      images: [{ url: image, width: 1200, height: 630, alt: club.name }],
    },
    twitter: { card: 'summary_large_image' },
  };
}

export const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'NGO',
  name: club.name,
  alternateName: club.shortName,
  url: SITE_URL,
  logo: `${SITE_URL}/images/logos/rotaract-khopoli.png`,
  foundingDate: '2020-11',
  description: club.intro,
  address: { '@type': 'PostalAddress', addressLocality: 'Khopoli', addressRegion: 'Maharashtra', addressCountry: 'IN' },
  parentOrganization: { '@type': 'Organization', name: 'Rotary International', url: 'https://www.rotary.org' },
};
