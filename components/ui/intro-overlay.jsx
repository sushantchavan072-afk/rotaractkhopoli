'use client';

import { useEffect } from 'react';
import Image, { getImageProps } from 'next/image';

/**
 * Home page intro (modelled on radiatinghope.org's opening):
 *   1. the club logo fades in alone on white (a plain fade), then disintegrates into dust as it
 *      leaves (vanilla-disintegrate's `dust` preset, captured with SnapDOM);
 *   2. the hero photo fades in, rising from the bottom as a rounded card covering 80% of the screen;
 *   3. the card slides across into its place in the home hero on the right while the page appears
 *      around it (on phones, where the hero photo is below the fold, it slides off to the right);
 *   4. the menu fades in and the headline and text rise into place.
 *
 * It plays once per browser session, only on the home page, and never for visitors who prefer
 * reduced motion. The decision is made before first paint by INTRO_SCRIPT in app/layout.jsx,
 * which adds `intro-on` to <html>. A click, key press, scroll or touch skips it. If anything
 * goes wrong, that script removes the class after 8 seconds so the page is never left hidden.
 * Add ?intro=1 to the URL to replay it.
 *
 * Sound: the dust and wind sounds bundled with vanilla-disintegrate play with the dust and with the
 * photo's rise and slide (the slide pans towards the right, following the photo). Browsers only allow
 * sound once the visitor has interacted with the site, so on many first visits the intro is silent;
 * nothing ever waits for the sound, and the audio files are only downloaded when sound is allowed.
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

/** Starts audio if the browser allows it right now; resolves to null otherwise (never blocks the intro). */
async function loadIntroSound() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  let ctx;
  try {
    ctx = new Ctx();
    await Promise.race([ctx.resume(), new Promise((r) => { setTimeout(r, 250); })]);
    if (ctx.state !== 'running') { ctx.close(); return null; }
    const { builtInSounds } = await import('vanilla-disintegrate/sounds');
    const load = async (url) => ctx.decodeAudioData(await (await fetch(url)).arrayBuffer());
    const [dust, wind] = await Promise.all([load(builtInSounds.dust), load(builtInSounds.wind)]);
    return { ctx, dust, wind, sources: [] };
  } catch {
    ctx?.close().catch(() => {});
    return null;
  }
}

