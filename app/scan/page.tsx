'use client';

import React, { Suspense, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  UploadCloud,
  FileCode2,
  AlertCircle,
  Loader2,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ComparisonModal } from '@/components/ComparisonModal';
import { ScanResultTable } from '@/components/scan/ScanResultTable';
import { parseManifestFile } from '@/lib/manifestParser';
import { exportScanResultsToPdf } from '@/lib/pdfExport';
import type { ScanPackageResult } from '@/app/api/scan/route';
import type { ComparisonTarget, Ecosystem } from '@/lib/types';

const MAX_FILE_BYTES = 2 * 1024 * 1024; // 2 MB

const SAMPLE_PACKAGE_JSON = JSON.stringify(
  {
    name: 'sample-web-app',
    version: '1.0.0',
    dependencies: {
      react: '19.0.0',
      lodash: '4.17.20',
      axios: '0.21.1',
      zod: '3.23.8',
    },
    devDependencies: {
      typescript: '5.6.3',
    },
  },
  null,
  2
);

const SAMPLE_REQUIREMENTS_TXT = `# Sample Python dependencies
fastapi==0.115.0
requests==2.25.1
pyyaml==5.3.1
pydantic==2.9.2
`;

interface ScanResponseState {
  ecosystem: Ecosystem;
  fileName: string;
  results: ScanPackageResult[];
  summary: {
    total: number;
    safe: number;
    vulnerable: number;
    totalCves: number;
  };
}

