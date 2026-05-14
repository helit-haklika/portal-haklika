import { cookies } from "next/headers";
import { verifyJWT } from "./jwt";
import type { JWTPayload } from "@/types";

const COOKIE_NAME = "hk_session";

export async function getCurrentSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyJWT(token);
}

export function getSessionCookieOptions() {
  return {
    name: COOKIE_NAME,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    maxAge: 30 * 24 * 60 * 60,
    path: "/",
  };
}
