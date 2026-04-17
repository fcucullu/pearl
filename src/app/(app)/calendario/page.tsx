"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CycleCalendar } from "@/components/calendar";
import { PhaseCard } from "@/components/phase-card";
import { Onboarding } from "@/components/onboarding";
import { InstallPrompt } from "@/components/install-prompt";
import { computeStats, getPhaseForDate, getCycleAlerts, type Period } from "@/lib/cycle";
import { HormoneChart } from "@/components/hormone-chart";
import { DailyInsight } from "@/components/daily-insight";
import { useTTCMode } from "@/lib/ttc";

export default function CalendarioPage() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [ttcMode] = useTTCMode();

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-pearl border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (periods.length === 0) {
    return (
      <Onboarding
        onComplete={() => {
          // Reload periods after onboarding
          const supabase = createClient();
          supabase
            .from("pearl_periods")
            .select("id, start_date, end_date")
            .order("start_date", { ascending: true })
            .then(({ data }) => setPeriods(data ?? []));
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-2">
        <h1 className="text-2xl font-bold">Pearl</h1>
        <p className="text-xs text-muted">Your cycle, your rhythm</p>
      </div>

      <InstallPrompt />

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

      <CycleCalendar periods={periods} stats={stats} onSelectDate={(date) => setSelectedDate(date)} />

      <DailyInsight periods={periods} stats={stats} date={selectedDate} ttcMode={ttcMode} />

      <HormoneChart periods={periods} stats={stats} selectedDate={selectedDate} ttcMode={ttcMode} />
    </div>
  );
}
