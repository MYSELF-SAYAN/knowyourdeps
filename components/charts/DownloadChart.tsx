'use client';

import React, { useState, useMemo, useId, useRef } from 'react';
import { DownloadPoint } from '@/lib/types';
import { Sparkles, Activity, Calendar, TrendingUp } from 'lucide-react';

interface DownloadChartProps {
  data: DownloadPoint[];
  color?: string;
  height?: number;
}

// Convert discrete points to a smooth cubic Catmull-Rom spline path
function getCurvedPath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  if (pts.length === 2) {
    return `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)} L ${pts[1].x.toFixed(1)} ${pts[1].y.toFixed(1)}`;
  }

  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];

    // Catmull-Rom to Cubic Bézier conversion with tension dampening
    const tension = 0.22;
    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

export function DownloadChart({ data: rawData, color = '#087cf8', height = 280 }: DownloadChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [isSmoothed, setIsSmoothed] = useState<boolean>(true);
  const [rangeFilter, setRangeFilter] = useState<'30d' | '90d' | '180d' | '365d' | 'all' | 'custom'>('all');
  
  // Custom date selection state
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  const gradientId = useId();
  const svgRef = useRef<SVGSVGElement>(null);

  // 1. Data Sanitization: Filter out incomplete trailing days and anomalies
  const cleanData = useMemo(() => {
    if (!rawData || rawData.length === 0) return [];

    // Filter trailing zero or partial day where downloads are 0
    let filtered = [...rawData];
    while (filtered.length > 1 && filtered[filtered.length - 1].downloads === 0) {
      filtered.pop();
    }

    // Interpolate single-day glitch drops to 0 between large non-zero days
    return filtered.map((d, i, arr) => {
      if (
        d.downloads === 0 &&
        i > 0 &&
        i < arr.length - 1 &&
        arr[i - 1].downloads > 1000 &&
        arr[i + 1].downloads > 1000
      ) {
        return {
          ...d,
          downloads: Math.round((arr[i - 1].downloads + arr[i + 1].downloads) / 2),
        };
      }
      return d;
    });
  }, [rawData]);

  const minAvailableDate = cleanData.length > 0 ? cleanData[0].date : '';
  const maxAvailableDate = cleanData.length > 0 ? cleanData[cleanData.length - 1].date : '';

  // Initialize custom dates when cleanData loads if empty
  React.useEffect(() => {
    if (cleanData.length > 0 && !customStartDate && !customEndDate) {
      // Default custom to last 60 days
      const startIdx = Math.max(0, cleanData.length - 60);
      setCustomStartDate(cleanData[startIdx].date);
      setCustomEndDate(cleanData[cleanData.length - 1].date);
    }
  }, [cleanData, customStartDate, customEndDate]);

  // 2. Range Slicing
  const rangedData = useMemo(() => {
    if (cleanData.length === 0) return [];
    if (rangeFilter === '30d') return cleanData.slice(-30);
    if (rangeFilter === '90d') return cleanData.slice(-90);
    if (rangeFilter === '180d') return cleanData.slice(-180);
    if (rangeFilter === '365d') return cleanData.slice(-365);
    if (rangeFilter === 'custom' && customStartDate && customEndDate) {
      const sliced = cleanData.filter(
        (d) => d.date >= customStartDate && d.date <= customEndDate
      );
      return sliced.length > 0 ? sliced : cleanData.slice(-30);
    }
    return cleanData;
  }, [cleanData, rangeFilter, customStartDate, customEndDate]);

  // Range totals and statistics
  const rangeStats = useMemo(() => {
    if (rangedData.length === 0) {
      return { total: 0, dailyAverage: 0, daysCount: 0 };
    }
    const total = rangedData.reduce((acc, curr) => acc + curr.downloads, 0);
    const dailyAverage = Math.round(total / rangedData.length);
    return {
      total,
      dailyAverage,
      daysCount: rangedData.length,
    };
  }, [rangedData]);

  // 3. 7-Day Moving Average Smoothing
  const displayData = useMemo(() => {
    if (!isSmoothed || rangedData.length <= 7) return rangedData;

    return rangedData.map((d, idx, arr) => {
      const windowStart = Math.max(0, idx - 6);
      const slice = arr.slice(windowStart, idx + 1);
      const avg = Math.round(
        slice.reduce((acc, curr) => acc + curr.downloads, 0) / slice.length
      );
      return {
        ...d,
        rawDownloads: d.downloads,
        downloads: avg,
      };
    });
  }, [rangedData, isSmoothed]);

  if (!displayData || displayData.length === 0) {
    return (
      <div className="flex h-[280px] w-full flex-col items-center justify-center rounded-[20px] border border-dashed border-[#dce7f5] bg-white text-[13px] text-[#475569]">
        <Activity className="h-6 w-6 text-[#64748b] mb-2" />
        <span>No download telemetry available for this period.</span>
      </div>
    );
  }

  // Coordinate system geometry
  const padding = { top: 24, right: 20, bottom: 36, left: 56 };
  const width = 840;
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const maxVal = Math.max(...displayData.map((d) => d.downloads), 10);
  const minVal = 0;

  const points = displayData.map((d, i) => {
    const x = padding.left + (i / (displayData.length - 1 || 1)) * plotWidth;
    const y =
      padding.top + plotHeight - ((d.downloads - minVal) / (maxVal - minVal || 1)) * plotHeight;
    return { x, y, ...d };
  });

  const pathD = getCurvedPath(points);
  const areaD = `${pathD} L ${points[points.length - 1].x} ${padding.top + plotHeight} L ${
    points[0].x
  } ${padding.top + plotHeight} Z`;

  const formatNumber = (num: number) => {
    if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(0)}k`;
    return num.toString();
  };

  const activePoint = hoverIndex !== null ? points[hoverIndex] : points[points.length - 1];

  // Mouse move handler for silky smooth tracking
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || points.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const svgX = (mouseX / rect.width) * width;

    // Find closest point by x coordinate
    let closestIdx = 0;
    let minDist = Infinity;
    points.forEach((p, idx) => {
      const dist = Math.abs(p.x - svgX);
      if (dist < minDist) {
        minDist = dist;
        closestIdx = idx;
      }
    });

    setHoverIndex(closestIdx);
  };

  return (
    <div className="relative w-full rounded-[20px] border border-white/90 bg-white/92 backdrop-blur-xl p-5 sm:p-6 shadow-[0_14px_38px_-14px_rgba(3,28,77,0.14)] overflow-hidden transition-[background-color,border-color,color,box-shadow,transform,opacity] duration-200">
      {/* Chart Header: Display Headings + Controls */}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4 border-b border-[#e8eef7] pb-4">
        {/* Metric Callout */}
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#475569]">
              {isSmoothed ? '7-Day Avg Velocity' : 'Daily Downloads'}
            </span>
            {isSmoothed && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#eff6ff] text-[#0558d6] text-[10px] font-semibold border border-[#bfdbfe]">
                <Sparkles className="h-2.5 w-2.5" /> Smoothed
              </span>
            )}
          </div>
          <div className="mt-1 font-display text-[32px] sm:text-[40px] font-bold text-[#0f172a] tracking-tight tabular-nums leading-none">
            {activePoint ? activePoint.downloads.toLocaleString() : '—'}
          </div>
        </div>

        {/* Date & Range Switches */}
        <div className="flex flex-col sm:items-end gap-2">
          {/* Active Date readout */}
          <div className="flex items-center gap-1.5 text-[12px] text-[#475569]">
            <Calendar className="h-3.5 w-3.5" />
            <span className="font-mono font-medium text-[#0f172a]">
              {activePoint ? activePoint.date : '—'}
            </span>
          </div>

          {/* Controls: Smoothing toggle + Range selector */}
          <div className="flex items-center gap-2">
            {/* Smooth / Raw Toggle */}
            <div className="flex items-center rounded-[8px] bg-[#f1f6fd] p-0.5 border border-[#dce7f5]">
              <button
                type="button"
                onClick={() => setIsSmoothed(true)}
                className={`px-2 py-1 text-[11px] font-semibold rounded-[6px] transition-[background-color,border-color,color,box-shadow,transform,opacity] cursor-pointer ${
                  isSmoothed
                    ? 'bg-white text-[#0558d6] shadow-xs'
                    : 'text-[#475569] hover:text-[#0f172a]'
                }`}
              >
                Smooth
              </button>
              <button
                type="button"
                onClick={() => setIsSmoothed(false)}
                className={`px-2 py-1 text-[11px] font-semibold rounded-[6px] transition-[background-color,border-color,color,box-shadow,transform,opacity] cursor-pointer ${
                  !isSmoothed
                    ? 'bg-white text-[#0558d6] shadow-xs'
                    : 'text-[#475569] hover:text-[#0f172a]'
                }`}
              >
                Raw
              </button>
            </div>

            {/* Range filters & Custom Date Selector */}
            <div className="flex items-center rounded-[8px] bg-[#f1f6fd] p-0.5 border border-[#dce7f5]">
              {(['30d', '90d', '180d', '365d', 'all'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRangeFilter(r)}
                  className={`px-2 py-1 text-[11px] font-semibold uppercase rounded-[6px] transition-[background-color,border-color,color,box-shadow,transform,opacity] cursor-pointer ${
                    rangeFilter === r
                      ? 'bg-white text-[#0558d6] shadow-xs'
                      : 'text-[#475569] hover:text-[#0f172a]'
                  }`}
                >
                  {r === '365d' ? '1Y' : r}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setRangeFilter('custom')}
                className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-[6px] transition-[background-color,border-color,color,box-shadow,transform,opacity] cursor-pointer ${
                  rangeFilter === 'custom'
                    ? 'bg-white text-[#0558d6] shadow-xs'
                    : 'text-[#475569] hover:text-[#0f172a]'
                }`}
              >
                <Calendar className="h-3 w-3" />
                <span>Custom</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Flexible Custom Date Range Bar (When Custom is Selected) */}
      {rangeFilter === 'custom' && (
        <div className="mb-4 p-3 bg-[#eff6ff]/80 border border-[#bfdbfe] rounded-[14px] flex flex-wrap items-center justify-between gap-3 text-[12px]">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-semibold text-[#0558d6] flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" /> Date Range:
            </span>
            <div className="flex items-center gap-2">
              <label className="text-[11px] text-[#64748b]">From</label>
              <input
                type="date"
                min={minAvailableDate}
                max={customEndDate || maxAvailableDate}
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2.5 py-1 text-[11.5px] font-mono bg-white border border-[#bfdbfe] rounded-[8px] text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0558d6]/20 cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[11px] text-[#64748b]">To</label>
              <input
                type="date"
                min={customStartDate || minAvailableDate}
                max={maxAvailableDate}
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2.5 py-1 text-[11.5px] font-mono bg-white border border-[#bfdbfe] rounded-[8px] text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0558d6]/20 cursor-pointer"
              />
            </div>
          </div>

          {/* Sliced Timeline Range Metrics */}
          <div className="flex items-center gap-3 text-[12px] font-medium text-[#0558d6]">
            <span>
              <strong>{rangeStats.total.toLocaleString()}</strong> total downloads
            </span>
            <span>•</span>
            <span>
              ~<strong>{rangeStats.dailyAverage.toLocaleString()}</strong> / day
            </span>
            <span className="text-[11px] text-[#64748b]">({rangeStats.daysCount} days)</span>
          </div>
        </div>
      )}

      {/* SVG Canvas with Monotone Cubic Spline */}
      <div className="relative w-full overflow-hidden select-none">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full overflow-visible cursor-crosshair"
          style={{ height: 'auto', maxHeight: `${height}px` }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.22" />
              <stop offset="50%" stopColor={color} stopOpacity="0.08" />
              <stop offset="100%" stopColor={color} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = padding.top + plotHeight * (1 - ratio);
            const val = minVal + (maxVal - minVal) * ratio;
            return (
              <g key={idx}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#e8eef7"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-[#64748b] font-mono text-[11px]"
                >
                  {formatNumber(val)}
                </text>
              </g>
            );
          })}

          {/* Smooth Area Gradient Fill */}
          <path d={areaD} fill={`url(#${gradientId})`} />

          {/* Smooth Cubic Bézier Curve Stroke */}
          <path
            d={pathD}
            fill="none"
            stroke={color}
            strokeWidth="2.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Active Hover Guideline and Pulsating Indicator */}
          {activePoint && (
            <g className="transition-[background-color,border-color,color,box-shadow,transform,opacity] duration-75 pointer-events-none">
              {/* Vertical dashed guideline */}
              <line
                x1={activePoint.x}
                y1={padding.top}
                x2={activePoint.x}
                y2={padding.top + plotHeight}
                stroke={color}
                strokeWidth="1.5"
                strokeDasharray="3 3"
                opacity="0.75"
              />

              {/* Soft Hover Halo */}
              <circle
                cx={activePoint.x}
                cy={activePoint.y}
                r="9"
                fill={color}
                opacity="0.16"
              />

              {/* Outer white core */}
              <circle
                cx={activePoint.x}
                cy={activePoint.y}
                r="5.5"
                fill="#ffffff"
                stroke={color}
                strokeWidth="2.5"
                className="drop-shadow-sm"
              />

              {/* Colored Center */}
              <circle cx={activePoint.x} cy={activePoint.y} r="2.5" fill={color} />
            </g>
          )}

          {/* Date Axis Labels */}
          {points.length > 0 && (
            <g className="text-[#64748b] font-mono text-[11px]">
              <text x={points[0].x} y={height - 10} textAnchor="start" className="fill-[#64748b]">
                {points[0].date}
              </text>
              <text
                x={points[Math.floor(points.length / 2)].x}
                y={height - 10}
                textAnchor="middle"
                className="fill-[#64748b]"
              >
                {points[Math.floor(points.length / 2)].date}
              </text>
              <text
                x={points[points.length - 1].x}
                y={height - 10}
                textAnchor="end"
                className="fill-[#64748b]"
              >
                {points[points.length - 1].date}
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}