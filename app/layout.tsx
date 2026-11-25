import type { Metadata, Viewport } from 'next';
import { Host_Grotesk, Instrument_Serif, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';

const hostGrotesk = Host_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-host',
  display: 'swap',
});

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'KnowYourDeps — Package Security & Dependency Intelligence',
  description:
    'Audit npm and PyPI packages before installing. Inspect CVEs, resolve conflict-free transitive upgrades, check OpenSSF scores, and detect typosquats.',
};

export const viewport: Viewport = {
  themeColor: '#0558d6',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`h-full antialiased font-sans ${hostGrotesk.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-full flex flex-col bg-[#f4f8ff] text-[#0f172a] selection:bg-[#087cf8] selection:text-white">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-[#070b14] focus:text-white focus:text-xs focus:font-semibold focus:outline-2 focus:outline-offset-2 focus:outline-[#38bdf8]"
        >
          Skip to content
        </a>
        {children}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
