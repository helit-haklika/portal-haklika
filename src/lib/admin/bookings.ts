// Server-only admin queries against Supabase, split by domain.
// Unlike src/lib/supabase/queries.ts (portal-facing, accepts legacy airtable_id),
// admin queries work directly with Supabase UUIDs and return raw rows for tables.

import "server-only";
import { selectMany } from "@/lib/supabase/client";

// ===== Customer's bookings =====
export interface BookingListRow {
  id: string;
  date: string | null;
  start_at: string | null;
  end_at: string | null;
  duration_hours: number | null;
  booking_title: string | null;
  status: string | null;
  source: string | null;
  room_id: string | null;
}

interface RoomNameRow {
  id: string;
  name: string;
}

export async function getCustomerBookings(
  customerId: string,
  limit = 200,
): Promise<(BookingListRow & { room_name: string | null })[]> {
  const rows = await selectMany<BookingListRow>(
    "bookings",
    `select=id,date,start_at,end_at,duration_hours,booking_title,status,source,room_id&customer_id=eq.${encodeURIComponent(customerId)}&order=date.desc.nullslast&limit=${limit}`,
  );
  const roomIds = Array.from(
    new Set(rows.map((r) => r.room_id).filter((x): x is string => !!x)),
  );
  const roomMap = new Map<string, string>();
  if (roomIds.length) {
    const rooms = await selectMany<RoomNameRow>(
      "rooms",
      `select=id,name&id=in.(${roomIds.join(",")})`,
    );
    rooms.forEach((r) => roomMap.set(r.id, r.name));
  }
  return rows.map((r) => ({
    ...r,
    room_name: r.room_id ? (roomMap.get(r.room_id) ?? null) : null,
  }));
}

// ===== Global bookings list =====
export interface GlobalBookingRow {
  id: string;
  customer_id: string | null;
  room_id: string | null;
  date: string | null;
  start_at: string | null;
  end_at: string | null;
  duration_hours: number | null;
  booking_title: string | null;
  status: string | null;
  source: string | null;
}

export interface GlobalBookingFilters {
  bookingTitle?: string;
  from?: string;
  to?: string;
  roomId?: string;
  limit?: number;
}

export async function listBookings(filters: GlobalBookingFilters = {}): Promise<
  (GlobalBookingRow & {
    customer_name: string | null;
    room_name: string | null;
  })[]
> {
  const params: string[] = [
    "select=id,customer_id,room_id,date,start_at,end_at,duration_hours,booking_title,status,source",
    "order=date.desc.nullslast,start_at.desc.nullslast",
    `limit=${filters.limit ?? 200}`,
  ];
  if (filters.bookingTitle)
    params.push(`booking_title=eq.${encodeURIComponent(filters.bookingTitle)}`);
  if (filters.from) params.push(`date=gte.${filters.from}`);
  if (filters.to) params.push(`date=lte.${filters.to}`);
  if (filters.roomId) params.push(`room_id=eq.${encodeURIComponent(filters.roomId)}`);

  const rows = await selectMany<GlobalBookingRow>("bookings", params.join("&"));

  const customerIds = Array.from(
    new Set(rows.map((r) => r.customer_id).filter((x): x is string => !!x)),
  );
  const roomIds = Array.from(
    new Set(rows.map((r) => r.room_id).filter((x): x is string => !!x)),
  );

  const [customers, rooms] = await Promise.all([
    customerIds.length
      ? selectMany<{
          id: string;
          first_name: string | null;
          last_name: string | null;
        }>(
          "customers",
          `select=id,first_name,last_name&id=in.(${customerIds.join(",")})`,
        )
      : Promise.resolve([]),
    roomIds.length
      ? selectMany<{ id: string; name: string }>(
          "rooms",
          `select=id,name&id=in.(${roomIds.join(",")})`,
        )
      : Promise.resolve([]),
  ]);

  const customerNames = new Map(
    customers.map((c) => [
      c.id,
      [c.first_name, c.last_name].filter(Boolean).join(" ").trim() ||
        "(ללא שם)",
    ]),
  );
  const roomNames = new Map(rooms.map((r) => [r.id, r.name]));

  return rows.map((r) => ({
    ...r,
    customer_name: r.customer_id
      ? (customerNames.get(r.customer_id) ?? null)
      : null,
    room_name: r.room_id ? (roomNames.get(r.room_id) ?? null) : null,
  }));
}

export async function listRooms(): Promise<{ id: string; name: string }[]> {
  return selectMany<{ id: string; name: string }>(
    "rooms",
    "select=id,name&order=name.asc",
  );
}

// ===== Calendar bookings (range query) =====
export interface CalendarBooking {
  id: string;
  customer_id: string | null;
  room_id: string | null;
  date: string | null;
  start_at: string | null;
  end_at: string | null;
  duration_hours: number | null;
  booking_title: string | null;
  status: string | null;
}

export async function listBookingsForRange(
  fromIso: string,
  toIso: string,
): Promise<
  (CalendarBooking & {
    customer_name: string | null;
    room_name: string | null;
  })[]
> {
  const rows = await selectMany<CalendarBooking>(
    "bookings",
    `select=id,customer_id,room_id,date,start_at,end_at,duration_hours,booking_title,status&date=gte.${fromIso}&date=lt.${toIso}&order=start_at.asc&limit=2000`,
  );
  const customerIds = Array.from(
    new Set(rows.map((r) => r.customer_id).filter((x): x is string => !!x)),
  );
  const roomIds = Array.from(
    new Set(rows.map((r) => r.room_id).filter((x): x is string => !!x)),
  );
  const [customers, rooms] = await Promise.all([
    customerIds.length
      ? selectMany<{
          id: string;
          first_name: string | null;
          last_name: string | null;
        }>(
          "customers",
          `select=id,first_name,last_name&id=in.(${customerIds.join(",")})`,
        )
      : Promise.resolve([]),
    roomIds.length
      ? selectMany<{ id: string; name: string }>(
          "rooms",
          `select=id,name&id=in.(${roomIds.join(",")})`,
        )
      : Promise.resolve([]),
  ]);
  const customerNames = new Map(
    customers.map((c) => [
      c.id,
      [c.first_name, c.last_name].filter(Boolean).join(" ").trim() ||
        "(ללא שם)",
    ]),
  );
  const roomNames = new Map(rooms.map((r) => [r.id, r.name]));
  return rows.map((r) => ({
    ...r,
    customer_name: r.customer_id
      ? (customerNames.get(r.customer_id) ?? null)
      : null,
    room_name: r.room_id ? (roomNames.get(r.room_id) ?? null) : null,
  }));
}
