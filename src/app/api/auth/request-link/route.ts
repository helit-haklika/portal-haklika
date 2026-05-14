import { NextRequest, NextResponse } from "next/server";
import { kv } from "@/lib/cache/kv";
import { listRecords } from "@/lib/airtable/client";
import { createMagicToken } from "@/lib/auth/magic-link";
import { Resend } from "resend";
import type { CustomerFields } from "@/lib/airtable/types";

const RATE_LIMIT_KEY = (ip: string) => `ratelimit:login:${ip}`;
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW = 15 * 60;

const CUSTOMERS_TABLE = "tblIUoXFMdWuFldvr";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";

  try {
    const rateLimitKey = RATE_LIMIT_KEY(ip);
    const count = await kv.incr(rateLimitKey);
    if (count === 1) await kv.expire(rateLimitKey, RATE_LIMIT_WINDOW);
    if (count > RATE_LIMIT_MAX) {
      return NextResponse.json(
        { error: "יותר מדי ניסיונות. נסו שוב בעוד 15 דקות." },
        { status: 429 },
      );
    }
  } catch (kvErr) {
    console.error("KV rate-limit error:", kvErr);
  }

  const { email } = await req.json().catch(() => ({ email: "" }));
  if (!email || typeof email !== "string") {
    return NextResponse.json(
      { error: "כתובת אימייל לא תקינה." },
      { status: 400 },
    );
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Always return 200 to not reveal whether email exists
  const successResponse = NextResponse.json({ ok: true });

  try {
    const records = await listRecords<CustomerFields>(CUSTOMERS_TABLE, {
      filterByFormula: `OR({אימייל}='${normalizedEmail}', {אימייל נוסף}='${normalizedEmail}')`,
      maxRecords: 1,
    });

    const customer = records[0];
    if (!customer) return successResponse;

    if (customer.fields["סטטוס לקוח"] === "לא פעיל") return successResponse;

    const token = await createMagicToken(customer.id, normalizedEmail);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const magicLink = `${appUrl}/api/auth/verify?token=${token}`;

    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: `${process.env.RESEND_FROM_NAME ?? "הקליקה"} <${process.env.RESEND_FROM_EMAIL ?? "noreply@example.com"}>`,
      to: normalizedEmail,
      subject: "הלינק שלך לכניסה לפורטל הקליקה",
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
          <h2 style="color: #2F5D54; margin-bottom: 8px;">כניסה לפורטל הקליקה</h2>
          <p style="color: #2E3645; margin-bottom: 24px;">לחצו על הכפתור כדי להיכנס לפורטל שלכם. הלינק תקף ל-15 דקות.</p>
          <a href="${magicLink}" style="display: inline-block; background: #2F5D54; color: #F5F1EA; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 600;">
            כניסה לפורטל
          </a>
          <p style="color: #6B7280; font-size: 12px; margin-top: 24px;">
            אם לא ביקשתם את הלינק הזה, אתם יכולים להתעלם ממייל זה.
          </p>
        </div>
      `,
    });
  } catch (err) {
    console.error("request-link error:", err);
  }

  return successResponse;
}
