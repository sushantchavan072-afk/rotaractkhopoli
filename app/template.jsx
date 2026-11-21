'use client';

import { useEffect, useState } from 'react';

/**
 * Wraps every page. Next.js mounts a fresh copy on each page change, so the new page fades in
 * (see .page-enter in globals.css). The very first page load is not animated: the content is
 * already on screen from the server, and hiding it would only delay it.
 */
let navigated = false;

export default function Template({ children }) {
  const [animate] = useState(() => navigated);
  useEffect(() => { navigated = true; }, []);
  return <div className={animate ? 'page-enter' : undefined}>{children}</div>;
}
