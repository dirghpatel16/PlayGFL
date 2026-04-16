import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { LaunchGate } from "@/components/launch/LaunchGate";
import { isLaunchUnlocked } from "@/lib/config/launch";

export const metadata: Metadata = {
  title: "GFL Season 2 | BGMI League Hub",
  description: "GFL Season 2 tournament hub for registration, auction, standings, and operations",
  metadataBase: new URL("https://gfl-league.vercel.app")
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const unlocked = isLaunchUnlocked();

  return (
    <html lang="en">
      <body>
        <LaunchGate initialUnlocked={unlocked}>
          <Navbar />
          <main className="container-gfl pb-24">{children}</main>
          <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-bg/95 p-3 pb-[calc(env(safe-area-inset-bottom)+12px)] md:hidden">
            <Link href="/auth/signup" className="block border border-neon bg-neon p-3 text-center text-sm font-bold uppercase tracking-[0.14em] text-black">
              Join GFL
            </Link>
          </div>
          <Footer />
        </LaunchGate>
      </body>
    </html>
  );
}
