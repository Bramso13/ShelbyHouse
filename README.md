# Shelby

Application personnelle : journée, planning, suivi et tactiques d'échecs. Hébergement prévu sur Vercel, données dans Supabase.

## Brancher Supabase

1. Crée un projet sur [supabase.com](https://supabase.com).
2. Dans le SQL editor, exécute `supabase/migrations/20261016120000_init.sql`.
3. Exécute ensuite `supabase/seed/puzzles.sql` (puzzles Lichess, licence CC0).
4. Copie `.env.example` vers `.env.local` et remplis l'URL du projet et la clé `anon` publique.
5. Authentication → Providers → Email : un mot de passe suffit. Pour éviter l'étape de confirmation sur un usage solo, tu peux désactiver « Confirm email ».
6. Après la création de ton compte, désactive les inscriptions publiques dans Authentication → Sign In / Providers.

La clé `service_role` ne va nulle part dans ce projet.

## Lancer

```bash
npm install
npm run dev
```

Ouvre http://localhost:3000, crée le compte, puis parcours Jour, Planning, Vie et Échecs.

## Vercel

Importe le dépôt. Ajoute les deux variables `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` pour Production et Preview. Déploie.

Dans Supabase → Authentication → URL configuration, ajoute l'adresse Vercel dans Site URL et dans les Redirect URLs, avec `/auth/callback`.

## Fuseau

Les dates du jour sont calculées en `Europe/Paris`.
# ShelbyHouse
