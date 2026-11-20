"use client";

import { useEffect, useRef } from "react";

// ---------------------------------------------------------------------------
// Custom cursor, matched to the one on rotaractscop.org:
// - on mouse / trackpad devices the system pointer is hidden and a 14px navy
//   arrow (hsl(220 65% 22%)) follows the mouse, its tip 1px up-left of the
//   pointer; it fades in on move and out when the mouse leaves the window;
// - every click (or tap) gives a burst of 8 short pink lines (hsl(339 72% 58%))
//   that fly 18px outwards over 420ms with an ease-out.
// Touch screens keep their normal behaviour (no arrow). Reduced-motion
// visitors get the arrow but no sparks.
// ---------------------------------------------------------------------------

const SPARK_COLOR = "hsl(339 72% 58%)";
const SPARK_SIZE = 8;
const SPARK_RADIUS = 18;
const SPARK_COUNT = 8;
const SPARK_MS = 420;

type Spark = { x: number; y: number; angle: number; start: number };

export function CustomCursor() {
  const arrowRef = useRef<HTMLSpanElement>(null);
  const sparkRef = useRef<HTMLCanvasElement>(null);

  // The arrow (fine pointers only)
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const root = document.documentElement;
    root.classList.add("custom-cursor");
    let raf = 0;
    let x = 0;
    let y = 0;
    const place = () => {
      raf = 0;
      const el = arrowRef.current;
      if (el) el.style.transform = `translate3d(${x - 1}px, ${y - 1}px, 0)`;
    };
    const onMove = (e: MouseEvent) => {
      x = e.clientX;
      y = e.clientY;
      const el = arrowRef.current;
      if (el) el.style.opacity = "1";
      if (raf === 0) raf = requestAnimationFrame(place);
    };
    const onLeave = () => {
      if (arrowRef.current) arrowRef.current.style.opacity = "0";
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    root.addEventListener("mouseleave", onLeave);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      root.classList.remove("custom-cursor");
      window.removeEventListener("mousemove", onMove);
      root.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  // Click sparks
  useEffect(() => {
    const canvas = sparkRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let sparks: Spark[] = [];
    let raf = 0;
    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(window.innerWidth * dpr));
      canvas.height = Math.max(1, Math.round(window.innerHeight * dpr));
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
    };
    const draw = (now: number) => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
      ctx.lineCap = "round";
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = SPARK_COLOR;
      sparks = sparks.filter((s) => {
        const t = (now - s.start) / SPARK_MS;
        if (t >= 1) return false;
        const e = Math.max(0, t);
        const eased = e * (2 - e); // ease-out
        const dist = eased * SPARK_RADIUS;
        const len = SPARK_SIZE * (1 - eased);
        const x1 = s.x + dist * Math.cos(s.angle);
        const y1 = s.y + dist * Math.sin(s.angle);
        const x2 = s.x + (dist + len) * Math.cos(s.angle);
        const y2 = s.y + (dist + len) * Math.sin(s.angle);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        return true;
      });
      raf = sparks.length ? requestAnimationFrame(draw) : 0;
    };
    const onClick = (e: MouseEvent) => {
      const start = performance.now();
      for (let i = 0; i < SPARK_COUNT; i++) {
        sparks.push({ x: e.clientX, y: e.clientY, angle: (2 * Math.PI * i) / SPARK_COUNT, start });
      }
      if (!raf) raf = requestAnimationFrame(draw);
    };
    size();
    window.addEventListener("resize", size, { passive: true });
    window.addEventListener("click", onClick, { passive: true });
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("resize", size);
      window.removeEventListener("click", onClick);
    };
  }, []);

  return (
    <>
      <canvas ref={sparkRef} className="cursor-sparks" aria-hidden="true" />
      <span ref={arrowRef} className="cursor-arrow" aria-hidden="true">
        <svg viewBox="0 0 20 20" width="14" height="14" fill="none" focusable="false" xmlns="http://www.w3.org/2000/svg">
          <path fill="currentColor" d="M19.438 6.716 1.115.05A.832.832 0 0 0 .05 1.116L6.712 19.45a.834.834 0 0 0 1.557.025l3.198-8 7.995-3.2a.833.833 0 0 0 0-1.559h-.024Z" />
        </svg>
      </span>
    </>
  );
}

export default CustomCursor;
