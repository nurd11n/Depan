import { NextRequest, NextResponse } from "next/server";
import { quoteSchema } from "@/lib/schemas";
import { sendQuoteLeadEmail, MailerError } from "@/lib/mailer";

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;

const submissionsByIp = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (submissionsByIp.get(ip) ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS,
  );
  timestamps.push(now);
  submissionsByIp.set(ip, timestamps);
  return timestamps.length > RATE_LIMIT_MAX_REQUESTS;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = quoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  if (parsed.data.website) {
    // Honeypot triggered — silently pretend success so bots move on.
    return NextResponse.json({ ok: true });
  }

  try {
    await sendQuoteLeadEmail(parsed.data);
  } catch (err) {
    if (err instanceof MailerError) {
      console.error("[quote] delivery failed", err.message);
      return NextResponse.json({ error: "Delivery failed" }, { status: 502 });
    }
    throw err;
  }

  return NextResponse.json({ ok: true });
}
