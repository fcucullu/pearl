"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Mail, LogOut, BarChart3, Bell, FileDown, Baby } from "lucide-react";
import type { Period } from "@/lib/cycle";
import { computeStats } from "@/lib/cycle";
import { useTTCMode } from "@/lib/ttc";

export default function PerfilPage() {
  const [email, setEmail] = useState("");
  const [partnerEmail, setPartnerEmail] = useState("");
  const [partnerEnabled, setPartnerEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [userName, setUserName] = useState("");
  const [exporting, setExporting] = useState(false);
  const [ttcMode, setTtcMode] = useTTCMode();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setEmail(user.email ?? "");
    setUserName(user.user_metadata?.full_name || user.user_metadata?.name || "");

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

  async function exportPDF() {
    setExporting(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const now = new Date();

      // Header band
      doc.setFillColor(233, 30, 142); // pearl pink
      doc.rect(0, 0, pageW, 32, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("Pearl \u2014 Menstrual Cycle Report", pageW / 2, 16, { align: "center" });
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated ${now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, pageW / 2, 24, { align: "center" });

      // Patient info
      let y = 42;
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Patient Information", 14, y);
      y += 7;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      if (userName) { doc.text(`Name: ${userName}`, 14, y); y += 6; }
      doc.text(`Email: ${email}`, 14, y); y += 6;
      doc.text(`Date generated: ${now.toLocaleDateString("en-US")}`, 14, y);
      y += 12;

      // Summary stats
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Cycle Statistics", 14, y);
      y += 7;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Average cycle length: ${stats.avgCycleLength} days`, 14, y); y += 6;
      doc.text(`Average period duration: ${stats.avgPeriodDuration} days`, 14, y); y += 6;
      doc.text(`Cycles logged: ${stats.cycleCount}`, 14, y);
      y += 14;

      // Period history table
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Period History", 14, y);
      y += 8;

      // Table header
      const colX = [14, 54, 94, 130, 166];
      const headers = ["#", "Start Date", "End Date", "Duration", "Cycle Length"];
      doc.setFillColor(248, 230, 238);
      doc.rect(12, y - 5, pageW - 24, 8, "F");
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 40, 80);
      headers.forEach((h, i) => doc.text(h, colX[i], y));
      y += 7;

      // Table rows
      const sorted = [...periods].sort((a, b) => a.start_date.localeCompare(b.start_date));
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);

      sorted.forEach((p, idx) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }

        // Alternating row background
        if (idx % 2 === 0) {
          doc.setFillColor(250, 245, 248);
          doc.rect(12, y - 4, pageW - 24, 7, "F");
        }

        const duration = p.end_date
          ? Math.round((new Date(p.end_date).getTime() - new Date(p.start_date).getTime()) / 86400000) + 1
          : "-";

        let cycleLen = "-";
        if (idx < sorted.length - 1) {
          const nextStart = sorted[idx + 1].start_date;
          cycleLen = String(Math.round((new Date(nextStart).getTime() - new Date(p.start_date).getTime()) / 86400000));
        }

        doc.setFontSize(9);
        doc.text(String(idx + 1), colX[0], y);
        doc.text(p.start_date, colX[1], y);
        doc.text(p.end_date ?? "Ongoing", colX[2], y);
        doc.text(String(duration), colX[3], y);
        doc.text(cycleLen, colX[4], y);
        y += 7;
      });

      // Footer
      y = Math.max(y + 10, 275);
      if (y > 285) { doc.addPage(); y = 270; }
      doc.setFontSize(8);
      doc.setTextColor(160, 160, 160);
      doc.text("Generated by Pearl \u00b7 pearl.franciscocucullu.com", pageW / 2, 290, { align: "center" });

      doc.save(`pearl-cycle-report-${now.toISOString().split("T")[0]}.pdf`);
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      setExporting(false);
    }
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

      {/* TTC Mode */}
      <div className="bg-surface rounded-2xl p-5 border border-border mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Baby className="w-4 h-4 text-pearl" />
          <h2 className="font-semibold text-sm">Trying to Conceive</h2>
        </div>
        <p className="text-xs text-muted mb-3">
          Enable to get fertility-focused insights, tips, and a highlighted fertile window on your hormone chart.
        </p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted">I'm trying to conceive</span>
          <button
            onClick={() => setTtcMode(!ttcMode)}
            className={`w-12 h-7 rounded-full transition-colors relative shrink-0 ${
              ttcMode ? "bg-pearl" : "bg-gray-300"
            }`}
          >
            <span
              className="absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform"
              style={{ transform: ttcMode ? "translateX(20px)" : "translateX(0)" }}
            />
          </button>
        </div>
      </div>

      {/* Export for Doctor */}
      {periods.length > 0 && (
        <button
          onClick={exportPDF}
          disabled={exporting}
          className="w-full flex items-center justify-center gap-2 bg-surface border border-border rounded-2xl py-3.5 text-sm font-medium text-foreground hover:border-pearl/30 transition-colors mb-4 disabled:opacity-50"
        >
          <FileDown className="w-4 h-4 text-pearl" />
          {exporting ? "Generating..." : "Export for Doctor"}
        </button>
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
