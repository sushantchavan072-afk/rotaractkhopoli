import { GoogleGenAI, ApiError } from '@google/genai';

/**
 * Google Gemini for the site assistant. Used when GEMINI_API_KEY is set (a free key from Google AI Studio).
 * GEMINI_MODEL can name a different Gemini model.
 */
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
let ai;

export const geminiConfigured = () => Boolean(process.env.GEMINI_API_KEY);

/** Streams an answer: yields { type: 'text', text } pieces. */
export async function* streamGemini({ system, messages, signal }) {
  ai ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const stream = await ai.models.generateContentStream({
    model: MODEL,
    contents: messages.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
    config: {
      systemInstruction: system,
      maxOutputTokens: 4096, // a cap per answer; answers are asked to be short
      abortSignal: signal,
    },
  });
  for await (const chunk of stream) {
    if (chunk.text) yield { type: 'text', text: chunk.text };
  }
}

/** The free tier's per-minute or per-day limit was reached. */
export const geminiOverLimit = (err) => err instanceof ApiError && err.status === 429;
/** Errors worth telling the visitor to retry later. */
export const geminiBusy = (err) => err instanceof ApiError && (err.status === 429 || err.status >= 500);
