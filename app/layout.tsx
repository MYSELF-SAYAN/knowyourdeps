import type { Metadata, Viewport } from 'next';
import { Host_Grotesk, Instrument_Serif, JetBrains_Mono, Geist } from 'next/font/google';
import './globals.css';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

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

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://knowyourdeps.dev';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  title: {
    default: 'KnowYourDeps — Package Security & Dependency Intelligence',
    template: '%s | KnowYourDeps',
  },
  description:
    'Free security intelligence for npm and PyPI packages. Scan CVEs, check OpenSSF scores, inspect transitive dependencies, and export PDF reports — before you npm install.',

  keywords: [
    'npm security',
    'PyPI security',
    'CVE scanner',
    'dependency audit',
    'package vulnerabilities',
    'OSV.dev',
    'NVD vulnerabilities',
    'supply chain security',
    'package.json audit',
    'requirements.txt audit',
    'open source security',
    'software composition analysis',
    'SCA tool',
    'dependency intelligence',
    'knowyourdeps',
  ],

  authors: [{ name: 'MYSELF-SAYAN', url: 'https://github.com/MYSELF-SAYAN' }],
  creator: 'MYSELF-SAYAN',
  publisher: 'KnowYourDeps',

  category: 'Developer Tools',

  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: BASE_URL,
    siteName: 'KnowYourDeps',
    title: 'KnowYourDeps — Package Security & Dependency Intelligence',
    description:
      'Free CVE scanner and security intelligence for npm and PyPI packages. Paste a package.json or requirements.txt and get a full vulnerability report in seconds.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'KnowYourDeps — Package Security & Dependency Intelligence',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'KnowYourDeps — Package Security & Dependency Intelligence',
    description:
      'Free CVE scanner for npm and PyPI. Scan your package.json or requirements.txt for known vulnerabilities instantly.',
    images: ['/og-image.png'],
    creator: '@MYSELF_SAYAN',
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  alternates: {
    canonical: BASE_URL,
    types: {
      'text/plain': [
        { url: `${BASE_URL}/llms.txt`, title: 'LLM context (summary)' },
        { url: `${BASE_URL}/llms-full.txt`, title: 'LLM context (full)' },
      ],
    },
  },

  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0558d6' },
    { media: '(prefers-color-scheme: dark)', color: '#070b14' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", hostGrotesk.variable, instrumentSerif.variable, jetbrainsMono.variable, "font-sans", geist.variable)}
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
