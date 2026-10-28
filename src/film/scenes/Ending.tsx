import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { fonts } from "../../theme/fonts";
import { ClubKey, clubs, Crest } from "../../shared/brand";
import { Floodlight } from "../Floodlight";
import { COLS } from "../ProductGrid";
import { headOf, HEAD, LightsStadium, StadiumCam } from "../three/LightsStadium";
import { CONTENT } from "../content";
import { both, ez, Finish, Kicker, L, leave, LEN, M, mix, Mock, p, rgba, rise, switchOff, switchOn, TYPE } from "../look";

// ───────── 17. Ending (B): the final whistle, the lights die, darkness… then BOOM: the players wanted more.
// "So we kept going." Clunk: a night stadium whose floodlight heads are the film's 8×6 lamp grid.
// A (alternative): black, silence, clunk, "We were just getting started".
const OFF_AT = (i: number) => 16 + Math.floor(i / COLS) * 6 + (i % COLS) * 0.8; // row by row, a lamp at a time
export const ON_AGAIN = { A: 130, B: M("ending.going", 190) }; // the clunk lands on "going"
const BOOM = M("ending.but", 106);
/** stadium beats, in frames after the clunk (B), synced to the voice */
const K = (abs: number) => abs - ON_AGAIN.B;
export const STADIUM = {
  towers: [0, K(M("ending.months", 327)), K(M("ending.months", 327)) + 10, K(M("ending.months", 327)) + 20],
  crane: [K(M("ending.months", 327)) + 12, K(M("ending.months", 327)) + 104] as [number, number],
  ml: [K(M("ending.league", 221)) - 6, K(M("ending.ended", 423)) - 30] as [number, number],
  ended: K(M("ending.ended", 423)) - 2,
  lights: K(M("ending.lights", 471)) - 2,
};

// the hero head (tower 0): in front of it, looking back at it, then craning out over the stadium
const hero = headOf(0);
const fwd = new THREE.Vector3(Math.sin(hero.yaw) * Math.cos(HEAD.tilt), -Math.sin(HEAD.tilt), Math.cos(hero.yaw) * Math.cos(HEAD.tilt));
const at = (d: number, lift = 0) => hero.pos.clone().add(fwd.clone().multiplyScalar(d)).add(new THREE.Vector3(0, lift, 0));
const stadiumCam = (k: number): StadiumCam => {
  const back = p(k, 0, STADIUM.crane[0], ez.inOutSine);
  const crane = p(k, STADIUM.crane[0], STADIUM.crane[1], ez.inOut);
  const near = at(mix(10, 28, back), mix(0, 2, back));
  const wide = new THREE.Vector3(22, 64, 136);
  const pos = near.clone().lerp(wide, crane);
  const lookNear = hero.pos.clone().add(new THREE.Vector3(0, mix(-3.2, -9, back), 0));
  const look = lookNear.lerp(new THREE.Vector3(0, 7, -6), crane);
  // after the crane, a very slow drift so the held line never sits on a frozen frame
  const drift = Math.max(0, k - STADIUM.crane[1]) * 0.04;
  return { pos: [pos.x - drift, pos.y, pos.z - drift * 0.5], look: [look.x, look.y, look.z], fov: mix(44, 48, crane) };
};
const towerLamps = (k: number) => (t: number, i: number) => {
  const start = STADIUM.towers[t] + (i % COLS) + Math.floor(i / COLS) * 2;
  return switchOn(k, start, t === 0 ? 22 : 16);
};

const MasterLeague: React.FC<{ k: number }> = ({ k }) => {
  const [a, b] = STADIUM.ml;
  if (k < a - 1 || k > b + 12) return null;
  const crests = Object.keys(clubs) as ClubKey[];
  return (
    <AbsoluteFill style={leave(k, b, 12)}>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, transparent 45%, rgba(3,5,10,.85) 78%)", opacity: p(k, a, a + 16) }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 680, textAlign: "center" }}>
        <Kicker color={L.mute} style={rise(k, a, 16, 6, 3)}>ABB PLAY Master League</Kicker>
        <div style={{ fontFamily: fonts.display, fontWeight: 800, fontSize: TYPE.display, color: L.text, marginTop: 10, letterSpacing: 2, ...rise(k, a + 4, 18) }}>{CONTENT.leagueLine}</div>
        <div style={{ display: "flex", gap: 26, justifyContent: "center", marginTop: 26 }}>
          {crests.map((c, i) => <div key={c} style={rise(k, a + 14 + i * 2, 14, 14, 4)}><Crest club={c} size={56} /></div>)}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const ClosingLine: React.FC<{ k: number }> = ({ k }) => {
  if (k < STADIUM.ended - 1) return null;
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 60% 34% at 50% 52%, rgba(3,5,10,.82), transparent 80%)", opacity: p(k, STADIUM.ended, STADIUM.ended + 20) }} />
      <div style={{ textAlign: "center", marginTop: 40 }}>
        <div style={{ fontFamily: fonts.ui, fontWeight: 500, fontSize: TYPE.context + 6, color: L.body, ...rise(k, STADIUM.ended, 18, 8, 4) }}>The World Cup ended.</div>
        <div style={{ fontFamily: fonts.display, fontWeight: 800, fontSize: 200, lineHeight: 0.95, letterSpacing: 4, color: L.lamp, marginTop: 14, ...rise(k, STADIUM.lights, 22, 18, 10) }}>THE LIGHTS<br />STAYED ON.</div>
      </div>
    </AbsoluteFill>
  );
};

