'use client';

import { useState } from 'react';
import { FaArrowDown, FaArrowUp, FaChevronLeft, FaChevronRight, FaFacebookF, FaInstagram, FaLinkedinIn, FaPlus, FaXmark, FaYoutube } from 'react-icons/fa6';
import { Empty, Field, PhotoButton, SectionHead, Thumb, plural, preparePhoto, slugify, tag } from './shared';

/* ---------------- Gallery ---------------- */

/** A caption that grows with its text, so the whole caption is always visible. */
function Caption({ value, onChange }) {
  const fit = (el) => { if (el) { el.style.height = 'auto'; el.style.height = `${el.scrollHeight}px`; } };
  return (
    <textarea
      ref={fit} aria-label="Caption" placeholder="Add a caption" rows={1} maxLength={160} value={value}
      className={`adm-tile-caption${value.trim() ? '' : ' is-missing'}`}
      onChange={(e) => { fit(e.target); onChange(e.target.value); }}
    />
  );
}

export function GalleryTab({ gallery, photoUrl, update, addUpload, notify }) {
  const [busy, setBusy] = useState(false);
  const move = (i, d) => update((g) => { const next = [...g]; [next[i], next[i + d]] = [next[i + d], next[i]]; return next; });
  const onFiles = async (files) => {
    setBusy(true);
    const added = [];
    try {
      for (const file of files) {
        const p = await preparePhoto(file, { max: 1800 });
        const src = `/images/gallery/${slugify(file.name.replace(/\.[^.]+$/, '')) || 'photo'}-${tag()}.jpg`;
        if (!addUpload(src, p)) break;
        added.push({ src, caption: '' });
      }
    } catch (err) { notify(err.message); } finally {
      if (added.length) update((g) => [...g, ...added]);
      setBusy(false);
    }
  };
  return (
    <div className="adm-tab">
      <SectionHead title="Gallery" desc={`${plural(gallery.length, 'photo')} on the Gallery page. Tap a caption to change it; use the arrows to change the order.`}>
        <PhotoButton label="Add photos" icon={<FaPlus size={12} aria-hidden="true" />} className="adm-btn" busy={busy} multiple onFile={onFiles} />
      </SectionHead>
      {!gallery.length && <Empty title="No photos yet.">Add club photos: projects, meetings, fellowship.</Empty>}
      <ul className="adm-tiles">
        {gallery.map((g, i) => (
          <li key={g.src} className="adm-tile">
            <div className="adm-tile-img">
              <Thumb src={photoUrl(g.src)} alt={g.caption} fallback="Photo" w={640} />
              <button type="button" className="adm-tile-btn adm-tile-remove" aria-label="Remove from the gallery" onClick={() => { if (window.confirm('Remove this photo from the gallery?')) update((list) => list.filter((_, j) => j !== i)); }}><FaXmark size={12} /></button>
              {gallery.length > 1 && (
                <span className="adm-tile-move">
                  <button type="button" className="adm-tile-btn" aria-label="Move earlier" disabled={i === 0} onClick={() => move(i, -1)}><FaChevronLeft size={11} /></button>
                  <button type="button" className="adm-tile-btn" aria-label="Move later" disabled={i === gallery.length - 1} onClick={() => move(i, 1)}><FaChevronRight size={11} /></button>
                </span>
              )}
            </div>
            <Caption value={g.caption} onChange={(v) => update((list) => list.map((x, j) => (j === i ? { ...x, caption: v } : x)))} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------- Reviews ---------------- */

export function ReviewsTab({ reviews, update }) {
  const set = (i, patch) => update((list) => list.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const move = (i, d) => update((list) => { const next = [...list]; [next[i], next[i + d]] = [next[i + d], next[i]]; return next; });
  return (
    <div className="adm-tab">
      <SectionHead title="Reviews" desc="What members, partners and people you've helped say about the club. Shown on the home and Reviews pages.">
        <button type="button" className="adm-btn" onClick={() => update((list) => [...list, { quote: '', name: '', role: '' }])}><FaPlus size={12} aria-hidden="true" /> Add a review</button>
      </SectionHead>
      <p className="adm-notice">Only add real words from real people, and ask them first. Use their name the way they’re happy to be shown.</p>
      {!reviews.length && <Empty title="No reviews yet.">The Reviews section stays hidden on the website until you add one.</Empty>}
      <ul className="adm-reviews">
        {reviews.map((r, i) => (
          <li key={i} className="adm-card adm-review">
            <Field label="What they said" wide>
              {(id) => <textarea id={id} rows={3} maxLength={600} placeholder="“Volunteering with the club taught me…”" value={r.quote} onChange={(e) => set(i, { quote: e.target.value })} />}
            </Field>
            <div className="adm-grid">
              <Field label="Name">{(id) => <input id={id} maxLength={80} placeholder="Full name" value={r.name} onChange={(e) => set(i, { name: e.target.value })} />}</Field>
              <Field label="Who they are (optional)">{(id) => <input id={id} maxLength={120} placeholder="Volunteer, Project Bachpan 2.0" value={r.role ?? ''} onChange={(e) => set(i, { role: e.target.value })} />}</Field>
            </div>
            <div className="adm-shot-tools">
              <button type="button" className="adm-icon" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}><FaArrowUp size={12} /></button>
              <button type="button" className="adm-icon" aria-label="Move down" disabled={i === reviews.length - 1} onClick={() => move(i, 1)}><FaArrowDown size={12} /></button>
              <button type="button" className="adm-icon is-danger" aria-label="Remove this review" onClick={() => { if (!r.quote || window.confirm('Remove this review?')) update((list) => list.filter((_, j) => j !== i)); }}><FaXmark size={13} /></button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------- Club details ---------------- */

const SOCIAL = [
  ['instagram', 'Instagram', FaInstagram, 'https://www.instagram.com/…'],
  ['facebook', 'Facebook', FaFacebookF, 'https://www.facebook.com/…'],
  ['linkedin', 'LinkedIn', FaLinkedinIn, 'https://www.linkedin.com/company/…'],
  ['youtube', 'YouTube', FaYoutube, 'https://www.youtube.com/@…'],
];

export function DetailsTab({ site, update }) {
  const set = (patch) => update((s) => ({ ...s, ...patch }));
  const setSocial = (k, v) => update((s) => ({ ...s, social: { ...s.social, [k]: v } }));
  return (
    <div className="adm-tab">
      <SectionHead title="Club details" desc="How people reach the club: shown in the footer, on the Contact page and in Google results." />
      <section className="adm-card">
        <h3>Club email</h3>
        <Field label="Email address" hint="Messages from the website's forms go here. Leave it empty to use the Secretary's email (Team).">
          {(id) => <input id={id} type="email" inputMode="email" autoComplete="off" maxLength={120} placeholder="rotaractkhopoli@gmail.com" value={site.email} onChange={(e) => set({ email: e.target.value.trim() })} />}
        </Field>
      </section>
      <section className="adm-card">
        <h3>Social media</h3>
        <p className="adm-hint">Paste the full link to each page. Icons appear in the footer and on the Contact page for the ones filled in.</p>
        <div className="adm-socials">
          {SOCIAL.map(([k, label, Icon, ph]) => (
            <label key={k} className="adm-social">
              <span className="adm-social-icon" aria-hidden="true"><Icon size={15} /></span>
              <span className="adm-sr">{label}</span>
              <input type="url" inputMode="url" placeholder={ph} maxLength={300} value={site.social[k]} onChange={(e) => setSocial(k, e.target.value.trim())} />
            </label>
          ))}
        </div>
      </section>
      <section className="adm-card">
        <h3>Where the club meets</h3>
        <div className="adm-grid">
          <Field label="Meeting place" wide>
            {(id) => <input id={id} maxLength={160} value={site.meetingPlace} onChange={(e) => set({ meetingPlace: e.target.value })} />}
          </Field>
          <Field label="Map link (optional)" hint="Opens when someone taps the meeting place." wide>
            {(id) => <input id={id} type="url" inputMode="url" maxLength={500} placeholder="https://maps.google.com/…" value={site.mapUrl} onChange={(e) => set({ mapUrl: e.target.value.trim() })} />}
          </Field>
        </div>
        {site.meetingPlace.trim() && (
          <button type="button" className="adm-link" onClick={() => set({ mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.meetingPlace.trim())}` })}>
            Make a Google Maps link from the meeting place
          </button>
        )}
      </section>
      <section className="adm-card">
        <h3>Contact page</h3>
        <label className="adm-switch">
          <input type="checkbox" role="switch" checked={site.showPresidentPhone} onChange={(e) => set({ showPresidentPhone: e.target.checked })} />
          <span className="adm-switch-track" aria-hidden="true" />
          <span>Show the President’s phone number on the Contact page</span>
        </label>
      </section>
    </div>
  );
}
