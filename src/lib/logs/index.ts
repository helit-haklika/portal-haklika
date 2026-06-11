import { kv } from "@/lib/cache/kv";

const TTL_SECONDS = 90 * 24 * 60 * 60;
const MAX_ENTRIES = 1000;

export type RequestLinkOutcome =
  | "sent"
  | "not-found"
  | "inactive"
  | "rate-limited"
  | "error";

export type ErrorSource =
  | "airtable"
  | "supabase"
  | "make"
  | "kv"
  | "dashboard"
  | "auth"
  | "other";

export interface LoginEntry {
  ts: number;
  customerId: string;
  email: string;
  name: string;
  isAdmin?: boolean;
}

export interface RequestLinkEntry {
  ts: number;
  email: string;
  outcome: RequestLinkOutcome;
  reason?: string;
  ip?: string;
}

export interface ErrorEntry {
  ts: number;
  source: ErrorSource;
  message: string;
  stack?: string;
  context?: Record<string, unknown>;
}

function todayKey(prefix: string, date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${prefix}:${y}-${m}-${d}`;
}

async function pushLog(key: string, entry: unknown): Promise<void> {
  try {
    await kv.lpush(key, JSON.stringify(entry));
    await kv.ltrim(key, 0, MAX_ENTRIES - 1);
    await kv.expire(key, TTL_SECONDS);
  } catch (err) {
    console.error(`[logs] failed to write ${key}:`, err);
  }
}

export async function logLogin(entry: Omit<LoginEntry, "ts">): Promise<void> {
  const full: LoginEntry = { ts: Date.now(), ...entry };
  const dayKey = todayKey("log:login");
  await pushLog(dayKey, full);
  await recordMetric("login", entry.customerId);
}

export async function logRequestLink(
  entry: Omit<RequestLinkEntry, "ts">,
): Promise<void> {
  const full: RequestLinkEntry = { ts: Date.now(), ...entry };
  await pushLog(todayKey("log:request"), full);
}

export async function logError(
  source: ErrorSource,
  err: unknown,
  context?: Record<string, unknown>,
): Promise<void> {
  const message =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : "Unknown error";
  const stack = err instanceof Error ? err.stack : undefined;
  const entry: ErrorEntry = { ts: Date.now(), source, message, stack, context };
  await pushLog(todayKey("log:error"), entry);
}

async function recordMetric(kind: "login", customerId: string): Promise<void> {
  try {
    const date = new Date();
    const dayKey = todayKey(`metric:${kind}`, date);
    const activeKey = todayKey(`metric:active`, date);
    await kv.incr(dayKey);
    await kv.expire(dayKey, TTL_SECONDS);
    await kv.sadd(activeKey, customerId);
    await kv.expire(activeKey, TTL_SECONDS);
  } catch (err) {
    console.error(`[logs] failed to record metric ${kind}:`, err);
  }
}

export interface LogReadResult<T> {
  entries: T[];
  totalByDay: Record<string, number>;
}

async function readDayList<T>(key: string, limit: number): Promise<T[]> {
  try {
    const raw = await kv.lrange<string>(key, 0, limit - 1);
    return raw
      .map((item) => {
        if (typeof item === "string") {
          try {
            return JSON.parse(item) as T;
          } catch {
            return null;
          }
        }
        return item as unknown as T;
      })
      .filter((x): x is T => x !== null);
  } catch (err) {
    console.error(`[logs] failed to read ${key}:`, err);
    return [];
  }
}

function daysBack(days: number): string[] {
  const out: string[] = [];
  const now = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(now);
    d.setUTCDate(now.getUTCDate() - i);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    out.push(`${y}-${m}-${day}`);
  }
  return out;
}

export async function readLogs<T>(
  prefix: "log:login" | "log:request" | "log:error",
  rangeDays: number,
  limit = 50,
): Promise<T[]> {
  const days = daysBack(rangeDays);
  const all: T[] = [];
  for (const day of days) {
    const entries = await readDayList<T>(`${prefix}:${day}`, limit);
    all.push(...entries);
    if (all.length >= limit) break;
  }
  return all.slice(0, limit);
}

export interface Metrics {
  loginsTotal: number;
  activeCustomers: number;
}

export async function readMetrics(rangeDays: number): Promise<Metrics> {
  const days = daysBack(rangeDays);
  let loginsTotal = 0;
  const activeSet = new Set<string>();
  for (const day of days) {
    try {
      const count = await kv.get<number>(`metric:login:${day}`);
      if (typeof count === "number") loginsTotal += count;
      const members = await kv.smembers(`metric:active:${day}`);
      members.forEach((m) => activeSet.add(m));
    } catch (err) {
      console.error(`[logs] metric read ${day} failed:`, err);
    }
  }
  return { loginsTotal, activeCustomers: activeSet.size };
}
