'use client';

import { useEffect, useRef } from 'react';
import { useSavedEvents, toggleSaved } from '@/lib/saved';
import { markDone, toast } from '@/lib/sakuga';

export default function EventSaveButton(props: { id: string; kind: 'campus' | 'live'; title: string; officialUrl: string | null; deadline: string | null; venue: string | null }) {
  const buttonRef = useRef<HTMLElement | null>(null);
  const entries = useSavedEvents();
  const saved = entries.some((entry) => entry.id === props.id);

  useEffect(() => {
    const el = buttonRef.current;
    if (!el) return;
    const onClick = () => {
      const next = toggleSaved(props);
      const nowSaved = next.some((entry) => entry.id === props.id);
      if (nowSaved) markDone(el as unknown as Parameters<typeof markDone>[0]);
      toast(nowSaved ? 'Saved to your list' : 'Removed from your list');
    };
    el.addEventListener('click', onClick);
    return () => el.removeEventListener('click', onClick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.id]);

  return (
    <sakuga-button ref={buttonRef} variant="secondary" type="button">
      {saved ? 'Saved' : 'Save event'}
    </sakuga-button>
  );
}
