'use client';
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUpRight, ChevronDown, Menu, X, Plus, Minus, Mail, Phone } from 'lucide-react';
import { ALL_PAGES, NAV, club, clubEmail, officers, initials } from '../data/club';

const TONES = ['#fcece5', '#e5f9eb', '#fef5d3', '#ece9f9', '#e3f0fb', '#f9e4ea'];

/**
 * Image with a graceful fallback: until the file exists in /public, a soft coloured tile
 * with initials or a label is shown instead of a broken image.
 */
export function Photo({ src, alt = '', label, className = '', tone = 0, priority = false }) {
  const [failed, setFailed] = useState(!src);
  const ref = useRef(null);
  // An image that 404s before hydration never fires onError in React, so check once mounted.
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, []);
  if (failed) {
    return (
      <div className={`photo-fallback ${className}`} style={{ background: TONES[tone % TONES.length] }} role="img" aria-label={alt}>
        <span>{label ?? initials(alt || club.shortName)}</span>
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img ref={ref} src={src} alt={alt} className={className} loading={priority ? 'eager' : 'lazy'} onError={() => setFailed(true)} />;
}

export function Btn({ href = '/join', children, kind = 'dark', className = '', external = false }) {
  const inner = (<>{children}<span className="btn-arrow"><ArrowUpRight size={18} /></span></>);
  if (external || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('http')) {
    return <a href={href} className={`btn btn-${kind} ${className}`} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">{inner}</a>;
  }
  return <Link href={href} className={`btn btn-${kind} ${className}`}>{inner}</Link>;
}

export function Eyebrow({ children }) {
  return <span className="eyebrow"><span className="eyebrow-dot" />{children}</span>;
}

export function Intro({ label, title, description, center = false }) {
  return (
    <div className={`section-intro ${center ? 'center' : ''}`}>
      <Eyebrow>{label}</Eyebrow>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
    </div>
  );
}

export function Section({ children, gray = false, id, extra = '' }) {
  return <section id={id} className={`section ${gray ? 'section-light' : ''} ${extra}`}><div className="container">{children}</div></section>;
}

export function PageHero({ eyebrow, title, desc, children }) {
  return (
    <section className="page-hero">
      <div className="container">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1>{title}</h1>
        {desc && <p>{desc}</p>}
        {children}
      </div>
      <div className="float-blob blob-one" /><div className="float-blob blob-two" />
    </section>
  );
}

export function Logo({ light = false }) {
  return (
    <Link href="/" className={`logo ${light ? 'logo-light' : ''}`} aria-label={`${club.name} home`}>
      <span className="logo-wheel" aria-hidden="true"><i /><i /><i /><i /><i /><i /></span>
      <span className="logo-text">Rotaract<small>Khopoli</small></span>
    </Link>
  );
}

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [pagesOpen, setPagesOpen] = useState(false);
  useEffect(() => { setOpen(false); setPagesOpen(false); }, [pathname]);
  const isCurrent = (href) => (href === '/' ? pathname === '/' : pathname.startsWith(href));
  return (
    <header className="site-header">
      <a className="skip-link" href="#main">Skip to content</a>
      <div className="container nav-wrap">
        <Logo />
        <button className="mobile-toggle" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
        <nav className={`nav ${open ? 'nav-mobile-open' : ''}`} aria-label="Main">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className={`nav-link ${isCurrent(item.href) ? 'is-current' : ''}`} aria-current={pathname === item.href ? 'page' : undefined}>
              {item.label}
            </Link>
          ))}
          <div className="pages-wrap">
            <button type="button" className={`nav-pill pages-toggle ${pagesOpen ? 'active' : ''}`} aria-expanded={pagesOpen} onClick={() => setPagesOpen(!pagesOpen)}>
              All Pages <ChevronDown size={16} />
            </button>
            {pagesOpen && <button className="dropdown-backdrop" aria-label="Close pages menu" onClick={() => setPagesOpen(false)} />}
            {pagesOpen && (
              <div className="pages-dropdown">
                {ALL_PAGES.map(([label, href]) => (
                  <Link key={href} href={href} aria-current={pathname === href ? 'page' : undefined}>{label}<ArrowUpRight size={14} /></Link>
                ))}
              </div>
            )}
          </div>
          <Link href="/join" className={`nav-donate ${isCurrent('/join') ? 'is-current' : ''}`}>Join the Club <ArrowUpRight size={16} /></Link>
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  const president = officers[0];
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <Logo light />
            <p>{club.tagline}</p>
            <p className="footer-meta">Club ID {club.clubId} · Chartered {club.charteredOn} · {club.district}</p>
            <a className="footer-mail" href={`mailto:${clubEmail}`}><Mail size={16} /> {clubEmail}</a>
          </div>
          <FooterCol title="The Club" items={[['About us', '/about'], ['Avenues', '/avenues'], ['Members', '/members'], ['Events', '/events']]} />
          <FooterCol title="Get Involved" items={[['Join the club', '/join'], ['Sponsorship', '/sponsorship'], ['FAQs', '/faqs'], ['Contact', '/contact']]} />
          <div className="footer-links">
            <h4>Reach the Board</h4>
            {officers.map((o) => (
              <div key={o.role} className="footer-officer">
                <small>{o.role}</small>
                <span>{o.name}</span>
              </div>
            ))}
            <a href={`tel:+91${president.phone}`}><Phone size={14} /> +91 {president.phone}</a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} {club.name}. A Rotaract club under Rotary International. Views are the club&apos;s own.</span>
          <div className="social">
            <a href={`mailto:${clubEmail}`} aria-label="Email"><Mail size={17} /></a>
            <a href={`tel:+91${president.phone}`} aria-label="Phone"><Phone size={17} /></a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, items }) {
  return (
    <div className="footer-links">
      <h4>{title}</h4>
      {items.map(([n, h]) => <Link href={h} key={h}>{n}</Link>)}
    </div>
  );
}

