import {About} from '../../components/pages';
import {pageMeta} from '../../lib/seo';

export const metadata = pageMeta('/about', "About the Club", "How Rotaract Club of Khopoli started in November 2020, how it is organised, and where it sits within Rotaract District 3131 and Rotary International.");
export default function Page(){ return <About/>; }
