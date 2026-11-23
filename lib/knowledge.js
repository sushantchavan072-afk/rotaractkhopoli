/**
 * The assistant's knowledge: everything on the website, as short passages, with a search over them.
 *
 * Passages are built from data/club.js (the same data the pages are built from), so the assistant always
 * knows what the site says. Search is BM25, a standard keyword ranking: it needs no external service,
 * runs in a few milliseconds and handles the site's few hundred passages easily. Server only.
 */
import {
  club, clubFacts, clubEmail, contact, officers, coreMembers, boardOfDirectors, chairpersons, avenues, events,
  eventsForAvenue, posts, faqGroups, district, rotary, riPresident, districtGovernor, drr, sponsorTiers,
  joinCommitments, values, volunteerReasons, waysToHelp, rotaryDays, rotaractYear, formatDateRange,
} from '../data/club';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const text = (parts) => parts.flat(Infinity).filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
const paras = (body = []) => body.map((b) => b.p ?? b.h2 ?? b.quote ?? (b.list ? b.list.map((l) => `• ${l}`).join(' ') : '')).filter(Boolean);
const people = (list) => list.map((m) => `${m.name}: ${m.roles.join(', ')}`).join('. ');

function buildDocs() {
  const docs = [];
  const add = (title, url, ...parts) => docs.push({ title, url, text: text(parts) });

  add('About Rotaract Club of Khopoli', '/about',
    club.intro, clubFacts.map((f) => `${f.label}: ${f.value}.`), `Tagline: ${club.tagline}`,
    `The club's values: ${values.map((v) => `${v.title}: ${v.body}`).join(' ')}`,
    `The club ran or joined ${events.length} projects and activities in Rotaract year ${rotaractYear}.`);

  const president = officers.find((o) => o.role === 'President');
  add('Contact the club', '/contact',
    `Email the club at ${clubEmail}.`,
    president && contact.showPresidentPhone && president.phone ? `The President, ${president.name}, can be reached on ${president.phone}.` : '',
    contact.meetingPlace ? `The club meets at ${contact.meetingPlace}.` : '',
    'Messages can also be sent through the form on the Contact page.');

  add('Join the club', '/join',
    'Membership is open to anyone 18 and above living, studying or working in and around Khopoli. Apply through the form on the Join page.',
    `What membership involves: ${joinCommitments.map((c) => `${c.title}: ${c.body}`).join(' ')}`,
    `Why volunteer: ${volunteerReasons.map((r) => `${r.title}: ${r.body}`).join(' ')}`,
    `Ways to help: ${waysToHelp.map((w) => `${w.title}: ${w.body}`).join(' ')}`);

  add('Our team: office bearers', '/teams', `Office bearers for Rotaract year ${rotaractYear}: ${people(coreMembers)}.`,
    coreMembers.map((m) => (m.bio ? `${m.name}: ${m.bio}` : '')));
  add('Our team: board of directors', '/teams', `Board of directors: ${people(boardOfDirectors)}.`);
  add('Our team: chairpersons', '/teams', `Chairpersons: ${people(chairpersons)}.`);

  for (const a of avenues) {
    const list = eventsForAvenue(a);
    add(`Avenue: ${a.name}`, `/avenues/${a.slug}`, `${a.name} (${a.focus}).`, a.description, a.intro, a.body,
      list.length ? `Projects in this avenue: ${list.map((e) => `${e.title} (${formatDateRange(e)})`).join('; ')}.` : '');
  }

  // One passage per event, and a month-by-month list so questions like "what happened in August" work.
  for (const e of events) {
    add(e.title, `/events/${e.slug}`,
      `${e.title}. Date: ${formatDateRange(e)}.`, e.time ? `Time: ${e.time}.` : '', `Venue: ${e.venue}.`,
      `Avenue: ${[e.avenue, ...(e.otherAvenues ?? [])].join(', ')}.`, e.partner ? `With: ${e.partner}.` : '',
      e.summary, e.report, (e.outcomes ?? []).map((o) => `${o.label}: ${o.value}.`));
  }
  const byMonth = new Map();
  for (const e of events) {
    const [y, m] = e.date.split('-').map(Number);
    const key = `${MONTHS[m - 1]} ${y}`;
    byMonth.set(key, [...(byMonth.get(key) ?? []), e]);
  }
  for (const [month, list] of byMonth) {
    add(`Events in ${month}`, '/events', `Club projects and events in ${month}: ${list.map((e) => `${e.title} on ${formatDateRange(e)} at ${e.venue}`).join('; ')}.`);
  }
  add('Club calendar', '/events#calendar',
    'The Events page has a club calendar showing every project by day, with Google Calendar and .ics buttons for upcoming projects.',
    'The calendar for the rest of the Rotaract year is being finalised with the board; new projects appear on the Events page as soon as they are confirmed.',
    `Rotary family days marked on the calendar: ${rotaryDays.map((d) => `${d.title} (${Number(d.date.slice(3))} ${MONTHS[Number(d.date.slice(0, 2)) - 1]}): ${d.note}`).join(' ')}`);

  for (const g of faqGroups) {
    for (const f of g.items) add(`FAQ: ${f.q}`, '/faqs', f.q, f.a);
  }

  for (const p of posts) add(`Blog: ${p.title}`, `/blog/${p.slug}`, p.title, p.excerpt, paras(p.body));

  add('Rotaract District 3131', '/district-3131', district.intro, district.about,
    `District Rotaract Representative (DRR) for ${drr.year}: ${drr.name}. District theme: ${drr.theme}${drr.themeSub ? ` (${drr.themeSub})` : ''}.`,
    `District Governor of Rotary International District 3131 for ${districtGovernor.year}: ${districtGovernor.name}. Vision: ${districtGovernor.theme}.`,
    district.website ? `District website: ${district.website}` : '');
  add('Rotary International', '/rotary-information', rotary.intro, rotary.history, rotary.founded ? `Rotary was founded on ${rotary.founded}.` : '',
    `Rotary International President for ${riPresident.year}: ${riPresident.name}. Presidential theme: ${riPresident.theme}.`, riPresident.highlight);
  add('Leaders’ messages', '/rotary-information', drr.highlight, districtGovernor.highlight);

  add('Sponsorship', '/sponsorship', 'Businesses and organisations can sponsor a project or an avenue.',
    sponsorTiers.map((t) => `${t.name} (${t.scope}): ${t.perks.join('; ')}.`), 'In-kind support is also welcome. Use the form on the Sponsorship page.');
  add('Board application', '/bod-application', 'Members can apply for a position on the club’s board of directors through the Board Application page.');

  return docs;
}

