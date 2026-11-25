'use client';

import { FaCalendarDays, FaCircleCheck, FaClockRotateLeft, FaImages, FaPlus, FaTriangleExclamation, FaUsers } from 'react-icons/fa6';
import { eventGaps } from './events';
import { LISTS } from './team';
import { SectionHead, isCompleted, niceDate, plural, todayIso, whenSaved } from './shared';

/** The Rotaract year that runs now (1 July to 30 June), as its first calendar year. */
const currentRotaryStart = () => { const d = new Date(); return d.getMonth() >= 6 ? d.getFullYear() : d.getFullYear() - 1; };

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
  return items;
}

export default function OverviewTab({ draft, hasPhoto, memberHasPhoto, go, addEvent, history, onRestore, restoring, canSave, unsaved }) {
  const today = todayIso();
  const upcoming = draft.events.filter((e) => !isCompleted(e, today)).sort((a, b) => a.date.localeCompare(b.date));
  const yearStart = Number.parseInt(draft.team.rotaractYear, 10);
  const thisYear = yearStart ? draft.events.filter((e) => e.date >= `${yearStart}-07-01` && e.date < `${yearStart + 1}-07-01`).length : draft.events.length;
  const people = new Set(LISTS.flatMap(([k]) => draft.team[k].map((p) => p.name).filter(Boolean))).size;
  const items = attentionItems({ draft, hasPhoto, memberHasPhoto });
  const stats = [
    { label: 'Upcoming events', value: upcoming.length, sub: upcoming[0] ? `Next: ${upcoming[0].title}, ${niceDate(upcoming[0].date)}` : 'None planned yet', Icon: FaCalendarDays, tone: 'coral', go: () => go('events', 'upcoming') },
    { label: `Events in ${draft.team.rotaractYear}`, value: thisYear, sub: `${draft.events.length} on the website in all`, Icon: FaCircleCheck, tone: 'mint', go: () => go('events', 'all') },
    { label: 'Team members', value: people, sub: `Rotaract year ${draft.team.rotaractYear}`, Icon: FaUsers, tone: 'blue', go: () => go('team') },
    { label: 'Gallery photos', value: draft.gallery.length, sub: `${plural(draft.reviews.length, 'review')}`, Icon: FaImages, tone: 'sun', go: () => go('gallery') },
  ];
  return (
    <div className="adm-tab">
      <SectionHead title="Overview" desc="The club website at a glance." />
      <div className="adm-stats">
        {stats.map(({ label, value, sub, Icon, tone, go: onClick }) => (
          <button key={label} type="button" className="adm-stat" onClick={onClick}>
            <span className={`adm-stat-icon is-${tone}`} aria-hidden="true"><Icon size={15} /></span>
            <strong>{value}</strong>
            <span className="adm-stat-label">{label}</span>
            <span className="adm-stat-sub">{sub}</span>
          </button>
        ))}
      </div>

      <div className="adm-two">
        <section className="adm-card">
          <h3>Needs attention</h3>
          {items.length ? (
            <ul className="adm-todo">
              {items.map((it) => (
                <li key={it.key}>
                  <FaTriangleExclamation className="adm-todo-icon" aria-hidden="true" />
                  <span>{it.text}</span>
                  <button type="button" className="adm-btn is-ghost is-small" onClick={() => go(it.go, it.filter)}>{it.action}</button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="adm-allgood"><FaCircleCheck aria-hidden="true" /> Everything looks complete.</p>
          )}
        </section>
        <section className="adm-card">
          <h3>Quick actions</h3>
          <div className="adm-quick">
            <button type="button" className="adm-btn" onClick={addEvent}><FaPlus size={12} aria-hidden="true" /> Add an event</button>
            <button type="button" className="adm-btn is-ghost" onClick={() => go('gallery')}>Add gallery photos</button>
            <button type="button" className="adm-btn is-ghost" onClick={() => go('team')}>Edit the team</button>
            <a className="adm-btn is-ghost" href="/" target="_blank" rel="noreferrer">Open the website</a>
          </div>
        </section>
      </div>

      {canSave && (
        <section className="adm-card">
          <div className="adm-card-head">
            <div>
              <h3><FaClockRotateLeft size={15} aria-hidden="true" /> Recent saves</h3>
              <p className="adm-hint">Made a mistake? Go back to how the website’s content was after an earlier save. Photos are never deleted, and going back can be undone the same way.</p>
            </div>
          </div>
          {history === null && <p className="adm-hint">Loading…</p>}
          {history?.length === 0 && <p className="adm-hint">No saves yet.</p>}
          {history?.length > 0 && (
            <ol className="adm-history">
              {history.map((h, i) => (
                <li key={h.sha}>
                  <span className="adm-history-when">{whenSaved(h.date)}</span>
                  <span className="adm-history-what">{h.message.replace(/^Admin page: /, '').replace(/^update /, 'Updated ').replace(/^go back/, 'Went back')}{h.author ? <small> · {h.author}</small> : null}</span>
                  {i === 0 ? <span className="adm-badge is-green">Current</span> : (
                    <button type="button" className="adm-btn is-ghost is-small" disabled={Boolean(restoring) || unsaved} title={unsaved ? 'Save or undo your changes first' : undefined} onClick={() => onRestore(h)}>
                      {restoring === h.sha ? 'Going back…' : 'Go back to this'}
                    </button>
                  )}
                </li>
              ))}
            </ol>
          )}
        </section>
      )}
    </div>
  );
}
