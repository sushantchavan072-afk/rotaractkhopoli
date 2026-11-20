import {NotFound} from '../components/pages';

export const metadata = { title: 'Page not found', robots: { index: false } };
export default function Page(){ return <NotFound/>; }
