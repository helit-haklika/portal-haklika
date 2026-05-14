import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJWT } from "@/lib/auth/jwt";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const raw = cookieStore.get("hk_session")?.value;
  if (!raw) {
    return NextResponse.json({ session: null, reason: "no cookie" });
  }
  const payload = await verifyJWT(raw);
  if (!payload) {
    return NextResponse.json({ session: null, reason: "jwt verify failed", cookieLength: raw.length });
  }
  return NextResponse.json({ session: payload });
}
