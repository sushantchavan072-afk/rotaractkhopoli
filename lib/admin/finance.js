import { createCipheriv, createDecipheriv, createHash, randomBytes, scryptSync } from 'node:crypto';
import { InvalidError } from './validate.js';

/**
 * The club's finance sheet (income and expenses), edited on the admin page.
 *
 * It is kept in the repository ENCRYPTED (AES-256-GCM), so the amounts and names stay private even if the
 * website's code is public: only the admin page, with the key, can read it. The key comes from FINANCE_KEY
 * in Vercel, or from ADMIN_PASSWORD when FINANCE_KEY is not set. Server only.
 */
export const FINANCE_FILE = 'data/private/finance.enc.json';

const secret = () => process.env.FINANCE_KEY || process.env.ADMIN_PASSWORD || '';
// v2 files: scrypt makes every password guess slow, so a copy of the repo can't be brute-forced offline.
// v1 files (one quick SHA-256) still open, and are written as v2 on their next save.
let cached = { secret: null, key: null };
const key = () => {
  if (cached.secret !== secret()) cached = { secret: secret(), key: scryptSync(secret(), 'rck-finance-v2', 32, { N: 1 << 15, maxmem: 64 * 1024 * 1024 }) };
  return cached.key;
};
const legacyKey = () => createHash('sha256').update(`rck-finance:${secret()}`).digest();
export const financeReady = () => secret().length >= 8;

export class LockedError extends Error {}

export function encrypt(data) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const body = Buffer.concat([cipher.update(JSON.stringify(data), 'utf8'), cipher.final()]);
  return Buffer.from(`${JSON.stringify({ v: 2, iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'), data: body.toString('base64') }, null, 2)}\n`);
}

export function decrypt(text) {
  try {
    const box = JSON.parse(text);
    const decipher = createDecipheriv('aes-256-gcm', box.v === 2 ? key() : legacyKey(), Buffer.from(box.iv, 'base64'));
    decipher.setAuthTag(Buffer.from(box.tag, 'base64'));
    return JSON.parse(Buffer.concat([decipher.update(Buffer.from(box.data, 'base64')), decipher.final()]).toString('utf8'));
  } catch {
    throw new LockedError('The finance records could not be opened with the current key (FINANCE_KEY, or ADMIN_PASSWORD when FINANCE_KEY is not set, was changed). Put the old value back in Vercel to open them.');
  }
}

export const emptyFinance = () => ({ openingBalances: {}, entries: [], budgets: {}, members: [], dues: {}, claims: [] });

const fail = (msg) => { throw new InvalidError(msg); };
const str = (v, max, label, required = false) => {
  const s = typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : '';
  if (required && !s) fail(`${label} is missing.`);
  if (s.length > max) fail(`${label} is too long (at most ${max} characters).`);
  return s;
};
const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && new Date(`${s}T00:00:00Z`).toISOString().startsWith(s);
const money = (n) => Math.round(Number(n) * 100) / 100;

