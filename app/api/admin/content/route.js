import { isAdmin, sameOrigin, json } from '../../../../lib/admin/auth';
import { githubConfigured, readJson, listFiles, commitFiles, ConflictError, GitHubError } from '../../../../lib/admin/github';
import { cleanUploads, InvalidError } from '../../../../lib/admin/validate';
import { FILES, CLEAN, LABEL, toFile } from '../../../../lib/admin/content';
import { avenues } from '../../../../data/club';

/**
 * The admin page's content.
 * GET: events, team, gallery, club details and reviews as they are in the repository now (not just as last published, so two
 *      saves in a row never undo each other), with each file's version for conflict checks.
 * POST { events?, team?, gallery?, site?, reviews?, base: { …file versions }, uploads?: [{ path, data }] }:
 *      checks everything and commits it as one change; Vercel then publishes the site again.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MAX_BODY = 4.2 * 1024 * 1024; // Vercel accepts up to 4.5 MB per request

const notReady = () => json({ error: 'Saving is not switched on yet: GITHUB_TOKEN is not set in Vercel.' }, 503);
const problem = (e) => {
  if (e instanceof GitHubError) {
    const why = e.status === 401 ? 'the GitHub key is wrong or has expired'
      : e.status === 403 || e.status === 404 ? 'the GitHub key cannot write to the website’s repository'
        : `GitHub said: ${e.message}`;
    return json({ error: `Could not reach GitHub: ${why}.` }, 502);
  }
  console.error('admin', e);
  return json({ error: 'Something went wrong. Please try again.' }, 500);
};

export async function GET(request) {
  if (!isAdmin(request)) return json({ error: 'Please sign in again.' }, 401);
  if (!githubConfigured()) return notReady();
  try {
    const kinds = Object.keys(FILES);
    const [files, memberFiles, eventFiles] = await Promise.all([
      Promise.all(kinds.map((k) => readJson(FILES[k]))), listFiles('public/images/members'), listFiles('public/images/events'),
    ]);
    return json({
      ...Object.fromEntries(kinds.map((k, i) => [k, files[i].data])),
      base: Object.fromEntries(kinds.map((k, i) => [k, files[i].sha])),
      memberPhotos: memberFiles.filter((f) => /\.(webp|png|jpe?g)$/i.test(f)),
      eventPhotos: eventFiles.filter((f) => /\.jpg$/i.test(f)),
      avenues: avenues.flatMap((a) => a.eventAvenues),
    });
  } catch (e) {
    return problem(e);
  }
}

export async function POST(request) {
  if (!sameOrigin(request)) return json({ error: 'Not allowed.' }, 403);
  if (!isAdmin(request)) return json({ error: 'Please sign in again.' }, 401);
  if (!githubConfigured()) return notReady();
  const raw = await request.text();
  if (raw.length > MAX_BODY) return json({ error: 'Too many photos in one save. Please save after every few photos.' }, 413);
  let body;
  try { body = JSON.parse(raw); } catch { return json({ error: 'The request was not understood.' }, 400); }
  try {
    const files = [];
    const expected = {};
    const parts = [];
    for (const kind of Object.keys(FILES)) {
      if (body[kind] === undefined) continue;
      const data = CLEAN[kind](body[kind]);
      if (typeof body.base?.[kind] !== 'string') return json({ error: 'Please reload the admin page and try again.' }, 400);
      expected[FILES[kind]] = body.base[kind];
      files.push({ path: FILES[kind], content: toFile(data) });
      parts.push(LABEL[kind]);
    }
    const uploads = cleanUploads(body.uploads);
    if (uploads.length) parts.push(`${uploads.length} photo${uploads.length > 1 ? 's' : ''}`);
    if (!files.length && !uploads.length) return json({ error: 'There is nothing to save.' }, 400);
    const note = typeof body.note === 'string' ? body.note.replace(/\s+/g, ' ').trim().slice(0, 120) : '';
    const message = `Admin page: update ${parts.join(', ')}${note ? ` (${note})` : ''}\n\nSaved from the website's admin page.`;
    const { commit, shas } = await commitFiles([...files, ...uploads], message, expected);
    const base = Object.fromEntries(Object.entries(FILES).filter(([k]) => body[k] !== undefined).map(([k, path]) => [k, shas[path]]));
    return json({ ok: true, commit, base });
  } catch (e) {
    if (e instanceof InvalidError) return json({ error: e.message }, 422);
    if (e instanceof ConflictError) return json({ error: 'Someone else saved changes a moment ago. Reload the admin page to see them, then make your change again.', conflict: true }, 409);
    return problem(e);
  }
}
