import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { fonts } from "../../theme/fonts";
import { CLOCK_AT, PhoneOnTable, ROUTINE } from "../three/PhoneOnTable";
import { Cam, lampXY, PAYMENTS, ProductGrid, TRANSFERS } from "../ProductGrid";
import { CONTENT } from "../content";
import { Big, both, Context, ez, Finish, L, leave, LEN, M, mix, p, rise, TYPE } from "../look";

// ───────── 1. The routine ─────────
const CLOCKS = ["MON  08:14", "WED  13:27", "FRI  19:52"];
export const Routine: React.FC = () => {
  const f = useCurrentFrame();
  const dive = p(f, ROUTINE.dive[0], ROUTINE.dive[1], ez.inOut);
  // the clock moves through the week with each tap
  const vi = f >= CLOCK_AT[1] ? 2 : f >= CLOCK_AT[0] ? 1 : 0;
  const k = f - [0, CLOCK_AT[0], CLOCK_AT[1]][vi];
  const nextAt = [CLOCK_AT[0], CLOCK_AT[1] - CLOCK_AT[0], 9999][vi];
  const clock = both(vi === 0 ? rise(f, 24, 14, 6, 3) : rise(k, 0, 10, 6, 3), vi === 2 ? leave(f, ROUTINE.off[0], 10) : leave(k, nextAt - 6, 6, 4, 3));
  return (
    <AbsoluteFill style={{ background: "#020304" }}>
      <ThreeCanvas width={1920} height={1080} gl={{ antialias: true }} dpr={1} style={{ position: "absolute", inset: 0 }}>
        <PhoneOnTable dive={dive} />
      </ThreeCanvas>
      {/* the time, as on a security camera: quiet, factual */}
      <div style={{ position: "absolute", right: 90, top: 76, fontFamily: fonts.ui, fontWeight: 400, fontSize: TYPE.label, letterSpacing: 6, color: L.mute, ...clock }}>
        {CLOCKS[vi]}
      </div>
      <Finish vignette={0.8} />
    </AbsoluteFill>
  );
};

// ───────── 2. The dark map ─────────
const [tx, ty] = lampXY(TRANSFERS);
const [px, py] = lampXY(PAYMENTS);
export const DARK_CAM_END: Cam = { x: -330, y: 20, z: -430, rx: 16, ry: -16 };
export const darkMapCam = (f: number): Cam => {
  const pan = p(f, 24, 70, ez.inOut);
  const back = p(f, 70, 200, ez.inOut);
  const drift = Math.max(0, f - 200) * 0.04;
  return {
    x: mix(mix(tx, px, pan), DARK_CAM_END.x, back) + drift * 0.6,
    y: mix(mix(ty, py, pan), DARK_CAM_END.y, back),
    z: mix(980, DARK_CAM_END.z, back),
    rx: mix(0, DARK_CAM_END.rx, back),
    ry: mix(0, DARK_CAM_END.ry, back) + drift * 0.05,
  };
};
export const litOnly = (i: number) => (i === TRANSFERS || i === PAYMENTS ? { level: 1, warm: 1 } : { level: 0 });

export const DarkMap: React.FC = () => {
  const f = useCurrentFrame();
  const end = LEN.darkmap;
  const enter = p(f, 0, 22, ez.out);
  const two = M("darkmap.two", 240);
  const stats = p(f, 196, 220);
  const out = leave(f, end - 10, 10);
  return (
    <AbsoluteFill style={{ background: L.night }}>
      <AbsoluteFill style={{ opacity: enter }}>
        <ProductGrid cam={darkMapCam(f)} state={litOnly} labels={p(f, 90, 180)} />
      </AbsoluteFill>
      {/* left: the two numbers; the narration says what they are, one quiet line says it again */}
      <AbsoluteFill style={{ background: `linear-gradient(90deg, ${L.night} 18%, rgba(5,7,12,.85) 34%, transparent 52%)`, opacity: stats }} />
      <div style={{ position: "absolute", left: 120, top: 190, ...both(rise(f, 196, 20), out) }}>
        <Big>{CONTENT.productsInApp}</Big>
        <Context style={{ marginTop: 18 }}>products and services in the app</Context>
      </div>
      <div style={{ position: "absolute", left: 120, top: 560, ...both(rise(f, two - 4, 20), out) }}>
        <Big size={TYPE.display} color={L.lamp}>Pay · Transfer</Big>
        <Context style={{ marginTop: 18 }}>all that many customers ever used</Context>
      </div>
      <Finish />
    </AbsoluteFill>
  );
};

// ───────── 3. The usual fix: ads, swiped away ─────────
const ADS = [
  "DigiDeposit: make your savings grow. Open one today.",
  "Your pre-approved cash loan is waiting for you.",
  "Get TamKart. Free delivery this week.",
  "Travel insurance in two minutes.",
  "Invest in bonds in three taps.",
  "New: connect all your accounts with Open banking.",
  "Cashback weekend is here.",
  "Have you tried DigiTravel?",
  "Pay by QR and save.",
  "Your credit card offer expires soon.",
  "Kids card: their first card, your control.",
  "Gold account: now in the app.",
];
// arrival, drag start and direction: three slow, then a flurry
const DRAG = 10, FLING = 8;
export const SCHEDULE = ADS.map((_, i) => {
  const at = i < 3 ? 14 + i * 32 : 110 + (i - 3) * 11;
  return { at, drag: at + (i < 3 ? 18 : 6), dir: i % 2 === 0 ? -1 : 1 };
});

