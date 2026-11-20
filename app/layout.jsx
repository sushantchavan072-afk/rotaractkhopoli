import './globals.css';
import {Header, Footer, ScrollReveal} from '../components/ui';

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: { default: 'Rotaract Club of Khopoli', template: '%s | Rotaract Club of Khopoli' },
  description: 'Community based Rotaract club in Khopoli, chartered November 2020. Community service, environment, professional development and fellowship in District 3131.',
  icons: { icon: '/favicon.png' },
  openGraph: { siteName: 'Rotaract Club of Khopoli', type: 'website', locale: 'en_IN' },
};

export default function RootLayout({ children }){
  return (
    <html lang="en">
      <body>
        <Header/>
        <main id="main">{children}</main>
        <Footer/>
        <ScrollReveal/>
      </body>
    </html>
  );
}
