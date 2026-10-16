import assert from "node:assert/strict";
import test from "node:test";
import {
  addDays,
  isIsoDate,
  minutesNow,
  resolveRange,
  safeNext,
  todayISO,
  weekdayMon0,
  weekDates,
} from "./dates.ts";

test("rejects impossible calendar dates", () => {
  assert.equal(isIsoDate("2026-02-31"), false);
  assert.equal(isIsoDate("2026-10-16"), true);
});

test("16 October 2026 is a Friday and the week starts Monday", () => {
  assert.equal(weekdayMon0("2026-10-16"), 4);
  assert.deepEqual(weekDates("2026-10-16")[0], "2026-10-12");
  assert.deepEqual(weekDates("2026-10-16")[6], "2026-10-18");
});

test("date math stays on the calendar across month ends", () => {
  assert.equal(addDays("2026-10-31", 1), "2026-11-01");
});

test("Paris date rolls after 22:00 UTC in October", () => {
  const late = new Date("2026-10-16T22:30:00.000Z");
  const early = new Date("2026-10-16T21:30:00.000Z");
  assert.equal(todayISO(late), "2026-10-17");
  assert.equal(todayISO(early), "2026-10-16");
  assert.equal(minutesNow(early), 23 * 60 + 30);
});

test("midnight end is 24:00 when the block does not start at midnight", () => {
  assert.deepEqual(resolveRange(23 * 60, 0), { start: 23 * 60, end: 1440 });
  assert.equal(resolveRange(10 * 60, 9 * 60), null);
});

test("next path stays inside the app", () => {
  assert.equal(safeNext("/planning?date=2026-10-16"), "/planning?date=2026-10-16");
  assert.equal(safeNext("https://example.com"), "/jour");
  assert.equal(safeNext("//example.com"), "/jour");
});
