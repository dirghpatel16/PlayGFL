import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-white/10 py-10">
      <div className="container-gfl grid gap-4 text-sm text-white/70 sm:grid-cols-2">
        <p>© 2026 GFL</p>
        <div className="flex flex-wrap gap-4 sm:justify-end">
          <a aria-label="GFL Instagram" href="https://www.instagram.com/playgfl?igsh=dGppa2tkenVoaDV3" target="_blank" rel="noopener noreferrer" className="transition hover:text-neon focus:outline-none focus:ring-2 focus:ring-neon rounded">
            Instagram
          </a>
          <a aria-label="GFL Discord" href="https://discord.gg/XzgMJMK3" target="_blank" rel="noopener noreferrer" className="transition hover:text-neon focus:outline-none focus:ring-2 focus:ring-neon rounded">
            Discord
          </a>
          <Link href="/rules" className="transition hover:text-neon focus:outline-none focus:ring-2 focus:ring-neon rounded">Rules & Scoring</Link>
          <Link href="/standings" className="transition hover:text-neon focus:outline-none focus:ring-2 focus:ring-neon rounded">Standings</Link>
        </div>
      </div>
    </footer>
  );
}
