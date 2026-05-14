import { NextRequest, NextResponse } from "next/server";
import { consumeMagicToken } from "@/lib/auth/magic-link";
import { signJWT } from "@/lib/auth/jwt";
import { getSessionCookieOptions } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=missing", req.url));
  }

  const result = await consumeMagicToken(token);
  if (!result) {
    return NextResponse.redirect(new URL("/login?error=expired", req.url));
  }

  const jwt = await signJWT({
    customerId: result.customerId,
    email: result.email,
  });

  const cookieOptions = getSessionCookieOptions();
  const response = NextResponse.redirect(new URL("/dashboard", req.url));
  response.cookies.set(cookieOptions.name, jwt, cookieOptions);

  return response;
}
