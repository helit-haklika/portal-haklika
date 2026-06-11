import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { readMagicToken, registerDevice } from "@/lib/auth/magic-link";
import { signJWT } from "@/lib/auth/jwt";
import { getSessionCookieOptions } from "@/lib/auth/session";
import { isAdminEmail } from "@/lib/auth/admin";
import { fetchCustomer } from "@/lib/data";
import { logLogin, logError } from "@/lib/logs";

const DEVICE_COOKIE = "hk_device";
const DEVICE_COOKIE_MAX_AGE = 400 * 24 * 60 * 60; // ~max browser cap (400 days)

export async function POST(req: NextRequest) {
  const { token } = await req.json().catch(() => ({ token: null }));

  if (!token) {
    return NextResponse.json({ error: "חסר token" }, { status: 400 });
  }

  const result = await readMagicToken(token).catch(() => null);
  if (!result) {
    return NextResponse.json(
      { error: "הלינק אינו תקין. בקשו לינק חדש מדף הכניסה." },
      { status: 401 },
    );
  }

  const isAdmin = isAdminEmail(result.email);

  // Security rule 9 (CLAUDE.md): an inactive customer is blocked from logging
  // in even with an existing magic link. Admin tokens (customerId starts with
  // "admin:") have no customer record, so they skip this check.
  if (!isAdmin && !result.customerId.startsWith("admin:")) {
    let customer;
    try {
      customer = await fetchCustomer(result.customerId, result.supabaseId);
    } catch (err) {
      await logError("auth", err, {
        stage: "verify-isactive",
        customerId: result.customerId,
      });
      return NextResponse.json(
        { error: "השירות אינו זמין כרגע. נסו שוב בעוד מספר רגעים." },
        { status: 503 },
      );
    }
    if (!customer || !customer.isActive) {
      return NextResponse.json(
        { error: "הלינק אינו תקין. בקשו לינק חדש מדף הכניסה." },
        { status: 401 },
      );
    }
  }

  // Identify the browser/device by a stable cookie. New devices get a fresh id
  // that we persist below, so the same browser is never counted twice.
  let deviceId = req.cookies.get(DEVICE_COOKIE)?.value;
  const isNewDevice = !deviceId;
  if (!deviceId) deviceId = randomUUID();

  // Fail closed: the device cap is the main control bounding the permanent,
  // reusable magic link. If KV is down we refuse the login (503) instead of
  // silently allowing any device in.
  let allowed: boolean;
  try {
    allowed = await registerDevice(token, deviceId);
  } catch (err) {
    await logError("kv", err, {
      stage: "register-device",
      customerId: result.customerId,
    });
    return NextResponse.json(
      { error: "השירות אינו זמין כרגע. נסו שוב בעוד מספר רגעים." },
      { status: 503 },
    );
  }
  if (!allowed) {
    return NextResponse.json(
      {
        error:
          "הקישור הזה כבר בשימוש במספר המרבי של מכשירים. בקשו קישור חדש מדף הכניסה.",
      },
      { status: 403 },
    );
  }

  const jwt = await signJWT({
    customerId: result.customerId,
    supabaseId: result.supabaseId,
    email: result.email,
    isAdmin,
  });

  await logLogin({
    customerId: result.customerId,
    email: result.email,
    name: result.name ?? "",
    isAdmin,
  });

  const cookieOptions = getSessionCookieOptions();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(cookieOptions.name, jwt, cookieOptions);
  if (isNewDevice) {
    response.cookies.set(DEVICE_COOKIE, deviceId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: DEVICE_COOKIE_MAX_AGE,
      path: "/",
    });
  }
  return response;
}

// NOTE (hak-7): the token arrives in the query string (from the email link),
// so it is recorded in browser history and request logs. Accepted trade-off
// for now - see the warning in request-link/route.ts.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (token) {
    return NextResponse.redirect(
      new URL(`/auth/verify?token=${encodeURIComponent(token)}`, req.url),
    );
  }
  return NextResponse.redirect(new URL("/login", req.url));
}
