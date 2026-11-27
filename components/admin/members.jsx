'use client';

import { useState } from 'react';
import { FaCakeCandles, FaChevronLeft, FaEnvelope, FaPhone, FaPlus, FaTrashCan, FaUsers, FaWhatsapp } from 'react-icons/fa6';
import { PillSelect, Segmented } from '../ui';
import { Badge, Empty, Field, SectionHead, niceDate, plural, tag, todayIso } from './shared';
import { LISTS } from './team';

/**
 * Members: the club's private member register (kept encrypted with the finance sheet), with birthdays, the
 * dues tracker and the inbox of join requests from the website.
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY = 86400000;
const utc = (iso) => Date.parse(`${iso}T00:00:00Z`);
const daysBetween = (a, b) => Math.round((utc(b) - utc(a)) / DAY);
const firstName = (name) => String(name).replace(/^Rtr\.?\s*/i, '').split(/\s+/)[0] || name;
const digits = (phone) => String(phone ?? '').replace(/\D/g, '').replace(/^(91|0)(?=\d{10}$)/, '');
/** A WhatsApp chat with a message ready to send (Indian mobile numbers). */
export const whatsapp = (phone, text) => (digits(phone).length === 10 ? `https://wa.me/91${digits(phone)}?text=${encodeURIComponent(text)}` : '');
const sameName = (a, b) => String(a).replace(/^Rtr\.?\s*/i, '').trim().toLowerCase() === String(b).replace(/^Rtr\.?\s*/i, '').trim().toLowerCase();

export const blankMember = (patch = {}) => ({ id: `m-${tag()}${tag()}`, name: '', ...patch });

/* ---------------- Birthdays ---------------- */

/** Days until someone's next birthday (0 = today), or null without a birthday. */
export function daysToBirthday(m, today = todayIso()) {
  if (!m.birthday) return null;
  const [, mm, dd] = m.birthday.split('-');
  const y = Number(today.slice(0, 4));
  // 29 February birthdays fall on 28 February in other years.
  const on = (year) => { const d = `${year}-${mm}-${dd}`; return Number.isNaN(utc(d)) || new Date(utc(d)).getUTCMonth() + 1 !== Number(mm) ? `${year}-${mm}-28` : d; };
  const next = on(y) >= today ? on(y) : on(y + 1);
  return daysBetween(today, next);
}
export const birthdayLabel = (iso) => { const [, m, d] = iso.split('-').map(Number); return `${d} ${MONTHS[m - 1]}`; };
const whenLabel = (n) => (n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : `In ${n} days`);
export function upcomingBirthdays(members, within = 7, today = todayIso()) {
  return members.filter((m) => !m.left).map((m) => ({ m, days: daysToBirthday(m, today) })).filter((x) => x.days !== null && x.days <= within).sort((a, b) => a.days - b.days);
}
const wishText = (m) => `Happy birthday, ${firstName(m.name)}! 🎉 Wishing you a wonderful year ahead. From all of us at the Rotaract Club of Khopoli.`;

/* ---------------- Dues ---------------- */

/** Dues for a Rotaract year: who paid what, who is due, and income entries that look like dues not yet linked. */
export function duesFor(finance, year, rotaractYearOf) {
  const d = finance.dues?.[year] ?? { fee: 0, paid: {} };
  const fee = Number(d.fee) || 0;
  const byId = new Map(finance.entries.map((e) => [e.id, e]));
  const linked = new Set(Object.values(d.paid ?? {}).flat());
  const active = (finance.members ?? []).filter((m) => !m.left);
  const rows = active.map((m) => {
    const entries = (d.paid?.[m.id] ?? []).map((id) => byId.get(id)).filter(Boolean);
    const paid = entries.reduce((n, e) => n + (Number(e.amount) || 0), 0);
    // An income entry under "Membership dues" from this person that isn't linked yet: probably their dues.
    const guess = paid >= fee && fee ? null : finance.entries.find((e) => e.type === 'income' && e.category === 'Membership dues' && !linked.has(e.id) && e.date && rotaractYearOf(e.date) === year && e.party && sameName(e.party, m.name));
    const state = fee && paid >= fee ? 'paid' : paid > 0 ? 'part' : 'due';
    return { m, entries, paid, state, owed: Math.max(0, fee - paid), guess };
  });
  const pending = rows.filter((r) => r.state !== 'paid');
  return { fee, rows, pending, collected: rows.reduce((n, r) => n + r.paid, 0), owed: fee ? pending.reduce((n, r) => n + r.owed, 0) : 0 };
}
const duesText = (m, owed, year) => `Hi ${firstName(m.name)}, a gentle reminder that your Rotaract Club of Khopoli membership dues for ${year} (₹${owed.toLocaleString('en-IN')}) are pending. You can pay the Treasurer by UPI or cash. Thank you!`;

