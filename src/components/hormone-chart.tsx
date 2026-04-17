"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import type { CycleStats, Period } from "@/lib/cycle";

const COLORS = {
  estrogen: "#8b5cf6",    // purple
  progesterone: "#f59e0b", // amber
  fsh: "#3b82f6",          // blue
  lh: "#ef4444",           // red
  today: "#e91e8e",        // pearl pink
};

const HORMONE_DESCRIPTIONS: Record<string, string> = {
  Estrogen: "The primary female hormone. It builds the uterine lining, boosts mood and energy, improves skin and cognition. It rises during the follicular phase, peaks at ovulation, dips briefly, then has a secondary rise during the luteal phase before dropping to trigger menstruation.",
  Progesterone: "The calming hormone. It stabilizes the uterine lining after ovulation, preparing for potential pregnancy. It promotes relaxation and sleep but can also cause bloating, mood swings, and cravings when it drops sharply before your period.",
  FSH: "Follicle-Stimulating Hormone. Produced by the pituitary gland, it signals the ovaries to develop follicles (eggs). It's highest at the beginning of your cycle, kick-starting the process that leads to ovulation.",
  LH: "Luteinizing Hormone. It triggers ovulation with a dramatic surge mid-cycle — this is the spike that releases the mature egg. LH is what ovulation tests detect. The surge is brief but powerful, lasting about 24-48 hours.",
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
  const [selectedHormone, setSelectedHormone] = useState<string | null>(null);
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

  // Catmull-Rom spline for very smooth curves
  function toSmoothPath(data: number[]): string {
    const maxVal = 100;
    // Upsample: interpolate 4x more points for extra smoothness
    const upsampled: number[] = [];
    for (let i = 0; i < data.length - 1; i++) {
      for (let t = 0; t < 4; t++) {
        const frac = t / 4;
        upsampled.push(data[i] + (data[i + 1] - data[i]) * frac);
      }
    }
    upsampled.push(data[data.length - 1]);

    const points = upsampled.map((v, i) => ({
      x: padLeft + (i / (upsampled.length - 1)) * chartW,
      y: padTop + chartH - (v / maxVal) * chartH,
    }));

    if (points.length < 3) return "";

    // Catmull-Rom to cubic bezier
    let d = `M${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(i - 1, 0)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(i + 2, points.length - 1)];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
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
    menstrual: "rgba(232,64,87,0.10)",
    follicular: "rgba(96,181,160,0.10)",
    ovulation: "rgba(167,139,250,0.10)",
    luteal: "rgba(245,166,35,0.10)",
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

      {/* Legend — clickable */}
      <div className="flex items-center justify-center gap-4 mt-2">
        {hormones.map((h) => (
          <button
            key={h.name}
            onClick={() => setSelectedHormone(selectedHormone === h.name ? null : h.name)}
            className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-full transition-all"
            style={selectedHormone === h.name ? { backgroundColor: `${h.color}20`, outline: `1.5px solid ${h.color}` } : undefined}
          >
            <span className="w-3 h-0.5 rounded-full" style={{ backgroundColor: h.color }} />
            <span className="text-[9px] text-muted">{h.name}</span>
          </button>
        ))}
      </div>

      {/* Hormone info panel */}
      {selectedHormone && (
        <div
          className="mt-3 rounded-xl p-4 relative"
          style={{ backgroundColor: `${hormones.find(h => h.name === selectedHormone)?.color}10`, borderLeft: `3px solid ${hormones.find(h => h.name === selectedHormone)?.color}` }}
        >
          <button
            onClick={() => setSelectedHormone(null)}
            className="absolute top-3 right-3 text-muted hover:text-foreground"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <p className="font-semibold text-sm mb-1" style={{ color: hormones.find(h => h.name === selectedHormone)?.color }}>
            {selectedHormone}
          </p>
          <p className="text-xs text-muted leading-relaxed">{HORMONE_DESCRIPTIONS[selectedHormone]}</p>
        </div>
      )}
    </div>
  );
}
