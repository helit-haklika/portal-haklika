import { NextRequest, NextResponse } from "next/server";
import { findCustomerByEmail } from "@/lib/data";
import { signJWT } from "@/lib/auth/jwt";
import { getSessionCookieOptions } from "@/lib/auth/session";
import { isAdminEmail } from "@/lib/auth/admin";

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse("Not found", { status: 404 });
  }

  const email = req.nextUrl.searchParams.get("email");
  if (!email) {
    return new NextResponse(
      "Missing ?email= parameter. Example: /api/dev/login?email=foo@bar.com",
      { status: 400 },
    );
  }

  const normalizedEmail = email.trim().toLowerCase();
  const isAdmin = isAdminEmail(normalizedEmail);
  const matches = await findCustomerByEmail(normalizedEmail);
  const customer = matches[0];

  if (!customer && !isAdmin) {
    return new NextResponse(`No customer found for ${normalizedEmail}`, {
      status: 404,
    });
  }

  // Admin without a matching customer row gets an admin: pseudo-id; same flow
  // as production magic-link verify.
  const customerId = customer?.id ?? `admin:${normalizedEmail}`;
  const supabaseId = customer?.supabaseId;
  const redirectTo = isAdmin && !customer ? "/admin" : "/dashboard";

  const jwt = await signJWT({
    customerId,
    supabaseId,
    email: normalizedEmail,
    isAdmin,
  });

  const cookieOptions = getSessionCookieOptions();
  const response = NextResponse.redirect(new URL(redirectTo, req.url));
  response.cookies.set(cookieOptions.name, jwt, cookieOptions);
  return response;
}
