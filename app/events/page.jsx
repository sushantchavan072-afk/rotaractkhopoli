import {Events} from '../../components/pages';
import {pageMeta} from '../../lib/seo';

export const metadata = pageMeta('/events', "Events and Projects", "Projects and events run by Rotaract Club of Khopoli, with dates, venues, avenues and partners. Filter upcoming and completed events by avenue.");
export default function Page(){ return <Events/>; }
