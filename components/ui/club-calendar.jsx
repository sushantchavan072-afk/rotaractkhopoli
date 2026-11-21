'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import {
  FaArrowLeft, FaArrowRight, FaRegCalendarPlus, FaGoogle, FaLocationDot, FaRegClock, FaArrowRightLong,
} from 'react-icons/fa6';
import { rotaryDays } from '@/data/club';
import { downloadIcs, googleCalendarUrl } from '@/lib/calendar';

/**
 * Club calendar: a month view of the club's projects in the site's style.
 *
 * - Today is the visitor's own date and is worked out in the browser, so the highlight moves on by
 *   itself every day (also at midnight while the page stays open, and when the tab comes back).
 * - Project days carry a label (desktop) or dots (phones) in their avenue's colour; Rotary family
 *   days are marked in Rotary gold.
 * - Choosing a day lists what is on; upcoming projects can be added to Google Calendar or saved
 *   as an .ics file, one at a time or all together.
 * - Avenue filters, a Rotaract-year strip (July to June) to jump between months, arrow-key and
 *   Page Up/Down navigation, and swiping between months on phones.
 *
 * New events in data/club.js appear here automatically.
 */

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const AVENUE_HUE = {
  'Community Service': 'coral',
  'Club Service': 'green',
  'International Service': 'interact',
  'Professional Development': 'rotary',
  'Diversity, Equity & Inclusion': 'rotaract',
  'Public Relations': 'gold',
  'Public Image': 'sun',
};
const hueOf = (avenue) => AVENUE_HUE[avenue] ?? 'ink';

