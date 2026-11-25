/**
 * Saving from the admin page: every save becomes one commit on the site's GitHub repository, which makes
 * Vercel publish the site again (about two minutes). Nothing is stored anywhere else, every change is in
 * the repository's history and can be undone. Server only.
 *
 * Environment variables (Vercel):
 * - GITHUB_TOKEN: a fine-grained personal access token for this one repository, with "Contents: Read and write".
 * - GITHUB_REPO (optional): "owner/name"; defaults to the repository Vercel builds from.
 * - GITHUB_BRANCH (optional): defaults to "main".
 */
const API = () => (process.env.GITHUB_API_URL || 'https://api.github.com').replace(/\/$/, '');

export const githubConfigured = () => Boolean(process.env.GITHUB_TOKEN);
export const repo = () => process.env.GITHUB_REPO
  || (process.env.VERCEL_GIT_REPO_OWNER && process.env.VERCEL_GIT_REPO_SLUG
    ? `${process.env.VERCEL_GIT_REPO_OWNER}/${process.env.VERCEL_GIT_REPO_SLUG}`
    : 'sushantchavan072-afk/rotaractkhopolii');
export const branch = () => process.env.GITHUB_BRANCH || 'main';

export class GitHubError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
/** Someone else saved in the meantime. */
export class ConflictError extends Error {}

async function gh(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${API()}/repos/${repo()}${path}`, {
    method,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'rotaract-khopoli-admin',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
    signal: AbortSignal.timeout(20000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new GitHubError(res.status, data.message || res.statusText);
  return data;
}

/** A JSON file from the repository's latest version (or from an earlier version, `ref`): { data, sha }. */
export async function readJson(path, ref = branch()) {
  const file = await gh(`/contents/${path}?ref=${encodeURIComponent(ref)}`);
  return { data: JSON.parse(Buffer.from(file.content, 'base64').toString('utf8')), sha: file.sha };
}

/** The latest changes to a folder: [{ sha, message, date, author }], newest first. */
export async function listCommits(path, count = 12) {
  const list = await gh(`/commits?path=${encodeURIComponent(path)}&sha=${encodeURIComponent(branch())}&per_page=${count}`);
  return list.map((c) => ({
    sha: c.sha,
    message: String(c.commit?.message ?? '').split('\n')[0],
    date: c.commit?.author?.date ?? null,
    author: c.commit?.author?.name ?? '',
  }));
}

/** File names in a folder of the repository (empty when the folder doesn't exist). */
export async function listFiles(path) {
  try {
    const items = await gh(`/contents/${path}?ref=${encodeURIComponent(branch())}`);
    return Array.isArray(items) ? items.filter((i) => i.type === 'file').map((i) => i.name) : [];
  } catch (e) {
    if (e.status === 404) return [];
    throw e;
  }
}

/**
 * Commits files in one go. files: [{ path, content: Buffer }]. expected: { path: blob sha the editor
 * started from }; when a file changed since (another board member saved), nothing is written and a
 * ConflictError is thrown. Returns { commit, shas: { path: new blob sha } }.
 */
export async function commitFiles(files, message, expected = {}) {
  const ref = await gh(`/git/ref/heads/${encodeURIComponent(branch())}`);
  const head = ref.object.sha;
  for (const [path, sha] of Object.entries(expected)) {
    const current = await gh(`/contents/${path}?ref=${head}`);
    if (current.sha !== sha) throw new ConflictError(path);
  }
  const { tree: baseTree } = await gh(`/git/commits/${head}`);
  const shas = {};
  const entries = [];
  for (const f of files) {
    const blob = await gh('/git/blobs', { method: 'POST', body: { content: f.content.toString('base64'), encoding: 'base64' } });
    shas[f.path] = blob.sha;
    entries.push({ path: f.path, mode: '100644', type: 'blob', sha: blob.sha });
  }
  const tree = await gh('/git/trees', { method: 'POST', body: { base_tree: baseTree.sha, tree: entries } });
  const commit = await gh('/git/commits', { method: 'POST', body: { message, tree: tree.sha, parents: [head] } });
  try {
    await gh(`/git/refs/heads/${encodeURIComponent(branch())}`, { method: 'PATCH', body: { sha: commit.sha, force: false } });
  } catch (e) {
    if (e.status === 422) throw new ConflictError('branch'); // someone saved during this save
    throw e;
  }
  return { commit: commit.sha, shas };
}
