import React from "react";
import { AbsoluteFill, Img, random, staticFile, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { Easing } from "remotion";
import { fonts } from "../../theme/fonts";
import { prizes } from "../../shared/brand";
import { PredictPhone } from "../three/PredictPhone";
import { Floodlight } from "../Floodlight";
import { Led, ledSize } from "../Led";
import { BARS, FLOOD, floodScale, MONTAGE_FLOOD_AT } from "./Insight";
import { Cam, PAYMENTS, PRODUCTS, ProductGrid, TRANSFERS } from "../ProductGrid";
import { CONTENT, Figure } from "../content";
import { Big, both, Context, ez, Finish, fmt, L, leave, LEN, M, mix, p, rgba, rise, Step, switchOff, TYPE } from "../look";

// ───────── 8. The name: the floodlight grows into a scoreboard; every lamp that isn't a letter goes out ─────────
const DOT = 30;
export const Name: React.FC = () => {
  const f = useCurrentFrame();
  const fl0 = LEN.montage - MONTAGE_FLOOD_AT; // where the montage left the floodlight
  const grow = p(f, 0, 20, ez.inOut);
  const ledIn = p(f, 4, 22, ez.out);
  const { w, h } = ledSize(DOT);
  const bars = BARS * (1 - p(f, 0, 18, ez.inOut));
  return (
    <AbsoluteFill style={{ background: L.night }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 50% 40% at 50% 42%, ${rgba("#FFE8C4", 0.07)}, transparent 70%)` }} />
      {grow < 1 && (
        <div style={{ position: "absolute", left: FLOOD.x, top: FLOOD.y, opacity: 1 - grow, filter: `blur(${grow * 10}px)`, transform: `translate(-50%, -50%) scale(${floodScale(fl0) * mix(1, 2.6, grow)}) rotate(${FLOOD.rot * (1 - grow)}deg)` }}>
          <Floodlight lamp={FLOOD.lamp} state={() => ({ level: 1, warm: 1 })} beam={1 - grow} />
        </div>
      )}
      <div style={{ position: "absolute", left: 960 - w / 2, top: 450 - h / 2, opacity: ledIn, transform: `scale(${mix(1.15, 1, ledIn)})`, filter: ledIn < 1 ? `blur(${(1 - ledIn) * 6}px)` : undefined }}>
        {/* all lamps on, then a sweep switches off everything that is not a letter */}
        <Led dot={DOT} state={(x, _y, letter) => (letter ? { level: 1, warm: 1 } : switchOff(f, 24 + x * 0.9 + random(`n${x}${_y}`) * 3, 12))} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 450 + h / 2 + 64, textAlign: "center", fontFamily: fonts.display, fontWeight: 800, fontSize: TYPE.display, letterSpacing: 8, color: L.text, ...rise(f, 70, 22) }}>
        GOALS BRING REWARDS
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: bars, background: "#000" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: bars, background: "#000" }} />
      <Finish />
    </AbsoluteFill>
  );
};

// ───────── 9. ① Predict ─────────
export const Predict: React.FC = () => {
  const f = useCurrentFrame();
  const exactly = M("predict.exactly", 76), goalsMark = M("predict.goals", 138);
  const pulse = 1 + 0.06 * Math.sin(Math.PI * p(f, goalsMark, goalsMark + 10, ez.inOutSine));
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 30% 50%, #0d1730, #04060b 70%)" }}>
      <ThreeCanvas width={1920} height={1080} gl={{ antialias: true }} dpr={1} style={{ position: "absolute", inset: 0 }}>
        <PredictPhone />
      </ThreeCanvas>
      <Step n={1} label="Predict" from={6} />
      <div style={{ position: "absolute", left: 1150, top: 360, display: "flex", flexDirection: "column", gap: 26 }}>
        {([["Exact score", CONTENT.goalsExact, exactly - 2, pulse], ["Right result", CONTENT.goalsRight, exactly + 14, 1]] as const).map(([label, goals, at, s]) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 26, ...rise(f, at, 16, 0, 6), transform: `translateX(${(1 - p(f, at, at + 16, ez.out)) * 24}px)` }}>
            <div style={{ width: 230, fontFamily: fonts.ui, fontWeight: 600, fontSize: TYPE.context, color: L.text }}>{label}</div>
            <div style={{ fontFamily: fonts.ui, fontWeight: 700, fontSize: TYPE.context, color: "#06140B", background: L.goal, padding: "10px 22px", borderRadius: 30, transform: `scale(${s})` }}>
              +{fmt(goals)} goals
            </div>
          </div>
        ))}
        <div style={{ marginTop: 34, ...rise(f, 160, 18) }}>
          <Context>{CONTENT.matchDate}</Context>
          <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 12 }}>
            <Img src={staticFile("flags/team-a.png")} style={{ width: 66, height: 44, borderRadius: 6, objectFit: "cover" }} />
            <div style={{ fontFamily: fonts.display, fontWeight: 800, fontSize: 60, color: L.text }}>{CONTENT.matchScore}</div>
            <Img src={staticFile("flags/team-b.png")} style={{ width: 66, height: 44, borderRadius: 6, objectFit: "cover" }} />
            <div style={{ fontFamily: fonts.ui, fontWeight: 700, fontSize: TYPE.label, color: L.goal, marginLeft: 12 }}>Exact. +{fmt(CONTENT.goalsExact)}</div>
          </div>
        </div>
      </div>
      <Finish />
    </AbsoluteFill>
  );
};

// ───────── 10. ② Boost: as each product lamp ignites, its goal value pops and fades ─────────
const BOOSTABLE = PRODUCTS.map((pr, i) => (pr.goals || pr.daily ? i : -1)).filter((i) => i >= 0);
// switch-on order: spread across the wall, accelerating from "Every bank product" to "discover the bank"
const ORDER = [...BOOSTABLE].sort((a, b) => random(`o${a}`) - random(`o${b}`));
export const boostOnAt = (i: number) => {
  const k = ORDER.indexOf(i);
  if (k < 0) return 99999;
  const a = M("boost.every", 69), b = M("boost.discover", 221) + 10;
  return Math.round(a + (b - a) * Math.pow(k / ORDER.length, 0.62));
};
export const boostState = (f: number) => (i: number) => {
  if (i === TRANSFERS || i === PAYMENTS) return { level: 1, warm: 1, tag: 0, label: 1 };
  const on = boostOnAt(i);
  const s = f >= on ? (f < on + 18 ? { level: [0.55, 0.08, 0.75, 0.25, 0.9, 0.6][f - on] ?? 0.7 + 0.3 * p(f, on + 6, on + 18), warm: p(f, on, on + 18, ez.inOutSine) } : { level: 1, warm: 1 }) : { level: 0, warm: 0 };
  const tag = p(f, on, on + 8, ez.outBack) * (1 - p(f, on + 16, on + 28, ez.exit));
  return { ...s, tag, label: p(f, on, on + 10) };
};
export const Boost: React.FC = () => {
  const f = useCurrentFrame();
  const t = p(f, 0, LEN.boost, ez.inOutSine);
  const cam: Cam = { x: mix(-120, 60, t), y: mix(40, 0, t), z: mix(-330, -250, t), rx: mix(14, 8, t), ry: mix(-10, 8, t) };
  const st = boostState(f);
  // the counter tweens every step and gives a small kick when a lamp lands
  const num = (v: Figure | undefined) => (typeof v === "number" ? v : 0);
  const total = ORDER.reduce((a, i) => a + num(PRODUCTS[i].goals) * p(f, boostOnAt(i) + 2, boostOnAt(i) + 10, ez.out), 0);
  const kick = ORDER.some((i) => f >= boostOnAt(i) + 2 && f < boostOnAt(i) + 8) ? 1.04 : 1;
  return (
    <AbsoluteFill style={{ background: L.night }}>
      <ProductGrid cam={cam} state={st} labels={1} />
      <AbsoluteFill style={{ background: `linear-gradient(180deg, ${rgba("#05070C", 0.85)} 0%, transparent 26%)` }} />
      <Step n={2} label="Boost" from={6} />
      <div style={{ position: "absolute", right: 110, top: 130, textAlign: "right", ...rise(f, M("boost.every", 69), 18) }}>
        <Big size={TYPE.display} color={L.goal} style={{ transform: `scale(${kick})`, transformOrigin: "right center" }}>+{typeof CONTENT.boostTotal === "string" ? CONTENT.boostTotal : fmt(Math.round(total / 10) * 10)}</Big>
        <Context style={{ marginTop: 6 }}>goals from banking</Context>
      </div>
      <Finish />
    </AbsoluteFill>
  );
};

// ───────── 11. ③ Climb: the table scrolls past you ─────────
const NAMES = ["Farid", "Nigar", "Elvin", "Leyla", "Murad", "Gunel", "Tural", "Aynur", "Kamran", "Sevinj", "Orkhan", "Nargiz", "Rashad", "Aysel", "Ilkin", "Sabina", "Javid", "Lala"];
const mask = (n: string) => `${n[0]}*** ${String.fromCharCode(65 + (n.length * 7) % 26)}***`;
const xx = (s: string) => s.replace(/\d/g, "X"); // template: no real figures on the leaderboard
const goalsAt = (rank: number) => Math.round(2400000 / Math.pow(rank, 0.42) / 10) * 10;
const CLIMB_EASE = Easing.bezier(0.65, 0, 0.35, 1);
const rankAt = (f: number) => Math.exp(mix(Math.log(2418), Math.log(12), p(f, 6, 82, CLIMB_EASE)));
export const Climb: React.FC = () => {
  const f = useCurrentFrame();
  const rk = rankAt(f);
  const speed = Math.abs(rankAt(f - 1) - rk);
  const ROW = 78, H = ROW * 7;
  const landed = f >= 82 ? 1 + 0.04 * Math.sin(Math.PI * p(f, 82, 92, ez.inOutSine)) : 1;
  const base = Math.floor(rk);
  return (
    <AbsoluteFill style={{ background: L.night }}>
      <Step n={3} label="Climb" from={4} />
      {/* leaderboard: every other player's row scrolls down past "You" as you climb */}
      <div style={{ position: "absolute", left: 120, top: 270, width: 760, height: H, overflow: "hidden", maskImage: "linear-gradient(180deg, transparent, #000 18%, #000 82%, transparent)", ...rise(f, 0, 14) }}>
        <div style={{ position: "absolute", inset: 0, filter: speed > 0.5 ? `blur(${Math.min(3, speed * 0.02 + 1)}px)` : undefined }}>
          {Array.from({ length: 11 }, (_, j) => base - 5 + j).filter((r) => r >= 1 && r !== Math.round(rk)).map((r) => {
            const y = H / 2 - ROW / 2 + (r - rk) * ROW;
            if (y < -ROW || y > H) return null;
            return (
              <div key={r} style={{ position: "absolute", left: 0, right: 0, top: y, height: ROW - 10, display: "flex", alignItems: "center", gap: 26, padding: "0 26px", borderRadius: 18, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.04)" }}>
                <div style={{ width: 130, fontFamily: fonts.ui, fontWeight: 700, fontSize: TYPE.context, color: L.mute, fontVariantNumeric: "tabular-nums" }}>#{xx(fmt(r))}</div>
                <div style={{ flex: 1, fontFamily: fonts.ui, fontWeight: 600, fontSize: TYPE.context, color: "#9AA2B4" }}>{mask(NAMES[(r * 7) % NAMES.length])}</div>
                <div style={{ fontFamily: fonts.ui, fontWeight: 700, fontSize: TYPE.label, color: "#9AA2B4", fontVariantNumeric: "tabular-nums" }}>{xx(fmt(goalsAt(r)))}</div>
              </div>
            );
          })}
        </div>
        {/* you */}
        <div style={{ position: "absolute", left: 0, right: 0, top: H / 2 - ROW / 2, height: ROW - 10, display: "flex", alignItems: "center", gap: 26, padding: "0 26px", borderRadius: 18, background: rgba("#FFF4E0", 0.09), border: `1.5px solid ${rgba("#FFF4E0", 0.7)}`, transform: `scale(${landed})` }}>
          <div style={{ width: 130, fontFamily: fonts.ui, fontWeight: 700, fontSize: TYPE.context, color: L.lamp, fontVariantNumeric: "tabular-nums" }}>#{xx(fmt(Math.round(rk)))}</div>
          <div style={{ flex: 1, fontFamily: fonts.ui, fontWeight: 700, fontSize: TYPE.context, color: L.lamp }}>You</div>
          <div style={{ fontFamily: fonts.ui, fontWeight: 700, fontSize: TYPE.label, color: L.goal, fontVariantNumeric: "tabular-nums" }}>{xx(fmt(goalsAt(Math.round(rk)) + 1200))}</div>
        </div>
      </div>
      {/* prizes */}
      <div style={{ position: "absolute", left: 1000, top: 270, display: "flex", gap: 22 }}>
        {[["Travel voucher", CONTENT.topPrize, null], [prizes[0].name, "", prizes[0].file], [prizes[1].name, "", prizes[1].file]].map(([n, sub, file], i) => (
          <div key={i} style={{ width: 250, height: 330, borderRadius: 24, overflow: "hidden", background: "#0E1422", border: "1px solid rgba(255,255,255,.06)", display: "flex", flexDirection: "column", ...rise(f, 6 + i * 3, 18, 24, 6) }}>
            <div style={{ flex: 1, background: file ? "#fff" : `linear-gradient(160deg, ${L.abb}, #0A204F)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {file ? <Img src={staticFile(file)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{ fontFamily: fonts.display, fontWeight: 800, fontSize: 64, color: "#fff", textAlign: "center", lineHeight: 0.9 }}>{sub}</div>}
            </div>
            <div style={{ padding: "16px 18px", fontFamily: fonts.ui, fontWeight: 600, fontSize: TYPE.label, color: L.text }}>{n}</div>
          </div>
        ))}
      </div>
      <Finish />
    </AbsoluteFill>
  );
};