function ScanContent() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfNotice, setPdfNotice] = useState<string | null>(null);
  const [scanData, setScanData] = useState<ScanResponseState | null>(null);

  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [compareTargets] = useState<ComparisonTarget[]>([
    { ecosystem: 'npm', name: 'axios' },
    { ecosystem: 'npm', name: 'got' },
  ]);

  const runManifestScan = async (fileName: string, content: string) => {
    setError(null);
    setPdfNotice(null);
    setScanning(true);

    try {
      const parsed = parseManifestFile(fileName, content);
      if (parsed.dependencies.length === 0) {
        throw new Error(`No dependencies found in "${fileName}".`);
      }

      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ecosystem: parsed.ecosystem,
          packages: parsed.dependencies,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to scan dependencies.');
      }

      setScanData({
        ecosystem: json.ecosystem,
        fileName,
        results: json.results,
        summary: json.summary,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to process this file.';
      setError(msg);
      setScanData(null);
    } finally {
      setScanning(false);
    }
  };

  const handleFile = async (file: File) => {
    if (file.size > MAX_FILE_BYTES) {
      setError('File exceeds the 2 MB limit. Please upload a standard package.json or requirements.txt.');
      return;
    }

    const lower = file.name.toLowerCase();
    if (!lower.endsWith('.json') && !lower.endsWith('.txt')) {
      setError('Unsupported file type. Please upload a package.json (.json) or requirements.txt (.txt) file.');
      return;
    }

    const text = await file.text();
    await runManifestScan(file.name, text);
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFile(file);
    }
    e.target.value = '';
  };

  const handleDrop = async (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await handleFile(file);
    }
  };

  const handleExportPdf = () => {
    if (!scanData) return;
    exportScanResultsToPdf({
      fileName: scanData.fileName,
      ecosystem: scanData.ecosystem,
      results: scanData.results,
      summary: scanData.summary,
    });
    setPdfNotice(`Exported PDF report for ${scanData.fileName}`);
    setTimeout(() => setPdfNotice(null), 3500);
  };

  const resetScan = () => {
    setScanData(null);
    setError(null);
    setPdfNotice(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-[#0f172a] relative">
      {/* Unified Sky Atmosphere */}
      <div className="sky-full-page-bg" aria-hidden="true">
        <div className="sky-clouds-overlay" />
      </div>

      {/* Centered Flush Apple Notch Header */}
      <header className="sticky top-0 z-40 w-full flex justify-center px-3 sm:px-6 pointer-events-none">
        <Navbar onOpenCompare={() => setIsCompareOpen(true)} />
      </header>

      <main
        id="main-content"
        className="w-full max-w-[960px] mx-auto px-5 sm:px-8 pt-10 sm:pt-14 pb-20 relative z-10 flex-1"
      >
        {/* Hero Header over Zenith Cobalt Sky */}
        <div className="text-center max-w-2xl mx-auto mb-9 sm:mb-11">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[#e0f2fe] hover:text-white transition-colors duration-150 mb-5 rounded-full px-3 py-1 bg-white/12 border border-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Back to Search</span>
          </Link>

          <h1 className="font-display font-semibold text-[34px] sm:text-[48px] leading-[1.06] tracking-[-0.03em] text-white [text-shadow:0_2px_20px_rgba(3,28,77,0.28)]">
            Manifest{' '}
            <span className="font-serif-accent italic font-normal text-[#dff3ff]">
              CVE Scanner.
            </span>
          </h1>
          <p className="mt-3 text-[15px] sm:text-[16px] text-[#eaf4ff] leading-relaxed">
            Upload a <code className="font-mono text-[14px] text-white">package.json</code> or{' '}
            <code className="font-mono text-[14px] text-white">requirements.txt</code> to check every dependency for known CVEs and export a PDF report.
          </p>
        </div>

        {/* Crisp Frosted Card Shell */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-[#cde3fa] shadow-[0_24px_64px_-16px_rgba(3,28,77,0.2)] p-6 sm:p-10 space-y-6">
          {/* Upload Dropzone */}
          {!scanData && !scanning && (
            <div className="space-y-5">
              <label
                htmlFor="manifest-file-input"
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`group flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center cursor-pointer transition-all duration-150 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#0558d6] ${
                  isDragging
                    ? 'border-[#0558d6] bg-[#eff6ff]'
                    : 'border-[#bdd6f4] bg-[#f8fbff] hover:border-[#087cf8] hover:bg-[#eff6ff]/60'
                }`}
              >
                <input
                  ref={fileInputRef}
                  id="manifest-file-input"
                  type="file"
                  accept=".json,.txt,application/json,text/plain"
                  onChange={handleInputChange}
                  aria-label="Upload package.json or requirements.txt file"
                  className="sr-only"
                />
                <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-[#eff6ff] border border-[#cde3fa] text-[#0558d6] mb-4 transition-transform duration-150 group-hover:-translate-y-0.5">
                  <UploadCloud className="h-6 w-6" aria-hidden="true" />
                </div>
                <p className="font-display text-[17px] font-semibold text-[#0f172a]">
                  Drop your manifest here, or click to browse
                </p>
                <p className="mt-1.5 text-[13.5px] text-[#475569]">
                  Supports <span className="font-mono text-[#0f172a]">package.json</span> (npm) and{' '}
                  <span className="font-mono text-[#0f172a]">requirements.txt</span> (PyPI) up to 2 MB
                </p>
              </label>

              {/* Quick Sample Triggers */}
              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1 text-[12.5px] text-[#475569]">
                <span>Try a sample:</span>
                <button
                  type="button"
                  onClick={() => runManifestScan('package.json', SAMPLE_PACKAGE_JSON)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#dce7f5] bg-white hover:bg-[#eff6ff] hover:border-[#93c5fd] text-[#0f172a] font-mono text-[12px] cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0558d6]"
                >
                  <FileCode2 className="h-3.5 w-3.5 text-[#0558d6]" aria-hidden="true" />
                  <span>package.json</span>
                </button>
                <button
                  type="button"
                  onClick={() => runManifestScan('requirements.txt', SAMPLE_REQUIREMENTS_TXT)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#dce7f5] bg-white hover:bg-[#eff6ff] hover:border-[#93c5fd] text-[#0f172a] font-mono text-[12px] cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0558d6]"
                >
                  <FileCode2 className="h-3.5 w-3.5 text-[#0558d6]" aria-hidden="true" />
                  <span>requirements.txt</span>
                </button>
              </div>
            </div>
          )}

          {/* Scanning Loading State */}
          {scanning && (
            <div className="py-14 flex flex-col items-center justify-center text-center space-y-3">
              <Loader2 className="h-8 w-8 text-[#0558d6] animate-spin" aria-hidden="true" />
              <p className="font-display text-[17px] font-semibold text-[#0f172a]">
                Scanning dependencies against OSV.dev...
              </p>
              <p className="text-[13.5px] text-[#475569]">
                Checking every package version for known CVEs and security advisories.
              </p>
            </div>
          )}

          {/* Error Banner */}
          {error && !scanning && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-2xl border border-[#fcccd1] bg-[#feecee] p-4 text-[13.5px] text-[#b82429]"
            >
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="flex-1">
                <p className="font-semibold">Could not scan manifest</p>
                <p className="mt-0.5 text-[#991b1b]">{error}</p>
              </div>
            </div>
          )}

          {/* PDF Export Confirmation Live Region */}
          {pdfNotice && (
            <div
              role="status"
              aria-live="polite"
              className="flex items-center gap-2.5 rounded-xl border border-[#bcf2ce] bg-[#eefcf3] px-4 py-2.5 text-[13px] font-medium text-[#0d7a42]"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{pdfNotice}</span>
            </div>
          )}

          {/* Scan Results Header + Table */}
          {scanData && !scanning && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#e8eef7]">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#eff6ff] border border-[#bfdbfe] text-[#0558d6] font-mono text-[12px] font-semibold uppercase">
                    {scanData.ecosystem}
                  </span>
                  <h2 className="font-display text-[19px] font-semibold text-[#0f172a]">
                    {scanData.fileName}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={resetScan}
                  className="inline-flex items-center gap-1.5 self-start sm:self-auto px-3 py-1.5 rounded-lg border border-[#dce7f5] bg-white hover:bg-[#f8fbff] text-[12.5px] font-medium text-[#475569] hover:text-[#0f172a] cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0558d6]"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Scan another file</span>
                </button>
              </div>

              <ScanResultTable
                results={scanData.results}
                ecosystem={scanData.ecosystem}
                fileName={scanData.fileName}
                summary={scanData.summary}
                onExportPdf={handleExportPdf}
              />
            </div>
          )}
        </div>
      </main>

      <Footer onOpenCompare={() => setIsCompareOpen(true)} />

      <ComparisonModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        initialPackages={compareTargets}
      />
    </div>
  );
}

export default function ScanPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#f4f8ff] text-[#475569] text-[14px]">
          Loading scanner...
        </div>
      }
    >
      <ScanContent />
    </Suspense>
  );
}
