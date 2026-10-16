# Shelby — spécification V1

## Overview

Shelby est une application web personnelle pour piloter la journée depuis le téléphone : emploi du temps, tâches, suivi de vie et entraînement aux tactiques d’échecs. L’interface est en français, sombre, dense, et se lit au pouce dans le navigateur.

La V1 est utilisable par un seul compte. L’hébergement prévu est Vercel, les données sont dans Supabase. Les comptes Vercel et Supabase ne sont pas encore créés : le code doit pouvoir être branché ensuite, sans les inventer dans le dépôt.

## Décisions verrouillées

| Sujet | Décision |
| --- | --- |
| Public | Un seul utilisateur, de façon durable |
| Client | Site responsive dans le navigateur, pensé d’abord pour le téléphone |
| Nom | Shelby |
| Langue et ton | Français, sombre, dense |
| Auth V1 | Email + mot de passe (Supabase Auth) |
| Emploi du temps | Semaine type + exceptions datées, édition en touchant la grille |
| Plage affichée | Minuit à minuit, ouverte sur l’heure actuelle |
| Tâches | Liste du jour + bac à planifier |
| Vie | Poids, sport, sommeil, habitudes, mesures libres |
| Habitudes de départ | Lire, Étirements / mobilité, Puzzles d’échecs |
| Échecs | Puzzles notés, thèmes, série, rating local choisi au départ |
| V1 inclut | Planning, tâches, vie, échecs |
| Après la V1 | Inbox de tickets mail + registre d’agents externes |

## Hypothèses à corriger si besoin

Ces choix ne sont pas encore confirmés. Ils servent à rendre la spec testable.

- Fuseau horaire : `Europe/Paris`. La semaine commence le lundi.
- Poids en kilogrammes, une valeur par jour.
- Sommeil rattaché à la date du lever : durée en heures (pas de 0,25) et qualité de 1 à 5.
- Intensité d’une séance : légère, modérée, intense.
- Un créneau d’emploi du temps ne traverse pas minuit.
- Types de sport de départ : Musculation, Course, Vélo, Marche, Natation. D’autres types peuvent être ajoutés.
- L’habitude « Puzzles d’échecs » se coche seule dès qu’un puzzle est réussi ce jour-là.
- Rating d’échecs borné de 400 à 2800. Mise à jour type Elo avec K = 20.
- Les puzzles viennent de la base Lichess, licence CC0. Aucun compte Lichess n’est relié.

## Functional Requirements

### Accès

**FR-AUTH-001** : Compte
Le système doit authentifier l’utilisateur avec email et mot de passe via Supabase Auth.

**FR-AUTH-002** : Session
Quand l’utilisateur ouvre une page privée sans session valide, le système doit afficher la connexion et conserver l’adresse demandée pour y revenir après succès.

**FR-AUTH-003** : Isolation
Le système doit lier chaque donnée métier à l’utilisateur connecté et refuser, par les règles de sécurité des lignes, toute lecture ou écriture d’une ligne d’un autre compte.

**FR-AUTH-004** : Inscription
Le système doit proposer une inscription email + mot de passe. Après création du compte propriétaire, l’inscription publique se désactive dans le projet Supabase.

### Navigation

**FR-NAV-001** : Sections
Quand l’utilisateur est connecté, le système doit proposer quatre sections : Jour, Planning, Vie, Échecs.

**FR-NAV-002** : Mobile
Sur un écran de téléphone, le système doit placer cette navigation en bas, avec des cibles tactiles d’au moins 44 px.

### Emploi du temps

**FR-PLAN-001** : Grille
Quand l’utilisateur ouvre Planning, le système doit afficher une journée de 00:00 à 24:00 et positionner la vue sur l’heure actuelle si cette journée est aujourd’hui.

**FR-PLAN-002** : Semaine
Le système doit permettre de changer de jour, et d’afficher le contexte de la semaine en cours.

**FR-PLAN-003** : Créneau récurrent
Quand l’utilisateur touche une zone vide puis choisit « Toutes les semaines », le système doit créer un créneau sur ce jour de semaine, avec titre, heure de début, heure de fin et type.

