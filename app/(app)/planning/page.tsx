import { PlanningBoard } from "@/components/planning-board";
import { isIsoDate, minutesNow, todayISO, weekDates } from "@/lib/dates";
import { loadDayBlocks } from "@/lib/queries";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata = { title: "Planning" };

export default async function PlanningPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  if (!isSupabaseConfigured()) return null;
  const { date: requested } = await searchParams;
  const today = todayISO();
  const date = requested && isIsoDate(requested) ? requested : today;
  const blocks = await loadDayBlocks(date);
  return (
    <PlanningBoard
      date={date}
      today={today}
      week={weekDates(date)}
      blocks={blocks}
      nowMinute={date === today ? minutesNow() : null}
    />
  );
}
