import { kv } from "@/lib/cache/kv";
import { randomBytes } from "crypto";

// Max distinct devices that may log in from a single magic link.
// Bounds how far a forwarded/leaked link can spread: the customer's own
// devices (phone + computer + tablet) keep working, but a new device beyond
// the cap is rejected - they just request a fresh link from the login page.
export const MAX_DEVICES_PER_TOKEN = 3;

export interface MagicTokenPayload {
  customerId: string;
  // Supabase UUID cached at login. Optional - present only when source is Supabase.
  supabaseId?: string;
  email: string;
  name?: string;
}

export async function createMagicToken(
  customerId: string,
  email: string,
  name?: string,
  supabaseId?: string,
): Promise<string> {
  const token = randomBytes(32).toString("hex");
  // Permanent, reusable token (no `ex`): the link stays valid so customers
  // can re-enter without requesting a new one. Spread is bounded per-device
  // via registerDevice() at verify time.
  await kv.set(`magic:${token}`, { customerId, supabaseId, email, name });
  return token;
}

export async function readMagicToken(
  token: string,
): Promise<MagicTokenPayload | null> {
  // `get` (not `getdel`): the token is reusable, not single-use.
  const data = await kv.get<MagicTokenPayload>(`magic:${token}`);
  if (!data) return null;
  return data;
}

// Registers a device against a token. Returns true if the device may proceed
// (already known for this token, or still under the cap), false once the cap
// is reached. Stored as a Redis set keyed by the token.
export async function registerDevice(
  token: string,
  deviceId: string,
): Promise<boolean> {
  const key = `magic:${token}:devices`;
  const known = await kv.sismember(key, deviceId);
  if (known) return true;
  const count = await kv.scard(key);
  if (count >= MAX_DEVICES_PER_TOKEN) return false;
  await kv.sadd(key, deviceId);
  return true;
}
