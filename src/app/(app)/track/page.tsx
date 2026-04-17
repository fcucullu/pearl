"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Heart, Pencil, Check, X, CircleDot, CircleStop } from "lucide-react";
import type { Period } from "@/lib/cycle";

const MOODS = ["happy", "sensitive", "irritable", "anxious", "calm"] as const;
const ENERGY = ["high", "normal", "low", "exhausted"] as const;
const PAIN_LEVELS = ["none", "mild", "moderate", "strong"] as const;
const PAIN_LOCATIONS = ["head", "abdomen", "back"] as const;
const OTHER_SYMPTOMS = ["bloating", "cravings", "insomnia", "acne"] as const;

const MOOD_EMOJI: Record<string, string> = {
  happy: "😊", sensitive: "🥺", irritable: "😤", anxious: "😰", calm: "😌",
};
const ENERGY_EMOJI: Record<string, string> = {
  high: "⚡", normal: "✨", low: "🔋", exhausted: "😴",
};

export default function TrackPage() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"period" | "symptoms">("period");

  // Add past period form
  const [showAddPast, setShowAddPast] = useState(false);
  const [pastStart, setPastStart] = useState("");
  const [pastEnd, setPastEnd] = useState("");

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");

  // Symptom state
  const [symptomDate, setSymptomDate] = useState(new Date().toISOString().split("T")[0]);
  const [mood, setMood] = useState<string>("");
  const [energy, setEnergy] = useState<string>("");
  const [painLevel, setPainLevel] = useState<string>("");
  const [painLocation, setPainLocation] = useState<string[]>([]);
  const [otherSymptoms, setOtherSymptoms] = useState<string[]>([]);
  const [symptomSaved, setSymptomSaved] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    loadPeriods();
  }, []);

  async function loadPeriods() {
    const { data } = await supabase
      .from("pearl_periods")
      .select("id, start_date, end_date")
      .order("start_date", { ascending: false });
    setPeriods(data ?? []);
  }

  // The most recent period that has no end_date = active period
  const activePeriod = periods.find((p) => !p.end_date);

  async function startPeriod() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const today = new Date().toISOString().split("T")[0];
    await supabase.from("pearl_periods").insert({
      user_id: user.id,
      start_date: today,
      end_date: null,
    });
    await loadPeriods();
    setSaving(false);
  }

  async function endPeriod() {
    if (!activePeriod) return;
    setSaving(true);
    const today = new Date().toISOString().split("T")[0];
    await supabase
      .from("pearl_periods")
      .update({ end_date: today })
      .eq("id", activePeriod.id);
    await loadPeriods();
    setSaving(false);
  }

  async function addPastPeriod() {
    if (!pastStart) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("pearl_periods").insert({
      user_id: user.id,
      start_date: pastStart,
      end_date: pastEnd || null,
    });
    setPastStart("");
    setPastEnd("");
    setShowAddPast(false);
    await loadPeriods();
    setSaving(false);
  }

  function startEdit(p: Period) {
    setEditingId(p.id);
    setEditStart(p.start_date);
    setEditEnd(p.end_date ?? "");
  }

  async function saveEdit() {
    if (!editingId || !editStart) return;
    setSaving(true);
    await supabase
      .from("pearl_periods")
      .update({ start_date: editStart, end_date: editEnd || null })
      .eq("id", editingId);
    setEditingId(null);
    await loadPeriods();
    setSaving(false);
  }

  async function deletePeriod(id: string) {
    await supabase.from("pearl_periods").delete().eq("id", id);
    await loadPeriods();
  }

  async function saveSymptoms() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("pearl_symptoms").upsert(
      {
        user_id: user.id,
        date: symptomDate,
        mood: mood || null,
        energy: energy || null,
        pain_level: painLevel || null,
        pain_location: painLocation.length > 0 ? painLocation : null,
        bloating: otherSymptoms.includes("bloating"),
        cravings: otherSymptoms.includes("cravings"),
        insomnia: otherSymptoms.includes("insomnia"),
        acne: otherSymptoms.includes("acne"),
      },
      { onConflict: "user_id,date" }
    );
    setSaving(false);
    setSymptomSaved(true);
    setTimeout(() => setSymptomSaved(false), 2000);
  }

  function toggleArrayItem(arr: string[], item: string, setter: (v: string[]) => void) {
    setter(arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item]);
  }

  function formatDate(d: string) {
    return new Date(d + "T12:00:00").toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" });
  }

  function daysBetween(a: string, b: string) {
    return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000) + 1;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Track</h1>

      {/* Period tracking */}
      <div>
        <>
          {/* Current period — big action button */}
          <div className="bg-surface rounded-2xl p-6 border border-border mb-4 text-center">
            {activePeriod ? (
              <>
                <div className="w-16 h-16 rounded-full bg-menstrual/20 flex items-center justify-center mx-auto mb-3">
                  <CircleDot className="w-8 h-8 text-menstrual animate-pulse" />
                </div>
                <h2 className="font-semibold text-base mb-1">Period in progress</h2>
                <p className="text-xs text-muted mb-4">
                  Started {formatDate(activePeriod.start_date)} — Day {daysBetween(activePeriod.start_date, new Date().toISOString().split("T")[0])}
                </p>
                <button
                  onClick={endPeriod}
                  disabled={saving}
                  className="w-full bg-menstrual text-white py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-menstrual/90 transition-colors"
                >
                  <CircleStop className="w-5 h-5" />
                  {saving ? "Saving..." : "Period Ended"}
                </button>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-pearl/20 flex items-center justify-center mx-auto mb-3">
                  <CircleDot className="w-8 h-8 text-pearl" />
                </div>
                <h2 className="font-semibold text-base mb-1">No active period</h2>
                <p className="text-xs text-muted mb-4">Tap when your period starts</p>
                <button
                  onClick={startPeriod}
                  disabled={saving}
                  className="w-full bg-pearl text-white py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-pearl-light transition-colors"
                >
                  <CircleDot className="w-5 h-5" />
                  {saving ? "Saving..." : "Period Started"}
                </button>
              </>
            )}
          </div>

          {/* Period history */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm">History</h2>
            <button
              onClick={() => setShowAddPast(!showAddPast)}
              className="flex items-center gap-1 text-xs text-muted hover:text-pearl transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add past
            </button>
          </div>

          {showAddPast && (
            <div className="bg-surface rounded-2xl p-5 border border-border mb-3">
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted block mb-1">Start date</label>
                  <input
                    type="date"
                    value={pastStart}
                    onChange={(e) => setPastStart(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted block mb-1">End date</label>
                  <input
                    type="date"
                    value={pastEnd}
                    onChange={(e) => setPastEnd(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={addPastPeriod}
                    disabled={!pastStart || saving}
                    className="flex-1 bg-pearl text-white py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-pearl-light transition-colors"
                  >
                    {saving ? "Saving..." : "Add"}
                  </button>
                  <button
                    onClick={() => setShowAddPast(false)}
                    className="px-4 bg-background border border-border text-muted py-2.5 rounded-xl text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
          {periods.length === 0 ? (
            <p className="text-sm text-muted text-center py-8">No periods logged yet</p>
          ) : (
            <div className="space-y-2 pb-4">
              {periods.map((p) => (
                <div key={p.id} className="bg-surface rounded-xl border border-border overflow-hidden">
                  {editingId === p.id ? (
                    /* Edit mode */
                    <div className="p-4 space-y-3">
                      <div>
                        <label className="text-xs text-muted block mb-1">Start date</label>
                        <input
                          type="date"
                          value={editStart}
                          onChange={(e) => setEditStart(e.target.value)}
                          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted block mb-1">End date</label>
                        <input
                          type="date"
                          value={editEnd}
                          onChange={(e) => setEditEnd(e.target.value)}
                          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={saveEdit}
                          disabled={saving}
                          className="flex-1 bg-pearl text-white py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="flex-1 bg-background text-muted py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 border border-border"
                        >
                          <X className="w-3.5 h-3.5" />
                          Cancel
                        </button>
                        <button
                          onClick={() => { deletePeriod(p.id); setEditingId(null); }}
                          className="px-3 bg-menstrual/10 text-menstrual py-2 rounded-lg text-xs font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* View mode */
                    <div className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-sm font-medium">
                          {formatDate(p.start_date)}
                          {p.end_date ? (
                            <span className="text-muted"> → {new Date(p.end_date + "T12:00:00").toLocaleDateString("en", { month: "short", day: "numeric" })}</span>
                          ) : (
                            <span className="text-menstrual text-xs ml-2">● ongoing</span>
                          )}
                        </p>
                        {p.end_date && (
                          <p className="text-[10px] text-muted">{daysBetween(p.start_date, p.end_date)} days</p>
                        )}
                      </div>
                      <button
                        onClick={() => startEdit(p)}
                        className="p-2 text-muted hover:text-pearl transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      </div>
    </div>
  );
}
