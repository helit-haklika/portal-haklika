import { kv } from "@/lib/cache/kv";
import { randomBytes } from "crypto";

const TOKEN_TTL_SECONDS = 15 * 60;

export async function createMagicToken(
  customerId: string,
  email: string,
): Promise<string> {
  const token = randomBytes(32).toString("hex");
  await kv.set(`magic:${token}`, JSON.stringify({ customerId, email }), {
    ex: TOKEN_TTL_SECONDS,
  });
  return token;
}

export async function consumeMagicToken(
  token: string,
): Promise<{ customerId: string; email: string } | null> {
  const raw = await kv.get<string>(`magic:${token}`);
  if (!raw) return null;
  await kv.del(`magic:${token}`);
  return JSON.parse(raw);
}
