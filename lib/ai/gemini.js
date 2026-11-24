import { GoogleGenAI, ApiError } from '@google/genai';

/**
 * Google Gemini for the site assistant. Used when GEMINI_API_KEY is set (a free key from Google AI Studio).
 * GEMINI_MODEL can name a different Gemini model.
 *
 * The free tier's models are sometimes "experiencing high demand" (503) or out of quota for the minute
 * (429), and can take a long time to say so. An attempt that hasn't started answering within 8 seconds
 * is abandoned, and up to five other Flash models that this key can use are tried (looked up from Google's
 * model list and remembered for a few hours), all within 40 seconds. A model that answered recently is
 * tried first. If none answers, the site lists the best-matching pages instead.
 */
const PRIMARY = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const RETRYABLE = new Set([429, 500, 503, 504, 404]); // 404: the model name isn't available to this key
const LIST_TTL = 6 * 60 * 60 * 1000;
let ai;
let flashModels = { at: 0, names: [] };
let lastGood = { model: PRIMARY, at: 0 }; // a fallback that answered recently is tried first for a few minutes

export const geminiConfigured = () => Boolean(process.env.GEMINI_API_KEY);

/** Flash text models this key can use, newest first, stable versions before previews. */
async function otherFlashModels() {
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
  found.sort((a, b) => version(b) - version(a) || /preview|exp/.test(a) - /preview|exp/.test(b) || a.length - b.length);
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
export async function* streamGemini({ system, messages, signal }) {
  ai ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const contents = messages.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
  const deadline = Date.now() + BUDGET_MS;
  const tried = [];
  let lastError;
  const recent = lastGood.model !== PRIMARY && Date.now() - lastGood.at < 5 * 60 * 1000;
  const plan = recent ? [lastGood.model, PRIMARY] : [PRIMARY];
  let listed = false;
  for (let i = 0; i < plan.length && plan.length <= 6; i++) {
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
        config: { systemInstruction: system, maxOutputTokens: 4096, abortSignal: attempt.signal },
      });
      for await (const chunk of stream) {
        if (chunk.text) {
          if (!started) { started = true; clearTimeout(timer); }
          yield { type: 'text', text: chunk.text };
        }
      }
      lastGood = { model, at: Date.now() };
      yield { type: 'model', model };
      return;
    } catch (err) {
      lastError = timedOut ? new GeminiUnavailable(`${model} did not start answering in time`, 504) : err;
      const retryable = timedOut || (err instanceof ApiError && RETRYABLE.has(err.status));
      if (started || signal?.aborted || !retryable) break;
      if (!listed) {
        // The main model is busy or unavailable: add up to four other Flash models to the plan.
        listed = true;
        for (const other of await otherFlashModels()) {
          if (!plan.includes(other) && plan.length < 6) plan.push(other);
        }
      }
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
    }
  }
  const err = lastError ?? new GeminiUnavailable('No Gemini model answered in time', 504);
  if (typeof err === 'object') err.triedModels = tried;
  throw err;
}

/** The free tier's per-minute or per-day limit was reached. */
export const geminiOverLimit = (err) => err instanceof ApiError && err.status === 429;
/** Errors worth telling the visitor to retry later. */
export const geminiBusy = (err) => (err instanceof ApiError || err instanceof GeminiUnavailable) && (err.status === 429 || err.status >= 500);
