"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { CycleCalendar } from "@/components/calendar";
import { PhaseCard } from "@/components/phase-card";
import { computeStats, getPhaseForDate, getCycleAlerts, type Period, type Phase } from "@/lib/cycle";

export default function CalendarioPage() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [loading, setLoading] = useState(true);
  const lastPhaseRef = useRef<Phase | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("pearl_periods")
      .select("id, start_date, end_date")
      .order("start_date", { ascending: true })
      .then(({ data }) => {
        setPeriods(data ?? []);
        setLoading(false);
      });
  }, []);

  const stats = computeStats(periods);
  const today = new Date().toISOString().split("T")[0];
  const phaseInfo = getPhaseForDate(today, periods, stats);

  // Detect phase changes and notify partner
  useEffect(() => {
    if (loading || periods.length === 0) return;

    const currentPhase = phaseInfo.phase;

    // Skip initial load — only fire on actual changes
    if (lastPhaseRef.current === null) {
      lastPhaseRef.current = currentPhase;
      return;
    }

    if (currentPhase !== lastPhaseRef.current) {
      lastPhaseRef.current = currentPhase;

      // Fire partner notification
      const supabase = createClient();
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user) return;
        fetch("/api/notify-partner", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: user.id, phase: currentPhase }),
        }).catch((err) => console.error("Partner notify failed:", err));
      });
    }
  }, [phaseInfo.phase, loading, periods.length]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-pearl border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (periods.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">🐚</div>
        <h1 className="text-2xl font-bold mb-2">Welcome to Pearl</h1>
        <p className="text-muted text-sm mb-6 max-w-xs mx-auto">
          Start by logging your last period in the Track tab to see your cycle predictions.
        </p>
        <a
          href="/track"
          className="inline-flex items-center gap-2 bg-pearl text-white px-6 py-3 rounded-xl font-medium text-sm hover:bg-pearl-light transition-colors"
        >
          Log Your First Period
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-2">
        <h1 className="text-2xl font-bold">Pearl</h1>
        <p className="text-xs text-muted">Your cycle, your rhythm</p>
      </div>

      {/* Cycle alerts */}
      {getCycleAlerts(periods, stats).map((alert, i) => (
        <div
          key={i}
          className={`rounded-xl px-4 py-3 text-xs leading-relaxed ${
            alert.severity === "warning"
              ? "bg-menstrual/10 text-menstrual"
              : "bg-luteal/10 text-luteal"
          }`}
        >
          <span className="font-semibold">{alert.severity === "warning" ? "⚠️" : "ℹ️"}</span>{" "}
          {alert.message}
        </div>
      ))}

      <CycleCalendar periods={periods} stats={stats} />
      <PhaseCard phaseInfo={phaseInfo} />

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-surface rounded-xl p-3 text-center border border-border">
          <p className="text-lg font-bold text-pearl">{stats.avgCycleLength}</p>
          <p className="text-[10px] text-muted">Avg cycle</p>
        </div>
        <div className="bg-surface rounded-xl p-3 text-center border border-border">
          <p className="text-lg font-bold text-menstrual">{stats.avgPeriodDuration}</p>
          <p className="text-[10px] text-muted">Period days</p>
        </div>
        <div className="bg-surface rounded-xl p-3 text-center border border-border">
          <p className="text-lg font-bold text-foreground">{stats.cycleCount}</p>
          <p className="text-[10px] text-muted">Cycles logged</p>
        </div>
      </div>
    </div>
  );
}
