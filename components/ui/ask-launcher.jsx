'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import RobotIcon from './robot-icon';

// The chat window's code is only downloaded the first time someone opens it.
const AskPanel = dynamic(() => import('./ask-panel'), { ssr: false });

/**
 * The site assistant's entry points: a round button in the corner on phones and tablets, and the
 * robot (Joey) in the desktop menu (which fires the `rck:ask` event). Mounted once in the layout,
 * so a conversation carries on across pages.
 */
export default function AskLauncher() {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [opened, setOpened] = useState(false); // after the first opening, the round button pops back in on close
  if (open && !opened) setOpened(true);
  useEffect(() => {
    const onAsk = () => { setLoaded(true); setOpen(true); };
    window.addEventListener('rck:ask', onAsk);
    return () => window.removeEventListener('rck:ask', onAsk);
  }, []);
  // Fetch the chat's code ahead of time (when the page is idle, or as soon as a visitor points at or touches
  // Joey's button), so the first opening animation starts at once instead of waiting for the download.
  useEffect(() => {
    let warmed = false;
    // Once the code is here the chat is mounted, hidden, so opening it later is just its animation.
    const warm = () => { if (!warmed) { warmed = true; import('./ask-panel').then(() => setLoaded(true), () => {}); } };
    const onIntent = (e) => { if (e.target instanceof Element && e.target.closest('.nav-ask, .ask-fab')) warm(); };
    document.addEventListener('pointerover', onIntent, { passive: true });
    document.addEventListener('touchstart', onIntent, { passive: true });
    const idle = window.requestIdleCallback ? window.requestIdleCallback(warm, { timeout: 6000 }) : window.setTimeout(warm, 4000);
    return () => {
      document.removeEventListener('pointerover', onIntent);
      document.removeEventListener('touchstart', onIntent);
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle); else window.clearTimeout(idle);
    };
  }, []);
  return (
    <>
      {/* The round button stays in place while the chat is open (hidden), so the chat can grow out of it
          and shrink back into it; it pops back in as the chat finishes closing. */}
      <button
        type="button" className={`ask-fab ${open ? 'is-away' : opened ? 'is-back' : ''}`} aria-label="Chat with Joey, the club’s assistant" title="Ask Joey"
        aria-hidden={open || undefined} tabIndex={open ? -1 : undefined} onClick={() => { setLoaded(true); setOpen(true); }}
      >
        <RobotIcon size={30} />
      </button>
      {loaded && <AskPanel open={open} onClose={() => setOpen(false)} />}
    </>
  );
}