**FR-PLAN-004** : Créneau daté
Quand l’utilisateur touche une zone vide puis choisit « Seulement ce jour », le système doit créer un créneau uniquement à cette date.

**FR-PLAN-005** : Types
Le système doit proposer les types Travail, Cours / apprentissage, Sport, Perso et Admin / courses, plus un libellé libre saisi par l’utilisateur.

**FR-PLAN-006** : Occurrence seule
Quand l’utilisateur modifie un créneau récurrent et choisit « Seulement ce jour », le système doit garder la règle hebdomadaire et enregistrer une exception pour cette date.

**FR-PLAN-007** : Série entière
Quand l’utilisateur modifie un créneau récurrent et choisit « Toutes les semaines », le système doit mettre à jour la règle hebdomadaire sans réécrire les exceptions déjà posées.

**FR-PLAN-008** : Suppression
Quand l’utilisateur supprime un créneau, le système doit demander s’il retire cette occurrence ou, pour un créneau récurrent, toute la série.

**FR-PLAN-009** : Chevauchement
Quand deux créneaux se chevauchent, le système doit les afficher tous les deux.

**FR-PLAN-010** : Même journée
Quand l’heure de fin n’est pas après l’heure de début, le système doit refuser l’enregistrement et indiquer que le créneau doit finir après son début.

### Tâches

**FR-TASK-001** : Bac
Le système doit conserver des tâches sans date dans un bac « À planifier ».

**FR-TASK-002** : Jour
Quand une tâche a une date, le système doit l’afficher dans la section Jour de cette date.

**FR-TASK-003** : Création
Quand l’utilisateur ajoute une tâche, le système doit enregistrer un titre et, au choix, une date ou le bac.

**FR-TASK-004** : Planification
Quand l’utilisateur assigne une date à une tâche du bac, le système doit la retirer du bac et l’afficher ce jour-là.

**FR-TASK-005** : Terminée
Quand l’utilisateur coche une tâche, le système doit la marquer terminée et conserver l’heure de complétion.

**FR-TASK-006** : Retard
Quand des tâches non terminées ont une date avant aujourd’hui, le système doit les regrouper dans « En retard » et permettre de les déplacer à aujourd’hui.

**FR-TASK-007** : Réouverture
Quand l’utilisateur décoche une tâche terminée, le système doit la remettre à faire.

### Suivi de vie

**FR-LIFE-001** : Poids
Quand l’utilisateur enregistre un poids pour une date, le système doit garder une seule valeur en kg pour cette date et remplacer la précédente.

**FR-LIFE-002** : Sport
Quand l’utilisateur enregistre une séance, le système doit stocker le type, la date, la durée en minutes et l’intensité. Plusieurs séances peuvent exister le même jour.

**FR-LIFE-003** : Types de sport
Le système doit démarrer avec Musculation, Course, Vélo, Marche et Natation, et permettre d’ajouter un type nommé par l’utilisateur.

**FR-LIFE-004** : Sommeil
Quand l’utilisateur enregistre une nuit, le système doit stocker la durée et une qualité de 1 à 5 pour la date du lever, avec une seule entrée par date.

**FR-LIFE-005** : Habitudes
Le système doit créer les habitudes Lire, Étirements / mobilité et Puzzles d’échecs, et permettre d’en ajouter, d’en renommer et d’en archiver.

**FR-LIFE-006** : Coche quotidienne
Quand l’utilisateur coche une habitude pour une date, le système doit mémoriser cet état pour cette date seule.

**FR-LIFE-007** : Habitude échecs
Quand l’utilisateur réussit au moins un puzzle durant le jour local, le système doit marquer l’habitude « Puzzles d’échecs » comme faite pour cette date.

**FR-LIFE-008** : Mesure libre
Quand l’utilisateur définit une mesure, le système doit enregistrer son nom et son unité, puis accepter des valeurs numériques datées. Plusieurs définitions peuvent coexister.

**FR-LIFE-009** : Historique
Le système doit montrer, pour le poids, le sommeil, chaque habitude et chaque mesure libre, les valeurs des 30 derniers jours.

