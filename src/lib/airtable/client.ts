import type { AirtableRecord } from "./types";

const BASE_URL = "https://api.airtable.com/v0";

function getHeaders(): HeadersInit {
  const pat = process.env.AIRTABLE_PAT;
  if (!pat) throw new Error("AIRTABLE_PAT not configured");
  return {
    Authorization: `Bearer ${pat}`,
    "Content-Type": "application/json",
  };
}

interface ListParams {
  filterByFormula?: string;
  fields?: string[];
  sort?: Array<{ field: string; direction: "asc" | "desc" }>;
  maxRecords?: number;
}

export async function listRecords<T>(
  tableId: string,
  params: ListParams = {},
): Promise<AirtableRecord<T>[]> {
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (!baseId) throw new Error("AIRTABLE_BASE_ID not configured");

  const url = new URL(`${BASE_URL}/${baseId}/${tableId}`);

  if (params.filterByFormula) {
    url.searchParams.set("filterByFormula", params.filterByFormula);
  }
  if (params.fields) {
    params.fields.forEach((f) => url.searchParams.append("fields[]", f));
  }
  if (params.sort) {
    params.sort.forEach((s, i) => {
      url.searchParams.set(`sort[${i}][field]`, s.field);
      url.searchParams.set(`sort[${i}][direction]`, s.direction);
    });
  }
  if (params.maxRecords) {
    url.searchParams.set("maxRecords", String(params.maxRecords));
  }

  const all: AirtableRecord<T>[] = [];
  let offset: string | undefined;

  do {
    if (offset) url.searchParams.set("offset", offset);
    else url.searchParams.delete("offset");

    const res = await fetch(url.toString(), {
      headers: getHeaders(),
      next: { revalidate: 0 },
    });

    if (res.status === 429) {
      await new Promise((r) => setTimeout(r, 1000));
      continue;
    }

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Airtable error ${res.status}: ${err}`);
    }

    const json = await res.json();
    all.push(...(json.records ?? []));
    offset = json.offset;
  } while (offset);

  return all;
}

export async function getRecord<T>(
  tableId: string,
  recordId: string,
): Promise<AirtableRecord<T> | null> {
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (!baseId) throw new Error("AIRTABLE_BASE_ID not configured");

  const res = await fetch(`${BASE_URL}/${baseId}/${tableId}/${recordId}`, {
    headers: getHeaders(),
    next: { revalidate: 0 },
  });

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Airtable error ${res.status}`);

  return res.json();
}
