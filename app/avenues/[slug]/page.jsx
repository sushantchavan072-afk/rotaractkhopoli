import {notFound} from 'next/navigation';
import {AvenueDetail} from '../../../components/pages';
import {avenues} from '../../../data/club';
import {pageMeta} from '../../../lib/seo';

export const dynamicParams = false;
export function generateStaticParams(){ return avenues.map((a) => ({ slug: a.slug })); }
export async function generateMetadata({ params }){
  const { slug } = await params;
  const a = avenues.find((x) => x.slug === slug);
  return a ? pageMeta(`/avenues/${a.slug}`, a.name, a.description) : {};
}
export default async function Page({ params }){
  const { slug } = await params;
  if (!avenues.some((a) => a.slug === slug)) notFound();
  return <AvenueDetail slug={slug}/>;
}
