import type { Metadata } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://knowyourdeps.dev';

export const metadata: Metadata = {
  alternates: { canonical: `${BASE_URL}/scan` },
  title: 'Manifest CVE Scanner — Scan package.json & requirements.txt',
  description:
    'Paste or upload a package.json (npm) or requirements.txt (PyPI) and instantly get a full CVE report with severity badges, OSV.dev and NVD links, and a one-click PDF export.',
  keywords: [
    'CVE scanner',
    'package.json security audit',
    'requirements.txt vulnerability scan',
    'npm vulnerability checker',
    'PyPI security scan',
    'dependency CVE report',
    'OSV.dev scan',
    'software composition analysis',
  ],
  openGraph: {
    url: `${BASE_URL}/scan`,
    title: 'Manifest CVE Scanner — KnowYourDeps',
    description:
      'Scan your package.json or requirements.txt for CVEs in seconds. Get severity badges, OSV.dev links, and a downloadable PDF report.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'KnowYourDeps Manifest CVE Scanner' }],
  },
  twitter: {
    title: 'Manifest CVE Scanner — KnowYourDeps',
    description:
      'Paste or upload a package.json / requirements.txt and get a full CVE report with PDF export. Free, no sign-up.',
    images: ['/og-image.png'],
  },
};

const webPageJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Manifest CVE Scanner',
  url: `${BASE_URL}/scan`,
  description:
    'Scan a package.json or requirements.txt for known CVEs using OSV.dev, NVD, and GitHub Advisories. Export results to PDF.',
  isPartOf: { '@type': 'WebSite', name: 'KnowYourDeps', url: BASE_URL },
};

export default function ScanLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }}
      />
      {children}
    </>
  );
}
