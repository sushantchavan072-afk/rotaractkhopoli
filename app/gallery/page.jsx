import {Gallery} from '../../components/pages';
import {pageMeta} from '../../lib/seo';

export const metadata = pageMeta('/gallery', "Gallery", "Photographs from Rotaract Club of Khopoli's community projects, workshops, fellowships and partnerships in and around Khopoli.");
export default function Page(){ return <Gallery/>; }
