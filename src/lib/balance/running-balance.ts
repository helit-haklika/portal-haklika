import type { Booking, PunchCardPayment } from "@/types";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function computeRunningBalances(
  bookings: Booking[],
  purchases: PunchCardPayment[],
  currentBalance: number,
): { bookings: Booking[]; purchases: PunchCardPayment[] } {
  type Event =
    | { kind: "booking"; index: number; isoDate: string; delta: number }
    | { kind: "purchase"; index: number; isoDate: string; delta: number };

  const events: Event[] = [
    ...bookings.map((b, index) => ({
      kind: "booking" as const,
      index,
      isoDate: b.isoDate,
      delta: -Math.abs(b.durationHours),
    })),
    ...purchases.map((p, index) => ({
      kind: "purchase" as const,
      index,
      isoDate: p.isoDate,
      delta: p.hours,
    })),
  ];

  events.sort((a, b) =>
    a.isoDate < b.isoDate ? 1 : a.isoDate > b.isoDate ? -1 : 0,
  );

  const bookingBalances = new Array<number>(bookings.length).fill(0);
  const purchaseBalances = new Array<number>(purchases.length).fill(0);

  let running = currentBalance;
  for (const ev of events) {
    const balanceAfter = round2(running);
    if (ev.kind === "booking") {
      bookingBalances[ev.index] = balanceAfter;
    } else {
      purchaseBalances[ev.index] = balanceAfter;
    }
    running = round2(running - ev.delta);
  }

  return {
    bookings: bookings.map((b, i) => ({
      ...b,
      balanceAfter: bookingBalances[i],
    })),
    purchases: purchases.map((p, i) => ({
      ...p,
      balanceAfter: purchaseBalances[i],
    })),
  };
}
