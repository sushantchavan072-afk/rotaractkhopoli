'use client';

import { useState } from 'react';
import { FaChevronDown, FaPlus, FaWandMagicSparkles } from 'react-icons/fa6';
import { Empty, plural, todayIso } from './shared';

/**
 * Avenue budgets: each avenue (director) gets an amount for the Rotaract year, and every expense marked with
 * that avenue is taken from it. Expenses linked to an event take the event's avenue by themselves.
 */

// Default budget heads. `avenues` are the event avenues (from Events) that count towards the head.
export const BUDGET_HEADS = [
  { code: 'CSD', name: 'Club Service', avenues: ['Club Service'] },
  { code: 'CMD', name: 'Community Service', avenues: ['Community Service'] },
  { code: 'ISD', name: 'International Service', avenues: ['International Service'] },
  { code: 'PDD', name: 'Professional Development', avenues: ['Professional Development'] },
  { code: 'PRO', name: 'Public Relations', avenues: ['Public Relations'] },
  { code: 'PID', name: 'Public Image', avenues: ['Public Image'] },
  { code: 'DEI', name: 'Diversity, Equity & Inclusion', avenues: ['Diversity, Equity & Inclusion'] },
  { code: 'SPORTS', name: 'Sports', avenues: ['Sports'] },
  { code: 'RRRO', name: 'Rotary–Rotaract Relations', avenues: ['Rotary–Rotaract Relations'] },
];

/** The budget head an event's avenue belongs to (its code), or ''. */
export const headForAvenue = (avenue) => BUDGET_HEADS.find((h) => h.avenues.includes(avenue))?.code ?? '';

/** The heads used in a year: the year's own list, or the defaults with no amounts yet. */
export const headsFor = (finance, year) => finance.budgets?.[year] ?? BUDGET_HEADS.map(({ code, name }) => ({ code, name, amount: 0 }));

const roundUp = (n, step = 500) => Math.ceil(n / step) * step;
const shortCode = (s) => s.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);

/** How far through the Rotaract year (1 July – 30 June) a date is, from 0 to 1. */
function yearProgress(year, today = todayIso()) {
  const start = Number(year.slice(0, 4));
  const from = Date.UTC(start, 6, 1);
  const to = Date.UTC(start + 1, 6, 1);
  const [y, m, d] = today.split('-').map(Number);
  return Math.min(1, Math.max(0, (Date.UTC(y, m - 1, d) - from) / (to - from)));
}

/** Spending per head for a year: { CSD: { spent, events: Map(event -> amount), count } }, plus unassigned. */
export function spendingFor(entries, year, rotaractYearOf) {
  const out = {};
  const unassigned = [];
  for (const e of entries) {
    if (e.type !== 'expense' || !e.date || rotaractYearOf(e.date) !== year) continue;
    if (!e.avenue) { unassigned.push(e); continue; }
    const row = (out[e.avenue] ??= { spent: 0, count: 0, events: new Map() });
    const amount = Number(e.amount) || 0;
    row.spent += amount;
    row.count += 1;
    const key = e.event || '';
    row.events.set(key, (row.events.get(key) ?? 0) + amount);
  }
  return { byHead: out, unassigned };
}

/** What a head's numbers mean: tone and a short note. */
export function budgetState(amount, spent, progress) {
  if (!amount) return spent ? { tone: 'red', note: 'No budget set' } : { tone: 'grey', note: 'No budget yet' };
  const used = spent / amount;
  if (used > 1) return { tone: 'red', note: `Over by ${Math.round((used - 1) * 100)}%` };
  if (used >= 0.8) return { tone: 'amber', note: `${Math.round(used * 100)}% used` };
  // Spending clearly ahead of the calendar: say where this pace ends up.
  if (progress > 0.05 && progress < 0.95 && spent / progress > amount * 1.15) return { tone: 'amber', note: 'Spending fast' };
  return { tone: 'green', note: `${Math.round(used * 100)}% used` };
}

