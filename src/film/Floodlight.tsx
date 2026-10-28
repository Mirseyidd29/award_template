import React from "react";
import { Lamp } from "./Lamp";
import { rgba } from "./look";
import { COLS, LampState, ROWS } from "./ProductGrid";

// A stadium floodlight: the same 8×6 grid as the product map, in a steel frame. When the lamps are on it throws light down.
export const Floodlight: React.FC<{ lamp: number; state: (i: number) => LampState; beam?: number; mast?: boolean; style?: React.CSSProperties }> = ({
  lamp, state, beam = 0, mast = false, style,
}) => {
  const gap = lamp * 0.28;
  const W = COLS * lamp + (COLS - 1) * gap + lamp * 0.6;
  const H = ROWS * lamp + (ROWS - 1) * gap + lamp * 0.6;
  return (
    <div style={{ position: "relative", width: W, height: H, ...style }}>
      {/* light thrown down and forward */}
      {beam > 0 && (
        <div style={{
          position: "absolute", left: -W * 0.9, top: H * 0.6, width: W * 2.8, height: H * 6, opacity: beam, mixBlendMode: "screen",
          background: `radial-gradient(ellipse 34% 100% at 50% 0%, ${rgba("#FFF1D6", 0.2)} 0%, ${rgba("#FFF1D6", 0.07)} 40%, transparent 75%),
            radial-gradient(ellipse 14% 80% at 50% 0%, ${rgba("#FFF8EA", 0.16)} 0%, transparent 70%)`,
        }} />
      )}
      {mast && (
        <div style={{ position: "absolute", left: W / 2 - lamp * 0.25, top: H, width: lamp * 0.5, height: H * 8, background: "linear-gradient(90deg, #0b0e14, #1b2130 50%, #0b0e14)" }} />
      )}
      <div style={{
        position: "absolute", inset: 0, borderRadius: lamp * 0.12, background: "linear-gradient(180deg, #161b26, #0a0d13)",
        border: `${Math.max(1, lamp * 0.04)}px solid #232a39`, boxShadow: "0 20px 60px rgba(0,0,0,.6)",
      }} />
      {Array.from({ length: COLS * ROWS }, (_, i) => {
        const s = state(i);
        return (
          <div key={i} style={{ position: "absolute", left: lamp * 0.3 + (i % COLS) * (lamp + gap), top: lamp * 0.3 + Math.floor(i / COLS) * (lamp + gap) }}>
            <Lamp size={lamp} level={s.level} warm={s.warm ?? 1} />
          </div>
        );
      })}
    </div>
  );
};
