import { isAdmin, sameOrigin, json } from '../../../../lib/admin/auth';
import { githubConfigured, readText, commitFiles, ConflictError, GitHubError } from '../../../../lib/admin/github';
import { InvalidError } from '../../../../lib/admin/validate';
import { FINANCE_FILE, financeReady, encrypt, decrypt, emptyFinance, cleanFinance, LockedError } from '../../../../lib/admin/finance';

/**
 * The finance sheet (income and expenses), kept encrypted in the repository.
 * GET: the sheet, decrypted, with its file version. POST { finance, base }: saves it (one commit).
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const failed = (e) => {
  if (e instanceof LockedError) return json({ error: e.message, locked: true }, 423);
  if (e instanceof InvalidError) return json({ error: e.message }, 422);
  if (e instanceof ConflictError) return json({ error: 'Someone else saved the finance sheet a moment ago. Reload the admin page, then make your change again.', conflict: true }, 409);
  if (e instanceof GitHubError) return json({ error: `Could not reach GitHub: ${e.status === 401 ? 'the GitHub key is wrong or has expired' : e.message}.` }, 502);
  console.error('admin finance', e);
  return json({ error: 'Something went wrong. Please try again.' }, 500);
};

export async function GET(request) {
  if (!isAdmin(request)) return json({ error: 'Please sign in again.' }, 401);
  if (!githubConfigured() || !financeReady()) return json({ finance: emptyFinance(), base: null, ready: false });
  try {
    const file = await readText(FINANCE_FILE);
    return json({ finance: file ? cleanFinance(decrypt(file.text)) : emptyFinance(), base: file?.sha ?? null, ready: true });
  } catch (e) {
    return failed(e);
  }
}

export async function POST(request) {
  if (!sameOrigin(request)) return json({ error: 'Not allowed.' }, 403);
  if (!isAdmin(request)) return json({ error: 'Please sign in again.' }, 401);
  if (!githubConfigured()) return json({ error: 'Saving is not switched on yet: GITHUB_TOKEN is not set in Vercel.' }, 503);
  const body = await request.json().catch(() => null);
  if (!body) return json({ error: 'The request was not understood.' }, 400);
  try {
    const data = cleanFinance(body.finance);
    const current = await readText(FINANCE_FILE);
    if ((current?.sha ?? null) !== (body.base ?? null)) throw new ConflictError(FINANCE_FILE);
    if (current) decrypt(current.text); // never overwrite records that the current key can't open
    const { commit, shas } = await commitFiles([{ path: FINANCE_FILE, content: encrypt(data) }], 'Admin page: update the finance sheet\n\nSaved from the website\'s admin page (encrypted).', current ? { [FINANCE_FILE]: current.sha } : {});
    return json({ ok: true, commit, base: shas[FINANCE_FILE] });
  } catch (e) {
    return failed(e);
  }
}
