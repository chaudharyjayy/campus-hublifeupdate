'use client';

import Script from 'next/script';

/** Sakuga VFX (finktheartist/sakuga-vfx, MIT). Only the three we actually use are loaded. */
export default function SakugaScripts() {
  return (
    <>
      <Script src="/sakuga-vfx/button.js" strategy="afterInteractive" />
      <Script src="/sakuga-vfx/tabs.js" strategy="afterInteractive" />
      <Script src="/sakuga-vfx/toast.js" strategy="afterInteractive" />
    </>
  );
}
