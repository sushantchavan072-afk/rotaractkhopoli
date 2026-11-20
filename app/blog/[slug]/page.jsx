import {notFound} from 'next/navigation';
import {BlogPost} from '../../../components/pages';
import {posts} from '../../../data/club';
import {pageMeta} from '../../../lib/seo';

export const dynamicParams = false;
export function generateStaticParams(){ return posts.map((p) => ({ slug: p.slug })); }
export async function generateMetadata({ params }){
  const { slug } = await params;
  const p = posts.find((x) => x.slug === slug);
  return p ? pageMeta(`/blog/${p.slug}`, p.title, p.excerpt, p.image) : {};
}
export default async function Page({ params }){
  const { slug } = await params;
  if (!posts.some((p) => p.slug === slug)) notFound();
  return <BlogPost slug={slug}/>;
}
