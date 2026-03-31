import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { getPartnerRecommendation, getPhaseName, getPhaseEmoji, type Phase } from "@/lib/cycle";

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const { user_id, phase } = (await req.json()) as {
      user_id: string;
      phase: Phase;
    };

    if (!user_id || !phase) {
      return NextResponse.json({ error: "Missing user_id or phase" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Look up partner notification settings
    const { data: partner } = await supabase
      .from("pearl_partner_notifications")
      .select("partner_email, enabled")
      .eq("user_id", user_id)
      .single();

    if (!partner || !partner.enabled || !partner.partner_email) {
      return NextResponse.json({ skipped: true, reason: "No partner email or notifications disabled" });
    }

    // Get user's name from auth
    const { data: { user } } = await supabase.auth.admin.getUserById(user_id);
    const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || "Your partner";

    const phaseName = getPhaseName(phase);
    const emoji = getPhaseEmoji(phase);
    const recommendation = getPartnerRecommendation(phase, userName);

    const { error } = await resend.emails.send({
      from: "Pearl <pearl@franciscocucullu.com>",
      to: partner.partner_email,
      subject: `${userName} — ${phaseName} Phase`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #FFF9F9; border-radius: 16px;">
          <h2 style="text-align: center; color: #D4A0A0; margin: 0 0 24px 0; font-size: 24px;">
            Pearl
          </h2>
          <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
            Hi there,
          </p>
          <div style="background: white; border-radius: 12px; padding: 20px; margin: 0 0 20px 0; border: 1px solid #F0E0E0;">
            <p style="font-size: 20px; font-weight: 600; margin: 0 0 12px 0; color: #333;">
              ${emoji} ${userName} — ${phaseName} Phase
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

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({ sent: true });
  } catch (e) {
    console.error("notify-partner error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
