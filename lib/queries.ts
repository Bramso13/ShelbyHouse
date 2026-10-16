import { addDays, todayISO, weekdayMon0 } from "@/lib/dates";
import { accuracy, streakFromDates } from "@/lib/chess";
import {
  materializeDay,
  type BlockView,
  type ScheduleException,
  type ScheduleOneOff,
  type ScheduleRule,
} from "@/lib/schedule";
import { requireUser } from "@/lib/action";
import type { Intensity } from "@/lib/schedule";

export async function loadDayBlocks(date: string): Promise<BlockView[]> {
  const ctx = await requireUser();
  if (!ctx) return [];
  const weekday = weekdayMon0(date);
  const [{ data: rules }, { data: exceptions }, { data: oneOffs }] = await Promise.all([
    ctx.supabase
      .from("schedule_rules")
      .select("id, weekday, title, start_minute, end_minute, block_type, custom_label")
      .eq("user_id", ctx.user.id)
      .eq("weekday", weekday),
    ctx.supabase
      .from("schedule_exceptions")
      .select("id, rule_id, occurrence_date, cancelled, title, start_minute, end_minute, block_type, custom_label")
      .eq("user_id", ctx.user.id)
      .eq("occurrence_date", date),
    ctx.supabase
      .from("schedule_one_offs")
      .select("id, title, start_minute, end_minute, block_type, custom_label")
      .eq("user_id", ctx.user.id)
      .eq("occurrence_date", date),
  ]);

  return materializeDay(
    weekday,
    (rules ?? []) as ScheduleRule[],
    (exceptions ?? []) as ScheduleException[],
    (oneOffs ?? []) as ScheduleOneOff[],
  );
}

export type TaskItem = {
  id: string;
  title: string;
  scheduled_date: string | null;
  completed_at: string | null;
};

export async function loadTasks(today: string) {
  const ctx = await requireUser();
  if (!ctx) return { today: [], overdue: [], backlog: [] };
  const { data, error } = await ctx.supabase
    .from("tasks")
    .select("id, title, scheduled_date, completed_at, created_at")
    .eq("user_id", ctx.user.id)
    .order("created_at", { ascending: true });
  if (error) throw error;
  const rows = (data ?? []) as TaskItem[];
  return {
    today: rows.filter((task) => task.scheduled_date === today),
    overdue: rows.filter((task) => task.scheduled_date && task.scheduled_date < today && !task.completed_at),
    backlog: rows.filter((task) => !task.scheduled_date && !task.completed_at),
  };
}

export type SportType = { id: string; name: string };
export type SportSession = {
  id: string;
  session_date: string;
  duration_min: number;
  intensity: Intensity;
  name: string;
};
export type Habit = { id: string; name: string; slug: string | null };
export type HabitLog = { habit_id: string; log_date: string; done: boolean };
export type MetricDefinition = { id: string; name: string; unit: string };
export type MetricEntry = { definition_id: string; entry_date: string; value: number };
export type WeightEntry = { entry_date: string; kg: number };
export type SleepEntry = { wake_date: string; hours: number; quality: number };

