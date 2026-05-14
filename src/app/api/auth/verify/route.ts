import { NextRequest, NextResponse } from "next/server";
import { consumeMagicToken } from "@/lib/auth/magic-link";
import { signJWT } from "@/lib/auth/jwt";
import { getSessionCookieOptions } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=missing", req.url));
  }

  let result;
  try {
    result = await consumeMagicToken(token);
  } catch (err) {
    console.error("consumeMagicToken error:", err);
    return NextResponse.redirect(new URL("/login?error=server", req.url));
  }
  if (!result) {
    console.error("Token not found or expired:", token.slice(0, 8) + "...");
    return NextResponse.redirect(new URL("/login?error=expired", req.url));
  }

  const jwt = await signJWT({
    customerId: result.customerId,
    email: result.email,
  });

  console.log(
    "verify: JWT signed for",
    result.email,
    "customerId:",
    result.customerId.slice(0, 8),
  );

  const cookieOptions = getSessionCookieOptions();
  const response = NextResponse.redirect(new URL("/dashboard", req.url));
  response.cookies.set(cookieOptions.name, jwt, cookieOptions);

  console.log("verify: cookie set, redirecting to /dashboard");
  return response;
}
