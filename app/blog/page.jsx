import {Blog} from '../../components/pages';
import {pageMeta} from '../../lib/seo';

export const metadata = pageMeta('/blog', "Blog & Updates", "Stories from Rotaract Club of Khopoli: our projects, our avenues of service, and how to get involved in Khopoli.");
export default function Page(){ return <Blog/>; }
