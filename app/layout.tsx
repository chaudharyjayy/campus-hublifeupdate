import type { Metadata } from 'next';
import './globals.css';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import SakugaScripts from '@/components/SakugaScripts';
import GlobalToast from '@/components/GlobalToast';
import Script from 'next/script';

export const metadata: Metadata = {
  title: {
    default: 'CampusHub · upGrad SOT Pune',
    template: '%s · CampusHub Pune',
  },
  description: 'Find your people, your next event, and your place on campus. The student hub for upGrad SOT Pune: campus events, live Pune hackathons from Devpost, and the people to build with.',
};

/**
 * Outbound CSP for the exported static site (headers can't be set by every static host).
 * frame-ancestors can't be expressed in <meta>; set it host-side if the host supports headers.
 */
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self'",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co http://127.0.0.1:54321 ws://127.0.0.1:54321",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <meta httpEquiv="Content-Security-Policy" content={csp} />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        <Script src="/theme-init.js" strategy="beforeInteractive" />
      </head>
      <body>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <SiteHeader />
        <main id="main-content">{children}</main>
        <SiteFooter />
        <GlobalToast />
        <SakugaScripts />
      </body>
    </html>
  );
}
