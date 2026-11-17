'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';

type PageEntry = { slug: string; href: string; label: string; hint: string };

const PAGES: PageEntry[] = [
  { slug: 'overview', href: '/', label: 'Overview', hint: 'Your campus at a glance' },
  { slug: 'events', href: '/events', label: 'Events', hint: 'Workshops, meetups and hackathons' },
  { slug: 'people', href: '/students', label: 'People', hint: 'Classmates and project teammates' },
  { slug: 'community', href: '/community', label: 'Community', hint: 'Questions, ideas and projects' },
  { slug: 'lost-found', href: '/lost-found', label: 'Lost & Found', hint: 'Find or report a missing item' },
  { slug: 'saved', href: '/events#save', label: 'Saved events', hint: 'Your bookmarked events' },
  { slug: 'myspace', href: '/profile', label: 'My space', hint: 'Profile and saved events' },
];

export default function SearchDialog({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PAGES;
    return PAGES.filter((page) => `${page.label} ${page.hint} ${page.href}`.toLowerCase().includes(q));
  }, [query]);

  useEffect(() => {
    const previousActive = document.activeElement as HTMLElement | null;
    inputRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.stopPropagation(); onClose(); return; }
      if (event.key === 'Tab') {
        // Keep Tab inside the dialog: only the input and the list items are focusable.
        const focusables = inputRef.current
          ? [inputRef.current, ...Array.from(document.querySelectorAll<HTMLElement>('.search-item'))]
          : [];
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        return;
      }
      if (event.key === 'ArrowDown') { event.preventDefault(); setActive((i) => (matches.length ? (i + 1) % matches.length : 0)); }
      if (event.key === 'ArrowUp') { event.preventDefault(); setActive((i) => (matches.length ? (i - 1 + matches.length) % matches.length : 0)); }
      if (event.key === 'Enter' && matches[active]) { event.preventDefault(); window.location.assign(matches[active].href); }
    };

    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      previousActive?.focus();
    };
  }, [matches, active, onClose]);

  return (
    <div className="search-overlay" role="dialog" aria-modal="true" aria-label="Find a page" onClick={onClose}>
      <div className="search-dialog" onClick={(event) => event.stopPropagation()}>
        <input
          ref={inputRef}
          className="search-dialog__input"
          value={query}
          onChange={(event) => { setQuery(event.target.value); setActive(0); }}
          placeholder="Find a page…"
          aria-label="Find a page"
          autoComplete="off"
          role="combobox"
          aria-expanded={matches.length > 0}
          aria-activedescendant={matches[active]?.slug}
          aria-controls="search-list"
        />
        <div className="search-list" role="listbox" id="search-list">
          {matches.length === 0 && <div className="empty">No pages match that.</div>}
          {matches.map((page, index) => (
            <Link
              key={page.slug}
              id={page.slug}
              className="search-item"
              role="option"
              aria-selected={index === active}
              data-active={index === active}
              href={page.href}
              onClick={onClose}
            >
              <strong>{page.label}</strong>
              <small>{page.hint}</small>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
