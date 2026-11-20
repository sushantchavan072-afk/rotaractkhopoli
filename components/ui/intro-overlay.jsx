'use client';

import { useEffect } from 'react';
import Image, { getImageProps } from 'next/image';

/**
 * Home page intro (modelled on radiatinghope.org's opening):
 *   1. the club logo appears alone on white, then fades away;
 *   2. the hero photo opens as a small window low in the middle and grows to fill the screen;
 *   3. the photo glides into its place in the home hero while the page appears around it;
 *   4. the menu fades in and the headline and text rise into place.
 *
 * It plays once per browser session, only on the home page, and never for visitors who prefer
 * reduced motion. The decision is made before first paint by INTRO_SCRIPT in app/layout.jsx,
 * which adds `intro-on` to <html>. A click, key press, scroll or touch skips it. If anything
 * goes wrong, that script removes the class after 8 seconds so the page is never left hidden.
 * Add ?intro=1 to the URL to replay it.
 */

const EASE_IN_OUT = 'cubic-bezier(.76, 0, .24, 1)';
const EASE_OUT = 'cubic-bezier(.2, .7, .2, 1)';

// The full-screen copy of the hero photo. Its URLs are worked out here but only attached when the
// intro actually plays, so repeat visits never download it.
const { props: FRAME_IMG } = getImageProps({ src: '/images/hero.jpg', alt: '', width: 1920, height: 1280, sizes: '100vw', quality: 75 });

export default function IntroOverlay() {
  useEffect(() => {
    const root = document.documentElement;
    if (!root.classList.contains('intro-on')) return undefined;
    try { sessionStorage.setItem('rck-intro', '1'); } catch { /* storage blocked */ }

    const overlay = document.querySelector('.intro');
    const logo = overlay?.querySelector('.intro-logo');
    const frame = overlay?.querySelector('.intro-frame');
    if (!overlay || !logo || !frame) { root.classList.remove('intro-on'); return undefined; }

    window.scrollTo(0, 0);
    overlay.classList.add('is-playing'); // keeps the overlay up after <html> loses intro-on
    // The full-screen photo is created only now, so it never loads on visits without the intro.
    const photo = document.createElement('img');
    photo.alt = '';
    photo.decoding = 'async';
    photo.sizes = '100vw';
    if (FRAME_IMG.srcSet) photo.srcset = FRAME_IMG.srcSet;
    photo.src = FRAME_IMG.src;
    frame.replaceChildren(photo);
    const running = [];
    const timers = [];
    let finished = false;
    const play = (el, frames, opts) => {
      const a = el.animate(frames, { fill: 'both', ...opts });
      running.push(a);
      return a;
    };
    const later = (ms, fn) => timers.push(window.setTimeout(fn, ms));

    /** Reveal the page: menu fades in, hero text rises line by line. */
    const revealPage = (fast) => {
      root.classList.remove('intro-on');
      const d = fast ? 0.4 : 1;
      document.querySelector('.site-header')?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 700 * d, easing: 'ease', fill: 'backwards' });
      const copy = document.querySelectorAll('.home-hero-copy > *');
      copy.forEach((el, i) => {
        const isTitle = el.tagName === 'H1';
        el.animate(
          isTitle
            ? [{ opacity: 0, transform: 'translateY(48px)', clipPath: 'inset(0 0 100% 0)' }, { opacity: 1, transform: 'none', clipPath: 'inset(0 0 -10% 0)' }]
            : [{ opacity: 0, transform: 'translateY(28px)' }, { opacity: 1, transform: 'none' }],
          { duration: (isTitle ? 900 : 700) * d, delay: i * 110 * d, easing: EASE_OUT, fill: 'backwards' },
        );
      });
      document.querySelectorAll('.home-hero-art > :not(.photo):not(.photo-fallback)').forEach((el, i) => {
        el.animate([{ opacity: 0, transform: 'translateY(18px)' }, { opacity: 1, transform: 'none' }], { duration: 600 * d, delay: (250 + i * 120) * d, easing: EASE_OUT, fill: 'backwards' });
      });
    };

    const finish = (skipped) => {
      if (finished) return;
      finished = true;
      timers.forEach((t) => window.clearTimeout(t));
      running.forEach((a) => a.cancel());
      overlay.remove();
      revealPage(skipped);
      removeSkip();
    };

    const onSkip = () => finish(true);
    const skipEvents = ['pointerdown', 'keydown', 'wheel', 'touchstart'];
    const removeSkip = () => skipEvents.forEach((ev) => window.removeEventListener(ev, onSkip));
    skipEvents.forEach((ev) => window.addEventListener(ev, onSkip, { passive: true }));

    // 1. Logo
    play(logo, [
      { opacity: 0, transform: 'translateY(10px) scale(.94)' },
      { opacity: 1, transform: 'none', offset: 0.32 },
      { opacity: 1, transform: 'none', offset: 0.74 },
      { opacity: 0, transform: 'translateY(-8px) scale(.98)' },
    ], { duration: 1500, easing: 'ease-in-out' });

    // 2. The photo opens as a small window and grows to fill the screen
    later(1650, () => {
      frame.style.visibility = 'visible';
      play(frame, [
        { clipPath: 'inset(56% 35% 14% 35% round 6px)' },
        { clipPath: 'inset(0% 0% 0% 0% round 0px)' },
      ], { duration: 1150, easing: EASE_IN_OUT });
      play(photo, [{ transform: 'scale(1.28)' }, { transform: 'scale(1)' }], { duration: 1150, easing: EASE_IN_OUT });
    });

    // 3. It glides into the hero's photo slot as the page fades in around it
    later(2950, () => {
      const art = document.querySelector('.home-hero-art');
      const box = art?.getBoundingClientRect();
      if (!art || !box || box.width === 0) { finish(false); return; }
      const radius = getComputedStyle(art).borderTopLeftRadius || '36px';
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      if (box.top > vh * 0.5) {
        // Phones: the hero photo sits below the fold, so the full-screen photo fades away instead of gliding off-screen.
        play(frame, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(1.04)' }], { duration: 800, easing: 'ease' });
      } else play(frame, [
        { top: '0px', left: '0px', width: `${vw}px`, height: `${vh}px`, borderRadius: '0px', clipPath: 'none' },
        { top: `${box.top}px`, left: `${box.left}px`, width: `${box.width}px`, height: `${box.height}px`, borderRadius: radius, clipPath: 'none' },
      ], { duration: 950, easing: EASE_IN_OUT });
      play(overlay, [{ backgroundColor: 'rgba(255,255,255,1)' }, { backgroundColor: 'rgba(255,255,255,0)' }], { duration: 700, delay: 250, easing: 'ease' });
      later(700, () => revealPage(false));
      later(1000, () => {
        finished = true;
        removeSkip();
        overlay.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250, easing: 'ease' }).finished.then(() => overlay.remove(), () => overlay.remove());
      });
    });

    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      removeSkip();
    };
  }, []);

  return (
    <div className="intro" aria-hidden="true">
      <div className="intro-logo">
        {/* Same file and size as the header logo, so it is already downloaded */}
        <Image src="/images/logos/rotaract-khopoli.png" alt="" width={867} height={296} priority sizes="200px" />
      </div>
      <div className="intro-frame" />
    </div>
  );
}
