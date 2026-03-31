import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  let body: { email?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;

  if (!apiKey || !audienceId) {
    // Env vars not set — log so signups appear in Vercel function logs
    console.log(`[PolitiTrack] Newsletter signup (no Resend config): ${email}`);
    return NextResponse.json({ ok: true });
  }

  try {
    const resend = new Resend(apiKey);
    await resend.contacts.create({
      email,
      audienceId,
      unsubscribed: false,
    });
    console.log(`[PolitiTrack] Newsletter signup stored in Resend: ${email}`);
  } catch (err) {
    // Log but don't surface storage errors to the user
    console.error("[PolitiTrack] Failed to save subscriber to Resend:", err);
  }

  return NextResponse.json({ ok: true });
}
