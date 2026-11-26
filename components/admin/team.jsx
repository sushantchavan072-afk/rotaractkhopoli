'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FaArrowDown, FaArrowUp, FaPlus, FaWandMagicSparkles, FaXmark } from 'react-icons/fa6';
import { PhotoTap, SectionHead, initials, plural, preparePhoto, slugify, tag, useNextFrame } from './shared';

export const LISTS = [
  ['coreMembers', 'Office bearers', 'The core team, shown first on the Team and home pages.'],
  ['boardOfDirectors', 'Board of directors', 'Avenue directors and officers.'],
  ['chairpersons', 'Chairpersons', 'Chairs and heads of club activities.'],
];

/** The next Rotaract year after "2026–27": "2027–28". */
export const nextYear = (y) => { const m = /^(\d{4})\D+(\d{2,4})$/.exec(y || ''); return m ? `${Number(m[1]) + 1}–${String(Number(m[2].slice(-2)) + 1).padStart(2, '0')}` : ''; };

/** Roles as chips, with a field to add one. Matching roles already used in the team are suggested below it. */
function RolesInput({ roles, onChange, suggestions }) {
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const listId = useId();
  const q = text.trim().toLowerCase();
  const matches = suggestions.filter((r) => !roles.includes(r) && (!q || r.toLowerCase().includes(q))).slice(0, 8);
  const shown = open && matches.length > 0;
  // The list is drawn at the page's top level (cards clip what overflows them), just under the field.
  const wrap = useRef(null);
  const [pos, setPos] = useState(null);
  const place = () => { const r = wrap.current?.getBoundingClientRect(); if (r) setPos({ left: r.left, top: r.bottom + 6, width: r.width }); };
  useEffect(() => {
    if (!open) return undefined;
    const on = () => place();
    window.addEventListener('scroll', on, true);
    window.addEventListener('resize', on);
    return () => { window.removeEventListener('scroll', on, true); window.removeEventListener('resize', on); };
  }, [open]);
  const add = (value = text) => { const r = value.trim(); if (r && !roles.includes(r)) onChange([...roles, r]); setText(''); setActive(-1); };
  return (
    <div className="adm-roles" ref={wrap}>
      {roles.map((r) => (
        <span key={r} className="adm-chip is-on">{r}<button type="button" aria-label={`Remove the role ${r}`} onClick={() => onChange(roles.filter((x) => x !== r))}><FaXmark size={10} /></button></span>
      ))}
      <input
        value={text} placeholder={roles.length ? 'Add another role' : 'Add a role, e.g. Secretary'} aria-label="Add a role" enterKeyHint="done"
        role="combobox" aria-expanded={shown} aria-controls={listId} aria-autocomplete="list" aria-activedescendant={shown && active >= 0 ? `${listId}-${active}` : undefined}
        onChange={(e) => { setText(e.target.value); setOpen(true); setActive(-1); place(); }}
        onFocus={() => { setOpen(true); place(); }}
        onBlur={() => { setOpen(false); add(); }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' && matches.length) { e.preventDefault(); setOpen(true); setActive((i) => (i + 1) % matches.length); }
          else if (e.key === 'ArrowUp' && matches.length) { e.preventDefault(); setActive((i) => (i <= 0 ? matches.length - 1 : i - 1)); }
          else if (e.key === 'Escape') setOpen(false);
          else if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(shown && active >= 0 ? matches[active] : text); }
        }}
      />
      {shown && pos && createPortal(
        <ul id={listId} className="pill-select-list adm-role-suggest" role="listbox" aria-label="Roles used in the team" style={{ left: pos.left, top: pos.top, width: pos.width }}>
          {matches.map((r, i) => (
            <li
              key={r} id={`${listId}-${i}`} role="option" aria-selected={i === active} className={`pill-select-option${i === active ? ' is-active' : ''}`}
              onMouseDown={(e) => { e.preventDefault(); add(r); }} onMouseEnter={() => setActive(i)}
            >{r}</li>
          ))}
        </ul>,
        document.body,
      )}
    </div>
  );
}

