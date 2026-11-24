import AdminApp from '../../components/admin/admin-app';

export const metadata = {
  title: 'Club admin',
  description: 'Password-protected page where the club board edits events, photos and the team.',
  robots: { index: false, follow: false },
};

export default function Page() { return <AdminApp />; }
