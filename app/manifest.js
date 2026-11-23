import { club } from '../data/club';

/** Web app manifest: the name, icon and colours used when the site is saved to a phone's home screen. */
export default function manifest() {
  return {
    name: club.name,
    short_name: club.shortName,
    description: 'Community based Rotaract club in Khopoli, Rotaract District 3131.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    icons: [
      { src: '/icon.png', sizes: '512x512', type: 'image/png' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  };
}
