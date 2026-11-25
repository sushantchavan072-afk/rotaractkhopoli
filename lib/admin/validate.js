/**
 * Checks and tidies what the admin page sends before it is committed, so a mistake (or a tampered request)
 * can never break the site: unknown fields are dropped, lengths are capped, dates and web addresses must be
 * well formed and photos must be real JPEG files in the expected folders. Server only.
 */
export class InvalidError extends Error {}

const fail = (msg) => { throw new InvalidError(msg); };
const str = (v, max, label, { required = false } = {}) => {
  const s = typeof v === 'string' ? v.replace(/\r\n?/g, '\n').trim() : '';
  if (required && !s) fail(`${label} is missing.`);
  if (s.length > max) fail(`${label} is too long (${s.length} characters, at most ${max}).`);
  return s;
};
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const IMAGE = /^\/images\/(?:[a-z0-9_-]+\/)*[a-z0-9_.-]+\.(?:jpe?g|png|webp)$/i;
const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(new Date(`${s}T00:00:00Z`).getTime())
  && new Date(`${s}T00:00:00Z`).toISOString().startsWith(s);

export function cleanEvents(list) {
  if (!Array.isArray(list) || list.length > 1000) fail('The events list is not valid.');
  const seen = new Set();
  return list.map((e, n) => {
    const title = str(e?.title, 140, `Event ${n + 1}: the title`, { required: true });
    const at = `“${title}”:`;
    const slug = str(e.slug, 80, `${at} the web address`, { required: true });
    if (!SLUG.test(slug)) fail(`${at} the web address may only use small letters, numbers and dashes.`);
    if (seen.has(slug)) fail(`${at} another event already uses the web address “${slug}”.`);
    seen.add(slug);
    const date = str(e.date, 10, `${at} the date`, { required: true });
    if (!isDate(date)) fail(`${at} the date is not valid.`);
    const out = { slug, date, title };
    const endDate = str(e.endDate, 10, `${at} the end date`);
    if (endDate) {
      if (!isDate(endDate)) fail(`${at} the end date is not valid.`);
      if (endDate < date) fail(`${at} the end date is before the start date.`);
      if (endDate > date) out.endDate = endDate;
    }
    const time = str(e.time, 60, `${at} the time`);
    if (time) out.time = time;
    out.venue = str(e.venue, 160, `${at} the venue`, { required: true });
    out.avenue = str(e.avenue, 60, `${at} the avenue`, { required: true });
    const others = Array.isArray(e.otherAvenues) ? [...new Set(e.otherAvenues.map((a) => str(a, 60, `${at} another avenue`)).filter((a) => a && a !== out.avenue))] : [];
    if (others.length > 6) fail(`${at} too many other avenues.`);
    if (others.length) out.otherAvenues = others;
    const partner = str(e.partner, 300, `${at} the partner`);
    if (partner) out.partner = partner;
    out.summary = str(e.summary, 400, `${at} the short summary`, { required: true });
    const outcomes = Array.isArray(e.outcomes) ? e.outcomes
      .map((o) => ({ label: str(o?.label, 60, `${at} a result's label`), value: str(o?.value, 30, `${at} a result's number`) }))
      .filter((o) => o.label && o.value) : [];
    if (outcomes.length > 8) fail(`${at} at most 8 results.`);
    if (outcomes.length) out.outcomes = outcomes;
    const paras = [].concat(e.report ?? []).map((p) => str(p, 4000, `${at} a report paragraph`)).filter(Boolean);
    if (paras.length > 12) fail(`${at} the report has too many paragraphs.`);
    if (paras.length) out.report = paras.length === 1 ? paras[0] : paras;
    const image = str(e.image, 200, `${at} the photo`);
    if (image) {
      if (!IMAGE.test(image) || image.includes('..')) fail(`${at} the photo address is not valid.`);
      out.image = image;
    }
    const gallery = Array.isArray(e.gallery) ? [...new Set(e.gallery.map((g) => str(g, 200, `${at} an extra photo`)).filter(Boolean))] : [];
    if (gallery.length > 12) fail(`${at} at most 12 extra photos.`);
    if (gallery.some((g) => !IMAGE.test(g) || g.includes('..'))) fail(`${at} an extra photo's address is not valid.`);
    if (gallery.length) out.gallery = gallery;
    return out;
  });
}

const cleanPeople = (list, label, withBio) => {
  if (!Array.isArray(list) || list.length > 80) fail(`The ${label} list is not valid.`);
  return list.map((m, n) => {
    const name = str(m?.name, 80, `${label} ${n + 1}: the name`, { required: true });
    const roles = (Array.isArray(m.roles) ? m.roles : []).map((r) => str(r, 100, `${name}: a role`)).filter(Boolean);
    if (!roles.length) fail(`${name} (${label}) needs at least one role.`);
    if (roles.length > 6) fail(`${name} (${label}) has too many roles.`);
    const out = { name };
    const photo = str(m.photo, 80, `${name}: the photo`);
    if (photo) {
      if (!SLUG.test(photo)) fail(`${name}: the photo name is not valid.`);
      out.photo = photo;
    }
    out.roles = roles;
    if (withBio) {
      const bio = str(m.bio, 300, `${name}: the short bio`);
      if (bio) out.bio = bio;
    }
    return out;
  });
};

