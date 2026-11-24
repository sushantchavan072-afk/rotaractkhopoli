'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

/**
 * The site's own right-click menu: a compact white menu with labels on the left, keyboard shortcuts on the
 * right, dividers and side menus, offering things that make sense on the club website.
 *
 * - What is on it depends on where you right-click: selected text (Copy, Ask Joey about it), a link (Open in
 *   a new tab, Copy link address) or a picture (Open, Copy address, Save), then page actions (Back, Forward,
 *   Reload, Copy page link, Share), club shortcuts (Ask Joey, Go to, Join the Club) and Back to top, Print.
 * - The browser's own menu still appears in text boxes (paste, spelling), on touch screens (long-press),
 *   and with Shift + right-click.
 * - Arrow keys move through it, Right/Left open and close a side menu, Enter chooses, Escape closes.
 */

const SUB_GAP = 6; // space between a menu and the side menu it opens
const PAD = 8; // the menu's padding (globals.css .ctx)
// The highlighted row takes a different strong colour each time it moves (all keep white text readable).
const HUES = ['#d41367', '#17458f', '#c2410c', '#15803d', '#7a3db8', '#0067c8', '#b45309', '#0e7490'];
const PAGES = [['Home', '/'], ['About Us', '/about'], ['Our Team', '/teams'], ['Events', '/events'], ['Blog', '/blog'], ['Gallery', '/gallery'], ['Contact', '/contact']];

const isMac = () => /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
const keys = (mac, win) => (isMac() ? mac : win);
const clip = (text, n = 28) => (text.length > n ? `${text.slice(0, n - 1).trim()}…` : text);

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const t = Object.assign(document.createElement('textarea'), { value: text });
    t.style.cssText = 'position:fixed;opacity:0';
    document.body.append(t);
    t.select();
    document.execCommand('copy');
    t.remove();
  }
}

