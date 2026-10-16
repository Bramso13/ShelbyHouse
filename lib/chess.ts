import { Chess, type Move } from "chess.js";

export const RATING_MIN = 400;
export const RATING_MAX = 2800;
const K_FACTOR = 20;

export function nextRating(player: number, puzzle: number, correct: boolean): number {
  const expected = 1 / (1 + 10 ** ((puzzle - player) / 400));
  const score = correct ? 1 : 0;
  const updated = Math.round(player + K_FACTOR * (score - expected));
  return Math.min(RATING_MAX, Math.max(RATING_MIN, updated));
}

export function expectedUserMoves(moves: string): string[] {
  return moves.split(/\s+/).filter((_, index) => index % 2 === 1);
}

export function gradeAttempt(moves: string, played: string[]): boolean {
  const expected = expectedUserMoves(moves);
  return played.length === expected.length && played.every((move, index) => move === expected[index]);
}

export function applyUci(chess: Chess, uci: string): Move | null {
  const from = uci.slice(0, 2);
  const to = uci.slice(2, 4);
  const promotion = uci.length > 4 ? uci[4] : undefined;
  return chess.move({ from, to, promotion }) ?? null;
}

export function positionAfterSetup(fen: string, moves: string): Chess | null {
  const chess = new Chess(fen);
  const setup = moves.split(/\s+/)[0];
  if (!setup || !applyUci(chess, setup)) return null;
  return chess;
}

export function streakFromDates(successDates: string[], today: string): number {
  const unique = [...new Set(successDates)].sort();
  if (!unique.length) return 0;
  const present = new Set(unique);
  const latest = unique[unique.length - 1];
  if (latest !== today && latest !== previousDay(today)) return 0;
  let cursor = latest;
  let count = 0;
  while (present.has(cursor)) {
    count += 1;
    cursor = previousDay(cursor);
  }
  return count;
}

function previousDay(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day - 1)).toISOString().slice(0, 10);
}

export function accuracy(attempts: { correct: boolean }[]): number | null {
  if (!attempts.length) return null;
  const correct = attempts.filter((attempt) => attempt.correct).length;
  return Math.round((correct / attempts.length) * 100);
}

export const THEME_LABELS: Record<string, string> = {
  advancedPawn: "Pion avancé",
  advantage: "Avantage",
  attraction: "Attraction",
  backRankMate: "Mat du couloir",
  bishopEndgame: "Finale de fous",
  capturingDefender: "Prise du défenseur",
  clearance: "Dégagement",
  crushing: "Décisif",
  deflection: "Déviation",
  discoveredAttack: "Découverte",
  doubleCheck: "Échec double",
  endgame: "Finale",
  equality: "Égalité",
  exposedKing: "Roi exposé",
  fork: "Fourchette",
  hangingPiece: "Pièce en prise",
  interference: "Interception",
  intermezzo: "Coup intermédiaire",
  kingsideAttack: "Attaque à l'aile roi",
  knightEndgame: "Finale de cavaliers",
  long: "Long",
  master: "Partie de maître",
  mate: "Mat",
  mateIn1: "Mat en 1",
  mateIn2: "Mat en 2",
  mateIn3: "Mat en 3",
  mateIn4: "Mat en 4",
  middlegame: "Milieu de partie",
  oneMove: "Un coup",
  opening: "Ouverture",
  pin: "Clouage",
  pawnEndgame: "Finale de pions",
  promotion: "Promotion",
  queenEndgame: "Finale de dames",
  queensideAttack: "Attaque à l'aile dame",
  quietMove: "Coup silencieux",
  rookEndgame: "Finale de tours",
  sacrifice: "Sacrifice",
  short: "Court",
  skewer: "Enfilade",
  smotheredMate: "Mat étouffé",
  trappedPiece: "Pièce enfermée",
  underPromotion: "Sous-promotion",
  veryLong: "Très long",
  xRayAttack: "Rayon X",
};

const QUIET_THEMES = new Set([
  "opening",
  "middlegame",
  "endgame",
  "oneMove",
  "short",
  "long",
  "veryLong",
  "crushing",
  "advantage",
  "equality",
  "master",
]);

export function themeLabel(theme: string): string {
  return THEME_LABELS[theme] ?? theme;
}

export function tacticalThemes(themes: string[]): string[] {
  const tactical = themes.filter((theme) => !QUIET_THEMES.has(theme));
  return tactical.length ? tactical : themes;
}
