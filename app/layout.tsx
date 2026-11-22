import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DepsDive — Deep Package Intelligence & Supply Chain Audit',
  description: 'Audit npm and PyPI packages before installing. Track download trends, zero-day CVE advisories, dependency graphs, OpenSSF scorecard, and typosquats.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased font-sans">
      <body className="min-h-full flex flex-col bg-[#fcfcfc] text-[#1a1a1a] selection:bg-[#0033ff] selection:text-white">
        {children}
      </body>
    </html>
  );
}
