'use client';

import { useId } from 'react';
import { FaBell, FaCircleCheck, FaClockRotateLeft, FaPlus, FaTriangleExclamation } from 'react-icons/fa6';
import { eventGaps } from './events';
import { LISTS } from './team';
import { budgetState, headsFor, spendingFor } from './budgets';
import { rotaractYearOf, rupees } from './finance';
import { SectionHead, Thumb, initials, optimized, useNextFrame, isCompleted, niceDate, plural, todayIso, whenSaved } from './shared';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** The Rotaract year that runs now (1 July to 30 June), as its first calendar year. */
const currentRotaryStart = () => { const d = new Date(); return d.getMonth() >= 6 ? d.getFullYear() : d.getFullYear() - 1; };
const shortDate = (iso) => { const [, m, d] = iso.split('-').map(Number); return `${d} ${MONTHS[m - 1]}`; };

/** Things on the website that are missing or out of date, each with where to fix it. */
export function attentionItems({ draft, hasPhoto, memberHasPhoto }) {
  const today = todayIso();
  const items = [];
  const yearStart = Number.parseInt(draft.team.rotaractYear, 10);
  if (yearStart && yearStart < currentRotaryStart()) {
    items.push({ key: 'year', text: `The Team page still says Rotaract year ${draft.team.rotaractYear}. A new board takes office each July.`, go: 'team', action: 'Update the team' });
  }
  const noPhoto = draft.events.filter((e) => eventGaps(e, hasPhoto, today).includes('No photo'));
  if (noPhoto.length) items.push({ key: 'photos', text: `${plural(noPhoto.length, 'completed event')} ${noPhoto.length === 1 ? 'has' : 'have'} no photo.`, go: 'events', filter: 'needs', action: 'Add photos' });
  const noReport = draft.events.filter((e) => eventGaps(e, hasPhoto, today).includes('No report'));
  if (noReport.length) items.push({ key: 'reports', text: `${plural(noReport.length, 'completed event')} ${noReport.length === 1 ? 'has' : 'have'} no report or results.`, go: 'events', filter: 'needs', action: 'Write them' });
  const missing = [...new Set(LISTS.flatMap(([k]) => draft.team[k]).filter((p) => p.name && !memberHasPhoto(p)).map((p) => p.name))];
  if (missing.length) items.push({ key: 'members', text: `${plural(missing.length, 'team member')} without a photo: ${missing.slice(0, 3).join(', ')}${missing.length > 3 ? '…' : ''}.`, go: 'team', action: 'Add photos' });
  if (!draft.site.email) items.push({ key: 'email', text: 'No club email yet, so website messages go to a personal inbox.', go: 'site', action: 'Add email' });
  if (!Object.values(draft.site.social).some(Boolean)) items.push({ key: 'social', text: 'No social media links yet (Instagram, Facebook…).', go: 'site', action: 'Add links' });
  if (!draft.reviews.length) items.push({ key: 'reviews', text: 'No reviews yet. The Reviews section is hidden until there is one.', go: 'reviews', action: 'Add a review' });

  // Smart reminders: what's coming up, and the money.
  const soon = draft.events.filter((e) => e.date >= today && daysBetween(today, e.date) <= 7).sort((a, b) => a.date.localeCompare(b.date));
  for (const e of soon.slice(0, 2).reverse()) { // added to the top, soonest first
    const days = daysBetween(today, e.date);
    items.unshift({ key: `soon-${e.slug || e.title}`, tone: 'info', text: `${days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `In ${days} days`}: ${e.title || 'an event'}${e.venue ? ` at ${e.venue}` : ''}. Add photos and a report after it.`, go: 'events', filter: 'upcoming', action: 'See it' });
  }
  const month = Number(today.slice(5, 7));
  if (month === 6 && yearStart === currentRotaryStart()) {
    items.unshift({ key: 'july', tone: 'info', text: `A new Rotaract year starts on 1 July. Have the new board’s names, roles and photos ready for the Team page.`, go: 'team', action: 'Open Team' });
  }
  const f = draft.finance;
  if (f) {
    const year = rotaractYearOf(today);
    const thisYear = f.entries.filter((e) => e.date && rotaractYearOf(e.date) === year);
    if (thisYear.length && !Number(f.openingBalances?.[year])) items.push({ key: 'opening', text: `No opening balance for ${year} yet, so “Balance now” in Finance may be wrong.`, go: 'finance', action: 'Set it' });
    const heads = headsFor(f, year);
    const { byHead, unassigned } = spendingFor(f.entries, year, rotaractYearOf);
    const start = Number(year.slice(0, 4));
    const progress = Math.min(1, Math.max(0, daysBetween(`${start}-07-01`, today) / 365));
    for (const h of heads) {
      const spent = byHead[h.code]?.spent ?? 0;
      const amount = Number(h.amount) || 0;
      const st = budgetState(amount, spent, progress);
      if (st.tone === 'red' && spent) items.push({ key: `budget-${h.code}`, text: amount ? `${h.code} (${h.name}) is over its budget by ${rupees(spent - amount)}.` : `${h.code} (${h.name}) has spent ${rupees(spent)} with no budget set.`, go: 'finance', filter: 'budgets', action: 'Budgets' });
      else if (st.tone === 'amber') items.push({ key: `budget-${h.code}`, text: st.note === 'Spending fast' ? `${h.code} (${h.name}) is spending faster than the year: ${rupees(spent)} of ${rupees(amount)} used.` : `${h.code} (${h.name}) has used ${Math.round((spent / amount) * 100)}% of its budget (${rupees(amount - spent)} left).`, go: 'finance', filter: 'budgets', action: 'Budgets' });
    }
    if (unassigned.length) items.push({ key: 'unassigned', text: `${plural(unassigned.length, 'expense')} this year ${unassigned.length === 1 ? 'isn’t' : 'aren’t'} taken from any avenue budget.`, go: 'finance', filter: 'budgets', action: 'Pick avenues' });
    if (thisYear.some((e) => e.type === 'expense') && !heads.some((h) => Number(h.amount) > 0)) items.push({ key: 'nobudget', text: `No avenue budgets set for ${year} yet.`, go: 'finance', filter: 'budgets', action: 'Set budgets' });
  }
  return items;
}
const daysBetween = (a, b) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);

