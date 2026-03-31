"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Period, CycleStats, Phase } from "@/lib/cycle";
import { getMonthPhases, getPhaseColor } from "@/lib/cycle";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface CalendarProps {
  periods: Period[];
  stats: CycleStats;
  onSelectDate?: (date: string) => void;
}

export function CycleCalendar({ periods, stats, onSelectDate }: CalendarProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const phases = useMemo(
    () => getMonthPhases(viewYear, viewMonth, periods, stats),
    [viewYear, viewMonth, periods, stats]
  );

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  // Convert Sunday=0 to Monday-based: Mon=0..Sun=6
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const monthName = new Date(viewYear, viewMonth).toLocaleString("en", { month: "long", year: "numeric" });

  const todayDay = today.getFullYear() === viewYear && today.getMonth() === viewMonth ? today.getDate() : null;

  const phaseColorMap: Record<Phase, string> = {
    menstrual: "bg-menstrual",
    follicular: "bg-follicular",
    ovulation: "bg-ovulation",
    luteal: "bg-luteal",
  };

  return (
    <div className="bg-surface rounded-2xl p-4 shadow-sm border border-border">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-2 rounded-full hover:bg-background transition-colors">
          <ChevronLeft className="w-5 h-5 text-muted" />
        </button>
        <h2 className="text-lg font-semibold">{monthName}</h2>
        <button onClick={nextMonth} className="p-2 rounded-full hover:bg-background transition-colors">
          <ChevronRight className="w-5 h-5 text-muted" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-[10px] font-medium text-muted uppercase">
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startOffset }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const phase = phases.get(day);
          const isToday = day === todayDay;
          const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

          return (
            <button
              key={day}
              onClick={() => onSelectDate?.(dateStr)}
              className={`relative aspect-square flex items-center justify-center rounded-full text-sm font-medium transition-all ${
                isToday ? "ring-2 ring-pearl ring-offset-1 ring-offset-surface" : ""
              }`}
              style={{
                backgroundColor: phase ? `${getPhaseColor(phase)}20` : undefined,
                color: phase ? getPhaseColor(phase) : undefined,
              }}
            >
              {day}
              {isToday && (
                <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-pearl" />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-border">
        {(["menstrual", "follicular", "ovulation", "luteal"] as Phase[]).map((p) => (
          <div key={p} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: getPhaseColor(p) }}
            />
            <span className="text-[10px] text-muted capitalize">{p}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
