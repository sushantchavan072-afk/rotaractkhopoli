'use client';

import { useId, useRef, useState } from 'react';
import { FaCamera } from 'react-icons/fa6';

/* ---------------- Helpers ---------------- */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const slugify = (s) => String(s).normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/^rtr\.?\s+/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60).replace(/-+$/, '');
export const tag = () => Math.random().toString(36).slice(2, 8).replace(/[^a-z0-9]/g, 'x');
export const niceDate = (iso) => { if (!iso) return ''; const [y, m, d] = iso.split('-').map(Number); return `${d} ${MONTHS[m - 1]} ${y}`; };
export const monthLabel = (iso) => { const [y, m] = iso.split('-').map(Number); return `${MONTHS_LONG[m - 1]} ${y}`; };
export const todayIso = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
export const initials = (name) => name.replace(/^Rtr\.?\s*/i, '').split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('') || '?';
export const isCompleted = (e, today = todayIso()) => (e.endDate || e.date) < today;
export const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** "Today, 3:45 pm", "Yesterday, 9:10 am" or "12 Nov 2026". */
export function whenSaved(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const time = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
  const days = Math.round((new Date().setHours(0, 0, 0, 0) - new Date(d).setHours(0, 0, 0, 0)) / 86400000);
  if (days === 0) return `Today, ${time}`;
  if (days === 1) return `Yesterday, ${time}`;
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** Shrinks a chosen photo in the browser and turns it into a JPEG (square for member portraits). */
export async function preparePhoto(file, { max, square = false }) {
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

export async function api(method, url, body) {
  const res = await fetch(url, { method, headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined, cache: 'no-store' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) { const err = new Error(data.error || 'Something went wrong. Please try again.'); err.status = res.status; err.conflict = data.conflict; throw err; }
  return data;
}

/* ---------------- Building blocks ---------------- */

export function SectionHead({ title, desc, children }) {
  return (
    <div className="adm-section-head">
      <div>
        <h2>{title}</h2>
        {desc && <p className="adm-hint">{desc}</p>}
      </div>
      {children && <div className="adm-section-actions">{children}</div>}
    </div>
  );
}

export function Field({ label, hint, children, wide = false }) {
  const id = useId();
  return (
    <div className={`field adm-field${wide ? ' is-wide' : ''}`}>
      <label htmlFor={id}>{label}</label>
      {typeof children === 'function' ? children(id) : children}
      {hint && <small className="adm-hint">{hint}</small>}
    </div>
  );
}

export function Badge({ tone = 'grey', children }) {
  return <span className={`adm-badge is-${tone}`}>{children}</span>;
}

/** A button that opens the photo picker. */
export function PhotoButton({ label, onFile, busy, multiple = false, className = 'adm-btn is-ghost', icon = null, ariaLabel }) {
  const input = useRef(null);
  return (
    <>
      <button type="button" className={className} disabled={busy} aria-label={ariaLabel} onClick={() => input.current?.click()}>
        {icon}{busy ? 'Preparing…' : label}
      </button>
      <input
        ref={input} type="file" accept="image/*" multiple={multiple} hidden
        onChange={(e) => { const files = [...e.target.files]; e.target.value = ''; if (files.length) onFile(multiple ? files : files[0]); }}
      />
    </>
  );
}

/** A photo that can be tapped to change it (member portraits). */
export function PhotoTap({ src, fallback, onFile, busy, label }) {
  const input = useRef(null);
  return (
    <button type="button" className="adm-phototap" aria-label={label} disabled={busy} onClick={() => input.current?.click()}>
      <Thumb src={src} fallback={fallback} round />
      <span className="adm-phototap-cam" aria-hidden="true">{busy ? '…' : <FaCamera size={12} />}</span>
      <input
        ref={input} type="file" accept="image/*" hidden
        onChange={(e) => { const f = e.target.files[0]; e.target.value = ''; if (f) onFile(f); }}
      />
    </button>
  );
}

export function Thumb({ src, alt = '', fallback, round = false, className = '' }) {
  const [broken, setBroken] = useState(null);
  if (!src || broken === src) return <span className={`adm-thumb is-empty${round ? ' is-round' : ''} ${className}`} aria-hidden="true">{fallback}</span>;
  // eslint-disable-next-line @next/next/no-img-element -- previews of photos that may not be published yet
  return <img className={`adm-thumb${round ? ' is-round' : ''} ${className}`} src={src} alt={alt} loading="lazy" onError={() => setBroken(src)} />;
}

export function Empty({ title, children }) {
  return (
    <div className="adm-card adm-empty">
      <strong>{title}</strong>
      {children && <p className="adm-hint">{children}</p>}
    </div>
  );
}
