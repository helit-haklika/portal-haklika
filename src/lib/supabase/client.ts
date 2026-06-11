import { logError } from "@/lib/logs";

const REST_PATH = "/rest/v1";

function getConfig(): { url: string; key: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL not configured");
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY not configured");
  return { url, key };
}

function headers(): HeadersInit {
  const { key } = getConfig();
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

export async function selectOne<T>(
  table: string,
  query: string,
): Promise<T | null> {
  const { url } = getConfig();
  const fullUrl = `${url}${REST_PATH}/${table}?${query}&limit=1`;
  const res = await fetch(fullUrl, {
    headers: headers(),
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    await logError("supabase", new Error(`Supabase ${res.status}: ${body}`), {
      table,
      query,
    });
    throw new Error(`Supabase error ${res.status}`);
  }
  const rows = (await res.json()) as T[];
  return rows[0] ?? null;
}

export async function selectMany<T>(
  table: string,
  query: string,
): Promise<T[]> {
  const { url } = getConfig();
  const fullUrl = `${url}${REST_PATH}/${table}?${query}`;
  const res = await fetch(fullUrl, {
    headers: headers(),
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    await logError("supabase", new Error(`Supabase ${res.status}: ${body}`), {
      table,
      query,
    });
    throw new Error(`Supabase error ${res.status}`);
  }
  return (await res.json()) as T[];
}
