'use client';
import React, { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
// Icons: react-icons (Font Awesome 6), the same icon library Kindora uses.
import {
  FaArrowRight as ArrowRight, FaArrowRight as ArrowUpRight, FaChevronDown as ChevronDown, FaBars as Menu,
  FaXmark as X, FaPlus as Plus, FaRegEnvelope as Mail, FaMagnifyingGlass as Search,
  FaRegCalendarPlus as CalendarPlus, FaShareNodes as Share2, FaCheck as Check, FaInstagram as Instagram,
  FaFacebookF as Facebook, FaLinkedinIn as Linkedin, FaYoutube as Youtube, FaHeart as Heart,
} from 'react-icons/fa6';
import {
  ALL_PAGES, NAV, club, clubEmail, contact, officers, initials, FORM_ENDPOINT, FAMILY_LOGOS,
  formatDate, isPast, rotaractYear,
} from '../data/club';

// The lanyard badge is only downloaded when someone opens a member's badge.
const LanyardBadge = dynamic(() => import('@/components/ui/lanyard-badge'), { ssr: false });

const TONES = ['tint-rose', 'tint-sky', 'tint-gold', 'tint-leaf'];

/* ---------------------------------------------------------------- Images */

/**
 * Optimised image (resized + WebP via next/image) with a graceful fallback:
 * if the file is missing, a soft tinted tile with a label is shown instead of a broken image.
 */
export function Photo({ src, alt = '', label, className = '', tone = 0, priority = false, sizes = '(max-width: 700px) 100vw, 50vw' }) {
  const [failed, setFailed] = useState(!src);
  // An image that 404s before hydration never fires onError, so check when the element attaches.
  const ref = useCallback((img) => {
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, []);
  if (failed) {
    return (
      <div className={`photo-fallback ${TONES[tone % TONES.length]} ${className}`} role="img" aria-label={alt}>
        <span>{label ?? initials(alt || club.shortName)}</span>
      </div>
    );
  }
  return (
    <Image
      ref={ref}
      src={src}
      alt={alt}
      width={1200}
      height={900}
      sizes={sizes}
      priority={priority}
      className={`photo ${className}`}
      onError={() => setFailed(true)}
    />
  );
}

/* ---------------------------------------------------------------- Basics */

export function Btn({ href = '/join', children, kind = 'primary', className = '', icon = true }) {
  const inner = (<>{children}{icon && <span className="btn-arrow" aria-hidden="true"><ArrowRight size={18} /></span>}</>);
  const cls = `btn btn-${kind} ${className}`;
  if (/^(https?:|mailto:|tel:)/.test(href)) {
    const ext = href.startsWith('http');
    return <a href={href} className={cls} target={ext ? '_blank' : undefined} rel={ext ? 'noreferrer' : undefined}>{inner}</a>;
  }
  return <Link href={href} className={cls}>{inner}</Link>;
}

export function Eyebrow({ children }) {
  return <span className="eyebrow"><span className="eyebrow-dot" aria-hidden="true" />{children}</span>;
}

export function Intro({ label, title, description, center = false, as: H = 'h2' }) {
  return (
    <div className={`section-intro ${center ? 'is-center' : ''}`}>
      {label && <Eyebrow>{label}</Eyebrow>}
      <H>{title}</H>
      {description && <p>{description}</p>}
    </div>
  );
}

/** tone: 'plain' | 'cream' | 'rose' */
export function Section({ children, tone = 'plain', id, className = '' }) {
  return <section id={id} className={`section section-${tone} ${className}`}><div className="container">{children}</div></section>;
}

/**
 * Kindora-style page header.
 * layout 'center' (default): eyebrow, title and text centred.
 * layout 'split': eyebrow + title on the left, text + actions on the right.
 * wideImage: a full-width rounded photo under the header (About, Join).
 * logo: shows a logo card beside the title (District, Rotary pages).
 */
export function PageHero({ eyebrow, title, desc, children, layout = 'center', wideImage, logo, as: H = 'h1' }) {
  return (
    <section className={`page-hero is-${logo ? 'split' : layout}`}>
      <div className="container">
        <div className="page-hero-inner">
          <div className="page-hero-title">
            <Eyebrow>{eyebrow}</Eyebrow>
            <H>{title}</H>
          </div>
          <div className="page-hero-copy">
            {desc && <p>{desc}</p>}
            {children}
          </div>
          {logo && <div className="page-hero-logo"><Image src={logo.src} alt={logo.alt} width={logo.w} height={logo.h} priority sizes="(max-width: 900px) 80vw, 420px" /></div>}
        </div>
        {wideImage && <div className="page-hero-wide"><Photo src={wideImage} alt="" label={title} priority sizes="(max-width: 1240px) 100vw, 1240px" /></div>}
      </div>
    </section>
  );
}

/** The official Rotaract Club of Khopoli logo (white version on dark backgrounds). */
export function Logo({ light = false }) {
  return (
    <Link href="/" className={`logo ${light ? 'logo-light' : ''}`}>
      <Image
        src={light ? '/images/logos/rotaract-khopoli-white.png' : '/images/logos/rotaract-khopoli.png'}
        alt={`${club.name}, home`}
        width={867}
        height={296}
        priority={!light}
        sizes="200px"
        className="logo-img"
      />
    </Link>
  );
}


/** Continuously scrolling strip of District 3131 family logos (Kindora's partner logo slider). */
export function LogoMarquee({ grey = true, copies = 4 }) {
  const set = (k) => FAMILY_LOGOS.map((l) => {
    const img = <Image src={l.src} alt={k === 0 ? l.alt : ''} width={l.w} height={l.h} sizes="200px" />;
    return <li key={`${k}-${l.src}`} aria-hidden={k > 0 || undefined}>{l.href && k === 0 ? <Link href={l.href}>{img}</Link> : img}</li>;
  });
  return (
    <div className={`marquee ${grey ? 'is-grey' : ''}`}>
      <ul className="marquee-track">{Array.from({ length: copies }, (_, k) => set(k))}</ul>
    </div>
  );
}

/** Hero strip: title plus the scrolling family logos. */
export function FamilyLogos({ title = 'Proudly part of the Rotary family in District 3131' }) {
  return (
    <div className="family-logos">
      <span>{title}</span>
      <LogoMarquee />
    </div>
  );
}

/* ---------------------------------------------------------------- Header / footer */

/**
 * Every new page opens at the top. Next.js only scrolls when the new page's top is off screen, so after
 * scrolling a little the next page would open part-way down with the header over its title. Back/forward
 * keeps the browser's restored position, and links to a #section keep their target.
 */
let historyNav = false;
function useScrollToTopOnPageChange(pathname) {
  const first = useRef(true);
  useEffect(() => {
    const onPop = () => { historyNav = true; };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  useLayoutEffect(() => {
    if (first.current) { first.current = false; return; }
    if (historyNav) { historyNav = false; return; }
    if (window.location.hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);
}

export function Header() {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const [open, setOpen] = useState(false);
  const [pagesOpen, setPagesOpen] = useState(false);
  const [pagesByHover, setPagesByHover] = useState(false); // opened by hovering (desktop) rather than a click
  const [stuck, setStuck] = useState(false);
  useScrollToTopOnPageChange(pathname);
  // Close menus whenever the page changes (adjusting state during render, as React recommends).
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) { setLastPath(pathname); setOpen(false); setPagesOpen(false); }
  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 120);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => {
    if (!pagesOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setPagesOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pagesOpen]);
  const isCurrent = (href) => (href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`));
  return (
    <header className={`site-header ${isHome ? 'is-overlay' : ''} ${stuck ? 'is-stuck' : ''}`}>
      <a className="skip-link" href="#main">Skip to content</a>
      <div className="container nav-wrap">
        <Logo />
        <div className="header-mobile-actions">
          <button className="menu-toggle" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} aria-controls="main-nav" onClick={() => setOpen(!open)}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        <nav id="main-nav" className={`nav ${open ? 'is-open' : ''}`} aria-label="Main">
          <div
            className="pages-wrap"
            onMouseEnter={() => { if (!pagesOpen && window.matchMedia('(hover: hover) and (min-width: 1041px)').matches) { setPagesByHover(true); setPagesOpen(true); } }}
            onMouseLeave={() => { if (pagesByHover) { setPagesOpen(false); setPagesByHover(false); } }}
          >
            <button type="button" className={`nav-pill pages-toggle ${pagesOpen ? 'is-open' : ''}`} aria-expanded={pagesOpen} aria-controls="pages-menu" onClick={() => { if (pagesOpen && pagesByHover) { setPagesByHover(false); } else { setPagesByHover(false); setPagesOpen(!pagesOpen); } }}>
              All Pages <ChevronDown size={16} aria-hidden="true" />
            </button>
            {pagesOpen && !pagesByHover && <button className="dropdown-backdrop" tabIndex={-1} aria-hidden="true" onClick={() => setPagesOpen(false)} />}
            {pagesOpen && (
              <div className="pages-menu" id="pages-menu">
                {ALL_PAGES.map(([label, href]) => (
                  <Link key={href} href={href} aria-current={pathname === href ? 'page' : undefined}>{label}</Link>
                ))}
              </div>
            )}
          </div>
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className={`nav-pill ${isCurrent(item.href) ? 'is-current' : ''}`} aria-current={isCurrent(item.href) ? 'page' : undefined}>
              {item.label}
            </Link>
          ))}
          <Link href="/join" className="nav-cta">Join the Club</Link>
        </nav>
      </div>
    </header>
  );
}

export function SocialLinks({ className = '' }) {
  const items = [
    ['instagram', Instagram, 'Instagram'], ['facebook', Facebook, 'Facebook'],
    ['linkedin', Linkedin, 'LinkedIn'], ['youtube', Youtube, 'YouTube'],
  ].filter(([k]) => contact.social[k]);
  if (!items.length) return null;
  return (
    <div className={`social ${className}`}>
      {items.map(([k, Icon, label]) => <a key={k} href={contact.social[k]} target="_blank" rel="noreferrer" aria-label={`${club.shortName} on ${label}`}><Icon size={18} /></a>)}
    </div>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <Logo />
            <p>{club.tagline}</p>
            <SubscribeForm />
          </div>
          <FooterCol title="Quick Links" items={[['Sponsorship', '/sponsorship'], ['About Us', '/about'], ['Events', '/events'], ['Avenues', '/avenues']]} />
          <FooterCol title="More" items={[['Blog', '/blog'], ['Our Team', '/teams'], ['Reviews', '/reviews'], ['Gallery', '/gallery']]} />
          <FooterCol title="Legal & Policy Links" items={[['Privacy Policy', '/privacy-policy'], ['Terms & Conditions', '/terms-and-conditions'], ['Contact Us', '/contact']]} />
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} {club.name} · Club ID {club.clubId} · {club.district}</span>
          <SocialLinks />
          <a href={`mailto:${clubEmail}`} className="footer-mail"><Mail size={15} aria-hidden="true" /> {clubEmail}</a>
          <span className="footer-credit">Made with <Heart className="footer-heart" aria-label="love" /> by Gargi Gaikwad</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, items }) {
  return (
    <div className="footer-col">
      <h2 className="footer-heading">{title}</h2>
      {items.map(([n, h]) => <Link href={h} key={h}>{n}</Link>)}
    </div>
  );
}

/* ---------------------------------------------------------------- Forms */

async function deliver(subject, fields) {
  if (FORM_ENDPOINT) {
    const res = await fetch(FORM_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ _subject: subject, ...fields }),
    });
    if (!res.ok) throw new Error('send failed');
    return 'sent';
  }
  const body = Object.entries(fields).map(([k, v]) => `${k}: ${v}`).join('\n\n');
  window.location.href = `mailto:${clubEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return 'mailto';
}

function SubscribeForm() {
  const [state, setState] = useState('idle');
  async function onSubmit(e) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get('email') ?? '');
    try { setState(await deliver('Please add me to club updates', { Email: email, Request: 'Keep me posted about upcoming projects and events.' })); }
    catch { setState('error'); }
  }
  return (
    <>
      <form className="subscribe" onSubmit={onSubmit}>
        <Mail size={18} aria-hidden="true" />
        <label className="sr-only" htmlFor="footer-email">Email address for project updates</label>
        <input id="footer-email" name="email" type="email" placeholder="Enter your email" required autoComplete="email" />
        <button type="submit">Subscribe</button>
      </form>
      <p className="form-status" role="status" aria-live="polite">
        {state === 'sent' && 'Thank you, you are on the list.'}
        {state === 'mailto' && 'Your email app should open with the request ready to send.'}
        {state === 'error' && `That did not go through. Please write to ${clubEmail}.`}
      </p>
    </>
  );
}

/**
 * Form that posts to FORM_ENDPOINT when configured, otherwise opens the visitor's email app.
 * fields: [{ name, label, type?, placeholder?, required?, options?, rows?, minLength?, pattern?, title?, autoComplete? }]
 * prefill: name of a field to fill from the ?about= query parameter (e.g. from an event page).
 */
export function MailForm({ title, intro, subject, fields, submitLabel = 'Send Message', prefill }) {
  const [state, setState] = useState('idle');
  const formRef = useRef(null);
  useEffect(() => {
    if (!prefill) return;
    const about = new URLSearchParams(window.location.search).get('about');
    const el = formRef.current?.elements.namedItem(prefill);
    if (about && el && !el.value) el.value = `About: ${about}\n\n`;
  }, [prefill]);
  async function onSubmit(e) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const values = Object.fromEntries(fields.map((f) => [f.label, String(data.get(f.name) ?? '').trim()]));
    const who = String(data.get('name') ?? '').trim();
    setState('sending');
    try {
      setState(await deliver(`${subject}${who ? ` from ${who}` : ''}`, values));
      if (FORM_ENDPOINT) e.target.reset();
    } catch { setState('error'); }
  }
  return (
    <div className="form-card">
      <h2>{title}</h2>
      {intro && <p>{intro}</p>}
      <form ref={formRef} onSubmit={onSubmit}>
        {fields.map((f) => {
          const id = `f-${f.name}`;
          return (
            <div className="field" key={f.name}>
              <label htmlFor={id}>{f.label}{!f.required && <span className="optional"> (optional)</span>}</label>
              {f.options ? (
                <select id={id} name={f.name} defaultValue={f.options[0]} required={f.required}>
                  {f.options.map((o) => <option key={o}>{o}</option>)}
                </select>
              ) : f.rows ? (
                <textarea id={id} name={f.name} rows={f.rows} placeholder={f.placeholder} required={f.required} minLength={f.minLength} />
              ) : (
                <input id={id} name={f.name} type={f.type ?? 'text'} placeholder={f.placeholder} required={f.required} pattern={f.pattern} title={f.title} autoComplete={f.autoComplete} minLength={f.minLength} />
              )}
              {f.hint && <small className="hint">{f.hint}</small>}
            </div>
          );
        })}
        <p className="consent">By sending this form you agree to the club using these details to reply to you, as described in our <Link href="/privacy-policy">privacy policy</Link>.</p>
        <button type="submit" className="submit-btn" disabled={state === 'sending'}>{state === 'sending' ? 'Sending…' : submitLabel} <ArrowUpRight size={18} aria-hidden="true" /></button>
        <p className={`form-status ${state === 'error' ? 'is-error' : ''}`} role="status" aria-live="polite">
          {state === 'sent' && <><Check size={16} aria-hidden="true" /> Thank you, your message has reached the club. We will reply soon.</>}
          {state === 'mailto' && `Your email app should open with the message ready to send to ${clubEmail}. If nothing opened, write to that address directly.`}
          {state === 'error' && `Sorry, that did not go through. Please write to ${clubEmail}.`}
        </p>
      </form>
    </div>
  );
}

/* ---------------------------------------------------------------- Note wall (Share your experience) */

const NOTE_MAX = 140;
const NOTES_KEY = 'rck-notes';
const NOTE_COLORS = [
  { id: 'sun', label: 'Yellow' },
  { id: 'rose', label: 'Pink' },
  { id: 'mint', label: 'Green' },
  { id: 'sky', label: 'Blue' },
];
// Tiny store over localStorage, so the wall survives reloads and stays in sync across tabs.
let notesMemory = '[]'; // used when the browser blocks storage
const readNotes = () => { try { return localStorage.getItem(NOTES_KEY) ?? '[]'; } catch { return notesMemory; } };
const subscribeNotes = (cb) => {
  window.addEventListener('storage', cb);
  window.addEventListener('rck-notes', cb);
  return () => { window.removeEventListener('storage', cb); window.removeEventListener('rck-notes', cb); };
};
const writeNotes = (list) => {
  const raw = JSON.stringify(list);
  notesMemory = raw;
  try { localStorage.setItem(NOTES_KEY, raw); } catch { /* storage blocked: keep it in memory */ }
  window.dispatchEvent(new Event('rck-notes'));
};
const parseNotes = (raw) => { try { const v = JSON.parse(raw); return Array.isArray(v) ? v : []; } catch { return []; } };

/** "Leave a note" wall: visitors pin short notes in their own browser and can send any note to the club. */
export function NoteWall() {
  const raw = useSyncExternalStore(subscribeNotes, readNotes, () => '[]');
  const notes = useMemo(() => parseNotes(raw), [raw]);
  const [text, setText] = useState('');
  const [name, setName] = useState('');
  const [color, setColor] = useState('sun');
  const [status, setStatus] = useState({}); // note id -> 'sending' | 'sent' | 'mailto' | 'error'
  const left = NOTE_MAX - text.length;

  function pin(e) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    const note = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, text: body.slice(0, NOTE_MAX), name: name.trim().slice(0, 40), color, at: new Date().toISOString() };
    writeNotes([note, ...notes].slice(0, 30));
    setText('');
  }
  async function send(note) {
    setStatus((s) => ({ ...s, [note.id]: 'sending' }));
    try {
      const result = await deliver(`A note for the club${note.name ? ` from ${note.name}` : ''}`, { Name: note.name || 'Not given', Note: note.text });
      setStatus((s) => ({ ...s, [note.id]: result }));
      if (result === 'sent') writeNotes(parseNotes(readNotes()).map((n) => (n.id === note.id ? { ...n, sent: true } : n)));
    } catch { setStatus((s) => ({ ...s, [note.id]: 'error' })); }
  }
  const remove = (id) => writeNotes(notes.filter((n) => n.id !== id));

  return (
    <div className="note-layout">
      <form className="note-form" onSubmit={pin}>
        <div className="field">
          <label htmlFor="note-text">Your note</label>
          <textarea id="note-text" rows={4} maxLength={NOTE_MAX} required value={text} onChange={(e) => setText(e.target.value)} placeholder="Say hi, share a memory from an event, or tell us what the club meant to you…" />
        </div>
        <div className="field">
          <label htmlFor="note-name">Name <span className="optional">(optional)</span></label>
          <input id="note-name" maxLength={40} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Aditi" autoComplete="name" />
        </div>
        <div className="note-form-row">
          <fieldset className="note-swatches">
            <legend className="sr-only">Note colour</legend>
            {NOTE_COLORS.map((c) => (
              <label key={c.id} className={`note-swatch is-${c.id}`} title={c.label}>
                <input type="radio" name="note-color" value={c.id} checked={color === c.id} onChange={() => setColor(c.id)} />
                <span className="sr-only">{c.label}</span>
              </label>
            ))}
          </fieldset>
          <span className={`note-count ${left <= 20 ? 'is-low' : ''}`} aria-live="polite">{left} left</span>
        </div>
        <button type="submit" className="note-pin-btn">Pin it to the wall</button>
        <p className="note-help">The wall lives in your own browser. It is a keepsake, not public. To actually send a note to the club, press “Send to the club” on it.</p>
      </form>

      <div className={`note-wall ${notes.length ? '' : 'is-empty'}`} aria-live="polite">
        {notes.length === 0 ? (
          <div className="note-empty">
            <span className="note-empty-pin" aria-hidden="true" />
            <p>No notes yet. Be the first to pin one.</p>
          </div>
        ) : (
          <ul className="note-list">
            {notes.map((n, i) => {
              const st = n.sent ? 'sent' : status[n.id];
              return (
                <li key={n.id} className={`note is-${n.color}`} style={{ '--tilt': `${[-2, 1.5, -1, 2, -1.5, 1][i % 6]}deg` }}>
                  <span className="note-pin" aria-hidden="true" />
                  <button type="button" className="note-remove" onClick={() => remove(n.id)} aria-label="Remove this note"><X size={13} aria-hidden="true" /></button>
                  <p className="note-text">{n.text}</p>
                  <p className="note-meta">{n.name ? `— ${n.name}` : '— Anonymous'} · {new Date(n.at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  {st === 'sent' ? (
                    <span className="note-sent"><Check size={12} aria-hidden="true" /> Sent to the club</span>
                  ) : (
                    <button type="button" className="note-send" onClick={() => send(n)} disabled={st === 'sending'}>
                      {st === 'sending' ? 'Sending…' : st === 'mailto' ? 'Opened your email app' : st === 'error' ? 'Try again' : 'Send to the club'}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- Member badge (lanyard) */

/**
 * A member card that opens the member's lanyard badge when clicked, as on the club's original site.
 * The card's own content is passed as children; a transparent button covers it.
 */
export function MemberBadgeCard({ member, portrait, className = '', children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={className}>
      {children}
      <button type="button" className="member-open" aria-label={`View ${member.name}'s badge`} onClick={() => setOpen(true)} />
      {open && <MemberBadgeDialog member={member} portrait={portrait} onClose={() => setOpen(false)} />}
    </div>
  );
}

function MemberBadgeDialog({ member, portrait, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
    return () => { if (d?.open) d.close(); };
  }, []);
  const close = () => ref.current?.close();
  return (
    <dialog
      ref={ref}
      className="badge-dialog"
      aria-label={`${member.name}, member badge`}
      onClose={onClose}
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
    >
      <button type="button" className="badge-close" onClick={close} aria-label="Close badge"><X size={16} aria-hidden="true" /></button>
      <p className="sr-only">Member badge. Drag to swing it, tap it to flip and see their roles.</p>
      <LanyardBadge
        height="min(82svh, 640px)"
        cardWidth={230}
        strapText="rotaract club of khopoli"
        strapLabel={`RID 3131 · ${rotaractYear}`}
        strapColor="#b5174f"
        inkColor="#f2b51c"
        front={
          <div className="badge-face badge-front">
            <div className="badge-photo">
              {portrait ? <Image src={portrait} alt="" fill sizes="240px" draggable={false} /> : <span aria-hidden="true">{initials(member.name)}</span>}
            </div>
            <div className="badge-id">
              <p className="badge-kicker">Rotaract Khopoli</p>
              <p className="badge-name">{member.name}</p>
            </div>
          </div>
        }
        back={
          <div className="badge-face badge-back">
            <p className="badge-kicker is-blue">Portfolio</p>
            <p className="badge-name is-big">{member.name}</p>
            <ul>{member.roles.map((r) => <li key={r}>{r}</li>)}</ul>
          </div>
        }
      />
    </dialog>
  );
}

/* ---------------------------------------------------------------- Hover to expand */

// Where the mouse last was, shared by every hover-to-open element. When content opens or closes,
// the page moves under a still mouse and the browser fires pointer events at the new element;
// comparing with this position ignores those, so one opening never sets off a chain of others.
const lastPointer = { x: -1, y: -1 };

/** Calls `onIntent` when a mouse rests on (or moves across) an element for `delay` ms. Touch is ignored. */
function useHoverIntent(onIntent, delay = 220) {
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const onPointerMove = (e) => {
    if (e.pointerType !== 'mouse') return;
    const moved = Math.abs(e.clientX - lastPointer.x) + Math.abs(e.clientY - lastPointer.y) > 1;
    lastPointer.x = e.clientX;
    lastPointer.y = e.clientY;
    if (!moved || timer.current) return;
    timer.current = window.setTimeout(() => { timer.current = 0; onIntent(); }, delay);
  };
  const onPointerLeave = () => { window.clearTimeout(timer.current); timer.current = 0; };
  return { onPointerMove, onPointerLeave };
}

/**
 * A leader's message: the first paragraphs, then the rest unfolding smoothly when the mouse rests on
 * the message (or the button is pressed). It stays open after the mouse leaves; "Show less" folds it.
 */
export function LeaderLetter({ title, greeting, preview = [], rest = [], signoff = null }) {
  const [open, setOpen] = useState(false);
  const hover = useHoverIntent(() => setOpen(true), 260);
  const id = useId();
  return (
    <div className={`leader-letter ${open ? 'is-open' : ''}`} {...(rest.length ? hover : {})}>
      <h3>{title}</h3>
      {greeting && <p className="leader-greeting">{greeting}</p>}
      {preview.map((para) => <p key={para.slice(0, 48)}>{para}</p>)}
      {rest.length > 0 ? (
        <>
          <div className="letter-more" id={id} inert={!open}>
            <div>
              {rest.map((para) => <p key={para.slice(0, 48)}>{para}</p>)}
              {signoff}
            </div>
          </div>
          <button type="button" className="letter-toggle" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
            {open ? 'Show less' : 'Read the full message'} <span aria-hidden="true">{open ? '\u2212' : '+'}</span>
          </button>
        </>
      ) : signoff}
    </div>
  );
}

/* ---------------------------------------------------------------- FAQs */

/** FAQ accordion. Click a question, or rest the mouse on it, to open it (one open at a time). */
export function FaqList({ items, firstOpen = true }) {
  const [expanded, setExpanded] = useState(firstOpen ? 0 : -1);
  return (
    <div className="faq-items">
      {items.map((f, i) => (
        <FaqItem key={f.q} f={f} open={expanded === i} onToggle={() => setExpanded(expanded === i ? -1 : i)} onHover={() => setExpanded(i)} />
      ))}
    </div>
  );
}

function FaqItem({ f, open, onToggle, onHover }) {
  const hover = useHoverIntent(() => { if (!open) onHover(); }, 200);
  const id = `faq-${f.q.replace(/\W+/g, '-').toLowerCase()}`;
  return (
    <div className={`faq-item ${open ? 'is-open' : ''}`} {...hover}>
      <h3>
        <button type="button" aria-expanded={open} aria-controls={id} onClick={onToggle}>
          <span>{f.q}</span><span className="faq-icon" aria-hidden="true"><Plus size={19} /></span>
        </button>
      </h3>
      <div id={id} className="faq-answer" inert={!open}><div><p>{f.a}</p></div></div>
    </div>
  );
}

export function FaqSearch({ groups }) {
  const [q, setQ] = useState('');
  const term = q.trim().toLowerCase();
  const filtered = useMemo(() => groups
    .map((g) => ({ ...g, items: g.items.filter((f) => !term || `${f.q} ${f.a}`.toLowerCase().includes(term)) }))
    .filter((g) => g.items.length), [groups, term]);
  return (
    <>
      <div className="search-box">
        <Search size={20} aria-hidden="true" />
        <label className="sr-only" htmlFor="faq-search">Search questions</label>
        <input id="faq-search" type="search" placeholder="Search questions, e.g. fees, meetings, age" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <p className="sr-only" role="status" aria-live="polite">{filtered.reduce((n, g) => n + g.items.length, 0)} questions shown</p>
      {filtered.length === 0 && <p className="empty-note">No questions match “{q}”. <Link href="/contact">Ask us directly</Link>.</p>}
      {filtered.map((g) => (
        <div className="faq-group" key={g.title}>
          <h2>{g.title}</h2>
          <FaqList items={g.items} firstOpen={false} key={term} />
        </div>
      ))}
    </>
  );
}

/* ---------------------------------------------------------------- Events */

/** The visitor's current time: null while rendering on the server, a fixed timestamp once in the browser. */
let clientNow;
const noopSubscribe = () => () => {};
function useNow() {
  return useSyncExternalStore(noopSubscribe, () => (clientNow ??= Date.now()), () => null);
}

/** Upcoming / Completed badge, worked out in the visitor's browser so it never goes stale between deploys. */
export function EventStatus({ event, className = '' }) {
  const now = useNow();
  const past = now === null ? isPast(event) : isPast(event, now);
  return <span className={`status ${past ? 'is-past' : 'is-upcoming'} ${className}`} suppressHydrationWarning>{past ? 'Completed' : 'Upcoming'}</span>;
}

export function EventCard({ e, i = 0, headingLevel = 3 }) {
  const H = `h${headingLevel}`;
  return (
    <article className="event-card">
      <Link href={`/events/${e.slug}`} className="event-card-photo" tabIndex={-1} aria-hidden="true">
        <Photo src={`/images/events/${e.slug}.jpg`} alt="" label={e.title} tone={i} sizes="(max-width: 700px) 100vw, (max-width: 1040px) 50vw, 33vw" />
      </Link>
      <div className="event-card-body">
        <div className="event-card-meta"><span className="chip">{e.avenue}</span><EventStatus event={e} /></div>
        <H>{e.title}</H>
        <p>{e.summary}</p>
        <dl className="event-card-facts">
          <div><dt>Date</dt><dd>{formatDate(e.date)}</dd></div>
          <div><dt>Venue</dt><dd>{e.venue}</dd></div>
        </dl>
        <Link href={`/events/${e.slug}`} className="card-btn">View Event<span className="sr-only">: {e.title}</span></Link>
      </div>
    </article>
  );
}

export function EventsExplorer({ events, perPage = 6 }) {
  const [page, setPage] = useState(1);
  const [when, setWhen] = useState('all');
  const [avenue, setAvenue] = useState('All avenues');
  const now = useNow();
  const avenueNames = ['All avenues', ...new Set(events.map((e) => e.avenue))];
  const list = events.filter((e) => (avenue === 'All avenues' || e.avenue === avenue)
    && (when === 'all' || now === null || (when === 'past' ? isPast(e, now) : !isPast(e, now))));
  const upcomingCount = now === null ? null : events.filter((e) => !isPast(e, now)).length;
  return (
    <>
      {upcomingCount === 0 && (
        <div className="notice-banner">
          <div><strong>The next calendar is being finalised.</strong><p>Project dates for the new Rotaract year are being confirmed with the board. Write to us to hear first.</p></div>
          <Btn href="/contact?about=Upcoming%20events" kind="dark">Get Notified</Btn>
        </div>
      )}
      <div className="filters" role="group" aria-label="Filter events">
        <div className="segmented">
          {[['all', 'All'], ['upcoming', 'Upcoming'], ['past', 'Completed']].map(([k, l]) => (
            <button key={k} type="button" aria-pressed={when === k} className={when === k ? 'is-active' : ''} onClick={() => { setWhen(k); setPage(1); }}>{l}</button>
          ))}
        </div>
        <label className="sr-only" htmlFor="avenue-filter">Filter by avenue</label>
        <select id="avenue-filter" value={avenue} onChange={(e) => { setAvenue(e.target.value); setPage(1); }}>
          {avenueNames.map((a) => <option key={a}>{a}</option>)}
        </select>
      </div>
      <p className="sr-only" role="status" aria-live="polite">{list.length} events shown</p>
      {list.length ? (
        <>
          <div className="card-grid">{list.slice((page - 1) * perPage, page * perPage).map((e, i) => <EventCard e={e} i={i} key={e.slug} headingLevel={2} />)}</div>
          {list.length > perPage && (
            <nav className="pagination" aria-label="Event pages">
              {Array.from({ length: Math.ceil(list.length / perPage) }, (_, n) => (
                <button key={n} type="button" className={page === n + 1 ? 'is-active' : ''} aria-current={page === n + 1 ? 'page' : undefined} onClick={() => setPage(n + 1)}>{n + 1}</button>
              ))}
              <button type="button" aria-label="Next page" disabled={page * perPage >= list.length} onClick={() => setPage(page + 1)}><ArrowRight size={16} /></button>
            </nav>
          )}
        </>
      ) : (
        <p className="empty-note">No events match these filters yet.</p>
      )}
    </>
  );
}

function icsDate(iso, hhmm) {
  return `${iso.replace(/-/g, '')}T${hhmm.replace(':', '')}00`;
}
function to24(t) {
  const m = t.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return null;
  let h = Number(m[1]) % 12;
  if (m[3].toUpperCase() === 'PM') h += 12;
  return `${String(h).padStart(2, '0')}:${m[2]}`;
}

export function EventActions({ event }) {
  const [copied, setCopied] = useState(false);
  function addToCalendar() {
    const [startT, endT] = (event.time ?? '').split(/\s*-\s*/).map(to24);
    const start = startT ? `DTSTART;TZID=Asia/Kolkata:${icsDate(event.date, startT)}` : `DTSTART;VALUE=DATE:${event.date.replace(/-/g, '')}`;
    const end = endT ? `DTEND;TZID=Asia/Kolkata:${icsDate(event.endDate ?? event.date, endT)}` : '';
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Rotaract Khopoli//EN', 'BEGIN:VEVENT',
      `UID:${event.slug}@rotaractkhopoli`, `SUMMARY:${event.title}`, start, end, `LOCATION:${event.venue}`,
      `DESCRIPTION:${event.summary}`, 'END:VEVENT', 'END:VCALENDAR'].filter(Boolean).join('\r\n');
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: `${event.slug}.ics` });
    a.click();
    URL.revokeObjectURL(url);
  }
  async function share() {
    const data = { title: event.title, text: event.summary, url: window.location.href };
    try {
      if (navigator.share) { await navigator.share(data); return; }
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true); setTimeout(() => setCopied(false), 2500);
    } catch { /* user cancelled */ }
  }
  return (
    <div className="event-actions">
      {!isPast(event) && <button type="button" className="chip-btn" onClick={addToCalendar}><CalendarPlus size={16} aria-hidden="true" /> Add to Calendar</button>}
      <button type="button" className="chip-btn" onClick={share}><Share2 size={16} aria-hidden="true" /> {copied ? 'Link Copied' : 'Share'}</button>
    </div>
  );
}

/* ---------------------------------------------------------------- Motion */

/**
 * Kindora-style scroll reveal (the same effects as its AOS setup: 0.6s ease, small distances, staggered grids).
 * Rules map selectors to an effect, a base delay and a per-item stagger. Content stays visible without JS
 * and for visitors who prefer reduced motion.
 */
/**
 * Buttons light up in a different colour each on hover (Rotary blue, cranberry, green, gold,
 * Interact blue, coral; see [data-hue] in globals.css). Neighbouring buttons get different colours,
 * and a button inside a "ways" card takes the colour of that card's icon.
 */
const HUE_SELECTOR = '.btn, .card-btn, .nav-cta, .submit-btn, .chip-btn, .pill-links a, .note-pin-btn, .letter-toggle, .back-link';
const ICON_HUE = { 'c-0': '2', 'c-1': '3', 'c-2': '5' }; // green, gold, coral icons
function tintButtons() {
  document.querySelectorAll(HUE_SELECTOR).forEach((el, i) => {
    if (el.dataset.hue) return;
    const icon = el.closest('.way, .value')?.querySelector('.way-icon');
    const fromIcon = icon && Object.keys(ICON_HUE).find((c) => icon.classList.contains(c));
    el.dataset.hue = fromIcon ? ICON_HUE[fromIcon] : String(i % 6);
  });
}

const REVEAL_RULES = [
  ['.home-hero-copy', 'fade-up', 150],
  ['.home-hero-art .hero-quote, .home-hero-art .story-reel, .home-hero-art .hero-info-card, .home-hero-art .hero-small-tag', 'fade-up', 150],
  ['.donorline .avatar, .cta-stat .avatar', 'fade-right', 100, 200],
  ['.volunteer-copy li', 'zoom-in', 50, 150],
  ['.quote-card', 'zoom-out', 50, 100],
  ['.gallery-item', 'zoom-in', 0, 80, 4],
  ['.faq-item', 'fade-up', 50, 100],
  ['.card-grid > *, .post-grid > *, .package-grid > *, .contact-cards > *, .avenue-grid > *', 'fade-up', 0, 100, 3],
  ['.counters > *, .stat-cards > *', 'fade-up', 50, 100],
  ['.wide-banner-card', 'zoom-in', 150],
  ['.section-intro, .split-intro, .team-head, .strip-title, .page-hero-inner, .faq-head, .cta-band, .detail-hero .container > *', 'fade-up', 150],
  ['.metric-grid, .story-block > *', 'fade-up', 100],
  ['.footer-top', 'fade-up', 150],
  ['.note-head, .note-layout > *', 'fade-up', 150],
  ['.post-featured, .post-hero-head, .post-cover, .post-prose, .leader-card, .about-text, .timeline, .four-way, .focus-grid, .ways-grid, .value-grid, .logo-strip, .impact-band, .facts-grid, .green-counter, .yellow-band, .featured-card, .page-hero-wide, .form-layout > *, .donate-grid > *, .prose.narrow, .filters, .notice-banner, .pill-links', 'fade-up', 200],
];

/** Numbers that count up when they scroll into view (like Kindora's stats). Years and ranges are left alone. */
const COUNT_SELECTOR = '.metric-card > strong, .stat-boxes b, .counters strong, .impact-band dd, .stat-cards dd, .green-counter strong, .hero-info-card b, .outcome-grid dd';

function countUp(el) {
  const final = el.textContent;
  const m = final.match(/^([^\d]*)([\d,]*\.?\d+)(.*)$/);
  if (!m || /^(19|20)\d\d$/.test(m[2]) || /^\s*-/.test(m[3])) return;
  const [, prefix, numText, suffix] = m;
  const target = parseFloat(numText.replace(/,/g, ''));
  const decimals = (numText.split('.')[1] || '').length;
  const commas = numText.includes(',');
  const fmt = (v) => {
    const n = v.toFixed(decimals);
    return commas ? Number(n).toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) : n;
  };
  el.setAttribute('aria-label', final);
  const start = performance.now();
  const duration = 2000;
  const tick = (now) => {
    const t = Math.min(1, Math.max(0, (now - start) / duration)); // rAF time can be slightly earlier than start
    const eased = 1 - (1 - t) ** 3;
    el.textContent = `${prefix}${fmt(target * eased)}${suffix}`;
    if (t < 1) requestAnimationFrame(tick); else { el.textContent = final; el.removeAttribute('aria-label'); }
  };
  el.textContent = `${prefix}${fmt(0)}${suffix}`;
  requestAnimationFrame(tick);
}

export function ScrollReveal() {
  const pathname = usePathname();
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return undefined;
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) { en.target.setAttribute('data-aos-in', ''); io.unobserve(en.target); } // an attribute, not a class: React rewrites className on re-render
    }), { rootMargin: '0px 0px -60px 0px' });
    // Elements this effect run is watching. Tracked here rather than via data-aos, because during a page
    // change the previous run can tag new-page elements just before it is torn down; those must still be watched.
    const watched = new WeakSet();
    const apply = () => {
      for (const [selector, effect, base, step = 0, cycle = 0] of REVEAL_RULES) {
        document.querySelectorAll(selector).forEach((el) => {
          if (watched.has(el) || el.hasAttribute('data-aos-in') || el.closest('.marquee')) return;
          watched.add(el);
          let delay = base;
          if (step) {
            const siblings = [...el.parentElement.children].filter((c) => c.matches(selector));
            const i = siblings.indexOf(el);
            delay += (cycle ? i % cycle : i) * step;
          }
          el.dataset.aos = effect;
          el.style.setProperty('--aos-delay', `${delay}ms`);
          io.observe(el);
        });
      }
    };
    apply();
    tintButtons();
    const counter = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) { counter.unobserve(en.target); en.target.dataset.counted = 'done'; countUp(en.target); }
    }), { threshold: 0.6 });
    const countWatched = new WeakSet();
    const watchCounts = () => document.querySelectorAll(COUNT_SELECTOR).forEach((el) => {
      if (el.dataset.counted === 'done' || countWatched.has(el)) return;
      countWatched.add(el); counter.observe(el);
    });
    watchCounts();
    // Re-scan when client components add content (filters, pagination, search results).
    const mo = new MutationObserver(() => { apply(); watchCounts(); tintButtons(); });
    mo.observe(document.querySelector('main') ?? document.body, { childList: true, subtree: true });
    return () => { io.disconnect(); mo.disconnect(); counter.disconnect(); };
  }, [pathname]);
  return null;
}

