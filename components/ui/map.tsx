"use client";

// World map with animated arcs (Aceternity's "World Map"), adapted for this site:
// - plain CSS instead of Tailwind (.world-map* in app/globals.css) and light mode only (no next-themes);
// - the dotted map is a pre-built static file (public/images/world-dots.svg, from
//   scripts/build-world-map.mjs) instead of being generated in the browser, and locations are
//   placed on it at build time (lib/world-map.js), so visitors never download dotted-map;
// - labels are HTML pills over the map, so they stay crisp and readable at any width, and each can
//   sit above, below, left or right of its point so nearby places do not collide;
// - arcs draw in a loop with `motion`, then pause; reduced motion shows them fully drawn.

import { motion, MotionConfig, useReducedMotion } from "motion/react";

export type MapPoint = { x: number; y: number; label?: string; side?: "top" | "bottom" | "left" | "right" };

interface MapProps {
  /** Arcs between two points, in map coordinates (see lib/world-map.js). */
  dots?: Array<{ start: MapPoint; end: MapPoint }>;
  lineColor?: string;
  showLabels?: boolean;
  animationDuration?: number;
  loop?: boolean;
  /** Size of the map's coordinate space. */
  width?: number;
  height?: number;
}

export function WorldMap({
  dots = [],
  lineColor = "#17458f",
  showLabels = true,
  animationDuration = 2,
  loop = true,
  width = 198,
  height = 100,
}: MapProps) {
  const reduced = useReducedMotion();
  const arc = (a: MapPoint, b: MapPoint) => {
    const midX = (a.x + b.x) / 2;
    const lift = Math.max(6, Math.hypot(b.x - a.x, b.y - a.y) * 0.35);
    const midY = Math.min(a.y, b.y) - lift;
    return `M ${a.x} ${a.y} Q ${midX} ${midY} ${b.x} ${b.y}`;
  };

  const staggerDelay = 0.3;
  const totalAnimationTime = dots.length * staggerDelay + animationDuration;
  const pauseTime = 2;
  const fullCycleDuration = totalAnimationTime + pauseTime;

  // Every distinct point once (shared starts such as "Khopoli" are drawn a single time).
  const points = new Map<string, MapPoint>();
  dots.forEach(({ start, end }) => [start, end].forEach((p) => points.set(`${p.x},${p.y}`, p)));

  return (
    <MotionConfig reducedMotion="user">
      <div className="world-map" style={{ aspectRatio: `${width} / ${height}` }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- static SVG, no optimisation needed */}
        <img src="/images/world-dots.svg" alt="" className="world-map-dots" draggable={false} />
        <svg viewBox={`0 0 ${width} ${height}`} className="world-map-arcs" aria-hidden="true">
          <defs>
            <linearGradient id="world-map-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={lineColor} stopOpacity="0" />
              <stop offset="5%" stopColor={lineColor} stopOpacity="1" />
              <stop offset="95%" stopColor={lineColor} stopOpacity="1" />
              <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
            </linearGradient>
          </defs>

          {dots.map((dot, i) => {
            const d = arc(dot.start, dot.end);
            const startTime = (i * staggerDelay) / fullCycleDuration;
            const endTime = (i * staggerDelay + animationDuration) / fullCycleDuration;
            const resetTime = totalAnimationTime / fullCycleDuration;
            const looping = loop && !reduced;
            return (
              <g key={`arc-${i}`}>
                <motion.path
                  d={d}
                  fill="none"
                  stroke="url(#world-map-gradient)"
                  strokeWidth={0.45}
                  strokeLinecap="round"
                  initial={{ pathLength: reduced ? 1 : 0 }}
                  animate={looping ? { pathLength: [0, 0, 1, 1, 0] } : { pathLength: 1 }}
                  transition={
                    looping
                      ? { duration: fullCycleDuration, times: [0, startTime, endTime, resetTime, 1], ease: "easeInOut", repeat: Infinity, repeatDelay: 0 }
                      : { duration: animationDuration, delay: i * staggerDelay, ease: "easeInOut" }
                  }
                />
                {looping && (
                  <motion.circle
                    r={0.9}
                    fill={lineColor}
                    initial={{ offsetDistance: "0%", opacity: 0 }}
                    animate={{ offsetDistance: [null, "0%", "100%", "100%", "100%"], opacity: [0, 0, 1, 0, 0] }}
                    transition={{ duration: fullCycleDuration, times: [0, startTime, endTime, resetTime, 1], ease: "easeInOut", repeat: Infinity, repeatDelay: 0 }}
                    style={{ offsetPath: `path('${d}')` }}
                  />
                )}
              </g>
            );
          })}

          {[...points.values()].map((p, i) => (
            <g key={`pt-${i}`}>
              <circle cx={p.x} cy={p.y} r={0.9} fill={lineColor} />
              {!reduced && (
                <circle cx={p.x} cy={p.y} r={0.9} fill={lineColor} opacity={0.5}>
                  <animate attributeName="r" from="0.9" to="3.4" dur="2s" begin={`${(i % 3) * 0.5}s`} repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.6" to="0" dur="2s" begin={`${(i % 3) * 0.5}s`} repeatCount="indefinite" />
                </circle>
              )}
            </g>
          ))}
        </svg>

        {showLabels &&
          [...points.values()].filter((p) => p.label).map((p, i) => (
            <span
              key={`label-${i}`}
              className={`world-map-label is-${p.side ?? "top"}`}
              style={{ left: `${(p.x / width) * 100}%`, top: `${(p.y / height) * 100}%` }}
            >
              <motion.span
                initial={{ opacity: 0, y: 5 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + i * 0.2, duration: 0.5 }}
              >
                {p.label}
              </motion.span>
            </span>
          ))}
      </div>
    </MotionConfig>
  );
}

export default WorldMap;
