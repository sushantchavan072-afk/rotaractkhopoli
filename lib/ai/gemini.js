import { GoogleGenAI, ApiError } from '@google/genai';

/**
 * Google Gemini for the site assistant. Used when GEMINI_API_KEY is set (a free key from Google AI Studio).
 * GEMINI_MODEL can name a different Gemini model.
 *
 * The free tier's models are sometimes "experiencing high demand" (503) or out of quota for the minute
 * (429). When that happens before any text has arrived, the same model is tried once more, then up to
 * three other Flash models that this key can use (looked up from Google's model list and remembered for
 * a few hours), so a visitor still gets an answer.
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

/** Streams an answer: yields { type: 'text', text } pieces. */
export async function* streamGemini({ system, messages, signal }) {
  ai ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const contents = messages.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
  const tried = [];
  let lastError;
  let attempt = 0;
  const recent = lastGood.model !== PRIMARY && Date.now() - lastGood.at < 5 * 60 * 1000;
  const plan = recent ? [lastGood.model, PRIMARY] : [PRIMARY, PRIMARY];
  for (let i = 0; i < plan.length && attempt < 5; i++) {
    const model = plan[i];
    if (signal?.aborted) break;
    if (i === 1 && plan[0] === plan[1]) await wait(900, signal); // a moment before asking the same model again
    attempt++;
    tried.push(model);
    let started = false;
    try {
      const stream = await ai.models.generateContentStream({
        model,
        contents,
        config: { systemInstruction: system, maxOutputTokens: 4096, abortSignal: signal },
      });
      for await (const chunk of stream) {
        if (chunk.text) { started = true; yield { type: 'text', text: chunk.text }; }
      }
      lastGood = { model, at: Date.now() };
      return;
    } catch (err) {
      lastError = err;
      if (started || !(err instanceof ApiError) || !RETRYABLE.has(err.status)) break;
      if (i === 1 && plan.length === 2) {
        // The main model is busy or unavailable: add up to three other Flash models to the plan.
        for (const other of await otherFlashModels()) {
          if (!plan.includes(other) && plan.length < 5) plan.push(other);
        }
      }
    }
  }
  if (lastError && typeof lastError === 'object') lastError.triedModels = tried;
  throw lastError ?? new Error('No Gemini model answered.');
}

/** The free tier's per-minute or per-day limit was reached. */
export const geminiOverLimit = (err) => err instanceof ApiError && err.status === 429;
/** Errors worth telling the visitor to retry later. */
export const geminiBusy = (err) => err instanceof ApiError && (err.status === 429 || err.status >= 500);
