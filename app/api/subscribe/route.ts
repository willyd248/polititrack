import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Emails are stored in /tmp/subscribers.json (ephemeral on Vercel).
// Replace with Resend audience or DB insert when ready.
const SUBSCRIBERS_FILE = "/tmp/polititrack_subscribers.json";

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

  // Persist to /tmp (ephemeral) and log so emails appear in Vercel function logs
  try {
    let existing: string[] = [];
    try {
      const raw = await fs.readFile(SUBSCRIBERS_FILE, "utf-8");
      existing = JSON.parse(raw);
    } catch {
      // File doesn't exist yet — start fresh
    }

    if (!existing.includes(email)) {
      existing.push(email);
      await fs.writeFile(SUBSCRIBERS_FILE, JSON.stringify(existing, null, 2));
    }

    console.log(`[PolitiTrack] Newsletter signup: ${email}`);
  } catch (err) {
    console.error("[PolitiTrack] Failed to save subscriber:", err);
    // Don't surface storage errors to the user — the intent was captured in logs
  }

  return NextResponse.json({ ok: true });
}
