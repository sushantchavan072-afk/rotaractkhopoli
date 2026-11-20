import {Faqs} from '../../components/pages';
import {pageMeta} from '../../lib/seo';

export const metadata = pageMeta('/faqs', "FAQs", "Answers about Rotaract Club of Khopoli: who can join, fees, meetings, events, partnerships, and how Rotaract connects to Rotary.");
export default function Page(){ return <Faqs/>; }
