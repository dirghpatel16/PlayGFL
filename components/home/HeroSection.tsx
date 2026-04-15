import Link from "next/link";

export function HeroSection() {
  return (
    <section className="pt-10">
      <div className="card overflow-hidden p-6 sm:p-10">
        <p className="text-xs uppercase tracking-[0.2em] text-neon">Gand Faad League • BGMI</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight sm:text-6xl">India&apos;s Next Elite Battleground is Here.</h1>
        <p className="mt-4 max-w-2xl text-sm text-white/75 sm:text-base">
          Register, verify, create your player identity, and enter a premium captain draft ecosystem built for competitive BGMI talent.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:flex">
          <Link className="rounded-xl bg-accent px-4 py-3 text-center font-semibold" href="/auth/signup">Join Now</Link>
          <Link className="rounded-xl bg-white/10 px-4 py-3 text-center font-semibold" href="/players">View Players</Link>
          <Link className="rounded-xl bg-white/10 px-4 py-3 text-center font-semibold" href="/auction">Auction Pool</Link>
          <Link className="rounded-xl bg-white/10 px-4 py-3 text-center font-semibold" href="/tournament">Schedule</Link>
        </div>
      </div>
    </section>
  );
}
