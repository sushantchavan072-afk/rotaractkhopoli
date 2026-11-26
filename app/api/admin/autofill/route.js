import { isAdmin, sameOrigin, json } from '../../../../lib/admin/auth';
import { geminiConfigured, geminiReadImage, geminiOverLimit } from '../../../../lib/ai/gemini';
import { avenues } from '../../../../data/club';

/**
 * Auto-fill an event from a photo: POST { image } (a JPEG, base64, prepared in the browser) returns the event
 * details Gemini could read from it (a poster, invitation, certificate or report). Nothing is saved: the admin
 * page puts the details into the event form for the board member to check.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const AVENUES = [...new Set([...avenues.flatMap((a) => a.eventAvenues), 'Rotary–Rotaract Relations', 'Sports'])];
const MAX_IMAGE = 2.5 * 1024 * 1024; // base64 characters

const SCHEMA = {
  type: 'OBJECT',
  properties: {
    title: { type: 'STRING', description: 'The event name, in title case, without the club name.' },
    date: { type: 'STRING', description: 'Start date as YYYY-MM-DD, or empty if not shown.' },
    endDate: { type: 'STRING', description: 'End date as YYYY-MM-DD for events over several days, else empty.' },
    time: { type: 'STRING', description: 'For example "6:00 PM - 8:00 PM", or empty.' },
    venue: { type: 'STRING', description: 'Place, with the town, e.g. "Rotary Hall, Khopoli". Empty if not shown.' },
    avenue: { type: 'STRING', enum: AVENUES, description: 'The avenue of service the event belongs to.' },
    partner: { type: 'STRING', description: 'Partner organisations or co-hosts, comma separated, or empty.' },
    summary: { type: 'STRING', description: 'One or two plain sentences (at most 220 characters) on what the event is.' },
  },
  required: ['title', 'date', 'venue', 'avenue', 'summary'],
};

const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`));
const clip = (v, max) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '');

export async function POST(request) {
  if (!sameOrigin(request)) return json({ error: 'Not allowed.' }, 403);
  if (!isAdmin(request)) return json({ error: 'Please sign in again.' }, 401);
  if (!geminiConfigured()) return json({ error: 'Auto-fill needs GEMINI_API_KEY in Vercel (the same key Joey uses).' }, 503);
  const body = await request.json().catch(() => null);
  const image = typeof body?.image === 'string' ? body.image : '';
  if (!image || image.length > MAX_IMAGE || !/^[A-Za-z0-9+/=]+$/.test(image)) return json({ error: 'Please choose a photo (JPEG or PNG).' }, 400);
  const today = new Date().toISOString().slice(0, 10);
  try {
    const raw = await geminiReadImage({
      image,
      schema: SCHEMA,
      signal: request.signal,
      instruction: `This is a photo of a poster, invitation, certificate or report for an event by the Rotaract Club of Khopoli (Maharashtra, India). Read it and fill in the event details. Today is ${today}: when the year isn't shown, use the next such date from today. Don't make anything up: leave a field empty when the photo doesn't show it. Choose the avenue from the list that fits best. Write the summary in plain English.`,
    });
    const out = {
      title: clip(raw.title, 120).replace(/^\p{Ll}/u, (c) => c.toUpperCase()),
      date: isDate(raw.date) ? raw.date : '',
      endDate: isDate(raw.endDate) && raw.endDate > raw.date ? raw.endDate : '',
      time: clip(raw.time, 40),
      venue: clip(raw.venue, 120),
      avenue: AVENUES.includes(raw.avenue) ? raw.avenue : '',
      partner: clip(raw.partner, 160),
      summary: clip(raw.summary, 280),
    };
    return json({ fields: Object.fromEntries(Object.entries(out).filter(([, v]) => v)) });
  } catch (e) {
    if (geminiOverLimit(e) || e.status === 429) return json({ error: 'Gemini’s free allowance is used up for the moment. Please try again in a minute.' }, 429);
    console.error('admin autofill', e?.message);
    return json({ error: 'The photo couldn’t be read just now. Please try again, or fill the details in by hand.' }, 502);
  }
}