function PeopleList({ title, desc, people, withBio, photoOf, onChange, onPhoto, busy, roleSuggestions }) {
  const set = (i, patch) => onChange(people.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  const move = (i, d) => { const next = [...people]; [next[i], next[i + d]] = [next[i + d], next[i]]; onChange(next); };
  return (
    <section className="adm-card">
      <div className="adm-card-head">
        <div>
          <h3>{title} <span className="adm-count">{people.length}</span></h3>
          <p className="adm-hint">{desc}</p>
        </div>
      </div>
      <ul className="adm-people">
        {people.map((p, i) => (
          <li key={i} className="adm-person">
            <PhotoTap src={photoOf(p)} fallback={initials(p.name)} busy={busy === p.name} label={`${photoOf(p) ? 'Change' : 'Add'} ${p.name || 'this person'}'s photo`} onFile={(f) => onPhoto(p.name, f)} />
            <div className="adm-person-fields">
              <input className="adm-person-name" aria-label="Name" placeholder="Rtr. Full Name" maxLength={80} value={p.name} onChange={(e) => set(i, { name: e.target.value })} />
              <RolesInput roles={p.roles} suggestions={roleSuggestions} onChange={(roles) => set(i, { roles })} />
              {withBio && <textarea aria-label="Short bio" placeholder="One or two sentences about what they look after (optional)" rows={2} maxLength={300} value={p.bio ?? ''} onChange={(e) => set(i, { bio: e.target.value || undefined })} />}
            </div>
            <div className="adm-person-tools">
              <button type="button" className="adm-icon" aria-label={`Move ${p.name || 'this person'} up`} disabled={i === 0} onClick={() => move(i, -1)}><FaArrowUp size={12} /></button>
              <button type="button" className="adm-icon" aria-label={`Move ${p.name || 'this person'} down`} disabled={i === people.length - 1} onClick={() => move(i, 1)}><FaArrowDown size={12} /></button>
              <button type="button" className="adm-icon is-danger" aria-label={`Remove ${p.name || 'this person'}`} onClick={() => { if (!p.name || window.confirm(`Remove ${p.name} from “${title}”?`)) onChange(people.filter((_, j) => j !== i)); }}><FaXmark size={13} /></button>
            </div>
          </li>
        ))}
      </ul>
      <button type="button" className="adm-btn is-ghost is-small" onClick={() => onChange([...people, withBio ? { name: '', roles: [], bio: '' } : { name: '', roles: [] }])}><FaPlus size={11} aria-hidden="true" /> Add a person</button>
    </section>
  );
}

export default function TeamTab({ team, photoOf, update, addUpload, notify }) {
  const [busy, setBusy] = useState(null);
  const set = (patch) => update((t) => ({ ...t, ...patch }));
  const officer = (role) => team.officers.find((o) => o.role === role) ?? { role, name: '', email: '', phone: '' };
  const setOfficer = (role, patch) => set({ officers: ['President', 'Secretary'].map((r) => (r === role ? { ...officer(r), ...patch } : officer(r))) });
  const roleSuggestions = useMemo(() => [...new Set(LISTS.flatMap(([k]) => team[k].flatMap((p) => p.roles)))].sort(), [team]);
  const rest = useNextFrame(); // the board and chairpersons follow a frame after the office bearers
  const people = new Set(LISTS.flatMap(([k]) => team[k].map((p) => p.name).filter(Boolean))).size;

  // A new photo is used for that person everywhere they appear on the Team page.
  const onPhoto = async (name, file) => {
    if (!name.trim()) { notify('Type the person’s name first, then add their photo.', 'info'); return; }
    setBusy(name);
    try {
      const p = await preparePhoto(file, { max: 800, square: true });
      const slug = `${slugify(name) || 'member'}-${tag()}`;
      if (!addUpload(`/images/members/${slug}.jpg`, p)) return;
      update((t) => Object.fromEntries(Object.entries(t).map(([k, v]) => [k, LISTS.some(([l]) => l === k) ? v.map((m) => (m.name === name ? { ...m, photo: slug } : m)) : v])));
    } catch (err) { notify(err.message); } finally { setBusy(null); }
  };
  // The contact people follow the office bearers holding those roles.
  const fillContacts = () => {
    const holder = (re) => team.coreMembers.find((m) => m.roles.some((r) => re.test(r.trim())));
    const found = { President: holder(/^president$/i), Secretary: holder(/^(club )?secretary$/i) };
    if (!found.President && !found.Secretary) { notify('No office bearer has the role “President” or “Secretary” yet.', 'info'); return; }
    set({ officers: ['President', 'Secretary'].map((role) => {
      const o = officer(role);
      const m = found[role];
      return m && m.name !== o.name ? { role, name: m.name, email: '', phone: '' } : o;
    }) });
    notify('Filled in from the office bearers. Add their email and phone if you want them on the Contact page.', 'info');
  };
  const suggested = nextYear(team.rotaractYear);
  return (
    <div className="adm-tab">
      <SectionHead title="Team" desc={`Rotaract year ${team.rotaractYear} · ${plural(people, 'person', 'people')}`} />
      <div className="adm-two">
        <section className="adm-card">
          <h3>Rotaract year</h3>
          <p className="adm-hint">Each July a new board takes office: change the year, then update the lists below. Photos stay with each person.</p>
          <div className="adm-inline">
            <input aria-label="Rotaract year" value={team.rotaractYear} maxLength={20} onChange={(e) => set({ rotaractYear: e.target.value })} />
            {suggested && <button type="button" className="adm-btn is-ghost is-small" onClick={() => set({ rotaractYear: suggested })}>Change to {suggested}</button>}
          </div>
        </section>
        <section className="adm-card">
          <div className="adm-card-head">
            <div>
              <h3>Contact people</h3>
              <p className="adm-hint">Shown on the Contact page. Website messages go to the club email (Club details), else the Secretary, else the President.</p>
            </div>
          </div>
          <button type="button" className="adm-link" onClick={fillContacts}><FaWandMagicSparkles size={12} aria-hidden="true" /> Fill in from the office bearers</button>
        </section>
      </div>
      <section className="adm-card">
        <h3>President and Secretary</h3>
        {['President', 'Secretary'].map((role) => (
          <div key={role} className="adm-officer">
            <strong>{role}</strong>
            <input aria-label={`${role}: name`} placeholder="Rtr. Full Name" maxLength={80} value={officer(role).name} onChange={(e) => setOfficer(role, { name: e.target.value })} />
            <input aria-label={`${role}: email`} type="email" inputMode="email" placeholder="Email (optional)" maxLength={120} value={officer(role).email} onChange={(e) => setOfficer(role, { email: e.target.value })} />
            <input aria-label={`${role}: phone`} type="tel" inputMode="tel" placeholder="Phone (optional)" maxLength={20} value={officer(role).phone} onChange={(e) => setOfficer(role, { phone: e.target.value })} />
          </div>
        ))}
      </section>
      {LISTS.filter(([k]) => rest || k === 'coreMembers').map(([k, title, desc]) => (
        <PeopleList key={k} title={title} desc={desc} people={team[k]} withBio={k === 'coreMembers'} photoOf={photoOf} busy={busy} roleSuggestions={roleSuggestions} onPhoto={onPhoto} onChange={(v) => set({ [k]: v })} />
      ))}
    </div>
  );
}
