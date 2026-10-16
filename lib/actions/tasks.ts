"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { failed, requireUser, saved, type ActionResult } from "@/lib/action";
import { isIsoDate, todayISO } from "@/lib/dates";

const createSchema = z.object({
  title: z.string().trim().min(1).max(120),
  bucket: z.enum(["today", "backlog"]),
});

export async function createTask(input: unknown): Promise<ActionResult> {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return failed("Indique un titre.");
  const ctx = await requireUser();
  if (!ctx) return failed("Session expirée. Reconnecte-toi.");
  const { error } = await ctx.supabase.from("tasks").insert({
    user_id: ctx.user.id,
    title: parsed.data.title,
    scheduled_date: parsed.data.bucket === "today" ? todayISO() : null,
  });
  if (error) {
    console.error(error);
    return failed("Enregistrement impossible. Réessaie.");
  }
  revalidatePath("/jour");
  return saved();
}

export async function setTaskDone(id: string, done: boolean): Promise<ActionResult> {
  const ctx = await requireUser();
  if (!ctx) return failed("Session expirée. Reconnecte-toi.");
  const { data, error } = await ctx.supabase
    .from("tasks")
    .update({ completed_at: done ? new Date().toISOString() : null })
    .eq("id", id)
    .eq("user_id", ctx.user.id)
    .select("id");
  if (error) {
    console.error(error);
    return failed("Enregistrement impossible. Réessaie.");
  }
  if (!data?.length) return failed("Cet élément n'existe plus.");
  revalidatePath("/jour");
  return saved();
}

export async function moveTask(id: string, date: string | null): Promise<ActionResult> {
  if (date && !isIsoDate(date)) return failed("Enregistrement impossible. Réessaie.");
  const ctx = await requireUser();
  if (!ctx) return failed("Session expirée. Reconnecte-toi.");
  const { data, error } = await ctx.supabase
    .from("tasks")
    .update({ scheduled_date: date })
    .eq("id", id)
    .eq("user_id", ctx.user.id)
    .select("id");
  if (error) {
    console.error(error);
    return failed("Enregistrement impossible. Réessaie.");
  }
  if (!data?.length) return failed("Cet élément n'existe plus.");
  revalidatePath("/jour");
  return saved();
}

export async function deleteTask(id: string): Promise<ActionResult> {
  const ctx = await requireUser();
  if (!ctx) return failed("Session expirée. Reconnecte-toi.");
  const { data, error } = await ctx.supabase
    .from("tasks")
    .delete()
    .eq("id", id)
    .eq("user_id", ctx.user.id)
    .select("id");
  if (error) {
    console.error(error);
    return failed("Enregistrement impossible. Réessaie.");
  }
  if (!data?.length) return failed("Cet élément n'existe plus.");
  revalidatePath("/jour");
  return saved();
}
