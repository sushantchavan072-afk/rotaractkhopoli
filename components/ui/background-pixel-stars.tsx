"use client";

/**
 * Animated pixel-star background (canvas), adapted for this site:
 * - theme aware: soft brand-coloured stars on light pages, classic bright stars on dark pages
 * - pauses completely while the tab is hidden; resumes where it left off
 * - draws a single still frame for visitors who prefer reduced motion
 * - fewer stars and no shooting stars on data-saver connections
 * - debounced resize that ignores small height changes (mobile address bars)
 * - every timer, frame and listener is cleaned up on unmount
 */

import { memo, useEffect, useRef } from "react";

type Theme = "light" | "dark";

// 16-bit style palettes
const STAR_COLORS: Record<Theme, readonly string[]> = {
  dark: ["#FFFFFF", "#FFFFAA", "#AAAAFF", "#FFAAAA", "#AAFFAA", "#FFAAFF", "#AAFFFF"],
  // Club / Kindora colours: coral, green, yellow, Rotaract cranberry, Interact blue
  light: ["#FD8B6B", "#52D97F", "#FFC93C", "#D22163", "#0099D9"],
};
const OPACITY_SCALE: Record<Theme, number> = { dark: 1, light: 0.4 };
const SHOOTING_TRAIL: Record<Theme, string> = { dark: "180, 242, 255", light: "253, 139, 107" };
const SHOOTING_HEAD: Record<Theme, string> = { dark: "#FFFFFF", light: "#D22163" };

// Configuration constants
const starDensity = 0.00004;
const twinkleProbability = 0.7;
const minTwinkleSpeed = 2;
const maxTwinkleSpeed = 4;
const pixelSize = 6; // CSS px (drawn as 3 canvas px at half resolution)
// Render at half resolution and let CSS scale it up with crisp pixels: 4x fewer pixels to paint each frame.
const RES = 0.5;
const starRegenerationInterval = 5000;
const percentToRegenerate = 0.15;
const maxStars = 160;

const shootingStarPixelSize = 2;
const targetFps = 16; // retro feel, and cheap
const frameInterval = 1000 / targetFps;
const twinkleEvery = 4; // twinkles are a stepped blink, so update them at 4 fps; shooting stars stay at 16 fps

type BackgroundStar = {
  x: number;
  y: number;
  colorIndex: number;
  baseOpacity: number;
  currentOpacity: number;
  twinkle: boolean;
  twinkleSpeed: number;
  twinkleDirection: number; // -1 fading out, 1 fading in
  twinkleTimer: number;
};

type TrailPoint = { x: number; y: number; opacity: number };

type ShootingStar = {
  x: number;
  y: number;
  angle: number;
  speed: number;
  distance: number;
  trail: TrailPoint[];
};

const readTheme = (): Theme =>
  document.documentElement.dataset.theme === "dark" ? "dark" : "light";

