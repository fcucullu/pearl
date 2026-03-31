import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webPush from "web-push";
import { computeStats, predictNextPeriod, type Period } from "@/lib/cycle";

export async function POST() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    webPush.setVapidDetails(
      "mailto:hello@franciscocucullu.com",
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    );

    // Get all users with push subscriptions
    const { data: subscriptions } = await supabase
      .from("pearl_push_subscriptions")
      .select("user_id, endpoint, p256dh, auth");

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ notified: 0 });
    }

    // Group subscriptions by user
    const userSubs = new Map<string, typeof subscriptions>();
    for (const sub of subscriptions) {
      const existing = userSubs.get(sub.user_id) ?? [];
      existing.push(sub);
      userSubs.set(sub.user_id, existing);
    }

    const today = new Date().toISOString().split("T")[0];
    let notified = 0;

    for (const [userId, subs] of userSubs) {
      // Get user's periods
      const { data: periods } = await supabase
        .from("pearl_periods")
        .select("id, start_date, end_date")
        .eq("user_id", userId)
        .order("start_date", { ascending: true });

      if (!periods || periods.length === 0) continue;

      const stats = computeStats(periods as Period[]);
      const nextPeriod = predictNextPeriod(periods as Period[], stats);

      if (!nextPeriod) continue;

      // Check if period is 2 days away
      const nextDate = new Date(nextPeriod);
      const todayDate = new Date(today);
      const diffMs = nextDate.getTime() - todayDate.getTime();
      const diffDays = Math.round(diffMs / 86400000);

      if (diffDays === 2) {
        const payload = JSON.stringify({
          title: "Period Coming Soon",
          body: "Your period is predicted to start in 2 days. Be prepared!",
          url: "/calendario",
        });

        for (const sub of subs) {
          try {
            await webPush.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh, auth: sub.auth },
              },
              payload
            );
            notified++;
          } catch (err: unknown) {
            // Remove invalid subscriptions (gone/expired)
            const statusCode = (err as { statusCode?: number })?.statusCode;
            if (statusCode === 404 || statusCode === 410) {
              await supabase
                .from("pearl_push_subscriptions")
                .delete()
                .eq("endpoint", sub.endpoint);
            }
            console.error("Push send error:", err);
          }
        }
      }
    }

    return NextResponse.json({ notified });
  } catch (e) {
    console.error("Push notify error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
