/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  images: { formats: ['image/avif', 'image/webp'] },
  async redirects() {
    return [{ source: '/members', destination: '/teams', permanent: true }];
  },
};
export default config;