/* ---------- dates as "YYYY-MM-DD" keys (no time zones involved) ---------- */
const pad = (n) => String(n).padStart(2, '0');
const keyOf = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`; // m is 0-based
const parse = (k) => { const [y, m, d] = k.split('-').map(Number); return { y, m: m - 1, d }; };
const utc = (k) => { const { y, m, d } = parse(k); return Date.UTC(y, m, d); };
const fromUtc = (t) => { const dt = new Date(t); return keyOf(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate()); };
const addDays = (k, n) => fromUtc(utc(k) + n * 864e5);
const weekday = (k) => new Date(utc(k)).getUTCDay();
const daysFrom = (a, b) => Math.round((utc(b) - utc(a)) / 864e5);
const daysInMonth = (y, m) => new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
const shiftMonth = ({ y, m }, n) => { const t = y * 12 + m + n; return { y: Math.floor(t / 12), m: ((t % 12) + 12) % 12 }; };
const longDate = (k) => { const { y, m, d } = parse(k); return `${WEEKDAYS[weekday(k)]}, ${d} ${MONTHS[m]} ${y}`; };
const shortDate = (k) => { const { m, d } = parse(k); return `${d} ${MONTHS[m].slice(0, 3)}`; };

/* ---------- today, in the visitor's browser; changes at midnight ---------- */
function subscribeToDay(onChange) {
  let timer;
  const arm = () => {
    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 2);
    timer = window.setTimeout(() => { onChange(); arm(); }, next - now);
  };
  arm();
  window.addEventListener('focus', onChange);
  document.addEventListener('visibilitychange', onChange);
  return () => {
    window.clearTimeout(timer);
    window.removeEventListener('focus', onChange);
    document.removeEventListener('visibilitychange', onChange);
  };
}
const todayKey = () => { const n = new Date(); return keyOf(n.getFullYear(), n.getMonth(), n.getDate()); };
const useToday = () => useSyncExternalStore(subscribeToDay, todayKey, () => null);

function countdown(days) {
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days < 14) return `In ${days} days`;
  if (days < 60) return `In ${Math.round(days / 7)} weeks`;
  return `In ${Math.round(days / 30)} months`;
}
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

export default function ClubCalendar({ events }) {
  const today = useToday();
  const [view, setView] = useState(null); // { y, m } once the visitor moves away from this month
  const [picked, setPicked] = useState(null); // a chosen day, else today
  const [avenue, setAvenue] = useState('all');
  const [showRotary, setShowRotary] = useState(true);
  const [dir, setDir] = useState(0); // which way the month grid slides in
  const gridRef = useRef(null);
  const focusNext = useRef(false);
  const swipe = useRef(null);

  const month = view ?? (today ? { y: parse(today).y, m: parse(today).m } : null);
  const selected = picked ?? today;

  const avenues = useMemo(() => [...new Set(events.map((e) => e.avenue))], [events]);
  const shown = useMemo(() => events.filter((e) => avenue === 'all' || e.avenue === avenue), [events, avenue]);
  const byDay = useMemo(() => {
    const map = new Map();
    for (const e of shown) {
      const last = e.endDate ?? e.date;
      for (let k = e.date; k <= last; k = addDays(k, 1)) map.set(k, [...(map.get(k) ?? []), e]);
    }
    return map;
  }, [shown]);
  const rotaryOn = (k) => (showRotary ? rotaryDays.find((r) => r.date === k.slice(5)) : undefined);
  const upcoming = useMemo(
    () => (today ? shown.filter((e) => (e.endDate ?? e.date) >= today).sort((a, b) => a.date.localeCompare(b.date)) : []),
    [shown, today],
  );

  // Move keyboard focus to the newly selected day after arrow-key navigation.
  useEffect(() => {
    if (!focusNext.current || !selected) return;
    focusNext.current = false;
    gridRef.current?.querySelector(`[data-day="${selected}"]`)?.focus();
  });

  if (!month) {
    // Before the browser knows today's date: the same frame, so nothing jumps when it fills in.
    return <div className="cal is-loading" aria-hidden="true"><div className="cal-main" /><div className="cal-side" /></div>;
  }

  const first = keyOf(month.y, month.m, 1);
  const start = addDays(first, -weekday(first));
  const cells = Array.from({ length: 42 }, (_, i) => addDays(start, i));
  const monthEvents = new Set();
  for (let d = 1; d <= daysInMonth(month.y, month.m); d++) (byDay.get(keyOf(month.y, month.m, d)) ?? []).forEach((e) => monthEvents.add(e));
  const focusable = selected && selected.slice(0, 7) === first.slice(0, 7) ? selected : first;
  const rotaryYear = month.m >= 6 ? month.y : month.y - 1;

  const goMonth = (next, d = 0) => { setDir(d); setView(next); };
  const go = (n) => goMonth(shiftMonth(month, n), n);
  const goToday = () => { setPicked(null); goMonth(null, 0); };
  const pick = (k, { focus = false } = {}) => {
    setPicked(k === today ? null : k);
    const { y, m } = parse(k);
    if (y !== month.y || m !== month.m) goMonth({ y, m }, k < first ? -1 : 1);
    focusNext.current = focus;
  };
  const onKey = (e, k) => {
    const moves = {
      ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7,
      Home: -weekday(k), End: 6 - weekday(k),
    };
    let next;
    if (e.key in moves) next = addDays(k, moves[e.key]);
    else if (e.key === 'PageUp' || e.key === 'PageDown') {
      const { y, m, d } = parse(k);
      const t = shiftMonth({ y, m }, e.key === 'PageUp' ? -1 : 1);
      next = keyOf(t.y, t.m, Math.min(d, daysInMonth(t.y, t.m)));
    } else return;
    e.preventDefault();
    pick(next, { focus: true });
  };
  const onTouchStart = (e) => { const t = e.touches[0]; swipe.current = { x: t.clientX, y: t.clientY }; };
  const onTouchEnd = (e) => {
    const s = swipe.current; swipe.current = null;
    if (!s) return;
    const t = e.changedTouches[0]; const dx = t.clientX - s.x; const dy = t.clientY - s.y;
    if (Math.abs(dx) > 60 && Math.abs(dy) < 40) go(dx < 0 ? 1 : -1);
  };

  const dayEvents = selected ? byDay.get(selected) ?? [] : [];
  const dayRotary = selected ? rotaryOn(selected) : undefined;
  const next = upcoming[0];
  const isCurrentMonth = today && today.slice(0, 7) === first.slice(0, 7);

  return (
    <div className="cal">
      <div className="cal-main">
        <div className="cal-head">
          <div>
            <h3 id="cal-title" className="cal-title">{MONTHS[month.m]} <span>{month.y}</span></h3>
            <p className="cal-count">{monthEvents.size ? plural(monthEvents.size, 'project') : 'No projects'} this month</p>
          </div>
          <div className="cal-nav">
            <button type="button" className="cal-today" onClick={goToday} disabled={isCurrentMonth && !picked}>Today</button>
            <button type="button" className="cal-arrow" onClick={() => go(-1)} aria-label="Previous month"><FaArrowLeft size={14} aria-hidden="true" /></button>
            <button type="button" className="cal-arrow" onClick={() => go(1)} aria-label="Next month"><FaArrowRight size={14} aria-hidden="true" /></button>
          </div>
        </div>

        <div className="cal-filters" role="group" aria-label="Show on the calendar">
          <button type="button" className={`cal-chip ${avenue === 'all' ? 'is-on' : ''}`} aria-pressed={avenue === 'all'} onClick={() => setAvenue('all')}>All avenues</button>
          {avenues.map((a) => (
            <button key={a} type="button" className={`cal-chip ${avenue === a ? 'is-on' : ''}`} aria-pressed={avenue === a} onClick={() => setAvenue(avenue === a ? 'all' : a)}>
              <i className={`cal-dot hue-${hueOf(a)}`} aria-hidden="true" />{a}
            </button>
          ))}
          <button type="button" className={`cal-chip ${showRotary ? 'is-on' : ''}`} aria-pressed={showRotary} onClick={() => setShowRotary(!showRotary)}>
            <i className="cal-dot hue-gold is-ring" aria-hidden="true" />Rotary days
          </button>
        </div>

        <div className="cal-grid" role="grid" aria-labelledby="cal-title" ref={gridRef} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          <div className="cal-row cal-weekdays" role="row">
            {WEEKDAYS.map((w) => <div key={w} role="columnheader" aria-label={w}><span aria-hidden="true">{w.slice(0, 3)}</span></div>)}
          </div>
          <div key={first} className={`cal-weeks ${dir > 0 ? 'from-next' : dir < 0 ? 'from-prev' : ''}`}>
            {Array.from({ length: 6 }, (_, w) => (
              <div className="cal-row" role="row" key={w}>
                {cells.slice(w * 7, w * 7 + 7).map((k) => {
                  const list = byDay.get(k) ?? [];
                  const rot = rotaryOn(k);
                  const outside = k.slice(0, 7) !== first.slice(0, 7);
                  const cls = ['cal-day', outside && 'is-outside', k === today && 'is-today', k === selected && 'is-selected',
                    today && k < today && 'is-past', list.length && 'has-events', weekday(k) === 0 && 'is-sunday'].filter(Boolean).join(' ');
                  const label = [longDate(k), k === today && 'today', list.length && plural(list.length, 'project') + ': ' + list.map((e) => e.title).join(', '), rot && rot.title].filter(Boolean).join(', ');
                  return (
                    <div role="gridcell" aria-selected={k === selected} key={k} className="cal-cell">
                      <button type="button" className={cls} data-day={k} tabIndex={k === focusable ? 0 : -1} aria-label={label} onClick={() => pick(k)} onKeyDown={(e) => onKey(e, k)}>
                        <span className="cal-num">{parse(k).d}</span>
                        {rot && <span className="cal-rotary" aria-hidden="true" title={rot.title} />}
                        {list.length > 0 && (
                          <span className="cal-marks" aria-hidden="true">
                            {list.slice(0, 2).map((e) => <span key={e.slug} className={`cal-tag hue-${hueOf(e.avenue)}`}>{e.title}</span>)}
                            {list.length > 2 && <span className="cal-more">+{list.length - 2}</span>}
                            <span className="cal-dots">{list.slice(0, 3).map((e) => <i key={e.slug} className={`cal-dot hue-${hueOf(e.avenue)}`} />)}</span>
                          </span>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        <p className="sr-only" aria-live="polite">{MONTHS[month.m]} {month.y}: {monthEvents.size ? plural(monthEvents.size, 'project') : 'no projects'}</p>

        <div className="cal-year" role="group" aria-label={`Rotaract year ${rotaryYear}–${String(rotaryYear + 1).slice(2)}`}>
          <span className="cal-year-label">Rotaract year {rotaryYear}–{String(rotaryYear + 1).slice(2)}</span>
          <div className="cal-year-months">
            {Array.from({ length: 12 }, (_, i) => {
              const t = shiftMonth({ y: rotaryYear, m: 6 }, i);
              const prefix = `${t.y}-${pad(t.m + 1)}`;
              const n = shown.filter((e) => e.date.startsWith(prefix) || (e.endDate ?? e.date).startsWith(prefix)).length;
              const on = t.y === month.y && t.m === month.m;
              return (
                <button key={prefix} type="button" className={`cal-month ${on ? 'is-on' : ''} ${today?.startsWith(prefix) ? 'is-now' : ''}`}
                  aria-current={on ? 'date' : undefined} aria-label={`${MONTHS[t.m]} ${t.y}, ${n ? plural(n, 'project') : 'no projects'}`}
                  onClick={() => goMonth(t, Math.sign(t.y * 12 + t.m - (month.y * 12 + month.m)))}>
                  {MONTHS[t.m].slice(0, 3)}{n > 0 && <b>{n}</b>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <aside className="cal-side" aria-label="Selected day">
        <div className="cal-agenda">
          <p className="cal-agenda-when">
            {selected === today ? <span className="cal-badge">Today</span> : selected && today && daysFrom(today, selected) === 1 ? <span className="cal-badge">Tomorrow</span> : null}
            {selected && longDate(selected)}
          </p>
          {dayRotary && (
            <div className="cal-rotary-note"><strong>{dayRotary.title}</strong><p>{dayRotary.note}</p></div>
          )}
          {dayEvents.length > 0 ? (
            <ul className="cal-list">
              {dayEvents.map((e) => {
                const done = (e.endDate ?? e.date) < today;
                return (
                  <li key={e.slug} className={`cal-item hue-${hueOf(e.avenue)}`}>
                    <div className="cal-item-meta"><span className="chip">{e.avenue}</span><span className={`status ${done ? 'is-past' : 'is-upcoming'}`}>{done ? 'Completed' : 'Upcoming'}</span></div>
                    <Link href={`/events/${e.slug}`} className="cal-item-title">{e.title}</Link>
                    <ul className="cal-item-facts">
                      {e.time && <li><FaRegClock size={13} aria-hidden="true" /> {e.time}</li>}
                      <li><FaLocationDot size={13} aria-hidden="true" /> {e.venue}</li>
                    </ul>
                    {!done && (
                      <div className="cal-item-actions">
                        <a className="cal-action" href={googleCalendarUrl(e)} target="_blank" rel="noreferrer"><FaGoogle size={13} aria-hidden="true" /> Google Calendar</a>
                        <button type="button" className="cal-action" onClick={() => downloadIcs([e], `${e.slug}.ics`)}><FaRegCalendarPlus size={13} aria-hidden="true" /> Save .ics</button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            !dayRotary && <p className="cal-empty">Nothing planned on this day.</p>
          )}
        </div>

        <div className="cal-next">
          <span className="cal-next-label">Next up</span>
          {next ? (
            <>
              <strong className="cal-next-count">{countdown(Math.max(0, daysFrom(today, next.date)))}</strong>
              <Link href={`/events/${next.slug}`} className="cal-next-title">{next.title} <FaArrowRightLong size={14} aria-hidden="true" /></Link>
              <span className="cal-next-meta">{shortDate(next.date)}{next.time ? ` · ${next.time}` : ''} · {next.venue}</span>
              <div className="cal-next-actions">
                <button type="button" className="cal-action is-light" onClick={() => pick(next.date)}>Show on calendar</button>
                <button type="button" className="cal-action is-light" onClick={() => downloadIcs(upcoming, 'rotaract-khopoli-calendar.ics')}>
                  <FaRegCalendarPlus size={13} aria-hidden="true" /> {upcoming.length > 1 ? `Save all ${upcoming.length} (.ics)` : 'Save .ics'}
                </button>
              </div>
            </>
          ) : (
            <>
              <strong className="cal-next-count">Nothing scheduled yet</strong>
              <p className="cal-next-text">Dates for the new Rotaract year will appear here as soon as the board confirms them.</p>
              <Link href="/contact?about=Upcoming%20events" className="cal-action is-light">Get notified <FaArrowRightLong size={13} aria-hidden="true" /></Link>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
