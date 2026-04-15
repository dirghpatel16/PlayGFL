"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  open: boolean;
  onClose: () => void;
  links: { label: string; href: string }[];
}

export function MobileNavDrawer({ open, onClose, links }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button className="fixed inset-0 z-40 bg-black/70" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.aside
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 220, damping: 24 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl border border-white/10 bg-card p-6"
          >
            <div className="mx-auto mb-4 h-1.5 w-16 rounded-full bg-white/20" />
            <div className="grid gap-4">
              {links.map((link) => (
                <Link key={link.href} href={link.href} className="rounded-xl bg-white/5 p-3 text-lg" onClick={onClose}>
                  {link.label}
                </Link>
              ))}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
