import type { Metadata } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://knowyourdeps.dev';

export const metadata: Metadata = {
  alternates: { canonical: `${BASE_URL}/docs` },
  title: 'API & MCP Server Docs — KnowYourDeps',
  description:
    'Full API reference and MCP server integration guide for KnowYourDeps. Connect Claude, Cursor, Windsurf, or any MCP-compatible AI coding assistant to live package security intelligence.',
  keywords: [
    'KnowYourDeps API',
    'MCP server',
    'Model Context Protocol',
    'dependency security API',
    'npm CVE API',
    'PyPI vulnerability API',
    'AI coding assistant security',
    'package security intelligence API',
  ],
  openGraph: {
    url: `${BASE_URL}/docs`,
    title: 'API & MCP Server Docs — KnowYourDeps',
    description:
      'Connect your AI coding assistant to live CVE data with the KnowYourDeps MCP server. Full API reference included.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'KnowYourDeps API Documentation' }],
  },
  twitter: {
    title: 'KnowYourDeps MCP Server & API Docs',
    description:
      'Full reference for the KnowYourDeps REST API and Model Context Protocol server. Free, open-source package security tool.',
    images: ['/og-image.png'],
  },
};

const techArticleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: 'KnowYourDeps API & MCP Server Documentation',
  url: `${BASE_URL}/docs`,
  description:
    'API reference and MCP server integration guide for KnowYourDeps, the free package security intelligence platform.',
  author: { '@type': 'Person', name: 'MYSELF-SAYAN', url: 'https://github.com/MYSELF-SAYAN' },
  publisher: { '@type': 'Organization', name: 'KnowYourDeps', url: BASE_URL },
  isPartOf: { '@type': 'WebSite', name: 'KnowYourDeps', url: BASE_URL },
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(techArticleJsonLd) }}
      />
      {children}
    </>
  );
}
