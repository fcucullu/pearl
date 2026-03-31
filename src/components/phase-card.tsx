"use client";

import type { PhaseInfo } from "@/lib/cycle";
import {
  getPhaseColor,
  getPhaseName,
  getPhaseEmoji,
  getPhaseRecommendation,
} from "@/lib/cycle";

interface PhaseCardProps {
  phaseInfo: PhaseInfo;
}

export function PhaseCard({ phaseInfo }: PhaseCardProps) {
  const { phase, dayInPhase, totalDaysInPhase, daysUntilNextPeriod } = phaseInfo;
  const color = getPhaseColor(phase);
  const name = getPhaseName(phase);
  const emoji = getPhaseEmoji(phase);
  const rec = getPhaseRecommendation(phase);
  const progress = dayInPhase / totalDaysInPhase;

  return (
    <div className="bg-surface rounded-2xl p-5 shadow-sm border border-border">
      {/* Phase header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{emoji}</span>
          <div>
            <h3 className="font-semibold text-base" style={{ color }}>
              {name} Phase
            </h3>
            <p className="text-xs text-muted">
              Day {dayInPhase} of {totalDaysInPhase}
            </p>
          </div>
        </div>
        {daysUntilNextPeriod !== null && daysUntilNextPeriod > 0 && (
          <div className="text-right">
            <p className="text-xl font-bold" style={{ color }}>
              {daysUntilNextPeriod}
            </p>
            <p className="text-[10px] text-muted">days to period</p>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-background rounded-full mb-4">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${progress * 100}%`, backgroundColor: color }}
        />
      </div>

      {/* Recommendation */}
      <div>
        <h4 className="font-semibold text-sm mb-1">{rec.title}</h4>
        <p className="text-xs text-muted leading-relaxed mb-3">{rec.body}</p>
        <ul className="space-y-1.5">
          {rec.tips.map((tip, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-muted">
              <span style={{ color }} className="mt-0.5">•</span>
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
