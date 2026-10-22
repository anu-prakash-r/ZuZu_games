export const HOURLY_RATE = 100;
export const PER_HEAD_RATE_SHORT = 50;
export const PER_HEAD_RATE_LONG = 100;
export const FOOD_RATE_PER_HEAD = 0;
export const EXTRA_PERSON_RATE = 100;
const MINUTES_PER_HOUR = 60;

export interface SessionCharges {
  elapsedMinutes: number;
  hoursBilled: number;
  roomCharge: number;
  extraPersons: number;
  extraPersonCharge: number;
  existingPersonCharge: number;
  foodCharge: number;
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

  const existingHeads = booking.head_count ?? 0;
  const extraPersons =
    booking.extra_head_count ??
    Math.max(0, (booking.total_head_count ?? existingHeads) - existingHeads);

  const perHeadRate =
    elapsedMinutes <= 30 ? PER_HEAD_RATE_SHORT : PER_HEAD_RATE_LONG;

  const existingPersonCharge = existingHeads * perHeadRate;
  const extraPersonCharge = extraPersons * perHeadRate;

  const totalHeads = existingHeads + extraPersons;
  const foodCharge = totalHeads * FOOD_RATE_PER_HEAD;

  const roomCharge = existingPersonCharge + extraPersonCharge;

  return {
    elapsedMinutes,
    hoursBilled,
    roomCharge,
    extraPersons,
    extraPersonCharge,
    existingPersonCharge,
    foodCharge,
  };
}

export function sessionTotal(c: SessionCharges): number {
  return c.roomCharge + c.foodCharge;
}

export function formatElapsed(minutes: number): string {
  if (minutes <= 0) return "0m";
  const h = Math.floor(minutes / MINUTES_PER_HOUR);
  const m = minutes % MINUTES_PER_HOUR;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
