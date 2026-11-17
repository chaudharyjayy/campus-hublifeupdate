'use client';

import type { CSSProperties } from 'react';

/** Sakuga toast element; show() messages via lib/sakuga.ts. */
export default function GlobalToast() {
  return (
    <sakuga-toast
      id="global-toast"
      style={{ position: 'fixed', left: 24, bottom: 24, zIndex: 70 } as CSSProperties}
    ></sakuga-toast>
  );
}