/** The menu's contents for what was right-clicked. */
function buildItems({ selection, link, image, router }) {
  const items = [];
  const sep = () => { if (items.length && items.at(-1).type !== 'sep') items.push({ type: 'sep' }); };
  const pageUrl = window.location.href;
  const title = document.title;

  if (selection) {
    items.push({ label: 'Copy', key: keys('⌘C', 'Ctrl+C'), run: () => copyText(selection) });
    items.push({ label: `Ask Joey about “${clip(selection, 22)}”`, run: () => window.dispatchEvent(new CustomEvent('rck:ask', { detail: { question: `Tell me about “${selection.slice(0, 200)}”` } })) });
    sep();
  }
  if (link) {
    items.push({ label: 'Open link in new tab', run: () => window.open(link.href, '_blank', 'noopener') });
    items.push({ label: 'Copy link address', run: () => copyText(link.href) });
    sep();
  }
  if (image) {
    items.push({ label: 'Open image in new tab', run: () => window.open(image, '_blank', 'noopener') });
    items.push({ label: 'Copy image address', run: () => copyText(image) });
    items.push({
      label: 'Save image as…',
      run: () => {
        const a = Object.assign(document.createElement('a'), { href: image, download: (new URL(image, pageUrl).searchParams.get('url') ?? image).split('/').pop().split('?')[0] || 'image' });
        document.body.append(a);
        a.click();
        a.remove();
      },
    });
    sep();
  }
  items.push({ label: 'Back', key: keys('⌘[', 'Alt+←'), disabled: window.history.length <= 1, run: () => router.back() });
  items.push({ label: 'Forward', key: keys('⌘]', 'Alt+→'), run: () => router.forward() });
  items.push({ label: 'Reload', key: keys('⌘R', 'Ctrl+R'), run: () => window.location.reload() });
  sep();
  items.push({ label: 'Copy page link', run: () => copyText(pageUrl) });
  items.push({
    label: 'Share page',
    submenu: [
      { label: 'WhatsApp', run: () => window.open(`https://wa.me/?text=${encodeURIComponent(`${title} ${pageUrl}`)}`, '_blank', 'noopener') },
      { label: 'Email', run: () => { window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(pageUrl)}`; } },
      { label: 'Copy link', run: () => copyText(pageUrl) },
      ...(navigator.share ? [{ type: 'sep' }, { label: 'More options…', run: () => navigator.share({ title, url: pageUrl }).catch(() => {}) }] : []),
    ],
  });
  sep();
  items.push({ label: 'Ask Joey', run: () => window.dispatchEvent(new Event('rck:ask')) });
  items.push({ label: 'Go to', submenu: PAGES.map(([label, href]) => ({ label, current: window.location.pathname === href, run: () => router.push(href) })) });
  items.push({ label: 'Join the Club', run: () => router.push('/join') });
  sep();
  items.push({ label: 'Back to top', key: keys('⌘↑', 'Home'), disabled: window.scrollY < 40, run: () => window.scrollTo({ top: 0, behavior: 'smooth' }) });
  items.push({ label: 'Print page', key: keys('⌘P', 'Ctrl+P'), run: () => window.print() });
  return items;
}

/** Keeps a box of the given size inside the window, flipping it to the other side of (x, y) if needed. */
function place(x, y, w, h, altX = x) {
  const pad = 8;
  let left = x;
  let originX = 'left';
  if (left + w > window.innerWidth - pad) { left = Math.max(pad, altX - w); originX = 'right'; }
  let top = y;
  let originY = 'top';
  if (top + h > window.innerHeight - pad) { top = Math.max(pad, Math.min(y - h, window.innerHeight - pad - h)); originY = 'bottom'; }
  return { left, top, origin: `${originX} ${originY}` };
}

function Menu({ items, at, onPick, onClose, depth = 0, onLeave, labelledBy, hueRef }) {
  const box = useRef(null);
  const [pos, setPos] = useState(null);
  const [active, setActiveIndex] = useState(-1);
  const [hue, setHue] = useState(HUES[0]);
  const setActive = (i) => {
    if (i !== active) { hueRef.current = (hueRef.current + 1) % HUES.length; setHue(HUES[hueRef.current]); }
    setActiveIndex(i);
  };
  const [sub, setSub] = useState(null); // { index, at: { x, y, altX } }
  const subTimer = useRef(0);
  const usable = items.map((it, i) => (it.type === 'sep' || it.disabled ? -1 : i)).filter((i) => i >= 0);

  useLayoutEffect(() => {
    // Layout size, not the on-screen box: the opening zoom starts at 96%, which would make it look smaller.
    setPos(place(at.x, at.y, box.current.offsetWidth, box.current.offsetHeight, at.altX));
  }, [at]);
  // Take keyboard focus once placed (a hidden element can't be focused).
  const placed = Boolean(pos);
  useEffect(() => { if (placed) box.current?.focus({ preventScroll: true }); }, [placed]);
  useEffect(() => () => window.clearTimeout(subTimer.current), []);

  const openSub = (i, delay = 0) => {
    window.clearTimeout(subTimer.current);
    subTimer.current = window.setTimeout(() => {
      if (!items[i]?.submenu) { setSub(null); return; }
      const row = box.current?.querySelector(`[data-i="${i}"]`)?.getBoundingClientRect();
      // A small gap from the menu's edge, with the side menu's first item level with the hovered row.
      const menu = box.current?.getBoundingClientRect();
      if (row && menu) setSub({ index: i, at: { x: menu.right + SUB_GAP, y: row.top - PAD, altX: menu.left - SUB_GAP } });
    }, delay);
  };
  const choose = (i) => {
    const it = items[i];
    if (!it || it.type === 'sep' || it.disabled) return;
    if (it.submenu) { openSub(i); return; }
    onPick(it);
  };
  const onKey = (e) => {
    const k = e.key;
    if (k === 'ArrowDown' || k === 'ArrowUp') {
      e.preventDefault();
      const at2 = usable.indexOf(active);
      const next = k === 'ArrowDown' ? usable[(at2 + 1) % usable.length] : usable[(at2 - 1 + usable.length) % usable.length];
      setActive(next ?? usable[0]);
    } else if (k === 'Home' || k === 'End') {
      e.preventDefault();
      setActive(k === 'Home' ? usable[0] : usable.at(-1));
    } else if (k === 'ArrowRight' && items[active]?.submenu) {
      e.preventDefault();
      openSub(active);
    } else if (k === 'ArrowLeft' && depth > 0) {
      e.preventDefault();
      onLeave?.();
    } else if (k === 'Enter' || k === ' ') {
      e.preventDefault();
      choose(active);
    } else if (k === 'Escape') {
      e.preventDefault();
      if (depth > 0) onLeave?.(); else onClose();
    } else if (k === 'Tab') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <>
      <div
        ref={box} className="ctx" role="menu" tabIndex={-1} aria-labelledby={labelledBy} onKeyDown={onKey}
        aria-activedescendant={active >= 0 ? `ctx-${depth}-${active}` : undefined}
        style={pos ? { left: pos.left, top: pos.top, transformOrigin: pos.origin } : { left: -9999, top: 0, visibility: 'hidden' }}
        onContextMenu={(e) => e.preventDefault()}
      >
        {items.map((it, i) => (it.type === 'sep' ? <div key={`s${i}`} className="ctx-sep" role="separator" /> : (
          <div
            key={it.label} id={`ctx-${depth}-${i}`} data-i={i} role="menuitem" aria-disabled={it.disabled || undefined}
            aria-haspopup={it.submenu ? 'menu' : undefined} aria-expanded={it.submenu ? sub?.index === i : undefined}
            className={`ctx-item ${active === i ? 'is-active' : ''} ${it.current ? 'is-current' : ''}`}
            style={active === i ? { '--ctx-hl': hue } : undefined}
            onPointerEnter={() => { if (!it.disabled) setActive(i); openSub(i, it.submenu ? 90 : 160); }}
            onClick={() => choose(i)}
          >
            <span className="ctx-label">{it.label}</span>
            {it.submenu ? (
              <svg className="ctx-arrow" width="8" height="8" viewBox="0 0 8 8" aria-hidden="true"><path d="M2.5 1.5 5.5 4l-3 2.5" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" /></svg>
            ) : it.key && <span className="ctx-key">{it.key}</span>}
          </div>
        )))}
      </div>
      {sub && (
        <Menu
          items={items[sub.index].submenu} at={sub.at} depth={depth + 1} onPick={onPick} onClose={onClose} labelledBy={`ctx-${depth}-${sub.index}`} hueRef={hueRef}
          onLeave={() => { setSub(null); box.current?.focus({ preventScroll: true }); setActive(sub.index); }}
        />
      )}
    </>
  );
}

export default function ContextMenu() {
  const [menu, setMenu] = useState(null); // { items, at, key }
  const router = useRouter();
  const pathname = usePathname();
  const close = useCallback(() => setMenu(null), []);
  const hueRef = useRef(0); // shared by the menu and its side menus, so the colours keep moving on

  // Close whenever the page changes.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) { setLastPath(pathname); setMenu(null); }

  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    const onContext = (e) => {
      if (!fine.matches || e.shiftKey || e.defaultPrevented) return; // phones, tablets and Shift keep the browser's menu
      const t = e.target instanceof Element ? e.target : null;
      if (!t || t.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"], iframe, video, .ctx')) return;
      e.preventDefault();
      // Selected text counts only when the right-click is on it, as in the browser's own menu.
      const sel = window.getSelection?.();
      const onSelection = sel && !sel.isCollapsed && sel.rangeCount > 0
        && [...sel.getRangeAt(0).getClientRects()].some((r) => e.clientX >= r.left - 2 && e.clientX <= r.right + 2 && e.clientY >= r.top - 2 && e.clientY <= r.bottom + 2);
      const selection = onSelection ? String(sel).trim() : '';
      const linkEl = t.closest('a[href]');
      const link = linkEl && !/^(mailto|tel|javascript):/i.test(linkEl.getAttribute('href')) ? { href: linkEl.href } : null;
      const img = t.closest('img');
      const image = img ? (img.currentSrc || img.src) : null;
      // From the keyboard (menu key / Shift+F10) there is no pointer position: open by the focused element.
      const fromKeys = e.clientX === 0 && e.clientY === 0;
      const r = fromKeys ? t.getBoundingClientRect() : null;
      const x = fromKeys ? r.left + 12 : e.clientX;
      const y = fromKeys ? r.top + Math.min(r.height, 40) : e.clientY;
      hueRef.current = Math.floor(Math.random() * HUES.length); // a different starting colour for each opening
      setMenu({ items: buildItems({ selection, link, image, router }), at: { x, y, altX: x }, key: Date.now() });
    };
    document.addEventListener('contextmenu', onContext);
    return () => document.removeEventListener('contextmenu', onContext);
  }, [router]);

  useEffect(() => {
    if (!menu) return undefined;
    const onDown = (e) => { if (!(e.target instanceof Element && e.target.closest('.ctx'))) close(); };
    // Scrolling closes the menu, but not a scroll that was already gliding (smooth or trackpad) when it opened.
    const openedAt = performance.now();
    const onScroll = (e) => { if (performance.now() - openedAt > 300 && !(e.target instanceof Element && e.target.closest('.ctx'))) close(); };
    const onWheel = (e) => { if (!(e.target instanceof Element && e.target.closest('.ctx'))) close(); };
    document.addEventListener('pointerdown', onDown, true);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('resize', close);
    window.addEventListener('blur', close);
    return () => {
      document.removeEventListener('pointerdown', onDown, true);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', close);
      window.removeEventListener('blur', close);
    };
  }, [menu, close]);

  if (!menu) return null;
  return (
    <Menu
      key={menu.key} items={menu.items} at={menu.at} onClose={close} hueRef={hueRef}
      onPick={(it) => { close(); it.run?.(); }}
    />
  );
}
