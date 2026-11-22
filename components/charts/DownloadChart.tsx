'use client';

import React, { useState, useEffect, useId } from 'react';
import { DownloadPoint } from '@/lib/types';

interface DownloadChartProps {
  data: DownloadPoint[];
  color?: string;
  height?: number;
}

export function DownloadChart({ data, color = '#0033ff', height = 260 }: DownloadChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [isRendered, setIsRendered] = useState(false);
  const gradientId = useId();

  // Reset animation trigger on data change
  const chartKey = data.length > 0 ? `${data[0]?.date}-${data[data.length - 1]?.date}-${data.length}` : 'empty';

  useEffect(() => {
    setIsRendered(false);
    const timer = setTimeout(() => setIsRendered(true), 20);
    return () => clearTimeout(timer);
  }, [chartKey]);

  if (!data || data.length === 0) {
    return (
      <div className="flex h-[260px] w-full items-center justify-center rounded-[18px] border border-dashed border-[#e8e8e8] bg-white text-[14px] text-[#6e6e6e]">
        No download history available for this period.
      </div>
    );
  }

  const padding = { top: 20, right: 20, bottom: 30, left: 55 };
  const width = 800; // SVG coordinate space
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const maxVal = Math.max(...data.map(d => d.downloads), 10);
  const minVal = 0;

  const points = data.map((d, i) => {
    const x = padding.left + (i / (data.length - 1 || 1)) * plotWidth;
    const y = padding.top + plotHeight - ((d.downloads - minVal) / (maxVal - minVal || 1)) * plotHeight;
    return { x, y, ...d };
  });

  const pathD = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${padding.top + plotHeight} L ${points[0].x} ${padding.top + plotHeight} Z`;

  // Format numbers (e.g. 1.2M, 500k)
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
    return num.toString();
  };

  const activePoint = hoverIndex !== null ? points[hoverIndex] : points[points.length - 1];

  return (
    <div className="relative w-full rounded-[18px] border border-[#e8e8e8] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden transition-all duration-200">
      {/* Chart Header Stats with Apple-style smooth values */}
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3 border-b border-[#e8e8e8] pb-3">
        <div>
          <span className="text-[12px] font-medium uppercase tracking-wider text-[#6e6e6e]">Downloads</span>
          <div className="font-mono text-[24px] font-bold text-[#1a1a1a] tabular-nums transition-all duration-150">
            {activePoint ? activePoint.downloads.toLocaleString() : '—'}
          </div>
        </div>
        <div className="text-right">
          <span className="text-[12px] font-medium text-[#6e6e6e]">Date</span>
          <div className="text-[14px] font-medium text-[#1a1a1a] transition-all duration-150">
            {activePoint ? activePoint.date : '—'}
          </div>
        </div>
      </div>

      {/* SVG Canvas with animated line and area */}
      <div className="relative w-full overflow-hidden select-none">
        <svg
          key={chartKey}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full overflow-visible"
          style={{ height: 'auto', maxHeight: `${height}px` }}
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.28" />
              <stop offset="85%" stopColor={color} stopOpacity="0.04" />
              <stop offset="100%" stopColor={color} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = padding.top + plotHeight * (1 - ratio);
            const val = minVal + (maxVal - minVal) * ratio;
            return (
              <g key={idx} className="transition-opacity duration-300">
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#f0f0f0"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-[#a6a6a6] font-mono text-[11px]"
                >
                  {formatNumber(val)}
                </text>
              </g>
            );
          })}

          {/* Animated Area Fill */}
          <path
            d={areaD}
            fill={`url(#${gradientId})`}
            className="animate-chart-area"
          />

          {/* Animated Stroke Line */}
          <path
            d={pathD}
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-chart-line"
          />

          {/* Invisible Interactive Hover Columns */}
          {points.map((p, i) => (
            <rect
              key={i}
              x={p.x - plotWidth / points.length / 2}
              y={padding.top}
              width={plotWidth / points.length}
              height={plotHeight}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHoverIndex(i)}
            />
          ))}

          {/* Active Hover Dot & Smooth Guide Line */}
          {activePoint && (
            <g className="transition-all duration-150 pointer-events-none">
              {/* Subtle vertical indicator line */}
              <line
                x1={activePoint.x}
                y1={padding.top}
                x2={activePoint.x}
                y2={padding.top + plotHeight}
                stroke={color}
                strokeWidth="1.5"
                strokeDasharray="3 3"
                opacity="0.8"
              />

              {/* Pulsating Radar Halo (Apple-style feedback) */}
              <circle
                cx={activePoint.x}
                cy={activePoint.y}
                r="10"
                fill={color}
                opacity="0.25"
                className="animate-ping"
              />

              {/* Outer white border dot */}
              <circle
                cx={activePoint.x}
                cy={activePoint.y}
                r="6"
                fill="#ffffff"
                stroke={color}
                strokeWidth="2.5"
                className="drop-shadow-md"
              />

              {/* Core colored center */}
              <circle
                cx={activePoint.x}
                cy={activePoint.y}
                r="2.5"
                fill={color}
              />
            </g>
          )}

          {/* Date Axis Labels */}
          {points.length > 0 && (
            <g className="transition-opacity duration-300">
              <text x={points[0].x} y={height - 8} textAnchor="start" className="fill-[#a6a6a6] text-[11px] font-mono">
                {points[0].date}
              </text>
              <text
                x={points[Math.floor(points.length / 2)].x}
                y={height - 8}
                textAnchor="middle"
                className="fill-[#a6a6a6] text-[11px] font-mono"
              >
                {points[Math.floor(points.length / 2)].date}
              </text>
              <text
                x={points[points.length - 1].x}
                y={height - 8}
                textAnchor="end"
                className="fill-[#a6a6a6] text-[11px] font-mono"
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
