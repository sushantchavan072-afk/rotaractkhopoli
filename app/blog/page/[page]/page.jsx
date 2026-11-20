import {notFound} from 'next/navigation';
import {Blog} from '../../../../components/pages';
import {posts, PAGE_SIZE} from '../../../../data/club';
import {pageMeta} from '../../../../lib/seo';

const pages = Math.ceil(posts.length / PAGE_SIZE);
export const dynamicParams = false;
/** Page 1 lives at /blog; this route serves /blog/page/2 onwards once there are enough posts. */
export function generateStaticParams(){
  return pages > 1 ? Array.from({ length: pages - 1 }, (_, i) => ({ page: String(i + 2) })) : [{ page: '2' }];
}
export async function generateMetadata({ params }){
  const { page } = await params;
  return pageMeta(`/blog/page/${page}`, `Blog, page ${page}`, 'More stories from Rotaract Club of Khopoli.');
}
export default async function Page({ params }){
  const n = Number((await params).page);
  if (!Number.isInteger(n) || n < 2 || n > pages) notFound();
  return <Blog page={n}/>;
}
