'use client';

import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import RobotIcon from './robot-icon';
import { FaXmark, FaArrowUp, FaStop, FaRotateLeft, FaArrowRight, FaGlobe, FaArrowUpRightFromSquare } from 'react-icons/fa6';

const SUGGESTIONS = [
  'How do I join the club?',
  'What was Project Bachpan 2.0?',
  'Where does the club meet?',
  'What happened in August?',
];
const STORE = 'rck-ask';

/** **bold** and [1] citations inside a line of the answer. */
function inline(line, sources) {
  return line.split(/(\*\*[^*]+\*\*|\[\d+(?:\s*,\s*\d+)*\]|From the web:)/g).map((part, i) => {
    if (part === 'From the web:') return <span key={i} className="ask-web-badge">From the web</span>;
    if (/^\*\*[^*]+\*\*$/.test(part)) return <strong key={i}>{part.slice(2, -2)}</strong>;
    const cite = part.match(/^\[(\d+(?:\s*,\s*\d+)*)\]$/);
    if (cite) {
      return (
        <span key={i} className="ask-cites">
          {cite[1].split(/\s*,\s*/).map((n) => {
            const s = sources[Number(n) - 1];
            return s ? <Link key={n} href={s.url} className="ask-cite" title={s.title}>{n}</Link> : null;
          })}
        </span>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

/** Paragraphs and "- " lists from the assistant's plain-text answer. */
function Answer({ text, sources }) {
  const blocks = text.replace(/\]\s*,\s*\[/g, '][').trim().split(/\n{2,}/);
  return blocks.map((block, i) => {
    const lines = block.split('\n').filter((l) => l.trim());
    if (lines.length && lines.every((l) => /^\s*[-•]\s+/.test(l))) {
      return <ul key={i}>{lines.map((l, j) => <li key={j}>{inline(l.replace(/^\s*[-•]\s+/, ''), sources)}</li>)}</ul>;
    }
    return <p key={i}>{lines.map((l, j) => <Fragment key={j}>{j > 0 && <br />}{inline(l, sources)}</Fragment>)}</p>;
  });
}

/**
 * Google's "search suggestions" chip, which Google asks sites to show next to answers that used Google Search.
 * Its HTML comes from Google and is shown in a sealed frame (no scripts), with links opening in a new tab.
 */
function SearchSuggestions({ html }) {
  const doc = `<!doctype html><html><head><base target="_blank"><style>body{margin:0;background:transparent;font-family:system-ui,sans-serif}</style></head><body>${html}</body></html>`;
  return <iframe className="ask-suggest-frame" title="Related Google searches" srcDoc={doc} sandbox="allow-popups allow-popups-to-escape-sandbox" loading="lazy" />;
}

/* ---------- Opening and closing motion ----------
 * The chat grows out of the button that opened it and shrinks back into it when closed: on desktop and
 * tablets it flies out of the robot (in the menu, or the round button) with a soft spring, and on phones,
 * where it fills the screen, it opens as a circle spreading out from the round button. Only transform,
 * opacity and clip-path are animated, so it stays smooth. Skipped for visitors who prefer less motion.
 */
const SPRING = 'cubic-bezier(.22, 1.18, .36, 1)';
const SETTLE = 'cubic-bezier(.2, .8, .2, 1)';
const AWAY = 'cubic-bezier(.5, 0, .75, 0)';

/** Centre of the button the chat belongs to: the robot in the desktop menu, else the round button. */
function originPoint() {
  for (const el of [document.querySelector('.nav-ask'), document.querySelector('.ask-fab')]) {
    if (!el) continue;
    const b = el.getBoundingClientRect();
    if (b.width && getComputedStyle(el).display !== 'none') return { x: b.left + b.width / 2, y: b.top + b.height / 2, r: 28 };
  }
  return { x: window.innerWidth - 46, y: window.innerHeight - 46, r: 28 };
}

function shape(el) {
  const o = originPoint();
  const b = el.getBoundingClientRect();
  const fullScreen = b.width >= window.innerWidth - 1 && b.height >= window.innerHeight - 1;
  if (fullScreen) {
    const R = Math.hypot(Math.max(o.x, window.innerWidth - o.x), Math.max(o.y, window.innerHeight - o.y));
    return { fullScreen, small: `circle(${o.r}px at ${o.x}px ${o.y}px)`, big: `circle(${Math.ceil(R)}px at ${o.x}px ${o.y}px)` };
  }
  const dx = o.x - (b.left + b.width / 2);
  const dy = o.y - (b.top + b.height / 2);
  const scale = Math.max(0.06, (o.r * 2) / Math.max(b.width, b.height));
  return { fullScreen, small: `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) scale(${scale.toFixed(3)})` };
}

function openMotion(el) {
  const f = shape(el);
  const main = f.fullScreen
    ? el.animate([{ clipPath: f.small }, { clipPath: f.big }], { duration: 560, easing: SETTLE })
    : el.animate([{ transform: f.small, opacity: 0 }, { opacity: 1, offset: 0.3 }, { transform: 'none', opacity: 1 }], { duration: 560, easing: SPRING });
  // The header, conversation, question box and note follow, one after another.
  const parts = [...el.querySelectorAll(':scope > .ask-head, :scope > .ask-body, :scope > .ask-form, :scope > .ask-foot')].map((part, i) => part.animate(
    [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }],
    { duration: 420, delay: (f.fullScreen ? 160 : 120) + i * 55, easing: SETTLE, fill: 'backwards' },
  ));
  return [main, ...parts];
}

function closeMotion(el) {
  const f = shape(el);
  return f.fullScreen
    ? el.animate([{ clipPath: f.big }, { clipPath: f.small }], { duration: 380, easing: 'cubic-bezier(.55, 0, .7, .3)', fill: 'forwards' })
    : el.animate([{ transform: 'none', opacity: 1 }, { opacity: 1, offset: 0.55 }, { transform: f.small, opacity: 0 }], { duration: 340, easing: AWAY, fill: 'forwards' });
}

/** A device with a fine pointer and hover (a computer), where focusing a text box doesn't pop up a keyboard. */
const typesFreely = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

export default function AskPanel({ open, prefill, onClose }) {
  const [messages, setMessages] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(STORE)) ?? []; } catch { return []; }
  });
  const [input, setInput] = useState('');
  // A question handed over by the right-click menu goes into the box, ready to send or edit.
  const [lastPrefill, setLastPrefill] = useState(null);
  if (prefill && prefill !== lastPrefill) { setLastPrefill(prefill); setInput(prefill.text); }
  const [busy, setBusy] = useState(false);
  const controller = useRef(null);
  const list = useRef(null);
  const field = useRef(null);
  const panel = useRef(null);
  const motion = useRef([]);
  const opener = useRef(null);
  const [reduceMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  // The panel stays on screen while its closing motion plays, then hides.
  const [visible, setVisible] = useState(open);
  if (open && !visible) setVisible(true);
  if (!open && visible && reduceMotion) setVisible(false);

  useLayoutEffect(() => {
    const el = panel.current;
    if (!el || !visible) return;
    motion.current.forEach((a) => a.cancel());
    motion.current = [];
    if (open) {
      el.style.pointerEvents = '';
      if (!reduceMotion) motion.current = openMotion(el);
      return;
    }
    el.style.pointerEvents = 'none'; // no stray clicks while it shrinks away
    const away = closeMotion(el);
    motion.current = [away];
    away.onfinish = () => {
      setVisible(false);
      if (el.contains(document.activeElement)) opener.current?.focus?.({ preventScroll: true });
    };
  }, [open, visible, reduceMotion]);
  useEffect(() => () => motion.current.forEach((a) => a.cancel()), []);

  useEffect(() => {
    try { sessionStorage.setItem(STORE, JSON.stringify(messages.slice(-20))); } catch { /* storage unavailable */ }
    list.current?.scrollTo({ top: list.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);
  useEffect(() => {
    if (!open) return undefined;
    if (!panel.current?.contains(document.activeElement)) opener.current = document.activeElement;
    // Only a mouse-and-keyboard device puts the cursor straight into the question box. On touch screens that
    // would pop the on-screen keyboard up uninvited, so the chat itself takes focus and the keyboard opens
    // only when the visitor taps the box.
    if (typesFreely()) field.current?.focus({ preventScroll: true });
    else panel.current?.focus({ preventScroll: true });
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  useEffect(() => () => controller.current?.abort(), []);

  const update = (fn) => setMessages((all) => { const next = [...all]; next[next.length - 1] = fn(next[next.length - 1]); return next; });

  async function ask(question) {
    const q = question.trim();
    if (!q || busy) return;
    const history = messages.filter((m) => m.text && !m.error).map((m) => ({ role: m.role, content: m.text }));
    setMessages((all) => [...all, { role: 'user', text: q }, { role: 'assistant', text: '', sources: [], pending: true }]);
    setInput('');
    setBusy(true);
    const ac = new AbortController();
    controller.current = ac;
    try {
      const res = await fetch('/api/ask', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: q, history }), signal: ac.signal,
      });
      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({}));
        update((m) => ({ ...m, pending: false, error: true, text: err.error ?? 'Something went wrong. Please try again.' }));
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();
        for (const line of lines) {
          if (!line.trim()) continue;
          const ev = JSON.parse(line);
          if (ev.type === 'sources') update((m) => ({ ...m, sources: ev.sources, mode: ev.mode }));
          else if (ev.type === 'text') update((m) => ({ ...m, pending: false, text: m.text + ev.text }));
          else if (ev.type === 'notice') update((m) => ({ ...m, pending: false, notice: ev.text }));
          else if (ev.type === 'web') update((m) => ({ ...m, web: { sources: ev.sources ?? [], suggestions: ev.suggestions ?? '' } }));
          else if (ev.type === 'error') update((m) => ({ ...m, pending: false, error: true, text: m.text || ev.message }));
        }
      }
      update((m) => ({ ...m, pending: false }));
    } catch (err) {
      update((m) => ({ ...m, pending: false, ...(err?.name === 'AbortError' ? { stopped: true } : { error: true, text: m.text || 'Couldn’t reach Joey. Check your connection and try again.' }) }));
    } finally {
      setBusy(false);
      controller.current = null;
    }
  }

  const reset = () => { controller.current?.abort(); setMessages([]); if (typesFreely()) field.current?.focus(); };

  return (
    <div ref={panel} className={`ask-panel ${open ? 'is-open' : ''}`} role="dialog" aria-modal="false" aria-label="Chat with Joey, the club’s assistant" tabIndex={-1} hidden={!visible}>
      <header className="ask-head">
        <span className="ask-avatar" aria-hidden="true"><RobotIcon size={24} /></span>
        <div className="ask-title">
          <strong>Joey</strong>
          <span>Answers from this website and the web</span>
        </div>
        {messages.length > 0 && <button type="button" className="ask-icon-btn" onClick={reset} aria-label="Start a new conversation" title="New conversation"><FaRotateLeft size={14} /></button>}
        <button type="button" className="ask-icon-btn" onClick={onClose} aria-label="Close Joey"><FaXmark size={16} /></button>
      </header>

      <div className="ask-body" ref={list} aria-live="polite">
        {messages.length === 0 ? (
          <div className="ask-welcome">
            <p className="ask-hello">Hi, I’m <strong>Joey</strong>, Rotaract Club of Khopoli’s assistant! Ask me anything about the club: joining, volunteering, our projects, the team or Rotaract.</p>
            <div className="ask-suggest">
              {SUGGESTIONS.map((s) => <button key={s} type="button" onClick={() => ask(s)}>{s}</button>)}
            </div>
          </div>
        ) : messages.map((m, i) => (
          m.role === 'user' ? (
            <div key={i} className="ask-msg is-user"><p>{m.text}</p></div>
          ) : (
            <div key={i} className={`ask-msg is-bot ${m.error ? 'is-error' : ''}`}>
              {m.pending ? (
                <span className="ask-typing" aria-label="Thinking"><i /><i /><i /></span>
              ) : (
                <>
                  <Answer text={m.text} sources={m.sources ?? []} />
                  {m.notice && <p className="ask-notice">{m.notice}</p>}
                  {m.stopped && <p className="ask-notice">Stopped.</p>}
                  {!m.error && m.sources?.length > 0 && (!m.web?.sources?.length || /\[\d/.test(m.text)) && (
                    <div className="ask-sources">
                      {m.web?.sources?.length > 0 && <span className="ask-sources-label">On this site</span>}
                      {m.sources.slice(0, 4).map((s, n) => (
                        <Link key={s.url + s.title} href={s.url} className="ask-source"><b>{n + 1}</b><span>{s.title}</span><FaArrowRight size={10} aria-hidden="true" /></Link>
                      ))}
                    </div>
                  )}
                  {!m.error && m.web?.sources?.length > 0 && (
                    <div className="ask-sources is-web">
                      <span className="ask-sources-label"><FaGlobe size={11} aria-hidden="true" /> From the web</span>
                      {m.web.sources.slice(0, 4).map((s) => (
                        <a key={s.url} href={s.url} className="ask-source" target="_blank" rel="noopener noreferrer"><b><FaGlobe size={10} aria-hidden="true" /></b><span>{s.title}</span><FaArrowUpRightFromSquare size={10} aria-hidden="true" /></a>
                      ))}
                      {m.web.suggestions && <SearchSuggestions html={m.web.suggestions} />}
                    </div>
                  )}
                </>
              )}
            </div>
          )
        ))}
      </div>

      <form className="ask-form" onSubmit={(e) => { e.preventDefault(); ask(input); }}>
        <textarea
          ref={field} rows={1} value={input} maxLength={500} placeholder="Ask Joey anything…" aria-label="Your question"
          onChange={(e) => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`; }}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(input); } }}
        />
        {busy ? (
          <button type="button" className="ask-send is-stop" onClick={() => controller.current?.abort()} aria-label="Stop the answer"><FaStop size={12} /></button>
        ) : (
          <button type="submit" className="ask-send" disabled={!input.trim()} aria-label="Send"><FaArrowUp size={14} /></button>
        )}
      </form>
      <p className="ask-foot">AI answers can be wrong. Please don’t share personal details.</p>
    </div>
  );
}
