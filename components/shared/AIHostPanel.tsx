"use client";

import { useMemo } from "react";

const lines = [
  "Welcome to GFL. The battleground is almost ready.",
  "Next in the auction pool: ShadowOP, a flexible fragger with aggressive playstyle.",
  "Captain Raven locks in ClutchBhai. Big pickup.",
  "Tournament goes live soon. Stay sharp, warriors."
];

export function AIHostPanel({ dynamicLine }: { dynamicLine?: string }) {
  const finalLines = useMemo(() => (dynamicLine ? [dynamicLine, ...lines.slice(0, 3)] : lines), [dynamicLine]);

  return (
    <section className="card mt-6 p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-neon">AI Host • Beta</p>
      <h3 className="mt-2 text-xl font-bold">Arena Announcer</h3>
      <div className="mt-4 space-y-3 text-sm text-white/80">
        {finalLines.map((line) => (
          <p key={line} className="rounded-xl bg-white/5 p-3">
            {line}
          </p>
        ))}
      </div>
    </section>
  );
}