### Échecs

**FR-CHESS-001** : Rating initial
À la première ouverture d’Échecs, le système doit demander un rating de départ entre 400 et 2800 et le conserver.

**FR-CHESS-002** : Puzzle adapté
Quand l’utilisateur demande un puzzle, le système doit proposer un puzzle Lichess non tenté dans les 50 dernières tentatives, dont le rating est le plus proche du rating actuel, d’abord dans une fenêtre de ±150 points, puis en élargissant si aucun puzzle ne convient.

**FR-CHESS-003** : Jeu
Le système doit afficher l’échiquier, indiquer le trait, et n’accepter que les coups légaux. Le camp à jouer est celui qui doit trouver la tactique.

**FR-CHESS-004** : Solution en plusieurs coups
Quand le coup joué est le bon et que la solution continue, le système doit jouer la réponse adverse puis attendre le coup suivant.

**FR-CHESS-005** : Succès
Quand le dernier coup de la solution est joué, le système doit marquer la tentative réussie, augmenter le rating, mettre à jour la série si c’est la première réussite du jour, et proposer le puzzle suivant.

**FR-CHESS-006** : Échec
Quand un coup incorrect est joué, le système doit terminer la tentative, baisser le rating, montrer la solution, puis permettre de passer au puzzle suivant.

**FR-CHESS-007** : Formule
Le système doit mettre à jour le rating avec un Elo de K = 20 : gain = 20 × (résultat − espérance), résultat valant 1 si réussi et 0 si raté, espérance = 1 / (1 + 10 ^ ((rating du puzzle − rating du joueur) / 400)). Le rating résultant est arrondi à l’entier et borné entre 400 et 2800.

**FR-CHESS-008** : Série
La série doit valoir le nombre de jours locaux consécutifs, en terminant aujourd’hui ou hier, contenant au moins un puzzle réussi. Un jour sans réussite casse la série.

**FR-CHESS-009** : Thèmes
Après une tentative, le système doit afficher les thèmes Lichess du puzzle. Le système doit cumuler, par thème, le nombre de tentatives et le taux de réussite.

**FR-CHESS-010** : Progression
Le système doit afficher le rating actuel, la série, la précision des 7 derniers jours et la courbe des tentatives récentes.

**FR-CHESS-011** : Provenance
Le système doit utiliser des puzzles de la base Lichess publiée en CC0, et afficher Lichess comme source.

## Non-Functional Requirements

### Performance

- Sur un téléphone en 4G, une section déjà visitée redevient interactive en moins de 2 secondes.
- Poser un coup sur l’échiquier met à jour la position en moins de 100 ms, sans nouvel aller-retour réseau.
- Le prochain puzzle est choisi côté serveur en moins de 500 ms une fois la base importée.

### Security

- Mots de passe gérés par Supabase Auth, jamais stockés par l’application.
- Row Level Security activée sur chaque table métier, politique `auth.uid() = user_id`.
- Aucune clé service role ni secret dans une variable `NEXT_PUBLIC_`.
- Les pages métier sont inaccessibles sans session.
- L’inscription publique est un réglage Supabase à couper après le premier compte, pas une donnée dans le code.

### Données et capacité

- Usage prévu : 1 utilisateur, saisie manuelle, historique conservé jusqu’à suppression par l’utilisateur.
- Volume échecs visé pour l’import initial : puzzles entre 800 et 2200 de rating, assez pour ne pas se répéter sur plusieurs semaines.
- Suppression de compte : non exigée en V1. Suppression unitaire exigée pour tâches, créneaux, séances, mesures et habitudes.

### Accessibilité et client

- Contrastes lisibles sur fond sombre.
- Cibles tactiles d’au moins 44 px pour les actions principales.
- La grille du jour reste utilisable sans zoom du navigateur sur une largeur de 390 px.
- Le bureau reste utilisable : la navigation ne disparaît pas, elle peut passer en barre latérale au-dessus de 900 px.

## Acceptance Criteria

