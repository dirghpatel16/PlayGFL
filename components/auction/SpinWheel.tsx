"use client";

import { useEffect, useRef } from "react";

interface SpinWheelProps {
  names: string[];
  targetName: string;
  onComplete: () => void;
}

const COLORS = ["#0f172a", "#172033", "#0d1a2d", "#111827", "#0a1628"];
const SPIN_DURATION = 4000;

export function SpinWheel({ names, targetName, onComplete }: SpinWheelProps) {
  const svgRef = useRef<SVGGElement>(null);
  const rafRef = useRef<number>();

  const n = Math.max(names.length, 1);
  const SIZE = 320;
  const CENTER = SIZE / 2;
  const RADIUS = CENTER - 8;
  const segDeg = 360 / n;
  const targetIndex = names.indexOf(targetName);

  useEffect(() => {
    if (targetIndex === -1) {
      onComplete();
      return;
    }

    // We want the target segment centred at the top (the arrow at 270° in SVG coords = -90°)
    // Segment i spans from i*segDeg to (i+1)*segDeg measured from the -90° start point.
    // Centre of segment i is at (-90 + (i + 0.5) * segDeg)°
    // We want that centred at -90° → offset = -(i + 0.5) * segDeg
    const landingOffset = -(targetIndex + 0.5) * segDeg;
    const spins = 5 * 360;
    const endRotation = spins + landingOffset;

    const startTime = performance.now();

    const easeOut = (t: number) => 1 - Math.pow(1 - t, 4);

    const animate = (now: number) => {
      const t = Math.min((now - startTime) / SPIN_DURATION, 1);
      const r = easeOut(t) * endRotation;
      if (svgRef.current) {
        svgRef.current.style.transform = `rotate(${r}deg)`;
        svgRef.current.style.transformOrigin = `${CENTER}px ${CENTER}px`;
      }
      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setTimeout(onComplete, 1200);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);// eslint-disable-line

  const slices = names.map((name, i) => {
    const startAngle = (i * segDeg - 90) * (Math.PI / 180);
    const endAngle = ((i + 1) * segDeg - 90) * (Math.PI / 180);
    const x1 = CENTER + RADIUS * Math.cos(startAngle);
    const y1 = CENTER + RADIUS * Math.sin(startAngle);
    const x2 = CENTER + RADIUS * Math.cos(endAngle);
    const y2 = CENTER + RADIUS * Math.sin(endAngle);
    const largeArc = segDeg > 180 ? 1 : 0;
    const path = `M ${CENTER} ${CENTER} L ${x1} ${y1} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    const midAngleDeg = i * segDeg + segDeg / 2;
    const midAngleRad = (midAngleDeg - 90) * (Math.PI / 180);
    const textR = RADIUS * 0.65;
    const tx = CENTER + textR * Math.cos(midAngleRad);
    const ty = CENTER + textR * Math.sin(midAngleRad);
    const fill = COLORS[i % COLORS.length];
    const fontSize = Math.max(8, Math.min(13, 140 / n));
    return { path, tx, ty, midAngleDeg, name, fill, fontSize };
  });

  return (
    <div className="flex flex-col items-center select-none">
      {/* Arrow pointer */}
      <div className="mb-[-4px] z-10">
        <svg width="24" height="20">
          <polygon points="12,18 2,0 22,0" fill="#00faff" />
        </svg>
      </div>

      {/* Wheel */}
      <div className="relative rounded-full overflow-hidden shadow-[0_0_40px_rgba(0,250,255,0.25)]">
        <svg width={SIZE} height={SIZE}>
          <g ref={svgRef}>
            {slices.map((s, i) => (
              <g key={i}>
                <path d={s.path} fill={s.fill} stroke="#00faff33" strokeWidth="1.5" />
                <text
                  x={s.tx}
                  y={s.ty}
                  fill={s.name === targetName ? "#00faff" : "rgba(255,255,255,0.85)"}
                  fontSize={s.fontSize}
                  fontWeight="700"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${s.midAngleDeg + 90}, ${s.tx}, ${s.ty})`}
                  style={{ textTransform: "uppercase", letterSpacing: "0.06em" }}
                >
                  {s.name.length > 9 ? s.name.slice(0, 8) + "…" : s.name}
                </text>
              </g>
            ))}
            {/* Outer ring */}
            <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none" stroke="#00faff66" strokeWidth="2" />
            {/* Center hub */}
            <circle cx={CENTER} cy={CENTER} r={18} fill="#050a14" stroke="#00faff" strokeWidth="2" />
            <text x={CENTER} y={CENTER} fill="#00faff" fontSize="10" textAnchor="middle" dominantBaseline="middle" fontWeight="900">GFL</text>
          </g>
        </svg>
      </div>

      <p className="mt-4 text-xs uppercase tracking-[0.2em] text-white/50 animate-pulse">Spinning…</p>
    </div>
  );
}
