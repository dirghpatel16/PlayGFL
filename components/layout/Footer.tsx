import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-white/10 py-10">
      <div className="container-gfl grid gap-4 text-sm text-white/70 sm:grid-cols-2">
        <p>© 2026 PlayGFL</p>
        <div className="flex flex-wrap gap-4 sm:justify-end">
          <a href="https://www.instagram.com/playgfl?igsh=dGppa2tkenVoaDV3" target="_blank" rel="noopener noreferrer" className="transition hover:text-neon">
            Instagram
          </a>
          <a href="https://discord.gg/XzgMJMK3" target="_blank" rel="noopener noreferrer" className="transition hover:text-neon">
            Discord
          </a>
          <Link href="/tournament" className="transition hover:text-neon">Rules</Link>
          <Link href="/players" className="transition hover:text-neon">Community</Link>
        </div>
      </div>
    </footer>
  );
}
