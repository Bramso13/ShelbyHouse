import { redirect } from "next/navigation";
import { LifeBoard } from "@/components/life-board";
import { todayISO } from "@/lib/dates";
import { loadLife } from "@/lib/queries";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata = { title: "Vie" };

export default async function ViePage() {
  if (!isSupabaseConfigured()) return null;
  const today = todayISO();
  const life = await loadLife(today);
  if (!life) redirect("/login");
  return <LifeBoard today={today} {...life} />;
}