export default function Budgets({ finance, year, years, update, rupees, rotaractYearOf, onPickAvenue }) {
  const heads = headsFor(finance, year);
  const { byHead, unassigned } = spendingFor(finance.entries, year, rotaractYearOf);
  const progress = yearProgress(year);
  const [open, setOpen] = useState(null); // head code showing its events
  const income = finance.entries.filter((e) => e.type === 'income' && e.date && rotaractYearOf(e.date) === year).reduce((n, e) => n + (Number(e.amount) || 0), 0);
  const available = Number(finance.openingBalances?.[year] || 0) + income;
  const allotted = heads.reduce((n, h) => n + (Number(h.amount) || 0), 0);
  const spent = heads.reduce((n, h) => n + (byHead[h.code]?.spent ?? 0), 0);

  const setHeads = (fn) => update((f) => ({ ...f, budgets: { ...(f.budgets ?? {}), [year]: fn(headsFor(f, year)) } }));
  const setHead = (code, patch) => setHeads((list) => list.map((h) => (h.code === code ? { ...h, ...patch } : h)));

  // "Suggest amounts": last year's spending per head (rounded up), or last year's budget when nothing was spent.
  const lastYear = years.find((y) => y < year);
  const suggestion = (() => {
    if (!lastYear) return null;
    const last = spendingFor(finance.entries, lastYear, rotaractYearOf).byHead;
    const lastHeads = finance.budgets?.[lastYear] ?? [];
    const amounts = Object.fromEntries(heads.map((h) => [h.code, last[h.code]?.spent ? roundUp(last[h.code].spent * 1.05) : Number(lastHeads.find((x) => x.code === h.code)?.amount) || 0]));
    return Object.values(amounts).some(Boolean) ? amounts : null;
  })();

  const addHead = () => {
    const name = window.prompt('Name of the new budget (for example: Sports, Editorial, Installation)');
    if (!name?.trim()) return;
    let code = shortCode(name) || 'NEW';
    const stem = code.slice(0, 6);
    for (let n = 2; heads.some((h) => h.code === code); n += 1) code = `${stem}${n}`;
    setHeads((list) => [...list, { code, name: name.trim().slice(0, 60), amount: 0 }]);
  };

  const isDefault = (code) => BUDGET_HEADS.some((h) => h.code === code);
  const left = allotted - spent;

  return (
    <div className="adm-budgets">
      <div className="adm-stats adm-money adm-budget-stats">
        <div className="adm-stat is-static"><span className="adm-stat-label">Total budget</span><strong>{rupees(allotted)}</strong><span className="adm-stat-sub">For {year}</span></div>
        <div className="adm-stat is-static"><span className="adm-stat-label">Spent</span><strong className={spent ? 'is-out' : ''}>{rupees(spent)}</strong><span className="adm-stat-sub">{allotted ? `${Math.round((spent / allotted) * 100)}% of the budget` : 'Set the amounts below'}</span></div>
        <div className="adm-stat is-static"><span className="adm-stat-label">{left < 0 ? 'Over budget by' : 'Left'}</span><strong className={left < 0 ? 'is-out' : 'is-in'}>{rupees(Math.abs(left))}</strong><span className="adm-stat-sub">{Math.round(progress * 100)}% of the year gone</span></div>
      </div>

      {(allotted > available && available > 0) && <p className="adm-notice">The budgets add up to {rupees(allotted - available)} more than the money the club has this year (opening balance + income).</p>}
      {unassigned.length > 0 && (
        <p className="adm-notice is-soft">
          {plural(unassigned.length, 'expense')} ({rupees(unassigned.reduce((n, e) => n + (Number(e.amount) || 0), 0))}) {unassigned.length === 1 ? 'isn’t' : 'aren’t'} from any avenue yet.{' '}
          <button type="button" className="adm-link" onClick={() => onPickAvenue(unassigned[0].id)}>Choose the avenue</button>
        </p>
      )}

      <section className="adm-card adm-budget-card">
        <div className="adm-budget-head">
          <div>
            <h3>Budget for each avenue</h3>
            <p className="adm-hint">Type an amount for each avenue. Expenses linked to an event come out of that event’s avenue by themselves.</p>
          </div>
          <span className="adm-toolbar-actions">
            {suggestion && (
              <button type="button" className="adm-link" onClick={() => { if (window.confirm(`Fill the budgets from ${lastYear} (what each avenue spent then, plus 5%)? You can change any amount after.`)) setHeads((list) => list.map((h) => ({ ...h, amount: suggestion[h.code] ?? h.amount }))); }}>
                <FaWandMagicSparkles size={11} aria-hidden="true" /> Use {lastYear} as a guide
              </button>
            )}
            <button type="button" className="adm-link" onClick={addHead}><FaPlus size={10} aria-hidden="true" /> Add an avenue</button>
          </span>
        </div>
        {!heads.length && <Empty title="No avenues yet.">Add one with “Add an avenue”.</Empty>}
        <ul className="adm-brows">
          {heads.map((h) => {
            const row = byHead[h.code] ?? { spent: 0, count: 0, events: new Map() };
            const amount = Number(h.amount) || 0;
            const state = budgetState(amount, row.spent, progress);
            const pct = amount ? Math.min(100, (row.spent / amount) * 100) : row.spent ? 100 : 0;
            const isOpen = open === h.code;
            const status = !row.spent ? 'Nothing spent yet'
              : !amount ? `${rupees(row.spent)} spent, no budget set`
                : row.spent > amount ? `${rupees(row.spent)} spent · ${rupees(row.spent - amount)} over`
                  : `${rupees(row.spent)} spent · ${rupees(amount - row.spent)} left`;
            return (
              <li key={h.code} className={`adm-brow is-${state.tone}`}>
                <div className="adm-brow-top">
                  <strong className="adm-brow-name">{h.name}</strong>
                  <label className="adm-brow-amount"><span aria-hidden="true">₹</span><input inputMode="decimal" aria-label={`Budget for ${h.name}`} placeholder="0" value={h.amount || ''} onChange={(e) => setHead(h.code, { amount: e.target.value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1') })} /></label>
                </div>
                <span className="adm-budget-bar" aria-hidden="true"><i style={{ transform: `scaleX(${pct / 100})` }} /></span>
                <div className="adm-brow-foot">
                  <span className="adm-brow-status">{status}{state.note === 'Spending fast' ? ' · spending fast' : ''}</span>
                  {row.count > 0 && (
                    <button type="button" className="adm-link" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : h.code)}>
                      {isOpen ? 'Hide' : 'By event'} <FaChevronDown size={9} aria-hidden="true" className={isOpen ? 'is-flipped' : ''} />
                    </button>
                  )}
                  {!row.count && !isDefault(h.code) && (
                    <button type="button" className="adm-link is-danger" onClick={() => setHeads((list) => list.filter((x) => x.code !== h.code))}>Remove</button>
                  )}
                </div>
                {isOpen && (
                  <ul className="adm-budget-events">
                    {[...row.events].sort((a, b) => b[1] - a[1]).map(([ev, amt]) => (
                      <li key={ev || '-'}><span>{ev || 'Not linked to an event'}</span><strong>{rupees(amt)}</strong></li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
