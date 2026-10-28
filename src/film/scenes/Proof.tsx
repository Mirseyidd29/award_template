import React from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { fonts } from "../../theme/fonts";
import az from "../azMap.json";
import { Lamp } from "../Lamp";
import { Cam, PAYMENTS, ProductGrid, TRANSFERS } from "../ProductGrid";
import { CONTENT } from "../content";
import { DARK_CAM_END } from "./Problem";
import { Big, both, Context, count, ez, fill, Finish, fmt, Kicker, L, leave, LEN, lerpColor, M, mix, p, rgba, rise, switchOn, TYPE } from "../look";

// All figures come from content.ts (placeholders).
// Every number is driven by the same value as its picture, so the count never races ahead of the lights.
export const REAL = CONTENT;

// ───────── 12. The crowd: players, then the predictions they made, in one place ─────────
// The map lights up city by city as the players count. On "made", the players number steps back (220 → 96, up);
// on the predictions figure the number rises at hero size and counts, and the map flickers with predictions
// being made: flashes fire in proportion to how fast the count climbs, weighted to the cities.
const PLAYERS_AT = { top: 380, demotedTop: 300 };
const dotsW = (az.dots as number[][]).map((d) => d[2]);
export const Crowd: React.FC = () => {
  const f = useCurrentFrame();
  const end = LEN.crowd;
  const F0 = 8, FD = Math.max(60, M("crowd.players", 69) + 30 - F0);
  const t = fill(f, F0, FD);
  const made = M("crowd.made", 158) - 4, predAt = M("crowd.predictions", 185) - 4;
  const PD = 40;
  const demote = p(f, made, made + 16, ez.inOut);
  const S = 0.7, OX = 1050, OY = 194;
  const baku = az.cities.Baku as number[];
  // flashes this frame ∝ how much the predictions count rose (plus a steady flicker once it lands); each decays over 8 frames
  const rates = Array.from({ length: 8 }, (_, a) => {
    const g = f - a;
    return g < predAt ? 0 : (fill(g, predAt, PD) - fill(g - 1, predAt, PD)) * 1200 + (g >= predAt + PD ? 7 : 0);
  });
  const flashAge = (i: number) => {
    for (let a = 0; a < 8; a++) {
      if (rates[a] <= 0) break;
      if (random(`fl${i}-${f - a}`) < (rates[a] / 3600) * (0.4 + dotsW[i] * 2.4)) return a;
    }
    return -1;
  };
  return (
    <AbsoluteFill style={{ background: L.night }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" /></filter>
          <filter id="halo" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="3" /></filter>
        </defs>
        <g transform={`translate(${OX},${OY}) scale(${S})`}>
          <g opacity={1 - 0.3 * p(f, predAt, predAt + 12)}>
            {az.outline.map((d, i) => <path key={i} d={d} fill="none" stroke={rgba("#ffffff", 0.08)} strokeWidth={2} />)}
            <g filter="url(#glow)" opacity={t}>
              {(az.dots as number[][]).filter((d) => d[2] > 0.35).map(([x, y, w], i) => <circle key={i} cx={x} cy={y} r={7} fill={L.lamp} opacity={w * 0.5} />)}
            </g>
            {(az.dots as number[][]).map(([x, y, w, o], i) => {
              const at = o * (1 - w * 0.85) * 0.92; // cities first, the countryside after
              const lit = Math.min(1, Math.max(0, (t - at) / 0.06));
              return <circle key={i} cx={x} cy={y} r={mix(2.4, 3.6 + w * 1.4, lit)} fill={lit > 0.02 ? lerpColor("#2a3142", L.lamp, Math.min(1, lit * (0.45 + w * 0.8))) : "#1a2030"} />;
            })}
          </g>
          {f >= predAt && (az.dots as number[][]).map(([x, y], i) => {
            const a = flashAge(i);
            if (a < 0) return null;
            const k = 1 - ez.out(a / 8);
            return (
              <g key={`f${i}`} opacity={k}>
                <circle cx={x} cy={y} r={8} fill={L.lamp} filter="url(#halo)" />
                <circle cx={x} cy={y} r={4.5 + 2.5 * k} fill={L.lamp} />
              </g>
            );
          })}
        </g>
        <g opacity={p(f, 60, 76) * (1 - demote)} transform={`translate(${OX + baku[0] * S},${OY + baku[1] * S})`}>
          {/* Baku sits near the right edge of the frame, so the label stands above the point, centred, not to its right */}
          <line x1={0} y1={-8} x2={24} y2={-70} stroke={L.mute} strokeWidth={1.5} />
          <text x={24} y={-82} textAnchor="middle" fill={L.text} fontFamily="Inter" fontWeight={600} fontSize={TYPE.label} letterSpacing={3}>BAKU</text>
        </g>
      </svg>
      <div style={leave(f, end - 10, 10)}>
        {/* players: hero, then it steps back to display size and moves up */}
        <div style={{ position: "absolute", left: 120, top: mix(PLAYERS_AT.top, PLAYERS_AT.demotedTop, demote), ...rise(f, 2, 14) }}>
          <div style={{ transformOrigin: "left top", transform: `scale(${mix(1, TYPE.display / TYPE.hero, demote)})`, height: mix(194, 85, demote) }}>
            <Big>{count(f, REAL.players, F0, FD)}</Big>
          </div>
          <Context style={{ marginTop: mix(18, 12, demote) }}>players across Azerbaijan</Context>
        </div>
        <div style={{ position: "absolute", left: 120, top: 470, ...rise(f, predAt, 18) }}>
          <Big>{count(f, REAL.predictions, predAt, PD)}</Big>
          <Context style={{ marginTop: 18 }}>predictions, {CONTENT.predictionsPerPlayer} per player</Context>
        </div>
      </div>
      <Finish />
    </AbsoluteFill>
  );
};

// ───────── 14. The habit: app opens per day, before and during ─────────
const DayStrip: React.FC<{ label: string; opens: [number, number][]; from: number; f: number }> = ({ label, opens, from, f }) => {
  const W = 900;
  const x = (h: number) => ((h - 6) / 18) * W;
  return (
    <div style={{ position: "relative", height: 150 }}>
      <Kicker style={{ position: "absolute", left: 0, top: 0, ...rise(f, from, 14, 6, 3) }}>{label}</Kicker>
      <div style={{ position: "absolute", left: 0, top: 92, width: W, height: 2, background: L.dim, transformOrigin: "left center", transform: `scaleX(${p(f, from, from + 18, ez.out)})` }} />
      {[6, 12, 18, 24].map((h) => (
        <div key={h} style={{ position: "absolute", left: x(h) - 30, top: 108, width: 60, textAlign: "center", fontFamily: fonts.ui, fontSize: 16, color: L.dim, opacity: p(f, from + 4, from + 16) }}>{String(h % 24).padStart(2, "0")}:00</div>
      ))}
      {opens.map(([h, level], i) => {
        const s = switchOn(f, from + 12 + i * 8, 14);
        return (
          <div key={i} style={{ position: "absolute", left: x(h) - 28, top: 64 }}>
            <Lamp size={56} level={s.level * level} warm={s.warm} />
          </div>
        );
      })}
    </div>
  );
};
export const Habit: React.FC = () => {
  const f = useCurrentFrame();
  const end = LEN.habit;
  const at = M("habit.uplift", 42) - 4;
  return (
    <AbsoluteFill style={{ background: L.night }}>
      <div style={{ position: "absolute", left: 120, top: 270, display: "flex", flexDirection: "column", gap: 70, ...leave(f, end - 8, 8) }}>
        <DayStrip f={f} from={2} label={`Before: ${REAL.opensBefore} app opens a day`} opens={[[8.2, 1], [19.9, 1]]} />
        {/* during: two full lamps and one partly lit */}
        <DayStrip f={f} from={14} label={`During the World Cup: ${REAL.opensDuring} a day`} opens={[[8.2, 1], [13.5, 1], [21.4, 0.65]]} />
      </div>
      <div style={{ position: "absolute", left: 1150, top: 320, ...both(rise(f, at, 16), leave(f, end - 8, 8)) }}>
        <Big color={L.lamp}>+{count(f, REAL.opensUplift, at, 30, 2)}%</Big>
        <Context style={{ marginTop: 18 }}>daily app opens per player</Context>
      </div>
      <Finish />
    </AbsoluteFill>
  );
};

// ───────── 15. The wall again: the same two lamps as the dark map, and a third one comes on ─────────
const THIRD = 21, FOURTH = 10; // QR pay (next to Payments), DigiDeposit
export const Lit: React.FC = () => {
  const f = useCurrentFrame();
  const end = LEN.lit;
  const cam: Cam = { ...DARK_CAM_END, x: DARK_CAM_END.x + f * 0.05, ry: DARK_CAM_END.ry + f * 0.008 };
  const third = switchOn(f, 12, 18), fourth = switchOn(f, 24, 18);
  const state = (i: number) => (i === TRANSFERS || i === PAYMENTS ? { level: 1, warm: 1 }
    : i === THIRD ? third : i === FOURTH ? { level: fourth.level * 0.12, warm: fourth.warm * 0.5 } : { level: 0 });
  return (
    <AbsoluteFill style={{ background: L.night }}>
      <ProductGrid cam={cam} state={state} labels={1} />
      <AbsoluteFill style={{ background: `linear-gradient(90deg, ${L.night} 18%, rgba(5,7,12,.85) 34%, transparent 52%)` }} />
      <div style={{ position: "absolute", left: 120, top: 330, ...both(rise(f, 6, 16), leave(f, end - 8, 8)) }}>
        <Big color={L.lamp}>{count(f, REAL.newProducts, 8, 40)}</Big>
        <Context style={{ marginTop: 18 }}>new products and services opened through the game</Context>
      </div>
      {/* bank products per player, before and after */}
      <div style={{ position: "absolute", left: 120, top: 640, ...both(rise(f, 30, 16), leave(f, end - 8, 8)) }}>
        <Big size={TYPE.display} color={L.text}>{fmt(REAL.productsBefore, 2)} → {fmt(REAL.productsAfter, 2)}</Big>
        <Context style={{ marginTop: 14 }}>products per player, before → after the World Cup</Context>
      </div>
      <Finish />
    </AbsoluteFill>
  );
};

// ───────── 16. Profit: the total, and a bar of light showing it came from across the bank ─────────
// Share of profit by business line: the three biggest lines are drawn; the smaller lines are named in the footnote.
// Segment widths follow each line's `weight` in content.ts; the labels under them are content.ts strings.
export const PROFIT_SPLIT = CONTENT.profitSplit.map((s) => ({ ...s, share: s.weight }));
const SHARE_SUM = PROFIT_SPLIT.reduce((a, s) => a + s.share, 0);
const BAR = { x: 120, y: 600, w: 1680, h: 28, gap: 8 };
export const PROFIT_ON = [20, 34, 46];
export const Profit: React.FC = () => {
  const f = useCurrentFrame();
  const end = LEN.profit;
  const usable = BAR.w - BAR.gap * (PROFIT_SPLIT.length - 1);
  let x = BAR.x;
  const segs = PROFIT_SPLIT.map((s, i) => { const w = usable * (s.share / SHARE_SUM); const out = { ...s, x, w, on: PROFIT_ON[i] }; x += w + BAR.gap; return out; });
  // the total is the sum of the segments that are lit, so it lands as the last one comes on
  const profit = REAL.profitAzn;
  const total = typeof profit === "number" ? segs.reduce((a, s) => a + profit * (s.share / SHARE_SUM) * p(f, s.on, s.on + 10, ez.count), 0) : 0;
  const out = leave(f, end - 12, 10);
  return (
    <AbsoluteFill style={{ background: L.night }}>
      <div style={{ position: "absolute", left: 120, top: 250, display: "flex", alignItems: "baseline", gap: 24, ...both(rise(f, 12, 12), out) }}>
        {/* the final width is reserved from the start, so "AZN" never moves while the number counts */}
        <div style={{ position: "relative" }}>
          <Big style={{ visibility: "hidden" }}>{fmt(REAL.profitAzn)}</Big>
          <Big style={{ position: "absolute", left: 0, top: 0 }}>{typeof profit === "string" || f >= PROFIT_ON[PROFIT_ON.length - 1] + 10 ? fmt(profit) : fmt(Math.round(total))}</Big>
        </div>
        <Big size={TYPE.display} color={L.mute}>AZN</Big>
      </div>
      <Context style={{ position: "absolute", left: 120, top: 470, ...both(rise(f, 18, 14, 6, 3), out) }}>profit from players in one tournament, after campaign costs ({CONTENT.profitUsd})</Context>
      {/* the empty track draws left to right, then each product's segment switches on like a lamp */}
      <div style={{ position: "absolute", left: BAR.x, top: BAR.y, width: BAR.w, height: BAR.h, borderRadius: 4, background: "#121722", transformOrigin: "left center", ...both({ transform: `scaleX(${p(f, 10, 26, ez.out)})` }, out) }} />
      {segs.map((s, i) => {
        // Loans gets the full lamp flicker; the others a short one, so the bar warms up instead of strobing
        const k = f - s.on;
        const on = i === 0 ? switchOn(f, s.on, 14) : k < 0 ? { level: 0, warm: 0 } : { level: k < 2 ? [0.4, 0.85][k] : 0.85 + 0.15 * p(f, s.on + 2, s.on + 12), warm: p(f, s.on, s.on + 14, ez.inOutSine) };
        return (
          <React.Fragment key={s.name}>
            <div style={{ position: "absolute", left: s.x, top: BAR.y, width: s.w, height: BAR.h, borderRadius: 4, background: lerpColor(L.ember, L.lamp, on.warm), ...both({ opacity: on.level }, out) }} />
            <div style={{ position: "absolute", left: s.x, top: BAR.y + BAR.h, width: s.w, height: 60, background: `radial-gradient(ellipse 60% 100% at 50% 0%, ${rgba("#FFF4E0", 0.06 * on.level)}, transparent 70%)`, ...both({}, out) }} />
            <div style={{ position: "absolute", left: s.x, top: BAR.y + 50, ...both(rise(f, s.on + 6, 14, 8, 3), out) }}>
              <div style={{ fontFamily: fonts.ui, fontWeight: 600, fontSize: TYPE.label, color: L.body, whiteSpace: "nowrap" }}>{s.name}</div>
              <div style={{ fontFamily: fonts.ui, fontWeight: 600, fontSize: TYPE.context, color: L.text, marginTop: 6 }}>{s.label}</div>
            </div>
          </React.Fragment>
        );
      })}
      <Context style={{ position: "absolute", left: 120, top: 780, fontSize: TYPE.label, ...both(rise(f, 70, 14, 6, 3), out) }}>share of profit by business line · DigiHesab Max, Dama-dama and debit cards together: {CONTENT.profitOther}</Context>
      {/* players' customer lifetime value, change over the campaign */}
      <div style={{ position: "absolute", right: 120, top: 262, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 12, ...both(rise(f, 84, 14, 6, 3), out) }}>
        <Big size={TYPE.display} color={L.lamp}>+{count(f, REAL.cltvUplift, 84, 24, 1)}%</Big>
        <Context style={{ fontSize: TYPE.label, color: L.body, whiteSpace: "nowrap" }}>{CONTENT.cltvLine}</Context>
      </div>
      <Finish />
    </AbsoluteFill>
  );
};
