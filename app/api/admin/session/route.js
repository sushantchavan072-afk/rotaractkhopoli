import {
  adminConfigured, passwordMatches, sessionCookie, clearedCookie, isAdmin, sameOrigin,
  tooManyAttempts, noteFailedAttempt, clientIp, json,
} from '../../../../lib/admin/auth';
import { githubConfigured } from '../../../../lib/admin/github';

/**
 * The admin page's sign-in.
 * GET: whether the admin page is set up and whether this visitor is signed in, plus the version of the
 *      site that is live (so the page can tell when a save has been published).
 * POST { password }: sign in. DELETE: sign out.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET(request) {
  return json({
    configured: adminConfigured(),
    canSave: githubConfigured(),
    signedIn: isAdmin(request),
    live: process.env.VERCEL_GIT_COMMIT_SHA || null,
  });
}

export async function POST(request) {
  if (!sameOrigin(request)) return json({ error: 'Not allowed.' }, 403);
  if (!adminConfigured()) return json({ error: 'The admin page is not switched on yet (ADMIN_PASSWORD is not set in Vercel).' }, 503);
  const ip = clientIp(request);
  if (tooManyAttempts(ip)) return json({ error: 'Too many wrong passwords. Please wait 15 minutes and try again.' }, 429);
  const { password } = await request.json().catch(() => ({}));
  if (!passwordMatches(password)) {
    noteFailedAttempt(ip);
    await new Promise((r) => setTimeout(r, 600)); // slows down guessing
    return json({ error: 'That password is not right.' }, 401);
  }
  return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie() });
}

export function DELETE(request) {
  if (!sameOrigin(request)) return json({ error: 'Not allowed.' }, 403);
  return json({ ok: true }, 200, { 'Set-Cookie': clearedCookie() });
}
