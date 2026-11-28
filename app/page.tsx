// Server component — provides metadata + JSON-LD. Client logic lives in HomeClient.
import type { Metadata } from 'next';
import HomeClient from '@/components/HomeClient';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://knowyourdeps.dev';

export const metadata: Metadata = {
  alternates: { canonical: BASE_URL },
  title: 'KnowYourDeps — Package Security & Dependency Intelligence',
  description:
    'Search any npm or PyPI package to instantly see CVEs, OpenSSF scorecard, download trends, transitive dependencies, and safe upgrade paths. Free and open-source.',
  openGraph: {
    url: BASE_URL,
    title: 'KnowYourDeps — Package Security & Dependency Intelligence',
    description:
      'Inspect npm and PyPI packages for CVEs, security advisories, download trends, and dependency graphs before you install.',
  },
  twitter: {
    title: 'KnowYourDeps — Free Package Security Scanner',
    description:
      'Search any npm or PyPI package for CVEs, OpenSSF scores, and dependency health. Free developer security tool.',
  },
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'KnowYourDeps',
  url: BASE_URL,
  description:
    'Free security intelligence for npm and PyPI packages. Scan CVEs, check OpenSSF scores, and inspect transitive dependencies.',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${BASE_URL}/?package={search_term_string}&ecosystem=npm`,
    },
    'query-input': 'required name=search_term_string',
  },
};

const softwareAppJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'KnowYourDeps',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Web',
  url: BASE_URL,
  description: 'Free CVE scanner and dependency intelligence tool for npm and PyPI packages.',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  author: {
    '@type': 'Person',
    name: 'MYSELF-SAYAN',
    url: 'https://github.com/MYSELF-SAYAN',
  },
  featureList: [
    'CVE scanning via OSV.dev and NVD',
    'OpenSSF scorecard',
    'Download analytics',
    'Transitive dependency graph',
    'Package comparison',
    'PDF export',
    'MCP server for AI coding assistants',
  ],
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppJsonLd) }}
      />
      <HomeClient />
    </>
  );
}
