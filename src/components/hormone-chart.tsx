"use client";

import { useMemo } from "react";
import type { CycleStats, Period } from "@/lib/cycle";

const COLORS = {
  estrogen: "#8b5cf6",    // purple
  progesterone: "#f59e0b", // amber
  fsh: "#3b82f6",          // blue
  lh: "#ef4444",           // red
  today: "#e91e8e",        // pearl pink
};

// Generate smooth hormone curves for a given cycle length
// Values are relative (0-100) based on medical literature patterns
function generateHormoneCurves(cycleLength: number) {
  const points = cycleLength;
  const estrogen: number[] = [];
  const progesterone: number[] = [];
  const fsh: number[] = [];
  const lh: number[] = [];

  const ovulationDay = Math.round(cycleLength * 0.5); // ~day 14 of 28
  const follicularEnd = ovulationDay - 1;
  const lutealStart = ovulationDay + 1;

  for (let day = 0; day < points; day++) {
    const t = day / (points - 1); // 0 to 1

    // Estrogen: low start, gradual rise in follicular, peak at ovulation, dip, moderate in luteal
    if (day <= ovulationDay) {
      const progress = day / ovulationDay;
      estrogen.push(15 + 75 * Math.pow(progress, 1.8));
    } else {
      const lutealProgress = (day - ovulationDay) / (points - ovulationDay);
      // Dip after ovulation then secondary rise then fall
      const dip = Math.exp(-Math.pow((lutealProgress - 0.1) * 5, 2)) * 30;
      const secondaryRise = Math.exp(-Math.pow((lutealProgress - 0.5) * 3, 2)) * 55;
      estrogen.push(30 - dip + secondaryRise);
    }

    // Progesterone: very low until ovulation, then rises sharply, peaks mid-luteal, falls
    if (day <= ovulationDay) {
      progesterone.push(5 + 3 * Math.sin(t * Math.PI * 0.3));
    } else {
      const lutealProgress = (day - ovulationDay) / (points - ovulationDay);
      const rise = Math.exp(-Math.pow((lutealProgress - 0.45) * 2.5, 2));
      progesterone.push(5 + 85 * rise);
    }

    // FSH: moderate at start, rises early follicular, drops mid-cycle, small bump in late luteal
    const fshBase = 25 + 35 * Math.exp(-Math.pow((t - 0.05) * 6, 2));
    const fshDrop = -15 * Math.exp(-Math.pow((t - 0.5) * 4, 2));
    const fshLateBump = 10 * Math.exp(-Math.pow((t - 0.95) * 8, 2));
    fsh.push(Math.max(5, fshBase + fshDrop + fshLateBump));

    // LH: low baseline with sharp spike at ovulation
    const lhSpike = 90 * Math.exp(-Math.pow((day - ovulationDay) * 1.5, 2));
    lh.push(8 + lhSpike);
  }

  return { estrogen, progesterone, fsh, lh };
}

interface HormoneChartProps {
  periods: Period[];
  stats: CycleStats;
}

