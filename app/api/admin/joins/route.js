import { isAdmin, sameOrigin, json } from '../../../../lib/admin/auth';
import { githubConfigured, GitHubError } from '../../../../lib/admin/github';
import { financeReady, LockedError } from '../../../../lib/admin/finance';
import { listRequests, changeRequest } from '../../../../lib/admin/joins';

/**
 * Join requests inbox. GET: the requests, newest first. POST { id, status?, note?, remove? }: changes one
 * request and returns the list. Changes are saved at once (new requests can arrive at any time).
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const failed = (e) => {
  if (e instanceof LockedError) return json({ error: e.message, locked: true }, 423);
  if (e instanceof GitHubError) return json({ error: `Could not reach GitHub: ${e.status === 401 ? 'the GitHub key is wrong or has expired' : e.message}.` }, 502);
  console.error('admin joins', e);
  return json({ error: 'Something went wrong. Please try again.' }, 500);
};

export async function GET(request) {
  if (!isAdmin(request)) return json({ error: 'Please sign in again.' }, 401);
  if (!githubConfigured() || !financeReady()) return json({ requests: [], ready: false });
  try {
    return json({ requests: await listRequests(), ready: true });
  } catch (e) {
    return failed(e);
  }
}

export async function POST(request) {
  if (!sameOrigin(request)) return json({ error: 'Not allowed.' }, 403);
  if (!isAdmin(request)) return json({ error: 'Please sign in again.' }, 401);
  if (!githubConfigured()) return json({ error: 'Saving is not switched on yet: GITHUB_TOKEN is not set in Vercel.' }, 503);
  const body = await request.json().catch(() => null);
  try {
    const list = body && await changeRequest(body);
    if (!list) return json({ error: 'That change was not understood.' }, 400);
    return json({ requests: list });
  } catch (e) {
    return failed(e);
  }
}
