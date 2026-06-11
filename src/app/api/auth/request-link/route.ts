import { NextRequest, NextResponse } from "next/server";
import { kv } from "@/lib/cache/kv";
import { findCustomerByEmail } from "@/lib/data";
import { createMagicToken } from "@/lib/auth/magic-link";
import { isAdminEmail } from "@/lib/auth/admin";
import { logRequestLink, logError } from "@/lib/logs";

const RATE_LIMIT_KEY = (ip: string) => `ratelimit:login:${ip}`;
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW = 15 * 60;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;

// NOTE: trusting x-real-ip / x-forwarded-for is safe ONLY behind Vercel's
// proxy, which overwrites these headers. If this app is ever self-hosted,
// a client can spoof them and bypass the rate limit - switch to a header
// set by the actual edge (e.g. x-vercel-forwarded-for) or the socket IP.
function getClientIp(req: NextRequest): string {
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return "unknown";
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  try {
    const rateLimitKey = RATE_LIMIT_KEY(ip);
    const count = await kv.incr(rateLimitKey);
    if (count === 1) await kv.expire(rateLimitKey, RATE_LIMIT_WINDOW);
    if (count > RATE_LIMIT_MAX) {
      await logRequestLink({
        email: "(rate-limited)",
        outcome: "rate-limited",
        ip,
      });
      return NextResponse.json(
        { error: "יותר מדי ניסיונות. נסו שוב בעוד 15 דקות." },
        { status: 429 },
      );
    }
  } catch (kvErr) {
    await logError("kv", kvErr, { stage: "rate-limit", ip });
    return NextResponse.json(
      { error: "השירות אינו זמין כרגע. נסו שוב בעוד מספר רגעים." },
      { status: 503 },
    );
  }

  const { email } = await req.json().catch(() => ({ email: "" }));
  if (
    !email ||
    typeof email !== "string" ||
    email.length > MAX_EMAIL_LENGTH ||
    !EMAIL_REGEX.test(email.trim())
  ) {
    return NextResponse.json(
      { error: "כתובת אימייל לא תקינה." },
      { status: 400 },
    );
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Always return 200 to not reveal whether email exists
  const successResponse = NextResponse.json({ ok: true });

  const isAdmin = isAdminEmail(normalizedEmail);

  try {
    const records = await findCustomerByEmail(normalizedEmail);

    let customerId: string | null = null;
    let customerName = "";
    let supabaseId: string | undefined;

    if (records.length === 0) {
      if (!isAdmin) {
        await logRequestLink({
          email: normalizedEmail,
          outcome: "not-found",
          ip,
        });
        return successResponse;
      }
      customerId = `admin:${normalizedEmail}`;
      customerName = "אדמין";
    } else {
      const customer = records.find((r) => r.isActive) ?? null;

      if (!customer) {
        if (!isAdmin) {
          await logRequestLink({
            email: normalizedEmail,
            outcome: "inactive",
            ip,
            reason: `${records.length} matching inactive`,
          });
          return successResponse;
        }
        customerId = `admin:${normalizedEmail}`;
        customerName = "אדמין";
      } else {
        customerId = customer.id;
        customerName = customer.name;
        supabaseId = customer.supabaseId;
      }
    }

    const token = await createMagicToken(
      customerId,
      normalizedEmail,
      customerName,
      supabaseId,
    );
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    // SECURITY WARNING (hak-7): the token travels in the query string, so it
    // lands in browser history, Vercel request logs, and the Make.com
    // execution history (the webhook payload below includes the full link).
    // Combined with the permanent reusable token (rule 7 in CLAUDE.md), every
    // stored copy of this URL is a long-lived credential. Action for Uri:
    // verify the Make scenario does not retain execution history with
    // `magic_link`, or shorten its retention.
    const magicLink = `${appUrl}/api/auth/verify?token=${token}`;

    const webhookUrl = process.env.MAKE_EMAIL_WEBHOOK_URL;
    if (!webhookUrl) {
      await logError(
        "make",
        new Error("MAKE_EMAIL_WEBHOOK_URL not configured"),
      );
      return successResponse;
    }

    const webhookRes = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: normalizedEmail,
        magic_link: magicLink,
        customer_name: customerName,
      }),
    });

    if (!webhookRes.ok) {
      const body = await webhookRes.text().catch(() => "");
      await logError(
        "make",
        new Error(
          `Make webhook ${webhookRes.status} ${webhookRes.statusText}: ${body}`,
        ),
        {
          email: normalizedEmail,
        },
      );
      await logRequestLink({
        email: normalizedEmail,
        outcome: "error",
        ip,
        reason: `webhook ${webhookRes.status}`,
      });
      return successResponse;
    }

    await logRequestLink({
      email: normalizedEmail,
      outcome: "sent",
      ip,
      reason: isAdmin ? "admin" : undefined,
    });
  } catch (err) {
    await logError("auth", err, {
      stage: "request-link",
      email: normalizedEmail,
    });
    await logRequestLink({
      email: normalizedEmail,
      outcome: "error",
      ip,
      reason: err instanceof Error ? err.message : "unknown",
    });
  }

  return successResponse;
}
