'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { PillSelect, Segmented } from '../ui';

/**
 * The club's admin page (/admin): add and edit events, photos, members and the board without code.
 * Edits stay on this page until "Save changes"; saving commits them to the website's GitHub repository
 * (app/api/admin/content), and Vercel publishes the updated site in about two minutes.
 */

const KINDS = { events: 'Events', team: 'Team', gallery: 'Gallery' };
const LISTS = ['coreMembers', 'boardOfDirectors', 'chairpersons'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const UPLOAD_BUDGET = 3.4 * 1024 * 1024; // base64 photo data per save (Vercel's request limit is 4.5 MB)

const slugify = (s) => String(s).normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/^rtr\.?\s+/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60).replace(/-+$/, '');
const tag = () => Math.random().toString(36).slice(2, 8).replace(/[^a-z0-9]/g, 'x');
const niceDate = (iso) => { if (!iso) return ''; const [y, m, d] = iso.split('-').map(Number); return `${d} ${MONTHS[m - 1]} ${y}`; };
const todayIso = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const initials = (name) => name.replace(/^Rtr\.?\s*/i, '').split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('') || '?';

/* Events are edited with the report as plain text (a blank line between paragraphs) and saved as paragraphs. */
const forEditing = (data) => ({
  ...data,
  events: data.events.map((e) => ({ ...e, report: [].concat(e.report ?? []).join('\n\n'), outcomes: e.outcomes ?? [] })),
});
const forSaving = (kind, value) => (kind !== 'events' ? value : value.map((e) => {
  const paras = String(e.report ?? '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const { _new, ...rest } = e;
  const out = { ...rest, outcomes: (rest.outcomes ?? []).filter((o) => o.label.trim() && o.value.trim()) };
  if (!out.outcomes.length) delete out.outcomes;
  if (paras.length) out.report = paras.length === 1 ? paras[0] : paras; else delete out.report;
  return out;
}));

/** Shrinks a chosen photo in the browser and turns it into a JPEG (square for member portraits). */
async function preparePhoto(file, { max, square = false }) {
  let bmp;
  try { bmp = await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch {
    throw new Error('That photo could not be opened. Please choose a JPEG or PNG photo.');
  }
  let [sx, sy, sw, sh] = [0, 0, bmp.width, bmp.height];
  if (square) { const side = Math.min(sw, sh); sx = (sw - side) / 2; sy = sh > sw ? (sh - side) * 0.12 : 0; sw = side; sh = side; }
  const scale = Math.min(1, max / Math.max(sw, sh));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(sw * scale);
  canvas.height = Math.round(sh * scale);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bmp, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  bmp.close?.();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.84));
  const data = await new Promise((resolve) => { const r = new FileReader(); r.onload = () => resolve(String(r.result).split(',')[1]); r.readAsDataURL(blob); });
  return { data, url: URL.createObjectURL(blob) };
}