/* ---------------- chunking ---------------- */
const MAX_CHUNK = 900;
function chunk(doc) {
  if (doc.text.length <= MAX_CHUNK * 1.3) return [doc];
  const sentences = doc.text.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) ?? [doc.text];
  const out = [];
  let cur = '';
  for (const s of sentences) {
    if (cur && (cur + s).length > MAX_CHUNK) { out.push(cur.trim()); cur = ''; }
    cur += s;
  }
  if (cur.trim()) out.push(cur.trim());
  return out.map((t, i) => ({ ...doc, text: i ? `${doc.title}: ${t}` : t }));
}

/* ---------------- BM25 search ---------------- */
const STOP = new Set('a an and are as at be been but by can could did do does for from had has have how i if in into is it its me my of on or our so than that the their them then there these they this to was we were what when where which who whom why will with would you your about any also'.split(' '));
function stem(w) {
  if (w.length > 5 && w.endsWith('ing')) return w.slice(0, -3);
  if (w.length > 4 && w.endsWith('ies')) return `${w.slice(0, -3)}y`;
  if (w.length > 4 && w.endsWith('ed')) return w.slice(0, -2);
  if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1);
  return w;
}
export function tokenize(s) {
  return String(s).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w && !STOP.has(w)).map(stem);
}

const CHUNKS = buildDocs().flatMap(chunk).map((c, id) => {
  const tokens = [...tokenize(c.title), ...tokenize(c.title), ...tokenize(c.text)]; // the title counts twice
  const tf = new Map();
  for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
  return { ...c, id, tf, len: tokens.length };
});
const AVG_LEN = CHUNKS.reduce((s, c) => s + c.len, 0) / CHUNKS.length;
const DF = new Map();
for (const c of CHUNKS) for (const t of c.tf.keys()) DF.set(t, (DF.get(t) ?? 0) + 1);
const idf = (t) => Math.log(1 + (CHUNKS.length - (DF.get(t) ?? 0) + 0.5) / ((DF.get(t) ?? 0) + 0.5));

/** The passages that best match a question: [{ title, url, text, score }], best first. */
export function search(query, { limit = 6, perPage = 2 } = {}) {
  const terms = [...new Set(tokenize(query))];
  if (!terms.length) return [];
  const k1 = 1.2;
  const b = 0.75;
  const scored = CHUNKS.map((c) => {
    let score = 0;
    for (const t of terms) {
      const f = c.tf.get(t);
      if (f) score += idf(t) * ((f * (k1 + 1)) / (f + k1 * (1 - b + (b * c.len) / AVG_LEN)));
    }
    return { c, score };
  }).filter((x) => x.score > 0).sort((x, y) => y.score - x.score);
  const picked = [];
  const perUrl = new Map();
  for (const { c, score } of scored) {
    if ((perUrl.get(c.url + c.title) ?? 0) >= perPage) continue;
    perUrl.set(c.url + c.title, (perUrl.get(c.url + c.title) ?? 0) + 1);
    picked.push({ title: c.title, url: c.url, text: c.text, score });
    if (picked.length >= limit) break;
  }
  return picked;
}

export const knowledgeSize = CHUNKS.length;
