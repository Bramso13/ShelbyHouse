"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Chess } from "chess.js";
import { setInitialRating, submitAttempt } from "@/lib/actions/chess";
import { applyUci, tacticalThemes, themeLabel } from "@/lib/chess";
import { ChessBoard, previewFen } from "@/components/chess-board";
import type { PuzzleCard } from "@/lib/queries";

export function RatingGate() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const rating = Number(new FormData(event.currentTarget).get("rating"));
        startTransition(async () => {
          const result = await setInitialRating(rating);
          if (!result.ok) {
            setError(result.message);
            return;
          }
          router.refresh();
        });
      }}
    >
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">Tactiques</p>
        <h1 className="text-[1.7rem] font-semibold tracking-[-0.04em]">Choisis ton rating</h1>
      </header>
      <p className="text-muted">Il sert de point de départ. Ensuite, chaque puzzle le fait bouger.</p>
      <input
        name="rating"
        type="number"
        min={400}
        max={2800}
        required
        placeholder="1500"
        className="h-14 w-full rounded-md border border-line bg-white px-4 font-mono text-3xl outline-none focus:border-brass"
      />
      {error ? <p className="text-clay">{error}</p> : null}
      <button disabled={pending} className="h-11 w-full rounded-md border border-[#9f1d14] bg-brass text-sm font-semibold text-white">
        Commencer
      </button>
    </form>
  );
}

export function Trainer({
  puzzle,
  rating,
  streak,
}: {
  puzzle: PuzzleCard;
  rating: number;
  streak: number;
}) {
  const router = useRouter();
  const setup = puzzle.moves.split(/\s+/)[0] ?? "";
  const solution = puzzle.moves.split(/\s+/).slice(1);
  const start = previewFen(puzzle.fen, [setup]);
  const [fen, setFen] = useState(start);
  const [index, setIndex] = useState(0);
  const [played, setPlayed] = useState<string[]>([]);
  const [phase, setPhase] = useState<"play" | "solved" | "failed" | "review">("play");
  const [liveRating, setLiveRating] = useState(rating);
  const [liveStreak, setLiveStreak] = useState(streak);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const side = new Chess(fen).turn() === "w" ? "Blancs" : "Noirs";

  function finish(nextPlayed: string[], failedMove: boolean) {
    startTransition(async () => {
      try {
        const result = await submitAttempt({ puzzleId: puzzle.id, played: nextPlayed });
        if (!result.ok) {
          setError(result.message);
          return;
        }
        setLiveRating(result.rating);
        setLiveStreak(result.streak);
        setPhase((current) => {
          if (current === "review") return current;
          return result.correct && !failedMove ? "solved" : "failed";
        });
      } catch {
        setError("Enregistrement impossible. Réessaie.");
      }
    });
  }

  function onMove(uci: string) {
    if (phase !== "play" || pending) return;
    const expected = solution[index];
    if (uci !== expected) {
      setPhase("failed");
      finish(played, true);
      return;
    }
    const chess = new Chess(fen);
    applyUci(chess, uci);
    const nextPlayed = [...played, uci];
    let nextIndex = index + 1;
    if (solution[nextIndex]) {
      applyUci(chess, solution[nextIndex]);
      nextIndex += 1;
    }
    setFen(chess.fen());
    setPlayed(nextPlayed);
    setIndex(nextIndex);
    if (nextIndex >= solution.length) finish(nextPlayed, false);
  }

  function showSolution() {
    setFen(previewFen(start, solution));
    setPhase("review");
  }

  return (
    <div className={phase === "solved" ? "flash space-y-4" : "space-y-4"}>
      <div className="flex items-end justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">Rating</p>
          <p className="font-mono text-5xl leading-none tracking-tight text-brass">{liveRating}</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">Série</p>
          <p className="font-mono text-3xl leading-none tracking-tight">{liveStreak}</p>
        </div>
      </div>
      <p className="text-sm text-muted">
        {phase === "play" ? `Aux ${side.toLowerCase()} de jouer` : phase === "solved" ? "Trouvé." : phase === "failed" ? "Raté." : "Solution."}
      </p>
      <ChessBoard fen={fen} interactive={phase === "play" && !pending} onMove={onMove} />
      {error ? <p className="text-sm text-clay">{error}</p> : null}
      {phase === "failed" ? (
        <button type="button" className="h-11 w-full rounded-md border border-line bg-white" onClick={showSolution}>
          Voir la solution
        </button>
      ) : null}
      {phase === "solved" || phase === "review" ? (
        <div className="space-y-3">
          <p className="text-sm text-muted">{tacticalThemes(puzzle.themes).map(themeLabel).join(" · ")}</p>
          <button type="button" className="h-11 w-full rounded-md border border-[#9f1d14] bg-brass text-sm font-semibold text-white" onClick={() => router.refresh()}>
            Puzzle suivant
          </button>
        </div>
      ) : null}
      <p className="text-xs text-faint">Puzzles Lichess, licence CC0. Puzzle {puzzle.rating}.</p>
    </div>
  );
}