/* ---------------- Member editor ---------------- */

function MemberEditor({ member, onChange, onDelete, onClose }) {
  const set = (patch) => onChange({ ...member, ...patch });
  return (
    <div className="adm-editor">
      <div className="adm-editor-top">
        <button type="button" className="adm-back" onClick={onClose}><FaChevronLeft size={12} aria-hidden="true" /> All members</button>
      </div>
      <h2 className="adm-editor-title">{member.name || 'New member'}</h2>
      <section className="adm-card">
        <div className="adm-grid">
          <Field label="Name" wide>{(id) => <input id={id} value={member.name} maxLength={80} placeholder="For example: Rtr. Priya Patil" onChange={(e) => set({ name: e.target.value })} />}</Field>
          <Field label="Phone (optional)">{(id) => <input id={id} type="tel" inputMode="tel" value={member.phone ?? ''} maxLength={20} placeholder="10-digit mobile number" onChange={(e) => set({ phone: e.target.value || undefined })} />}</Field>
          <Field label="Email (optional)">{(id) => <input id={id} type="email" value={member.email ?? ''} maxLength={120} onChange={(e) => set({ email: e.target.value || undefined })} />}</Field>
          <Field label="Birthday (optional)" hint="Only the day and month are used.">{(id) => <input id={id} type="date" value={member.birthday ?? ''} onChange={(e) => set({ birthday: e.target.value || undefined })} />}</Field>
          <Field label="Member since (optional)">{(id) => <input id={id} type="date" value={member.since ?? ''} onChange={(e) => set({ since: e.target.value || undefined })} />}</Field>
          <label className="adm-check is-wide"><input type="checkbox" checked={Boolean(member.left)} onChange={(e) => set({ left: e.target.checked || undefined })} /> Has left the club (kept for the records, not asked for dues)</label>
        </div>
      </section>
      <div className="adm-editor-foot">
        <button type="button" className="adm-btn" onClick={onClose}>Done</button>
        <button type="button" className="adm-link is-danger" onClick={onDelete}><FaTrashCan size={12} aria-hidden="true" /> Delete this member</button>
      </div>
    </div>
  );
}

/* ---------------- The three pages ---------------- */

