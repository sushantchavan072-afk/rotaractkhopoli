import {BodApplication} from '../../components/pages';
import {pageMeta} from '../../lib/seo';

export const metadata = pageMeta('/bod-application', "Board Application", "Apply for a board position at Rotaract Club of Khopoli. Eligibility, what the board looks for, and the candidature form.");
export default function Page(){ return <BodApplication/>; }
