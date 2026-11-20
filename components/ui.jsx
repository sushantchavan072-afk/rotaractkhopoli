'use client';
import React, { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowRight, ArrowUpRight, ChevronDown, Menu, X, Plus, Minus, Mail, Phone, Heart, Search,
  CalendarPlus, Share2, Check, Instagram, Facebook, Linkedin, Youtube, MapPin,
} from 'lucide-react';
import {
  ALL_PAGES, NAV, club, clubEmail, contact, officers, initials, FORM_ENDPOINT, FAMILY_LOGOS,
  formatDate, isPast,
} from '../data/club';

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
  const inner = (<>{children}{icon && <span className="btn-arrow" aria-hidden="true"><ArrowUpRight size={18} /></span>}</>);
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

export function PageHero({ eyebrow, title, desc, children, image, logo }) {
  return (
    <section className={`page-hero ${image || logo ? 'has-image' : ''}`}>
      <div className="container page-hero-inner">
        <div className="page-hero-copy">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1>{title}</h1>
          {desc && <p>{desc}</p>}
          {children}
        </div>
        {image && <div className="page-hero-photo"><Photo src={image} alt="" label={title} priority sizes="(max-width: 900px) 100vw, 40vw" /></div>}
        {logo && <div className="page-hero-logo"><Image src={logo.src} alt={logo.alt} width={logo.w} height={logo.h} priority sizes="(max-width: 900px) 80vw, 420px" /></div>}
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


/** Strip of District 3131 family logos (Rotaract, Rotary, Interact). */
export function FamilyLogos({ title = 'Proudly part of the Rotary family in District 3131' }) {
  return (
    <div className="family-logos">
      <span>{title}</span>
      <ul>
        {FAMILY_LOGOS.map((l) => {
          const img = <Image src={l.src} alt={l.alt} width={l.w} height={l.h} sizes="200px" />;
          return <li key={l.src}>{l.href ? <Link href={l.href}>{img}</Link> : img}</li>;
        })}
      </ul>
    </div>
  );
}

/* ---------------------------------------------------------------- Header / footer */

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [pagesOpen, setPagesOpen] = useState(false);
  // Close menus whenever the page changes (adjusting state during render, as React recommends).
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) { setLastPath(pathname); setOpen(false); setPagesOpen(false); }
  useEffect(() => {
    if (!pagesOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setPagesOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pagesOpen]);
  const isCurrent = (href) => (href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`));
  return (
    <header className="site-header">
      <a className="skip-link" href="#main">Skip to content</a>
      <div className="announce-bar">
        <div className="container">
          <span><Heart size={14} fill="currentColor" aria-hidden="true" /> Membership for the new Rotaract year is open to everyone 18+ in and around Khopoli.</span>
          <Link href="/join">Apply Now <ArrowUpRight size={14} aria-hidden="true" /></Link>
        </div>
      </div>
      <div className="container nav-wrap">
        <Logo />
        <button className="menu-toggle" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} aria-controls="main-nav" onClick={() => setOpen(!open)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
        <nav id="main-nav" className={`nav ${open ? 'is-open' : ''}`} aria-label="Main">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className={`nav-link ${isCurrent(item.href) ? 'is-current' : ''}`} aria-current={isCurrent(item.href) ? 'page' : undefined}>
              {item.label}
            </Link>
          ))}
          <div className="pages-wrap">
            <button type="button" className={`nav-link pages-toggle ${pagesOpen ? 'is-open' : ''}`} aria-expanded={pagesOpen} aria-controls="pages-menu" onClick={() => setPagesOpen(!pagesOpen)}>
              More <ChevronDown size={16} aria-hidden="true" />
            </button>
            {pagesOpen && <button className="dropdown-backdrop" tabIndex={-1} aria-hidden="true" onClick={() => setPagesOpen(false)} />}
            {pagesOpen && (
              <div className="pages-menu" id="pages-menu">
                {ALL_PAGES.map(([label, href]) => (
                  <Link key={href} href={href} aria-current={pathname === href ? 'page' : undefined}>{label}</Link>
                ))}
              </div>
            )}
          </div>
          <div className="nav-actions">
            <Link href="/sponsorship" className="nav-support"><Heart size={15} aria-hidden="true" /> Support Us</Link>
            <Link href="/join" className="nav-donate">Join the Club <ArrowUpRight size={16} aria-hidden="true" /></Link>
          </div>
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
            <Logo light />
            <p>{club.tagline}</p>
            <SubscribeForm />
          </div>
          <FooterCol title="The Club" items={[['About us', '/about'], ['Avenues', '/avenues'], ['Events', '/events'], ['Gallery', '/gallery'], ['Members', '/members']]} />
          <FooterCol title="Get Involved" items={[['Join the club', '/join'], ['Sponsor a project', '/sponsorship'], ['Board application', '/bod-application'], ['FAQs', '/faqs']]} />
          <div className="footer-col">
            <h2 className="footer-heading">Reach Us</h2>
            <a href={`mailto:${clubEmail}`}><Mail size={15} aria-hidden="true" /> {clubEmail}</a>
            <a href={contact.mapUrl} target="_blank" rel="noreferrer"><MapPin size={15} aria-hidden="true" /> {contact.meetingPlace}</a>
            <Link href="/contact">Contact page</Link>
            <SocialLinks />
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} {club.name} · Club ID {club.clubId} · {club.district}</span>
          <span><Link href="/privacy-policy">Privacy policy</Link> · A Rotaract club under Rotary International.</span>
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
        <label className="sr-only" htmlFor="footer-email">Email address for project updates</label>
        <input id="footer-email" name="email" type="email" placeholder="Your email for project updates" required autoComplete="email" />
        <button type="submit">Stay in the Loop</button>
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

/* ---------------------------------------------------------------- FAQs */

export function FaqList({ items, firstOpen = true }) {
  const [expanded, setExpanded] = useState(firstOpen ? 0 : -1);
  return (
    <div className="faq-items">
      {items.map((f, i) => {
        const open = expanded === i;
        const id = `faq-${f.q.replace(/\W+/g, '-').toLowerCase()}`;
        return (
          <div className={`faq-item ${open ? 'is-open' : ''}`} key={f.q}>
            <h3>
              <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setExpanded(open ? -1 : i)}>
                <span>{f.q}</span>{open ? <Minus size={19} aria-hidden="true" /> : <Plus size={19} aria-hidden="true" />}
              </button>
            </h3>
            <div id={id} className="faq-answer" hidden={!open}><p>{f.a}</p></div>
          </div>
        );
      })}
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
        <H><Link href={`/events/${e.slug}`}>{e.title}</Link></H>
        <p>{e.summary}</p>
        <dl className="event-card-facts">
          <div><dt>Date</dt><dd>{formatDate(e.date)}</dd></div>
          <div><dt>Venue</dt><dd>{e.venue}</dd></div>
        </dl>
        <span className="inline-arrow" aria-hidden="true">View Event <ArrowUpRight size={18} /></span>
      </div>
    </article>
  );
}

export function EventsExplorer({ events }) {
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
            <button key={k} type="button" aria-pressed={when === k} className={when === k ? 'is-active' : ''} onClick={() => setWhen(k)}>{l}</button>
          ))}
        </div>
        <label className="sr-only" htmlFor="avenue-filter">Filter by avenue</label>
        <select id="avenue-filter" value={avenue} onChange={(e) => setAvenue(e.target.value)}>
          {avenueNames.map((a) => <option key={a}>{a}</option>)}
        </select>
      </div>
      <p className="sr-only" role="status" aria-live="polite">{list.length} events shown</p>
      {list.length ? (
        <div className="card-grid">{list.map((e, i) => <EventCard e={e} i={i} key={e.slug} headingLevel={2} />)}</div>
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
    const [startT, endT] = event.time.split(/\s*-\s*/).map(to24);
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

/** Fades content in as it scrolls into view. Content stays visible without JS or with reduced motion. */
export function ScrollReveal() {
  const pathname = usePathname();
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return undefined;
    const els = [...document.querySelectorAll('.section .container > *')].filter((el) => el.getBoundingClientRect().top > window.innerHeight);
    els.forEach((el) => el.classList.add('reveal'));
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
    }), { rootMargin: '0px 0px -40px 0px' });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pathname]);
  return null;
}

