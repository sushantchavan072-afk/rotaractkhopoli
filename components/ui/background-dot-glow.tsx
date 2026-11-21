"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { accent, pageAccent, paletteAt, SCROLL_STEP } from "@/lib/accent";

// ---------------------------------------------------------------------------
// Site background layer: a faint checkerboard (black at 10%) that bulges and
// warps around the mouse, with the ASCII "wake" mouse trail on top. (The colour
// wash is on <body> in app/globals.css, which also draws the same checkerboard
// in CSS until this canvas takes over, so nothing pops in on load.)
//
// - The warp is a soft lens: grid points near the eased pointer are pushed
//   outwards, more strongly while the mouse is moving, and it relaxes to a
//   gentle bulge when the mouse rests, then flat when it leaves.
//
// - Moving the mouse stamps a short-lived trail of monospace characters in the
//   Rotary family colours; fast passes leave thin, quick trails, slow passes
//   leave fatter ones that linger.
// - It also keeps the shared scroll colour (lib/accent.js) up to date for the
//   click sparks: it drifts through the Rotary family colours as the page
//   scrolls, and each page starts elsewhere.
// - Nothing is redrawn while the pointer is still: an idle page costs no CPU.
//   The loop also stops while the tab is hidden.
// - Touch screens and reduced-motion visitors get no trail.
// ---------------------------------------------------------------------------

const CHECK = 44; // checkerboard square size (must match the CSS fallback in globals.css)
const CHECK_FILL = "rgba(0, 0, 0, 0.1)"; // 10% opacity
const WARP_RADIUS = 190; // px around the pointer that warps
const WARP_PUSH = 34; // px the grid is pushed outwards at full strength
const WARP_REST = 0.35; // warp strength while the mouse rests on the page
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
    const trail = { x: 0, y: 0, t: 0, has: false };
    // Warp: eased pointer position and strength.
    const warp = { x: -1e4, y: -1e4, tx: -1e4, ty: -1e4, k: 0, target: 0 };
    let gw = 0;
    let gh = 0;
    let gx = new Float32Array(0);
    let gy = new Float32Array(0);
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
      gw = Math.ceil(width / CHECK) + 2;
      gh = Math.ceil(height / CHECK) + 2;
      gx = new Float32Array(gw * gh);
      gy = new Float32Array(gw * gh);
    };

    /** The checkerboard, every other square filled, with the grid warped around the pointer. */
    const drawChecker = () => {
      const k = warp.k;
      const r2 = WARP_RADIUS * WARP_RADIUS;
      for (let j = 0; j < gh; j++) {
        for (let i = 0; i < gw; i++) {
          const x = i * CHECK;
          const y = j * CHECK;
          let px = x;
          let py = y;
          if (k > 0.001) {
            const dx = x - warp.x;
            const dy = y - warp.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < r2 * 4) {
              const d = Math.sqrt(d2) || 1;
              const f = Math.exp(-d2 / r2) * k * WARP_PUSH;
              px += (dx / d) * f;
              py += (dy / d) * f;
            }
          }
          gx[j * gw + i] = px;
          gy[j * gw + i] = py;
        }
      }
      ctx.fillStyle = CHECK_FILL;
      ctx.beginPath();
      for (let j = 0; j < gh - 1; j++) {
        for (let i = (j + 1) & 1; i < gw - 1; i += 2) { // same squares as the CSS conic-gradient fallback
          const a = j * gw + i;
          const b = a + 1;
          const c = a + gw + 1;
          const e = a + gw;
          ctx.moveTo(gx[a]!, gy[a]!);
          ctx.lineTo(gx[b]!, gy[b]!);
          ctx.lineTo(gx[c]!, gy[c]!);
          ctx.lineTo(gx[e]!, gy[e]!);
          ctx.closePath();
        }
      }
      ctx.fill();
    };

    /** Paint one frame. Returns true while something is still moving. */
    const draw = (dt: number): boolean => {
      ctx.clearRect(0, 0, width, height);

      // Ease the warp toward the pointer and its target strength.
      const ease = 1 - Math.pow(0.84, dt * 60);
      warp.x += (warp.tx - warp.x) * ease;
      warp.y += (warp.ty - warp.y) * ease;
      warp.target += (WARP_REST * (trail.has ? 1 : 0) - warp.target) * (1 - Math.pow(0.9, dt * 60));
      warp.k += (warp.target - warp.k) * (1 - Math.pow(0.88, dt * 60));
      drawChecker();
      const warping = Math.abs(warp.target - warp.k) > 0.002 || Math.abs(warp.tx - warp.x) + Math.abs(warp.ty - warp.y) > 0.3 || Math.abs(warp.target - WARP_REST * (trail.has ? 1 : 0)) > 0.002;


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

      return hot || warping;
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
      trailColor = Math.floor(now / COLOR_STEP_MS) % TRAIL_COLORS.length;
      if (!trail.has) { warp.x = x; warp.y = y; }
      warp.tx = x;
      warp.ty = y;
      if (trail.has) {
        const dx = x - trail.x;
        const dy = y - trail.y;
        const dist = Math.hypot(dx, dy);
        const speed = dist / Math.max(1, now - trail.t);
        // Moving the mouse swells the warp; it settles back to the resting bulge when the mouse stops.
        warp.target = Math.max(warp.target, Math.min(1, WARP_REST + speed * 0.9));
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
    document.documentElement.classList.add("checker-live"); // the canvas now draws the checkerboard
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    if (interactive) {
      window.addEventListener("pointermove", onMove, { passive: true });
      document.documentElement.addEventListener("pointerleave", onLeave);
      document.addEventListener("visibilitychange", onVisibility);
    }

    return () => {
      document.documentElement.classList.remove("checker-live");
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
