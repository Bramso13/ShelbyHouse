import assert from "node:assert/strict";
import test from "node:test";
import { layoutBlocks, materializeDay, type ScheduleRule } from "./schedule.ts";

const rule: ScheduleRule = {
  id: "rule-1",
  weekday: 0,
  title: "Stand-up",
  start_minute: 9 * 60,
  end_minute: 9 * 60 + 30,
  block_type: "work",
  custom_label: null,
};

test("a weekly rule shows on its weekday and stays hidden on the others", () => {
  const monday = materializeDay(0, [rule], [], []);
  const tuesday = materializeDay(1, [rule], [], []);
  assert.equal(monday.length, 1);
  assert.equal(monday[0]?.origin, "rule");
  assert.equal(tuesday.length, 0);
});

test("a cancelled exception hides that occurrence", () => {
  const blocks = materializeDay(
    0,
    [rule],
    [
      {
        id: "ex-1",
        rule_id: rule.id,
        occurrence_date: "2026-10-12",
        cancelled: true,
        title: null,
        start_minute: null,
        end_minute: null,
        block_type: null,
        custom_label: null,
      },
    ],
    [],
  );
  assert.equal(blocks.length, 0);
});

test("a modified exception replaces the weekly times for that day", () => {
  const blocks = materializeDay(
    0,
    [rule],
    [
      {
        id: "ex-2",
        rule_id: rule.id,
        occurrence_date: "2026-10-12",
        cancelled: false,
        title: "Stand-up",
        start_minute: 10 * 60,
        end_minute: 10 * 60 + 30,
        block_type: "work",
        custom_label: null,
      },
    ],
    [],
  );
  assert.equal(blocks[0]?.startMinute, 10 * 60);
  assert.equal(blocks[0]?.origin, "exception");
  assert.equal(blocks[0]?.ruleId, rule.id);
});

test("one-off blocks sit beside overlapping weekly blocks", () => {
  const blocks = materializeDay(0, [rule], [], [
    {
      id: "once-1",
      title: "Dentiste",
      start_minute: 9 * 60,
      end_minute: 10 * 60,
      block_type: "personal",
      custom_label: null,
    },
  ]);
  const laid = layoutBlocks(blocks);
  assert.equal(laid.length, 2);
  assert.equal(laid.every((block) => block.columns === 2), true);
  assert.equal(new Set(laid.map((block) => block.column)).size, 2);
});
