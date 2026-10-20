export const HOURLY_RATE = 100;
export const EXTRA_PERSON_RATE = 100;
const MINUTES_PER_HOUR = 60;

export interface SessionCharges {
  elapsedMinutes: number;
  hoursBilled: number;
  roomCharge: number;
  extraPersons: number;
  extraPersonCharge: number;
}

function parseBookingDate(value: string | null | undefined): number | null {
  if (!value) return null;

  const parsed = Date.parse(
    value.includes("T") ? value : value.replace(" ", "T"),
  );
  return Number.isNaN(parsed) ? null : parsed;
}

export function sessionCharges(
  booking: {
    start_at?: string | null;
    head_count?: number | null;
    total_head_count?: number | null;
    extra_head_count?: number | null;
  },
  now: number = Date.now(),
  endAt?: string | number | null,
): SessionCharges {
  const startMs = parseBookingDate(booking.start_at);
  const endMs =
    endAt == null
      ? now
      : typeof endAt === "number"
        ? endAt
        : (parseBookingDate(endAt) ?? now);

  const elapsedMinutes =
    startMs == null ? 0 : Math.max(0, Math.round((endMs - startMs) / 60000));

  const hoursBilled = elapsedMinutes / MINUTES_PER_HOUR;
  const roomCharge = Math.round(hoursBilled * HOURLY_RATE);

  const booked = booking.head_count ?? 0;
  const extra =
    booking.extra_head_count ??
    Math.max(0, (booking.total_head_count ?? booked) - booked);

  const extraPersons = Math.max(0, extra);
  const extraPersonCharge = extraPersons * EXTRA_PERSON_RATE;

  return {
    elapsedMinutes,
    hoursBilled,
    roomCharge,
    extraPersons,
    extraPersonCharge,
  };
}

export function sessionTotal(c: SessionCharges): number {
  return c.roomCharge + c.extraPersonCharge;
}

export function formatElapsed(minutes: number): string {
  if (minutes <= 0) return "0m";
  const h = Math.floor(minutes / MINUTES_PER_HOUR);
  const m = minutes % MINUTES_PER_HOUR;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
