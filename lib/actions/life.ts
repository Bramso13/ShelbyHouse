"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { failed, requireUser, saved, type ActionResult } from "@/lib/action";
import { isIsoDate } from "@/lib/dates";

function refresh() {
  revalidatePath("/vie");
}

async function owned() {
  const ctx = await requireUser();
  if (!ctx) return null;
  return ctx;
}

export async function saveWeight(input: unknown): Promise<ActionResult> {
  const parsed = z
    .object({ date: z.string(), kg: z.number().positive().lt(500) })
    .safeParse(input);
  if (!parsed.success || !isIsoDate(parsed.data.date)) return failed("Indique un poids en kg.");
  const ctx = await owned();
  if (!ctx) return failed("Session expirée. Reconnecte-toi.");
  const { error } = await ctx.supabase.from("weight_entries").upsert(
    { user_id: ctx.user.id, entry_date: parsed.data.date, kg: parsed.data.kg },
    { onConflict: "user_id,entry_date" },
  );
  if (error) {
    console.error(error);
    return failed("Enregistrement impossible. Réessaie.");
  }
  refresh();
  return saved();
}

export async function deleteWeight(date: string): Promise<ActionResult> {
  if (!isIsoDate(date)) return failed("Cet élément n'existe plus.");
  const ctx = await owned();
  if (!ctx) return failed("Session expirée. Reconnecte-toi.");
  const { error } = await ctx.supabase
    .from("weight_entries")
    .delete()
    .eq("user_id", ctx.user.id)
    .eq("entry_date", date);
  if (error) return failed("Enregistrement impossible. Réessaie.");
  refresh();
  return saved();
}

export async function addSportType(name: string): Promise<ActionResult> {
  const parsed = z.string().trim().min(1).max(40).safeParse(name);
  if (!parsed.success) return failed("Indique un type de sport.");
  const ctx = await owned();
  if (!ctx) return failed("Session expirée. Reconnecte-toi.");
  const { error } = await ctx.supabase
    .from("sport_types")
    .insert({ user_id: ctx.user.id, name: parsed.data, is_preset: false });
  if (error) {
    if (error.code === "23505") return failed("Ce type existe déjà.");
    return failed("Enregistrement impossible. Réessaie.");
  }
  refresh();
  return saved();
}

export async function saveSession(input: unknown): Promise<ActionResult> {
  const parsed = z
    .object({
      typeId: z.uuid(),
      date: z.string(),
      durationMin: z.number().int().positive().max(1440),
      intensity: z.enum(["light", "moderate", "hard"]),
    })
    .safeParse(input);
  if (!parsed.success || !isIsoDate(parsed.data.date)) return failed("Indique une durée en minutes.");
  const ctx = await owned();
  if (!ctx) return failed("Session expirée. Reconnecte-toi.");
  const { data: type } = await ctx.supabase
    .from("sport_types")
    .select("id")
    .eq("id", parsed.data.typeId)
    .eq("user_id", ctx.user.id)
    .maybeSingle();
  if (!type) return failed("Cet élément n'existe plus.");
  const { error } = await ctx.supabase.from("sport_sessions").insert({
    user_id: ctx.user.id,
    sport_type_id: parsed.data.typeId,
    session_date: parsed.data.date,
    duration_min: parsed.data.durationMin,
    intensity: parsed.data.intensity,
  });
  if (error) return failed("Enregistrement impossible. Réessaie.");
  refresh();
  return saved();
}

export async function deleteSession(id: string): Promise<ActionResult> {
  const ctx = await owned();
  if (!ctx) return failed("Session expirée. Reconnecte-toi.");
  const { data, error } = await ctx.supabase
    .from("sport_sessions")
    .delete()
    .eq("id", id)
    .eq("user_id", ctx.user.id)
    .select("id");
  if (error || !data?.length) return failed("Cet élément n'existe plus.");
  refresh();
  return saved();
}

export async function saveSleep(input: unknown): Promise<ActionResult> {
  const parsed = z
    .object({
      date: z.string(),
      hours: z.number().min(0.25).max(24),
      quality: z.number().int().min(1).max(5),
    })
    .safeParse(input);
  if (!parsed.success || !isIsoDate(parsed.data.date)) return failed("Choisis une qualité de 1 à 5.");
  const quarters = Math.round(parsed.data.hours * 4);
  if (Math.abs(parsed.data.hours * 4 - quarters) > 0.001) return failed("Indique les heures par quart d'heure.");
  const ctx = await owned();
  if (!ctx) return failed("Session expirée. Reconnecte-toi.");
  const { error } = await ctx.supabase.from("sleep_logs").upsert(
    {
      user_id: ctx.user.id,
      wake_date: parsed.data.date,
      hours: parsed.data.hours,
      quality: parsed.data.quality,
    },
    { onConflict: "user_id,wake_date" },
  );
  if (error) return failed("Enregistrement impossible. Réessaie.");
  refresh();
  return saved();
}

