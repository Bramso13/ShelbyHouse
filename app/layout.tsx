import type { Metadata } from "next";
import { IBM_Plex_Mono, Schibsted_Grotesk } from "next/font/google";
import { SetupGuide } from "@/components/setup";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import "./globals.css";

const sans = Schibsted_Grotesk({
  subsets: ["latin"],
  variable: "--font-schibsted",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
});

export const metadata: Metadata = {
  title: { default: "Shelby", template: "%s · Shelby" },
  description: "Journée, tâches, suivi et tactiques d'échecs.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${sans.variable} ${mono.variable} h-full antialiased`}>
      <body className="min-h-dvh">
        {isSupabaseConfigured() ? children : <SetupGuide />}
      </body>
    </html>
  );
}
