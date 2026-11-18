export const HOURLY_RATE = 100;
export const PER_HEAD_RATE_SHORT = 50;
export const PER_HEAD_RATE_LONG = 100;
export const FOOD_RATE_PER_HEAD = 0;
export const EXTRA_PERSON_RATE = 100;
const MINUTES_PER_HOUR = 60;

const EXTRA_START_KEYS = [
  "start_at",
  "joined_at",
  "added_at",
  "started_at",
  "entry_time",
  "in_time",
  "created_at",
  "startAt",
  "joinedAt",
  "addedAt",
  "startedAt",
  "createdAt",
];

const EXTRA_END_KEYS = [
  "end_at",
  "left_at",
  "ended_at",
  "endAt",
  "leftAt",
  "endedAt",
];

export interface SessionCharges {
  elapsedMinutes: number;
  hoursBilled: number;
  perHeadRate: number;
  existingPersons: number;
  extraPersons: number;
  extraPersonMinutes: number[];
  roomCharge: number;
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

function parseDateValue(value: unknown): number | null {
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value <= 0) return null;
    return value < 1e11 ? value * 1000 : value;
  }
  if (typeof value !== "string") return null;
  return parseBookingDate(value);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

function timeFromRecord(
  record: Record<string, unknown>,
  keys: string[],
): number | null {
  for (const key of keys) {
    const time = parseDateValue(record[key]);
    if (time != null) return time;
  }
  const pivot = asRecord(record.pivot);
  if (pivot) {
    for (const key of keys) {
      const time = parseDateValue(pivot[key]);
      if (time != null) return time;
    }
  }
  return null;
}

function startTimeFromEntry(entry: unknown): number | null {
  if (typeof entry === "string" || typeof entry === "number") {
    return parseDateValue(entry);
  }
  const record = asRecord(entry);
  return record ? timeFromRecord(record, EXTRA_START_KEYS) : null;
}

function endTimeFromEntry(entry: unknown): number | null {
  const record = asRecord(entry);
  return record ? timeFromRecord(record, EXTRA_END_KEYS) : null;
}

function countFromEntry(entry: unknown): number {
  const record = asRecord(entry);
  if (!record) return 1;
  for (const key of [
    "extra_persons",
    "count",
    "qty",
    "persons",
    "head_count",
    "number",
  ]) {
    const value = Number(record[key]);
    if (Number.isFinite(value) && value > 0) return Math.floor(value);
  }
  return 1;
}

function rateForMinutes(minutes: number): number {
  return minutes <= 30 ? PER_HEAD_RATE_SHORT : PER_HEAD_RATE_LONG;
}

export interface SessionBooking {
  start_at?: string | null;
  head_count?: number | null;
  total_head_count?: number | null;
  extra_head_count?: number | null;
  extra_persons?: unknown[] | null;
  extra_person_minutes?: number | null;
  extra_minutes?: number | null;
  extra_time?: number | null;
}

function extraPersonMinutesFromApi(
  booking: SessionBooking,
  extraPersons: number,
  elapsedMinutes: number,
  endMs: number,
): number[] {
  if (extraPersons <= 0) return [];

  const record = booking as Record<string, unknown>;
  for (const key of ["extra_person_minutes", "extra_minutes", "extra_time"]) {
    const value = Number(record[key]);
    if (Number.isFinite(value) && value >= 0) {
      const minutes = Math.round(value);
      return Array.from({ length: extraPersons }, () =>
        Math.min(minutes, elapsedMinutes),
      );
    }
  }

  const entries = Array.isArray(booking.extra_persons)
    ? booking.extra_persons
    : [];
  const minutes: number[] = [];

  for (const entry of entries) {
    const joinedMs = startTimeFromEntry(entry);
    const entryEndMs = endTimeFromEntry(entry) ?? endMs;
    const value =
      joinedMs == null
        ? elapsedMinutes
        : Math.max(
            0,
            Math.min(
              elapsedMinutes,
              Math.round((entryEndMs - joinedMs) / 60000),
            ),
          );
    for (let i = 0; i < countFromEntry(entry) && minutes.length < extraPersons; i++) {
      minutes.push(value);
    }
  }

  while (minutes.length < extraPersons) minutes.push(elapsedMinutes);
  return minutes;
}

export function sessionChargesForBooking(
  booking: SessionBooking,
): SessionCharges {
  return sessionCharges(booking);
}

export function sessionCharges(
  booking: SessionBooking,
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

  const perHeadRate = rateForMinutes(elapsedMinutes);
  const extraPersonMinutes = extraPersonMinutesFromApi(
    booking,
    extraPersons,
    elapsedMinutes,
    endMs,
  );

  const existingPersonCharge = existingHeads * perHeadRate;
  const extraPersonCharge = extraPersonMinutes.reduce(
    (sum, minutes) => sum + rateForMinutes(minutes),
    0,
  );

  const totalHeads = existingHeads + extraPersons;
  const foodCharge = totalHeads * FOOD_RATE_PER_HEAD;

  const roomCharge = existingPersonCharge + extraPersonCharge;

  return {
    elapsedMinutes,
    hoursBilled,
    perHeadRate,
    existingPersons: existingHeads,
    extraPersons,
    extraPersonMinutes,
    roomCharge,
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
