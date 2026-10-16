import { redirect } from "next/navigation";
import { Nav } from "@/components/nav";
import { SchemaMissing } from "@/components/setup";
import { signOut } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");
  const { error } = await supabase.rpc("ensure_account");
  if (error) {
    console.error(error);
    return <SchemaMissing />;
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col lg:grid lg:max-w-5xl lg:grid-cols-[200px_minmax(0,1fr)]">
      <Nav />
      <div className="flex min-h-dvh flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-line bg-white/90 px-4 backdrop-blur">
          <p className="text-[15px] font-semibold tracking-[-0.04em]">Shelby</p>
          <form action={signOut}>
            <button className="inline-flex h-9 items-center rounded-md border border-[#b7bec8] bg-white px-3 text-sm">Sortir</button>
          </form>
        </header>
        <main className="flex-1 px-4 pt-5 pb-28 lg:pb-10">{children}</main>
      </div>
    </div>
  );
}
