"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { accent, pageAccent, paletteAt, SCROLL_STEP } from "@/lib/accent";

// ---------------------------------------------------------------------------
// Site background: a quiet dot grid that glows around the mouse, merged with
// the ASCII "wake" trail.
//
// - Dots sit on a 32px grid at very low opacity.
// - Dots within ~150px of the (eased) pointer swell slightly and glow,
//   fading out with distance.
// - The dots, the glow and the click sparks drift through the Rotary family
//   colours as the page scrolls (lib/accent.js); each page starts elsewhere.
// - Moving the mouse also stamps a short-lived trail of monospace characters
//   in the Rotary family colours; fast passes leave thin, quick trails, slow
//   passes leave fatter ones that linger.
// - Nothing is redrawn while the pointer is still: an idle page costs no CPU.
//   The loop also stops while the tab is hidden.
// - Touch screens and reduced-motion visitors get the plain dot grid only.
// ---------------------------------------------------------------------------

const DOT_GAP = 32; // px between dots (must match background-size of .site-bg)
const DOT_R = 1.05; // resting dot radius (the grid itself is drawn by CSS)
const GLOW_RADIUS = 150; // px around the pointer that glows
const EASE = 0.14; // how quickly the glow follows the pointer

const CELL = 12; // ASCII trail cell size
const RAMP = " .:-=+*#%@";
// Rotary royal blue, Rotary gold, Rotaract cranberry, Interact sky blue, plus the site's coral and green.
const TRAIL_COLORS = ["#17458f", "#e89a00", "#d41367", "#00a2e0", "#f2774f", "#2fbf68"];
const COLOR_STEP_MS = 90; // the trail moves on to the next colour every ~90 ms

