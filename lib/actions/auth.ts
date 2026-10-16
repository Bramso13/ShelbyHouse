"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { safeNext } from "@/lib/dates";
import { failed, type ActionResult } from "@/lib/action";
import { createClient } from "@/lib/supabase/server";

const credentials = z.object({
  email: z.email(),
  password: z.string().min(8).max(72),
});

export async function signIn(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = credentials.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return failed("Email ou mot de passe incorrect");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return failed("Email ou mot de passe incorrect");
  redirect(safeNext(String(formData.get("next") ?? "")));
}

export async function signUp(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = credentials.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return failed("Utilise un email valide et un mot de passe d'au moins 8 caractères.");
  }

  const supabase = await createClient();
  const origin = String(formData.get("origin") ?? "");
  const next = safeNext(String(formData.get("next") ?? ""));
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: origin ? `${origin}/auth/callback?next=${encodeURIComponent(next)}` : undefined,
    },
  });

  if (error) {
    const already = /already/i.test(error.message);
    return failed(
      already
        ? "Un compte existe déjà avec cet email. Connecte-toi."
        : "Inscription impossible. Réessaie.",
    );
  }

  if (data.session) redirect(next);
  return {
    ok: true,
    message: "Compte créé. Confirme l'email, puis connecte-toi.",
  };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
