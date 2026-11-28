import { randomBytes } from 'node:crypto';
import { isAdmin, sameOrigin, json } from '../../../../lib/admin/auth';
import { githubConfigured, readText, commitFiles, GitHubError } from '../../../../lib/admin/github';
import { financeReady, encrypt, decrypt, LockedError } from '../../../../lib/admin/finance';

/**
 * Receipt photos for reimbursement claims, kept ENCRYPTED in data/private/receipts (bills are private).
 * POST { data } (a JPEG, base64, shrunk in the browser): saves it at once and returns { id }.
 * GET ?id=…: the photo, for the signed-in Admin Portal only.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const file = (id) => `data/private/receipts/${id}.enc.json`;
const MAX = 3 * 1024 * 1024; // base64 characters

export async function GET(request) {
  if (!isAdmin(request)) return json({ error: 'Please sign in again.' }, 401);
  const id = new URL(request.url).searchParams.get('id') ?? '';
  if (!/^[a-z0-9-]{6,40}$/.test(id)) return json({ error: 'Not found.' }, 404);
  try {
    const found = await readText(file(id));
    if (!found) return json({ error: 'Not found.' }, 404);
    const jpeg = Buffer.from(decrypt(found.text).jpeg, 'base64');
    return new Response(jpeg, { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'private, max-age=3600' } });
  } catch (e) {
    if (e instanceof LockedError) return json({ error: e.message }, 423);
    return json({ error: 'The receipt could not be opened.' }, 502);
  }
}

export async function POST(request) {
  if (!sameOrigin(request)) return json({ error: 'Not allowed.' }, 403);
  if (!isAdmin(request)) return json({ error: 'Please sign in again.' }, 401);
  if (!githubConfigured() || !financeReady()) return json({ error: 'Saving receipts needs GITHUB_TOKEN and a key (FINANCE_KEY, or the admin password).' }, 503);
  const body = await request.json().catch(() => null);
  const data = typeof body?.data === 'string' ? body.data : '';
  const bytes = Buffer.from(data, 'base64');
  if (!data || data.length > MAX || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) return json({ error: 'Please choose a photo of the receipt.' }, 400);
  const id = `rc-${Date.now().toString(36)}-${randomBytes(4).toString('hex')}`;
  try {
    // shortcut: a receipt whose claim is never saved stays in the repo (encrypted, unused); add cleanup if it piles up.
    await commitFiles([{ path: file(id), content: encrypt({ jpeg: data }) }], 'Admin page: add a receipt\n\nSaved from the website\'s admin page (encrypted).');
    return json({ id });
  } catch (e) {
    if (e instanceof GitHubError) return json({ error: `Could not reach GitHub: ${e.message}.` }, 502);
    console.error('admin receipt', e);
    return json({ error: 'Something went wrong. Please try again.' }, 500);
  }
}