/** Plays part of a sound with a short fade in/out, optionally panning across the speakers while it plays. */
function playSound(snd, buffer, { gain = 0.4, offset = 0, duration, rate = 1, panFrom = 0, panTo = panFrom, fadeIn = 0.03, fadeOut = 0.35 } = {}) {
  if (!snd || !buffer) return;
  const { ctx } = snd;
  const t = ctx.currentTime;
  const len = Math.min(duration ?? Infinity, (buffer.duration - offset) / rate);
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.playbackRate.value = rate;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + fadeIn);
  g.gain.setValueAtTime(gain, t + Math.max(fadeIn, len - fadeOut));
  g.gain.linearRampToValueAtTime(0, t + len);
  src.connect(g);
  if (ctx.createStereoPanner) {
    const pan = ctx.createStereoPanner();
    pan.pan.setValueAtTime(panFrom, t);
    pan.pan.linearRampToValueAtTime(panTo, t + len);
    g.connect(pan).connect(ctx.destination);
  } else {
    g.connect(ctx.destination);
  }
  src.start(t, offset, len * rate);
  snd.sources.push(src);
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

    // Sound loads alongside the particle library; whatever is ready in time is used.
    let sound = null;
    const soundReady = loadIntroSound().then((s) => { sound = s; return s; });
    const stopSound = (fade = 0.15) => {
      soundReady.then((s) => {
        if (!s) return;
        const t = s.ctx.currentTime;
        s.sources.forEach((src) => { try { src.stop(t + fade); } catch { /* already stopped */ } });
        window.setTimeout(() => s.ctx.close().catch(() => {}), fade * 1000 + 2500);
      });
    };

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

    // An animation only takes effect once it has started (a frame or two later), so elements are
    // un-hidden only when their fade-ins are running; un-hiding first made them flash in for a frame.
    const whenRunning = (anims, fn) => Promise.all(anims.map((a) => a.ready)).then(fn, fn);

    /** Hero text rises line by line (the menu and the things on the photo stay hidden). */
    const revealCopy = (d = 1) => {
      const anims = [];
      document.querySelectorAll('.home-hero-copy > *').forEach((el, i) => {
        const isTitle = el.tagName === 'H1';
        anims.push(el.animate(
          isTitle
            ? [{ opacity: 0, transform: 'translateY(48px)', clipPath: 'inset(0 0 100% 0)' }, { opacity: 1, transform: 'none', clipPath: 'inset(0 0 -10% 0)' }]
            : [{ opacity: 0, transform: 'translateY(28px)' }, { opacity: 1, transform: 'none' }],
          { duration: (isTitle ? 900 : 700) * d, delay: i * 110 * d, easing: EASE_OUT, fill: 'backwards' },
        ));
      });
      whenRunning(anims, () => root.classList.add('intro-copy'));
    };
    /** The things that sit on the photo (menu pill, quote, gallery link, project card) come in once it has landed. */
    const revealOnPhoto = (d = 1) => {
      const anims = [];
      const header = document.querySelector('.site-header');
      if (header) anims.push(header.animate([{ opacity: 0, transform: 'translateY(-10px)' }, { opacity: 1, transform: 'none' }], { duration: 600 * d, easing: EASE_OUT, fill: 'backwards' }));
      document.querySelectorAll('.home-hero-art > :not(.photo):not(.photo-fallback)').forEach((el, i) => {
        anims.push(el.animate([{ opacity: 0, transform: 'translateY(18px) scale(.98)' }, { opacity: 1, transform: 'none' }], { duration: 650 * d, delay: (80 + i * 110) * d, easing: EASE_OUT, fill: 'backwards' }));
      });
      whenRunning(anims, () => root.classList.remove('intro-on', 'intro-copy'));
    };

    const removeSkip = () => skipEvents.forEach((ev) => window.removeEventListener(ev, onSkip));
    const finish = (skipped) => {
      if (done) return;
      done = true;
      timers.forEach((t) => window.clearTimeout(t));
      running.forEach((a) => a.cancel());
      effects?.destroy();
      stopSound();
      hide();
      revealCopy(skipped ? 0.4 : 1);
      revealOnPhoto(skipped ? 0.4 : 1);
      removeSkip();
    };
    const onSkip = () => finish(true);
    const skipEvents = ['pointerdown', 'keydown', 'wheel', 'touchstart'];
    skipEvents.forEach((ev) => window.addEventListener(ev, onSkip, { passive: true }));

    const sequence = async () => {
      // 1. The logo appears...
      await play(logoBox, [{ opacity: 0 }, { opacity: 1 }], { duration: 700, easing: 'ease' }).finished;
      await Promise.all([wait(650), Promise.race([effectsReady, wait(1200)])]);
      if (done) return;

      // ...and turns to dust (or simply fades where WebGL2 is unavailable).
      playSound(sound, sound?.dust, { gain: 0.55, fadeOut: 0.25 });
      if (effects) {
        const op = effects.remove(logoImg, { detach: (el) => { el.style.visibility = 'hidden'; } });
        // Start the photo while the last of the dust is still drifting.
        await Promise.race([op.finished.catch(() => {}), wait(1300)]);
      } else {
        await play(logoBox, [{ opacity: 1, filter: 'blur(0)' }, { opacity: 0, filter: 'blur(6px)' }], { duration: 450, easing: 'ease' }).finished;
      }
      if (done) return;

      // 2. The photo fades in, rising from the bottom as a big rounded card that almost fills the screen.
      //    Only transform, opacity and clip-path are animated, so the browser can run it smoothly: the
      //    frame is a full-screen layer clipped to the card, and the photo inside is positioned once at
      //    its final size and moved/scaled with a transform.
      await Promise.race([photo.decode().catch(() => {}), wait(1500)]);
      if (done) return;
      const vw = document.documentElement.clientWidth; // the visible width, without the scrollbar gutter
      const vh = document.documentElement.clientHeight;
      const art = document.querySelector('.home-hero-art');
      const A = art?.getBoundingClientRect();
      if (!art || !A || A.width === 0) { finish(false); return; }
      const m = Math.round(Math.min(vw, vh) * 0.035);
      const B = { left: m, top: m, width: vw - 2 * m, height: vh - 2 * m };
      const ratio = (photo.naturalWidth || 1400) / (photo.naturalHeight || 1810);
      const cover = (r, zoom = 1) => {
        let w = r.width; let h = r.width / ratio;
        if (h < r.height) { h = r.height; w = r.height * ratio; }
        w *= zoom; h *= zoom;
        return { left: r.left + (r.width - w) / 2, top: r.top + (r.height - h) / 2, width: w, height: h };
      };
      const F = cover(A); // where the photo ends: exactly as the hero shows it
      Object.assign(photo.style, { left: `${F.left}px`, top: `${F.top}px`, width: `${F.width}px`, height: `${F.height}px` });
      const toTransform = (r) => `translate(${(r.left - F.left).toFixed(2)}px, ${(r.top - F.top).toFixed(2)}px) scale(${(r.width / F.width).toFixed(4)})`;
      const R = 28;
      const clipB = `inset(${m}px ${m}px ${m}px ${m}px round ${R}px)`;
      const artRadius = parseFloat(getComputedStyle(art).borderTopLeftRadius) || 36;
      const below = A.bottom > vh; // the hero photo runs past the bottom of the screen
      const clipA = `inset(${A.top.toFixed(1)}px ${(vw - A.right).toFixed(1)}px ${Math.max(0, vh - A.bottom).toFixed(1)}px ${A.left.toFixed(1)}px round ${artRadius}px ${artRadius}px ${below ? 0 : artRadius}px ${below ? 0 : artRadius}px)`;

      frame.style.clipPath = clipB;
      frame.style.visibility = 'visible';
      play(frame, [{ opacity: 0, transform: `translateY(${Math.round(vh * 0.3)}px)` }, { opacity: 1, transform: 'none' }], { duration: 1000, easing: EASE_OUT });
      playSound(sound, sound?.wind, { gain: 0.32, duration: 1.15, fadeIn: 0.08, fadeOut: 0.5 });
      play(photo, [{ transform: toTransform(cover(B, 1.08)) }, { transform: toTransform(cover(B)) }], { duration: 1300, easing: EASE_OUT });
      await wait(1250);
      if (done) return;

      // 3. It slides across into its place on the right; the hero text rises as it goes.
      const bg = overlay.querySelector('.intro-bg');
      if (A.top > vh * 0.5) {
        // Phones: the hero photo sits below the fold, so the card slides off to the right instead.
        play(frame, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateX(${Math.round(vw * 0.9)}px)` }], { duration: 900, easing: EASE_IN_OUT });
      } else {
        play(frame, [{ clipPath: clipB }, { clipPath: clipA }], { duration: 1100, easing: EASE_IN_OUT });
        play(photo, [{ transform: toTransform(cover(B)) }, { transform: 'none' }], { duration: 1100, easing: EASE_IN_OUT });
      }
      playSound(sound, sound?.wind, A.top > vh * 0.5
        ? { gain: 0.24, offset: 0.5, duration: 0.9, rate: 1.15, panFrom: 0, panTo: 0.8, fadeIn: 0.06, fadeOut: 0.4 }
        : { gain: 0.24, offset: 0.5, duration: 1.1, rate: 1.1, panFrom: -0.1, panTo: 0.6, fadeIn: 0.06, fadeOut: 0.45 });
      if (bg) play(bg, [{ opacity: 1 }, { opacity: 0 }], { duration: 800, delay: 250, easing: 'ease' });
      await wait(350);
      if (done) return;
      revealCopy();
      await wait(800);
      if (done) return;

      // 4. The photo has landed: hand over to the real hero, then the things on it come in.
      done = true;
      removeSkip();
      hide();
      effects?.destroy();
      stopSound(0.4);
      revealOnPhoto();
    };
    sequence().catch(() => finish(true));

    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      removeSkip();
      effects?.destroy();
      stopSound(0);
    };
  }, []);

  return (
    <div className="intro" aria-hidden="true">
      <div className="intro-bg" />
      <div className="intro-logo">
        {/* Same file and size as the header logo, so it is already downloaded */}
        <Image src="/images/logos/rotaract-khopoli.png" alt="" width={867} height={296} priority sizes="200px" />
      </div>
      <div className="intro-frame" />
    </div>
  );
}
