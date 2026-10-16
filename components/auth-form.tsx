"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn, signUp } from "@/lib/actions/auth";
import type { ActionResult } from "@/lib/action";

const field =
  "h-11 w-full rounded-md border border-line bg-white px-3 text-paper outline-none placeholder:text-faint focus:border-brass";

export function AuthForm({
  mode,
  next,
  origin,
}: {
  mode: "login" | "signup";
  next: string;
  origin: string;
}) {
  const action = mode === "login" ? signIn : signUp;
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(action, null);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center px-5 py-10">
      <p className="text-[15px] font-semibold tracking-[-0.04em] text-brass">Shelby</p>
      <h1 className="mt-8 text-[1.7rem] font-semibold tracking-[-0.04em]">
        {mode === "login" ? "Reprendre la journée." : "Créer le compte."}
      </h1>
      <p className="mt-1 text-sm text-muted">
        {mode === "login" ? "Email et mot de passe." : "Un seul compte, le tien."}
      </p>
      <form action={formAction} className="mt-8 space-y-3">
        <input type="hidden" name="next" value={next} />
        <input type="hidden" name="origin" value={origin} />
        <label className="block text-sm text-muted">
          Email
          <input className={`${field} mt-1`} name="email" type="email" autoComplete="username" required />
        </label>
        <label className="block text-sm text-muted">
          Mot de passe
          <input
            className={`${field} mt-1`}
            name="password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            minLength={8}
            required
          />
        </label>
        {state?.message ? (
          <p className={state.ok ? "text-moss" : "text-clay"}>{state.message}</p>
        ) : null}
        <button
          className="mt-2 h-11 w-full rounded-md border border-[#9f1d14] bg-brass text-sm font-semibold text-white disabled:opacity-60"
          disabled={pending}
        >
          {pending ? "Patiente…" : mode === "login" ? "Entrer" : "Créer le compte"}
        </button>
      </form>
      <p className="mt-6 text-sm text-faint">
        {mode === "login" ? (
          <Link className="min-h-11 text-brass" href={`/signup?next=${encodeURIComponent(next)}`}>
            Créer un compte
          </Link>
        ) : (
          <Link className="min-h-11 text-brass" href={`/login?next=${encodeURIComponent(next)}`}>
            J&apos;ai déjà un compte
          </Link>
        )}
      </p>
    </main>
  );
}
