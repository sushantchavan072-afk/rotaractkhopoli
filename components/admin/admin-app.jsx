'use client';

import { useCallback, useDeferredValue, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import { FaAddressCard, FaArrowLeft, FaArrowUpRightFromSquare, FaCalendarDays, FaHouse, FaImages, FaIndianRupeeSign, FaQuoteLeft, FaRightFromBracket, FaUsers, FaXmark, FaRegEye, FaRegEyeSlash, FaArrowRightToBracket, FaArrowRight, FaCircleCheck, FaPenToSquare, FaArrowsRotate, FaTableColumns, FaPlus } from 'react-icons/fa6';
import EventsTab, { blankEvent } from './events';
import TeamTab, { LISTS } from './team';
import { GalleryTab, ReviewsTab, DetailsTab } from './more';
import OverviewTab from './overview';
import FinanceTab from './finance';
import { Field, api, whenSaved } from './shared';

/**
 * The club's admin page (/admin): events, team, gallery, reviews and club details, without code.
 * Edits stay on this page until "Save changes" (or Ctrl/⌘+S); saving commits them to the website's GitHub
 * repository (app/api/admin/content) and Vercel publishes the updated site in about two minutes.
 * Desktop: a side menu. Phones: a tab bar at the bottom.
 */

const KINDS = { events: 'Events', team: 'Team', gallery: 'Gallery', reviews: 'Reviews', site: 'Club details', finance: 'Finance' };
const CONTENT = ['events', 'team', 'gallery', 'reviews', 'site']; // saved through /api/admin/content; finance has its own
const SECTIONS = [
  ['overview', 'Overview', 'Home', FaHouse],
  ['events', 'Events', 'Events', FaCalendarDays],
  ['team', 'Team', 'Team', FaUsers],
  ['gallery', 'Gallery', 'Gallery', FaImages],
  ['reviews', 'Reviews', 'Reviews', FaQuoteLeft],
  ['finance', 'Finance', 'Finance', FaIndianRupeeSign],
  ['site', 'Club details', 'Details', FaAddressCard],
];
// The current section's name and icon take one of the club colours, a different one each time.
const ACTIVE_HUES = ['#d41367', '#17458f', '#c2410c', '#15803d', '#7a3db8', '#0067c8', '#b45309', '#0e7490'];
const UPLOAD_BUDGET = 3.4 * 1024 * 1024; // base64 photo data per save (Vercel's request limit is 4.5 MB)

/* Events are edited with the report as plain text (a blank line between paragraphs) and saved as paragraphs. */
const forEditing = (c, finance) => ({
  finance,
  events: c.events.map((e) => ({ ...e, report: [].concat(e.report ?? []).join('\n\n'), outcomes: e.outcomes ?? [] })),
  team: c.team, gallery: c.gallery, reviews: c.reviews, site: c.site,
});
const forSaving = (kind, value) => (kind !== 'events' ? value : value.map((e) => {
  const { _new, ...rest } = e;
  const paras = String(rest.report ?? '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const out = { ...rest, outcomes: (rest.outcomes ?? []).filter((o) => o.label.trim() && o.value.trim()) };
  if (!out.outcomes.length) delete out.outcomes;
  if (paras.length) out.report = paras.length === 1 ? paras[0] : paras; else delete out.report;
  return out;
}));
const snapshot = (draft) => Object.fromEntries(Object.keys(KINDS).map((k) => [k, JSON.stringify(draft[k])]));

function SignIn({ onDone, notConfigured }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  const [forgot, setForgot] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try { await api('POST', '/api/admin/session', { password }); onDone(); } catch (err) { setError(err.message); setBusy(false); }
  };
  if (notConfigured) {
    return (
      <div className="adm-signin">
        <p className="adm-hint">The admin page isn’t switched on yet. Add <code>ADMIN_PASSWORD</code> (and <code>GITHUB_TOKEN</code> for saving) in Vercel, then redeploy.</p>
      </div>
    );
  }
  return (
    <form className="adm-signin" onSubmit={submit}>
      <div className="adm-pass">
        <input type={show ? 'text' : 'password'} aria-label="Password" placeholder="Password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="button" className="adm-pass-eye" aria-label={show ? 'Hide the password' : 'Show the password'} onClick={() => setShow((v) => !v)}>{show ? <FaRegEye size={17} /> : <FaRegEyeSlash size={17} />}</button>
      </div>
      <button type="button" className="adm-forgot" onClick={() => setForgot((v) => !v)}>Forgot password?</button>
      {forgot && <p className="adm-forgot-hint">Ask the club President or Secretary. The password is set in Vercel, under ADMIN_PASSWORD.</p>}
      {error && <p className="adm-error" role="alert">{error}</p>}
      <button type="submit" className="adm-login-btn" disabled={busy}>
        {busy ? <span className="adm-spinner" aria-hidden="true" /> : <FaArrowRightToBracket size={16} aria-hidden="true" />}
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}

/** A fluid shimmer bar while something loads. */
function Loader({ text }) {
  return (
    <div className="adm-loader" role="status">
      <span className="adm-loader-bar" aria-hidden="true"><i /></span>
      <span className="adm-loader-text">{text}</span>
    </div>
  );
}

const STATUS_ICON = { ok: FaCircleCheck, warn: FaPenToSquare, busy: FaArrowsRotate };
function StatusChip({ state }) {
  const Icon = STATUS_ICON[state[0]] ?? FaCircleCheck;
  return <span className={`adm-status is-${state[0]}`} role="status"><Icon size={13} aria-hidden="true" />{state[1]}</span>;
}

export default function AdminApp() {
  const [status, setStatus] = useState(null); // { configured, canSave, signedIn, live }
  const [draft, setDraft] = useState(null); // { events, team, gallery, reviews, site } being edited
  const [saved, setSaved] = useState(null); // JSON of each part as last loaded or saved
  const [base, setBase] = useState(null); // file versions, to spot someone else's save
  const [memberPhotos, setMemberPhotos] = useState([]);
  const [eventPhotos, setEventPhotos] = useState([]);
  const [avenueNames, setAvenueNames] = useState([]);
  const [uploads, setUploads] = useState({}); // '/images/…jpg' -> { data, url } waiting to be saved
  const [previews, setPreviews] = useState({}); // '/images/…jpg' -> local preview, kept until published
  const [tab, setTab] = useState('overview');
  const [editing, setEditing] = useState(null); // the event being edited (index)
  const [filter, setFilter] = useState('all'); // events list filter
  const [message, setMessage] = useState(null); // { kind: 'error' | 'info', text }
  const [saving, setSaving] = useState(false);
  const [published, setPublished] = useState(null); // { commit, live, dismissed }
  const [history, setHistory] = useState(null); // recent saves
  const [restoring, setRestoring] = useState(null);
  const [financeBase, setFinanceBase] = useState(null);
  const [financeReady, setFinanceReady] = useState(true);

  const loadHistory = useCallback(() => {
    api('GET', '/api/admin/history').then((h) => setHistory(h.saves)).catch(() => setHistory([]));
  }, []);
  const loadContent = useCallback(async (s) => {
    try {
      const [c, f] = await Promise.all([
        api('GET', '/api/admin/content'),
        api('GET', '/api/admin/finance').catch((err) => ({ error: err })),
      ]);
      if (f.error) setMessage({ kind: 'error', text: f.error.message });
      setFinanceBase(f.base ?? null);
      setFinanceReady(!f.error && f.ready !== false);
      const data = forEditing(c, f.error ? null : f.finance);
      setDraft(data);
      setSaved(snapshot(data));
      setBase(c.base);
      setMemberPhotos(c.memberPhotos);
      setEventPhotos(c.eventPhotos);
      setAvenueNames(c.avenues);
      setUploads({});
      setEditing(null);
      loadHistory();
    } catch (err) {
      if (err.status === 401) setStatus({ ...s, signedIn: false });
      setMessage({ kind: 'error', text: err.message });
    }
  }, [loadHistory]);
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
  const hasPhoto = (e) => Boolean(e.image || eventPhotos.includes(`${e.slug}.jpg`));
  const photoOf = (e) => photoUrl(e.image || (eventPhotos.includes(`${e.slug}.jpg`) ? `/images/events/${e.slug}.jpg` : ''));
  const memberPhoto = (p) => {
    if (!p.photo) return '';
    const file = memberPhotos.find((f) => f.replace(/\.[^.]+$/, '') === p.photo);
    const src = `/images/members/${file ?? `${p.photo}.jpg`}`;
    return file || previews[src] ? photoUrl(src) : '';
  };
  const addUpload = (src, photo) => {
    const used = Object.values(uploads).reduce((n, u) => n + u.data.length, 0);
    if (used + photo.data.length > UPLOAD_BUDGET) { notify('Please save your changes before adding more photos (a save can carry a few photos at a time).', 'info'); return false; }
    setUploads((u) => ({ ...u, [src]: photo }));
    setPreviews((p) => ({ ...p, [src]: photo.url }));
    return true;
  };
  const update = (kind) => (value) => {
    setDraft((d) => ({ ...d, [kind]: typeof value === 'function' ? value(d[kind]) : value }));
    setMessage((m) => (m?.kind === 'error' ? null : m));
    setPublished(null);
  };

  const check = () => {
    for (const e of draft.events) {
      const name = e.title ? `“${e.title}”` : 'An event';
      if (!e.title.trim() || !e.slug || !e.date || !e.venue.trim() || !e.avenue || !e.summary.trim()) return [`${name} needs a title, web address, date, venue, avenue and short summary.`, 'events'];
    }
    const slugs = draft.events.map((e) => e.slug);
    const dup = slugs.find((s, i) => slugs.indexOf(s) !== i);
    if (dup) return [`Two events use the web address “${dup}”. Please change one of them.`, 'events'];
    for (const [k] of LISTS) {
      for (const p of draft.team[k]) if (!p.name.trim() || !p.roles.length) return [`Every person on the Team needs a name and at least one role${p.name ? ` (check ${p.name})` : ''}.`, 'team'];
    }
    if (!draft.team.officers.every((o) => o.name.trim())) return ['The President and Secretary need names (Team).', 'team'];
    if (draft.gallery.some((g) => !g.caption.trim())) return ['Every gallery photo needs a caption.', 'gallery'];
    if (draft.reviews.some((r) => !r.quote.trim() || !r.name.trim())) return ['Every review needs the words and a name.', 'reviews'];
    const links = [draft.site.mapUrl, ...Object.values(draft.site.social)].filter(Boolean);
    if (links.some((l) => !/^https:\/\/\S+$/.test(l))) return ['Links in Club details should start with https://', 'site'];
    for (const e of draft.finance?.entries ?? []) {
      if (!e.date || !(Number(e.amount) > 0) || !e.description.trim()) return ['Every finance entry needs a date, an amount and what it was for.', 'finance'];
    }
    return null;
  };

  const save = async () => {
    const problem = check();
    if (problem) { notify(problem[0]); setTab(problem[1]); return; }
    setSaving(true);
    setMessage(null);
    const text = JSON.stringify(draft);
    const used = Object.entries(uploads).filter(([src]) => text.includes(src.replace(/^\/images\/members\/|\.jpg$/g, '')));
    const contentDirty = dirty.filter((k) => CONTENT.includes(k));
    try {
      let commit = null;
      if (contentDirty.length || used.length) {
        const body = { base, uploads: used.map(([src, u]) => ({ path: `public${src}`, data: u.data })) };
        for (const k of contentDirty) body[k] = forSaving(k, draft[k]);
        const res = await api('POST', '/api/admin/content', body);
        commit = res.commit;
        // Saved events are no longer new (their web address is now fixed).
        const settled = { ...draft, events: draft.events.map(({ _new, ...e }) => e) };
        setDraft((d) => ({ ...d, events: d.events.map(({ _new, ...e }) => e) }));
        setBase((b) => ({ ...b, ...res.base }));
        setSaved((s) => ({ ...s, ...Object.fromEntries(contentDirty.map((k) => [k, JSON.stringify(settled[k])])) }));
        setMemberPhotos((m) => [...m, ...used.filter(([src]) => src.startsWith('/images/members/')).map(([src]) => src.split('/').pop())]);
        setEventPhotos((m) => [...m, ...used.filter(([src]) => src.startsWith('/images/events/')).map(([src]) => src.split('/').pop())]);
        setUploads({});
        loadHistory();
      }
      if (dirty.includes('finance')) {
        const res = await api('POST', '/api/admin/finance', { finance: draft.finance, base: financeBase });
        commit = res.commit;
        setFinanceBase(res.base);
        setSaved((s) => ({ ...s, finance: JSON.stringify(draft.finance) }));
      }
      // Finance is only on the admin page, so a finance-only save has nothing new to show on the website.
      setPublished(contentDirty.length || used.length ? { commit, live: false } : { commit, live: true, private: true });
    } catch (err) {
      notify(err.message);
      if (err.status === 401) setStatus((s) => ({ ...s, signedIn: false }));
    } finally { setSaving(false); }
  };
  // Ctrl/⌘+S saves.
  const saveRef = useRef(save);
  useEffect(() => { saveRef.current = save; });
  const canSaveNow = Boolean(status?.signedIn && status.canSave && unsaved && !saving);
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') { e.preventDefault(); if (canSaveNow) saveRef.current(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [canSaveNow]);

  const discard = () => {
    if (!window.confirm('Undo all the changes you haven’t saved?')) return;
    setDraft(Object.fromEntries(Object.keys(KINDS).map((k) => [k, JSON.parse(saved[k])])));
    setUploads({});
    setEditing(null);
    setMessage(null);
  };
  const restore = async (h) => {
    if (!window.confirm(`Go back to how the website's content was after this save (${whenSaved(h.date)})?\n\nEvents, team, gallery, reviews and club details return to that version. Changes saved after it are undone, and you can go back to them the same way.`)) return;
    setRestoring(h.sha);
    try {
      const res = await api('POST', '/api/admin/history', { sha: h.sha, label: whenSaved(h.date) });
      await loadContent(status);
      setPublished({ commit: res.commit, live: false });
      notify('Done. The website will show that version in about two minutes.', 'info');
    } catch (err) { notify(err.message); } finally { setRestoring(null); }
  };
  const signOut = async () => {
    if (unsaved && !window.confirm('You have unsaved changes. Sign out anyway?')) return;
    await api('DELETE', '/api/admin/session').catch(() => {});
    setDraft(null);
    setStatus((s) => ({ ...s, signedIn: false }));
  };
  const go = (section, nextFilter) => {
    if (section !== tab) setHue((h) => (h + 1) % ACTIVE_HUES.length);
    setTab(section);
    if (section === 'events') { setEditing(null); if (nextFilter) setFilter(nextFilter); }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const avenueOptions = [...new Set([...avenueNames, ...(draft?.events ?? []).flatMap((e) => [e.avenue, ...(e.otherAvenues ?? [])]).filter(Boolean)])];
  const addEvent = () => {
    update('events')((list) => [...list, blankEvent(avenueOptions[0])]);
    setEditing(draft.events.length);
    setTab('events');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const state = saving ? ['busy', 'Saving…']
    : unsaved ? ['warn', 'Unsaved changes']
      : published && !published.live ? ['busy', 'Publishing…']
        : published?.live ? ['ok', 'Live on the website'] : ['ok', 'All changes saved'];
  // The save bar: what it says now, kept on screen for a moment after it is no longer needed so it can slide away.
  const barNow = !(status?.signedIn && draft) ? null
    : message ? { text: message.text, tone: message.kind === 'error' ? 'error' : 'info', actions: unsaved && !saving ? 'save' : 'close' }
      : saving ? { text: 'Saving your changes…', tone: 'busy', actions: null }
        : unsaved ? { text: `Not saved · ${[...dirty.map((k) => KINDS[k]), ...(pending && !dirty.length ? [`${pending} photo${pending > 1 ? 's' : ''}`] : [])].join(', ')}`, tone: 'warn', actions: 'save' }
          : published && !published.dismissed ? {
            text: published.private ? 'Saved. The finance sheet is up to date.' : published.live ? 'Saved and live on the website.' : 'Saved. Live on the website in about two minutes.',
            tone: published.live ? 'ok' : 'busy', actions: 'close',
          } : null;
  const [bar, setBar] = useState({ on: false, leaving: false, text: '', tone: 'ok', actions: null });
  if (barNow && (!bar.on || bar.leaving || bar.text !== barNow.text || bar.tone !== barNow.tone || bar.actions !== barNow.actions)) setBar({ on: true, leaving: false, ...barNow });
  if (!barNow && bar.on && !bar.leaving) setBar({ ...bar, leaving: true });
  useEffect(() => {
    if (!bar.leaving) return undefined;
    const t = window.setTimeout(() => setBar((b) => (b.leaving ? { ...b, on: false, leaving: false } : b)), 320);
    return () => window.clearTimeout(t);
  }, [bar.leaving]);

  // The menus switch at once; the section itself is built in the background (it can be interrupted), so the
  // menu's animation never stutters while a long section like Team or Events is put together.
  const view = useDeferredValue(tab);
  const [collapsed, setCollapsed] = useState(false);
  const [hue, setHue] = useState(0);
  // Hovering a menu item colours its words: the next club colour each time the pointer moves to another item.
  const hover = useRef({ item: null, n: 3 });
  const tintHover = (e) => {
    const item = e.target instanceof Element ? e.target.closest('.adm-side-item') : null;
    if (!item || item === hover.current.item) return;
    hover.current.item = item;
    hover.current.n = (hover.current.n + 1) % ACTIVE_HUES.length;
    item.style.setProperty('--adm-hover', ACTIVE_HUES[hover.current.n]);
  };
  const counts = draft ? {
    events: draft.events.length,
    team: new Set(LISTS.flatMap(([k]) => draft.team[k].map((p) => p.name).filter(Boolean))).size,
    gallery: draft.gallery.length,
    reviews: draft.reviews.length,
    finance: draft.finance?.entries.length,
  } : {};
  const ready = status?.signedIn && draft;
  const client = typeof document !== 'undefined';

  if (!ready) {
    return (
      <section className="admin adm-gate">
        <div className="adm-gate-blobs" aria-hidden="true"><i /><i /><i /></div>
        <div className="adm-login">
          <div className="adm-login-art" aria-hidden="true">
            <div className="adm-login-hero">
              <h2>Manage<br /><span>your club</span></h2>
              <p>Events, the team, photos and finance, in one place for the board.</p>
            </div>
            <Image className="adm-login-phone" src="/images/admin-sign-in-overview.webp" alt="" width={1000} height={962} priority sizes="470px" />
          </div>
          <div className="adm-login-main">
            <header className="adm-login-top">
              <span className="adm-login-brand">
                {/* eslint-disable-next-line @next/next/no-img-element -- the site's own small icon */}
                <img src="/icon.png" alt="" width="34" height="34" />RAC Khopoli
              </span>
              <Link className="adm-login-link" href="/">Visit Website <FaArrowRight size={13} aria-hidden="true" /></Link>
            </header>
            <div className="adm-login-body">
              <h1>Sign in</h1>
              {!status && <Loader text="Opening…" />}
              {status && !status.signedIn && <SignIn notConfigured={!status.configured} onDone={() => { setMessage(null); load(); }} />}
              {status?.signedIn && !draft && !message && <Loader text="Loading…" />}
              {message && <p className="adm-error" role="alert">{message.text}</p>}
            </div>
            <footer className="adm-login-foot">
              <span>© {new Date().getFullYear()} Rotaract Club of Khopoli</span>
              <Link href="/contact">Contact us</Link>
            </footer>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="admin">
      <div className="container adm-wrap">
        <div className={`adm-app${collapsed ? ' is-collapsed' : ''}`}>
        {/* Computers: a translucent side menu on the left. Phones use the dark dock at the bottom instead. */}
        <aside className="adm-side" aria-label="Admin" style={{ '--adm-active': ACTIVE_HUES[hue] }} onPointerOver={tintHover}>
          <div className="adm-side-head">
            <strong className="adm-side-text">Club admin</strong>
            <button type="button" className="adm-side-toggle" aria-label={collapsed ? 'Expand the menu' : 'Collapse the menu'} title={collapsed ? 'Expand the menu' : 'Collapse the menu'} onClick={() => setCollapsed((c) => !c)}><FaTableColumns size={15} /></button>
          </div>
          <span className="adm-side-label"><span className="adm-side-letter" aria-hidden="true">M</span><span className="adm-side-text">Menu</span></span>
          <nav className="adm-side-nav" aria-label="Admin sections">
            {SECTIONS.map(([k, label, , Icon]) => (
              <button key={k} type="button" className="adm-side-item" aria-current={tab === k ? 'page' : undefined} title={label} onClick={() => go(k)}>
                <Icon size={16} aria-hidden="true" />
                <span className="adm-side-text">{label}</span>
                {counts[k] !== undefined && <span className="adm-side-count adm-side-text">{counts[k]}</span>}
              </button>
            ))}
          </nav>
          <span className="adm-side-label"><span className="adm-side-letter" aria-hidden="true">Q</span><span className="adm-side-text">Quick add</span></span>
          <div className="adm-side-nav">
            <button type="button" className="adm-side-item" title="New event" onClick={addEvent}><FaPlus size={14} aria-hidden="true" /><span className="adm-side-text">New event</span></button>
            <button type="button" className="adm-side-item" title="Income or expense" onClick={() => go('finance')}><FaIndianRupeeSign size={14} aria-hidden="true" /><span className="adm-side-text">Income or expense</span></button>
            <a className="adm-side-item" href="/" target="_blank" rel="noreferrer" title="View website"><FaArrowUpRightFromSquare size={14} aria-hidden="true" /><span className="adm-side-text">View website</span></a>
          </div>
          <div className="adm-side-foot">
            <button type="button" className="adm-side-item adm-side-signout" title="Sign out" onClick={signOut}><FaRightFromBracket size={16} aria-hidden="true" /><span className="adm-side-text">Sign out</span></button>
          </div>
        </aside>
        <div className="adm-panel">
        <header className="adm-topbar">
          <div className="adm-brand">
            <strong>Club admin</strong>
            <span>Rotaract Club of Khopoli</span>
          </div>
          <div className="adm-topbar-tools">
            <StatusChip state={state} />
            <a className="adm-round" href="/" target="_blank" rel="noreferrer" aria-label="View website" title="View website"><FaArrowUpRightFromSquare size={15} /></a>
            <button type="button" className="adm-round" aria-label="Sign out" title="Sign out" onClick={signOut}><FaRightFromBracket size={15} /></button>
          </div>
        </header>
        <div className="adm-main">
          <div key={`${view}-${view === 'events' ? editing ?? 'list' : ''}`} className="adm-view">
          {!status.canSave && <p className="adm-notice">Saving isn’t switched on yet: add <code>GITHUB_TOKEN</code> in Vercel (see REMAINING-TASKS.md).</p>}
          {view === 'overview' && (
            <OverviewTab
              draft={draft} hasPhoto={hasPhoto} photoOf={photoOf} memberPhoto={memberPhoto} memberHasPhoto={(p) => Boolean(memberPhoto(p))} go={go} addEvent={addEvent}
              history={history} onRestore={restore} restoring={restoring} canSave={status.canSave} unsaved={unsaved}
            />
          )}
          {view === 'events' && (
            <EventsTab
              events={draft.events} editing={editing} setEditing={setEditing} filter={filter} setFilter={setFilter}
              hasPhoto={hasPhoto} photoOf={photoOf} photoUrl={photoUrl} avenueOptions={avenueOptions} update={update('events')} addUpload={addUpload} notify={notify}
            />
          )}
          {view === 'team' && <TeamTab team={draft.team} photoOf={memberPhoto} update={update('team')} addUpload={addUpload} notify={notify} />}
          {view === 'gallery' && <GalleryTab gallery={draft.gallery} photoUrl={photoUrl} update={update('gallery')} addUpload={addUpload} notify={notify} />}
          {view === 'reviews' && <ReviewsTab reviews={draft.reviews} update={update('reviews')} />}
          {view === 'site' && <DetailsTab site={draft.site} update={update('site')} />}
          {view === 'finance' && (draft.finance
            ? <FinanceTab finance={draft.finance} events={draft.events} update={update('finance')} ready={financeReady && status.canSave} />
            : <p className="adm-notice">The finance sheet couldn’t be opened. {message?.text}</p>)}
          </div>
        </div>
        </div>
        </div>
      </div>

      {/* A floating dark bar along the bottom: the current section is a white pill with its name. Drawn at the
          page's top level so nothing on the page can cover it. */}
      {client && createPortal(
        <nav className="adm-dock" aria-label="Admin sections">
          {SECTIONS.map(([k, label, short, Icon]) => (
            <button key={k} type="button" aria-current={tab === k ? 'page' : undefined} title={label} onClick={() => go(k)}>
              <Icon size={17} aria-hidden="true" />
              <span className="adm-dock-label"><span>{short}</span></span>
            </button>
          ))}
        </nav>,
        document.body,
      )}

      {client && bar.on && createPortal(
        <div className={`adm-savebar is-${bar.tone}${bar.leaving ? ' is-leaving' : ''}`} role="status" aria-live="polite">
          <span key={bar.text} className="adm-savebar-text">{bar.text}</span>
          {bar.actions === 'save' && (
            <span className="adm-savebar-actions">
              <button type="button" className="adm-link" onClick={discard}>Undo</button>
              <button type="button" className="adm-btn" onClick={save} disabled={!status.canSave}>Save changes</button>
            </span>
          )}
          {bar.actions === 'close' && (
            <button type="button" className="adm-savebar-close" aria-label="Close" onClick={() => { setMessage(null); setPublished((p) => (p ? { ...p, dismissed: true } : p)); }}><FaXmark size={13} /></button>
          )}
        </div>,
        document.body,
      )}
    </section>
  );
}
