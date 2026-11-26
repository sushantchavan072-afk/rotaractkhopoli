'use client';

import { useEffect, useMemo, useState } from 'react';
import { FaArrowUpRightFromSquare, FaChevronLeft, FaCopy, FaPlus, FaTrashCan, FaWandMagicSparkles, FaXmark } from 'react-icons/fa6';
import { PillSelect, Segmented } from '../ui';
import {
  Badge, Empty, Field, PhotoButton, SectionHead, Thumb, api, isCompleted, monthLabel, niceDate, plural, preparePhoto, slugify, tag, todayIso,
} from './shared';

/** What an event is still missing (only completed events are expected to have a photo and a write-up). */
export function eventGaps(e, hasPhoto, today = todayIso()) {
  if (!isCompleted(e, today)) return [];
  const gaps = [];
  if (!hasPhoto(e)) gaps.push('No photo');
  if (!String(e.report ?? '').trim() && !(e.outcomes ?? []).some((o) => o.value.trim())) gaps.push('No report');
  return gaps;
}

export const blankEvent = (avenue) => ({ _new: true, slug: '', title: '', date: todayIso(), venue: '', avenue, summary: '', report: '', outcomes: [] });

function EventEditor({ event, avenueOptions, photoSrc, photoUrl, onChange, onPhoto, onExtraPhotos, onAutofill, onDuplicate, onDelete, onClose, busy }) {
  const set = (patch) => onChange({ ...event, ...patch });
  const isNew = Boolean(event._new);
  const outcomes = event.outcomes ?? [];
  const others = event.otherAvenues ?? [];
  const extra = event.gallery ?? [];
  return (
    <div className="adm-editor">
      <div className="adm-editor-top">
        <button type="button" className="adm-back" onClick={onClose}><FaChevronLeft size={12} aria-hidden="true" /> All events</button>
        <div className="adm-editor-tools">
          {!isNew && event.slug && (
            <a className="adm-btn is-ghost is-small" href={`/events/${event.slug}`} target="_blank" rel="noreferrer">
              <FaArrowUpRightFromSquare size={12} aria-hidden="true" /> View on website
            </a>
          )}
          <button type="button" className="adm-btn is-ghost is-small" onClick={onDuplicate}><FaCopy size={12} aria-hidden="true" /> Duplicate</button>
        </div>
      </div>
      <h2 className="adm-editor-title">{isNew ? (event.title || 'New event') : event.title || 'Event'}</h2>

      <section className="adm-card adm-autofill">
        <span className="adm-autofill-icon" aria-hidden="true"><FaWandMagicSparkles size={16} /></span>
        <div className="adm-autofill-text">
          <strong>Auto-fill from a photo</strong>
          <span>{isNew ? 'Choose a photo of the poster or invitation: the title, date, venue, avenue and summary are filled in for you to check.' : 'Choose a photo of the poster or report to fill in anything still empty.'}</span>
        </div>
        <PhotoButton label="Choose a photo" busy={busy === 'read'} className="adm-btn is-small" onFile={onAutofill} />
      </section>

      <section className="adm-card">
        <h3>The basics</h3>
        <div className="adm-grid">
          <Field label="Title" wide>
            {(id) => <input id={id} value={event.title} maxLength={140} placeholder="For example: Tree Plantation Drive" onChange={(e) => set(isNew && (!event.slug || event.slug === slugify(event.title)) ? { title: e.target.value, slug: slugify(e.target.value) } : { title: e.target.value })} />}
          </Field>
          {isNew && (
            <Field label="Web address" hint={`The event's page will be /events/${event.slug || '…'}. It can't be changed after saving.`} wide>
              {(id) => <input id={id} value={event.slug} maxLength={80} onChange={(e) => set({ slug: slugify(e.target.value) })} />}
            </Field>
          )}
          <Field label="Date">{(id) => <input id={id} type="date" value={event.date} onChange={(e) => set({ date: e.target.value })} />}</Field>
          <Field label="Last day (optional)" hint="Only for events over several days.">
            {(id) => <input id={id} type="date" value={event.endDate ?? ''} min={event.date} onChange={(e) => set({ endDate: e.target.value || undefined })} />}
          </Field>
          <Field label="Time (optional)">{(id) => <input id={id} value={event.time ?? ''} maxLength={60} placeholder="6:00 PM – 8:00 PM" onChange={(e) => set({ time: e.target.value || undefined })} />}</Field>
          <Field label="Venue">{(id) => <input id={id} value={event.venue} maxLength={160} placeholder="For example: Rotary Bhavan, Khopoli" onChange={(e) => set({ venue: e.target.value })} />}</Field>
        </div>
      </section>

      <section className="adm-card">
        <h3>Avenue and partners</h3>
        <div className="adm-grid">
          <Field label="Avenue">
            <PillSelect options={avenueOptions} value={event.avenue} ariaLabel="Avenue" onChange={(v) => set({ avenue: v, otherAvenues: others.filter((a) => a !== v) })} />
          </Field>
          <Field label="With (optional)" hint="Partner clubs or organisations.">
            {(id) => <input id={id} value={event.partner ?? ''} maxLength={300} onChange={(e) => set({ partner: e.target.value || undefined })} />}
          </Field>
          <div className="field adm-field is-wide">
            <span className="adm-label">Also counts towards (optional)</span>
            <div className="adm-chips">
              {avenueOptions.filter((a) => a !== event.avenue).map((a) => (
                <button
                  key={a} type="button" className="adm-chip" aria-pressed={others.includes(a)}
                  onClick={() => { const next = others.includes(a) ? others.filter((x) => x !== a) : [...others, a]; set({ otherAvenues: next.length ? next : undefined }); }}
                >{a}</button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="adm-card">
        <h3>Write-up</h3>
        <div className="adm-grid">
          <Field label="Short summary" hint={`${(event.summary ?? '').length}/400 · Shown on the event cards.`} wide>
            {(id) => <textarea id={id} rows={3} maxLength={400} value={event.summary} onChange={(e) => set({ summary: e.target.value })} />}
          </Field>
          <Field label="Full report (optional)" hint="What happened, who took part, what it achieved. Leave a blank line between paragraphs." wide>
            {(id) => <textarea id={id} rows={7} value={event.report ?? ''} onChange={(e) => set({ report: e.target.value })} />}
          </Field>
          <div className="field adm-field is-wide">
            <span className="adm-label">Results (optional)</span>
            <small className="adm-hint">Numbers shown on the event page, for example “120 · Saplings planted”.</small>
            {outcomes.map((o, i) => (
              <div className="adm-outcome" key={i}>
                <input aria-label="Number" placeholder="120" maxLength={30} value={o.value} onChange={(e) => set({ outcomes: outcomes.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)) })} />
                <input aria-label="What it counts" placeholder="Saplings planted" maxLength={60} value={o.label} onChange={(e) => set({ outcomes: outcomes.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} />
                <button type="button" className="adm-icon" aria-label="Remove this result" onClick={() => set({ outcomes: outcomes.filter((_, j) => j !== i) })}><FaXmark size={13} /></button>
              </div>
            ))}
            {outcomes.length < 8 && <button type="button" className="adm-link" onClick={() => set({ outcomes: [...outcomes, { value: '', label: '' }] })}>+ Add a result</button>}
          </div>
        </div>
      </section>

      <section className="adm-card">
        <h3>Photos</h3>
        <div className="adm-photo-row">
          <Thumb src={photoSrc} alt="" fallback="No photo yet" className="is-cover" w={640} />
          <div className="adm-photo-actions">
            <span className="adm-label">Main photo</span>
            <small className="adm-hint">Shown on the event card and at the top of its page. A wide photo works best.</small>
            <div className="adm-row-actions">
              <PhotoButton label={photoSrc ? 'Change photo' : 'Add a photo'} busy={busy === 'main'} onFile={onPhoto} />
              {event.image && <button type="button" className="adm-link" onClick={() => set({ image: undefined })}>Remove</button>}
            </div>
          </div>
        </div>
        <div className="adm-album">
          <div className="adm-album-head">
            <span className="adm-label">More photos (optional)</span>
            <small className="adm-hint">Shown as a small gallery on the event’s page, up to 12.</small>
          </div>
          {extra.length > 0 && (
            <ul className="adm-album-grid">
              {extra.map((src) => (
                <li key={src}>
                  <Thumb src={photoUrl(src)} alt="" fallback="Photo" />
                  <button type="button" className="adm-icon is-on-photo" aria-label="Remove this photo" onClick={() => set({ gallery: extra.filter((x) => x !== src).length ? extra.filter((x) => x !== src) : undefined })}><FaXmark size={12} /></button>
                </li>
              ))}
            </ul>
          )}
          {extra.length < 12 && <PhotoButton label="+ Add photos" multiple busy={busy === 'extra'} onFile={onExtraPhotos} />}
        </div>
      </section>

      <div className="adm-editor-foot">
        <button type="button" className="adm-btn" onClick={onClose}>Done</button>
        <button type="button" className="adm-link is-danger" onClick={onDelete}><FaTrashCan size={12} aria-hidden="true" /> Delete this event</button>
      </div>
    </div>
  );
}

const FILTERS = [['all', 'All'], ['upcoming', 'Upcoming'], ['completed', 'Completed'], ['needs', 'Needs work']];

export default function EventsTab({ events, editing, setEditing, filter, setFilter, hasPhoto, photoOf, photoUrl, avenueOptions, update, addUpload, notify }) {
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(null);
  const today = todayIso();
  const counts = useMemo(() => ({
    upcoming: events.filter((e) => !isCompleted(e, today)).length,
    completed: events.filter((e) => isCompleted(e, today)).length,
    needs: events.filter((e) => eventGaps(e, hasPhoto, today).length).length,
  }), [events, hasPhoto, today]);
  const shown = useMemo(() => events.map((e, i) => ({ e, i }))
    .filter(({ e }) => (filter === 'upcoming' ? !isCompleted(e, today) : filter === 'completed' ? isCompleted(e, today) : filter === 'needs' ? eventGaps(e, hasPhoto, today).length > 0 : true))
    .filter(({ e }) => !query || `${e.title} ${e.venue} ${e.avenue} ${e.partner ?? ''}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => (filter === 'upcoming' ? (a.e.date || '').localeCompare(b.e.date || '') : (b.e.date || '').localeCompare(a.e.date || ''))), [events, filter, query, hasPhoto, today]);
  // The first rows appear at once and the rest a frame later, so opening Events never stalls an animation.
  const [allRows, setAllRows] = useState(false);
  useEffect(() => { const r = requestAnimationFrame(() => setAllRows(true)); return () => cancelAnimationFrame(r); }, []);
  const groups = [];
  for (const row of allRows ? shown : shown.slice(0, 12)) {
    const label = row.e.date ? monthLabel(row.e.date) : 'No date';
    if (groups.at(-1)?.label !== label) groups.push({ label, rows: [] });
    groups.at(-1).rows.push(row);
  }

  const current = editing !== null ? events[editing] : null;
  // Applied to the latest version of the list (a photo can finish uploading after other edits).
  const setCurrent = (patch) => update((list) => list.map((e, j) => (j === editing ? { ...e, ...(typeof patch === 'function' ? patch(e) : patch) } : e)));
  const open = (i) => { setEditing(i); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const add = () => { update([...events, blankEvent(avenueOptions[0])]); open(events.length); };
  const upload = async (files, kind) => {
    setBusy(kind);
    const added = [];
    try {
      for (const file of files) {
        const p = await preparePhoto(file, { max: 1600 });
        const src = `/images/events/${current.slug || 'event'}-${tag()}.jpg`;
        if (!addUpload(src, p)) break;
        added.push(src);
      }
    } catch (err) { notify(err.message); } finally { setBusy(null); }
    return added;
  };

  if (current) {
    return (
      <EventEditor
        event={current} avenueOptions={avenueOptions} photoSrc={photoOf(current)} photoUrl={photoUrl} busy={busy}
        onChange={(next) => update(events.map((e, j) => (j === editing ? next : e)))}
        onPhoto={async (file) => { const [src] = await upload([file], 'main'); if (src) setCurrent({ image: src }); }}
        onExtraPhotos={async (files) => {
          const room = 12 - (current.gallery?.length ?? 0);
          const added = await upload(files.slice(0, room), 'extra');
          if (added.length) setCurrent((e) => ({ gallery: [...(e.gallery ?? []), ...added] }));
          if (files.length > room) notify('An event can have up to 12 extra photos.', 'info');
        }}
        onAutofill={async (file) => {
          setBusy('read');
          try {
            const { data } = await preparePhoto(file, { max: 1600 });
            const { fields } = await api('POST', '/api/admin/autofill', { image: data });
            const fresh = Boolean(current._new);
            const patch = {};
            for (const [k, v] of Object.entries(fields)) {
              if (k === 'avenue' && !avenueOptions.includes(v)) continue;
              // A new event takes everything that was read; a saved one only fills what is still empty.
              if (fresh || !String(current[k] ?? '').trim()) patch[k] = v;
            }
            if (patch.title && fresh && (!current.slug || current.slug === slugify(current.title))) patch.slug = slugify(patch.title);
            if (patch.avenue) patch.otherAvenues = (current.otherAvenues ?? []).filter((a) => a !== patch.avenue);
            const names = { title: 'title', date: 'date', endDate: 'last day', time: 'time', venue: 'venue', avenue: 'avenue', partner: 'partners', summary: 'summary' };
            const filled = Object.keys(patch).filter((k) => names[k]).map((k) => names[k]);
            if (!filled.length) { notify('Nothing new could be read from that photo.', 'info'); return; }
            setCurrent(patch);
            notify(`Filled in from the photo: ${filled.join(', ')}. Please check them before saving.`, 'info');
          } catch (err) { notify(err.message); } finally { setBusy(null); }
        }}
        onDuplicate={() => {
          // A copy for a similar or repeating event: same details, new date and write-up.
          const copy = { ...blankEvent(current.avenue), title: `${current.title} (copy)`, slug: slugify(`${current.title} copy`), date: current.date, time: current.time, venue: current.venue, partner: current.partner, otherAvenues: current.otherAvenues, summary: current.summary };
          update([...events, copy]);
          open(events.length);
          notify('A copy was added. Change its title and date, then save.', 'info');
        }}
        onDelete={() => { if (window.confirm(`Delete “${current.title || 'this event'}” from the website?`)) { update(events.filter((_, j) => j !== editing)); setEditing(null); } }}
        onClose={() => setEditing(null)}
      />
    );
  }

  return (
    <div className="adm-tab">
      <SectionHead title="Events" desc={`${plural(events.length, 'event')} · ${counts.upcoming} upcoming`}>
        <button type="button" className="adm-btn" onClick={add}><FaPlus size={12} aria-hidden="true" /> Add an event</button>
      </SectionHead>
      <div className="adm-toolbar">
        <input className="adm-search" type="search" placeholder="Search by title, venue or avenue" aria-label="Search events" value={query} onChange={(e) => setQuery(e.target.value)} />
        <Segmented label="Show" options={FILTERS.map(([k, l]) => [k, k === 'all' ? l : `${l} ${counts[k]}`])} value={filter} onChange={setFilter} />
      </div>
      {!groups.length && (
        <Empty title={query ? `No events match “${query}”.` : filter === 'needs' ? 'Every completed event has a photo and a write-up.' : 'No events here yet.'}>
          {filter === 'needs' && !query ? 'Nice work.' : null}
        </Empty>
      )}
      {groups.map((g) => (
        <div key={g.label} className="adm-group">
          <h3 className="adm-group-title">{g.label}</h3>
          <ul className="adm-list">
            {g.rows.map(({ e, i }) => {
              const gaps = eventGaps(e, hasPhoto, today);
              return (
                <li key={`${e.slug}-${i}`}>
                  <button type="button" className="adm-row" onClick={() => open(i)}>
                    <Thumb src={photoOf(e)} fallback="" />
                    <span className="adm-row-text">
                      <strong>{e.title || 'Untitled event'}</strong>
                      <span>{niceDate(e.date)}{e.endDate ? ` – ${niceDate(e.endDate)}` : ''}{e.venue ? ` · ${e.venue}` : ''}</span>
                      <span className="adm-badges">
                        {e._new && <Badge tone="blue">New</Badge>}
                        {isCompleted(e, today) ? <Badge>Completed</Badge> : <Badge tone="green">Upcoming</Badge>}
                        {gaps.map((g2) => <Badge key={g2} tone="amber">{g2}</Badge>)}
                      </span>
                    </span>
                    <span className="adm-row-tag">{e.avenue}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