export function HormoneChart({ periods, stats }: HormoneChartProps) {
  const cycleLength = stats.avgCycleLength || 28;

  // Find current day in cycle
  const today = new Date();
  const sorted = [...periods].sort((a, b) => a.start_date.localeCompare(b.start_date));
  const lastPeriod = sorted[sorted.length - 1];

  let currentDay = 0;
  if (lastPeriod) {
    const lastStart = new Date(lastPeriod.start_date);
    const diffMs = today.getTime() - lastStart.getTime();
    currentDay = Math.floor(diffMs / 86400000) % cycleLength;
    if (currentDay < 0) currentDay = 0;
  }

  const curves = useMemo(() => generateHormoneCurves(cycleLength), [cycleLength]);

  // SVG dimensions
  const width = 360;
  const height = 180;
  const padLeft = 8;
  const padRight = 8;
  const padTop = 10;
  const padBottom = 30;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  function toPath(data: number[]): string {
    const maxVal = 100;
    return data
      .map((v, i) => {
        const x = padLeft + (i / (data.length - 1)) * chartW;
        const y = padTop + chartH - (v / maxVal) * chartH;
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }

  // Smooth the path using cubic bezier
  function toSmoothPath(data: number[]): string {
    const maxVal = 100;
    const points = data.map((v, i) => ({
      x: padLeft + (i / (data.length - 1)) * chartW,
      y: padTop + chartH - (v / maxVal) * chartH,
    }));

    if (points.length < 2) return "";

    let d = `M${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx = (prev.x + curr.x) / 2;
      d += ` C${cpx.toFixed(1)},${prev.y.toFixed(1)} ${cpx.toFixed(1)},${curr.y.toFixed(1)} ${curr.x.toFixed(1)},${curr.y.toFixed(1)}`;
    }
    return d;
  }

  const todayX = padLeft + (currentDay / (cycleLength - 1)) * chartW;

  // Phase boundaries for background bands
  const periodEnd = Math.round(stats.avgPeriodDuration || 5);
  const follicularEnd = Math.round(cycleLength * 0.5) - 2;
  const ovulationEnd = Math.round(cycleLength * 0.5) + 1;

  function dayToX(day: number) {
    return padLeft + (day / (cycleLength - 1)) * chartW;
  }

  const phaseColors = {
    menstrual: "rgba(233,30,142,0.08)",
    follicular: "rgba(76,175,80,0.06)",
    ovulation: "rgba(255,152,0,0.08)",
    luteal: "rgba(156,39,176,0.06)",
  };

  const hormones = [
    { name: "Estrogen", data: curves.estrogen, color: COLORS.estrogen },
    { name: "Progesterone", data: curves.progesterone, color: COLORS.progesterone },
    { name: "FSH", data: curves.fsh, color: COLORS.fsh },
    { name: "LH", data: curves.lh, color: COLORS.lh },
  ];

  return (
    <div className="bg-surface rounded-2xl p-4 shadow-sm border border-border">
      <h3 className="text-sm font-semibold mb-1">Hormone Levels</h3>
      <p className="text-[10px] text-muted mb-3">Estimated levels based on your {cycleLength}-day cycle</p>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        {/* Phase background bands */}
        <rect x={dayToX(0)} y={padTop} width={dayToX(periodEnd) - dayToX(0)} height={chartH} fill={phaseColors.menstrual} />
        <rect x={dayToX(periodEnd)} y={padTop} width={dayToX(follicularEnd) - dayToX(periodEnd)} height={chartH} fill={phaseColors.follicular} />
        <rect x={dayToX(follicularEnd)} y={padTop} width={dayToX(ovulationEnd) - dayToX(follicularEnd)} height={chartH} fill={phaseColors.ovulation} />
        <rect x={dayToX(ovulationEnd)} y={padTop} width={dayToX(cycleLength - 1) - dayToX(ovulationEnd)} height={chartH} fill={phaseColors.luteal} />

        {/* Hormone curves */}
        {hormones.map((h) => (
          <path
            key={h.name}
            d={toSmoothPath(h.data)}
            fill="none"
            stroke={h.color}
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.85"
          />
        ))}

        {/* Today marker */}
        <line
          x1={todayX}
          y1={padTop}
          x2={todayX}
          y2={padTop + chartH}
          stroke={COLORS.today}
          strokeWidth="1.5"
          strokeDasharray="4 3"
          opacity="0.8"
        />
        <circle cx={todayX} cy={padTop - 3} r="3" fill={COLORS.today} />
        <text x={todayX} y={padTop + chartH + 12} textAnchor="middle" fontSize="8" fill={COLORS.today} fontWeight="600">
          Today
        </text>

        {/* Phase labels at bottom */}
        <text x={dayToX(periodEnd / 2)} y={padTop + chartH + 24} textAnchor="middle" fontSize="7" fill="#9ca3af">
          Menstrual
        </text>
        <text x={dayToX((periodEnd + follicularEnd) / 2)} y={padTop + chartH + 24} textAnchor="middle" fontSize="7" fill="#9ca3af">
          Follicular
        </text>
        <text x={dayToX((follicularEnd + ovulationEnd) / 2)} y={padTop + chartH + 24} textAnchor="middle" fontSize="7" fill="#9ca3af">
          Ovulation
        </text>
        <text x={dayToX((ovulationEnd + cycleLength - 1) / 2)} y={padTop + chartH + 24} textAnchor="middle" fontSize="7" fill="#9ca3af">
          Luteal
        </text>
      </svg>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-2">
        {hormones.map((h) => (
          <div key={h.name} className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 rounded-full" style={{ backgroundColor: h.color }} />
            <span className="text-[9px] text-muted">{h.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
