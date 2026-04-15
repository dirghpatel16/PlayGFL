import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Analytics } from '@vercel/analytics/next';

export const metadata: Metadata = {
  title: "GFL BGMI League",
  description: "Gand Faad League official esports tournament platform"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main className="container-gfl pb-24">{children}</main>
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-bg/95 p-3 md:hidden">
          <a href="/auth/signup" className="block rounded-xl bg-accent p-3 text-center text-sm font-semibold">Join GFL Now</a>
        </div>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
