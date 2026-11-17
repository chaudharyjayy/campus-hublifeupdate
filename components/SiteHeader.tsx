'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import SearchDialog from '@/components/SearchDialog';

const NAV = [
  { label: 'Overview', href: '/' },
  { label: 'Events', href: '/events' },
  { label: 'People', href: '/students' },
  { label: 'Community', href: '/community' },
  { label: 'Lost & Found', href: '/lost-found' },
];

function ThemeMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a9 9 0 1 0 11 11z" />
    </svg>
  );
}

function SearchMark() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="7.5" /><path d="M16 16l5 5" />
    </svg>
  );
}

export default function SiteHeader() {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

  const toggleTheme = () => {
    setDark((wasDark) => {
      const next = !wasDark;
      document.documentElement.dataset.theme = next ? 'dark' : 'light';
      try { localStorage.setItem('campushub:theme', next ? 'dark' : 'light'); } catch { /* ignore */ }
      return next;
    });
  };

  return (
    <header className="hub-header">
      <div className="container hub-header__top">
        <Link className="hub-brand" href="/" aria-label="CampusHub home">
          <span className="brand-mark" aria-hidden="true">U</span>
          <span className="hub-brand__name">CampusHub<span className="brand-dot">.</span></span>
        </Link>

        <nav className="route-nav" aria-label="Primary">
          {NAV.map(({ label, href }) => (
            <Link key={href} href={href} aria-current={isActive(href) ? 'page' : undefined}>{label}</Link>
          ))}
        </nav>

        <div className="header-tools">
          <button type="button" className="chip-button" onClick={() => setSearchOpen(true)} aria-label="Find a page (Cmd or Ctrl K)">
            <SearchMark />
            <span>Find a page</span>
          </button>
          <button type="button" className="chip-button" onClick={toggleTheme} aria-pressed={dark} aria-label="Switch to dark mode">
            <ThemeMark />
            <span>{dark ? 'Light mode' : 'Dark mode'}</span>
          </button>
          <Link className="profile-link" href="/profile" aria-label="My space">P</Link>
        </div>
      </div>

      {searchOpen && <SearchDialog onClose={() => setSearchOpen(false)} />}
    </header>
  );
}
