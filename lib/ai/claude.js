import Anthropic from '@anthropic-ai/sdk';

/**
 * Claude (Anthropic) for the site assistant. Used when ANTHROPIC_API_KEY is set.
 * ANTHROPIC_MODEL can name a different Claude model.
 */
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-opus-5-5';
// Server-side refusal fallback: if the model declines, the API retries on a suitable model in the same call.
const SUPPORTS_FALLBACK = /^claude-(fable-5|mythos-5|opus-5|sonnet-5-5)/.test(MODEL);
let client;

export const claudeConfigured = () => Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);

/** Streams an answer: yields { type: 'text', text } pieces, then possibly one { type: 'notice', text }. */
export async function* streamClaude({ system, messages, signal }) {
  client ??= new Anthropic();
  const params = {
    model: MODEL,
    max_tokens: 8000, // a cap on cost per answer; answers are asked to be short
    system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
    output_config: { effort: 'low' }, // chat: quick, short answers
    messages,
  };
  const run = SUPPORTS_FALLBACK
    ? client.beta.messages.stream({ ...params, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' })
    : client.messages.stream(params);
  const abort = () => run.abort();
  signal?.addEventListener('abort', abort);
  try {
    for await (const event of run) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') yield { type: 'text', text: event.delta.text };
    }
    const final = await run.finalMessage();
    if (final.stop_reason === 'refusal') yield { type: 'notice', text: 'Sorry, I can’t help with that one. Try asking about the club, its projects or how to join.' };
    else if (final.stop_reason === 'max_tokens') yield { type: 'notice', text: 'That answer was cut short. Try a more specific question.' };
  } finally {
    signal?.removeEventListener('abort', abort);
  }
}

/** True for errors worth telling the visitor to retry later (rate limits, overload). */
export const claudeBusy = (err) => err instanceof Anthropic.RateLimitError || err instanceof Anthropic.InternalServerError;
