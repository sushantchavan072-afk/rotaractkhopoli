'use client';

import { useId, useMemo, useState } from 'react';
import { FaArrowDown, FaArrowUp, FaPlus, FaWandMagicSparkles, FaXmark } from 'react-icons/fa6';
import { PhotoTap, SectionHead, initials, plural, preparePhoto, slugify, tag, useNextFrame } from './shared';

export const LISTS = [
  ['coreMembers', 'Office bearers', 'The core team, shown first on the Team and home pages.'],
  ['boardOfDirectors', 'Board of directors', 'Avenue directors and officers.'],
  ['chairpersons', 'Chairpersons', 'Chairs and heads of club activities.'],
];

/** The next Rotaract year after "2026–27": "2027–28". */
export const nextYear = (y) => { const m = /^(\d{4})\D+(\d{2,4})$/.exec(y || ''); return m ? `${Number(m[1]) + 1}–${String(Number(m[2].slice(-2)) + 1).padStart(2, '0')}` : ''; };

function RolesInput({ roles, onChange, listId }) {
  const [text, setText] = useState('');
  const add = () => { const r = text.trim(); if (r && !roles.includes(r)) onChange([...roles, r]); setText(''); };
  return (
    <div className="adm-roles">
      {roles.map((r) => (
        <span key={r} className="adm-chip is-on">{r}<button type="button" aria-label={`Remove the role ${r}`} onClick={() => onChange(roles.filter((x) => x !== r))}><FaXmark size={10} /></button></span>
      ))}
      <input
        list={listId} value={text} placeholder={roles.length ? 'Add another role' : 'Add a role, e.g. Secretary'} aria-label="Add a role" enterKeyHint="done"
        onChange={(e) => setText(e.target.value)} onBlur={add}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); } }}
      />
    </div>
  );
}

function PeopleList({ title, desc, people, withBio, photoOf, onChange, onPhoto, busy, roleList }) {
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
              <RolesInput roles={p.roles} listId={roleList} onChange={(roles) => set(i, { roles })} />
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
  const roleList = useId(); // one list of role suggestions shared by every person's role field
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
      <datalist id={roleList}>{roleSuggestions.map((r) => <option key={r} value={r} />)}</datalist>
      {LISTS.filter(([k]) => rest || k === 'coreMembers').map(([k, title, desc]) => (
        <PeopleList key={k} title={title} desc={desc} people={team[k]} withBio={k === 'coreMembers'} photoOf={photoOf} busy={busy} roleList={roleList} onPhoto={onPhoto} onChange={(v) => set({ [k]: v })} />
      ))}
    </div>
  );
}