export function cleanTeam(t) {
  if (!t || typeof t !== 'object') fail('The team is not valid.');
  const officer = (role) => {
    const o = (Array.isArray(t.officers) ? t.officers : []).find((x) => x?.role === role) ?? {};
    const email = str(o.email, 120, `${role}: the email`);
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail(`${role}: the email address is not valid.`);
    const phone = str(o.phone, 20, `${role}: the phone number`);
    if (phone && !/^\+?[\d\s-]{7,20}$/.test(phone)) fail(`${role}: the phone number is not valid.`);
    return { role, name: str(o.name, 80, `${role}: the name`, { required: true }), email, phone };
  };
  return {
    rotaractYear: str(t.rotaractYear, 20, 'The Rotaract year', { required: true }),
    officers: [officer('President'), officer('Secretary')],
    coreMembers: cleanPeople(t.coreMembers, 'Office bearers', true),
    boardOfDirectors: cleanPeople(t.boardOfDirectors, 'Board of directors', false),
    chairpersons: cleanPeople(t.chairpersons, 'Chairpersons', false),
  };
}

export function cleanGallery(list) {
  if (!Array.isArray(list) || list.length > 120) fail('The gallery is not valid.');
  return list.map((g, n) => {
    const src = str(g?.src, 200, `Gallery photo ${n + 1}`, { required: true });
    if (!IMAGE.test(src) || src.includes('..')) fail(`Gallery photo ${n + 1}: the address is not valid.`);
    return { src, caption: str(g.caption, 160, `Gallery photo ${n + 1}: the caption`, { required: true }) };
  });
}

const httpsUrl = (v, max, label) => {
  const s = str(v, max, label);
  if (!s) return '';
  let u;
  try { u = new URL(s); } catch { fail(`${label} is not a web address (it should start with https://).`); }
  if (u.protocol !== 'https:') fail(`${label} should start with https://`);
  return s;
};

/** The club's public contact settings (Club details on the admin page). */
export function cleanSite(c) {
  if (!c || typeof c !== 'object') fail('The club details are not valid.');
  const email = str(c.email, 120, 'The club email');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail('The club email address is not valid.');
  const social = c.social && typeof c.social === 'object' ? c.social : {};
  return {
    email,
    showPresidentPhone: c.showPresidentPhone === true,
    meetingPlace: str(c.meetingPlace, 160, 'The meeting place'),
    mapUrl: httpsUrl(c.mapUrl, 500, 'The map link'),
    social: {
      instagram: httpsUrl(social.instagram, 300, 'The Instagram link'),
      facebook: httpsUrl(social.facebook, 300, 'The Facebook link'),
      linkedin: httpsUrl(social.linkedin, 300, 'The LinkedIn link'),
      youtube: httpsUrl(social.youtube, 300, 'The YouTube link'),
    },
  };
}

/** Reviews (testimonials): real quotes, shown on the home and Reviews pages. */
export function cleanReviews(list) {
  if (!Array.isArray(list) || list.length > 40) fail('The reviews are not valid.');
  return list.map((r, n) => {
    const name = str(r?.name, 80, `Review ${n + 1}: the name`, { required: true });
    const out = { quote: str(r.quote, 600, `${name}'s review`, { required: true }), name };
    const role = str(r.role, 120, `${name}: the role`);
    if (role) out.role = role;
    return out;
  });
}

/** Uploaded photos: only JPEG files, only into the events, members and gallery folders. */
const UPLOAD = /^public\/images\/(?:events|members|gallery)\/[a-z0-9]+(?:-[a-z0-9]+)*\.jpg$/;
const MAX_BYTES = 3 * 1024 * 1024;
export function cleanUploads(list) {
  if (list === undefined) return [];
  if (!Array.isArray(list) || list.length > 20) fail('Too many photos in one save; please save in smaller steps.');
  const paths = new Set();
  return list.map((u) => {
    const path = typeof u?.path === 'string' ? u.path : '';
    if (!UPLOAD.test(path) || paths.has(path)) fail('A photo has an invalid file name.');
    paths.add(path);
    const content = Buffer.from(typeof u.data === 'string' ? u.data : '', 'base64');
    if (content.length < 100 || content.length > MAX_BYTES) fail('A photo is empty or too large.');
    if (!(content[0] === 0xff && content[1] === 0xd8 && content[2] === 0xff)) fail('Photos must be JPEG images.');
    return { path, content };
  });
}
