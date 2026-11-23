'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { FaWandMagicSparkles } from 'react-icons/fa6';

// The chat window's code is only downloaded the first time someone opens it.
const AskPanel = dynamic(() => import('./ask-panel'), { ssr: false });

/**
 * The site assistant's entry points: a round button in the corner on phones and tablets, and the
 * "Ask AI" item in the desktop menu (which fires the `rck:ask` event). Mounted once in the layout,
 * so a conversation carries on across pages.
 */
export default function AskLauncher() {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const onAsk = () => { setLoaded(true); setOpen(true); };
    window.addEventListener('rck:ask', onAsk);
    return () => window.removeEventListener('rck:ask', onAsk);
  }, []);
  return (
    <>
      {!open && (
        <button type="button" className="ask-fab" aria-label="Ask the club assistant" onClick={() => { setLoaded(true); setOpen(true); }}>
          <FaWandMagicSparkles size={20} aria-hidden="true" />
        </button>
      )}
      {loaded && <AskPanel open={open} onClose={() => setOpen(false)} />}
    </>
  );
}