/** Smooth line through points (Catmull-Rom turned into Bézier curves). */
function smooth(points) {
  let d = `M${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const [p0, p1, p2, p3] = [points[i - 1] ?? points[i], points[i], points[i + 1], points[i + 2] ?? points[i + 1]];
    d += ` C${p1[0] + (p2[0] - p0[0]) / 6},${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6},${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]},${p2[1]}`;
  }
  return d;
}

/** Projects per month across the Rotaract year, drawn as a striped, colour-graded area. */
function ProjectsChart({ events, yearStart, label }) {
  const id = useId().replace(/:/g, '');
  const months = Array.from({ length: 12 }, (_, i) => { const m = (6 + i) % 12; return { y: m >= 6 ? yearStart : yearStart + 1, m }; });
  const counts = months.map(({ y, m }) => events.filter((e) => e.date.startsWith(`${y}-${String(m + 1).padStart(2, '0')}`)).length);
  const total = counts.reduce((a, b) => a + b, 0);
  const max = Math.max(...counts, 1);
  const [W, H, top] = [600, 190, 24];
  const pts = counts.map((c, i) => [(i / 11) * W, H - 18 - ((c / max) * (H - top - 30)) - 6]);
  const area = `${smooth(pts)} L${W},${H} L0,${H} Z`;
  const busiest = counts.indexOf(Math.max(...counts));
  return (
    <section className="adm-card adm-chart-card">
      <div className="adm-card-top">
        <h3>Projects over time</h3>
        <span className="adm-chip-num is-green">{total} in {label}</span>
      </div>
      <div className="adm-legend">Busiest month: {MONTHS_LONG[months[busiest].m]} · {counts[busiest]} {counts[busiest] === 1 ? 'project' : 'projects'}</div>
      <svg className="adm-chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={`Projects each month: ${months.map(({ m }, i) => `${MONTHS[m]} ${counts[i]}`).join(', ')}`}>
        <defs>
          <linearGradient id={`${id}g`} x1="0" x2="0" y1="0" y2="1" gradientUnits="objectBoundingBox">
            <stop offset="0" stopColor="#f4a261" /><stop offset=".45" stopColor="#e9c46a" /><stop offset="1" stopColor="#8bd17c" />
          </linearGradient>
          <linearGradient id={`${id}h`} x1="0" x2={W} y1="0" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#8bd17c" /><stop offset=".35" stopColor="#f28b82" /><stop offset=".7" stopColor="#f6c453" /><stop offset="1" stopColor="#8bd17c" />
          </linearGradient>
          <pattern id={`${id}p`} width="4.6" height="10" patternUnits="userSpaceOnUse"><rect width="1.8" height="10" fill="#fff" /></pattern>
          <mask id={`${id}m`}><rect width={W} height={H} fill={`url(#${id}p)`} /></mask>
        </defs>
        <g mask={`url(#${id}m)`}><path d={area} fill={`url(#${id}h)`} /></g>
      </svg>
      <div className="adm-chart-months" aria-hidden="true">{months.map(({ m }, i) => <span key={i}>{MONTHS[m][0]}</span>)}</div>
    </section>
  );
}

