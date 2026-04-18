"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { fetchJSON } from "@/lib/services/http";
import { SpinWheel } from "@/components/auction/SpinWheel";

interface AuctionRuntime {
  id?: string;
  state: "waiting" | "drawing" | "player_reveal" | "bidding" | "sold" | "complete";
  currentPlayer?: { id: string; name: string; role: string; region: string; style: string; base_price: number };
  currentCaptainTurnIndex: number;
  teams: { id: string; name: string; captainId: string; playerIds: string[] }[];
  pot: { id: string; name: string; role: string; base_price: number }[];
  announcerLine: string;
  history: { id: string; playerId?: string; playerName?: string; captainId?: string; state: string; createdAt: string }[];
  captains: { id: string; name: string; tag: string; purse_points: number }[];
  currentBidAmount: number;
  currentBidCaptainId: string | null;
  strikeCount: number;
  bidDeadline: string | null;
}


// ---------- Countdown timer hook ----------
function useCountdown(deadline: string | null) {
  const [secs, setSecs] = useState<number | null>(null);
  useEffect(() => {
    if (!deadline) { setSecs(null); return; }
    const tick = () => {
      const diff = Math.max(0, Math.ceil((new Date(deadline).getTime() - Date.now()) / 1000));
      setSecs(diff);
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [deadline]);
  return secs;
}

export function AuctionStagePanel() {
  const [runtime, setRuntime] = useState<AuctionRuntime | null>(null);
  const [error, setError] = useState("");
  const [isCommissioner, setIsCommissioner] = useState(false);
  const [captainBidInputs, setCaptainBidInputs] = useState<Record<string, string>>({});
  const [bidError, setBidError] = useState("");
  const [basePriceInput, setBasePriceInput] = useState("1");

  // Spinning wheel state — trigger once per reveal
  const [spinKey, setSpinKey] = useState<string | null>(null);
  const [spinDone, setSpinDone] = useState(false);
  const lastRevealedId = useRef<string | null>(null);

  const secsLeft = useCountdown(runtime?.bidDeadline ?? null);

  const load = () => {
    fetchJSON<AuctionRuntime>("/api/auction/state")
      .then((d) => {
        setRuntime(d);
        // Trigger spin wheel when a new player_reveal comes in
        if (d.state === "player_reveal" && d.currentPlayer && d.currentPlayer.id !== lastRevealedId.current) {
          lastRevealedId.current = d.currentPlayer.id;
          setSpinKey(d.currentPlayer.id);
          setSpinDone(false);
          // Pre-fill base price from the drawn player
          setBasePriceInput(String(d.currentPlayer.base_price ?? 1));
        }
        if (d.state !== "player_reveal") {
          setSpinKey(null);
          setSpinDone(false);
        }
      })
      .catch((e) => setError(e.message));
    fetchJSON<{ enabled: boolean }>("/api/commissioner/session").then((d) => setIsCommissioner(d.enabled)).catch(() => setIsCommissioner(false));
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, []);// eslint-disable-line

  const act = async (action: string, extra: Record<string, unknown> = {}) => {
    setError("");
    try {
      await fetchJSON("/api/auction/state", {
        method: "POST",
        body: JSON.stringify({ action, ...extra })
      });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    }
  };

  const placeBidForCaptain = async (captainId: string) => {
    setBidError("");
    const amount = parseInt(captainBidInputs[captainId] ?? "", 10);
    if (!amount || isNaN(amount) || amount <= (runtime?.currentBidAmount ?? 0)) {
      setBidError(`Bid must be higher than current ₹${runtime?.currentBidAmount ?? 0}`);
      return;
    }
    try {
      await act("bid", { captainId, bidAmount: amount });
      setCaptainBidInputs((prev) => ({ ...prev, [captainId]: "" }));
    } catch (err) {
      setBidError(err instanceof Error ? err.message : "Bid failed");
    }
  };

  const isBidding = runtime?.state === "bidding";
  const currentBidCaptainName = runtime?.captains?.find((c) => c.id === runtime.currentBidCaptainId)?.name;
  const potNames = (runtime?.pot ?? []).map((p) => p.name);
  const allCaptains = runtime?.captains ?? [];

  // Danger zone: timer expiring
  const timerDanger = secsLeft !== null && secsLeft <= 5;

  return (
    <section className="space-y-5">
      <div className="event-panel p-5 sm:p-6">
        <p className="eyebrow">Auction — GFL Season 2</p>

        {/* ── Announcer line ── */}
        <p className="mt-3 text-sm uppercase tracking-[0.14em] text-white/70 min-h-[1.4em]">
          {runtime?.announcerLine ?? "Connecting to auction…"}
        </p>
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}

        {/* ── Spinning wheel (player reveal phase) ── */}
        {spinKey && !spinDone && potNames.length > 0 && runtime?.currentPlayer && (
          <div className="mt-6 flex flex-col items-center">
            <SpinWheel
              key={spinKey}
              names={[...(runtime?.pot ?? []).map((p) => p.name), runtime.currentPlayer.name].filter((v, i, a) => a.indexOf(v) === i)}
              targetName={runtime.currentPlayer.name}
              onComplete={() => setSpinDone(true)}
            />
          </div>
        )}

        {/* ── Main content grid ── */}
        {(spinDone || !spinKey || runtime?.state !== "player_reveal") && (
          <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">

            {/* Left: Player spotlight + bid zone */}
            <div className="space-y-4">
              <div className="border border-white/15 bg-black/40 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-white/55">Current player spotlight</p>
                {runtime?.currentPlayer ? (
                  <div className="mt-3 border border-white/20 bg-white/[0.02] p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-neon">Now entering auction</p>
                    <h3 className="mt-1 text-3xl font-black uppercase">{runtime.currentPlayer.name}</h3>
                    <p className="mt-2 text-xs uppercase tracking-[0.14em] text-white/60">
                      {runtime.currentPlayer.role}
                    </p>
                    <p className="mt-1 text-sm font-bold text-neon">Base Price: ₹{runtime.currentPlayer.base_price ?? 1}</p>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-white/50">No active player</p>
                )}
              </div>

              {/* ── Bidding zone ── */}
              {isBidding && (
                <div className="border border-neon/30 bg-neon/5 p-4 space-y-3">
                  {/* Countdown */}
                  <div className="flex items-center gap-3">
                    <span className={`text-5xl font-black tabular-nums transition-colors ${timerDanger ? "text-danger animate-pulse" : "text-neon"}`}>
                      {secsLeft ?? "—"}
                    </span>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-white/60">seconds left</p>
                      {/* Strike indicators */}
                      <div className="flex gap-1 mt-1">
                        {[0, 1, 2].map((i) => (
                          <span key={i} className={`text-lg ${i < (runtime.strikeCount ?? 0) ? "opacity-100" : "opacity-20"}`}>🔨</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Current bid */}
                  <div className="border-t border-white/10 pt-3">
                    {runtime.currentBidCaptainId ? (
                      <p className="text-sm font-bold">
                        Current bid: <span className="text-neon text-lg">₹{runtime.currentBidAmount}</span>
                        <span className="text-white/60 text-xs ml-2">by {currentBidCaptainName}</span>
                      </p>
                    ) : (
                      <p className="text-sm text-white/60">No bids yet. Base: <span className="text-white">₹{runtime.currentBidAmount}</span></p>
                    )}
                  </div>

                  {/* Commissioner bidding panel */}
                  {isCommissioner && (
                    <div className="space-y-2 border-t border-white/10 pt-3">
                      <p className="text-xs uppercase tracking-[0.14em] text-neon">Place bid for captain</p>
                      {allCaptains.map((c) => {
                        const isLeading = c.id === runtime.currentBidCaptainId;
                        const canAfford = c.purse_points > runtime.currentBidAmount;
                        return (
                          <div key={c.id} className={`flex items-center gap-2 rounded p-2 ${isLeading ? "bg-neon/10 border border-neon/30" : "bg-white/5"}`}>
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-bold truncate ${isLeading ? "text-neon" : "text-white/80"}`}>
                                {c.name} {isLeading ? "🏆" : ""}
                              </p>
                              <p className={`text-[10px] ${canAfford ? "text-white/50" : "text-danger/70"}`}>
                                Purse: ₹{c.purse_points}{!canAfford ? " (can't afford)" : ""}
                              </p>
                            </div>
                            <input
                              type="number"
                              min={runtime.currentBidAmount + 1}
                              placeholder={`₹${runtime.currentBidAmount + 1}+`}
                              value={captainBidInputs[c.id] ?? ""}
                              onChange={(e) => setCaptainBidInputs((prev) => ({ ...prev, [c.id]: e.target.value }))}
                              onKeyDown={(e) => e.key === "Enter" && placeBidForCaptain(c.id)}
                              className="w-24 bg-black/60 border border-white/20 px-2 py-1 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-neon"
                              disabled={!canAfford}
                            />
                            <button
                              className="border border-neon/50 bg-neon/10 px-3 py-1 text-xs font-bold text-neon disabled:opacity-30"
                              onClick={() => placeBidForCaptain(c.id)}
                              disabled={!canAfford}
                            >
                              BID
                            </button>
                          </div>
                        );
                      })}
                      {bidError && <p className="text-xs text-danger">{bidError}</p>}
                      <div className="flex gap-2 pt-1">
                        <button className="border border-white/30 bg-white/5 px-3 py-2 text-xs font-bold uppercase" onClick={() => act("hammer")}>
                          🔨 Strike
                        </button>
                        {allCaptains.map((c) => (
                          <button
                            key={c.id}
                            className="border border-orange-400/40 bg-orange-400/10 px-3 py-2 text-xs font-bold uppercase text-orange-300"
                            onClick={() => act("pick", { captainId: c.id })}
                          >
                            Force → {c.tag ?? c.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right: Pot + captains list */}
            <div className="space-y-3">
              <div className="border border-white/15 bg-white/[0.02] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-white/60">Remaining in pot</p>
                <p className="mt-1 text-3xl font-black text-neon">{runtime?.pot.length ?? 0}</p>
                <ul className="mt-3 max-h-36 space-y-1 overflow-auto border-t border-white/10 pt-2 text-xs text-white/75">
                  {runtime?.pot?.length
                    ? runtime.pot.map((p) => (
                        <li key={p.id} className="flex justify-between">
                          <span>• {p.name}</span>
                          <span className="text-white/40">₹{p.base_price ?? 1}</span>
                        </li>
                      ))
                    : <li className="text-white/40">Pot empty</li>}
                </ul>
              </div>

              <div className="border border-white/15 bg-white/[0.02] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-white/60">Captains &amp; purse</p>
                <ul className="mt-2 space-y-2">
                  {allCaptains.map((c) => (
                    <li key={c.id} className="flex items-center justify-between text-xs">
                      <span className={`font-bold uppercase ${c.id === runtime?.currentBidCaptainId ? "text-neon" : "text-white/80"}`}>
                        {c.name} {c.id === runtime?.currentBidCaptainId ? "🏆" : ""}
                      </span>
                      <span className="text-white/55">₹{c.purse_points}</span>
                    </li>
                  ))}
                  {!allCaptains.length && <li className="text-white/40 text-xs">No captains</li>}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ── Commissioner action bar ── */}
        {isCommissioner && (
          <div className="mt-5 border-t border-white/10 pt-4">
            <p className="text-xs uppercase tracking-[0.18em] text-white/50 mb-3">Commissioner Controls</p>
            <div className="flex flex-wrap gap-2">
              {!runtime ? (
                <button className="cta-primary" onClick={() => act("start")}>▶ Start Auction</button>
              ) : runtime.state === "waiting" ? (
                <button className="cta-primary" onClick={() => act("draw_next")}>🎲 Draw First Player</button>
              ) : runtime.state === "player_reveal" ? (
                <>
                  <button className="cta-ghost" onClick={() => act("draw_next")}>🎲 Draw Next</button>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      value={basePriceInput}
                      onChange={(e) => setBasePriceInput(e.target.value)}
                      placeholder="Base ₹"
                      className="w-20 bg-black/60 border border-white/20 px-2 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-neon"
                    />
                    <button className="cta-primary" onClick={() => act("open_bidding", { bidAmount: parseInt(basePriceInput, 10) || 1 })}>💰 Open Bidding</button>
                  </div>
                </>
              ) : runtime.state === "bidding" ? (
                <p className="text-xs text-white/50 italic">Use bidding panel above for strikes &amp; bids</p>
              ) : runtime.state === "sold" ? (
                <button className="cta-primary" onClick={() => act("next")}>▶ Next Player</button>
              ) : runtime.state === "complete" ? null : (
                <button className="cta-ghost" onClick={() => act("draw_next")}>🎲 Draw Player</button>
              )}
              <button className="border border-danger/40 bg-danger/10 px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-danger/80" onClick={() => { if (confirm("Reset the entire auction?")) act("reset"); }}>
                ⚠ Reset
              </button>
              <button className="border border-white/20 px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-white/50" onClick={() => act("close")}>
                Close
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Teams grid ── */}
      <div className="grid gap-3 sm:grid-cols-3">
        {runtime?.teams?.map((team) => {
          const cap = allCaptains.find((c) => c.id === team.captainId);
          return (
            <div className="card p-4" key={team.id}>
              <h3 className="font-semibold uppercase tracking-[0.08em]">{team.name}</h3>
              {cap && <p className="text-xs text-neon mt-0.5">Captain · {cap.name}</p>}
              <p className="mt-1 text-xs text-white/50">{team.playerIds.length}/{3} players</p>
              <ul className="mt-2 space-y-1 text-xs text-white/75">
                {team.playerIds.length
                  ? team.playerIds.map((id) => {
                    const sold = runtime?.history?.find((h) => h.playerId === id);
                    return <li key={id}>• {sold?.playerName ?? id}</li>;
                  })
                  : <li className="text-white/40">No picks yet</li>}
              </ul>
            </div>
          );
        })}
      </div>

      {/* ── History ── */}
      <div className="card p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-white/60">Auction history</p>
        <ul className="mt-3 space-y-1 text-xs text-white/75">
          {runtime?.history?.length
            ? runtime.history.slice(0, 10).map((h) => {
              const cap = allCaptains.find((c) => c.id === h.captainId);
              return (
                <li key={h.id}>
                  • <span className="text-white">{h.playerName ?? "Player"}</span>
                  {cap && <span className="text-neon"> → {cap.name}</span>}
                  <span className="text-white/40"> · {h.state}</span>
                </li>
              );
            })
            : <li className="text-white/40">No history yet</li>}
        </ul>
      </div>
    </section>
  );
}