### AC-AUTH-001 : Connexion
Given un compte existant
When l’utilisateur envoie le bon email et le bon mot de passe
Then la session s’ouvre sur Jour

### AC-AUTH-002 : Mauvais mot de passe
Given un compte existant
When l’utilisateur envoie un mauvais mot de passe
Then il reste sur la connexion
And le message « Email ou mot de passe incorrect » s’affiche
And le mot de passe saisi est effacé

### AC-AUTH-003 : Page privée
Given une session absente
When l’utilisateur ouvre Planning
Then la connexion s’affiche
And une connexion réussie le ramène à Planning

### AC-PLAN-001 : Ouverture sur maintenant
Given aujourd’hui à 15:30
When l’utilisateur ouvre Planning
Then la grille va de 00:00 à 24:00
And la vue est positionnée sur l’après-midi, pas sur minuit

### AC-PLAN-002 : Série hebdomadaire
Given lundi 16 mars sans créneau à 09:00
When l’utilisateur crée « Stand-up », 09:00–09:30, type Travail, « Toutes les semaines »
Then le créneau apparaît chaque lundi
And il n’apparaît pas le mardi

### AC-PLAN-003 : Exception d’un jour
Given un créneau récurrent le lundi 09:00–09:30
When l’utilisateur le passe à 10:00–10:30 pour « Seulement ce jour »
Then ce lundi affiche 10:00–10:30
And le lundi suivant affiche encore 09:00–09:30

### AC-PLAN-004 : Fin avant le début
Given le formulaire de créneau
When l’heure de fin est 08:00 et l’heure de début 09:00
Then rien n’est enregistré
And le message indique que le créneau doit finir après son début

### AC-TASK-001 : Du bac au jour
Given une tâche « Acheter du lait » sans date
When l’utilisateur lui assigne aujourd’hui
Then elle disparaît du bac
And elle apparaît dans Jour

### AC-TASK-002 : Retard
Given une tâche non terminée datée d’hier
When l’utilisateur ouvre Jour
Then la tâche apparaît dans « En retard »
And l’action « Passer à aujourd’hui » la date d’aujourd’hui

### AC-LIFE-001 : Poids du jour
Given un poids de 82,4 kg déjà saisi aujourd’hui
When l’utilisateur enregistre 82,1 kg pour la même date
Then une seule pesée reste pour cette date
And elle vaut 82,1

### AC-LIFE-002 : Sommeil
Given le formulaire de sommeil
When l’utilisateur saisit 7,5 h et une qualité de 4
Then l’entrée est visible pour cette date
And une seconde saisie le même jour remplace la première

### AC-LIFE-003 : Habitude échecs
Given l’habitude « Puzzles d’échecs » non cochée aujourd’hui
When l’utilisateur réussit un puzzle
Then l’habitude du jour est cochée
And décocher à la main reste possible

### AC-CHESS-001 : Rating de départ
Given un utilisateur qui n’a jamais ouvert Échecs
When il choisit 1500
Then son rating affiché est 1500
And l’écran de choix ne revient pas aux visites suivantes

### AC-CHESS-002 : Puzzle réussi
Given un rating de 1500 et un puzzle noté 1500
When l’utilisateur joue toute la solution
Then la tentative est réussie
And le rating monte d’environ 10 points
And le puzzle suivant s’affiche

### AC-CHESS-003 : Coup faux
Given un puzzle en cours
When l’utilisateur joue un coup légal qui n’est pas le coup attendu
Then la tentative est ratée
And le rating baisse
And la solution est montrée
And aucun coup supplémentaire n’est demandé

### AC-CHESS-004 : Série
Given une réussite hier et aucune aujourd’hui
When l’utilisateur ouvre Échecs
Then la série affichée inclut hier
When il réussit un puzzle aujourd’hui
Then la série augmente de un
Given ensuite un jour entier sans réussite
When le jour suivant commence
Then la série retombe à 0 tant qu’aucun puzzle n’est réussi

## Error Handling

