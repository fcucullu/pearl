import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import {
  computeStats,
  getPhaseForDate,
  getPartnerRecommendation,
  getPhaseName,
  getPhaseEmoji,
  getPhaseColor,
  type Period,
  type Phase,
} from "@/lib/cycle";

export async function GET(req: NextRequest) {
  // Verify Vercel cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return runPhaseCheck();
}

export async function POST(req: NextRequest) {
  // Verify service role key (for manual triggers)
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return runPhaseCheck();
}

async function runPhaseCheck() {

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const resend = new Resend(process.env.RESEND_API_KEY);

  // Get all users with partner notifications enabled
  const { data: notifications } = await supabase
    .from("pearl_partner_notifications")
    .select("user_id, partner_email, enabled, last_notified_phase, last_notified_at")
    .eq("enabled", true);

  if (!notifications?.length) {
    return NextResponse.json({ checked: 0, sent: 0 });
  }

  const today = new Date().toISOString().split("T")[0];
  let sent = 0;
  let checked = 0;

  for (const notif of notifications) {
    checked++;

    // Get user's periods
    const { data: periodsData } = await supabase
      .from("pearl_periods")
      .select("id, start_date, end_date")
      .eq("user_id", notif.user_id)
      .order("start_date", { ascending: true });

    const periods = (periodsData ?? []) as Period[];
    if (periods.length === 0) continue;

    const stats = computeStats(periods);
    const phaseInfo = getPhaseForDate(today, periods, stats);
    const currentPhase = phaseInfo.phase;

    // Check if this is a new cycle (same phase name but new period started after last notification)
    const latestPeriod = periods[periods.length - 1];
    const isNewCycle = currentPhase === "menstrual" &&
      notif.last_notified_phase === "menstrual" &&
      notif.last_notified_at &&
      latestPeriod.start_date > notif.last_notified_at.split("T")[0];

    // Skip if phase hasn't changed AND it's not a new cycle
    if (currentPhase === notif.last_notified_phase && !isNewCycle) continue;

    // Get user's name
    const { data: { user } } = await supabase.auth.admin.getUserById(notif.user_id);
    const fullName = user?.user_metadata?.full_name || user?.user_metadata?.name || "Your partner";
    const userName = fullName.split(" ")[0];

    const phaseName = getPhaseName(currentPhase);
    const emoji = getPhaseEmoji(currentPhase);
    const color = getPhaseColor(currentPhase);
    const recommendation = getPartnerRecommendation(currentPhase, userName);

    // Calculate phase date range
    const phaseStartDate = new Date();
    phaseStartDate.setDate(phaseStartDate.getDate() - (phaseInfo.dayInPhase - 1));
    const phaseEndDate = new Date(phaseStartDate);
    phaseEndDate.setDate(phaseEndDate.getDate() + phaseInfo.totalDaysInPhase - 1);
    const formatDate = (d: Date) => d.toLocaleDateString("en", { month: "short", day: "numeric" });
    const dateRange = `${formatDate(phaseStartDate)} – ${formatDate(phaseEndDate)}`;

    // Send email
    const { error } = await resend.emails.send({
      from: "Pearl <pearl@franciscocucullu.com>",
      to: notif.partner_email,
      subject: `${userName} — ${phaseName} Phase`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #FFF9F9; border-radius: 16px;">
          <h2 style="text-align: center; color: #D4A0A0; margin: 0 0 24px 0; font-size: 24px;">
            Pearl
          </h2>
          <div style="background: white; border-radius: 12px; padding: 20px; margin: 0 0 20px 0; border: 1px solid #F0E0E0;">
            <p style="font-size: 20px; font-weight: 600; margin: 0 0 8px 0; color: #333;">
              ${emoji} ${userName} — ${phaseName} Phase
            </p>
            <p style="font-size: 13px; font-weight: 500; margin: 0 0 14px 0; color: ${color};">
              ${dateRange} (${phaseInfo.totalDaysInPhase} days)
            </p>
            <p style="color: #555; font-size: 14px; line-height: 1.7; margin: 0;">
              ${recommendation}
            </p>
          </div>
          <p style="color: #999; font-size: 12px; text-align: center; margin: 24px 0 0 0;">
            Sent by Pearl — period & cycle tracker
          </p>
        </div>
      `,
    });

    if (!error) {
      // Update last notified phase and timestamp
      await supabase
        .from("pearl_partner_notifications")
        .update({ last_notified_phase: currentPhase, last_notified_at: new Date().toISOString() })
        .eq("user_id", notif.user_id);
      sent++;
    } else {
      console.error("Resend error for user", notif.user_id, error);
    }
  }

  return NextResponse.json({ checked, sent });
}
