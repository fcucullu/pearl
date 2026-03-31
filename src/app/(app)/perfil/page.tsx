"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Mail, LogOut, BarChart3, Bell, MessageCircle } from "lucide-react";
import type { Period } from "@/lib/cycle";
import { computeStats } from "@/lib/cycle";

export default function PerfilPage() {
  const [email, setEmail] = useState("");
  const [partnerEmail, setPartnerEmail] = useState("");
  const [partnerEnabled, setPartnerEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [periods, setPeriods] = useState<Period[]>([]);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setEmail(user.email ?? "");

    // Load partner notification settings
    const { data: notif } = await supabase
      .from("pearl_partner_notifications")
      .select("partner_email, enabled")
      .eq("user_id", user.id)
      .maybeSingle();

    if (notif) {
      setPartnerEmail(notif.partner_email);
      setPartnerEnabled(notif.enabled);
    }

    // Load periods for stats
    const { data: p } = await supabase
      .from("pearl_periods")
      .select("id, start_date, end_date")
      .order("start_date", { ascending: true });
    setPeriods(p ?? []);
  }

  async function savePartnerSettings() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("pearl_partner_notifications").upsert(
      {
        user_id: user.id,
        partner_email: partnerEmail,
        enabled: partnerEnabled,
      },
      { onConflict: "user_id" }
    );
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const stats = computeStats(periods);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Profile</h1>

      {/* User info */}
      <div className="bg-surface rounded-2xl p-5 border border-border mb-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-full bg-pearl/20 flex items-center justify-center text-pearl font-bold">
            {email.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium">{email}</p>
            <p className="text-[10px] text-muted">Signed in with Google</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      {periods.length > 0 && (
        <div className="bg-surface rounded-2xl p-5 border border-border mb-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-pearl" />
            <h2 className="font-semibold text-sm">Your Stats</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-xl font-bold text-pearl">{stats.avgCycleLength}</p>
              <p className="text-[10px] text-muted">Avg cycle (days)</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-menstrual">{stats.avgPeriodDuration}</p>
              <p className="text-[10px] text-muted">Avg period (days)</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-foreground">{stats.cycleCount}</p>
              <p className="text-[10px] text-muted">Cycles logged</p>
            </div>
          </div>
        </div>
      )}

      {/* Partner notifications */}
      <div className="bg-surface rounded-2xl p-5 border border-border mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Bell className="w-4 h-4 text-pearl" />
          <h2 className="font-semibold text-sm">Partner Notifications</h2>
        </div>
        <p className="text-xs text-muted mb-3">
          When you enter a new phase, we'll email your partner with helpful tips on how to support you.
        </p>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted block mb-1">Partner's email</label>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted" />
              <input
                type="email"
                value={partnerEmail}
                onChange={(e) => setPartnerEmail(e.target.value)}
                placeholder="partner@email.com"
                className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted">Enable notifications</span>
            <button
              onClick={() => setPartnerEnabled(!partnerEnabled)}
              className={`w-12 h-7 rounded-full transition-colors relative shrink-0 ${
                partnerEnabled ? "bg-pearl" : "bg-gray-300"
              }`}
            >
              <span
                className="absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform"
                style={{ transform: partnerEnabled ? "translateX(20px)" : "translateX(0)" }}
              />
            </button>
          </div>

          <button
            onClick={savePartnerSettings}
            disabled={saving || !partnerEmail}
            className="w-full bg-pearl text-white py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-pearl-light transition-colors"
          >
            {saved ? "Saved!" : saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>

      {/* Chat with Fran */}
      <a
        href="https://wa.me/34644941706?text=Hey%20Fran!%20%F0%9F%91%8B%20I'm%20using%20Pearl%20and%20wanted%20to%20tell%20you..."
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center justify-center gap-2 bg-surface border border-border rounded-2xl py-3.5 text-sm font-medium text-foreground hover:border-pearl/30 transition-colors mb-4"
      >
        <MessageCircle className="w-4 h-4 text-pearl" />
        Feedback? Chat with Fran 💬
      </a>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 py-3 text-sm text-muted hover:text-menstrual transition-colors"
      >
        <LogOut className="w-4 h-4" />
        Sign Out
      </button>
    </div>
  );
}