| Situation | Où | Message |
| --- | --- | --- |
| Email ou mot de passe incorrect | Connexion | « Email ou mot de passe incorrect » |
| Session expirée | Toute section | Retour à la connexion, puis retour à la page demandée |
| Titre de tâche ou de créneau vide | Formulaire | « Indique un titre » |
| Créneau qui finit avant de commencer | Planning | « Le créneau doit finir après son début » |
| Durée de sport ≤ 0 | Vie | « Indique une durée en minutes » |
| Qualité de sommeil hors 1–5 | Vie | « Choisis une qualité de 1 à 5 » |
| Rating initial hors 400–2800 | Échecs | « Choisis un rating entre 400 et 2800 » |
| Plus aucun puzzle dans la base importée | Échecs | « Plus de puzzles disponibles pour ce rating » |
| Réseau indisponible pendant une sauvegarde | Toute section | « Enregistrement impossible. Réessaie. » La saisie reste à l’écran |
| Ligne introuvable ou déjà supprimée | Toute section | « Cet élément n’existe plus » et la liste est rafraîchie |

## Implementation TODO

À ne démarrer qu’après relecture de cette spec.

### Socle

- [ ] Application Next.js (App Router) + TypeScript, prête pour Vercel
- [ ] Client Supabase, variables d’environnement documentées sans secrets commités
- [ ] Auth email + mot de passe, garde des routes privées
- [ ] Schéma et RLS : profil, créneaux récurrents, exceptions, tâches, poids, types de sport, séances, sommeil, habitudes, logs d’habitudes, définitions et valeurs de mesures, profil échecs, puzzles, tentatives
- [ ] Navigation Jour / Planning / Vie / Échecs, fond sombre, mobile d’abord

### Planning

- [ ] Grille minuit–minuit, ancrage sur l’heure actuelle
- [ ] Création et édition au toucher, choix « ce jour » / « toutes les semaines »
- [ ] Rendu des récurrences et des exceptions

### Tâches

- [ ] Bac, jour, retard, cocher, déplacer la date

### Vie

- [ ] Poids, sommeil, séances, habitudes seed, mesures libres
- [ ] Historique 30 jours
- [ ] Coche automatique de l’habitude échecs

### Échecs

- [ ] Import CC0 d’une tranche de puzzles Lichess (rating 800–2200)
- [ ] Échiquier, coups légaux, solution multi-coups
- [ ] Elo K = 20, série, thèmes, précision 7 jours
- [ ] Choix du rating initial

### Vérification

- [ ] Parcours mobile : connexion, créneau récurrent, exception d’un jour, tâche du bac vers aujourd’hui, pesée, séance, sommeil, puzzle réussi et puzzle raté
- [ ] Contrôle qu’un second compte ne lit pas les lignes du premier

## Out of Scope

- Installation sur l’écran d’accueil (PWA) et application native
- Plusieurs utilisateurs, partage, invitations
- Synchronisation Google Calendar ou Apple Calendar
- Glisser-déposer des créneaux
- Créneaux à cheval sur minuit
- Tâches accrochées à un créneau
- Tâches récurrentes
- Mode rush chronométré aux échecs
- Compte Lichess relié, rating Lichess officiel
- Lecture des emails, tickets, agents IA, clés API
- Notifications push
- Export des données

## V2 prévue, non implémentée

Les tickets et les agents ne font pas partie du code de la V1. Le modèle visé, pour ne pas le réinventer plus tard :

- Un agent externe (script, n8n ou autre) appelle une API avec une clé.
- Shelby garde un registre : nom, empreinte de clé, droits, journal d’actions.
- Une inbox reçoit les tickets issus des mails. Statuts : nouveau, en cours, fait, ignoré.
- Depuis un ticket, l’utilisateur peut le traiter ou le transformer en tâche.
- L’application n’héberge pas l’IA et ne lit pas la boîte mail.

## Open Questions

- [ ] Le fuseau `Europe/Paris` et la semaine qui commence le lundi sont-ils les bons ?
- [ ] La coche automatique de l’habitude échecs après un puzzle réussi convient-elle ?
- [ ] Les cinq sports de départ conviennent-ils ?
- [ ] Faut-il une note libre sur une tâche en V1 ?
