import '@fontsource-variable/urbanist';
import './globals.css';
import {Analytics} from '@vercel/analytics/next';
import {Header, Footer, ScrollReveal} from '../components/ui';
import DotGlowBackground from '@/components/ui/background-dot-glow';
import CustomCursor from '@/components/ui/custom-cursor';
import {club, SITE_URL} from '../data/club';
import {organizationJsonLd} from '../lib/seo';

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: club.name, template: `%s | ${club.name}` },
  description: 'Community based Rotaract club in Khopoli, chartered November 2020. Community service, professional development and fellowship in District 3131.',
};

export const viewport = {
  themeColor: '#ffffff',
};

/**
 * Decides before first paint whether the home page intro plays (components/ui/intro-overlay.jsx):
 * only on the home page, once per browser session, never with reduced motion or for automated
 * browsers. ?intro=1 replays it. After 8 seconds the class is removed whatever happens, so the
 * page can never stay hidden.
 */
const INTRO_SCRIPT = `(function(){try{if(location.pathname!=='/')return;var d=document.documentElement,f=/[?&]intro=1/.test(location.search);if(!f&&(navigator.webdriver||sessionStorage.getItem('rck-intro')||matchMedia('(prefers-reduced-motion: reduce)').matches))return;d.classList.add('intro-on');setTimeout(function(){d.classList.remove('intro-on')},8000)}catch(e){}})();`;

export default function RootLayout({ children }){
  return (
    <html lang="en-IN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: INTRO_SCRIPT }} />
      </head>
      <body>
        <DotGlowBackground />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
        <Header/>
        <main id="main" tabIndex={-1}>{children}</main>
        <Footer/>
        <ScrollReveal/>
        <CustomCursor/>
        {process.env.VERCEL && <Analytics/>}
      </body>
    </html>
  );
}