export function FaqList({ items }) {
  const [expanded, setExpanded] = useState(0);
  return (
    <div className="faq-items">
      {items.map((f, i) => (
        <div className={`faq-item ${expanded === i ? 'is-open' : ''}`} key={f.q}>
          <button type="button" aria-expanded={expanded === i} onClick={() => setExpanded(expanded === i ? -1 : i)}>
            <span>{f.q}</span>{expanded === i ? <Minus size={19} /> : <Plus size={19} />}
          </button>
          {expanded === i && <div className="faq-answer"><p>{f.a}</p></div>}
        </div>
      ))}
    </div>
  );
}

/**
 * A form that opens the visitor's email app with the message addressed to the club.
 * fields: [{ name, label, type?, placeholder?, required?, options?, rows? }]
 */
export function MailForm({ title, intro, subject, fields, submitLabel = 'Send message' }) {
  const [sent, setSent] = useState(false);
  function onSubmit(e) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const lines = fields.map((f) => `${f.label}: ${String(data.get(f.name) ?? '').trim()}`);
    const who = String(data.get('name') ?? '').trim();
    const href = `mailto:${clubEmail}?subject=${encodeURIComponent(`${subject}${who ? ` from ${who}` : ''}`)}&body=${encodeURIComponent(lines.join('\n\n'))}`;
    setSent(true);
    window.location.href = href;
  }
  return (
    <div className="form-card">
      <h2>{title}</h2>
      {intro && <p>{intro}</p>}
      <form onSubmit={onSubmit}>
        {fields.map((f) => (
          <label key={f.name}>
            {f.label}{!f.required && <span className="optional"> (optional)</span>}
            {f.options ? (
              <select name={f.name} defaultValue={f.options[0]} required={f.required}>
                {f.options.map((o) => <option key={o}>{o}</option>)}
              </select>
            ) : f.rows ? (
              <textarea name={f.name} rows={f.rows} placeholder={f.placeholder} required={f.required} minLength={f.minLength} />
            ) : (
              <input name={f.name} type={f.type ?? 'text'} placeholder={f.placeholder} required={f.required} pattern={f.pattern} title={f.title} />
            )}
          </label>
        ))}
        <button type="submit" className="submit-btn">{submitLabel} <ArrowUpRight size={18} /></button>
        {sent && <small className="notice">Your email app should open with the message ready to send to {clubEmail}. If it did not, write to that address directly.</small>}
      </form>
    </div>
  );
}

/** Fades sections in as they scroll into view (respects reduced-motion via CSS). */
export function ScrollReveal() {
  const pathname = usePathname();
  useEffect(() => {
    const els = document.querySelectorAll('.section .container > *');
    els.forEach((el) => el.classList.add('enter-on-scroll'));
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('has-entered'); io.unobserve(en.target); }
    }), { rootMargin: '0px 0px -60px 0px' });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pathname]);
  return null;
}