const Notification: React.FC<{ text: string; f: number; at: number; drag: number; dir: number }> = ({ text, f, at, drag, dir }) => {
  const t = p(f, at, at + 12, ez.outBack);
  // the card follows the finger while it drags, then flies off with momentum
  const held = p(f, drag, drag + DRAG, ez.inOutSine);
  const fly = p(f, drag + DRAG, drag + DRAG + FLING, ez.fling);
  const x = dir * (held * 260 + fly * 1300);
  return (
    <div style={{
      position: "absolute", left: "50%", top: 330, width: 800, marginLeft: -400,
      transform: `translate(${x}px, ${(1 - t) * -60}px) rotate(${dir * (held * 2 + fly * 8)}deg) scale(${mix(0.96, 1, t)})`,
      opacity: Math.min(1, t * 1.6) * (1 - fly * 0.7),
      filter: fly > 0.02 ? `blur(${fly * 8}px)` : undefined,
    }}>
      <div style={{
        display: "flex", gap: 22, alignItems: "center", padding: "24px 28px", borderRadius: 34,
        background: "rgba(38,42,54,.82)", boxShadow: "0 30px 80px rgba(0,0,0,.55)", border: "1px solid rgba(255,255,255,.08)",
      }}>
        <Img src={staticFile("brand/abb-mobile-icon.png")} style={{ width: 72, height: 72, borderRadius: 17 }} />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: fonts.ui, fontSize: TYPE.label, color: "#AEB4C2" }}>
            <span style={{ fontWeight: 600, color: "#E6E9F0" }}>ABB mobile</span><span>now</span>
          </div>
          <div style={{ fontFamily: fonts.ui, fontSize: TYPE.context, fontWeight: 400, color: "#F2F4F8", marginTop: 6 }}>{text}</div>
        </div>
      </div>
    </div>
  );
};

export const Ads: React.FC = () => {
  const f = useCurrentFrame();
  const dismissed = SCHEDULE.filter((s) => f >= s.drag + DRAG + 4).length;
  // the wall behind goes out of focus (ramped, not cut) while the offers pile in; no lamp comes on
  const defocus = p(f, 0, 15, ez.inOut);
  const cam: Cam = { x: DARK_CAM_END.x + f * 0.02, y: DARK_CAM_END.y, z: DARK_CAM_END.z + f * 0.25, rx: DARK_CAM_END.rx, ry: DARK_CAM_END.ry + f * 0.01 };
  return (
    <AbsoluteFill style={{ background: L.night }}>
      <AbsoluteFill style={{ filter: `blur(${defocus * 6}px) brightness(${1 - defocus * 0.45})` }}>
        <ProductGrid cam={cam} state={litOnly} labels={1 - defocus * 0.4} />
      </AbsoluteFill>
      {SCHEDULE.map((s, i) => (f < s.at || f > s.drag + DRAG + FLING + 2 ? null : <Notification key={i} text={ADS[i]} f={f} at={s.at} drag={s.drag} dir={s.dir} />))}
      {/* the fingertip: presses, drags with the card, lifts off as the card flies */}
      {SCHEDULE.map((s, i) => {
        const k = f - s.drag;
        if (k < -3 || k > DRAG + 4) return null;
        const held = p(f, s.drag, s.drag + DRAG, ez.inOutSine);
        const press = p(f, s.drag - 3, s.drag, ez.out) * (1 - p(f, s.drag + DRAG, s.drag + DRAG + 4, ez.exit));
        return <div key={`t${i}`} style={{ position: "absolute", left: 960 + s.dir * held * 260 - 34, top: 420, width: 68, height: 68, borderRadius: 34, background: "rgba(255,255,255,.22)", border: "2px solid rgba(255,255,255,.4)", opacity: press, transform: `scale(${mix(1.15, 1, press)})` }} />;
      })}
      <div style={{ position: "absolute", right: 110, top: 150, textAlign: "right", ...rise(f, 60, 18) }}>
        <Big size={TYPE.display}>{dismissed}</Big>
        <Context style={{ marginTop: 8 }}>offers swiped away</Context>
      </div>
      <Finish />
    </AbsoluteFill>
  );
};

// ───────── 4. The question, alone on black ─────────
export const Question: React.FC = () => {
  const f = useCurrentFrame();
  const end = LEN.question;
  const second = M("question.to", 95) - 3;
  return (
    <AbsoluteFill style={{ background: "#000", justifyContent: "center", alignItems: "center" }}>
      <div style={{ fontFamily: fonts.ui, fontWeight: 600, fontSize: 52, color: L.text, textAlign: "center", lineHeight: 1.35, ...leave(f, end - 18, 16, 6, 6) }}>
        <div style={rise(f, 10, 20)}>How do you introduce a bank</div>
        <div style={{ color: L.lamp, ...rise(f, second, 20) }}>to people who aren't looking?</div>
      </div>
    </AbsoluteFill>
  );
};