export function DotGlowBackground({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pathname = usePathname();
  const pathRef = useRef(pathname);
  const recolorRef = useRef<() => void>(() => {});
  // A new page starts the colour cycle at its own colour.
  useEffect(() => {
    pathRef.current = pathname;
    recolorRef.current();
  }, [pathname]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const interactive = finePointer && !reduced;
    const monoFont =
      getComputedStyle(document.documentElement).getPropertyValue("--font-mono").trim() ||
      "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

    let width = 0;
    let height = 0;
    let cols = 0;
    let rows = 0;
    let heat = new Float32Array(0);
    let rate = new Float32Array(0);
    let hue = new Uint8Array(0);
    let raf = 0;
    let last = 0;
    const target = { x: -1e4, y: -1e4, active: false };
    const glow = { x: -1e4, y: -1e4 };
    const trail = { x: 0, y: 0, t: 0, has: false };
    let trailColor = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = `${CELL * 0.85}px ${monoFont}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      cols = Math.ceil(width / CELL);
      rows = Math.ceil(height / CELL);
      heat = new Float32Array(cols * rows);
      rate = new Float32Array(cols * rows).fill(1.4);
      hue = new Uint8Array(cols * rows);
    };

    /** Paint one frame. Returns true while something is still moving. */
    const draw = (dt: number): boolean => {
      ctx.clearRect(0, 0, width, height);

      // The glow eases toward the pointer.
      if (target.active) {
        glow.x += (target.x - glow.x) * EASE;
        glow.y += (target.y - glow.y) * EASE;
      }
      const glowing = interactive && target.active;
      const r2 = GLOW_RADIUS * GLOW_RADIUS;

      // The resting dot grid is a static CSS background on the canvas (see .site-bg in globals.css),
      // so each frame only paints the few glowing dots inside the glow radius.
      if (glowing) {
        ctx.fillStyle = `rgba(${accent.rgb.join(", ")}, 0.32)`;
        const x0 = Math.max(0, Math.floor((glow.x - GLOW_RADIUS) / DOT_GAP));
        const x1 = Math.ceil((glow.x + GLOW_RADIUS) / DOT_GAP);
        const y0 = Math.max(0, Math.floor((glow.y - GLOW_RADIUS) / DOT_GAP));
        const y1 = Math.ceil((glow.y + GLOW_RADIUS) / DOT_GAP);
        for (let gy = y0; gy <= y1; gy++) {
          const y = gy * DOT_GAP + DOT_GAP / 2;
          for (let gx = x0; gx <= x1; gx++) {
            const x = gx * DOT_GAP + DOT_GAP / 2;
            const dx = x - glow.x;
            const dy = y - glow.y;
            const d2 = dx * dx + dy * dy;
            if (d2 >= r2) continue;
            const a = 1 - Math.sqrt(d2) / GLOW_RADIUS;
            if (a <= 0.01) continue;
            ctx.globalAlpha = 0.45 + a * 0.55;
            ctx.beginPath();
            ctx.arc(x, y, DOT_R + a * 0.7, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.globalAlpha = 1;
      }

      // ASCII trail: decay heat and draw, one pass per colour.
      let hot = false;
      for (let i = 0; i < heat.length; i++) {
        if (heat[i]! > 0) {
          heat[i]! -= rate[i]! * dt;
          if (heat[i]! < 0) heat[i] = 0;
          else hot = true;
        }
      }
      if (hot) {
        for (let c = 0; c < TRAIL_COLORS.length; c++) {
          ctx.fillStyle = TRAIL_COLORS[c]!;
          for (let i = 0; i < heat.length; i++) {
            const lum = heat[i]!;
            if (lum <= 0.03 || hue[i] !== c) continue;
            const ch = RAMP[Math.min(RAMP.length - 1, Math.floor(lum * (RAMP.length - 1)))];
            if (!ch || ch === " ") continue;
            ctx.globalAlpha = Math.min(1, 0.15 + lum * 0.85);
            const gx = i % cols;
            const gy = (i - gx) / cols;
            ctx.fillText(ch, gx * CELL + CELL / 2, gy * CELL + CELL / 2);
          }
        }
        ctx.globalAlpha = 1;
      }

      const easing = glowing && (Math.abs(target.x - glow.x) > 0.5 || Math.abs(target.y - glow.y) > 0.5);
      return hot || easing;
    };

    const loop = (now: number) => {
      const dt = last ? Math.min(64, now - last) / 1000 : 1 / 60;
      last = now;
      const moving = draw(dt);
      raf = moving && !document.hidden ? requestAnimationFrame(loop) : 0;
      if (!raf) last = 0;
    };
    const wake = () => {
      if (!raf && !document.hidden) raf = requestAnimationFrame(loop);
    };

    // Stamp a soft blot of heat; fast passes are thin and fade quickly.
    const stamp = (px: number, py: number, radiusCells: number, decay: number) => {
      const cx = px / CELL;
      const cy = py / CELL;
      const r = Math.max(0.6, radiusCells);
      const x0 = Math.max(0, Math.floor(cx - r));
      const x1 = Math.min(cols - 1, Math.ceil(cx + r));
      const y0 = Math.max(0, Math.floor(cy - r));
      const y1 = Math.min(rows - 1, Math.ceil(cy + r));
      for (let gy = y0; gy <= y1; gy++) {
        for (let gx = x0; gx <= x1; gx++) {
          const d = Math.hypot(gx + 0.5 - cx, gy + 0.5 - cy);
          if (d > r) continue;
          const v = 1 - d / r;
          const idx = gy * cols + gx;
          if (v > heat[idx]!) {
            heat[idx] = v;
            rate[idx] = decay;
            hue[idx] = trailColor;
          }
        }
      }
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return; // finger drags are scrolls
      const x = e.clientX;
      const y = e.clientY;
      const now = performance.now();
      if (!target.active) {
        glow.x = x;
        glow.y = y;
      }
      target.x = x;
      target.y = y;
      target.active = true;
      trailColor = Math.floor(now / COLOR_STEP_MS) % TRAIL_COLORS.length;
      if (trail.has) {
        const dx = x - trail.x;
        const dy = y - trail.y;
        const dist = Math.hypot(dx, dy);
        const speed = dist / Math.max(1, now - trail.t);
        const radiusCells = Math.max(0.6, Math.min(2.6, 2.4 / (1 + speed * 1.6)));
        const decay = Math.max(0.8, Math.min(4.5, 1 + speed * 3.2));
        const steps = Math.max(1, Math.ceil(dist / (CELL * 0.5)));
        for (let s = 1; s <= steps; s++) stamp(trail.x + (dx * s) / steps, trail.y + (dy * s) / steps, radiusCells, decay);
      } else {
        stamp(x, y, 1.4, 1.4);
      }
      trail.x = x;
      trail.y = y;
      trail.t = now;
      trail.has = true;
      wake();
    };
    const onLeave = () => {
      target.active = false;
      trail.has = false;
      wake();
    };
    const onVisibility = () => {
      if (!document.hidden) wake();
    };

    // Scroll colour: blend along the palette as the page scrolls.
    let lastRgb = "";
    let scrollRaf = 0;
    const recolor = () => {
      scrollRaf = 0;
      const rgb = paletteAt(pageAccent(pathRef.current).start + window.scrollY / SCROLL_STEP);
      const key = rgb.join(", ");
      if (key === lastRgb) return;
      lastRgb = key;
      accent.rgb = rgb;
      canvas.style.setProperty("--dot-rgb", key);
      if (target.active) wake();
    };
    recolorRef.current = recolor;
    const onScroll = () => {
      if (!scrollRaf) scrollRaf = requestAnimationFrame(recolor);
    };

    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const onResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resizeTimer = null;
        resize();
        draw(0);
      }, 150);
    };

    resize();
    recolor();
    draw(0);
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    if (interactive) {
      window.addEventListener("pointermove", onMove, { passive: true });
      document.documentElement.addEventListener("pointerleave", onLeave);
      document.addEventListener("visibilitychange", onVisibility);
    }

    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(scrollRaf);
      recolorRef.current = () => {};
      if (resizeTimer) clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className={`site-bg ${className}`.trim()} />;
}

export default DotGlowBackground;
