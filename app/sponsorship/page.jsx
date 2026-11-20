import {Sponsorship} from '../../components/pages';
import {pageMeta} from '../../lib/seo';

export const metadata = pageMeta('/sponsorship', "Sponsorship", "Sponsor a Rotaract Club of Khopoli project. Partnership tiers, in-kind support, what sponsors receive and how every rupee is reported.");
export default function Page(){ return <Sponsorship/>; }
