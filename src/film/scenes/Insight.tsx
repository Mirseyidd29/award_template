import React from "react";
import { AbsoluteFill, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { fonts } from "../../theme/fonts";
import { Lamp } from "../Lamp";
import { Floodlight } from "../Floodlight";
import { CONTENT } from "../content";
import { both, Context, ez, Finish, Kicker, L, leave, LEN, M, mix, p, rgba, rise, switchOn, TYPE } from "../look";

// ───────── 5. Light: one lamp clicks on ─────────
export const LIGHT_ON = 18;
const HERO = 330;
/** where the hero lamp is at frame f of the Light scene (centre, size): the calendar starts from exactly here */
export const heroLamp = (f: number) => {
  const push = mix(1, 1.12, p(f, 0, LEN.light, ez.inOutSine));
  const lift = mix(0, -60, p(f, M("light.so", 164) - 4, M("light.so", 164) + 20, ez.out));
  return { x: 960, y: 540 + lift * push, size: HERO * push };
};
export const Light: React.FC = () => {
  const f = useCurrentFrame();
  const end = LEN.light;
  const s = switchOn(f, LIGHT_ON, 34);
  const h = heroLamp(f);
  const so = M("light.so", 164), made = M("light.made", 224);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {/* haze the light falls into */}
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 60% 55% at 50% 42%, ${rgba("#FFE8C4", 0.14 * s.level)}, transparent 70%)` }} />
      <div style={{ position: "absolute", left: h.x - h.size / 2, top: h.y - h.size / 2 }}>
        <Lamp size={h.size} level={s.level} warm={s.warm} flare />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 690, textAlign: "center", fontFamily: fonts.display, fontWeight: 800, fontSize: TYPE.display, letterSpacing: 3, lineHeight: 1, ...leave(f, end - 12, 10) }}>
        <div style={{ color: L.text, ...rise(f, so - 2, 20) }}>FIND THE PASSION.</div>
        <div style={{ color: L.lamp, ...rise(f, made - 2, 20) }}>MAKE IT A GAME.</div>
      </div>
      <Finish vignette={0.5} />
    </AbsoluteFill>
  );
};

// ───────── 6. The calendar: the lamp lands on kick-off day; on "kick off" the tournament days follow ─────────
const S = 64, G = 34, X0 = 330, Y0 = 300, ROW = S + 44;
const cell = (d: number) => { const i = d - 1; return { x: X0 + (i % 7) * (S + G), y: Y0 + Math.floor(i / 7) * ROW }; };
export const Calendar: React.FC = () => {
  const f = useCurrentFrame();
  const kick = M("calendar.kick", 107);
  const land = p(f, 0, 26, ez.inOut);
  const from = heroLamp(LEN.light), to = cell(11);
  const lx = mix(from.x, to.x + S / 2, land), ly = mix(from.y, to.y + S / 2, land), ls = mix(from.size, S, land);
  const days = Array.from({ length: 30 }, (_, i) => i + 1);
  const at = (d: number) => (d > 11 ? kick + 16 + (d - 12) * 2 : 99999);
  return (
    <AbsoluteFill style={{ background: L.night }}>
      <AbsoluteFill style={{ background: "#000", opacity: 1 - p(f, 0, 20) }} />
      <Kicker color={L.text} style={{ position: "absolute", left: X0, top: 190, letterSpacing: 10, ...rise(f, 6, 18) }}>{CONTENT.calendarMonth}</Kicker>
      {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
        <div key={i} style={{ position: "absolute", left: X0 + i * (S + G), top: 254, width: S, textAlign: "center", fontFamily: fonts.ui, fontWeight: 600, fontSize: 16, letterSpacing: 2, color: L.dim, ...rise(f, 8, 16, 6, 3) }}>{d}</div>
      ))}
      {days.map((d) => {
        if (d === 11) return null;
        const { x, y } = cell(d);
        const row = Math.floor((d - 1) / 7);
        const s = switchOn(f, at(d), 14);
        return (
          <div key={d} style={{ position: "absolute", left: x, top: y, width: S, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, ...rise(f, 4 + row * 2, 16, 10, 4) }}>
            <Lamp size={S} level={s.level} warm={s.warm} />
            <div style={{ fontFamily: fonts.ui, fontWeight: 600, fontSize: 17, color: s.level > 0.5 ? L.text : L.dim }}>{d}</div>
          </div>
        );
      })}
      {/* the hero lamp from the previous shot, landing on the 11th */}
      <div style={{ position: "absolute", left: lx - ls / 2, top: ly - ls / 2 }}>
        <Lamp size={ls} level={1} warm={1} flare={land < 0.6} />
      </div>
      <div style={{ position: "absolute", left: to.x, top: to.y + S + 8, width: S, textAlign: "center", fontFamily: fonts.ui, fontWeight: 600, fontSize: 17, color: L.text, opacity: p(f, 22, 30) }}>11</div>
      {/* the 11th, explained, on "kick off" */}
      <div style={{ position: "absolute", left: 1120, top: 370 }}>
        <div style={{ fontFamily: fonts.display, fontWeight: 800, fontSize: TYPE.display, lineHeight: 0.92, color: L.text, ...rise(f, kick - 2, 20) }}>THE WORLD CUP<br />KICKS OFF</div>
        <Context style={{ marginTop: 22, ...rise(f, kick + 14, 18) }}>{CONTENT.calendarLine}</Context>
      </div>
      <Finish />
    </AbsoluteFill>
  );
};

// ───────── 7. Football and people: slow, letterboxed, ending on a floodlight ─────────
const CLIPS: [string, number, string][] = [
  // [file in public/footage, length in frames, what the shot should show]. The files in the repo are placeholders.
  ["stadium", 50, "Packed stadium"],
  ["fans_hug", 46, "Fans hug"],
  ["player_closeup", 46, "A player, fist to chest"],
  ["fans_eyes_closed", 40, "Fans, eyes closed"],
  ["fan_beaming", 40, "A fan beaming"],
  ["looking_up", 40, "Looking to the sky"],
  ["confetti", 48, "Confetti"],
];
const XF = 8; // cross-dissolve frames
export const BARS = 132;
export const FLOOD = { lamp: 50, rot: -4, x: 960, y: 400 };
export const floodScale = (fl: number) => mix(1.0, 1.12, p(fl, 0, 60, ez.inOutSine));
export const MONTAGE_FLOOD_AT = CLIPS.reduce((a, c) => a + c[1], 0);
export const Montage: React.FC = () => {
  const f = useCurrentFrame();
  let t = 0;
  const placed = CLIPS.map(([clip, len]) => { const a = t; t += len; return { clip, a, len }; });
  const fl = f - MONTAGE_FLOOD_AT;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {placed.map(({ clip, a, len }, i) => (
        <Sequence key={clip} from={a} durationInFrames={len + XF}>
          <AbsoluteFill style={{ opacity: i === 0 ? p(f, 0, 10) : p(f, a, a + XF, ez.inOutSine), filter: i > 0 && f < a + XF ? `blur(${(1 - p(f, a, a + XF)) * 4}px)` : undefined }}>
            <OffthreadVideo src={staticFile(`footage/${clip}.mp4`)} muted playbackRate={0.5}
              style={{ width: "100%", height: "100%", objectFit: "cover", filter: "saturate(.82) contrast(1.08) brightness(.9) sepia(.08)", transform: `scale(${1.04 + (f - a) * 0.0009})` }} />
          </AbsoluteFill>
        </Sequence>
      ))}
      {/* the floodlight: the same grid as the product wall, all lamps on */}
      {fl >= -XF && (
        <AbsoluteFill style={{ opacity: p(fl, -XF, 4), background: "radial-gradient(ellipse at 50% 30%, #0d1424, #020306 70%)", overflow: "hidden" }}>
          <div style={{ position: "absolute", left: FLOOD.x, top: FLOOD.y, transform: `translate(-50%, -50%) scale(${floodScale(fl)}) rotate(${FLOOD.rot}deg)` }}>
            <Floodlight lamp={FLOOD.lamp} state={() => ({ level: 1, warm: 1 })} beam={1} />
          </div>
        </AbsoluteFill>
      )}
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: BARS, background: "#000" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: BARS, background: "#000" }} />
      <Finish vignette={0.6} grain={0.08} />
    </AbsoluteFill>
  );
};
