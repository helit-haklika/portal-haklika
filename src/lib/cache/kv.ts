import { Redis } from "@upstash/redis";

export const kv = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

export async function getCachedDashboard(customerId: string) {
  return kv.get<string>(`customer:${customerId}:data`);
}

export async function setCachedDashboard(customerId: string, data: unknown) {
  await kv.set(`customer:${customerId}:data`, JSON.stringify(data), { ex: 60 });
}
