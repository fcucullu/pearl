import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { type, message, email, imageUrl } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "Missing message" }, { status: 400 });
    }

    await resend.emails.send({
      from: "Pearl <noreply@franciscocucullu.com>",
      to: "francisco.cucullu@gmail.com",
      subject: `Pearl Feedback [${type || "other"}]: ${message.slice(0, 50)}`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #D4A0A0;">Pearl Feedback</h2>
          <p><strong>Type:</strong> ${type || "other"}</p>
          <p><strong>From:</strong> ${email || "unknown"}</p>
          <p><strong>Message:</strong></p>
          <p style="background: #FFF9F5; padding: 12px; border-radius: 8px; border: 1px solid #F0E6E0;">${message}</p>
          ${imageUrl ? `<p><strong>Screenshot:</strong> <a href="${imageUrl}">View</a></p>` : ""}
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Feedback error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