export async function loadLife(today: string) {
  const ctx = await requireUser();
  if (!ctx) return null;
  const from = addDays(today, -29);
  const userId = ctx.user.id;
  const [types, sessions, weights, sleeps, habits, logs, metrics, entries] = await Promise.all([
    ctx.supabase.from("sport_types").select("id, name").eq("user_id", userId).order("name"),
    ctx.supabase
      .from("sport_sessions")
      .select("id, session_date, duration_min, intensity, sport_type_id")
      .eq("user_id", userId)
      .gte("session_date", from)
      .order("session_date", { ascending: false }),
    ctx.supabase
      .from("weight_entries")
      .select("entry_date, kg")
      .eq("user_id", userId)
      .gte("entry_date", from)
      .order("entry_date"),
    ctx.supabase
      .from("sleep_logs")
      .select("wake_date, hours, quality")
      .eq("user_id", userId)
      .gte("wake_date", from)
      .order("wake_date"),
    ctx.supabase
      .from("habits")
      .select("id, name, slug")
      .eq("user_id", userId)
      .is("archived_at", null)
      .order("created_at"),
    ctx.supabase
      .from("habit_logs")
      .select("habit_id, log_date, done")
      .eq("user_id", userId)
      .gte("log_date", from),
    ctx.supabase.from("metric_definitions").select("id, name, unit").eq("user_id", userId).order("created_at"),
    ctx.supabase
      .from("metric_entries")
      .select("definition_id, entry_date, value")
      .eq("user_id", userId)
      .gte("entry_date", from)
      .order("entry_date"),
  ]);

  for (const result of [types, sessions, weights, sleeps, habits, logs, metrics, entries]) {
    if (result.error) throw result.error;
  }

  const typeNames = new Map(((types.data ?? []) as SportType[]).map((type) => [type.id, type.name]));
  return {
    types: (types.data ?? []) as SportType[],
    sessions: ((sessions.data ?? []) as {
      id: string;
      session_date: string;
      duration_min: number;
      intensity: Intensity;
      sport_type_id: string;
    }[]).map((session) => ({
      id: session.id,
      session_date: session.session_date,
      duration_min: session.duration_min,
      intensity: session.intensity,
      name: typeNames.get(session.sport_type_id) ?? "Sport",
    })),
    weights: (weights.data ?? []) as WeightEntry[],
    sleeps: (sleeps.data ?? []) as SleepEntry[],
    habits: (habits.data ?? []) as Habit[],
    logs: (logs.data ?? []) as HabitLog[],
    metrics: (metrics.data ?? []) as MetricDefinition[],
    entries: (entries.data ?? []) as MetricEntry[],
  };
}

export type PuzzleCard = {
  id: string;
  fen: string;
  moves: string;
  rating: number;
  themes: string[];
};

export async function loadChess(today: string) {
  const ctx = await requireUser();
  if (!ctx) return null;
  const { data: profile, error } = await ctx.supabase
    .from("profiles")
    .select("chess_rating")
    .eq("id", ctx.user.id)
    .single();
  if (error) throw error;
  const rating = profile.chess_rating as number | null;
  const { data: attempts, error: attemptError } = await ctx.supabase
    .from("puzzle_attempts")
    .select("puzzle_id, played_at, correct, themes, rating_after, puzzle_rating")
    .eq("user_id", ctx.user.id)
    .order("played_at", { ascending: false })
    .limit(2000);
  if (attemptError) throw attemptError;
  const rows = attempts ?? [];
  const successDates = rows.filter((row) => row.correct).map((row) => todayISO(new Date(row.played_at)));
  const weekStart = addDays(today, -6);
  const week = rows.filter((row) => todayISO(new Date(row.played_at)) >= weekStart);
  const themeMap = new Map<string, { played: number; correct: number }>();
  for (const row of rows) {
    for (const theme of (row.themes as string[] | null) ?? []) {
      const current = themeMap.get(theme) ?? { played: 0, correct: 0 };
      current.played += 1;
      if (row.correct) current.correct += 1;
      themeMap.set(theme, current);
    }
  }

  let puzzle: PuzzleCard | null = null;
  if (rating) {
    const exclude = rows.slice(0, 50).map((row) => row.puzzle_id as string);
    const { data, error: puzzleError } = await ctx.supabase.rpc("next_puzzle", {
      target_rating: rating,
      exclude,
    });
    if (puzzleError) throw puzzleError;
    const first = ((data ?? []) as PuzzleCard[])[0];
    puzzle = first ?? null;
  }

  return {
    rating,
    puzzle,
    streak: streakFromDates(successDates, today),
    weekAccuracy: accuracy(week.map((row) => ({ correct: Boolean(row.correct) }))),
    history: rows
      .slice(0, 30)
      .reverse()
      .map((row) => row.rating_after as number),
    themes: [...themeMap.entries()]
      .map(([theme, stats]) => ({
        theme,
        played: stats.played,
        rate: Math.round((stats.correct / stats.played) * 100),
      }))
      .sort((a, b) => b.played - a.played)
      .slice(0, 8),
  };
}
