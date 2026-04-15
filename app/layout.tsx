import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { headers } from "next/headers";

export const metadata: Metadata = {
  title: "GFL BGMI League",
  description: "Gand Faad League official esports tournament platform",
  metadataBase: new URL("https://gfl-league.vercel.app")
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = headers().get("x-gfl-pathname") ?? "";
  const isLaunchScreen = pathname === "/launch";

  return (
    <html lang="en">
      <body>
        {!isLaunchScreen && <Navbar />}
        <main className={isLaunchScreen ? "" : "container-gfl pb-24"}>{children}</main>

        {!isLaunchScreen && (
          <>
            <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-bg/95 p-3 md:hidden">
              <Link href="/auth/signup" className="block border border-neon bg-neon p-3 text-center text-sm font-bold uppercase tracking-[0.14em] text-black">
                Join GFL Now
              </Link>
            </div>
            <Footer />
          </>
        )}
      </body>
    </html>
  );
}
