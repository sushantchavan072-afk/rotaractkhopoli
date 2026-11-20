import {Avenues} from '../../components/pages';
import {pageMeta} from '../../lib/seo';

export const metadata = pageMeta('/avenues', "Avenues of Service", "The seven avenues Rotaract Club of Khopoli works in: community service, professional development, club and international service, PR, DEI and public image.");
export default function Page(){ return <Avenues/>; }
