'use client';

import { useMemo, useState } from 'react';
import { FaArrowDown, FaArrowUp, FaChevronLeft, FaDownload, FaPlus, FaTrashCan } from 'react-icons/fa6';
import { PillSelect, Segmented } from '../ui';
import { Empty, Field, SectionHead, monthLabel, niceDate, plural, tag, todayIso } from './shared';
import Budgets, { headForAvenue, headsFor } from './budgets';

/** The club's income and expenses (kept encrypted; only the signed-in admin page can read them). */

export const INCOME_CATEGORIES = ['Membership dues', 'Sponsorship', 'Donation', 'Event fees', 'Fundraiser', 'Grant from Rotary', 'Other income'];
export const EXPENSE_CATEGORIES = ['Project costs', 'Venue', 'Food and refreshments', 'Printing and publicity', 'Travel', 'District and RI dues', 'Gifts and mementos', 'Bank charges', 'Other expense'];
const MODES = ['Cash', 'UPI', 'Bank transfer', 'Cheque', 'Card'];
const NO_EVENT = 'Not linked to an event';

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });
export const rupees = (n) => inr.format(n || 0).replace(/\.00$/, '');
/** The Rotaract year (1 July – 30 June) a date falls in, e.g. "2026–27". */
export const rotaractYearOf = (iso) => { const [y, m] = iso.split('-').map(Number); const start = m >= 7 ? y : y - 1; return `${start}–${String((start + 1) % 100).padStart(2, '0')}`; };

export const blankEntry = (type) => ({ id: `${todayIso().replaceAll('-', '')}-${tag()}`, date: todayIso(), type, amount: '', category: type === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0], description: '', mode: 'UPI' });

const NO_AVENUE = 'Not from an avenue budget';
const headLabel = (h) => `${h.code} · ${h.name}`;

