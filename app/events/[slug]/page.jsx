import {notFound} from 'next/navigation';
import {EventDetail} from '../../../components/pages';
import {events} from '../../../data/club';

export const dynamicParams = false;
export function generateStaticParams(){ return events.map((e) => ({ slug: e.slug })); }
export async function generateMetadata({ params }){
  const { slug } = await params;
  const e = events.find((x) => x.slug === slug);
  return e ? { title: e.title, description: e.summary } : {};
}
export default async function Page({ params }){
  const { slug } = await params;
  if (!events.some((e) => e.slug === slug)) notFound();
  return <EventDetail slug={slug}/>;
}
