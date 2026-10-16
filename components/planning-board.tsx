"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteBlock, saveBlock } from "@/lib/actions/planning";
import { WEEKDAYS, formatLongDate, formatMinute } from "@/lib/dates";
import {
  BLOCK_TYPES,
  blockLabel,
  layoutBlocks,
  type BlockType,
  type BlockView,
} from "@/lib/schedule";

const HOUR = 52;

type Draft = {
  intent: "create" | "update";
  title: string;
  startMinute: number;
  endMinute: number;
  blockType: BlockType;
  customLabel: string;
  scope: "once" | "weekly";
  ruleId: string | null;
  oneOffId: string | null;
};

export function PlanningBoard({
  date,
  today,
  week,
  blocks,
  nowMinute,
}: {
  date: string;
  today: string;
  week: string[];
  blocks: BlockView[];
  nowMinute: number | null;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const laid = layoutBlocks(blocks);

  useEffect(() => {
    const node = scroller.current;
    if (!node) return;
    const anchor = nowMinute ?? 8 * 60;
    node.scrollTop = Math.max(0, (anchor / 1440) * HOUR * 24 - node.clientHeight * 0.35);
  }, [date, nowMinute]);

  function openCreate(event: React.MouseEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest("[data-block]")) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const y = event.clientY - rect.top;
    const minute = Math.max(0, Math.min(23 * 60 + 45, Math.round(((y / (HOUR * 24)) * 1440) / 15) * 15));
    setError(null);
    setDraft({
      intent: "create",
      title: "",
      startMinute: minute,
      endMinute: Math.min(1440, minute + 60),
      blockType: "personal",
      customLabel: "",
      scope: "once",
      ruleId: null,
      oneOffId: null,
    });
  }

  function openBlock(block: BlockView) {
    setError(null);
    setDraft({
      intent: "update",
      title: block.title,
      startMinute: block.startMinute,
      endMinute: block.endMinute,
      blockType: block.blockType,
      customLabel: block.customLabel ?? "",
      scope: "once",
      ruleId: block.ruleId,
      oneOffId: block.oneOffId,
    });
  }

  function persist(next: Draft) {
    startTransition(async () => {
      const result = await saveBlock({
        intent: next.intent,
        scope: next.scope,
        date,
        ruleId: next.ruleId,
        oneOffId: next.oneOffId,
        title: next.title,
        start: formatMinute(next.startMinute),
        end: formatMinute(next.endMinute),
        blockType: next.blockType,
        customLabel: next.customLabel,
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setDraft(null);
      router.refresh();
    });
  }

  function remove(scope: "once" | "weekly") {
    if (!draft) return;
    startTransition(async () => {
      const result = await deleteBlock({
        scope,
        date,
        ruleId: draft.ruleId,
        oneOffId: draft.oneOffId,
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setDraft(null);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">Semaine</p>
          <h1 className="text-[1.35rem] font-semibold tracking-[-0.03em] capitalize">{formatLongDate(date)}</h1>
        </div>
        {date !== today ? (
          <Link href="/planning" className="flex min-h-11 items-center text-sm text-brass">
            Aujourd&apos;hui
          </Link>
        ) : null}
      </div>
      <div className="mb-3 grid grid-cols-7 gap-1">
        {week.map((day, index) => {
          const active = day === date;
          return (
            <Link
              key={day}
              href={`/planning?date=${day}`}
              className={`flex min-h-14 flex-col items-center justify-center rounded-xl text-xs ${
                active ? "border border-[#9f1d14] bg-brass text-white" : day === today ? "border border-brass bg-white text-brass" : "border border-[#b7bec8] bg-white text-muted"
              }`}
            >
              <span>{WEEKDAYS[index]}</span>
              <span className="text-sm font-semibold">{day.slice(8)}</span>
            </Link>
          );
        })}
      </div>
      <div ref={scroller} className="h-[68dvh] overflow-y-auto rounded-md border border-line bg-white">
        <div className="grid grid-cols-[44px_1fr]" style={{ height: HOUR * 24 }}>
          <div className="relative">
            {Array.from({ length: 24 }, (_, hour) => (
              <span
                key={hour}
                className="absolute right-2 -translate-y-1/2 text-[10px] text-faint"
                style={{ top: hour * HOUR }}
              >
                {String(hour).padStart(2, "0")}
              </span>
            ))}
          </div>
          <div className="relative border-l border-line" onClick={openCreate}>
            {Array.from({ length: 24 }, (_, hour) => (
              <div key={hour} className="border-t border-line/70" style={{ height: HOUR }} />
            ))}
            {nowMinute != null ? (
              <div
                className="pointer-events-none absolute right-0 left-0 z-10 h-0.5 bg-brass"
                style={{ top: (nowMinute / 1440) * HOUR * 24 }}
              />
            ) : null}
            {laid.map((block) => (
              <button
                key={block.key}
                type="button"
                data-block
                onClick={(event) => {
                  event.stopPropagation();
                  openBlock(block);
                }}
                className={`block-${block.blockType} absolute z-20 overflow-hidden rounded-sm px-2 py-1 text-left text-xs font-semibold`}
                style={{
                  top: (block.startMinute / 1440) * HOUR * 24,
                  height: Math.max(28, ((block.endMinute - block.startMinute) / 1440) * HOUR * 24 - 2),
                  left: `calc(${block.column} * (100% / ${block.columns}) + 2px)`,
                  width: `calc(100% / ${block.columns} - 4px)`,
                }}
              >
                <span className="block truncate">{block.title}</span>
                <span className="block truncate font-normal opacity-80">
                  {formatMinute(block.startMinute)}–{block.endMinute === 1440 ? "24:00" : formatMinute(block.endMinute)}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
      {draft ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/55" onClick={() => setDraft(null)}>
          <form
            key={`${draft.intent}-${draft.ruleId ?? ""}-${draft.oneOffId ?? ""}-${draft.startMinute}`}
            className="max-h-[88dvh] w-full max-w-lg overflow-y-auto rounded-t-xl bg-white p-4 pb-8 shadow-[0_-12px_40px_rgba(23,25,30,0.12)]"
            role="dialog"
            aria-label={draft.intent === "create" ? "Nouveau créneau" : "Modifier le créneau"}
            onClick={(event) => event.stopPropagation()}
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              persist({
                ...draft,
                title: String(form.get("title") ?? ""),
                startMinute: toMinute(String(form.get("start"))),
                endMinute: toMinute(String(form.get("end")), true, toMinute(String(form.get("start")))),
                blockType: String(form.get("blockType")) as BlockType,
                customLabel: String(form.get("customLabel") ?? ""),
                scope: (form.get("scope") as "once" | "weekly") || "once",
              });
            }}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight">{draft.intent === "create" ? "Nouveau créneau" : draft.title}</h2>
              <button type="button" className="inline-flex h-9 items-center rounded-md border border-[#b7bec8] bg-white px-3 text-sm" onClick={() => setDraft(null)}>
                Fermer
              </button>
            </div>
            <div className="space-y-3">
              <input name="title" defaultValue={draft.title} placeholder="Titre" required className={field} />
              <div className="grid grid-cols-2 gap-2">
                <input name="start" type="time" required defaultValue={formatMinute(draft.startMinute)} className={field} />
                <input
                  name="end"
                  type="time"
                  required
                  defaultValue={formatMinute(draft.endMinute)}
                  className={field}
                />
              </div>
              <select name="blockType" defaultValue={draft.blockType} className={field}>
                {BLOCK_TYPES.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.label}
                  </option>
                ))}
              </select>
              <input
                name="customLabel"
                defaultValue={draft.customLabel}
                placeholder="Libellé libre, si tu choisis ce type"
                className={field}
              />
              <fieldset className="grid grid-cols-2 gap-2">
                <label className={choice}>
                  <input type="radio" name="scope" value="once" defaultChecked={draft.scope === "once"} />
                  Seulement ce jour
                </label>
                <label className={choice}>
                  <input type="radio" name="scope" value="weekly" defaultChecked={draft.scope === "weekly"} />
                  Toutes les semaines
                </label>
              </fieldset>
              {error ? <p className="text-sm text-clay">{error}</p> : null}
              <button disabled={pending} className="h-11 w-full rounded-md border border-[#9f1d14] bg-brass text-sm font-semibold text-white">
                {pending ? "Enregistrement…" : "Enregistrer"}
              </button>
              {draft.intent === "update" ? (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={pending}
                    className="h-11 rounded-md border border-line bg-white text-sm"
                    onClick={() => remove("once")}
                  >
                    Retirer ce jour
                  </button>
                  {draft.ruleId ? (
                    <button
                      type="button"
                      disabled={pending}
                      className="h-11 rounded-md border border-line bg-white text-sm text-clay"
                      onClick={() => remove("weekly")}
                    >
                      Retirer la série
                    </button>
                  ) : (
                    <span />
                  )}
                </div>
              ) : null}
              <p className="text-xs text-faint">{blockLabel(draft.blockType, draft.customLabel || null)}</p>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

const field = "h-11 w-full rounded-md border border-line bg-white px-3 text-paper outline-none focus:border-brass";
const choice = "flex min-h-11 items-center gap-2 rounded-md border border-line bg-white px-3 text-sm";

function toMinute(value: string, end = false, start = 0): number {
  const [hour, minute] = value.split(":").map(Number);
  const total = hour * 60 + minute;
  if (end && total === 0 && start > 0) return 1440;
  return total;
}
