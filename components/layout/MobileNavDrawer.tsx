"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useEffect } from "react";
import type { Route } from "next";

interface Props {
  open: boolean;
  onClose: () => void;
  links: { label: string; href: Route }[];
}

export function MobileNavDrawer({ open, onClose, links }: Props) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            aria-label="Close navigation"
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-[1px]"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            className="mobile-drawer fixed right-0 top-0 z-50 h-[100dvh] w-[min(88vw,360px)] border-l border-white/10 bg-bg/95 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 pb-4 pt-[calc(env(safe-area-inset-top)+14px)]">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-neon">Menu</p>
              <button aria-label="Close menu" className="rounded-lg border border-white/20 p-2" onClick={onClose}>
                <X size={18} />
              </button>
            </div>

            <nav className="flex h-[calc(100dvh-env(safe-area-inset-top)-80px)] flex-col gap-2 overflow-y-auto px-3 py-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-base font-semibold text-white/90"
                  onClick={onClose}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