function EntryEditor({ entry, events, heads, onChange, onDelete, onClose }) {
  const set = (patch) => onChange({ ...entry, ...patch });
  const eventTitles = events.map((e) => e.title).filter(Boolean);
  // Linking an expense to an event takes it from that event's avenue budget, by itself.
  const pickEvent = (title) => {
    const ev = events.find((e) => e.title === title);
    const code = ev ? headForAvenue(ev.avenue) : '';
    set({ event: title, ...(entry.type === 'expense' && code && heads.some((h) => h.code === code) ? { avenue: code } : {}) });
  };
  const linked = events.find((e) => e.title === entry.event);
  const autoAvenue = linked && entry.avenue && headForAvenue(linked.avenue) === entry.avenue;
  const income = entry.type === 'income';
  const categories = income ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  return (
    <div className="adm-editor">
      <div className="adm-editor-top">
        <button type="button" className="adm-back" onClick={onClose}><FaChevronLeft size={12} aria-hidden="true" /> All entries</button>
      </div>
      <h2 className="adm-editor-title">{entry.description || (income ? 'New income' : 'New expense')}</h2>
      <section className="adm-card">
        <Segmented label="Type" options={[['income', 'Income (money in)'], ['expense', 'Expense (money out)']]} value={entry.type} onChange={(t) => set({ type: t, category: (t === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES)[0], avenue: '' })} />
        <div className="adm-grid">
          <Field label="Amount (₹)">
            {(id) => <input id={id} className="adm-amount" inputMode="decimal" placeholder="0" value={entry.amount} onChange={(e) => set({ amount: e.target.value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1') })} />}
          </Field>
          <Field label="Date">{(id) => <input id={id} type="date" value={entry.date} onChange={(e) => set({ date: e.target.value })} />}</Field>
          <Field label="What for" wide>
            {(id) => <input id={id} maxLength={200} placeholder={income ? 'For example: Membership dues for 2026–27' : 'For example: Saplings for the tree plantation drive'} value={entry.description} onChange={(e) => set({ description: e.target.value })} />}
          </Field>
          <Field label="Category">
            <PillSelect options={categories} value={categories.includes(entry.category) ? entry.category : categories[0]} ariaLabel="Category" onChange={(v) => set({ category: v })} />
          </Field>
          <Field label="Payment mode">
            <PillSelect options={MODES} value={entry.mode || 'UPI'} ariaLabel="Payment mode" onChange={(v) => set({ mode: v })} />
          </Field>
          <Field label={income ? 'Received from (optional)' : 'Paid to (optional)'}>
            {(id) => <input id={id} maxLength={100} placeholder={income ? 'Name or organisation' : 'Shop, vendor or person'} value={entry.party ?? ''} onChange={(e) => set({ party: e.target.value })} />}
          </Field>
          <Field label="Receipt or reference no. (optional)">
            {(id) => <input id={id} maxLength={60} placeholder="UPI ref, bill no., cheque no." value={entry.reference ?? ''} onChange={(e) => set({ reference: e.target.value })} />}
          </Field>
          <Field label="Event (optional)" wide>
            <PillSelect options={[NO_EVENT, ...eventTitles]} value={entry.event || NO_EVENT} ariaLabel="Event" onChange={(v) => pickEvent(v === NO_EVENT ? '' : v)} />
          </Field>
          {!income && (
            <Field label="Taken from the budget of" hint={autoAvenue ? 'Set from the event’s avenue.' : 'Each avenue has its own budget (Finance → Budgets).'} wide>
              <PillSelect options={[NO_AVENUE, ...heads.map(headLabel)]} value={heads.find((h) => h.code === entry.avenue) ? headLabel(heads.find((h) => h.code === entry.avenue)) : NO_AVENUE} ariaLabel="Avenue budget" onChange={(v) => set({ avenue: heads.find((h) => headLabel(h) === v)?.code ?? '' })} />
            </Field>
          )}
        </div>
      </section>
      <div className="adm-editor-foot">
        <button type="button" className="adm-btn" onClick={onClose}>Done</button>
        <button type="button" className="adm-link is-danger" onClick={onDelete}><FaTrashCan size={12} aria-hidden="true" /> Delete this entry</button>
      </div>
    </div>
  );
}

function downloadCsv(rows, year) {
  const cell = (v) => `"${String(v ?? '').replaceAll('"', '""')}"`;
  const head = ['Date', 'Type', 'Category', 'What for', 'Received from / Paid to', 'Mode', 'Reference', 'Event', 'Amount (INR)'];
  const lines = rows.map((e) => [e.date, e.type === 'income' ? 'Income' : 'Expense', e.category, e.description, e.party, e.mode, e.reference, e.event, (e.type === 'income' ? 1 : -1) * Number(e.amount)].map(cell).join(','));
  const blob = new Blob([`﻿${[head.map(cell).join(','), ...lines].join('\r\n')}`], { type: 'text/csv;charset=utf-8' });
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `rotaract-khopoli-finance-${year.replace('–', '-')}.csv` });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function Breakdown({ title, rows, total, tone }) {
  return (
    <section className="adm-card">
      <h3>{title}</h3>
      {!rows.length ? <p className="adm-hint">Nothing yet.</p> : (
        <ul className="adm-breakdown">
          {rows.map(([cat, amount]) => (
            <li key={cat}>
              <span className="adm-breakdown-label">{cat}</span>
              <span className="adm-breakdown-amount">{rupees(amount)}</span>
              <span className="adm-breakdown-bar" aria-hidden="true"><i className={`is-${tone}`} style={{ width: `${Math.max(3, (amount / total) * 100)}%` }} /></span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function FinanceTab({ finance, events, update, ready, page, setPage }) {
  const entries = finance.entries;
  const budgetYears = finance.budgets;
  const years = useMemo(() => [...new Set([rotaractYearOf(todayIso()), ...Object.keys(budgetYears ?? {}), ...entries.filter((e) => e.date).map((e) => rotaractYearOf(e.date))])].sort().reverse(), [entries, budgetYears]);
  const [year, setYear] = useState(years[0]);
  const [kind, setKind] = useState('all');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null); // entry id

  const inYear = entries.filter((e) => e.date && rotaractYearOf(e.date) === year);
  const sum = (list, type) => list.filter((e) => e.type === type).reduce((n, e) => n + (Number(e.amount) || 0), 0);
  const income = sum(inYear, 'income');
  const expense = sum(inYear, 'expense');
  const opening = finance.openingBalances[year] ?? 0;
  const byCategory = (type) => {
    const m = new Map();
    for (const e of inYear.filter((x) => x.type === type)) m.set(e.category, (m.get(e.category) ?? 0) + (Number(e.amount) || 0));
    return [...m].sort((a, b) => b[1] - a[1]);
  };
  const shown = inYear
    .filter((e) => kind === 'all' || e.type === kind)
    .filter((e) => !query || `${e.description} ${e.category} ${e.party ?? ''} ${e.event ?? ''} ${e.reference ?? ''}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => b.date.localeCompare(a.date));
  const groups = [];
  for (const e of shown) {
    const label = monthLabel(e.date);
    if (groups.at(-1)?.label !== label) groups.push({ label, rows: [], net: 0 });
    groups.at(-1).rows.push(e);
    groups.at(-1).net += (e.type === 'income' ? 1 : -1) * (Number(e.amount) || 0);
  }

  const current = editing ? entries.find((e) => e.id === editing) : null;
  const add = (type) => {
    const entry = blankEntry(type);
    update((f) => ({ ...f, entries: [entry, ...f.entries] }));
    setYear(rotaractYearOf(entry.date));
    setEditing(entry.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (current) {
    return (
      <EntryEditor
        entry={current} events={events} heads={headsFor(finance, current.date ? rotaractYearOf(current.date) : year)}
        onChange={(next) => update((f) => ({ ...f, entries: f.entries.map((e) => (e.id === next.id ? next : e)) }))}
        onDelete={() => { if (window.confirm('Delete this entry from the finance sheet?')) { update((f) => ({ ...f, entries: f.entries.filter((e) => e.id !== current.id) })); setEditing(null); } }}
        onClose={() => { if (current.date) setYear(rotaractYearOf(current.date)); setEditing(null); }}
      />
    );
  }

  return (
    <div className="adm-tab">
      <SectionHead title="Finance" desc="The club’s income and expenses. Private: stored encrypted, and only visible here on the admin page.">
        <button type="button" className="adm-btn" onClick={() => add('income')}><FaPlus size={12} aria-hidden="true" /> Income</button>
        <button type="button" className="adm-btn is-ghost" onClick={() => add('expense')}><FaPlus size={12} aria-hidden="true" /> Expense</button>
      </SectionHead>
      {!ready && <p className="adm-notice">The finance sheet needs saving switched on (GITHUB_TOKEN) and a key (FINANCE_KEY, or the admin password). See REMAINING-TASKS.md.</p>}

      <div className="adm-toolbar">
        <Segmented label="Page" options={[['sheet', 'Income and expenses'], ['budgets', 'Avenue budgets']]} value={page} onChange={setPage} />
      </div>
      <div className="adm-toolbar">
        <div className="adm-year">
          <span className="adm-label">Rotaract year</span>
          <PillSelect options={years} value={year} ariaLabel="Rotaract year" onChange={setYear} />
        </div>
        {page === 'sheet' && <button type="button" className="adm-btn is-ghost is-small" disabled={!inYear.length} onClick={() => downloadCsv([...inYear].sort((a, b) => a.date.localeCompare(b.date)), year)}>
          <FaDownload size={12} aria-hidden="true" /> Download for Excel (CSV)
        </button>}
      </div>

      {page === 'budgets' ? (
        <Budgets
          finance={finance} year={year} years={years} update={update} rupees={rupees} rotaractYearOf={rotaractYearOf}
          onPickAvenue={(id) => { setEditing(id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        />
      ) : (<>

      <div className="adm-stats adm-money">
        <label className="adm-stat is-static">
          <span className="adm-stat-label">Opening balance</span>
          <span className="adm-money-input">₹<input
            inputMode="decimal" aria-label={`Opening balance for ${year}`} value={finance.openingBalances[year] ?? ''} placeholder="0"
            onChange={(e) => { const v = e.target.value.replace(/[^\d.-]/g, ''); update((f) => ({ ...f, openingBalances: { ...f.openingBalances, [year]: v } })); }}
          /></span>
          <span className="adm-stat-sub">Money in hand and bank on 1 July</span>
        </label>
        <div className="adm-stat is-static"><span className="adm-stat-label">Income</span><strong className="is-in">{rupees(income)}</strong><span className="adm-stat-sub">{plural(inYear.filter((e) => e.type === 'income').length, 'entry', 'entries')}</span></div>
        <div className="adm-stat is-static"><span className="adm-stat-label">Expenses</span><strong className="is-out">{rupees(expense)}</strong><span className="adm-stat-sub">{plural(inYear.filter((e) => e.type === 'expense').length, 'entry', 'entries')}</span></div>
        <div className="adm-stat is-static"><span className="adm-stat-label">Balance now</span><strong>{rupees(Number(opening || 0) + income - expense)}</strong><span className="adm-stat-sub">Opening + income − expenses</span></div>
      </div>

      <div className="adm-two">
        <Breakdown title="Income by category" rows={byCategory('income')} total={income} tone="in" />
        <Breakdown title="Expenses by category" rows={byCategory('expense')} total={expense} tone="out" />
      </div>

      <div className="adm-toolbar">
        <input className="adm-search" type="search" placeholder="Search what for, name, event or reference" aria-label="Search entries" value={query} onChange={(e) => setQuery(e.target.value)} />
        <Segmented label="Show" options={[['all', 'All'], ['income', 'Income'], ['expense', 'Expenses']]} value={kind} onChange={setKind} />
      </div>
      {!groups.length && <Empty title={query ? `No entries match “${query}”.` : `No entries for ${year} yet.`}>Add money received with “Income” and money spent with “Expense”.</Empty>}
      {groups.map((g) => (
        <div key={g.label} className="adm-group">
          <h3 className="adm-group-title">{g.label}<span className={g.net >= 0 ? 'is-in' : 'is-out'}>{g.net >= 0 ? '+' : '−'}{rupees(Math.abs(g.net))}</span></h3>
          <ul className="adm-list">
            {g.rows.map((e) => (
              <li key={e.id}>
                <button type="button" className="adm-row adm-entry" onClick={() => { setEditing(e.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                  <span className={`adm-entry-icon is-${e.type === 'income' ? 'in' : 'out'}`} aria-hidden="true">{e.type === 'income' ? <FaArrowDown size={13} /> : <FaArrowUp size={13} />}</span>
                  <span className="adm-row-text">
                    <strong>{e.description || 'No description yet'}</strong>
                    <span>{niceDate(e.date)} · {e.category}{e.party ? ` · ${e.party}` : ''}{e.mode ? ` · ${e.mode}` : ''}</span>
                  </span>
                  <span className={`adm-entry-amount is-${e.type === 'income' ? 'in' : 'out'}`}>{e.type === 'income' ? '+' : '−'}{rupees(Number(e.amount) || 0)}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
      </>)}
    </div>
  );
}
