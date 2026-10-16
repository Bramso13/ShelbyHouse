import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default function HomePage() {
  if (!isSupabaseConfigured()) return null;
  redirect("/jour");
}
