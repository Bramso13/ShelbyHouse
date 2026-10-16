"use client";

import { useMemo, useState } from "react";
import { Chess, type Square } from "chess.js";
import { applyUci } from "@/lib/chess";
import { PieceIcon } from "@/components/chess-pieces";

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"];

export function ChessBoard({
  fen,
  interactive,
  onMove,
}: {
  fen: string;
  interactive: boolean;
  onMove: (uci: string) => void;
}) {
  const chess = useMemo(() => new Chess(fen), [fen]);
  const [selection, setSelection] = useState<{ fen: string; square: string } | null>(null);
  const [promo, setPromo] = useState<{ fen: string; from: string; to: string } | null>(null);
  const selected = selection?.fen === fen ? selection.square : null;
  const pendingPromo = promo?.fen === fen ? promo : null;
  const orientation = chess.turn();
  const files = orientation === "w" ? FILES : [...FILES].reverse();
  const ranks = orientation === "w" ? RANKS : [...RANKS].reverse();
  const legal = selected ? chess.moves({ square: selected as Square, verbose: true }) : [];

  function choose(square: string) {
    if (!interactive) return;
    if (selected) {
      const matches = legal.filter((move) => move.to === square);
      if (matches.length > 1) {
        setPromo({ fen, from: selected, to: square });
        return;
      }
      if (matches.length === 1) {
        const move = matches[0];
        onMove(`${move.from}${move.to}${move.promotion ?? ""}`);
        setSelection(null);
        return;
      }
    }
    const piece = chess.get(square as Square);
    if (piece && piece.color === chess.turn()) setSelection({ fen, square });
    else setSelection(null);
  }

  return (
    <div>
      <div className="flex gap-1.5">
        <div className="flex w-3 flex-col">
          {ranks.map((rank) => (
            <span key={rank} className="flex flex-1 items-center justify-center font-mono text-[10px] text-faint">
              {rank}
            </span>
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <div
            className="grid grid-cols-8 gap-px overflow-hidden rounded-md border-2 border-[#3d2918] bg-[#3d2918] p-px shadow-[0_10px_28px_rgba(23,25,30,0.18)]"
            style={{ touchAction: "manipulation" }}
          >
          {ranks.flatMap((rank) =>
            files.map((file) => {
              const square = `${file}${rank}`;
              const piece = chess.get(square as Square);
              const dark = (FILES.indexOf(file) + Number(rank)) % 2 === 0;
              const target = legal.find((move) => move.to === square);
              return (
                <button
                  key={square}
                  type="button"
                  aria-label={piece ? `${square}, ${piece.color === "w" ? "blanc" : "noir"} ${piece.type}` : square}
                  onClick={() => choose(square)}
                  className={`relative flex aspect-square items-center justify-center ${
                    dark ? "square-dark" : "square-light"
                  } ${selected === square ? "z-10 shadow-[inset_0_0_0_3px_#e23d2b]" : ""}`}
                >
                  {target && !piece ? (
                    <span className="h-3.5 w-3.5 rounded-full border-2 border-[#1a120c]/80 bg-[#fffdf8]" />
                  ) : null}
                  {target && piece ? <span className="absolute inset-1 rounded-full border-[3px] border-brass" /> : null}
                  {piece ? <PieceIcon type={piece.type} color={piece.color} /> : null}
                </button>
              );
            }),
          )}
          </div>
          <div className="mt-1 grid grid-cols-8">
            {files.map((file) => (
              <span key={file} className="text-center font-mono text-[10px] text-faint">
                {file}
              </span>
            ))}
          </div>
        </div>
      </div>
      {pendingPromo ? (
        <div className="mt-2 grid grid-cols-4 gap-2">
          {(["q", "r", "b", "n"] as const).map((type) => (
            <button
              key={type}
              type="button"
              className="flex h-14 items-center justify-center rounded-md border border-[#b7bec8] bg-white"
              onClick={() => {
                onMove(`${pendingPromo.from}${pendingPromo.to}${type}`);
                setPromo(null);
                setSelection(null);
              }}
            >
              <span className="block h-10 w-10">
                <PieceIcon type={type} color={chess.turn()} />
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function previewFen(fen: string, moves: string[]): string {
  const chess = new Chess(fen);
  for (const uci of moves) applyUci(chess, uci);
  return chess.fen();
}
