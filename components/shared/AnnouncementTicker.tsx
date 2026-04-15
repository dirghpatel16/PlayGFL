"use client";

import { Announcement } from "@/lib/types/models";

export function AnnouncementTicker({ announcements }: { announcements: Announcement[] }) {
  if (!announcements.length) {
    return (
      <div className="card mt-6 py-3 px-4 text-sm text-white/70">
        No announcements yet. Admin posts will appear here live.
      </div>
    );
  }

  const loopedAnnouncements = [...announcements, ...announcements].map((a, index) => ({
    ...a,
    loopKey: `${a.id}-${index}`
  }));

  return (
    <div className="card mt-6 overflow-hidden py-3">
      <div className="animate-[marquee_20s_linear_infinite] whitespace-nowrap px-4 text-sm text-white/90 [@keyframes_marquee]{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}">
        {loopedAnnouncements.map((a) => (
          <span key={a.loopKey} className="mr-8">
            🔊 {a.title}: {a.body}
          </span>
        ))}
      </div>
    </div>
  );
}
