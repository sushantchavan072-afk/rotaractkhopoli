import {Reviews} from '../../components/pages';
import {pageMeta} from '../../lib/seo';

export const metadata = pageMeta('/reviews', "Reviews", "What members, partners and beneficiaries say about Rotaract Club of Khopoli, and how to share your own experience.");
export default function Page(){ return <Reviews/>; }
