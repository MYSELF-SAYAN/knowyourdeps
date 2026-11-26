import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ScanPackageResult } from '@/app/api/scan/route';
import type { Ecosystem } from './types';

export interface ExportScanPdfOptions {
  fileName: string;
  ecosystem: Ecosystem;
  results: ScanPackageResult[];
  summary: {
    total: number;
    safe: number;
    vulnerable: number;
    totalCves: number;
  };
}

export function exportScanResultsToPdf({
  fileName,
  ecosystem,
  results,
  summary,
}: ExportScanPdfOptions): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Banner
  doc.setFillColor(5, 88, 214); // #0558d6
  doc.rect(0, 0, pageWidth, 82, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('KnowYourDeps — Dependency CVE Report', 40, 36);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const ecoLabel = ecosystem === 'npm' ? 'npm (Node.js)' : 'PyPI (Python)';
  const timestamp = new Date().toLocaleString();
  doc.text(`File: ${fileName}   |   Ecosystem: ${ecoLabel}   |   Scanned: ${timestamp}`, 40, 58);

  // Summary Strip
  doc.setFillColor(244, 248, 255); // #f4f8ff
  doc.setDrawColor(205, 227, 250); // #cde3fa
  doc.roundedRect(40, 98, pageWidth - 80, 44, 6, 6, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text(`Total Packages: ${summary.total}`, 56, 124);

  doc.setTextColor(13, 122, 66); // #0d7a42
  doc.text(`Safe: ${summary.safe}`, 200, 124);

  doc.setTextColor(184, 36, 41); // #b82429
  doc.text(`Vulnerable: ${summary.vulnerable}`, 300, 124);

  doc.setTextColor(71, 85, 105);
  doc.text(`Total CVEs: ${summary.totalCves}`, 430, 124);

  // Sort vulnerable first in PDF for immediate triage
  const sorted = [...results].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'vulnerable' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  const rows = sorted.map((pkg) => [
    pkg.name,
    pkg.version,
    pkg.status === 'safe' ? 'Safe' : 'Vulnerable',
    pkg.cves.length === 0
      ? 'No known CVEs'
      : pkg.cves.map((c) => `${c.id} (${c.severity})`).join(', '),
  ]);

  autoTable(doc, {
    startY: 158,
    head: [['Package', 'Version', 'Status', 'CVEs']],
    body: rows,
    margin: { left: 40, right: 40, bottom: 48 },
    styles: {
      font: 'helvetica',
      fontSize: 9.5,
      cellPadding: { top: 7, right: 8, bottom: 7, left: 8 },
      textColor: [15, 23, 42],
      lineColor: [220, 231, 245],
      lineWidth: 0.5,
      valign: 'middle',
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9.5,
    },
    alternateRowStyles: {
      fillColor: [248, 251, 255],
    },
    columnStyles: {
      0: { cellWidth: 140, fontStyle: 'bold' },
      1: { cellWidth: 75 },
      2: { cellWidth: 80, halign: 'center' },
      3: { cellWidth: 'auto' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 2) {
        const val = String(data.cell.raw || '');
        if (val === 'Safe') {
          data.cell.styles.textColor = [13, 122, 66];
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [184, 36, 41];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    didDrawPage: () => {
      const pageCount = doc.getNumberOfPages();
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `KnowYourDeps · OSV.dev Security Scan · Page ${doc.getCurrentPageInfo().pageNumber} of ${pageCount}`,
        40,
        pageHeight - 24
      );
    },
  });

  const safeBase = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  doc.save(`knowyourdeps-cve-scan-${safeBase}.pdf`);
}
