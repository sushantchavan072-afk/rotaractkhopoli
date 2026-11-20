import '@fontsource-variable/urbanist';
import './globals.css';
import {Analytics} from '@vercel/analytics/next';
import {Header, Footer, ScrollReveal} from '../components/ui';
import BackgroundPixelStars from '@/components/ui/background-pixel-stars';
import {club, SITE_URL} from '../data/club';
import {organizationJsonLd} from '../lib/seo';

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: club.name, template: `%s | ${club.name}` },
  description: 'Community based Rotaract club in Khopoli, chartered November 2020. Community service, professional development and fellowship in District 3131.',
};

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0c0d10' },
  ],
};

/** Applies the saved (or device) theme before the first paint, so the page never flashes the wrong theme. */
const THEME_SCRIPT = `(function(){var d=document.documentElement;try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}d.dataset.theme=t}catch(e){d.dataset.theme='light'}})();`;

export default function RootLayout({ children }){
  return (
    <html lang="en-IN" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <div className="site-bg-grid" aria-hidden="true" />
        <BackgroundPixelStars />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
        <Header/>
        <main id="main" tabIndex={-1}>{children}</main>
        <Footer/>
        <ScrollReveal/>
        {process.env.VERCEL && <Analytics/>}
      </body>
    </html>
  );
}
