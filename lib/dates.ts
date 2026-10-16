export const TIME_ZONE = "Europe/Paris";

export const WEEKDAYS = ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"] as const;

export function isIsoDate(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function addDays(iso: string, days: number): string {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

export function weekdayMon0(iso: string): number {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (date.getUTCDay() + 6) % 7;
}

export function weekDates(iso: string): string[] {
  const monday = addDays(iso, -weekdayMon0(iso));
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}

type ZonedParts = {
  year: string;
  month: string;
  day: string;
  hour: number;
  minute: number;
};

export function zonedParts(date: Date, timeZone = TIME_ZONE): ZonedParts {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );
  let hour = Number(parts.hour);
  if (hour === 24) hour = 0;
  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour,
    minute: Number(parts.minute),
  };
}

export function todayISO(now = new Date(), timeZone = TIME_ZONE): string {
  const parts = zonedParts(now, timeZone);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function minutesNow(now = new Date(), timeZone = TIME_ZONE): number {
  const parts = zonedParts(now, timeZone);
  return parts.hour * 60 + parts.minute;
}

export function formatLongDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(date);
}

export function formatMinute(minutes: number): string {
  const clamped = Math.min(Math.max(minutes, 0), 1440);
  if (clamped === 1440) return "00:00";
  const hour = Math.floor(clamped / 60);
  const minute = clamped % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function parseTime(value: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return hour * 60 + minute;
}

export function resolveRange(start: number, end: number): { start: number; end: number } | null {
  const resolvedEnd = end === 0 && start > 0 ? 1440 : end;
  if (resolvedEnd <= start || resolvedEnd > 1440) return null;
  return { start, end: resolvedEnd };
}

export function safeNext(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return "/jour";
  }
  return value;
}
