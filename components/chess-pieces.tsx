/** Pièces Cburnett (Lichess). Licence dans public/pieces/cburnett/LICENSE. */
const piece = {
  k: "K",
  q: "Q",
  r: "R",
  b: "B",
  n: "N",
  p: "P",
} as const;

export function PieceIcon({
  type,
  color,
}: {
  type: "k" | "q" | "r" | "b" | "n" | "p";
  color: "w" | "b";
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- icône SVG, pas une photo
    <img
      src={`/pieces/cburnett/${color}${piece[type]}.svg`}
      alt=""
      draggable={false}
      className="pointer-events-none h-full w-full select-none"
    />
  );
}
