import { kv } from "@/lib/cache/kv";
import { randomBytes } from "crypto";

const TOKEN_TTL_SECONDS = 15 * 60;

export interface MagicTokenPayload {
  customerId: string;
  email: string;
  name?: string;
}

export async function createMagicToken(
  customerId: string,
  email: string,
  name?: string,
): Promise<string> {
  const token = randomBytes(32).toString("hex");
  await kv.set(
    `magic:${token}`,
    { customerId, email, name },
    {
      ex: TOKEN_TTL_SECONDS,
    },
  );
  return token;
}

export async function consumeMagicToken(
  token: string,
): Promise<MagicTokenPayload | null> {
  const data = await kv.getdel<MagicTokenPayload>(`magic:${token}`);
  if (!data) return null;
  return data;
}
