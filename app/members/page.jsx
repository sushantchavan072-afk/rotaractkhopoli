import {Members} from '../../components/pages';
import {pageMeta} from '../../lib/seo';

export const metadata = pageMeta('/members', "Members", "Meet the office bearers, board of directors and chairpersons of Rotaract Club of Khopoli for the current Rotaract year, with every portfolio they hold.");
export default function Page(){ return <Members/>; }
