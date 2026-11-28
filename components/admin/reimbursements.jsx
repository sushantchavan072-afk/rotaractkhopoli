'use client';

import { useState } from 'react';
import { FaChevronLeft, FaPlus, FaTrashCan } from 'react-icons/fa6';
import { DatePicker, PillSelect, Segmented } from '../ui';
import { Badge, Empty, Field, PhotoButton, api, niceDate, plural, preparePhoto, tag, todayIso } from './shared';
import { headForAvenue, headsFor } from './budgets';

/**
 * Reimbursements: money members paid from their own pocket for the club. A claim goes Waiting → Approved →
 * Paid; paying it adds the expense to the finance sheet (taken from the event's avenue budget).
 */

const DAY = 86400000;
const NO_EVENT = 'Not linked to an event';
const NO_AVENUE = 'Not from an avenue budget';
const SOMEONE_ELSE = 'Someone else…';
const STATUS = { pending: ['Waiting', 'amber'], approved: ['Approved', 'blue'], paid: ['Paid', 'green'], rejected: ['Not approved', 'grey'] };
export const owedClaims = (finance) => (finance.claims ?? []).filter((c) => c.status === 'pending' || c.status === 'approved');
const age = (c, today = todayIso()) => Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${c.date}T00:00:00Z`)) / DAY);

export const blankClaim = () => ({ id: `r-${todayIso().replaceAll('-', '')}-${tag()}`, date: todayIso(), person: '', amount: '', description: '', status: 'pending', category: 'Project costs' });

function ClaimEditor({ claim, claims, people, events, heads, categories, onChange, onDelete, onClose }) {
  const set = (patch) => onChange({ ...claim, ...patch });
  const [busy, setBusy] = useState(false);
  const attach = async (file) => {
    setBusy(true);
    try { const { data } = await preparePhoto(file, { max: 1600 }); set({ receipt: (await api('POST', '/api/admin/receipts', { data })).id }); } catch (err) { window.alert(err.message); } finally { setBusy(false); }
  };
  const [other, setOther] = useState(Boolean(claim.person) && !people.includes(claim.person));
  const pickEvent = (title) => {
    const ev = events.find((e) => e.title === title);
    const code = ev ? headForAvenue(ev.avenue) : '';
    set({ event: title || undefined, ...(code && heads.some((h) => h.code === code) ? { avenue: code } : {}) });
  };
  // The same person and amount within ten days: probably claimed twice.
  const twin = claims.find((c) => c.id !== claim.id && c.person && c.person === claim.person && Number(c.amount) === Number(claim.amount) && Math.abs(age(c, claim.date)) <= 10);
  const paid = claim.status === 'paid';
  return (
    <div className="adm-editor">
      <div className="adm-editor-top">
        <button type="button" className="adm-back" onClick={onClose}><FaChevronLeft size={12} aria-hidden="true" /> All reimbursements</button>
      </div>
      <h2 className="adm-editor-title">{claim.description || 'New reimbursement'}</h2>
      {twin && <p className="adm-notice">This looks like a claim already made: {twin.person}, ₹{Number(twin.amount).toLocaleString('en-IN')} on {niceDate(twin.date)} (“{twin.description}”).</p>}
      {paid && <p className="adm-notice is-soft">Already paid, so it is in the finance sheet. Changes here don’t change that entry.</p>}
      <section className="adm-card">
        <div className="adm-grid">
          <Field label="Who paid">
            {people.length && !other
              ? <PillSelect options={['Choose a person', ...people, SOMEONE_ELSE]} value={claim.person || 'Choose a person'} ariaLabel="Who paid" onChange={(v) => { if (v === SOMEONE_ELSE) { setOther(true); set({ person: '' }); } else set({ person: v === 'Choose a person' ? '' : v }); }} />
              : (id) => <input id={id} value={claim.person} maxLength={80} placeholder="Name" onChange={(e) => set({ person: e.target.value })} />}
          </Field>
          <Field label="Amount (₹)">{(id) => <input id={id} className="adm-amount" inputMode="decimal" placeholder="0" value={claim.amount} onChange={(e) => set({ amount: e.target.value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1') })} />}</Field>
          <Field label="What for" wide>{(id) => <input id={id} maxLength={200} placeholder="For example: Banners for the blood donation camp" value={claim.description} onChange={(e) => set({ description: e.target.value })} />}</Field>
          <Field label="Date of the bill">{(id) => <DatePicker id={id} ariaLabel="Date of the bill" max={todayIso()} value={claim.date} onChange={(v) => set({ date: v })} />}</Field>
          <Field label="Category"><PillSelect options={categories} value={categories.includes(claim.category) ? claim.category : categories[0]} ariaLabel="Category" onChange={(v) => set({ category: v })} /></Field>
          <Field label="Event (optional)"><PillSelect options={[NO_EVENT, ...events.map((e) => e.title).filter(Boolean)]} value={claim.event || NO_EVENT} ariaLabel="Event" onChange={(v) => pickEvent(v === NO_EVENT ? '' : v)} /></Field>
          <Field label="Taken from the budget of" hint={claim.event && claim.avenue ? 'Set from the event’s avenue.' : undefined}>
            <PillSelect options={[NO_AVENUE, ...heads.map((h) => h.name)]} value={heads.find((h) => h.code === claim.avenue)?.name ?? NO_AVENUE} ariaLabel="Avenue budget" onChange={(v) => set({ avenue: heads.find((h) => h.name === v)?.code })} />
          </Field>
          <Field label="Receipt" hint={claim.receipt ? 'Stored encrypted; only visible here.' : 'A photo of the bill. Stored encrypted; only visible here.'} wide>
            <div className="adm-receipt">
              {/* eslint-disable-next-line @next/next/no-img-element -- private, signed-in image; next/image would fetch it without the cookie */}
              {claim.receipt && <a href={`/api/admin/receipts?id=${claim.receipt}`} target="_blank" rel="noreferrer"><img src={`/api/admin/receipts?id=${claim.receipt}`} alt="Receipt" /></a>}
              <PhotoButton label={claim.receipt ? 'Change photo' : 'Attach receipt photo'} busy={busy} onFile={attach} />
              {claim.receipt && <button type="button" className="adm-link is-danger" onClick={() => set({ receipt: undefined })}>Remove</button>}
            </div>
          </Field>
          <Field label="Note (optional)" wide>{(id) => <input id={id} maxLength={200} placeholder="Bill number, who approved it…" value={claim.note ?? ''} onChange={(e) => set({ note: e.target.value || undefined })} />}</Field>
        </div>
      </section>
      <div className="adm-editor-foot">
        <button type="button" className="adm-btn" onClick={onClose}>Done</button>
        <button type="button" className="adm-link is-danger" onClick={onDelete}><FaTrashCan size={12} aria-hidden="true" /> Delete this claim</button>
      </div>
    </div>
  );
}

export default function Reimbursements({ finance, update, events, people, categories, rupees, rotaractYearOf, editing, setEditing }) {
  const [show, setShow] = useState('owed');
  const claims = finance.claims ?? [];
  const today = todayIso();
  const owed = owedClaims(finance);
  const current = editing ? claims.find((c) => c.id === editing) : null;
  const setClaims = (fn) => update((f) => ({ ...f, claims: fn(f.claims ?? []) }));
  const setClaim = (id, patch) => setClaims((list) => list.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  if (current) {
    return (
      <ClaimEditor
        claim={current} claims={claims} people={people} events={events} categories={categories}
        heads={headsFor(finance, rotaractYearOf(current.date || today))}
        onChange={(next) => setClaims((list) => list.map((c) => (c.id === next.id ? next : c)))}
        onDelete={() => { if (window.confirm('Delete this reimbursement claim?')) { setClaims((list) => list.filter((c) => c.id !== current.id)); setEditing(null); } }}
        onClose={() => setEditing(null)}
      />
    );
  }

  // Paying adds the expense to the finance sheet (with the claim's event and avenue) and links it to the claim.
  const pay = (list) => {
    const missing = list.filter((c) => !c.receipt).length;
    if (missing && !window.confirm(`${plural(missing, 'claim has', 'claims have')} no receipt attached. Pay anyway?`)) return;
    payNow(list);
  };
  const payNow = (list) => update((f) => {
    const made = list.map((c) => ({ c, entry: { id: `${today.replaceAll('-', '')}-${tag()}`, date: today, type: 'expense', amount: Number(c.amount), category: c.category || 'Project costs', description: `Reimbursement: ${c.description}`, party: c.person, mode: 'UPI', ...(c.event ? { event: c.event } : {}), ...(c.avenue ? { avenue: c.avenue } : {}) } }));
    const byId = new Map(made.map(({ c, entry }) => [c.id, entry.id]));
    return { ...f, entries: [...made.map((m) => m.entry), ...f.entries], claims: (f.claims ?? []).map((c) => (byId.has(c.id) ? { ...c, status: 'paid', entry: byId.get(c.id) } : c)) };
  });
  const unpay = (c) => {
    if (!window.confirm('Mark this as not paid? Its expense is removed from the finance sheet.')) return;
    update((f) => ({ ...f, entries: f.entries.filter((e) => e.id !== c.entry), claims: (f.claims ?? []).map((x) => (x.id === c.id ? { ...x, status: 'approved', entry: undefined } : x)) }));
  };
  const add = () => { const c = blankClaim(); setClaims((list) => [c, ...list]); setEditing(c.id); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const byPerson = [...owed.reduce((m, c) => m.set(c.person, [...(m.get(c.person) ?? []), c]), new Map())].sort((a, b) => b[1].reduce((n, c) => n + Number(c.amount), 0) - a[1].reduce((n, c) => n + Number(c.amount), 0));
  const oldest = owed.reduce((n, c) => Math.max(n, age(c, today)), 0);
  const paidThisYear = claims.filter((c) => c.status === 'paid' && rotaractYearOf(c.date) === rotaractYearOf(today)).reduce((n, c) => n + Number(c.amount), 0);
  const shown = claims.filter((c) => (show === 'owed' ? c.status === 'pending' || c.status === 'approved' : show === 'all' ? true : c.status === show)).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="adm-claims">
      <div className="adm-stats adm-money adm-budget-stats">
        <div className="adm-stat is-static"><span className="adm-stat-label">Owed to members</span><strong className={owed.length ? 'is-out' : ''}>{rupees(owed.reduce((n, c) => n + Number(c.amount || 0), 0))}</strong><span className="adm-stat-sub">{plural(owed.length, 'claim')}</span></div>
        <div className="adm-stat is-static"><span className="adm-stat-label">Waiting longest</span><strong>{owed.length ? plural(oldest, 'day') : '–'}</strong><span className="adm-stat-sub">since the bill</span></div>
        <div className="adm-stat is-static"><span className="adm-stat-label">Paid back this year</span><strong>{rupees(paidThisYear)}</strong><span className="adm-stat-sub">{rotaractYearOf(today)}</span></div>
      </div>

      {byPerson.length > 0 && (
        <section className="adm-card">
          <h3>Who is owed</h3>
          <ul className="adm-dues">
            {byPerson.map(([person, list]) => (
              <li key={person}>
                <span className="adm-dues-who"><strong>{person || 'No name yet'}</strong><span>{plural(list.length, 'claim')} · {rupees(list.reduce((n, c) => n + Number(c.amount || 0), 0))}</span></span>
                <span className="adm-dues-actions">
                  <button type="button" className="adm-btn is-small" disabled={!person || list.some((c) => !(Number(c.amount) > 0) || !c.description)} onClick={() => { if (window.confirm(`Pay ${person} back ${rupees(list.reduce((n, c) => n + Number(c.amount), 0))} for ${plural(list.length, 'claim')}? Each becomes an expense in the finance sheet.`)) pay(list); }}>Pay back</button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="adm-toolbar">
        <Segmented label="Show" options={[['owed', 'Still owed'], ['paid', 'Paid'], ['rejected', 'Not approved'], ['all', 'All']]} value={show} onChange={setShow} />
        <button type="button" className="adm-btn is-small" onClick={add}><FaPlus size={11} aria-hidden="true" /> Add a claim</button>
      </div>
      {!shown.length && <Empty title={show === 'owed' ? 'Nobody is owed money.' : 'Nothing here yet.'}>When a member pays for something from their own pocket, add it with “Add a claim”.</Empty>}
      <ul className="adm-list">
        {shown.map((c) => (
          <li key={c.id}>
            <div className="adm-row adm-claim">
              <button type="button" className="adm-row-text adm-claim-open" onClick={() => { setEditing(c.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                <strong>{c.description || 'No description yet'}</strong>
                <span>{c.person || 'Who paid?'} · {niceDate(c.date)}{c.event ? ` · ${c.event}` : ''}</span>
              </button>
              <span className="adm-claim-side">
                <strong className="adm-entry-amount">{rupees(Number(c.amount) || 0)}</strong>
                <span className="adm-badges">
                  <Badge tone={STATUS[c.status][1]}>{STATUS[c.status][0]}</Badge>
                  {(c.status === 'pending' || c.status === 'approved') && age(c, today) > 14 && <Badge tone="red">{age(c, today)} days</Badge>}
                  {c.status !== 'rejected' && <Badge tone={c.receipt ? 'green' : 'amber'}>{c.receipt ? 'Receipt' : 'No receipt'}</Badge>}
                </span>
                <span className="adm-claim-actions">
                  {c.status === 'pending' && <button type="button" className="adm-link" onClick={() => setClaim(c.id, { status: 'approved' })}>Approve</button>}
                  {(c.status === 'pending' || c.status === 'approved') && <button type="button" className="adm-link" disabled={!c.person || !(Number(c.amount) > 0) || !c.description} onClick={() => pay([c])}>Mark paid</button>}
                  {c.status === 'pending' && <button type="button" className="adm-link is-danger" onClick={() => setClaim(c.id, { status: 'rejected' })}>Not approved</button>}
                  {c.status === 'paid' && <button type="button" className="adm-link" onClick={() => unpay(c)}>Undo</button>}
                  {c.status === 'rejected' && <button type="button" className="adm-link" onClick={() => setClaim(c.id, { status: 'pending' })}>Reopen</button>}
                </span>
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
