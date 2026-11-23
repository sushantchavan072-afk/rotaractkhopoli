'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import RobotIcon from './robot-icon';
import { FaXmark, FaArrowUp, FaStop, FaRotateLeft, FaArrowRight } from 'react-icons/fa6';

const SUGGESTIONS = [
  'How do I join the club?',
  'What was Project Bachpan 2.0?',
  'Where does the club meet?',
  'What happened in August?',
];
const STORE = 'rck-ask';

/** **bold** and [1] citations inside a line of the answer. */
function inline(line, sources) {
  return line.split(/(\*\*[^*]+\*\*|\[\d+(?:\s*,\s*\d+)*\])/g).map((part, i) => {
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
  const blocks = text.trim().split(/\n{2,}/);
  return blocks.map((block, i) => {
    const lines = block.split('\n').filter((l) => l.trim());
    if (lines.length && lines.every((l) => /^\s*[-•]\s+/.test(l))) {
      return <ul key={i}>{lines.map((l, j) => <li key={j}>{inline(l.replace(/^\s*[-•]\s+/, ''), sources)}</li>)}</ul>;
    }
    return <p key={i}>{lines.map((l, j) => <Fragment key={j}>{j > 0 && <br />}{inline(l, sources)}</Fragment>)}</p>;
  });
}

export default function AskPanel({ open, onClose }) {
  const [messages, setMessages] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(STORE)) ?? []; } catch { return []; }
  });
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const controller = useRef(null);
  const list = useRef(null);
  const field = useRef(null);
  const panel = useRef(null);

  useEffect(() => {
    try { sessionStorage.setItem(STORE, JSON.stringify(messages.slice(-20))); } catch { /* storage unavailable */ }
    list.current?.scrollTo({ top: list.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);
  useEffect(() => {
    if (!open) return undefined;
    field.current?.focus({ preventScroll: true });
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
          else if (ev.type === 'error') update((m) => ({ ...m, pending: false, error: true, text: m.text || ev.message }));
        }
      }
      update((m) => ({ ...m, pending: false }));
    } catch (err) {
      update((m) => ({ ...m, pending: false, ...(err?.name === 'AbortError' ? { stopped: true } : { error: true, text: m.text || 'Couldn’t reach the assistant. Check your connection and try again.' }) }));
    } finally {
      setBusy(false);
      controller.current = null;
    }
  }

  const reset = () => { controller.current?.abort(); setMessages([]); field.current?.focus(); };

  return (
    <div ref={panel} className={`ask-panel ${open ? 'is-open' : ''}`} role="dialog" aria-modal="false" aria-label="Ask the club assistant" hidden={!open}>
      <header className="ask-head">
        <span className="ask-avatar" aria-hidden="true"><RobotIcon size={24} /></span>
        <div className="ask-title">
          <strong>Ask Rotaract Khopoli</strong>
          <span>Answers from this website</span>
        </div>
        {messages.length > 0 && <button type="button" className="ask-icon-btn" onClick={reset} aria-label="Start a new conversation" title="New conversation"><FaRotateLeft size={14} /></button>}
        <button type="button" className="ask-icon-btn" onClick={onClose} aria-label="Close the assistant"><FaXmark size={16} /></button>
      </header>

      <div className="ask-body" ref={list} aria-live="polite">
        {messages.length === 0 ? (
          <div className="ask-welcome">
            <p className="ask-hello">Hi! Ask me anything about the club: joining, volunteering, our projects, the team or Rotaract.</p>
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
                  {!m.error && m.sources?.length > 0 && (
                    <div className="ask-sources">
                      {m.sources.slice(0, 4).map((s, n) => (
                        <Link key={s.url + s.title} href={s.url} className="ask-source"><b>{n + 1}</b><span>{s.title}</span><FaArrowRight size={10} aria-hidden="true" /></Link>
                      ))}
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
          ref={field} rows={1} value={input} maxLength={500} placeholder="Ask anything about the club…" aria-label="Your question"
          onChange={(e) => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`; }}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(input); } }}
        />
        {busy ? (
          <button type="button" className="ask-send is-stop" onClick={() => controller.current?.abort()} aria-label="Stop the answer"><FaStop size={12} /></button>
        ) : (
          <button type="submit" className="ask-send" disabled={!input.trim()} aria-label="Send"><FaArrowUp size={14} /></button>
        )}
      </form>
      <p className="ask-foot">AI answers can be wrong. Check the linked pages.</p>
    </div>
  );
}
