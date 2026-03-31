import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const { user_id, endpoint, p256dh, auth } = await req.json();

    if (!user_id || !endpoint || !p256dh || !auth) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabase.from("pearl_push_subscriptions").upsert(
      { user_id, endpoint, p256dh, auth },
      { onConflict: "user_id,endpoint" }
    );

    if (error) {
      console.error("Push subscribe error:", error);
      return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 });
    }

    return NextResponse.json({ subscribed: true });
  } catch (e) {
    console.error("Push subscribe error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
