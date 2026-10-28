import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { fonts } from "../theme/fonts";
import sync from "./sync.json";

// Film B "Lights On". Design direction (impeccable): a lighting design, not a motion-graphics deck.
// One light source (warm lamp white); darkness is the default; only lamps glow, never letters.
// Colour carries meaning: lamp white = what matters, green = goals only, blue = ABB only.
export const L = {
  night: "#05070C", // background
  ink: "#0B0F18", // raised dark surfaces
  rim: "#1A2030", // off-lamp housing
  lamp: "#FFF4E0", // a lamp at full power; key words
  ember: "#FF8A3D", // a lamp warming up / dying
  text: "#E9ECF2", // display type
  body: "#B4BAC6", // caption body
  mute: "#6B7488", // one line of context
  dim: "#3A4153",
  abb: "#1B63ED", // ABB brand only
  goal: "#4BD478", // goal values only
} as const;
/** the type scale: five sizes, nothing else */
export const TYPE = { caption: 34, context: 28, label: 22, display: 96, hero: 220 } as const;

// Motion (Emil Kowalski): strong custom curves; enter with ease-out, never ease-in; nothing appears from nothing.
export const ez = {
  out: Easing.bezier(0.23, 1, 0.32, 1), // enters, settles
  inOut: Easing.bezier(0.77, 0, 0.175, 1), // camera moves, match cuts
  exit: Easing.bezier(0.33, 0, 0.67, 1), // quick, unobtrusive exits
  drawer: Easing.bezier(0.32, 0.72, 0, 1),
  fling: Easing.bezier(0.2, 0.8, 0.3, 1),
  count: Easing.bezier(0.33, 0, 0.2, 1), // counters and the visuals they drive
  outBack: Easing.out(Easing.back(1.6)),
  inOutSine: Easing.inOut(Easing.sin),
  in: Easing.bezier(0.4, 0, 1, 1), // only for things leaving for good (a matrix fading out under a blur)
};
export const p = (f: number, a: number, b: number, e: (t: number) => number = ez.out) =>
  interpolate(f, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: e });
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
/** in over `inn`, out over `out` frames inside [a, b] */
export const window_ = (f: number, a: number, b: number, inn = 10, out = 10) => Math.min(p(f, a, a + inn), 1 - p(f, b - out, b, ez.exit));

/** Entrance: rise 14px and come into focus (no pure fades). Returns a style. */
export const rise = (f: number, from: number, len = 20, dist = 14, blur = 8): React.CSSProperties => {
  const t = p(f, from, from + len, ez.out);
  return { opacity: t, transform: `translateY(${(1 - t) * dist}px)`, filter: t < 1 ? `blur(${(1 - t) * blur}px)` : undefined };
};
/** Exit: lift a little and blur away. */
export const leave = (f: number, at: number, len = 10, dist = 8, blur = 6): React.CSSProperties => {
  const t = p(f, at, at + len, ez.exit);
  return { opacity: 1 - t, transform: `translateY(${-t * dist}px)`, filter: t > 0 ? `blur(${t * blur}px)` : undefined };
};
export const both = (a: React.CSSProperties, b: React.CSSProperties): React.CSSProperties => ({
  opacity: (a.opacity as number ?? 1) * (b.opacity as number ?? 1),
  transform: [a.transform, b.transform].filter(Boolean).join(" ") || undefined,
  filter: [a.filter, b.filter].filter(Boolean).join(" ") || undefined,
});

