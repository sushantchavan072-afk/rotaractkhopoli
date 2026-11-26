import { GoogleGenAI, ApiError } from '@google/genai';

/**
 * Google Gemini for the site assistant. Used when GEMINI_API_KEY is set (a free key from Google AI Studio).
 * GEMINI_MODEL can name a different Gemini model.
 *
 * The free tier's models are sometimes "experiencing high demand" (503) or out of quota for the minute
 * (429; free limits are per model and per day), and can take a long time to say so. An attempt that hasn't started answering within 8 seconds
 * is abandoned, and up to five other Flash models that this key can use are tried (looked up from Google's
 * model list and remembered for a few hours), all within 40 seconds. A model that answered recently is
 * tried first. If none answers, the site lists the best-matching pages instead.
 *
 * With `web: true` the model may also search Google ("grounding") when the site's own passages don't answer;
 * the web pages it used are returned, with Google's search-suggestion chip, which Google asks to be shown.
 * If the free search allowance runs out, the answer is retried without web search.
 */
const PRIMARY = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const RETRYABLE = new Set([429, 500, 503, 504, 404]); // 404: the model name isn't available to this key
const LIST_TTL = 6 * 60 * 60 * 1000;
let ai;
let flashModels = { at: 0, names: [] };
let lastGood = { model: PRIMARY, at: 0 }; // a fallback that answered recently is tried first for a few minutes
// Models that said they are over their free limit, and until when (Google reports how long to wait).
const exhausted = new Map();
const usable = (model) => (exhausted.get(model) ?? 0) <= Date.now();
// Google Search has its own allowance (and may not be offered on a key at all). When it is refused, answers
// come from the site only for a while, so visitors aren't kept waiting on searches that will fail.
const WEB_PAUSE_MS = 30 * 60 * 1000;
let webPausedUntil = 0;

/** How long Google says to wait after a 429, in seconds (it is nested inside the library's error message). */
function googleError(err) {
  try {
    const raw = String(err?.message ?? '');
    let parsed = JSON.parse(raw.slice(raw.indexOf('{')));
    const inner = String(parsed?.error?.message ?? '');
    if (inner.trim().startsWith('{')) parsed = JSON.parse(inner);
    const details = parsed?.error?.details ?? [];
    const delay = details.find((d) => d?.retryDelay)?.retryDelay;
    const quotas = details.flatMap((d) => d?.violations ?? []).map((v) => `${v.quotaId ?? ''} ${v.quotaMetric ?? ''}`);
    return { retry: delay ? Number.parseFloat(delay) : 60, quotas, message: String(parsed?.error?.message ?? '') };
  } catch {
    return { retry: 60, quotas: [], message: String(err?.message ?? '') };
  }
}
const retrySeconds = (err) => googleError(err).retry;
/** A refusal caused by the web-search tool (its own allowance, or not offered for this model), not the model. */
const searchProblem = (err) => {
  const { quotas, message } = googleError(err);
  return quotas.some((q) => /search|ground/i.test(q)) || /search|grounding/i.test(message);
};

export const geminiConfigured = () => Boolean(process.env.GEMINI_API_KEY);

