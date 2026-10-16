"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { failed, requireUser, saved, type ActionResult } from "@/lib/action";
import { isIsoDate, parseTime, resolveRange, weekdayMon0 } from "@/lib/dates";
import type { BlockType } from "@/lib/schedule";

const blockTypes = ["work", "study", "sport", "personal", "admin", "custom"] as const;

const blockSchema = z.object({
  intent: z.enum(["create", "update"]),
  scope: z.enum(["once", "weekly"]),
  date: z.string(),
  ruleId: z.string().nullable(),
  oneOffId: z.string().nullable(),
  title: z.string().trim().min(1).max(80),
  start: z.string(),
  end: z.string(),
  blockType: z.enum(blockTypes),
  customLabel: z.string().trim().max(40),
});

const deleteSchema = z.object({
  scope: z.enum(["once", "weekly"]),
  date: z.string(),
  ruleId: z.string().nullable(),
  oneOffId: z.string().nullable(),
});

function rangeFrom(startValue: string, endValue: string) {
  const start = parseTime(startValue);
  const end = parseTime(endValue);
  if (start == null || end == null) return null;
  return resolveRange(start, end);
}

export async function saveBlock(input: unknown): Promise<ActionResult> {
  const parsed = blockSchema.safeParse(input);
  if (!parsed.success || !isIsoDate(parsed.data.date)) return failed("Vérifie le titre et les heures.");
  const data = parsed.data;
  const range = rangeFrom(data.start, data.end);
  if (!range) return failed("Le créneau doit finir après son début.");
  if (data.blockType === "custom" && !data.customLabel) return failed("Indique un libellé.");

  const ctx = await requireUser();
  if (!ctx) return failed("Session expirée. Reconnecte-toi.");
  const { supabase, user } = ctx;
  const payload = {
    title: data.title,
    start_minute: range.start,
    end_minute: range.end,
    block_type: data.blockType as BlockType,
    custom_label: data.blockType === "custom" ? data.customLabel : null,
  };

  const missing = async (count: number | null | undefined) => {
    if (!count) return failed("Cet élément n'existe plus.");
    return null;
  };

  try {
    if (data.intent === "create" && data.scope === "weekly") {
      const { error } = await supabase.from("schedule_rules").insert({
        user_id: user.id,
        weekday: weekdayMon0(data.date),
        ...payload,
      });
      if (error) throw error;
    } else if (data.intent === "create") {
      const { error } = await supabase.from("schedule_one_offs").insert({
        user_id: user.id,
        occurrence_date: data.date,
        ...payload,
      });
      if (error) throw error;
    } else if (data.oneOffId && data.scope === "once") {
      const { data: rows, error } = await supabase
        .from("schedule_one_offs")
        .update(payload)
        .eq("id", data.oneOffId)
        .eq("user_id", user.id)
        .select("id");
      if (error) throw error;
      const gone = await missing(rows?.length);
      if (gone) return gone;
    } else if (data.oneOffId && data.scope === "weekly") {
      const { error } = await supabase.from("schedule_rules").insert({
        user_id: user.id,
        weekday: weekdayMon0(data.date),
        ...payload,
      });
      if (error) throw error;
      await supabase.from("schedule_one_offs").delete().eq("id", data.oneOffId).eq("user_id", user.id);
    } else if (data.ruleId && data.scope === "weekly") {
      const { data: rows, error } = await supabase
        .from("schedule_rules")
        .update(payload)
        .eq("id", data.ruleId)
        .eq("user_id", user.id)
        .select("id");
      if (error) throw error;
      const gone = await missing(rows?.length);
      if (gone) return gone;
    } else if (data.ruleId) {
      const { error } = await supabase.from("schedule_exceptions").upsert(
        {
          user_id: user.id,
          rule_id: data.ruleId,
          occurrence_date: data.date,
          cancelled: false,
          ...payload,
        },
        { onConflict: "rule_id,occurrence_date" },
      );
      if (error) throw error;
    } else {
      return failed("Enregistrement impossible. Réessaie.");
    }
  } catch (error) {
    console.error(error);
    return failed("Enregistrement impossible. Réessaie.");
  }

  revalidatePath("/planning");
  return saved();
}

export async function deleteBlock(input: unknown): Promise<ActionResult> {
  const parsed = deleteSchema.safeParse(input);
  if (!parsed.success || !isIsoDate(parsed.data.date)) return failed("Enregistrement impossible. Réessaie.");
  const data = parsed.data;
  const ctx = await requireUser();
  if (!ctx) return failed("Session expirée. Reconnecte-toi.");
  const { supabase, user } = ctx;

  try {
    if (data.oneOffId) {
      const { data: rows, error } = await supabase
        .from("schedule_one_offs")
        .delete()
        .eq("id", data.oneOffId)
        .eq("user_id", user.id)
        .select("id");
      if (error) throw error;
      if (!rows?.length) return failed("Cet élément n'existe plus.");
    } else if (data.ruleId && data.scope === "weekly") {
      const { data: rows, error } = await supabase
        .from("schedule_rules")
        .delete()
        .eq("id", data.ruleId)
        .eq("user_id", user.id)
        .select("id");
      if (error) throw error;
      if (!rows?.length) return failed("Cet élément n'existe plus.");
    } else if (data.ruleId) {
      const { error } = await supabase.from("schedule_exceptions").upsert(
        {
          user_id: user.id,
          rule_id: data.ruleId,
          occurrence_date: data.date,
          cancelled: true,
          title: null,
          start_minute: null,
          end_minute: null,
          block_type: null,
          custom_label: null,
        },
        { onConflict: "rule_id,occurrence_date" },
      );
      if (error) throw error;
    } else {
      return failed("Cet élément n'existe plus.");
    }
  } catch (error) {
    console.error(error);
    return failed("Enregistrement impossible. Réessaie.");
  }

  revalidatePath("/planning");
  return saved();
}
