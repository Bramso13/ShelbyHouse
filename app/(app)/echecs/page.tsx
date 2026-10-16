import { redirect } from "next/navigation";
import { RatingGate, Trainer } from "@/components/chess-trainer";
import { themeLabel } from "@/lib/chess";
import { todayISO } from "@/lib/dates";
import { loadChess } from "@/lib/queries";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata = { title: "Échecs" };

export default async function EchecsPage() {
  if (!isSupabaseConfigured()) return null;
  const chess = await loadChess(todayISO());
  if (!chess) redirect("/login");
  if (!chess.rating) return <RatingGate />;

  return (
    <div className="space-y-8">
      {chess.puzzle ? (
        <Trainer key={chess.puzzle.id} puzzle={chess.puzzle} rating={chess.rating} streak={chess.streak} />
      ) : (
        <p>Plus de puzzles disponibles pour ce rating. Si la base est vide, exécute supabase/seed/puzzles.sql.</p>
      )}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Progression</h2>
        <p className="text-muted">
          Précision sur 7 jours : {chess.weekAccuracy == null ? "pas encore de tentative" : `${chess.weekAccuracy} %`}
        </p>
        <Spark values={chess.history} />
        <ul className="space-y-1 text-sm text-muted">
          {chess.themes.map((theme) => (
            <li key={theme.theme} className="flex justify-between gap-3">
              <span>{themeLabel(theme.theme)}</span>
              <span>
                {theme.rate} % · {theme.played}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Spark({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const path = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 100;
      const y = 30 - ((value - min) / span) * 24;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg viewBox="0 0 100 32" className="h-10 w-full text-brass" aria-hidden>
      <path d={path} fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