export function cleanFinance(f) {
  if (!f || typeof f !== 'object' || !Array.isArray(f.entries) || f.entries.length > 5000) fail('The finance sheet is not valid.');
  const ids = new Set();
  const entries = f.entries.map((e, n) => {
    const at = `Finance entry ${n + 1}`;
    const id = str(e?.id, 40, `${at}: the id`, true);
    if (!/^[a-z0-9-]+$/.test(id) || ids.has(id)) fail(`${at}: the id is not valid.`);
    ids.add(id);
    const date = str(e.date, 10, `${at}: the date`, true);
    if (!isDate(date)) fail(`${at}: the date is not valid.`);
    if (e.type !== 'income' && e.type !== 'expense') fail(`${at}: choose income or expense.`);
    const amount = money(e.amount);
    if (!Number.isFinite(amount) || amount <= 0 || amount > 1e8) fail(`${at}: the amount must be more than 0.`);
    const out = { id, date, type: e.type, amount, category: str(e.category, 60, `${at}: the category`, true), description: str(e.description, 200, `${at}: the description`, true) };
    if (e.type === 'expense' && e.avenue) {
      const avenue = str(e.avenue, 8, `${at}: the avenue`);
      if (!/^[A-Z0-9]+$/.test(avenue)) fail(`${at}: the avenue is not valid.`);
      out.avenue = avenue;
    }
    for (const [k, max, label] of [['party', 100, 'the name'], ['mode', 30, 'the payment mode'], ['reference', 60, 'the reference'], ['event', 80, 'the event']]) {
      const v = str(e[k], max, `${at}: ${label}`);
      if (v) out[k] = v;
    }
    return out;
  }).sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
  const openingBalances = {};
  for (const [year, value] of Object.entries(f.openingBalances ?? {})) {
    if (!/^\d{4}–\d{2}$/.test(year)) continue;
    const v = money(value);
    if (Number.isFinite(v) && Math.abs(v) <= 1e9) openingBalances[year] = v;
  }
  // Avenue budgets per Rotaract year: [{ code: 'CSD', name: 'Club Service', amount: 5000 }]
  const budgets = {};
  for (const [year, heads] of Object.entries(f.budgets ?? {})) {
    if (!/^\d{4}–\d{2}$/.test(year) || !Array.isArray(heads)) continue;
    if (heads.length > 30) fail(`Budgets for ${year}: too many avenues (at most 30).`);
    const codes = new Set();
    budgets[year] = heads.map((h, n) => {
      const at = `Budgets for ${year}, avenue ${n + 1}`;
      const code = str(h?.code, 8, `${at}: the short name`, true);
      if (!/^[A-Z0-9]+$/.test(code) || codes.has(code)) fail(`${at}: the short name is not valid.`);
      codes.add(code);
      const amount = money(h.amount || 0);
      if (!Number.isFinite(amount) || amount < 0 || amount > 1e8) fail(`${at}: the amount is not valid.`);
      return { code, name: str(h.name, 60, `${at}: the name`) || code, amount };
    });
  }

  // Members (private register for dues and birthdays): [{ id, name, phone?, email?, birthday?, since?, left? }]
  const members = (Array.isArray(f.members) ? f.members : []).map((m, n) => {
    const at = `Member ${n + 1}`;
    const id = str(m?.id, 40, `${at}: the id`, true);
    if (!/^[a-z0-9-]+$/.test(id)) fail(`${at}: the id is not valid.`);
    const out = { id, name: str(m.name, 80, `${at}: the name`, true) };
    const phone = str(m.phone, 20, `${at}: the phone number`);
    if (phone && !/^\+?[\d\s-]{7,20}$/.test(phone)) fail(`${m.name}: the phone number is not valid.`);
    if (phone) out.phone = phone;
    const email = str(m.email, 120, `${at}: the email`);
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail(`${m.name}: the email is not valid.`);
    if (email) out.email = email;
    for (const k of ['birthday', 'since']) { const v = str(m[k], 10, `${at}: a date`); if (v) { if (!isDate(v)) fail(`${m.name}: a date is not valid.`); out[k] = v; } }
    if (m.left === true) out.left = true;
    return out;
  });
  if (members.length > 500 || new Set(members.map((m) => m.id)).size !== members.length) fail('The member list is not valid.');
  const memberIds = new Set(members.map((m) => m.id));

  // Dues per Rotaract year: { '2026–27': { fee: 1500, paid: { memberId: [entry ids] } } }
  const dues = {};
  for (const [year, d] of Object.entries(f.dues ?? {})) {
    if (!/^\d{4}–\d{2}$/.test(year) || !d || typeof d !== 'object') continue;
    const fee = money(d.fee || 0);
    if (!Number.isFinite(fee) || fee < 0 || fee > 1e6) fail(`Dues for ${year}: the fee is not valid.`);
    const paid = {};
    for (const [mid, list] of Object.entries(d.paid ?? {})) {
      if (!memberIds.has(mid) || !Array.isArray(list)) continue;
      const kept = list.filter((x) => typeof x === 'string' && ids.has(x));
      if (kept.length) paid[mid] = kept;
    }
    dues[year] = { fee, paid };
  }

  // Reimbursement claims: [{ id, date, person, amount, description, status, event?, avenue?, category?, entry? }]
  const STATUSES = ['pending', 'approved', 'paid', 'rejected'];
  const claims = (Array.isArray(f.claims) ? f.claims : []).map((c, n) => {
    const at = `Reimbursement ${n + 1}`;
    const id = str(c?.id, 40, `${at}: the id`, true);
    if (!/^[a-z0-9-]+$/.test(id)) fail(`${at}: the id is not valid.`);
    const date = str(c.date, 10, `${at}: the date`, true);
    if (!isDate(date)) fail(`${at}: the date is not valid.`);
    const amount = money(c.amount);
    if (!Number.isFinite(amount) || amount <= 0 || amount > 1e7) fail(`${at}: the amount must be more than 0.`);
    if (!STATUSES.includes(c.status)) fail(`${at}: the status is not valid.`);
    const out = { id, date, person: str(c.person, 80, `${at}: who paid`, true), amount, description: str(c.description, 200, `${at}: what it was for`, true), status: c.status };
    for (const [k, max] of [['event', 80], ['category', 60], ['note', 200]]) { const v = str(c[k], max, `${at}: ${k}`); if (v) out[k] = v; }
    const avenue = str(c.avenue, 8, `${at}: the avenue`);
    if (avenue) { if (!/^[A-Z0-9]+$/.test(avenue)) fail(`${at}: the avenue is not valid.`); out.avenue = avenue; }
    if (c.entry && ids.has(c.entry)) out.entry = c.entry;
    if (c.receipt) { if (!/^rc-[a-z0-9-]{4,36}$/.test(c.receipt)) fail(`${at}: the receipt is not valid.`); out.receipt = c.receipt; }
    return out;
  });
  if (claims.length > 2000) fail('Too many reimbursements.');

  return { openingBalances, entries, budgets, members, dues, claims };
}
