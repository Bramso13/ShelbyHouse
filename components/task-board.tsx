"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTask, deleteTask, moveTask, setTaskDone } from "@/lib/actions/tasks";
import { todayISO } from "@/lib/dates";
import type { TaskItem } from "@/lib/queries";

export function TaskBoard({
  todayTasks,
  overdue,
  backlog,
  today,
}: {
  todayTasks: TaskItem[];
  overdue: TaskItem[];
  backlog: TaskItem[];
  today: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [bucket, setBucket] = useState<"today" | "backlog">("today");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(work: () => Promise<{ ok: boolean; message?: string }>) {
    startTransition(async () => {
      try {
        const result = await work();
        if (!result.ok) {
          setError(result.message ?? "Enregistrement impossible. Réessaie.");
          router.refresh();
          return;
        }
        setError(null);
        router.refresh();
      } catch {
        setError("Enregistrement impossible. Réessaie.");
      }
    });
  }

  const open = todayTasks.filter((task) => !task.completed_at);
  const done = todayTasks.filter((task) => task.completed_at);

  return (
    <div className="space-y-6">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">Aujourd&apos;hui</p>
        <h1 className="text-[1.7rem] font-semibold tracking-[-0.04em]">Le jour</h1>
      </header>
      <form
        className="space-y-2"
        onSubmit={(event) => {
          event.preventDefault();
          const next = title;
          setTitle("");
          run(() => createTask({ title: next, bucket }));
        }}
      >
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Ajouter une tâche"
          className="h-11 w-full rounded-md border border-line bg-white px-3 outline-none focus:border-brass"
        />
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className={bucket === "today" ? activeChoice : idleChoice}
            onClick={() => setBucket("today")}
          >
            Aujourd&apos;hui
          </button>
          <button
            type="button"
            className={bucket === "backlog" ? activeChoice : idleChoice}
            onClick={() => setBucket("backlog")}
          >
            À planifier
          </button>
        </div>
        <button disabled={pending || !title.trim()} className="h-11 w-full rounded-md border border-[#9f1d14] bg-brass text-sm font-semibold text-white">
          Ajouter
        </button>
      </form>
      {error ? <p className="text-sm text-clay">{error}</p> : null}
      <TaskSection title="En retard" empty="Rien en retard.">
        {overdue.map((task) => (
          <TaskRow key={task.id} task={task} today={today} pending={pending} run={run} overdue />
        ))}
      </TaskSection>
      <TaskSection title="À faire" empty="La journée est libre.">
        {open.map((task) => (
          <TaskRow key={task.id} task={task} today={today} pending={pending} run={run} />
        ))}
      </TaskSection>
      <TaskSection title="Terminées" empty="">
        {done.map((task) => (
          <TaskRow key={task.id} task={task} today={today} pending={pending} run={run} />
        ))}
      </TaskSection>
      <TaskSection title="À planifier" empty="Le bac est vide.">
        {backlog.map((task) => (
          <TaskRow key={task.id} task={task} today={today} pending={pending} run={run} backlog />
        ))}
      </TaskSection>
    </div>
  );
}

function TaskSection({ title, empty, children }: { title: string; empty: string; children: React.ReactNode }) {
  const list = Array.isArray(children) ? children : [children];
  const count = list.filter(Boolean).length;
  return (
    <section>
      <h2 className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-faint">{title}</h2>
      <div>
        {count ? (
          <div className="overflow-hidden rounded-md border border-line bg-white">{children}</div>
        ) : empty ? (
          <p className="text-sm text-faint">{empty}</p>
        ) : null}
      </div>
    </section>
  );
}

function TaskRow({
  task,
  today,
  pending,
  overdue,
  backlog,
  run,
}: {
  task: TaskItem;
  today: string;
  pending: boolean;
  overdue?: boolean;
  backlog?: boolean;
  run: (work: () => Promise<{ ok: boolean; message?: string }>) => void;
}) {
  return (
    <article className="border-b border-line px-3 py-2 last:border-b-0">
      <div className="flex items-start gap-2">
        <button
          type="button"
          aria-label={task.completed_at ? "Remettre à faire" : "Terminer"}
          disabled={pending}
          onClick={() => run(() => setTaskDone(task.id, !task.completed_at))}
          className={`mt-1 h-6 w-6 shrink-0 rounded-full border-2 ${task.completed_at ? "border-[#9f1d14] bg-brass" : "border-paper bg-white"}`}
        />
        <p className={`min-h-11 flex-1 pt-0.5 ${task.completed_at ? "text-faint line-through" : ""}`}>{task.title}</p>
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => deleteTask(task.id))}
          className="inline-flex h-9 items-center rounded-md border border-[#b7bec8] bg-white px-3 text-sm"
        >
          Retirer
        </button>
      </div>
      <div className="mt-1 flex items-center gap-2 pl-8">
        {overdue || backlog ? (
          <button
            type="button"
            disabled={pending}
            className="inline-flex h-9 items-center rounded-md border border-brass bg-white px-3 text-sm font-medium text-brass"
            onClick={() => run(() => moveTask(task.id, todayISO() || today))}
          >
            Passer à aujourd&apos;hui
          </button>
        ) : null}
        <input
          type="date"
          defaultValue={task.scheduled_date ?? ""}
          aria-label="Déplacer à une date"
          className="h-9 rounded-md border border-line bg-panel-2 px-2 font-mono text-xs"
          onChange={(event) => {
            const value = event.target.value;
            run(() => moveTask(task.id, value || null));
          }}
        />
      </div>
    </article>
  );
}

const activeChoice = "h-10 rounded-md border border-[#9f1d14] bg-brass text-sm font-medium text-white";
const idleChoice = "h-10 rounded-md border border-[#b7bec8] bg-white text-sm text-muted";
