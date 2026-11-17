'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function StudentCta() {
  const router = useRouter();
  const askRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = askRef.current;
    if (!el) return;
    const onClick = () => router.push('/community');
    el.addEventListener('click', onClick);
    return () => el.removeEventListener('click', onClick);
  }, [router]);

  return (
    <div className="btn-row">
      <sakuga-button ref={askRef} variant="primary" type="button">Ask for an intro</sakuga-button>
    </div>
  );
}
