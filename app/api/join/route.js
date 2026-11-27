import { json, sameOrigin, clientIp } from '../../../lib/admin/auth';
import { githubConfigured } from '../../../lib/admin/github';
import { financeReady } from '../../../lib/admin/finance';
import { cleanApplication, addRequest, JoinsBusyError } from '../../../lib/admin/joins';

/**
 * The Join page's membership application. Saved (encrypted) for the Admin Portal's Join requests inbox.
 * The form also still sends it the usual way (form service or email), so nothing is lost if saving is off.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// A few applications per visitor per hour, so the inbox can't be flooded.
const recent = new Map();
const LIMIT = 4;
const WINDOW_MS = 60 * 60 * 1000;
function limited(ip) {
  const now = Date.now();
  const list = (recent.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.size > 5000) recent.clear();
  recent.set(ip, list);
  if (list.length >= LIMIT) return true;
  list.push(now);
  return false;
}

export async function POST(request) {
  if (!sameOrigin(request)) return json({ error: 'Not allowed.' }, 403);
  if (!githubConfigured() || !financeReady()) return json({ saved: false, reason: 'off' }, 503);
  const body = await request.json().catch(() => null);
  if (!body) return json({ error: 'The request was not understood.' }, 400);
  if (body.website) return json({ saved: true }); // the hidden "website" field is only filled in by bots
  const app = cleanApplication(body);
  if (!app) return json({ error: 'Please fill in your name, email, 10-digit phone number and why you want to join.' }, 422);
  if (limited(clientIp(request))) return json({ error: 'Too many applications from here. Please try again later.' }, 429);
  try {
    await addRequest(app);
    return json({ saved: true });
  } catch (e) {
    // Busy or full: the form then sends it the usual way (form service or email) instead.
    if (e instanceof JoinsBusyError) return json({ saved: false, reason: 'busy' }, 503);
    console.error('join request', e?.message);
    return json({ saved: false }, 502);
  }
}
