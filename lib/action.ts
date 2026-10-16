import { createClient } from "@/lib/supabase/server";

export type ActionResult = { ok: true; message?: string } | { ok: false; message: string };

export async function requireUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return { supabase, user: data.user };
}

export function failed(message: string): { ok: false; message: string } {
  return { ok: false, message };
}

export function saved(): ActionResult {
  return { ok: true };
}
