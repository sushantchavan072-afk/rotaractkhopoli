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

export default function RootLayout({ children }){
  return (
    <html lang="en-IN">
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