function MemberList({ finance, update, team, year, rotaractYearOf, rupees, onEdit }) {
  const [query, setQuery] = useState('');
  const members = finance.members ?? [];
  const today = todayIso();
  const soon = upcomingBirthdays(members, 30, today).slice(0, 6);
  const dues = duesFor(finance, year, rotaractYearOf);
  const duesOf = new Map(dues.rows.map((r) => [r.m.id, r]));
  const teamNames = [...new Set(LISTS.flatMap(([k]) => team[k].map((p) => p.name)).filter(Boolean))];
  const missing = teamNames.filter((n) => !members.some((m) => sameName(m.name, n)));
  const importTeam = () => {
    const contact = (n) => team.officers?.find((o) => sameName(o.name, n));
    update((f) => ({ ...f, members: [...(f.members ?? []), ...missing.map((name) => blankMember({ name, ...(contact(name)?.phone ? { phone: contact(name).phone } : {}), ...(contact(name)?.email ? { email: contact(name).email } : {}) }))] }));
  };
  const add = () => { const m = blankMember(); update((f) => ({ ...f, members: [m, ...(f.members ?? [])] })); onEdit(m.id); };
  const shown = members
    .filter((m) => !query || `${m.name} ${m.phone ?? ''} ${m.email ?? ''}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => Boolean(a.left) - Boolean(b.left) || a.name.replace(/^Rtr\.?\s*/i, '').localeCompare(b.name.replace(/^Rtr\.?\s*/i, '')));

  return (
    <>
      {soon.length > 0 && (
        <section className="adm-card adm-bdays">
          <h3><FaCakeCandles size={14} aria-hidden="true" /> Birthdays coming up</h3>
          <ul>
            {soon.map(({ m, days }) => (
              <li key={m.id} className={days === 0 ? 'is-today' : ''}>
                <strong>{m.name.replace(/^Rtr\.?\s*/i, '')}</strong>
                <span>{whenLabel(days)} · {birthdayLabel(m.birthday)}</span>
                {days <= 1 && whatsapp(m.phone, wishText(m)) && <a className="adm-link" href={whatsapp(m.phone, wishText(m))} target="_blank" rel="noreferrer"><FaWhatsapp size={12} aria-hidden="true" /> Wish</a>}
              </li>
            ))}
          </ul>
        </section>
      )}
      <div className="adm-toolbar">
        <input className="adm-search" type="search" placeholder="Search name, phone or email" aria-label="Search members" value={query} onChange={(e) => setQuery(e.target.value)} />
        <span className="adm-toolbar-actions">
          {missing.length > 0 && <button type="button" className="adm-btn is-ghost is-small" onClick={importTeam}><FaUsers size={12} aria-hidden="true" /> Add {plural(missing.length, 'person', 'people')} from the Team page</button>}
          <button type="button" className="adm-btn is-small" onClick={add}><FaPlus size={11} aria-hidden="true" /> Add a member</button>
        </span>
      </div>
      {!members.length && <Empty title="No members yet.">Add the team from the Team page in one go, then add phone numbers and birthdays.</Empty>}
      <ul className="adm-list">
        {shown.map((m) => {
          const d = duesOf.get(m.id);
          const bday = daysToBirthday(m, today);
          return (
            <li key={m.id}>
              <button type="button" className={`adm-row adm-member${m.left ? ' is-left' : ''}`} onClick={() => onEdit(m.id)}>
                <span className="adm-row-text">
                  <strong>{m.name || 'No name yet'}</strong>
                  <span>{[m.phone, m.birthday && `Birthday ${birthdayLabel(m.birthday)}${bday !== null && bday <= 7 ? ` (${whenLabel(bday).toLowerCase()})` : ''}`, m.left && 'Has left'].filter(Boolean).join(' · ') || 'Tap to add phone and birthday'}</span>
                </span>
                {!m.left && d && dues.fee > 0 && (
                  <Badge tone={d.state === 'paid' ? 'green' : d.state === 'part' ? 'amber' : 'red'}>{d.state === 'paid' ? 'Dues paid' : `${rupees(d.owed)} due`}</Badge>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function Dues({ finance, update, year, years, setYear, rotaractYearOf, rupees }) {
  const { fee, rows, pending, collected, owed } = duesFor(finance, year, rotaractYearOf);
  const guesses = rows.filter((r) => r.guess);
  const setDues = (fn) => update((f) => { const cur = f.dues?.[year] ?? { fee: 0, paid: {} }; return { ...f, dues: { ...(f.dues ?? {}), [year]: fn(cur) } }; });
  const link = (pairs) => setDues((d) => { const paid = { ...d.paid }; for (const [mid, eid] of pairs) paid[mid] = [...(paid[mid] ?? []), eid]; return { ...d, paid }; });
  // Marking paid adds the money to the finance sheet as income, linked to the member.
  const markPaid = (r) => {
    const entry = { id: `${todayIso().replaceAll('-', '')}-${tag()}`, date: todayIso(), type: 'income', amount: r.owed || fee, category: 'Membership dues', description: `Membership dues ${year}`, party: r.m.name, mode: 'UPI' };
    update((f) => {
      const cur = f.dues?.[year] ?? { fee: 0, paid: {} };
      return { ...f, entries: [entry, ...f.entries], dues: { ...(f.dues ?? {}), [year]: { ...cur, paid: { ...cur.paid, [r.m.id]: [...(cur.paid?.[r.m.id] ?? []), entry.id] } } } };
    });
  };
  const undo = (r) => {
    if (!window.confirm(`Mark ${r.m.name}'s dues as not paid? The matching income entr${r.entries.length > 1 ? 'ies are' : 'y is'} removed from the finance sheet.`)) return;
    const gone = new Set(r.entries.map((e) => e.id));
    update((f) => {
      const cur = f.dues?.[year] ?? { fee: 0, paid: {} };
      const paid = { ...cur.paid }; delete paid[r.m.id];
      return { ...f, entries: f.entries.filter((e) => !gone.has(e.id)), dues: { ...(f.dues ?? {}), [year]: { ...cur, paid } } };
    });
  };
  const copyList = async () => {
    const text = `Membership dues ${year} still pending:\n${pending.map((r) => `• ${r.m.name} – ₹${r.owed.toLocaleString('en-IN')}`).join('\n')}`;
    try { await navigator.clipboard.writeText(text); window.alert('Copied. Paste it in the club WhatsApp group or send it to the Treasurer.'); } catch { window.prompt('Copy this list:', text); }
  };
  if (!(finance.members ?? []).some((m) => !m.left)) return <Empty title="Add members first.">The dues tracker lists everyone on the Members page.</Empty>;
  return (
    <>
      <div className="adm-toolbar">
        <div className="adm-year"><span className="adm-label">Rotaract year</span><PillSelect options={years} value={year} ariaLabel="Rotaract year" onChange={setYear} /></div>
        <label className="adm-dues-fee">Dues per member <span className="adm-brow-amount"><span aria-hidden="true">₹</span><input inputMode="decimal" aria-label={`Dues per member for ${year}`} placeholder="0" value={fee || ''} onChange={(e) => setDues((d) => ({ ...d, fee: e.target.value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1') }))} /></span></label>
      </div>
      <div className="adm-stats adm-money adm-budget-stats">
        <div className="adm-stat is-static"><span className="adm-stat-label">Collected</span><strong className={collected ? 'is-in' : ''}>{rupees(collected)}</strong><span className="adm-stat-sub">{rows.length - pending.length} of {rows.length} paid</span></div>
        <div className="adm-stat is-static"><span className="adm-stat-label">Still to come</span><strong className={owed ? 'is-out' : ''}>{rupees(owed)}</strong><span className="adm-stat-sub">{plural(pending.length, 'member')}</span></div>
        <div className="adm-stat is-static"><span className="adm-stat-label">Paid</span><strong>{rows.length ? Math.round(((rows.length - pending.length) / rows.length) * 100) : 0}%</strong><span className="adm-stat-sub">of active members</span></div>
      </div>
      {!fee && <p className="adm-notice">Type the dues per member for {year} above to start tracking.</p>}
      {guesses.length > 0 && (
        <p className="adm-notice is-soft">
          {plural(guesses.length, 'income entry', 'income entries')} under “Membership dues” look{guesses.length === 1 ? 's' : ''} like {guesses.length === 1 ? 'a payment' : 'payments'} from {guesses.map((r) => r.m.name.replace(/^Rtr\.?\s*/i, '')).join(', ')}.{' '}
          <button type="button" className="adm-link" onClick={() => link(guesses.map((r) => [r.m.id, r.guess.id]))}>Count {guesses.length === 1 ? 'it' : 'them'} as dues</button>
        </p>
      )}
      {fee > 0 && (
        <section className="adm-card">
          <div className="adm-budget-head">
            <h3>Members</h3>
            {pending.length > 0 && <button type="button" className="adm-link" onClick={copyList}>Copy the pending list</button>}
          </div>
          <ul className="adm-dues">
            {[...rows].sort((a, b) => ({ due: 0, part: 1, paid: 2 }[a.state] - { due: 0, part: 1, paid: 2 }[b.state]) || a.m.name.localeCompare(b.m.name)).map((r) => (
              <li key={r.m.id} className={`is-${r.state}`}>
                <span className="adm-dues-who">
                  <strong>{r.m.name}</strong>
                  <span>{r.state === 'paid' ? `Paid ${rupees(r.paid)}${r.entries[0] ? ` · ${niceDate(r.entries.at(-1).date)}` : ''}` : r.state === 'part' ? `Paid ${rupees(r.paid)} of ${rupees(fee)}` : `${rupees(fee)} due`}</span>
                </span>
                <span className="adm-dues-actions">
                  {r.state !== 'paid' && whatsapp(r.m.phone, duesText(r.m, r.owed, year)) && <a className="adm-icon" href={whatsapp(r.m.phone, duesText(r.m, r.owed, year))} target="_blank" rel="noreferrer" aria-label={`Remind ${r.m.name} on WhatsApp`} title="Remind on WhatsApp"><FaWhatsapp size={14} /></a>}
                  {r.state !== 'paid' && <button type="button" className="adm-btn is-small" onClick={() => markPaid(r)}>{r.state === 'part' ? `Paid the rest (${rupees(r.owed)})` : 'Mark paid'}</button>}
                  {r.entries.length > 0 && <button type="button" className="adm-link" onClick={() => undo(r)}>Undo</button>}
                </span>
              </li>
            ))}
          </ul>
          <p className="adm-hint">“Mark paid” adds the payment to Finance as income (Membership dues). Change its date or payment mode there if needed.</p>
        </section>
      )}
    </>
  );
}

const STATUS = { new: ['New', 'blue'], contacted: ['Contacted', 'amber'], joined: ['Joined', 'green'], declined: ['Not joining', 'grey'] };
// The local date a request arrived (it is stored in UTC).
const localDay = (iso) => { const d = new Date(iso); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
export const daysSince = (iso, today) => Math.max(0, daysBetween(localDay(iso), today));
const ago = (iso, today) => { const d = daysSince(iso, today); return d === 0 ? 'Today' : d === 1 ? 'Yesterday' : `${d} days ago`; };

function Requests({ joins, setJoins, members, onJoined, notify, ready, error }) {
  const [show, setShow] = useState('open');
  const [busy, setBusy] = useState(null);
  const today = todayIso();
  const change = async (r, patch, done) => {
    setBusy(r.id);
    try {
      const res = await fetch('/api/admin/joins', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: r.id, ...patch }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not save that change.');
      setJoins(data.requests);
      done?.();
    } catch (err) { notify(err.message); } finally { setBusy(null); }
  };
  if (error) return <p className="adm-notice">Join requests couldn’t be loaded: {error}</p>;
  if (!ready) return <p className="adm-notice">Join requests need saving switched on (GITHUB_TOKEN) and a key (FINANCE_KEY, or the admin password).</p>;
  const isOpen = (r) => r.status === 'new' || r.status === 'contacted';
  const shown = joins.filter((r) => (show === 'open' ? isOpen(r) : show === 'all' ? true : r.status === show));
  const seenBefore = (r) => joins.some((x) => x.id !== r.id && x.at < r.at && ((r.phone && x.phone === r.phone) || (r.email && x.email === r.email)));
  const member = (r) => members.find((m) => (r.phone && digits(m.phone) === r.phone) || (r.email && m.email?.toLowerCase() === r.email) || sameName(m.name, r.name));
  const welcome = (r) => `Hi ${firstName(r.name)}, thank you for applying to join the Rotaract Club of Khopoli! I'm from the club's board. When would be a good time for a quick chat?`;
  return (
    <>
      <div className="adm-toolbar">
        <Segmented label="Show" options={[['open', `Open (${joins.filter(isOpen).length})`], ['joined', 'Joined'], ['declined', 'Not joining'], ['all', 'All']]} value={show} onChange={setShow} />
        <p className="adm-hint">Applications from the website’s Join page. Changes here are saved straight away.</p>
      </div>
      {!shown.length && <Empty title={show === 'open' ? 'No open requests.' : 'Nothing here yet.'}>New applications from the Join page appear here.</Empty>}
      <ul className="adm-requests">
        {shown.map((r) => {
          const waiting = r.status === 'new' && daysSince(r.at, today) >= 3;
          const already = member(r);
          return (
            <li key={r.id} className="adm-card adm-request">
              <div className="adm-request-top">
                <div className="adm-request-who">
                  <strong>{r.name}</strong>
                  <span>{ago(r.at, today)}{r.occupation ? ` · ${r.occupation}` : ''}{r.avenue ? ` · ${r.avenue}` : ''}</span>
                </div>
                <span className="adm-badges">
                  <Badge tone={STATUS[r.status][1]}>{STATUS[r.status][0]}</Badge>
                  {waiting && <Badge tone="red">Waiting {daysSince(r.at, today)} days</Badge>}
                  {seenBefore(r) && <Badge tone="amber">Applied before</Badge>}
                  {already && r.status !== 'joined' && <Badge tone="green">Already a member</Badge>}
                  {!already && r.status === 'joined' && <Badge tone="red">Not on the member list</Badge>}
                </span>
              </div>
              <p className="adm-request-why">{r.why}</p>
              <div className="adm-request-foot">
                <span className="adm-request-contact">
                  <a className="adm-icon" href={`tel:+91${r.phone}`} aria-label={`Call ${r.name}`} title={`Call +91 ${r.phone}`}><FaPhone size={13} /></a>
                  <a className="adm-icon" href={whatsapp(r.phone, welcome(r))} target="_blank" rel="noreferrer" aria-label={`WhatsApp ${r.name}`} title="WhatsApp"><FaWhatsapp size={15} /></a>
                  <a className="adm-icon" href={`mailto:${r.email}?subject=${encodeURIComponent('Joining the Rotaract Club of Khopoli')}`} aria-label={`Email ${r.name}`} title={r.email}><FaEnvelope size={13} /></a>
                </span>
                <span className="adm-request-actions">
                  {r.status === 'new' && <button type="button" className="adm-btn is-ghost is-small" disabled={busy === r.id} onClick={() => change(r, { status: 'contacted' })}>Contacted</button>}
                  {isOpen(r) && <button type="button" className="adm-btn is-small" disabled={busy === r.id} onClick={() => change(r, { status: 'joined' }, () => onJoined(r, already))}>Joined</button>}
                  {isOpen(r) && <button type="button" className="adm-link" disabled={busy === r.id} onClick={() => change(r, { status: 'declined' })}>Not joining</button>}
                  {!already && r.status === 'joined' && <button type="button" className="adm-btn is-small" onClick={() => onJoined(r, null)}>Add to Members</button>}
                  {!isOpen(r) && <button type="button" className="adm-link" disabled={busy === r.id} onClick={() => change(r, { status: 'contacted' })}>Reopen</button>}
                  <button type="button" className="adm-link is-danger" disabled={busy === r.id} onClick={() => { if (window.confirm(`Delete ${r.name}'s request? (For spam or duplicates.)`)) change(r, { remove: true }); }}>Delete</button>
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}

export default function MembersTab({ finance, update, team, joins, setJoins, joinsReady, joinsError, notify, rupees, rotaractYearOf, page, setPage, ready }) {
  const [editing, setEditing] = useState(null);
  const members = finance.members ?? [];
  const thisYear = rotaractYearOf(todayIso());
  const years = [...new Set([thisYear, ...Object.keys(finance.dues ?? {})])].sort().reverse();
  const [year, setYear] = useState(thisYear);
  const current = editing ? members.find((m) => m.id === editing) : null;
  const newCount = joins.filter((r) => r.status === 'new').length;

  if (current) {
    return (
      <MemberEditor
        member={current}
        onChange={(next) => update((f) => ({ ...f, members: f.members.map((m) => (m.id === next.id ? next : m)) }))}
        onDelete={() => { if (window.confirm(`Delete ${current.name || 'this member'}? Their dues records go too (payments stay in Finance).`)) { update((f) => ({ ...f, members: f.members.filter((m) => m.id !== current.id) })); setEditing(null); } }}
        onClose={() => setEditing(null)}
      />
    );
  }
  // "Joined": the person is added to the member list (unless they are on it already).
  const onJoined = (r, already) => {
    if (already) { notify(`${r.name} is already on the member list.`, 'info'); return; }
    update((f) => ({ ...f, members: [blankMember({ name: r.name, phone: r.phone, email: r.email, since: todayIso() }), ...(f.members ?? [])] }));
    notify(`${r.name} was added to Members. Save changes to keep it, then add their birthday.`, 'info');
  };
  return (
    <div className="adm-tab">
      <SectionHead title="Members" desc={`${plural(members.filter((m) => !m.left).length, 'active member')}. Private: stored encrypted, only visible here.`} />
      {!ready && <p className="adm-notice">The member list needs saving switched on (GITHUB_TOKEN) and a key (FINANCE_KEY, or the admin password).</p>}
      <div className="adm-toolbar">
        <Segmented label="Page" options={[['list', 'Members'], ['dues', 'Dues'], ['requests', newCount ? `Join requests (${newCount} new)` : 'Join requests']]} value={page} onChange={setPage} />
      </div>
      {page === 'list' && <MemberList finance={finance} update={update} team={team} year={thisYear} rotaractYearOf={rotaractYearOf} rupees={rupees} onEdit={(id) => { setEditing(id); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />}
      {page === 'dues' && <Dues finance={finance} update={update} year={year} years={years} setYear={setYear} rotaractYearOf={rotaractYearOf} rupees={rupees} />}
      {page === 'requests' && <Requests joins={joins} setJoins={setJoins} members={members} onJoined={onJoined} notify={notify} ready={joinsReady} error={joinsError} />}
    </div>
  );
}
