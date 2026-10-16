"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addHabit,
  addMetric,
  addSportType,
  archiveHabit,
  deleteMetric,
  deleteSession,
  deleteWeight,
  renameHabit,
  saveMetricValue,
  saveSession,
  saveSleep,
  saveWeight,
  toggleHabit,
} from "@/lib/actions/life";
import { addDays } from "@/lib/dates";
import { INTENSITIES } from "@/lib/schedule";
import type { ActionResult } from "@/lib/action";
import type { Habit, HabitLog, MetricDefinition, MetricEntry, SleepEntry, SportSession, SportType, WeightEntry } from "@/lib/queries";

const field = "h-11 w-full rounded-md border border-line bg-white px-3 outline-none focus:border-brass";

export function LifeBoard({
  today,
  types,
  sessions,
  weights,
  sleeps,
  habits,
  logs,
  metrics,
  entries,
}: {
  today: string;
  types: SportType[];
  sessions: SportSession[];
  weights: WeightEntry[];
  sleeps: SleepEntry[];
  habits: Habit[];
  logs: HabitLog[];
  metrics: MetricDefinition[];
  entries: MetricEntry[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const days = Array.from({ length: 30 }, (_, index) => addDays(today, index - 29));
  const weightToday = weights.find((entry) => entry.entry_date === today);
  const sleepToday = sleeps.find((entry) => entry.wake_date === today);

  function run(work: () => Promise<ActionResult>) {
    startTransition(async () => {
      try {
        const result = await work();
        if (!result.ok) {
          setError(result.message);
          return;
        }
        setError(null);
        router.refresh();
      } catch {
        setError("Enregistrement impossible. Réessaie.");
      }
    });
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">Trente jours</p>
        <h1 className="text-[1.7rem] font-semibold tracking-[-0.04em]">La vie</h1>
      </header>
      {error ? <p className="text-sm text-clay">{error}</p> : null}

      <Section title="Poids">
        <form
          className="grid grid-cols-[1fr_auto] gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            run(() => saveWeight({ date: String(form.get("date")), kg: Number(form.get("kg")) }));
          }}
        >
          <input name="kg" type="number" min="1" max="499" step="0.1" required defaultValue={weightToday?.kg ?? ""} placeholder="kg" className={field} />
          <input name="date" type="date" required defaultValue={today} className={field} />
          <button disabled={pending} className="col-span-2 h-11 rounded-md border border-[#9f1d14] bg-brass text-sm font-semibold text-white">
            Enregistrer
          </button>
        </form>
        <Sparkline values={weights.map((entry) => Number(entry.kg))} />
        <History
          rows={[...weights].reverse().map((entry) => ({
            key: entry.entry_date,
            label: `${entry.entry_date} · ${entry.kg} kg`,
            onDelete: () => run(() => deleteWeight(entry.entry_date)),
          }))}
        />
      </Section>

      <Section title="Sommeil">
        <form
          className="space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            run(() =>
              saveSleep({
                date: String(form.get("date")),
                hours: Number(form.get("hours")),
                quality: Number(form.get("quality")),
              }),
            );
          }}
        >
          <div className="grid grid-cols-2 gap-2">
            <input name="hours" type="number" min="0.25" max="24" step="0.25" required defaultValue={sleepToday?.hours ?? ""} placeholder="Heures" className={field} />
            <input name="date" type="date" required defaultValue={today} className={field} />
          </div>
          <select name="quality" defaultValue={sleepToday?.quality ?? 3} className={field} aria-label="Qualité">
            {[1, 2, 3, 4, 5].map((score) => (
              <option key={score} value={score}>
                Qualité {score}
              </option>
            ))}
          </select>
          <button disabled={pending} className="h-11 w-full rounded-md border border-[#9f1d14] bg-brass text-sm font-semibold text-white">
            Enregistrer la nuit
          </button>
        </form>
        <History
          rows={[...sleeps].reverse().map((entry) => ({
            key: entry.wake_date,
            label: `${entry.wake_date} · ${entry.hours} h · ${entry.quality}/5`,
          }))}
        />
      </Section>

      <Section title="Sport">
        <form
          className="space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            run(() =>
              saveSession({
                typeId: String(form.get("typeId")),
                date: String(form.get("date")),
                durationMin: Number(form.get("duration")),
                intensity: String(form.get("intensity")),
              }),
            );
          }}
        >
          <select name="typeId" required className={field} defaultValue={types[0]?.id}>
            {types.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input name="duration" type="number" min="1" max="1440" required placeholder="Minutes" className={field} />
            <input name="date" type="date" required defaultValue={today} className={field} />
          </div>
          <select name="intensity" className={field} defaultValue="moderate">
            {INTENSITIES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
          <button disabled={pending} className="h-11 w-full rounded-md border border-[#9f1d14] bg-brass text-sm font-semibold text-white">
            Ajouter la séance
          </button>
        </form>
        <form
          className="mt-2 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const name = String(new FormData(form).get("name") ?? "");
            form.reset();
            run(() => addSportType(name));
          }}
        >
          <input name="name" placeholder="Nouveau type" className={field} />
          <button className="h-11 shrink-0 rounded-md border border-line bg-white px-4 text-sm">Ajouter</button>
        </form>
        <History
          rows={sessions.map((session) => ({
            key: session.id,
            label: `${session.session_date} · ${session.name} · ${session.duration_min} min`,
            onDelete: () => run(() => deleteSession(session.id)),
          }))}
        />
      </Section>

      <Section title="Habitudes">
        <ul className="space-y-3">
          {habits.map((habit) => {
            const doneToday = logs.some((log) => log.habit_id === habit.id && log.log_date === today && log.done);
            const doneCount = days.filter((day) =>
              logs.some((log) => log.habit_id === habit.id && log.log_date === day && log.done),
            ).length;
            return (
              <li key={habit.id} className="rounded-md border border-line bg-white p-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    aria-pressed={doneToday}
                    disabled={pending}
                    onClick={() => run(() => toggleHabit(habit.id, today, !doneToday))}
                    className={`h-8 w-8 shrink-0 rounded-full border-2 ${doneToday ? "border-[#9f1d14] bg-brass" : "border-paper bg-white"}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate">{habit.name}</p>
                    <p className="text-xs text-faint">{doneCount} / 30</p>
                  </div>
                  <button type="button" className="inline-flex h-9 items-center rounded-md border border-[#b7bec8] bg-white px-3 text-sm" onClick={() => run(() => archiveHabit(habit.id))}>
                    Archiver
                  </button>
                </div>
                <div className="mt-2 flex gap-1">
                  {days.map((day) => {
                    const done = logs.some((log) => log.habit_id === habit.id && log.log_date === day && log.done);
                    return <span key={day} className={`h-2 flex-1 rounded-full ${done ? "bg-brass" : "bg-line"}`} />;
                  })}
                </div>
                <form
                  className="mt-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const name = String(new FormData(event.currentTarget).get("name") ?? "");
                    run(() => renameHabit(habit.id, name));
                  }}
                >
                  <input name="name" defaultValue={habit.name} aria-label={`Renommer ${habit.name}`} className={field} />
                  <button className="mt-2 inline-flex h-10 items-center rounded-md border border-[#b7bec8] bg-white px-3 text-sm">Renommer</button>
                </form>
              </li>
            );
          })}
        </ul>
        <form
          className="mt-2 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const name = String(new FormData(form).get("name") ?? "");
            form.reset();
            run(() => addHabit(name));
          }}
        >
          <input name="name" placeholder="Nouvelle habitude" className={field} />
          <button className="h-11 shrink-0 rounded-md border border-line bg-white px-4 text-sm">Ajouter</button>
        </form>
      </Section>

      <Section title="Mesures libres">
        {metrics.map((metric) => {
          const values = entries.filter((entry) => entry.definition_id === metric.id);
          return (
            <article key={metric.id} className="mb-4 rounded-md border border-line bg-white p-3">
              <div className="mb-2 flex items-center justify-between">
                <h3>
                  {metric.name} <span className="text-faint">{metric.unit}</span>
                </h3>
                <button type="button" className="inline-flex h-9 items-center rounded-md border border-[#b7bec8] bg-white px-3 text-sm" onClick={() => run(() => deleteMetric(metric.id))}>
                  Retirer
                </button>
              </div>
              <form
                className="grid grid-cols-[1fr_auto] gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  const form = new FormData(event.currentTarget);
                  run(() =>
                    saveMetricValue({
                      definitionId: metric.id,
                      date: String(form.get("date")),
                      value: Number(form.get("value")),
                    }),
                  );
                }}
              >
                <input name="value" type="number" step="any" required placeholder="Valeur" className={field} />
                <input name="date" type="date" required defaultValue={today} className={field} />
                <button className="col-span-2 h-11 rounded-md border border-[#9f1d14] bg-brass text-sm font-semibold text-white">Noter</button>
              </form>
              <Sparkline values={values.map((entry) => Number(entry.value))} />
              <History
                rows={[...values].reverse().map((entry) => ({
                  key: entry.entry_date,
                  label: `${entry.entry_date} · ${entry.value} ${metric.unit}`,
                }))}
              />
            </article>
          );
        })}
        <form
          className="grid grid-cols-2 gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const data = new FormData(form);
            form.reset();
            run(() => addMetric({ name: String(data.get("name") ?? ""), unit: String(data.get("unit") ?? "") }));
          }}
        >
          <input name="name" placeholder="Nom" className={field} />
          <input name="unit" placeholder="Unité" className={field} />
          <button className="col-span-2 h-11 rounded-md border border-line bg-white">Créer la mesure</button>
        </form>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

function History({ rows }: { rows: { key: string; label: string; onDelete?: () => void }[] }) {
  if (!rows.length) return <p className="text-sm text-faint">Rien sur les 30 derniers jours.</p>;
  return (
    <ul className="space-y-1 text-sm text-muted">
      {rows.slice(0, 8).map((row) => (
        <li key={row.key} className="flex items-center justify-between gap-3">
          <span>{row.label}</span>
          {row.onDelete ? (
            <button type="button" className="inline-flex h-8 items-center rounded-md border border-[#b7bec8] bg-white px-2 text-xs" onClick={row.onDelete}>
              Retirer
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function Sparkline({ values }: { values: number[] }) {
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
      <path d={path} fill="none" stroke="currentColor" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
