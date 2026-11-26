/**
 * Auto-tidy: run on the parts being saved, just before saving. Fixes small things people often type by
 * accident and returns what it changed, so the admin page can say so. It never removes real content.
 *  - extra spaces (start, end, doubled) in names, titles, venues, captions and descriptions
 *  - names typed all in small or all in capital letters ("rtr. priya patil" → "Rtr. Priya Patil")
 *  - phone numbers stored as 10 digits (the website adds +91 itself)
 *  - email addresses in small letters
 *  - the same photo added twice to an event or to the gallery
 */

const squash = (s) => (typeof s === 'string' ? s.replace(/[ \t ]+/g, ' ').trim() : s);
// Multi-line text: tidy each line, keep the blank lines between paragraphs.
const squashLines = (s) => (typeof s === 'string' ? s.split('\n').map((l) => l.replace(/[ \t ]+/g, ' ').trim()).join('\n').replace(/\n{3,}/g, '\n\n').trim() : s);

export function tidyName(name) {
  let n = squash(name ?? '');
  if (!n) return n;
  n = n.replace(/^rtr\.?\s*/i, 'Rtr. ');
  const rest = n.replace(/^Rtr\. /, '');
  // Only names typed all-small or ALL-CAPITALS; "McDonald" or "D'Souza" stay as typed.
  if (rest === rest.toLowerCase() || (rest === rest.toUpperCase() && rest.length > 3)) {
    const fixed = rest.toLowerCase().replace(/(^|[\s'-])(\p{L})/gu, (_, sep, ch) => sep + ch.toUpperCase());
    n = n.startsWith('Rtr. ') ? `Rtr. ${fixed}` : fixed;
  }
  return n;
}

export function tidyPhone(phone) {
  if (!phone) return phone;
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return squash(phone); // not an Indian mobile number: left as typed
}

const uniq = (list) => [...new Set(list)];

/** Returns { draft, notes } where notes is a short list of what was tidied (empty when nothing changed). */
export function tidyDraft(draft, parts) {
  const notes = new Set();
  const next = { ...draft };
  const note = (before, after, text) => { if (JSON.stringify(before) !== JSON.stringify(after)) notes.add(text); return after; };

  if (parts.includes('events')) {
    next.events = draft.events.map((e) => {
      const out = { ...e };
      for (const k of ['title', 'venue', 'time', 'partner', 'summary']) if (typeof e[k] === 'string') out[k] = note(e[k], squash(e[k]), 'extra spaces');
      if (typeof e.report === 'string') out.report = note(e.report, squashLines(e.report), 'extra spaces');
      if (out.title) out.title = note(out.title, out.title[0].toUpperCase() + out.title.slice(1), 'capital letters');
      if (Array.isArray(e.gallery)) out.gallery = note(e.gallery, uniq(e.gallery).filter((src) => src !== e.image), 'a photo added twice');
      if (Array.isArray(e.outcomes)) out.outcomes = e.outcomes.map((o) => ({ label: note(o.label, squash(o.label), 'extra spaces'), value: note(o.value, squash(o.value), 'extra spaces') }));
      return out;
    });
  }

  if (parts.includes('team')) {
    const person = (p) => {
      const name = tidyName(p.name);
      if (name !== p.name) notes.add(squash(p.name) === name ? 'extra spaces' : 'name capitals');
      const out = { ...p, name };
      if (typeof p.bio === 'string') out.bio = note(p.bio, squash(p.bio), 'extra spaces');
      if (Array.isArray(p.roles)) out.roles = note(p.roles, uniq(p.roles.map(squash).filter(Boolean)), 'a role listed twice');
      return out;
    };
    next.team = { ...draft.team };
    for (const k of ['coreMembers', 'boardOfDirectors', 'chairpersons']) if (Array.isArray(draft.team[k])) next.team[k] = draft.team[k].map(person);
    next.team.officers = (draft.team.officers ?? []).map((o) => {
      const name = tidyName(o.name);
      if (name !== o.name) notes.add(squash(o.name) === name ? 'extra spaces' : 'name capitals');
      return { ...o, name, email: note(o.email, squash(o.email ?? '').toLowerCase(), 'email in small letters'), phone: note(o.phone, tidyPhone(o.phone ?? ''), 'phone number format') };
    });
  }

  if (parts.includes('gallery')) {
    const seen = new Set();
    const kept = draft.gallery.filter((g) => (seen.has(g.src) ? false : seen.add(g.src)));
    next.gallery = note(draft.gallery, kept, 'a photo added twice').map((g) => ({ ...g, caption: note(g.caption, squash(g.caption), 'extra spaces') }));
  }

  if (parts.includes('reviews')) {
    next.reviews = draft.reviews.map((r) => ({ ...r, quote: note(r.quote, squashLines(r.quote), 'extra spaces'), name: note(r.name, tidyName(r.name), 'name capitals') }));
  }

  if (parts.includes('site') && typeof draft.site.email === 'string') {
    next.site = { ...draft.site, email: note(draft.site.email, squash(draft.site.email).toLowerCase(), 'email in small letters') };
  }

  if (parts.includes('finance') && draft.finance) {
    next.finance = {
      ...draft.finance,
      entries: draft.finance.entries.map((e) => {
        const out = { ...e, description: note(e.description, squash(e.description), 'extra spaces') };
        for (const k of ['party', 'reference']) if (typeof e[k] === 'string') out[k] = note(e[k], squash(e[k]), 'extra spaces');
        return out;
      }),
    };
  }

  return { draft: next, notes: [...notes] };
}