export async function toggleHabit(habitId: string, date: string, done: boolean): Promise<ActionResult> {
  if (!isIsoDate(date)) return failed("Enregistrement impossible. Réessaie.");
  const ctx = await owned();
  if (!ctx) return failed("Session expirée. Reconnecte-toi.");
  const { data: habit } = await ctx.supabase
    .from("habits")
    .select("id")
    .eq("id", habitId)
    .eq("user_id", ctx.user.id)
    .maybeSingle();
  if (!habit) return failed("Cet élément n'existe plus.");
  const { error } = await ctx.supabase.from("habit_logs").upsert(
    { habit_id: habitId, user_id: ctx.user.id, log_date: date, done },
    { onConflict: "habit_id,log_date" },
  );
  if (error) return failed("Enregistrement impossible. Réessaie.");
  refresh();
  return saved();
}

export async function addHabit(name: string): Promise<ActionResult> {
  const parsed = z.string().trim().min(1).max(40).safeParse(name);
  if (!parsed.success) return failed("Indique un nom d'habitude.");
  const ctx = await owned();
  if (!ctx) return failed("Session expirée. Reconnecte-toi.");
  const { error } = await ctx.supabase.from("habits").insert({ user_id: ctx.user.id, name: parsed.data });
  if (error) return failed("Enregistrement impossible. Réessaie.");
  refresh();
  return saved();
}

export async function renameHabit(id: string, name: string): Promise<ActionResult> {
  const parsed = z.string().trim().min(1).max(40).safeParse(name);
  if (!parsed.success) return failed("Indique un nom d'habitude.");
  const ctx = await owned();
  if (!ctx) return failed("Session expirée. Reconnecte-toi.");
  const { data, error } = await ctx.supabase
    .from("habits")
    .update({ name: parsed.data })
    .eq("id", id)
    .eq("user_id", ctx.user.id)
    .select("id");
  if (error || !data?.length) return failed("Cet élément n'existe plus.");
  refresh();
  return saved();
}

export async function archiveHabit(id: string): Promise<ActionResult> {
  const ctx = await owned();
  if (!ctx) return failed("Session expirée. Reconnecte-toi.");
  const { data, error } = await ctx.supabase
    .from("habits")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", ctx.user.id)
    .select("id");
  if (error || !data?.length) return failed("Cet élément n'existe plus.");
  refresh();
  return saved();
}

export async function addMetric(input: unknown): Promise<ActionResult> {
  const parsed = z
    .object({ name: z.string().trim().min(1).max(40), unit: z.string().trim().min(1).max(16) })
    .safeParse(input);
  if (!parsed.success) return failed("Indique un nom et une unité.");
  const ctx = await owned();
  if (!ctx) return failed("Session expirée. Reconnecte-toi.");
  const { error } = await ctx.supabase.from("metric_definitions").insert({
    user_id: ctx.user.id,
    name: parsed.data.name,
    unit: parsed.data.unit,
  });
  if (error) return failed("Enregistrement impossible. Réessaie.");
  refresh();
  return saved();
}

export async function saveMetricValue(input: unknown): Promise<ActionResult> {
  const parsed = z
    .object({ definitionId: z.uuid(), date: z.string(), value: z.number().finite() })
    .safeParse(input);
  if (!parsed.success || !isIsoDate(parsed.data.date)) return failed("Indique une valeur.");
  const ctx = await owned();
  if (!ctx) return failed("Session expirée. Reconnecte-toi.");
  const { data: definition } = await ctx.supabase
    .from("metric_definitions")
    .select("id")
    .eq("id", parsed.data.definitionId)
    .eq("user_id", ctx.user.id)
    .maybeSingle();
  if (!definition) return failed("Cet élément n'existe plus.");
  const { error } = await ctx.supabase.from("metric_entries").upsert(
    {
      user_id: ctx.user.id,
      definition_id: parsed.data.definitionId,
      entry_date: parsed.data.date,
      value: parsed.data.value,
    },
    { onConflict: "definition_id,entry_date" },
  );
  if (error) return failed("Enregistrement impossible. Réessaie.");
  refresh();
  return saved();
}

export async function deleteMetric(id: string): Promise<ActionResult> {
  const ctx = await owned();
  if (!ctx) return failed("Session expirée. Reconnecte-toi.");
  const { data, error } = await ctx.supabase
    .from("metric_definitions")
    .delete()
    .eq("id", id)
    .eq("user_id", ctx.user.id)
    .select("id");
  if (error || !data?.length) return failed("Cet élément n'existe plus.");
  refresh();
  return saved();
}