/** Flash text models this key can use: full Flash before Flash-Lite, newest first, stable before previews. */
async function otherFlashModels() {
  ai ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  if (Date.now() - flashModels.at < LIST_TTL) return flashModels.names;
  const found = [];
  try {
    const pager = await ai.models.list({ config: { pageSize: 100 } });
    for await (const m of pager) {
      const id = String(m.name ?? '').replace(/^models\//, '');
      if (!/^gemini-.*flash/i.test(id) || /image|tts|audio|live|embed|vision|native|computer/i.test(id)) continue;
      if (m.supportedActions?.length && !m.supportedActions.includes('generateContent')) continue;
      found.push(id);
    }
  } catch {
    // The list is a nice-to-have; without it only the main model is tried.
  }
  const version = (id) => Number(id.match(/gemini-(\d+(?:\.\d+)?)/)?.[1] ?? 0);
  const lite = (id) => /lite/.test(id);
  found.sort((a, b) => lite(a) - lite(b) || version(b) - version(a) || /preview|exp/.test(a) - /preview|exp/.test(b) || a.length - b.length);
  flashModels = { at: Date.now(), names: found };
  return found;
}

const wait = (ms, signal) => new Promise((resolve) => {
  const t = setTimeout(resolve, ms);
  signal?.addEventListener('abort', () => { clearTimeout(t); resolve(); }, { once: true });
});

/** Thrown when no Gemini model answered in time; treated like "busy". */
export class GeminiUnavailable extends Error {
  constructor(message, status = 503) { super(message); this.status = status; }
}

const FIRST_TEXT_MS = 8000; // an attempt that hasn't started answering by then is abandoned
const BUDGET_MS = 40000; // stay well inside the function's 60-second limit

/** Streams an answer: yields { type: 'text', text } pieces. */
export async function* streamGemini({ system, messages, signal, web = false }) {
  let useWeb = web && Date.now() > webPausedUntil;
  ai ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const contents = messages.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
  const deadline = Date.now() + BUDGET_MS;
  const tried = [];
  const failures = [];
  let lastError;
  const recent = lastGood.model !== PRIMARY && Date.now() - lastGood.at < 5 * 60 * 1000;
  const plan = [...new Set([recent && lastGood.model, PRIMARY].filter(Boolean))].filter(usable);
  let listed = false;
  const addFallbacks = async () => {
    listed = true;
    for (const other of await otherFlashModels()) {
      if (!plan.includes(other) && usable(other)) plan.push(other);
    }
  };
  if (!plan.length) await addFallbacks(); // the usual models are over their limit for now
  for (let i = 0; i < plan.length && i < 10; i++) {
    if (signal?.aborted) break;
    if (deadline - Date.now() < 6000) break;
    const model = plan[i];
    tried.push(model);
    // Each attempt gets its own abort, tied to the visitor's request and to a first-text timer.
    const attempt = new AbortController();
    const onAbort = () => attempt.abort();
    signal?.addEventListener('abort', onAbort, { once: true });
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; attempt.abort(); }, Math.min(FIRST_TEXT_MS, deadline - Date.now()));
    let started = false;
    try {
      const stream = await ai.models.generateContentStream({
        model,
        contents,
        config: {
          systemInstruction: system, maxOutputTokens: 4096, abortSignal: attempt.signal,
          ...(useWeb && { tools: [{ googleSearch: {} }] }),
        },
      });
      const webPages = new Map();
      let suggestions = '';
      for await (const chunk of stream) {
        const grounding = chunk.candidates?.[0]?.groundingMetadata;
        for (const g of grounding?.groundingChunks ?? []) {
          if (g.web?.uri && webPages.size < 6) webPages.set(g.web.uri, { title: g.web.title || g.web.domain || 'Web page', url: g.web.uri, domain: g.web.domain || g.web.title || '' });
        }
        if (grounding?.searchEntryPoint?.renderedContent) suggestions = grounding.searchEntryPoint.renderedContent;
        if (chunk.text) {
          if (!started) { started = true; clearTimeout(timer); }
          yield { type: 'text', text: chunk.text };
        }
      }
      lastGood = { model, at: Date.now() };
      if (webPages.size || suggestions) yield { type: 'web', sources: [...webPages.values()], suggestions };
      yield { type: 'model', model };
      return;
    } catch (err) {
      lastError = timedOut ? new GeminiUnavailable(`${model} did not start answering in time`, 504) : err;
      { const g = googleError(err); failures.push(`${model}${useWeb ? '+web' : ''}: ${timedOut ? 'timeout' : err?.status ?? '?'} ${g.quotas.map((q) => q.trim()).join(',') || g.message.slice(0, 160)}`); }
      const retryable = timedOut || (err instanceof ApiError && RETRYABLE.has(err.status));
      if (!started && !signal?.aborted && useWeb && err instanceof ApiError && (err.status === 429 || (err.status === 400 && searchProblem(err)))) {
        // Refused while searching the web. Google's message often doesn't say whether the search allowance or
        // the model's was used up, so try the same model once more without the search tool (answering from
        // the site only), and leave web search off for a while.
        useWeb = false;
        webPausedUntil = Date.now() + WEB_PAUSE_MS;
        i -= 1;
        continue;
      }
      if (started || signal?.aborted || !retryable) break;
      // Free limits are per model, and a refused request doesn't count against them, so move on to the next
      // model. Remember this one is over its limit until Google says it resets.
      if (err instanceof ApiError && err.status === 429) exhausted.set(model, Date.now() + Math.min(retrySeconds(err), 24 * 3600) * 1000);
      // "No longer available" (404): skip this model for the rest of the day.
      if (err instanceof ApiError && err.status === 404) exhausted.set(model, Date.now() + 24 * 3600 * 1000);
      if (!listed) await addFallbacks();
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
    }
  }
  const err = lastError ?? new GeminiUnavailable('No Gemini model answered in time', 504);
  if (typeof err === 'object') { err.triedModels = tried; err.failures = failures; }
  throw err;
}

/** The Flash models this key can use, in the order they are tried after the main one (for troubleshooting). */
export async function geminiModels() {
  return {
    main: PRIMARY, fallbacks: await otherFlashModels(), recent: lastGood.at ? lastGood.model : null,
    resting: Object.fromEntries([...exhausted].filter(([, until]) => until > Date.now()).map(([m, until]) => [m, new Date(until).toISOString()])),
    webSearchPausedUntil: webPausedUntil > Date.now() ? new Date(webPausedUntil).toISOString() : null,
  };
}

/**
 * Turns a question written in another language (Hindi, Marathi...) into English search words, because the
 * site's content is in English. Flash-Lite models go first. Returns '' if no model could do it.
 */
export async function geminiSearchWords(question, signal) {
  ai ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  // A short job: Flash-Lite models first (they have the biggest free allowances), skipping any that are resting.
  const all = await otherFlashModels();
  const order = [...new Set([...all.filter((m) => /lite/.test(m)), lastGood.at && lastGood.model, PRIMARY, ...all])].filter((m) => m && usable(m));
  for (const model of order.slice(0, 3)) {
    if (signal?.aborted) return '';
    const attempt = new AbortController();
    const timer = setTimeout(() => attempt.abort(), 5000);
    const onAbort = () => attempt.abort();
    signal?.addEventListener('abort', onAbort, { once: true });
    try {
      const res = await ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: question }] }],
        config: {
          systemInstruction: 'Translate the visitor\'s question into short English search words for a club website (people\'s names, events, joining, volunteering, dates, places). Reply with the English words only.',
          maxOutputTokens: 60,
          abortSignal: attempt.signal,
        },
      });
      const words = String(res.text ?? '').slice(0, 200);
      if (words.trim()) return words;
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) exhausted.set(model, Date.now() + Math.min(retrySeconds(err), 24 * 3600) * 1000);
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
    }
  }
  return '';
}

/** The free tier's per-minute or per-day limit was reached. */
export const geminiOverLimit = (err) => err instanceof ApiError && err.status === 429;
/** Errors worth telling the visitor to retry later. */
export const geminiBusy = (err) => (err instanceof ApiError || err instanceof GeminiUnavailable) && (err.status === 429 || err.status >= 500);