// what players wrote (placeholder until ABB sends real App Store reviews / support messages)
const MESSAGES = [
  ["When does the next game start?", "App Store review"],
  ["Please don't stop this.", "Support chat"],
  ["I still open the app every morning out of habit.", "App Store review"],
  ["What do we play now?", "Support chat"],
  ["Bring ABB PLAY back!", "App Store review"],
  ["Is there a league after the World Cup?", "Support chat"],
];

export const Ending: React.FC<{ variant: "A" | "B" }> = ({ variant }) => {
  const f = useCurrentFrame();
  const back = ON_AGAIN[variant];
  const k = f - back;
  const kk = variant === "A" ? k - 90 : k; // A spends its first 90 frames on "We were just getting started"
  const state = (i: number) => switchOff(f, OFF_AT(i));
  const gloom = p(f, 46, 90, ez.inOutSine); // the room goes from blue-black to black
  const floodGone = p(f, 70, 96, ez.exit);
  const boom = variant === "B" ? BOOM : 9999;
  const flash = (k >= 0 && k < 8 ? (1 - k / 8) * 0.3 : 0) + (f >= boom && f < boom + 8 ? (1 - (f - boom) / 8) * 0.22 : 0);
  const just = variant === "A" ? Math.min(p(k, 8, 22, ez.out), 1 - p(k, 76, 90, ez.exit)) : 0;
  const msgOut = back - 22;
  const dimForLine = p(kk, STADIUM.lights - 6, STADIUM.lights + 24, ez.inOut);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {/* the final whistle: the floodlight from the montage, its lamps dying one by one, then darkness */}
      {k < 0 && (
        <>
          <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 30%, #0d1424, #020306 70%)", opacity: 1 - gloom }} />
          {floodGone < 1 && (
            <div style={{ position: "absolute", left: 960, top: 400, transform: "translate(-50%, -50%)" }}>
              <div style={both(rise(f, 0, 14, 10, 4), { opacity: 1 - floodGone })}>
                <Floodlight lamp={58} state={state} beam={1 - p(f, 16, 60, ez.exit)} />
              </div>
            </div>
          )}
        </>
      )}
      {/* after the clunk: the stadium */}
      {k >= -1 && (
        <AbsoluteFill style={{ filter: `brightness(${1 - 0.55 * dimForLine})` }}>
          <ThreeCanvas width={1920} height={1080} gl={{ antialias: true }} dpr={1} style={{ position: "absolute", inset: 0 }}>
            <LightsStadium cam={stadiumCam(Math.max(0, kk))} lamps={towerLamps(kk)} frame={f} />
          </ThreeCanvas>
        </AbsoluteFill>
      )}
      {/* B: BOOM, and the players' messages burst in; they leave in reverse order before the clunk */}
      {variant === "B" && f >= boom && k < 2 && (
        <AbsoluteFill style={{ transform: `scale(${mix(1.04, 1, p(f, boom, boom + 12, ez.out))})` }}>
          {MESSAGES.map(([m, src], i) => {
            const t0 = boom + 2 + i * 4;
            const left = i % 2 === 0;
            const out = msgOut + (MESSAGES.length - 1 - i) * 2;
            return (
              <div key={i} style={{
                position: "absolute", top: 170 + i * 108, [left ? "left" : "right"]: 300 + (i % 3) * 50,
                ...both(both(rise(f, t0, 12, 24, 6), { transform: `scale(${mix(0.92, 1, p(f, t0, t0 + 12, ez.outBack))})` }), leave(f, out, 10, 12, 4)),
              }}>
                <div style={{ fontFamily: fonts.ui, fontSize: TYPE.context, color: "#F2F4F8", background: left ? "#1C2130" : "#232A3B", padding: "16px 26px", borderRadius: 22, border: "1px solid rgba(255,255,255,.07)", boxShadow: "0 16px 40px rgba(0,0,0,.45)" }}>
                  {m}
                  <div style={{ fontSize: 15, color: L.mute, marginTop: 6, letterSpacing: 1 }}>{src}</div>
                </div>
              </div>
            );
          })}
          <Mock />
        </AbsoluteFill>
      )}
      {/* A: the line on the clunk */}
      {variant === "A" && just > 0 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 760, textAlign: "center", opacity: just }}>
          <div style={{ fontFamily: fonts.display, fontWeight: 800, fontSize: TYPE.display, color: L.text, letterSpacing: 3 }}>WE WERE JUST GETTING STARTED.</div>
        </div>
      )}
      {k >= 0 && <MasterLeague k={kk} />}
      {k >= 0 && <ClosingLine k={kk} />}
      {flash > 0 && <AbsoluteFill style={{ background: L.lamp, opacity: flash }} />}
      <Finish vignette={0.6} />
    </AbsoluteFill>
  );
};

