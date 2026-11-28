import { randomBytes } from 'node:crypto';
import { readText, commitFiles, ConflictError } from './github.js';
import { encrypt, decrypt } from './finance.js';

/**
 * Join requests: applications sent from the website's Join page, kept ENCRYPTED in the repository (names,
 * phone numbers and emails stay private), with the same key as the finance sheet. Only the Admin Portal can
 * read them. Server only.
 */
export const JOINS_FILE = 'data/private/joins.enc.json';
export const JOIN_STATUSES = ['new', 'contacted', 'joined', 'declined'];
const MAX_KEPT = 400;
const MAX_PER_HOUR = 15; // for the whole site, whoever sends them

/** Too many requests arrived recently, or the inbox is full of open requests. */
export class JoinsBusyError extends Error {}

const clip = (v, max) => (typeof v === 'string' ? v.replace(/[ \t ]+/g, ' ').trim().slice(0, max) : '');
const clipText = (v, max) => (typeof v === 'string' ? v.replace(/\r/g, '').replace(/[ \t ]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim().slice(0, max) : '');

/** A request as typed on the website, checked. Returns null when it isn't a real application. */
export function cleanApplication(body) {
  const name = clip(body?.name, 80);
  const email = clip(body?.email, 120).toLowerCase();
  const phone = clip(body?.phone, 20).replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
  const why = clipText(body?.why, 1500);
  if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^\d{10}$/.test(phone) || why.length < 20) return null;
  return { name, email, phone, occupation: clip(body?.occupation, 100), avenue: clip(body?.avenue, 60), why };
}

async function load() {
  const file = await readText(JOINS_FILE);
  return { list: file ? (decrypt(file.text).requests ?? []) : [], sha: file?.sha ?? null };
}

/** Reads the requests, changes them with `change(list)`, and saves; tries again if someone saved meanwhile. */
async function update(change, message) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const { list, sha } = await load();
    const next = change(list);
    try {
      await commitFiles([{ path: JOINS_FILE, content: encrypt({ requests: next }) }], message, sha ? { [JOINS_FILE]: sha } : {});
      return next;
    } catch (e) {
      if (!(e instanceof ConflictError) || attempt === 3) throw e;
    }
  }
  return null;
}

export async function listRequests() {
  return (await load()).list;
}

export async function addRequest(app) {
  const entry = { id: `${Date.now().toString(36)}-${randomBytes(3).toString('hex')}`, at: new Date().toISOString(), status: 'new', ...app };
  await update((list) => {
    const hourAgo = new Date(Date.now() - 3600000).toISOString();
    if (list.filter((r) => r.at > hourAgo).length >= MAX_PER_HOUR) throw new JoinsBusyError('too many in the last hour');
    let next = [entry, ...list];
    // When the list is full, the oldest answered requests make room. Open ones are never dropped.
    if (next.length > MAX_KEPT) {
      const closed = next.filter((r) => r.status !== 'new' && r.status !== 'contacted').sort((a, b) => a.at.localeCompare(b.at));
      if (!closed.length) throw new JoinsBusyError('inbox full');
      const drop = new Set(closed.slice(0, next.length - MAX_KEPT).map((r) => r.id));
      next = next.filter((r) => !drop.has(r.id));
      if (next.length > MAX_KEPT) throw new JoinsBusyError('inbox full');
    }
    return next;
  }, 'Website: new join request\n\nSaved from the Join page (encrypted).');
  return entry;
}

/** { id, status?, note?, remove? } from the Admin Portal. */
export async function changeRequest({ id, status, note, remove }) {
  if (typeof id !== 'string') return null;
  if (status !== undefined && !JOIN_STATUSES.includes(status)) return null;
  return update((list) => (remove ? list.filter((r) => r.id !== id) : list.map((r) => (r.id !== id ? r : {
    ...r,
    ...(status ? { status, [`${status}At`]: new Date().toISOString() } : {}),
    ...(note !== undefined ? { note: clipText(note, 500) } : {}),
  }))), `Admin page: update join requests\n\nSaved from the website's admin page (encrypted).`);
}
