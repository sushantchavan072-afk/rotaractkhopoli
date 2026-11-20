import {Home} from '../components/pages';
import IntroOverlay from '../components/ui/intro-overlay';
import {pageMeta} from '../lib/seo';

const meta = pageMeta('/', null, 'Rotaract Club of Khopoli is a community based Rotaract club in District 3131, chartered November 2020. Community service, skills and fellowship in Khopoli.');
export const metadata = { ...meta, title: { absolute: 'Rotaract Club of Khopoli: a small town club that keeps its word' } };
export default function Page(){ return <><IntroOverlay/><Home/></>; }
