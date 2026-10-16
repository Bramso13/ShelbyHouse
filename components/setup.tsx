export function SetupGuide() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-6 px-5 py-10">
      <p className="text-[15px] font-semibold tracking-[-0.04em] text-brass">Shelby</p>
      <h1 className="text-[1.7rem] font-semibold tracking-[-0.04em]">Brancher le compte</h1>
      <div className="space-y-3 text-muted">
        <p>Le projet est prêt. Il manque les clés Supabase pour ouvrir ton compte.</p>
        <ol className="list-decimal space-y-2 pl-5">
          <li>Crée un projet Supabase et un projet Vercel.</li>
          <li>Dans Supabase, exécute <code>supabase/migrations/20261016120000_init.sql</code> puis <code>supabase/seed/puzzles.sql</code>.</li>
          <li>Copie l&apos;URL et la clé anon dans <code>.env.local</code>, comme dans <code>.env.example</code>.</li>
          <li>Désactive les inscriptions publiques après avoir créé ton compte.</li>
        </ol>
      </div>
    </main>
  );
}

export function SchemaMissing() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-4 px-5">
      <h1 className="text-[1.7rem] font-semibold tracking-[-0.04em]">Base à préparer</h1>
      <p className="text-muted">
        La connexion Supabase répond, mais les tables Shelby ne sont pas là. Exécute les deux fichiers SQL du dossier supabase, dans l&apos;ordre.
      </p>
    </main>
  );
}