/** word marks from the narration (scene-local frames), written by scripts/sync.py */
const MARKS = (sync as unknown as { marks?: Record<string, number> }).marks ?? {};
export const M = (key: string, fallback: number) => MARKS[key] ?? fallback;
export const LEN = (sync as unknown as { scenes: Record<string, number> }).scenes;

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
export const lerpColor = (a: string, b: string, t: number) => {
  const A = hex(a), B = hex(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(",")})`;
};
export const rgba = (h: string, a: number) => `rgba(${hex(h).join(",")},${a})`;

/** A floodlight switching on: a short flicker, then the metal-halide warm-up from ember to white. */
export const switchOn = (f: number, at: number, warmLen = 26) => {
  if (f < at) return { level: 0, warm: 0 };
  const k = f - at;
  const flick = [0.55, 0.08, 0.75, 0.25, 0.9, 0.6];
  const level = k < flick.length ? flick[k] : 0.7 + 0.3 * p(f, at + flick.length, at + warmLen);
  return { level, warm: p(f, at, at + warmLen, ez.inOutSine) };
};
/** A real lamp cutting out: an instant drop to an ember, then the glow fades. */
export const switchOff = (f: number, at: number, len = 14) => {
  if (f < at) return { level: 1, warm: 1 };
  if (f < at + 1) return { level: 0.35, warm: 0.5 };
  const t = p(f, at + 1, at + len, Easing.bezier(0.1, 0.7, 0.3, 1));
  return { level: 0.35 * (1 - t), warm: 0.5 * (1 - t) };
};

/** Narration caption: small, bottom-centre, in the letterbox. *word* = key word (lamp white), _word_ = goal green.
 *  Enters rising into focus; exits lifting and blurring; consecutive lines overlap a few frames and cross-fade in place. */
export const Caption: React.FC<{ text: string; from: number; to: number; bottom?: number; size?: number }> = ({ text, from, to, bottom = 58, size = TYPE.caption }) => {
  const f = useCurrentFrame();
  if (f < from - 1 || f > to + 1) return null;
  const parts = text.split(/(\*[^*]+\*|_[^_]+_)/g).filter(Boolean);
  const st = both(rise(f, from, 10, 6, 4), leave(f, to - 6, 6, 4, 3));
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom, textAlign: "center", ...st }}>
      <span style={{ fontFamily: fonts.ui, fontWeight: 500, fontSize: size, letterSpacing: 0.1, color: L.body, textShadow: "0 2px 14px rgba(0,0,0,.9)" }}>
        {parts.map((s, i) =>
          s.startsWith("*") ? <span key={i} style={{ color: L.lamp, fontWeight: 700 }}>{s.slice(1, -1)}</span>
            : s.startsWith("_") ? <span key={i} style={{ color: L.goal, fontWeight: 700 }}>{s.slice(1, -1)}</span>
              : <span key={i}>{s}</span>)}
      </span>
    </div>
  );
};

/** Several captions in a row: [text, from, to][]. */
export const Captions: React.FC<{ lines: [string, number, number][] }> = ({ lines }) => (
  <>{lines.map(([t, a, b], i) => <Caption key={i} text={t} from={a} to={b} />)}</>
);

export const Kicker: React.FC<{ children: React.ReactNode; color?: string; style?: React.CSSProperties }> = ({ children, color = L.mute, style }) => (
  <div style={{ fontFamily: fonts.ui, fontWeight: 600, fontSize: TYPE.label, letterSpacing: 4, textTransform: "uppercase", whiteSpace: "nowrap", color, ...style }}>{children}</div>
);
/** one line of context under a number */
export const Context: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ fontFamily: fonts.ui, fontWeight: 400, fontSize: TYPE.context, color: L.mute, ...style }}>{children}</div>
);

export const Big: React.FC<{ children: React.ReactNode; size?: number; color?: string; style?: React.CSSProperties }> = ({ children, size = TYPE.hero, color = L.text, style }) => (
  <div style={{ fontFamily: fonts.display, fontWeight: 800, fontSize: size, lineHeight: 0.88, letterSpacing: 1, color, fontVariantNumeric: "tabular-nums", ...style }}>{children}</div>
);

/** Numbered step marker for the mechanic: quiet, like the numbered captions of the reference cases. */
export const Step: React.FC<{ n: number; label: string; from: number; x?: number; y?: number }> = ({ n, label, from, x = 120, y = 150 }) => {
  const f = useCurrentFrame();
  const t = p(f, from, from + 18, ez.out);
  return (
    <div style={{ position: "absolute", left: x, top: y, display: "flex", alignItems: "center", gap: 18, opacity: t, transform: `translateX(${(1 - t) * -12}px)` }}>
      <div style={{ width: 44, height: 44, borderRadius: 22, border: `1.5px solid ${rgba("#FFF4E0", 0.7)}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.ui, fontWeight: 600, fontSize: TYPE.label, color: L.lamp }}>{n}</div>
      <div style={{ fontFamily: fonts.ui, fontWeight: 600, fontSize: TYPE.label, letterSpacing: 6, color: L.lamp, textTransform: "uppercase" }}>{label}</div>
    </div>
  );
};

/** One quiet disclaimer, always in the same place. */
export const Mock: React.FC<{ style?: React.CSSProperties; label?: string }> = ({ style, label = "MOCK DATA" }) => (
  <div style={{ position: "absolute", right: 64, bottom: 64, fontFamily: fonts.ui, fontWeight: 600, fontSize: 13, letterSpacing: 3, color: L.mute, opacity: 0.7, ...style }}>{label}</div>
);

/** Film grain + soft vignette, shared by every shot. */
export const Finish: React.FC<{ vignette?: number; grain?: number }> = ({ vignette = 0.7, grain = 0.06 }) => {
  const f = useCurrentFrame();
  return (
    <>
      <AbsoluteFill style={{ pointerEvents: "none", background: `radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,${vignette}) 100%)` }} />
      <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "overlay", opacity: grain }}>
        <svg width="100%" height="100%">
          <filter id={`ag${f % 5}`}>
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={f % 5} stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter={`url(#ag${f % 5})`} />
        </svg>
      </AbsoluteFill>
    </>
  );
};

export const fmt = (n: number | string, d = 0) => (typeof n === "string" ? n : n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d }));
/** the fill (0..1) a counter and its visual share, so the number never races ahead of the picture */
export const fill = (f: number, from: number, dur: number) => p(f, from, from + dur, ez.count);
// a string target (a placeholder) is shown as typed; a number counts up
export const count = (f: number, target: number | string, from: number, dur: number, d = 0) =>
  typeof target === "string" ? target : fmt(f >= from + dur ? target : target * fill(f, from, dur), d);