async function api(method, url, body) {
  const res = await fetch(url, { method, headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined, cache: 'no-store' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) { const err = new Error(data.error || 'Something went wrong. Please try again.'); err.status = res.status; err.conflict = data.conflict; throw err; }
  return data;
}

/* ---------------- Small building blocks ---------------- */

function Field({ label, hint, children, wide = false }) {
  const id = useId();
  return (
    <div className={`field adm-field${wide ? ' is-wide' : ''}`}>
      <label htmlFor={id}>{label}</label>
      {typeof children === 'function' ? children(id) : children}
      {hint && <small className="adm-hint">{hint}</small>}
    </div>
  );
}

function PhotoButton({ label, onFile, busy, multiple = false }) {
  const input = useRef(null);
  return (
    <>
      <button type="button" className="adm-btn is-ghost" disabled={busy} onClick={() => input.current?.click()}>{busy ? 'Preparing…' : label}</button>
      <input
        ref={input} type="file" accept="image/*" multiple={multiple} hidden
        onChange={(e) => { const files = [...e.target.files]; e.target.value = ''; if (files.length) onFile(multiple ? files : files[0]); }}
      />
    </>
  );
}

function Thumb({ src, alt = '', fallback, round = false }) {
  const [broken, setBroken] = useState(null);
  if (!src || broken === src) return <span className={`adm-thumb is-empty${round ? ' is-round' : ''}`} aria-hidden="true">{fallback}</span>;
  // eslint-disable-next-line @next/next/no-img-element -- previews of photos that may not be published yet
  return <img className={`adm-thumb${round ? ' is-round' : ''}`} src={src} alt={alt} loading="lazy" onError={() => setBroken(src)} />;
}

/* ---------------- Events ---------------- */

function EventEditor({ event, isNew, avenueOptions, photoSrc, onChange, onPhoto, onDelete, onClose, photoBusy }) {
  const set = (patch) => onChange({ ...event, ...patch });
  const outcomes = event.outcomes ?? [];
  const others = event.otherAvenues ?? [];
  return (
    <div className="adm-card adm-editor">
      <div className="adm-editor-head">
        <button type="button" className="adm-link" onClick={onClose}>← All events</button>
        <h2>{isNew ? 'New event' : event.title || 'Event'}</h2>
      </div>
      <div className="adm-grid">
        <Field label="Title" wide>
          {(id) => <input id={id} value={event.title} maxLength={140} placeholder="For example: Tree Plantation Drive" onChange={(e) => set(isNew && (!event.slug || event.slug === slugify(event.title)) ? { title: e.target.value, slug: slugify(e.target.value) } : { title: e.target.value })} />}
        </Field>
        {isNew && (
          <Field label="Web address" hint={`The event's page will be /events/${event.slug || '…'}. It can't be changed after saving.`} wide>
            {(id) => <input id={id} value={event.slug} maxLength={80} onChange={(e) => set({ slug: slugify(e.target.value) })} />}
          </Field>
        )}
        <Field label="Date">{(id) => <input id={id} type="date" value={event.date} onChange={(e) => set({ date: e.target.value })} />}</Field>
        <Field label="Last day (optional)" hint="Only for events over several days.">
          {(id) => <input id={id} type="date" value={event.endDate ?? ''} min={event.date} onChange={(e) => set({ endDate: e.target.value || undefined })} />}
        </Field>
        <Field label="Time (optional)">{(id) => <input id={id} value={event.time ?? ''} maxLength={60} placeholder="6:00 PM – 8:00 PM" onChange={(e) => set({ time: e.target.value || undefined })} />}</Field>
        <Field label="Venue">{(id) => <input id={id} value={event.venue} maxLength={160} placeholder="For example: Rotary Bhavan, Khopoli" onChange={(e) => set({ venue: e.target.value })} />}</Field>
        <Field label="Avenue">
          <PillSelect options={avenueOptions} value={event.avenue} ariaLabel="Avenue" onChange={(v) => set({ avenue: v, otherAvenues: others.filter((a) => a !== v) })} />
        </Field>
        <Field label="With (optional)" hint="Partner clubs or organisations.">
          {(id) => <input id={id} value={event.partner ?? ''} maxLength={300} onChange={(e) => set({ partner: e.target.value || undefined })} />}
        </Field>
        <div className="field adm-field is-wide">
          <span className="adm-label">Also counts towards (optional)</span>
          <div className="adm-chips">
            {avenueOptions.filter((a) => a !== event.avenue).map((a) => (
              <button
                key={a} type="button" className="adm-chip" aria-pressed={others.includes(a)}
                onClick={() => { const next = others.includes(a) ? others.filter((x) => x !== a) : [...others, a]; set({ otherAvenues: next.length ? next : undefined }); }}
              >{a}</button>
            ))}
          </div>
        </div>
        <Field label="Short summary" hint={`${(event.summary ?? '').length}/400 · Shown on the event cards.`} wide>
          {(id) => <textarea id={id} rows={3} maxLength={400} value={event.summary} onChange={(e) => set({ summary: e.target.value })} />}
        </Field>
        <Field label="Full report (optional)" hint="Leave a blank line between paragraphs." wide>
          {(id) => <textarea id={id} rows={7} value={event.report ?? ''} onChange={(e) => set({ report: e.target.value })} />}
        </Field>
        <div className="field adm-field is-wide">
          <span className="adm-label">Results (optional)</span>
          {outcomes.map((o, i) => (
            <div className="adm-outcome" key={i}>
              <input aria-label="Number" placeholder="120" maxLength={30} value={o.value} onChange={(e) => set({ outcomes: outcomes.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)) })} />
              <input aria-label="What it counts" placeholder="Saplings planted" maxLength={60} value={o.label} onChange={(e) => set({ outcomes: outcomes.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} />
              <button type="button" className="adm-icon" aria-label="Remove this result" onClick={() => set({ outcomes: outcomes.filter((_, j) => j !== i) })}>✕</button>
            </div>
          ))}
          {outcomes.length < 8 && <button type="button" className="adm-link" onClick={() => set({ outcomes: [...outcomes, { value: '', label: '' }] })}>+ Add a result</button>}
        </div>
        <div className="field adm-field is-wide">
          <span className="adm-label">Photo</span>
          <div className="adm-photo-row">
            <Thumb src={photoSrc} alt="" fallback="No photo" />
            <div className="adm-photo-actions">
              <PhotoButton label={photoSrc ? 'Change photo' : 'Add a photo'} busy={photoBusy} onFile={onPhoto} />
              {event.image && <button type="button" className="adm-link" onClick={() => set({ image: undefined })}>Remove photo</button>}
              <small className="adm-hint">A wide photo works best. It is resized automatically.</small>
            </div>
          </div>
        </div>
      </div>
      <div className="adm-editor-foot">
        <button type="button" className="adm-btn" onClick={onClose}>Done</button>
        <button type="button" className="adm-link is-danger" onClick={onDelete}>Delete this event</button>
      </div>
    </div>
  );
}

function EventsTab({ events, eventPhotos, avenueOptions, photoUrl, update, addUpload, notify }) {
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null); // index into events
  const [busy, setBusy] = useState(false);
  const top = useRef(null);
  const list = useMemo(() => events.map((e, i) => ({ e, i }))
    .filter(({ e }) => !query || `${e.title} ${e.venue} ${e.avenue}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => (b.e.date || '').localeCompare(a.e.date || '')), [events, query]);
  const open = (i) => { setEditing(i); top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  const add = () => {
    update([...events, { _new: true, slug: '', title: '', date: todayIso(), venue: '', avenue: avenueOptions[0], summary: '', report: '', outcomes: [] }]);
    open(events.length);
  };
  const current = editing !== null ? events[editing] : null;
  // An event's photo: its own, else public/images/events/<slug>.jpg when that file exists (as on the site).
  const photoOf = (e) => photoUrl(e.image || (eventPhotos.includes(`${e.slug}.jpg`) ? `/images/events/${e.slug}.jpg` : ''));
  const onPhoto = async (file) => {
    setBusy(true);
    try {
      const p = await preparePhoto(file, { max: 1600 });
      const src = `/images/events/${current.slug || 'event'}-${tag()}.jpg`;
      if (!addUpload(src, p)) return;
      update(events.map((e, j) => (j === editing ? { ...e, image: src } : e)));
    } catch (err) { notify(err.message); } finally { setBusy(false); }
  };
  return (
    <div ref={top} className="adm-tab">
      {current ? (
        <EventEditor
          event={current} isNew={Boolean(current._new)} avenueOptions={avenueOptions} photoSrc={photoOf(current)} photoBusy={busy}
          onChange={(next) => update(events.map((e, j) => (j === editing ? next : e)))}
          onPhoto={onPhoto}
          onDelete={() => { if (window.confirm(`Delete “${current.title || 'this event'}” from the website?`)) { update(events.filter((_, j) => j !== editing)); setEditing(null); } }}
          onClose={() => setEditing(null)}
        />
      ) : (
        <>
          <div className="adm-toolbar">
            <input className="adm-search" type="search" placeholder="Search events" aria-label="Search events" value={query} onChange={(e) => setQuery(e.target.value)} />
            <button type="button" className="adm-btn" onClick={add}>+ Add an event</button>
          </div>
          <ul className="adm-list">
            {list.map(({ e, i }) => (
              <li key={`${e.slug}-${i}`}>
                <button type="button" className="adm-row" onClick={() => open(i)}>
                  <Thumb src={photoOf(e)} fallback="" />
                  <span className="adm-row-text">
                    <strong>{e.title || 'Untitled event'}</strong>
                    <span>{niceDate(e.date)}{e.venue ? ` · ${e.venue}` : ''}</span>
                  </span>
                  <span className="adm-row-tag">{e.avenue}</span>
                </button>
              </li>
            ))}
            {!list.length && <li className="adm-empty">No events match “{query}”.</li>}
          </ul>
        </>
      )}
    </div>
  );
}

/* ---------------- Team ---------------- */

function RolesInput({ roles, onChange, suggestions }) {
  const [text, setText] = useState('');
  const listId = useId();
  const add = () => { const r = text.trim(); if (r && !roles.includes(r)) onChange([...roles, r]); setText(''); };
  return (
    <div className="adm-roles">
      {roles.map((r) => (
        <span key={r} className="adm-chip is-on">{r}<button type="button" aria-label={`Remove the role ${r}`} onClick={() => onChange(roles.filter((x) => x !== r))}>✕</button></span>
      ))}
      <input
        list={listId} value={text} placeholder={roles.length ? 'Add another role' : 'Add a role, e.g. Secretary'} aria-label="Add a role"
        onChange={(e) => setText(e.target.value)} onBlur={add}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
      />
      <datalist id={listId}>{suggestions.map((s) => <option key={s} value={s} />)}</datalist>
    </div>
  );
}

function PeopleList({ title, desc, people, withBio, photoOf, onChange, onPhoto, busy, roleSuggestions }) {
  const set = (i, patch) => onChange(people.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  const move = (i, d) => { const next = [...people]; [next[i], next[i + d]] = [next[i + d], next[i]]; onChange(next); };
  return (
    <section className="adm-card">
      <h3>{title}</h3>
      <p className="adm-hint">{desc}</p>
      <ul className="adm-people">
        {people.map((p, i) => (
          <li key={i} className="adm-person">
            <div className="adm-person-photo">
              <Thumb src={photoOf(p)} alt="" fallback={initials(p.name)} round />
              <PhotoButton label={photoOf(p) ? 'Change' : 'Add photo'} busy={busy === p.name} onFile={(f) => onPhoto(p.name, f)} />
            </div>
            <div className="adm-person-fields">
              <input aria-label="Name" placeholder="Rtr. Full Name" maxLength={80} value={p.name} onChange={(e) => set(i, { name: e.target.value })} />
              <RolesInput roles={p.roles} suggestions={roleSuggestions} onChange={(roles) => set(i, { roles })} />
              {withBio && <textarea aria-label="Short bio" placeholder="One or two sentences about what they look after (optional)" rows={2} maxLength={300} value={p.bio ?? ''} onChange={(e) => set(i, { bio: e.target.value || undefined })} />}
            </div>
            <div className="adm-person-tools">
              <button type="button" className="adm-icon" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
              <button type="button" className="adm-icon" aria-label="Move down" disabled={i === people.length - 1} onClick={() => move(i, 1)}>↓</button>
              <button type="button" className="adm-icon" aria-label={`Remove ${p.name || 'this person'}`} onClick={() => { if (!p.name || window.confirm(`Remove ${p.name} from “${title}”?`)) onChange(people.filter((_, j) => j !== i)); }}>✕</button>
            </div>
          </li>
        ))}
      </ul>
      <button type="button" className="adm-link" onClick={() => onChange([...people, withBio ? { name: '', roles: [], bio: '' } : { name: '', roles: [] }])}>+ Add a person</button>
    </section>
  );
}

const nextYear = (y) => { const m = /^(\d{4})\D+(\d{2,4})$/.exec(y || ''); return m ? `${Number(m[1]) + 1}–${String(Number(m[2].slice(-2)) + 1).padStart(2, '0')}` : ''; };

function TeamTab({ team, memberPhotos, photoUrl, update, addUpload, notify }) {
  const [busy, setBusy] = useState(null);
  const set = (patch) => update({ ...team, ...patch });
  const officer = (role) => team.officers.find((o) => o.role === role) ?? { role, name: '', email: '', phone: '' };
  const setOfficer = (role, patch) => set({ officers: ['President', 'Secretary'].map((r) => (r === role ? { ...officer(r), ...patch } : officer(r))) });
  const roleSuggestions = useMemo(() => [...new Set(LISTS.flatMap((k) => team[k].flatMap((p) => p.roles)))].sort(), [team]);
  const photoOf = (p) => {
    if (!p.photo) return '';
    const file = memberPhotos.find((f) => f.replace(/\.[^.]+$/, '') === p.photo);
    return photoUrl(`/images/members/${file ?? `${p.photo}.jpg`}`);
  };
  // A new photo is used for that person everywhere they appear on the Team page.
  const onPhoto = async (name, file) => {
    if (!name.trim()) { notify('Type the person’s name first, then add their photo.'); return; }
    setBusy(name);
    try {
      const p = await preparePhoto(file, { max: 800, square: true });
      const slug = `${slugify(name) || 'member'}-${tag()}`;
      if (!addUpload(`/images/members/${slug}.jpg`, p)) return;
      update(Object.fromEntries(Object.entries(team).map(([k, v]) => [k, LISTS.includes(k) ? v.map((m) => (m.name === name ? { ...m, photo: slug } : m)) : v])));
    } catch (err) { notify(err.message); } finally { setBusy(null); }
  };
  const suggested = nextYear(team.rotaractYear);
  return (
    <div className="adm-tab">
      <section className="adm-card">
        <h3>Rotaract year</h3>
        <p className="adm-hint">Each July a new board takes office: change the year here, then update the lists below (photos stay with each person).</p>
        <div className="adm-inline">
          <input aria-label="Rotaract year" value={team.rotaractYear} maxLength={20} onChange={(e) => set({ rotaractYear: e.target.value })} />
          {suggested && <button type="button" className="adm-link" onClick={() => set({ rotaractYear: suggested })}>Change to {suggested}</button>}
        </div>
      </section>
      <section className="adm-card">
        <h3>Contact people</h3>
        <p className="adm-hint">Shown on the Contact page. Website messages go to the Secretary’s email (or the President’s when it is empty).</p>
        {['President', 'Secretary'].map((role) => (
          <div key={role} className="adm-officer">
            <strong>{role}</strong>
            <input aria-label={`${role}: name`} placeholder="Rtr. Full Name" maxLength={80} value={officer(role).name} onChange={(e) => setOfficer(role, { name: e.target.value })} />
            <input aria-label={`${role}: email`} type="email" placeholder="Email (optional)" maxLength={120} value={officer(role).email} onChange={(e) => setOfficer(role, { email: e.target.value })} />
            <input aria-label={`${role}: phone`} type="tel" placeholder="Phone (optional)" maxLength={20} value={officer(role).phone} onChange={(e) => setOfficer(role, { phone: e.target.value })} />
          </div>
        ))}
      </section>
      <PeopleList title="Office bearers" desc="The core team shown first on the Team and home pages." people={team.coreMembers} withBio photoOf={photoOf} busy={busy} roleSuggestions={roleSuggestions} onPhoto={onPhoto} onChange={(v) => set({ coreMembers: v })} />
      <PeopleList title="Board of directors" desc="Avenue directors and officers." people={team.boardOfDirectors} photoOf={photoOf} busy={busy} roleSuggestions={roleSuggestions} onPhoto={onPhoto} onChange={(v) => set({ boardOfDirectors: v })} />
      <PeopleList title="Chairpersons" desc="Chairs and heads of club activities." people={team.chairpersons} photoOf={photoOf} busy={busy} roleSuggestions={roleSuggestions} onPhoto={onPhoto} onChange={(v) => set({ chairpersons: v })} />
    </div>
  );
}

/* ---------------- Gallery ---------------- */

function GalleryTab({ gallery, photoUrl, update, addUpload, notify }) {
  const [busy, setBusy] = useState(false);
  const move = (i, d) => { const next = [...gallery]; [next[i], next[i + d]] = [next[i + d], next[i]]; update(next); };
  const onFiles = async (files) => {
    setBusy(true);
    let next = gallery;
    try {
      for (const file of files) {
        const p = await preparePhoto(file, { max: 1800 });
        const src = `/images/gallery/${slugify(file.name.replace(/\.[^.]+$/, '')) || 'photo'}-${tag()}.jpg`;
        if (!addUpload(src, p)) break;
        next = [...next, { src, caption: '' }];
      }
    } catch (err) { notify(err.message); } finally { update(next); setBusy(false); }
  };
  return (
    <div className="adm-tab">
      <div className="adm-toolbar">
        <p className="adm-hint">Photos on the Gallery page, in this order. Every photo needs a short caption.</p>
        <PhotoButton label="+ Add photos" busy={busy} multiple onFile={onFiles} />
      </div>
      <ul className="adm-gallery">
        {gallery.map((g, i) => (
          <li key={g.src} className="adm-card adm-shot">
            <Thumb src={photoUrl(g.src)} alt={g.caption} fallback="Photo" />
            <input aria-label="Caption" placeholder="Describe the photo" maxLength={160} value={g.caption} onChange={(e) => update(gallery.map((x, j) => (j === i ? { ...x, caption: e.target.value } : x)))} />
            <div className="adm-shot-tools">
              <button type="button" className="adm-icon" aria-label="Move earlier" disabled={i === 0} onClick={() => move(i, -1)}>←</button>
              <button type="button" className="adm-icon" aria-label="Move later" disabled={i === gallery.length - 1} onClick={() => move(i, 1)}>→</button>
              <button type="button" className="adm-icon" aria-label="Remove from the gallery" onClick={() => { if (window.confirm('Remove this photo from the gallery?')) update(gallery.filter((_, j) => j !== i)); }}>✕</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------- The page ---------------- */

function SignIn({ onDone, notConfigured }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try { await api('POST', '/api/admin/session', { password }); onDone(); } catch (err) { setError(err.message); setBusy(false); }
  };
  if (notConfigured) {
    return (
      <div className="adm-card adm-signin">
        <h2>Admin page not switched on yet</h2>
        <p className="adm-hint">Add <code>ADMIN_PASSWORD</code> (and <code>GITHUB_TOKEN</code> for saving) in Vercel’s environment variables, then redeploy. The steps are in REMAINING-TASKS.md.</p>
      </div>
    );
  }
  return (
    <form className="adm-card adm-signin" onSubmit={submit}>
      <h2>Sign in</h2>
      <p className="adm-hint">For the club’s board. Use the admin password.</p>
      <Field label="Password">{(id) => <input id={id} type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />}</Field>
      {error && <p className="adm-error" role="alert">{error}</p>}
      <button type="submit" className="adm-btn" disabled={busy || !password}>{busy ? 'Signing in…' : 'Sign in'}</button>
    </form>
  );
}

export default function AdminApp() {
  const [status, setStatus] = useState(null); // { configured, canSave, signedIn, live }
  const [draft, setDraft] = useState(null); // { events, team, gallery } being edited
  const [saved, setSaved] = useState(null); // JSON of each part as last loaded or saved
  const [base, setBase] = useState(null); // file versions, to spot someone else's save
  const [memberPhotos, setMemberPhotos] = useState([]);
  const [eventPhotos, setEventPhotos] = useState([]);
  const [avenueNames, setAvenueNames] = useState([]);
  const [uploads, setUploads] = useState({}); // '/images/…jpg' -> { data, url } waiting to be saved
  const [previews, setPreviews] = useState({}); // '/images/…jpg' -> local preview, kept until published
  const [tab, setTab] = useState('events');
  const [message, setMessage] = useState(null); // { kind: 'error' | 'ok' | 'info', text }
  const [saving, setSaving] = useState(false);
  const [published, setPublished] = useState(null); // { commit, live: boolean }

  const loadContent = useCallback(async (s) => {
    try {
      const c = await api('GET', '/api/admin/content');
      const data = forEditing(c);
      setDraft({ events: data.events, team: data.team, gallery: data.gallery });
      setSaved({ events: JSON.stringify(data.events), team: JSON.stringify(data.team), gallery: JSON.stringify(data.gallery) });
      setBase(c.base);
      setMemberPhotos(c.memberPhotos);
      setEventPhotos(c.eventPhotos);
      setAvenueNames(c.avenues);
      setUploads({});
    } catch (err) {
      if (err.status === 401) setStatus({ ...s, signedIn: false });
      setMessage({ kind: 'error', text: err.message });
    }
  }, []);
  const applySession = useCallback((s) => { setStatus(s); if (s.signedIn) loadContent(s); }, [loadContent]);
  const load = () => api('GET', '/api/admin/session').then(applySession).catch((err) => setMessage({ kind: 'error', text: err.message }));
  useEffect(() => {
    api('GET', '/api/admin/session').then(applySession).catch((err) => setMessage({ kind: 'error', text: err.message }));
  }, [applySession]);

  const dirty = draft && saved ? Object.keys(KINDS).filter((k) => JSON.stringify(draft[k]) !== saved[k]) : [];
  const pending = Object.keys(uploads).length;
  const unsaved = dirty.length > 0 || pending > 0;
  useEffect(() => {
    if (!unsaved) return undefined;
    const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [unsaved]);

  // After a save, check every 15 seconds whether the new version of the site is live yet.
  useEffect(() => {
    if (!published || published.live || !status?.live) return undefined;
    let tries = 0;
    const t = window.setInterval(async () => {
      tries += 1;
      try {
        const s = await api('GET', '/api/admin/session');
        if (s.live === published.commit) { setPublished((p) => ({ ...p, live: true })); window.clearInterval(t); }
      } catch { /* try again */ }
      if (tries > 40) window.clearInterval(t);
    }, 15000);
    return () => window.clearInterval(t);
  }, [published, status?.live]);

  const notify = (text, kind = 'error') => setMessage({ kind, text });
  const photoUrl = (src) => (src ? previews[src] ?? src : '');
  const addUpload = (src, photo) => {
    const used = Object.values(uploads).reduce((n, u) => n + u.data.length, 0);
    if (used + photo.data.length > UPLOAD_BUDGET) { notify('Please save your changes before adding more photos (a save can carry a few photos at a time).', 'info'); return false; }
    setUploads((u) => ({ ...u, [src]: photo }));
    setPreviews((p) => ({ ...p, [src]: photo.url }));
    return true;
  };
  const update = (kind) => (value) => { setDraft((d) => ({ ...d, [kind]: value })); setMessage(null); setPublished(null); };

  const check = () => {
    for (const e of draft.events) {
      const name = e.title ? `“${e.title}”` : 'An event';
      if (!e.title.trim() || !e.slug || !e.date || !e.venue.trim() || !e.avenue || !e.summary.trim()) return `${name} needs a title, web address, date, venue, avenue and short summary.`;
    }
    const slugs = draft.events.map((e) => e.slug);
    const dup = slugs.find((s, i) => slugs.indexOf(s) !== i);
    if (dup) return `Two events use the web address “${dup}”. Please change one of them.`;
    for (const k of LISTS) {
      for (const p of draft.team[k]) if (!p.name.trim() || !p.roles.length) return `Every person on the Team needs a name and at least one role${p.name ? ` (check ${p.name})` : ''}.`;
    }
    if (!draft.team.officers.every((o) => o.name.trim())) return 'The President and Secretary need names (Team → Contact people).';
    if (draft.gallery.some((g) => !g.caption.trim())) return 'Every gallery photo needs a caption.';
    return '';
  };

  const save = async () => {
    const problem = check();
    if (problem) { notify(problem); return; }
    setSaving(true);
    setMessage(null);
    const text = JSON.stringify(draft);
    const used = Object.entries(uploads).filter(([src]) => text.includes(src.replace(/^\/images\/members\/|\.jpg$/g, '')));
    const body = { base, uploads: used.map(([src, u]) => ({ path: `public${src}`, data: u.data })) };
    for (const k of dirty) body[k] = forSaving(k, draft[k]);
    try {
      const res = await api('POST', '/api/admin/content', body);
      // Saved events are no longer new (their web address is now fixed).
      const settled = { ...draft, events: draft.events.map(({ _new, ...e }) => e) };
      setDraft((d) => ({ ...d, events: d.events.map(({ _new, ...e }) => e) }));
      setBase((b) => ({ ...b, ...res.base }));
      setSaved((s) => ({ ...s, ...Object.fromEntries(dirty.map((k) => [k, JSON.stringify(settled[k])])) }));
      setMemberPhotos((m) => [...m, ...used.filter(([src]) => src.startsWith('/images/members/')).map(([src]) => src.split('/').pop())]);
      setUploads({});
      setPublished({ commit: res.commit, live: false });
    } catch (err) {
      notify(err.message);
      if (err.status === 401) setStatus((s) => ({ ...s, signedIn: false }));
    } finally { setSaving(false); }
  };
  const discard = () => {
    if (!window.confirm('Undo all the changes you haven’t saved?')) return;
    setDraft({ events: JSON.parse(saved.events), team: JSON.parse(saved.team), gallery: JSON.parse(saved.gallery) });
    setUploads({});
    setMessage(null);
  };
  const signOut = async () => {
    if (unsaved && !window.confirm('You have unsaved changes. Sign out anyway?')) return;
    await api('DELETE', '/api/admin/session').catch(() => {});
    setDraft(null);
    setStatus((s) => ({ ...s, signedIn: false }));
  };

  const avenueOptions = [...new Set([...avenueNames, ...(draft?.events ?? []).flatMap((e) => [e.avenue, ...(e.otherAvenues ?? [])]).filter(Boolean)])];

  return (
    <section className="admin">
      <div className="container adm-wrap">
        <header className="adm-head">
          <div>
            <h1>Club admin</h1>
            <p className="adm-hint">Add and edit events, photos and the team. Changes appear on the website about two minutes after you save.</p>
          </div>
          {status?.signedIn && <button type="button" className="adm-btn is-ghost" onClick={signOut}>Sign out</button>}
        </header>

        {!status && <p className="adm-hint">Loading…</p>}
        {status && !status.signedIn && <SignIn notConfigured={!status.configured} onDone={() => { setMessage(null); load(); }} />}
        {status?.signedIn && !status.canSave && (
          <p className="adm-notice">Saving isn’t switched on yet: add <code>GITHUB_TOKEN</code> in Vercel (see REMAINING-TASKS.md).</p>
        )}
        {status?.signedIn && !draft && !message && <p className="adm-hint">Loading the website’s content…</p>}

        {status?.signedIn && draft && (
          <>
            <Segmented label="Edit" options={Object.entries(KINDS).map(([k, l]) => [k, dirty.includes(k) ? `${l} •` : l])} value={tab} onChange={setTab} />
            {tab === 'events' && <EventsTab events={draft.events} eventPhotos={eventPhotos} avenueOptions={avenueOptions} photoUrl={photoUrl} update={update('events')} addUpload={addUpload} notify={notify} />}
            {tab === 'team' && <TeamTab team={draft.team} memberPhotos={memberPhotos} photoUrl={photoUrl} update={update('team')} addUpload={addUpload} notify={notify} />}
            {tab === 'gallery' && <GalleryTab gallery={draft.gallery} photoUrl={photoUrl} update={update('gallery')} addUpload={addUpload} notify={notify} />}
          </>
        )}

        {/* Drawn at the top level of the page so the footer can never cover it. */}
        {(unsaved || saving || message || published) && status?.signedIn && typeof document !== 'undefined' && createPortal(
          <div className={`adm-savebar${message?.kind === 'error' ? ' is-error' : ''}`} role="status" aria-live="polite">
            <span className="adm-savebar-text">
              {message ? message.text
                : saving ? 'Saving…'
                  : unsaved ? `Unsaved changes: ${[...dirty.map((k) => KINDS[k]), ...(pending && !dirty.length ? [`${pending} photo${pending > 1 ? 's' : ''}`] : [])].join(', ')}`
                    : published?.live ? 'Saved and live on the website.'
                      : 'Saved. The website will show it in about two minutes.'}
            </span>
            {unsaved && !saving && (
              <span className="adm-savebar-actions">
                <button type="button" className="adm-link" onClick={discard}>Undo changes</button>
                <button type="button" className="adm-btn" onClick={save} disabled={!status.canSave}>Save changes</button>
              </span>
            )}
            {!unsaved && message && <button type="button" className="adm-link" onClick={() => setMessage(null)}>Close</button>}
          </div>,
          document.body,
        )}
      </div>
    </section>
  );
}