export const BackgroundPixelStars = memo(
  () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return undefined;

      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const saveData = Boolean(
        (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData,
      );
      const density = saveData ? starDensity / 2 : starDensity;

      let theme: Theme = readTheme();
      let stars: BackgroundStar[] = [];
      let shooting: ShootingStar[] = [];
      let frame: number | null = null;
      let lastRender = 0;
      let shootingTimer: ReturnType<typeof setTimeout> | null = null;
      let regenTimer: ReturnType<typeof setInterval> | null = null;
      let resizeTimer: ReturnType<typeof setTimeout> | null = null;
      let lastWidth = 0;
      let lastHeight = 0;
      let cssW = 0;
      let cssH = 0;

      const makeStar = (): BackgroundStar => {
        const baseOpacity = Math.random() * 0.5 + 0.5;
        return {
          x: Math.floor(Math.random() * (cssW / pixelSize)) * pixelSize,
          y: Math.floor(Math.random() * (cssH / pixelSize)) * pixelSize,
          colorIndex: Math.floor(Math.random() * 7),
          baseOpacity,
          currentOpacity: baseOpacity,
          twinkle: Math.random() < twinkleProbability,
          twinkleSpeed: minTwinkleSpeed + Math.random() * (maxTwinkleSpeed - minTwinkleSpeed),
          twinkleDirection: -1,
          twinkleTimer: 0,
        };
      };

      const sizeCanvas = (): void => {
        cssW = window.innerWidth;
        cssH = window.innerHeight;
        canvas.width = Math.ceil(cssW * RES);
        canvas.height = Math.ceil(cssH * RES);
        ctx.imageSmoothingEnabled = false;
        lastWidth = cssW;
        lastHeight = cssH;
        const count = Math.min(maxStars, Math.floor(cssW * cssH * density));
        stars = Array.from({ length: count }, makeStar);
      };

      const regenerate = (): void => {
        if (!stars.length) return;
        const n = Math.max(1, Math.floor(stars.length * percentToRegenerate));
        for (let i = 0; i < n; i++) stars[Math.floor(Math.random() * stars.length)] = makeStar();
        dirty = true;
      };

      let dirty = true; // something visible changed since the last paint
      let tick = 0;

      /** Advance twinkles; returns true if any star's brightness changed. */
      const updateTwinkles = (): boolean => {
        let changed = false;
        for (const star of stars) {
          if (!star.twinkle) continue;
          star.twinkleTimer += twinkleEvery / targetFps;
          if (star.twinkleTimer >= star.twinkleSpeed) {
            star.twinkleTimer = 0;
            star.twinkleDirection *= -1;
          }
          const firstHalf = star.twinkleTimer / star.twinkleSpeed < 0.5;
          const next = (star.twinkleDirection < 0) === firstHalf ? star.baseOpacity : star.baseOpacity * 0.3;
          if (next !== star.currentOpacity) {
            star.currentOpacity = next;
            changed = true;
          }
        }
        return changed;
      };

      const draw = (advance: boolean): void => {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.setTransform(RES, 0, 0, RES, 0, 0); // everything below is in CSS pixels
        const palette = STAR_COLORS[theme];
        const scale = OPACITY_SCALE[theme];

        for (const star of stars) {
          ctx.fillStyle = palette[star.colorIndex % palette.length]!;
          ctx.globalAlpha = star.currentOpacity * scale;
          ctx.fillRect(star.x, star.y, pixelSize, pixelSize);
        }
        ctx.globalAlpha = 1;

        if (!advance || !shooting.length) return;

        const w = cssW;
        const h = cssH;
        const trailRgb = SHOOTING_TRAIL[theme];
        const live: ShootingStar[] = [];
        for (const star of shooting) {
          const rad = (star.angle * Math.PI) / 180;
          if (star.distance % 8 < star.speed) star.trail.push({ x: star.x, y: star.y, opacity: 1 });
          star.x += star.speed * Math.cos(rad);
          star.y += star.speed * Math.sin(rad);
          star.distance += star.speed;
          star.trail = star.trail.filter((p) => (p.opacity -= 0.1) > 0);
          if (star.x < -30 || star.x > w + 30 || star.y < -30 || star.y > h + 30) continue;
          live.push(star);

          ctx.save();
          for (const point of star.trail) {
            ctx.setTransform(RES, 0, 0, RES, 0, 0);
            ctx.translate(point.x, point.y);
            ctx.rotate(rad);
            ctx.fillStyle = `rgba(${trailRgb}, ${point.opacity * OPACITY_SCALE[theme] * (theme === "light" ? 1.6 : 1)})`;
            ctx.fillRect(0, 0, shootingStarPixelSize, shootingStarPixelSize);
          }
          ctx.setTransform(RES, 0, 0, RES, 0, 0);
          ctx.translate(star.x, star.y);
          ctx.rotate(rad);
          ctx.fillStyle = SHOOTING_HEAD[theme];
          for (let y = 0; y < 2; y++) {
            for (let x = 0; x < 4; x++) {
              if ((x === 0 && y === 1) || (x === 3 && y === 0)) continue;
              ctx.fillRect(x * shootingStarPixelSize, y * shootingStarPixelSize, shootingStarPixelSize, shootingStarPixelSize);
            }
          }
          ctx.restore();
        }
        shooting = live;
        if (!shooting.length) dirty = true; // clear the last trail on the next frame
      };

      const loop = (timestamp: number): void => {
        frame = requestAnimationFrame(loop);
        if (timestamp - lastRender < frameInterval) return;
        lastRender = timestamp;
        tick = (tick + 1) % twinkleEvery;
        const twinkled = tick === 0 && updateTwinkles();
        // Repaint only when a star changed brightness or a shooting star is moving.
        if (twinkled || shooting.length || dirty) {
          dirty = false;
          draw(true);
        }
      };

      const scheduleShootingStar = (): void => {
        shootingTimer = setTimeout(() => {
          if (shooting.length < 3) {
            shooting.push({
              x: Math.random() * window.innerWidth,
              y: 0,
              angle: 45 + Math.random() * 90,
              speed: Math.random() * 5 + 8,
              distance: 0,
              trail: [],
            });
          }
          scheduleShootingStar();
        }, Math.random() * 4000 + 2000);
      };

      const start = (): void => {
        if (reducedMotion || frame !== null) return;
        lastRender = 0;
        frame = requestAnimationFrame(loop);
        regenTimer = setInterval(regenerate, starRegenerationInterval);
        if (!saveData) scheduleShootingStar();
      };

      const stop = (): void => {
        if (frame !== null) cancelAnimationFrame(frame);
        frame = null;
        if (regenTimer) clearInterval(regenTimer);
        if (shootingTimer) clearTimeout(shootingTimer);
        regenTimer = null;
        shootingTimer = null;
        shooting = [];
      };

      const onVisibility = (): void => (document.hidden ? stop() : start());

      const onResize = (): void => {
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          const widthChanged = window.innerWidth !== lastWidth;
          const heightChanged = Math.abs(window.innerHeight - lastHeight) > 120;
          if (!widthChanged && !heightChanged) return;
          sizeCanvas();
          draw(false);
        }, 200);
      };

      // Redraw immediately when the site theme changes
      const themeObserver = new MutationObserver(() => {
        const next = readTheme();
        if (next !== theme) {
          theme = next;
          draw(false);
        }
      });
      themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

      sizeCanvas();
      draw(false);
      if (!document.hidden) start();
      document.addEventListener("visibilitychange", onVisibility);
      window.addEventListener("resize", onResize, { passive: true });

      return () => {
        stop();
        if (resizeTimer) clearTimeout(resizeTimer);
        themeObserver.disconnect();
        document.removeEventListener("visibilitychange", onVisibility);
        window.removeEventListener("resize", onResize);
      };
    }, []);

    // "pointer-events-none fixed inset-0" from the original Tailwind classes lives in .site-bg (app/globals.css)
    return <canvas ref={canvasRef} className="site-bg" aria-hidden="true" />;
  },
  () => true,
);

BackgroundPixelStars.displayName = "BackgroundPixelStars";

export default BackgroundPixelStars;
