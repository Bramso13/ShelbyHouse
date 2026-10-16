"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { failed, requireUser, type ActionResult } from "@/lib/action";
import { gradeAttempt, nextRating, streakFromDates } from "@/lib/chess";
import { todayISO } from "@/lib/dates";

export type AttemptResult =
  | { ok: true; rating: number; correct: boolean; streak: number }
  | { ok: false; message: string };

export async function setInitialRating(rating: number): Promise<ActionResult> {
  const parsed = z.number().int().min(400).max(2800).safeParse(rating);
  if (!parsed.success) return failed("Choisis un rating entre 400 et 2800.");
  const ctx = await requireUser();
  if (!ctx) return failed("Session expirée. Reconnecte-toi.");
  const { data, error } = await ctx.supabase
    .from("profiles")
    .update({ chess_rating: parsed.data })
    .eq("id", ctx.user.id)
    .is("chess_rating", null)
    .select("id");
  if (error) return failed("Enregistrement impossible. Réessaie.");
  if (!data?.length) return failed("Le rating de départ est déjà choisi.");
  revalidatePath("/echecs");
  return { ok: true };
}

export async function submitAttempt(input: unknown): Promise<AttemptResult> {
  const parsed = z
    .object({ puzzleId: z.string().min(1).max(16), played: z.array(z.string().min(4).max(5)).max(12) })
    .safeParse(input);
  if (!parsed.success) return failed("Enregistrement impossible. Réessaie.");
  const ctx = await requireUser();
  if (!ctx) return failed("Session expirée. Reconnecte-toi.");

  const [{ data: profile }, { data: puzzle }] = await Promise.all([
    ctx.supabase.from("profiles").select("chess_rating").eq("id", ctx.user.id).single(),
    ctx.supabase.from("puzzles").select("id, moves, rating, themes").eq("id", parsed.data.puzzleId).maybeSingle(),
  ]);

  if (!profile?.chess_rating || !puzzle) return failed("Cet élément n'existe plus.");
  const correct = gradeAttempt(puzzle.moves, parsed.data.played);
  const rating = nextRating(profile.chess_rating, puzzle.rating, correct);
  const today = todayISO();

  const { data: attempt, error } = await ctx.supabase
    .from("puzzle_attempts")
    .insert({
      user_id: ctx.user.id,
      puzzle_id: puzzle.id,
      rating_before: profile.chess_rating,
      rating_after: rating,
      puzzle_rating: puzzle.rating,
      themes: puzzle.themes ?? [],
      correct,
    })
    .select("id")
    .single();
  if (error || !attempt) return failed("Enregistrement impossible. Réessaie.");

  const { error: ratingError } = await ctx.supabase
    .from("profiles")
    .update({ chess_rating: rating })
    .eq("id", ctx.user.id);
  if (ratingError) {
    await ctx.supabase.from("puzzle_attempts").delete().eq("id", attempt.id);
    return failed("Enregistrement impossible. Réessaie.");
  }

  if (correct) {
    const { data: habit } = await ctx.supabase
      .from("habits")
      .select("id")
      .eq("user_id", ctx.user.id)
      .eq("slug", "chess")
      .is("archived_at", null)
      .maybeSingle();
    if (habit) {
      await ctx.supabase.from("habit_logs").upsert(
        { habit_id: habit.id, user_id: ctx.user.id, log_date: today, done: true },
        { onConflict: "habit_id,log_date" },
      );
    }
  }

  const { data: successes } = await ctx.supabase
    .from("puzzle_attempts")
    .select("played_at")
    .eq("user_id", ctx.user.id)
    .eq("correct", true)
    .order("played_at", { ascending: false })
    .limit(400);
  const dates = (successes ?? []).map((row) => todayISO(new Date(row.played_at)));
  revalidatePath("/echecs");
  revalidatePath("/vie");
  return { ok: true, rating, correct, streak: streakFromDates(dates, today) };
}
