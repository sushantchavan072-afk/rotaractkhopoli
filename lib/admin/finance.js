import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { InvalidError } from './validate';

/**
 * The club's finance sheet (income and expenses), edited on the admin page.
 *
 * It is kept in the repository ENCRYPTED (AES-256-GCM), so the amounts and names stay private even if the
 * website's code is public: only the admin page, with the key, can read it. The key comes from FINANCE_KEY
 * in Vercel, or from ADMIN_PASSWORD when FINANCE_KEY is not set. Server only.
 */
export const FINANCE_FILE = 'data/private/finance.enc.json';

const secret = () => process.env.FINANCE_KEY || process.env.ADMIN_PASSWORD || '';
const key = () => createHash('sha256').update(`rck-finance:${secret()}`).digest();
export const financeReady = () => secret().length >= 8;

export class LockedError extends Error {}

export function encrypt(data) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const body = Buffer.concat([cipher.update(JSON.stringify(data), 'utf8'), cipher.final()]);
  return Buffer.from(`${JSON.stringify({ v: 1, iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'), data: body.toString('base64') }, null, 2)}\n`);
}

export function decrypt(text) {
  try {
    const box = JSON.parse(text);
    const decipher = createDecipheriv('aes-256-gcm', key(), Buffer.from(box.iv, 'base64'));
    decipher.setAuthTag(Buffer.from(box.tag, 'base64'));
    return JSON.parse(Buffer.concat([decipher.update(Buffer.from(box.data, 'base64')), decipher.final()]).toString('utf8'));
  } catch {
    throw new LockedError('The finance records could not be opened with the current key (FINANCE_KEY, or ADMIN_PASSWORD when FINANCE_KEY is not set, was changed). Put the old value back in Vercel to open them.');
  }
}

export const emptyFinance = () => ({ openingBalances: {}, entries: [] });

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
  return { openingBalances, entries };
}
