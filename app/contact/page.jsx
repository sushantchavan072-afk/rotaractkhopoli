import {Contact} from '../../components/pages';
import {pageMeta} from '../../lib/seo';

export const metadata = pageMeta('/contact', "Contact", "Contact Rotaract Club of Khopoli. Email the club, find where we meet, or send a message straight to the board.");
export default function Page(){ return <Contact/>; }
