'use client';

import { useEffect } from 'react';
import Image, { getImageProps } from 'next/image';

/**
 * Home page intro (modelled on radiatinghope.org's opening):
 *   1. the club logo appears alone on white, then disintegrates into dust
 *      (vanilla-disintegrate's `dust` preset, captured with SnapDOM);
 *   2. as the dust drifts away, the hero photo opens as a small window and grows to fill the screen;
 *   3. the photo glides into its place in the home hero while the page appears around it
 *      (on phones, where the hero photo is below the fold, it fades away instead);
 *   4. the menu fades in and the headline and text rise into place.
 *
 * It plays once per browser session, only on the home page, and never for visitors who prefer
 * reduced motion. The decision is made before first paint by INTRO_SCRIPT in app/layout.jsx,
 * which adds `intro-on` to <html>. A click, key press, scroll or touch skips it. If anything
 * goes wrong, that script removes the class after 8 seconds so the page is never left hidden.
 * Add ?intro=1 to the URL to replay it.
 *
 * React owns the overlay's markup, so nothing here removes React's nodes: the overlay is hidden
 * when done, and the disintegrated logo is hidden through the library's `detach` hook.
 */

const EASE_IN_OUT = 'cubic-bezier(.76, 0, .24, 1)';
const EASE_OUT = 'cubic-bezier(.2, .7, .2, 1)';

// The full-screen copy of the hero photo. Its URLs are worked out here but only attached when the
// intro actually plays, so repeat visits never download it.
const { props: FRAME_IMG } = getImageProps({ src: '/images/hero.jpg', alt: '', width: 1920, height: 1280, sizes: '100vw', quality: 75 });

/** True when the browser can create a WebGL2 context, which the dust preset needs. */
function hasWebGL2() {
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return Boolean(gl);
  } catch {
    return false;
  }
}

export default function IntroOverlay() {
  useEffect(() => {
    const root = document.documentElement;
    if (!root.classList.contains('intro-on')) return undefined;
    try { sessionStorage.setItem('rck-intro', '1'); } catch { /* storage blocked */ }

    const overlay = document.querySelector('.intro');
    const logoBox = overlay?.querySelector('.intro-logo');
    const logoImg = logoBox?.querySelector('img');
    const frame = overlay?.querySelector('.intro-frame');
    if (!overlay || !logoBox || !logoImg || !frame) { root.classList.remove('intro-on'); return undefined; }

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

    // Load the particle library in the background while the logo fades in.
    let effects = null;
    const effectsReady = hasWebGL2()
      ? import('vanilla-disintegrate/snapdom')
        .then(({ default: Disintegrator }) => {
          effects = new Disintegrator({ preset: 'dust', sound: false, audioPreparation: false, respectReducedMotion: true });
          return effects.prepare(logoImg).catch(() => {});
        })
        .catch(() => { effects = null; })
      : Promise.resolve();

    const running = [];
    const timers = [];
    let done = false;
    const play = (el, frames, opts) => {
      const a = el.animate(frames, { fill: 'both', ...opts });
      running.push(a);
      return a;
    };
    const wait = (ms) => new Promise((resolve) => { timers.push(window.setTimeout(resolve, ms)); });
    const hide = () => { overlay.classList.remove('is-playing'); overlay.style.display = 'none'; };

    /** Reveal the page: menu fades in, hero text rises line by line. */
    const revealPage = (fast) => {
      root.classList.remove('intro-on');
      const d = fast ? 0.4 : 1;
      document.querySelector('.site-header')?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 700 * d, easing: 'ease', fill: 'backwards' });
      document.querySelectorAll('.home-hero-copy > *').forEach((el, i) => {
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

    const removeSkip = () => skipEvents.forEach((ev) => window.removeEventListener(ev, onSkip));
    const finish = (skipped) => {
      if (done) return;
      done = true;
      timers.forEach((t) => window.clearTimeout(t));
      running.forEach((a) => a.cancel());
      effects?.destroy();
      hide();
      revealPage(skipped);
      removeSkip();
    };
    const onSkip = () => finish(true);
    const skipEvents = ['pointerdown', 'keydown', 'wheel', 'touchstart'];
    skipEvents.forEach((ev) => window.addEventListener(ev, onSkip, { passive: true }));

    const sequence = async () => {
      // 1. The logo appears...
      await play(logoBox, [{ opacity: 0, transform: 'translateY(10px) scale(.94)' }, { opacity: 1, transform: 'none' }], { duration: 520, easing: EASE_OUT }).finished;
      await Promise.all([wait(650), Promise.race([effectsReady, wait(1200)])]);
      if (done) return;

      // ...and turns to dust (or simply fades where WebGL2 is unavailable).
      if (effects) {
        const op = effects.remove(logoImg, { detach: (el) => { el.style.visibility = 'hidden'; } });
        // Start the photo while the last of the dust is still drifting.
        await Promise.race([op.finished.catch(() => {}), wait(1300)]);
      } else {
        await play(logoBox, [{ opacity: 1, filter: 'blur(0)' }, { opacity: 0, filter: 'blur(6px)' }], { duration: 450, easing: 'ease' }).finished;
      }
      if (done) return;

      // 2. The photo opens as a small window and grows to fill the screen.
      frame.style.visibility = 'visible';
      play(frame, [{ clipPath: 'inset(56% 35% 14% 35% round 6px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)' }], { duration: 1150, easing: EASE_IN_OUT });
      play(photo, [{ transform: 'scale(1.28)' }, { transform: 'scale(1)' }], { duration: 1150, easing: EASE_IN_OUT });
      await wait(1300);
      if (done) return;

      // 3. It glides into the hero's photo slot as the page fades in around it.
      const art = document.querySelector('.home-hero-art');
      const box = art?.getBoundingClientRect();
      if (!art || !box || box.width === 0) { finish(false); return; }
      const radius = getComputedStyle(art).borderTopLeftRadius || '36px';
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      if (box.top > vh * 0.5) {
        play(frame, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(1.04)' }], { duration: 800, easing: 'ease' });
      } else {
        play(frame, [
          { top: '0px', left: '0px', width: `${vw}px`, height: `${vh}px`, borderRadius: '0px', clipPath: 'none' },
          { top: `${box.top}px`, left: `${box.left}px`, width: `${box.width}px`, height: `${box.height}px`, borderRadius: radius, clipPath: 'none' },
        ], { duration: 950, easing: EASE_IN_OUT });
      }
      play(overlay, [{ backgroundColor: 'rgba(255,255,255,1)' }, { backgroundColor: 'rgba(255,255,255,0)' }], { duration: 700, delay: 250, easing: 'ease' });
      await wait(700);
      if (done) return;

      // 4. The page comes in.
      revealPage(false);
      await wait(300);
      if (done) return;
      done = true;
      removeSkip();
      const fade = overlay.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250, easing: 'ease' });
      await fade.finished.catch(() => {});
      hide();
      effects?.destroy();
    };
    sequence().catch(() => finish(true));

    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      removeSkip();
      effects?.destroy();
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
