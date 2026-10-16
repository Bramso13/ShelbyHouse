import assert from "node:assert/strict";
import test from "node:test";
import { accuracy, expectedUserMoves, gradeAttempt, nextRating, streakFromDates } from "./chess.ts";

test("equal ratings move by about ten points", () => {
  assert.equal(nextRating(1500, 1500, true), 1510);
  assert.equal(nextRating(1500, 1500, false), 1490);
});

test("rating stays inside the published bounds", () => {
  assert.equal(nextRating(400, 2200, false), 400);
  assert.equal(nextRating(2800, 800, true), 2800);
});

test("the first move belongs to the opponent and the rest alternate", () => {
  assert.deepEqual(expectedUserMoves("f1g1 h3f2"), ["h3f2"]);
  assert.equal(gradeAttempt("f1g1 h3f2", ["h3f2"]), true);
  assert.equal(gradeAttempt("f1g1 h3f2", ["a2a4"]), false);
});

test("a multi-move line is correct only when every user move matches", () => {
  const line = "e2e4 e7e5 g1f3 b8c6";
  assert.equal(gradeAttempt(line, ["e7e5", "b8c6"]), true);
  assert.equal(gradeAttempt(line, ["e7e5"]), false);
});

test("the streak includes yesterday and resets after a missed day", () => {
  assert.equal(streakFromDates(["2026-10-15"], "2026-10-16"), 1);
  assert.equal(streakFromDates(["2026-10-15", "2026-10-16"], "2026-10-16"), 2);
  assert.equal(streakFromDates(["2026-10-14"], "2026-10-16"), 0);
  assert.equal(streakFromDates([], "2026-10-16"), 0);
});

test("accuracy is the share of correct attempts", () => {
  assert.equal(accuracy([{ correct: true }, { correct: false }, { correct: true }, { correct: true }]), 75);
  assert.equal(accuracy([]), null);
});
