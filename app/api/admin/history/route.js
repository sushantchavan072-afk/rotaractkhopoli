import { isAdmin, sameOrigin, json } from '../../../../lib/admin/auth';
import { githubConfigured, listCommits, readJson, commitFiles, GitHubError } from '../../../../lib/admin/github';
import { InvalidError } from '../../../../lib/admin/validate';
import { FILES, CLEAN, toFile } from '../../../../lib/admin/content';

/**
 * Recent saves, and going back to one of them.
 * GET: the latest changes to the site's content (data/content), newest first.
 * POST { sha }: puts every content file (events, team, gallery, club details, reviews) back to how it was in
 *      that version, as a new change, so nothing is lost: going back can itself be undone the same way.
 *      Photos are never deleted.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const failed = (e) => {
  if (e instanceof GitHubError) return json({ error: `Could not reach GitHub: ${e.status === 401 ? 'the GitHub key is wrong or has expired' : e.message}.` }, 502);
  if (e instanceof InvalidError) return json({ error: `That version can't be restored: ${e.message}` }, 422);
  console.error('admin history', e);
  return json({ error: 'Something went wrong. Please try again.' }, 500);
};

export async function GET(request) {
  if (!isAdmin(request)) return json({ error: 'Please sign in again.' }, 401);
  if (!githubConfigured()) return json({ saves: [] });
  try {
    return json({ saves: await listCommits('data/content', 12) });
  } catch (e) {
    return failed(e);
  }
}

export async function POST(request) {
  if (!sameOrigin(request)) return json({ error: 'Not allowed.' }, 403);
  if (!isAdmin(request)) return json({ error: 'Please sign in again.' }, 401);
  if (!githubConfigured()) return json({ error: 'Saving is not switched on yet: GITHUB_TOKEN is not set in Vercel.' }, 503);
  const { sha, label } = await request.json().catch(() => ({}));
  if (typeof sha !== 'string' || !/^[0-9a-f]{7,40}$/.test(sha)) return json({ error: 'That version was not found.' }, 400);
  try {
    const files = [];
    for (const [kind, path] of Object.entries(FILES)) {
      let old;
      try { old = await readJson(path, sha); } catch (e) { if (e.status === 404) continue; throw e; } // the file didn't exist yet
      files.push({ path, content: toFile(CLEAN[kind](old.data)) });
    }
    if (!files.length) return json({ error: 'That version has no content to restore.' }, 422);
    const when = typeof label === 'string' ? label.replace(/\s+/g, ' ').trim().slice(0, 60) : '';
    const { commit } = await commitFiles(files, `Admin page: go back to an earlier version${when ? ` (${when})` : ''}\n\nRestored from ${sha.slice(0, 7)} on the website's admin page.`);
    return json({ ok: true, commit });
  } catch (e) {
    return failed(e);
  }
}
