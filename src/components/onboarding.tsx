"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, ArrowRight, X } from "lucide-react";

interface OnboardingProps {
  onComplete: () => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [periods, setPeriods] = useState<{ start: string; end: string }[]>([]);
  const [currentStart, setCurrentStart] = useState("");
  const [currentEnd, setCurrentEnd] = useState("");
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  function addPeriod() {
    if (!currentStart) return;
    setPeriods([...periods, { start: currentStart, end: currentEnd }]);
    setCurrentStart("");
    setCurrentEnd("");
  }

  function removePeriod(index: number) {
    setPeriods(periods.filter((_, i) => i !== index));
  }

  async function finish() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (periods.length > 0) {
      const rows = periods.map((p) => ({
        user_id: user.id,
        start_date: p.start,
        end_date: p.end || null,
      }));
      await supabase.from("pearl_periods").insert(rows);
    }

    setSaving(false);
    onComplete();
  }

  if (step === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-7xl mb-6">🐚</div>
        <h1 className="text-3xl font-bold text-pearl mb-3">Welcome to Pearl</h1>
        <p className="text-muted text-sm mb-8 max-w-xs mx-auto leading-relaxed">
          Pearl learns your unique cycle to predict your phases and help you feel your best every day.
        </p>

        <div className="bg-surface rounded-2xl p-5 border border-border mb-6 text-left max-w-sm mx-auto">
          <p className="text-sm font-semibold mb-3">For the best experience:</p>
          <p className="text-xs text-muted leading-relaxed">
            Log your last 2–3 periods so Pearl can learn your cycle length. The more data you add, the more accurate predictions become.
          </p>
        </div>

        <button
          onClick={() => setStep(1)}
          className="inline-flex items-center gap-2 bg-pearl text-white px-8 py-3 rounded-xl font-medium text-sm hover:bg-pearl-light transition-colors"
        >
          Log My Periods
          <ArrowRight className="w-4 h-4" />
        </button>

      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold mb-1">Log Your Recent Periods</h1>
        <p className="text-xs text-muted">Add 2–3 periods for the best predictions</p>
      </div>

      {/* Added periods */}
      {periods.length > 0 && (
        <div className="space-y-2 mb-4">
          {periods.map((p, i) => (
            <div key={i} className="flex items-center justify-between bg-surface rounded-xl px-4 py-3 border border-border">
              <div>
                <p className="text-sm font-medium">
                  {new Date(p.start + "T12:00:00").toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}
                  {p.end && (
                    <span className="text-muted">
                      {" → "}
                      {new Date(p.end + "T12:00:00").toLocaleDateString("en", { month: "short", day: "numeric" })}
                    </span>
                  )}
                </p>
              </div>
              <button onClick={() => removePeriod(i)} className="p-1 text-muted hover:text-menstrual">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add period form */}
      <div className="bg-surface rounded-2xl p-5 border border-border mb-6">
        <h2 className="font-semibold text-sm mb-3">
          {periods.length === 0 ? "Add your most recent period" : "Add another period"}
        </h2>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted block mb-1">Start date</label>
            <input
              type="date"
              value={currentStart}
              onChange={(e) => setCurrentStart(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted block mb-1">End date</label>
            <input
              type="date"
              value={currentEnd}
              onChange={(e) => setCurrentEnd(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <button
            onClick={addPeriod}
            disabled={!currentStart}
            className="w-full bg-pearl/10 text-pearl py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-pearl/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Period
          </button>
        </div>
      </div>

      {/* Continue */}
      <button
        onClick={finish}
        disabled={saving || periods.length === 0}
        className="w-full bg-pearl text-white py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-pearl-light transition-colors mb-3"
      >
        {saving ? "Saving..." : "Save & Continue"}
        <ArrowRight className="w-4 h-4" />
      </button>

      {periods.length < 2 && periods.length > 0 && (
        <p className="text-[10px] text-muted text-center">
          Tip: Adding at least 2 periods helps Pearl predict your cycle more accurately
        </p>
      )}
    </div>
  );
}
