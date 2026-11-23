'use client';

import { useId } from 'react';

/**
 * The site assistant's icon: a round robot head with an antenna, ear pads and a visor. The visor is cut
 * out of the head, so whatever is behind the icon shows through it (white in the menu, the pink gradient
 * on the round button); the eyes and head take the text colour. The eyes blink now and then, and the
 * antenna wiggles when its button is hovered (see .robot-icon in globals.css).
 */
export default function RobotIcon({ size = 20, className = '' }) {
  const mask = `robot-visor-${useId().replace(/:/g, '')}`;
  return (
    <svg className={`robot-icon ${className}`} width={size} height={size} viewBox="0 0 64 64" fill="currentColor" aria-hidden="true" focusable="false">
      <defs>
        <mask id={mask}>
          <rect width="64" height="64" fill="#fff" />
          <ellipse cx="32" cy="38.5" rx="14" ry="11.5" fill="#000" />
        </mask>
      </defs>
      <g className="robot-antenna">
        <circle cx="32" cy="7" r="3.6" />
        <rect x="30.4" y="9" width="3.2" height="7" rx="1.2" />
      </g>
      <g mask={`url(#${mask})`}>
        <rect x="23.5" y="13.5" width="17" height="6.5" rx="2.6" />
        <ellipse cx="32" cy="37.5" rx="20.5" ry="18" />
        <rect x="6.5" y="29" width="7" height="15" rx="3.4" />
        <rect x="50.5" y="29" width="7" height="15" rx="3.4" />
      </g>
      <ellipse className="robot-eye" cx="26" cy="38.5" rx="2.7" ry="3.8" />
      <ellipse className="robot-eye" cx="38" cy="38.5" rx="2.7" ry="3.8" />
    </svg>
  );
}
