import { CommissionerPanel } from "@/components/commissioner/CommissionerPanel";

export function AdminControls() {
  return (
    <section className="space-y-4">
      <div className="card p-5">
        <h2 className="text-2xl font-bold">GFL Commissioner Console</h2>
        <p className="mt-2 text-sm text-white/70">Lightweight operations mode for small-organizer workflows. No heavy role management.</p>
      </div>
      <CommissionerPanel />
    </section>
  );
}
