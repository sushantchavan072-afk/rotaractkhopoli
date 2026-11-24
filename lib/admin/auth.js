import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Sign-in for the admin page. One shared password (ADMIN_PASSWORD in Vercel's environment variables).
 * A successful sign-in sets a signed, HttpOnly cookie that lasts 12 hours. Changing ADMIN_PASSWORD
 * signs everyone out, because the cookie's signature is made with a key derived from it. Server only.
 */
const COOKIE = 'rck_admin';
const TTL_S = 12 * 60 * 60;
const MIN_LENGTH = 8;

const password = () => process.env.ADMIN_PASSWORD || '';
const key = () => createHash('sha256').update(`rck-admin-session:${password()}`).digest();
const sign = (text) => createHmac('sha256', key()).update(text).digest('base64url');
const same = (a, b) => {
  const x = createHash('sha256').update(String(a)).digest();
  const y = createHash('sha256').update(String(b)).digest();
  return timingSafeEqual(x, y);
};

/** The admin page is switched on once a password of at least 8 characters is set. */
export const adminConfigured = () => password().length >= MIN_LENGTH;

export function passwordMatches(attempt) {
  return adminConfigured() && typeof attempt === 'string' && same(attempt, password());
}

export function sessionCookie() {
  const expires = String(Math.floor(Date.now() / 1000) + TTL_S);
  return `${COOKIE}=${expires}.${sign(expires)}; Path=/api/admin; HttpOnly; Secure; SameSite=Strict; Max-Age=${TTL_S}`;
}

export const clearedCookie = () => `${COOKIE}=; Path=/api/admin; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;

/** Whether the request comes from a signed-in admin. */
export function isAdmin(request) {
  if (!adminConfigured()) return false;
  const raw = (request.headers.get('cookie') || '').split(/;\s*/).find((c) => c.startsWith(`${COOKIE}=`));
  if (!raw) return false;
  const [expires, sig] = raw.slice(COOKIE.length + 1).split('.');
  if (!expires || !sig || Number(expires) * 1000 < Date.now()) return false;
  return same(sig, sign(expires));
}

/** Changes must come from this site's own pages (the cookie is also SameSite=Strict). */
export function sameOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try { return new URL(origin).host === request.headers.get('host'); } catch { return false; }
}

/* A few sign-in attempts per visitor, so the password can't be guessed by trying many. */
const attempts = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;
export function tooManyAttempts(ip) {
  const now = Date.now();
  const recent = (attempts.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  attempts.set(ip, recent);
  if (attempts.size > 5000) attempts.clear();
  return recent.length >= MAX_ATTEMPTS;
}
export function noteFailedAttempt(ip) {
  attempts.set(ip, [...(attempts.get(ip) ?? []), Date.now()]);
}
export const clientIp = (request) => (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'local';

export const json = (body, status = 200, headers = {}) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers },
});