// ───────── 18. End card: ABB signs it. The symbol turns one petal into place, the wordmark slides out from behind it,
// then ABB mobile settles underneath. No lamps here: the bank's own mark, plainly.
const LOGO_H = 190;                      // the logo PNG is the 886×886 symbol + the wordmark from x=929 to 1958
const LS = LOGO_H / 886, LOGO_W = 1958 * LS, WORD_X = 929 * LS;
const PETAL = 360 / 7;                   // the symbol has seven petals: turning exactly one lands on the same shape
export const Card: React.FC = () => {
  const f = useCurrentFrame();
  const sym = p(f, 2, 30, ez.out);                       // symbol turns in and grows into place
  const word = p(f, 14, 34, ez.out);                     // wordmark wipes out from behind the symbol
  const lift = p(f, 32, 52, ez.inOut);                   // the lock-up makes room for the app line
  const glow = p(f, 6, 40, ez.out) * (1 - 0.35 * p(f, 40, 80, ez.inOutSine));
  const x0 = 960 - LOGO_W / 2, y0 = mix(540, 470, lift) - LOGO_H / 2;
  const logo = staticFile("brand/abb-logo-white.png");
  const icon = rise(f, 40, 16, 12, 4);
  return (
    <AbsoluteFill style={{ background: L.night }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 38% 34% at 50% ${mix(50, 44, lift)}%, ${rgba(L.abb, 0.22 * glow)}, transparent 72%)` }} />
      {/* the symbol: its own layer so it can turn on its centre */}
      <div style={{ position: "absolute", left: x0, top: y0, width: LOGO_H, height: LOGO_H, overflow: "hidden",
        opacity: Math.min(1, sym * 1.6), transform: `rotate(${(sym - 1) * PETAL}deg) scale(${mix(0.72, 1, sym)})`, filter: sym < 1 ? `blur(${(1 - sym) * 8}px)` : undefined }}>
        <Img src={logo} style={{ height: LOGO_H, width: LOGO_W, maxWidth: "none" }} />
      </div>
      {/* the wordmark: revealed left to right, as if it slides out from behind the symbol */}
      <div style={{ position: "absolute", left: x0 + WORD_X, top: y0, width: LOGO_W - WORD_X, height: LOGO_H, overflow: "hidden",
        clipPath: `inset(0 ${(1 - word) * 100}% 0 0)` }}>
        <Img src={logo} style={{ height: LOGO_H, width: LOGO_W, maxWidth: "none", marginLeft: -WORD_X, transform: `translateX(${(word - 1) * 60}px)`, opacity: Math.min(1, word * 2) }} />
      </div>
      {/* ABB mobile: the place it all happened */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 640, display: "flex", justifyContent: "center", alignItems: "center", gap: 22 }}>
        <Img src={staticFile("brand/abb-mobile-icon.png")} style={{ width: 76, height: 76, borderRadius: 17, ...icon, transform: `${icon.transform} scale(${mix(0.86, 1, p(f, 40, 58, ez.out))})` }} />
        <div style={{ fontFamily: fonts.ui, fontWeight: 600, fontSize: 40, color: L.text, letterSpacing: 0.5, ...rise(f, 46, 16, 12, 4) }}>ABB mobile</div>
      </div>
      <Finish vignette={0.5} />
    </AbsoluteFill>
  );
};
