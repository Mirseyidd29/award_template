import React from "react";
import { fonts } from "../theme/fonts";
import { L, lerpColor, rgba } from "./look";

/** One floodlight lamp: a dark reflector dish; when on, a warm core, a halo and a soft bloom. level 0..1, warm 0 (ember) → 1 (white). */
export const Lamp: React.FC<{ size: number; level: number; warm?: number; flare?: boolean; style?: React.CSSProperties }> = ({ size: S, level, warm = 1, flare = false, style }) => {
  const c = lerpColor(L.ember, L.lamp, warm);
  const on = level > 0.002;
  return (
    <div style={{ position: "relative", width: S, height: S, ...style }}>
      {/* bloom, far outside the housing */}
      {on && (
        <div style={{
          position: "absolute", left: -S * 1.1, top: -S * 1.1, width: S * 3.2, height: S * 3.2, borderRadius: "50%",
          background: `radial-gradient(circle, ${c.replace("rgb", "rgba").replace(")", `,${0.32 * level})`)} 0%, ${c.replace("rgb", "rgba").replace(")", `,${0.1 * level})`)} 28%, transparent 62%)`,
          mixBlendMode: "screen",
        }} />
      )}
      {/* housing + reflector rings */}
      <div style={{
        position: "absolute", inset: 0, borderRadius: "50%",
        background: `radial-gradient(circle at 50% 50%, #0b0e15 0%, #141924 55%, #07090e 70%, ${L.rim} 72%, #0a0d14 100%)`,
        boxShadow: "inset 0 2px 3px rgba(255,255,255,.08), inset 0 -4px 10px rgba(0,0,0,.7)",
      }} />
      <div style={{
        position: "absolute", inset: S * 0.1, borderRadius: "50%",
        background: `repeating-radial-gradient(circle, rgba(255,255,255,.035) 0px, rgba(255,255,255,.035) 1px, transparent 2px, transparent ${Math.max(4, S * 0.05)}px)`,
      }} />
      {/* specular glint on the glass when off */}
      <div style={{
        position: "absolute", left: S * 0.22, top: S * 0.16, width: S * 0.3, height: S * 0.14, borderRadius: "50%",
        background: "rgba(255,255,255,.07)", transform: "rotate(-28deg)", opacity: 1 - level,
      }} />
      {/* the lit core */}
      {on && (
        <>
          <div style={{
            position: "absolute", inset: S * 0.08, borderRadius: "50%", opacity: level,
            background: `radial-gradient(circle, #ffffff 0%, ${c} 26%, ${c.replace("rgb", "rgba").replace(")", ",0.55)")} 52%, ${c.replace("rgb", "rgba").replace(")", ",0.0)")} 72%)`,
          }} />
          <div style={{
            position: "absolute", inset: 0, borderRadius: "50%", opacity: level,
            boxShadow: `0 0 ${S * 0.35}px ${S * 0.06}px ${c.replace("rgb", "rgba").replace(")", ",0.55)")}`,
          }} />
        </>
      )}
      {/* anamorphic streak for hero lamps */}
      {on && flare && (
        <div style={{
          position: "absolute", left: S / 2 - S * 6, top: S / 2 - 2, width: S * 12, height: 4, opacity: 0.75 * level, mixBlendMode: "screen",
          background: `linear-gradient(90deg, transparent, ${rgba("#9EC0FF", 0.35)} 30%, #ffffff 50%, ${rgba("#9EC0FF", 0.35)} 70%, transparent)`,
          filter: "blur(1.5px)",
        }} />
      )}
    </div>
  );
};

export const LampLabel: React.FC<{ text: string; lit: number; size?: number; opacity?: number }> = ({ text, lit, size = 19, opacity = 1 }) => (
  <div style={{
    fontFamily: fonts.ui, fontWeight: 600, fontSize: size, letterSpacing: 0.3, textAlign: "center", whiteSpace: "nowrap",
    color: lerpColor("#4a5163", "#F4F1EA", Math.min(1, lit)), opacity,
  }}>{text}</div>
);
