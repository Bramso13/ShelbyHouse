import { TaskBoard } from "@/components/task-board";
import { todayISO } from "@/lib/dates";
import { loadTasks } from "@/lib/queries";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata = { title: "Jour" };

export default async function JourPage() {
  if (!isSupabaseConfigured()) return null;
  const today = todayISO();
  const tasks = await loadTasks(today);
  return <TaskBoard today={today} todayTasks={tasks.today} overdue={tasks.overdue} backlog={tasks.backlog} />;
}
