"use client";

export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="space-y-4">
      <h1 className="text-[1.7rem] font-semibold tracking-[-0.04em]">Impossible de charger cette section.</h1>
      <button type="button" onClick={reset} className="h-11 rounded-md border border-[#9f1d14] bg-brass px-5 text-sm font-semibold text-white">
        Réessayer
      </button>
    </div>
  );
}
