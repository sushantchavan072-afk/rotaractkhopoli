"use client";

import { useEffect, useRef } from "react";

// ---------------------------------------------------------------------------
// Custom cursor: a small Rotary-blue arrow that replaces the system pointer on
// mouse / trackpad devices, turns Rotaract cranberry and grows slightly over
// links and buttons, and gives a short spark burst on click.
// Text fields keep the normal text cursor. Touch screens and reduced-motion
// visitors keep the system cursor and get no sparks.
// ---------------------------------------------------------------------------

const SPARK_COUNT = 8;
const SPARK_RADIUS = 18;
const SPARK_SIZE = 8;
const SPARK_MS = 420;
const SPARK_COLOR = "#d41367";
const INTERACTIVE = "a, button, summary, label, select, [role='button'], input[type='checkbox'], input[type='radio'], input[type='submit']";
const TEXT_FIELD = "input:not([type='checkbox']):not([type='radio']):not([type='submit']):not([type='button']), textarea, [contenteditable='true']";

type Spark = { x: number; y: number; angle: number; start: number };

export function CustomCursor() {
  const arrowRef = useRef<HTMLSpanElement>(null);
  const sparkRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const arrow = arrowRef.current;
    const canvas = sparkRef.current;
    const ctx = canvas?.getContext("2d");
    if (!arrow || !canvas || !ctx) return;
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;

    const root = document.documentElement;
    root.classList.add("custom-cursor");

    let x = 0;
    let y = 0;
    let moveRaf = 0;
    let sparkRaf = 0;
    let sparks: Spark[] = [];
    let w = 0;
    let h = 0;

    const place = () => {
      moveRaf = 0;
      arrow.style.transform = `translate3d(${x - 1}px, ${y - 1}px, 0)`;
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      x = e.clientX;
      y = e.clientY;
      const el = e.target instanceof Element ? e.target : null;
      const onText = !!el?.closest(TEXT_FIELD);
      arrow.dataset.state = onText ? "text" : el?.closest(INTERACTIVE) ? "link" : "";
      arrow.style.opacity = onText ? "0" : "1";
      if (!moveRaf) moveRaf = requestAnimationFrame(place);
    };
    const onLeave = () => {
      arrow.style.opacity = "0";
    };

    const sizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const drawSparks = (now: number) => {
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = SPARK_COLOR;
      ctx.lineWidth = 1.5;
      ctx.lineCap = "round";
      sparks = sparks.filter((s) => {
        const t = (now - s.start) / SPARK_MS;
        if (t >= 1) return false;
        const e = t * (2 - t); // ease-out
        const dist = e * SPARK_RADIUS;
        const len = SPARK_SIZE * (1 - e);
        const cos = Math.cos(s.angle);
        const sin = Math.sin(s.angle);
        ctx.beginPath();
        ctx.moveTo(s.x + dist * cos, s.y + dist * sin);
        ctx.lineTo(s.x + (dist + len) * cos, s.y + (dist + len) * sin);
        ctx.stroke();
        return true;
      });
      sparkRaf = sparks.length ? requestAnimationFrame(drawSparks) : 0;
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "touch" || e.button !== 0) return;
      const start = performance.now();
      for (let i = 0; i < SPARK_COUNT; i++) sparks.push({ x: e.clientX, y: e.clientY, angle: (2 * Math.PI * i) / SPARK_COUNT, start });
      if (!sparkRaf) sparkRaf = requestAnimationFrame(drawSparks);
    };

    sizeCanvas();
    window.addEventListener("resize", sizeCanvas, { passive: true });
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    root.addEventListener("mouseleave", onLeave);
    return () => {
      root.classList.remove("custom-cursor");
      cancelAnimationFrame(moveRaf);
      cancelAnimationFrame(sparkRaf);
      window.removeEventListener("resize", sizeCanvas);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      root.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <>
      <canvas ref={sparkRef} className="cursor-sparks" aria-hidden="true" />
      <span ref={arrowRef} className="cursor-arrow" aria-hidden="true">
        <svg viewBox="0 0 20 20" width="15" height="15" focusable="false">
          {/* A rounded arrow pointing up-left; its tip sits at (1, 1). */}
          <path fill="currentColor" stroke="#fff" strokeWidth="1.2" strokeLinejoin="round" d="M1.4 1.2 L18.6 7.6 Q19.5 8 18.6 8.4 L11.3 11.3 L8.4 18.6 Q8 19.5 7.6 18.6 Z" />
        </svg>
      </span>
    </>
  );
}

export default CustomCursor;
