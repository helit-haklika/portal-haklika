import { NextRequest, NextResponse } from "next/server";
import { consumeMagicToken } from "@/lib/auth/magic-link";
import { signJWT } from "@/lib/auth/jwt";
import { getSessionCookieOptions } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  const { token } = await req.json().catch(() => ({ token: null }));

  if (!token) {
    return NextResponse.json({ error: "חסר token" }, { status: 400 });
  }

  const result = await consumeMagicToken(token).catch(() => null);
  if (!result) {
    return NextResponse.json(
      { error: "הלינק פג תוקף או כבר נוצל. בקשו לינק חדש." },
      { status: 401 },
    );
  }

  const jwt = await signJWT({
    customerId: result.customerId,
    email: result.email,
  });

  const cookieOptions = getSessionCookieOptions();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(cookieOptions.name, jwt, cookieOptions);
  return response;
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (token) {
    return NextResponse.redirect(
      new URL(`/auth/verify?token=${token}`, req.url),
    );
  }
  return NextResponse.redirect(new URL("/login", req.url));
}
