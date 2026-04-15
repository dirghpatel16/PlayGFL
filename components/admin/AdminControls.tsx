export function AdminControls() {
  const actions = [
    "Approve player profiles",
    "Add / remove captains",
    "Manage auction pool",
    "Start / pause / reset auction",
    "Edit tournament rules and schedule",
    "Publish announcements",
    "Toggle registration"
  ];

  return (
    <section className="card p-5">
      <h2 className="text-2xl font-bold">Admin Control Center</h2>
      <div className="mt-4 grid gap-2">
        {actions.map((action) => (
          <button key={action} className="rounded-xl bg-white/5 p-3 text-left text-sm hover:bg-white/10">
            {action}
          </button>
        ))}
      </div>
    </section>
  );
}
