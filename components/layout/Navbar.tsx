"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { useState } from "react";
import { MobileNavDrawer } from "@/components/layout/MobileNavDrawer";

const links = [
  ["Home", "/"],
  ["Tournament", "/tournament"],
  ["Auction", "/auction"],
  ["Players", "/players"],
  ["Dashboard", "/dashboard"]
] as const;

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-bg/90 backdrop-blur">
      <div className="container-gfl flex h-16 items-center justify-between">
        <Link href="/" className="text-xl font-black tracking-wider">
          GFL <span className="text-neon">BGMI</span>
        </Link>
        <nav className="hidden gap-6 text-sm md:flex">
          {links.map(([name, href]) => (
            <Link key={href} href={href} className="text-white/75 transition hover:text-white">
              {name}
            </Link>
          ))}
        </nav>
        <button
          aria-label="Open navigation"
          className="rounded-lg border border-white/20 p-2 md:hidden"
          onClick={() => setOpen(true)}
        >
          <Menu size={20} />
        </button>
      </div>
      <MobileNavDrawer open={open} onClose={() => setOpen(false)} links={links.map(([label, href]) => ({ label, href }))} />
    </header>
  );
}
