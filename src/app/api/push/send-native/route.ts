import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  computeStats,
  predictNextPeriod,
  getPhaseForDate,
  getPhaseName,
  getPhaseEmoji,
  type Period,
} from "@/lib/cycle";

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default";
  priority?: "high";
}

async function sendExpoPush(messages: ExpoPushMessage[]) {
  if (messages.length === 0) return;
  // Expo Push API accepts batches of up to 100
  const chunks: ExpoPushMessage[][] = [];
  for (let i = 0; i < messages.length; i += 100) {
    chunks.push(messages.slice(i, i + 100));
  }
  for (const chunk of chunks) {
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(chunk),
    });
  }
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get all users with Expo push tokens
  const { data: tokens } = await supabase
    .from("pearl_expo_push_tokens")
    .select("user_id, token");

  if (!tokens?.length) {
    return NextResponse.json({ checked: 0, sent: 0 });
  }

  // Group tokens by user
  const userTokens = new Map<string, string[]>();
  for (const t of tokens) {
    const existing = userTokens.get(t.user_id) ?? [];
    existing.push(t.token);
    userTokens.set(t.user_id, existing);
  }

  // Get push state for all users
  const { data: pushStates } = await supabase
    .from("pearl_user_push_state")
    .select("user_id, last_notified_phase, last_period_reminder_at");

  const stateMap = new Map(
    (pushStates ?? []).map((s) => [s.user_id, s])
  );

  const today = new Date().toISOString().split("T")[0];
  const messages: ExpoPushMessage[] = [];
  let checked = 0;

  for (const [userId, tokensForUser] of userTokens) {
    checked++;

    // Get user's periods
    const { data: periodsData } = await supabase
      .from("pearl_periods")
      .select("id, start_date, end_date")
      .eq("user_id", userId)
      .order("start_date", { ascending: true });

    const periods = (periodsData ?? []) as Period[];
    if (periods.length === 0) continue;

    const stats = computeStats(periods);
    const phaseInfo = getPhaseForDate(today, periods, stats);
    const nextPeriod = predictNextPeriod(periods, stats);
    const state = stateMap.get(userId);

    let title: string | null = null;
    let body: string | null = null;
    let updatePhase = false;
    let updateReminder = false;

    // 1. Check for phase change → notify user
    const lastPhase = state?.last_notified_phase;
    const latestPeriod = periods[periods.length - 1];
    const isNewCycle =
      phaseInfo.phase === "menstrual" &&
      lastPhase === "menstrual" &&
      state?.last_notified_phase &&
      latestPeriod.start_date > (state as { last_notified_phase: string }).last_notified_phase;

    if (lastPhase !== phaseInfo.phase || isNewCycle) {
      const emoji = getPhaseEmoji(phaseInfo.phase);
      const name = getPhaseName(phaseInfo.phase);
      title = `${emoji} ${name} Phase`;

      switch (phaseInfo.phase) {
        case "menstrual":
          body = "Your period is starting. Take it easy and prioritize rest.";
          break;
        case "follicular":
          body = "Energy is rising! Great time for new projects and challenges.";
          break;
        case "ovulation":
          body = "Peak energy and confidence. You're glowing!";
          break;
        case "luteal":
          body = "Time to wind down. Be gentle with yourself.";
          break;
      }
      updatePhase = true;
    }

    // 2. Check for period approaching (2 days away) — only if no phase change notification
    if (!title && nextPeriod) {
      const nextDate = new Date(nextPeriod);
      const todayDate = new Date(today);
      const diffDays = Math.round(
        (nextDate.getTime() - todayDate.getTime()) / 86400000
      );

      if (diffDays === 2) {
        title = "Period Coming Soon";
        body = "Your period is predicted to start in 2 days. Be prepared!";
        updateReminder = true;
      } else if (diffDays < 0 && !phaseInfo.isExtendedPeriod) {
        // Period is late (and not in an ongoing period)
        const activePeriod = periods.find((p) => !p.end_date);
        if (!activePeriod) {
          const daysLate = Math.abs(diffDays);
          title = `Period is ${daysLate} ${daysLate === 1 ? "day" : "days"} late`;
          body =
            "Has your period started? Log it to keep your cycle tracking accurate.";
          updateReminder = true;
        }
      }
    }

    // 3. Check for extended period
    if (!title) {
      const activePeriod = periods.find((p) => !p.end_date);
      if (activePeriod) {
        const periodDays =
          Math.round(
            (new Date(today).getTime() -
              new Date(activePeriod.start_date).getTime()) /
              86400000
          ) + 1;
        if (periodDays > stats.avgPeriodDuration) {
          // Only remind once per day
          const lastReminder = state?.last_period_reminder_at;
          const lastReminderDate = lastReminder
            ? lastReminder.split("T")[0]
            : null;
          if (lastReminderDate !== today) {
            title = `Period day ${periodDays}`;
            body = `Your period has been going for ${periodDays} days (your average is ${stats.avgPeriodDuration}). Has it ended?`;
            updateReminder = true;
          }
        }
      }
    }

    if (title && body) {
      for (const token of tokensForUser) {
        messages.push({
          to: token,
          title,
          body,
          sound: "default",
          priority: "high",
          data: { screen: "calendario" },
        });
      }

      // Update push state
      const updates: Record<string, unknown> = {};
      if (updatePhase) {
        updates.last_notified_phase = phaseInfo.phase;
        updates.last_notified_at = new Date().toISOString();
      }
      if (updateReminder) {
        updates.last_period_reminder_at = new Date().toISOString();
      }

      await supabase.from("pearl_user_push_state").upsert(
        { user_id: userId, ...updates },
        { onConflict: "user_id" }
      );
    }
  }

  await sendExpoPush(messages);

  return NextResponse.json({ checked, sent: messages.length });
}