function CalendarCard({ events, photoOf, go }) {
  const now = new Date();
  const [y, m] = [now.getFullYear(), now.getMonth()];
  const first = (new Date(y, m, 1).getDay() + 6) % 7; // Monday first
  const days = new Date(y, m + 1, 0).getDate();
  const today = todayIso();
  const iso = (d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const on = (d) => events.filter((e) => e.date <= iso(d) && (e.endDate || e.date) >= iso(d));
  const upcoming = events.filter((e) => !isCompleted(e, today)).sort((a, b) => a.date.localeCompare(b.date));
  const list = (upcoming.length ? upcoming : [...events].sort((a, b) => b.date.localeCompare(a.date))).slice(0, 2);
  return (
    <section className="adm-card adm-cal">
      <div className="adm-card-top"><h3>{MONTHS_LONG[m]} {y}</h3><span className="adm-hint">This month</span></div>
      <div className="adm-cal-grid" role="grid" aria-label={`${MONTHS_LONG[m]} ${y}`}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <span key={i} className="adm-cal-dow">{d}</span>)}
        {Array.from({ length: first }, (_, i) => <span key={`b${i}`} />)}
        {Array.from({ length: days }, (_, i) => {
          const d = i + 1;
          const evs = on(d);
          const photo = evs.map(photoOf).find(Boolean);
          const cls = `adm-cal-day${iso(d) === today ? ' is-today' : ''}${evs.length ? ' has-event' : ''}${photo ? ' has-photo' : ''}`;
          return (
            <button key={d} type="button" className={cls} title={evs.map((e) => e.title).join(', ') || undefined} onClick={evs.length ? () => go('events', 'all') : undefined} tabIndex={evs.length ? 0 : -1}
              style={photo ? { backgroundImage: `linear-gradient(rgba(0,0,0,.28), rgba(0,0,0,.28)), url("${optimized(photo, 96)}")` } : undefined}>
              {d}
            </button>
          );
        })}
      </div>
      <div className="adm-card-top adm-cal-next"><h3>{upcoming.length ? 'Up next' : 'Latest'}</h3><span className="adm-hint">{plural(upcoming.length, 'upcoming event')}</span></div>
      <ul className="adm-next">
        {list.map((e) => (
          <li key={e.slug}>
            <button type="button" onClick={() => go('events', upcoming.length ? 'upcoming' : 'all')}>
              <Thumb src={photoOf(e)} fallback={e.title.slice(0, 1)} round />
              <span className="adm-next-text"><strong>{e.title}</strong><span>{e.venue}</span></span>
              <span className="adm-time-pill">{shortDate(e.date)}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** A role's short code, e.g. "Club Service Director (CSD)" -> "CSD". */
const roleCode = (role) => role.match(/\(([A-Z]{2,6})\)/)?.[1] ?? '';
const roleName = (role) => role.replace(/\s*\([A-Z]{2,6}\)\s*$/, '');

function BoardCard({ team, memberPhoto, go }) {
  const core = team.coreMembers;
  const holder = (re) => core.find((p) => p.roles.some((r) => re.test(r.trim())));
  const trio = [holder(/^president$/i), holder(/^secretary$/i), holder(/^treasurer$/i)];
  const shown = trio.every(Boolean) ? trio : core.slice(0, 3);
  const others = [...core, ...team.boardOfDirectors].filter((p, i, all) => !shown.some((x) => x.name === p.name) && all.findIndex((y) => y.name === p.name) === i);
  const rest = others.slice(0, 7);
  return (
    <section className="adm-card adm-board">
      <div className="adm-card-top"><h3>Office bearers</h3><span className="adm-chip-num is-green">{team.rotaractYear}</span></div>
      <div className="adm-officers">
        {shown.map((p) => (
          <button key={p.name} type="button" className="adm-officer-tile" onClick={() => go('team')}>
            <Thumb src={memberPhoto(p)} fallback={initials(p.name)} w={384} />
            <span className="adm-officer-caption">
              <strong>{p.name.replace(/^Rtr\.?\s*/i, '').split(' ')[0]}</strong>
              <span>{roleName(p.roles[0])}</span>
            </span>
          </button>
        ))}
      </div>
      <ul className="adm-board-list">
        {rest.map((p) => (
          <li key={p.name}>
            <Thumb src={memberPhoto(p)} fallback={initials(p.name)} round />
            <span className="adm-next-text"><strong>{p.name.replace(/^Rtr\.?\s*/i, '')}</strong><span>{roleName(p.roles[0])}</span></span>
            {roleCode(p.roles[0]) && <span className="adm-role-code">{roleCode(p.roles[0])}</span>}
          </li>
        ))}
      </ul>
      <button type="button" className="adm-link adm-card-foot" onClick={() => go('team')}>See the full team</button>
    </section>
  );
}

export default function OverviewTab({ draft, hasPhoto, photoOf, memberPhoto, memberHasPhoto, go, addEvent, history, onRestore, restoring, canSave, unsaved }) {
  const today = todayIso();
  const upcoming = draft.events.filter((e) => !isCompleted(e, today)).sort((a, b) => a.date.localeCompare(b.date));
  const yearStart = Number.parseInt(draft.team.rotaractYear, 10) || currentRotaryStart();
  const inYear = draft.events.filter((e) => e.date >= `${yearStart}-07-01` && e.date < `${yearStart + 1}-07-01`);
  const thisMonth = draft.events.filter((e) => e.date.startsWith(today.slice(0, 7))).length;
  const people = new Set(LISTS.flatMap(([k]) => draft.team[k].map((p) => p.name).filter(Boolean))).size;
  const withPhotos = LISTS.flatMap(([k]) => draft.team[k]).filter((p) => p.name && memberHasPhoto(p)).length;
  const done = draft.events.filter((e) => isCompleted(e, today));
  const complete = done.filter((e) => !eventGaps(e, hasPhoto, today).length).length;
  const pct = done.length ? Math.round((complete / done.length) * 100) : 100;
  const items = attentionItems({ draft, hasPhoto, memberHasPhoto });
  const lower = useNextFrame(); // the calendar, team and to-do cards follow a frame after the top of the page
  const stats = [
    { label: 'Upcoming events', value: upcoming.length, chip: upcoming[0] ? shortDate(upcoming[0].date) : null, tone: 'green', sub: upcoming[0] ? `Next: ${upcoming[0].title}` : 'None planned yet', go: () => go('events', 'upcoming') },
    { label: `Projects in ${draft.team.rotaractYear}`, value: inYear.length, chip: thisMonth ? `+${thisMonth}` : null, tone: 'green', sub: thisMonth ? `${plural(thisMonth, 'project')} this month` : `${draft.events.length} on the website in all`, go: () => go('events', 'all') },
    { label: 'Team members', value: people, chip: `${Math.round((withPhotos / Math.max(1, LISTS.flatMap(([k]) => draft.team[k]).length)) * 100)}%`, tone: 'green', sub: 'have a photo', go: () => go('team') },
    { label: 'Gallery photos', value: draft.gallery.length, chip: draft.reviews.length ? `${draft.reviews.length} ★` : null, tone: 'green', sub: plural(draft.reviews.length, 'review'), go: () => go('gallery') },
  ];
  return (
    <div className="adm-tab">
      <SectionHead title="Overview" desc="The club website at a glance." />
      <div className="adm-stats">
        {stats.map(({ label, value, chip, tone, sub, go: onClick }) => (
          <button key={label} type="button" className="adm-stat" onClick={onClick}>
            <span className="adm-stat-label">{label}</span>
            <span className="adm-stat-row"><strong>{value}</strong>{chip && <span className={`adm-chip-num is-${tone}`}>{chip}</span>}</span>
            <span className="adm-stat-sub">{sub}</span>
          </button>
        ))}
      </div>

      <div className="adm-ov-grid">
        <ProjectsChart events={draft.events} yearStart={yearStart} label={draft.team.rotaractYear} />
        <section className="adm-card adm-progress-card">
          <div className="adm-card-top"><span className="adm-hint">Completed projects</span><span className={`adm-chip-text ${pct >= 60 ? 'is-green' : 'is-red'}`}>{pct}%</span></div>
          <strong className="adm-big">{done.length}</strong>
          <div className="adm-progress">
            <span className="adm-progress-fill" style={{ width: `max(${pct}%, 150px)` }}>Photo and report</span>
            <span className="adm-progress-rest">{done.length - complete} to finish</span>
          </div>
          <ul className="adm-mini">
            <li><span>With a photo</span><strong>{done.filter(hasPhoto).length} / {done.length}</strong></li>
            <li><span>With a report or results</span><strong>{done.filter((e) => !eventGaps(e, hasPhoto, today).includes('No report')).length} / {done.length}</strong></li>
            <li><span>Upcoming</span><strong>{upcoming.length}</strong></li>
          </ul>
          <button type="button" className="adm-link adm-card-foot" onClick={() => go('events', 'needs')}>Finish them</button>
        </section>
        {lower && <CalendarCard events={draft.events} photoOf={photoOf} go={go} />}
        {lower && <BoardCard team={draft.team} memberPhoto={memberPhoto} go={go} />}
        {lower && (
        <section className="adm-card adm-attention">
          <div className="adm-card-top"><h3>Needs attention</h3><span className="adm-hint">{items.length || ''}</span></div>
          {items.length ? (
            <ul className="adm-todo">
              {items.map((it) => (
                <li key={it.key}>
                  {it.tone === 'info' ? <FaBell className="adm-todo-icon is-info" aria-hidden="true" /> : <FaTriangleExclamation className="adm-todo-icon" aria-hidden="true" />}
                  <span>{it.text}</span>
                  <button type="button" className="adm-btn is-ghost is-small" onClick={() => go(it.go, it.filter)}>{it.action}</button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="adm-allgood"><FaCircleCheck aria-hidden="true" /> Everything looks complete.</p>
          )}
          <div className="adm-card-foot adm-quick-wrap">
            <h3>Quick actions</h3>
            <div className="adm-quick">
              <button type="button" className="adm-btn is-small" onClick={addEvent}><FaPlus size={11} aria-hidden="true" /> Add an event</button>
              <button type="button" className="adm-btn is-ghost is-small" onClick={() => go('gallery')}>Gallery photos</button>
              <button type="button" className="adm-btn is-ghost is-small" onClick={() => go('finance')}>Income or expense</button>
              <button type="button" className="adm-btn is-ghost is-small" onClick={() => go('team')}>Edit the team</button>
            </div>
          </div>
        </section>
        )}
      </div>

      <div>
        {canSave && (
          <section className="adm-card">
            <h3><FaClockRotateLeft size={15} aria-hidden="true" /> Recent saves</h3>
            <p className="adm-hint">Made a mistake? Go back to how the content was after an earlier save. Photos are never deleted.</p>
            {history === null && <p className="adm-hint">Loading…</p>}
            {history?.length === 0 && <p className="adm-hint">No saves yet.</p>}
            {history?.length > 0 && (
              <ol className="adm-history">
                {history.slice(0, 6).map((h, i) => (
                  <li key={h.sha}>
                    <span className="adm-history-when">{whenSaved(h.date)}</span>
                    <span className="adm-history-what">{h.message.replace(/^Admin page: /, '').replace(/^update /, 'Updated ').replace(/^go back/, 'Went back')}</span>
                    {i === 0 ? <span className="adm-badge is-green">Current</span> : (
                      <button type="button" className="adm-btn is-ghost is-small" disabled={Boolean(restoring) || unsaved} title={unsaved ? 'Save or undo your changes first' : undefined} onClick={() => onRestore(h)}>
                        {restoring === h.sha ? 'Going back…' : 'Go back'}
                      </button>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
