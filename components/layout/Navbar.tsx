"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { useState } from "react";
import { MobileNavDrawer } from "@/components/layout/MobileNavDrawer";
import type { Route } from "next";

const links = [
  ["Home", "/"],
  ["Tournament", "/tournament"],
  ["Auction", "/auction"],
  ["Players", "/players"],
  ["Standings", "/standings"],
  ["Payment", "/payment"],
  ["Dashboard", "/dashboard"]
] as const satisfies readonly [string, Route][];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-bg/90 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="container-gfl flex h-14 items-center justify-between sm:h-16">
        <Link href="/" className="text-xl font-black uppercase tracking-[0.16em]">
          Play<span className="text-neon">GFL</span>
        </Link>
        <nav className="hidden gap-6 text-xs font-semibold uppercase tracking-[0.16em] md:flex">
          {links.map(([name, href]) => (
            <Link key={href} href={href} className="text-white/70 transition hover:text-neon">
              {name}
            </Link>
          ))}
        </nav>
        <button
          aria-label="Open navigation"
          className="rounded-lg border border-white/20 bg-white/5 p-2 md:hidden"
          onClick={() => setOpen(true)}
        >
          <Menu size={20} />
        </button>
      </div>
      <MobileNavDrawer open={open} onClose={() => setOpen(false)} links={links.map(([label, href]) => ({ label, href }))} />
    </header>
  );
}
