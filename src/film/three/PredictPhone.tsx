import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import { blackGlass, PHONE, SCREEN, StudioEnv, titanium, usePhoneAssets } from "../../shared/Phone3D";
import { ez, mix, p } from "../look";

// Step 1, Predict: a match card, the score typed in and confirmed. Teams, date and score are placeholders.
const TEX_W = 720, TEX_H = 1555;
const font = (w: number, px: number) => `${w} ${px}px Inter, sans-serif`;
const rr = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => { g.beginPath(); g.roundRect(x, y, w, h, r); };

const draw = (g: CanvasRenderingContext2D, step: number, flags: [HTMLImageElement, HTMLImageElement]) => {
  const bg = g.createLinearGradient(0, 0, 0, TEX_H);
  bg.addColorStop(0, "#0B1A3E"); bg.addColorStop(1, "#050B1C");
  g.fillStyle = bg; g.fillRect(0, 0, TEX_W, TEX_H);
  g.textAlign = "center";
  // header
  const pill = g.createLinearGradient(190, 0, 530, 0);
  pill.addColorStop(0, "#CC80C4"); pill.addColorStop(0.5, "#A280E9"); pill.addColorStop(1, "#5EA8EF");
  g.fillStyle = pill; rr(g, 200, 120, 320, 74, 24); g.fill();
  g.fillStyle = "#fff"; g.font = font(800, 38); g.fillText("ABB PLAY", 360, 170);
  g.fillStyle = "rgba(255,255,255,.55)"; g.font = font(600, 22); g.fillText("WORLD CUP · GROUP STAGE", 360, 250);
  // match card
  g.fillStyle = "rgba(255,255,255,.06)"; rr(g, 40, 290, 640, 560, 40); g.fill();
  g.fillStyle = "rgba(255,255,255,.6)"; g.font = font(600, 24); g.fillText("MATCHDAY · KICK-OFF TIME", 360, 350);
  const flag = (img: HTMLImageElement, x: number) => {
    g.save(); rr(g, x - 70, 400, 140, 94, 12); g.clip(); g.drawImage(img, x - 70, 400, 140, 94); g.restore();
  };
  flag(flags[0], 170); flag(flags[1], 550);
  g.fillStyle = "#fff"; g.font = font(600, 28); g.fillText("Team A", 170, 540); g.fillText("Team B", 550, 540);
  const digits = step === 0 ? ["", ""] : step === 1 ? ["X", ""] : ["X", "X"];
  digits.forEach((d, i) => {
    const x = i === 0 ? 290 : 430;
    g.fillStyle = d ? "#ffffff" : "rgba(255,255,255,.08)"; rr(g, x - 52, 600, 104, 130, 22); g.fill();
    if (!d && ((step === 0 && i === 0) || (step === 1 && i === 1))) { g.strokeStyle = "#5EA8EF"; g.lineWidth = 4; rr(g, x - 52, 600, 104, 130, 22); g.stroke(); }
    g.fillStyle = "#0B1A3E"; g.font = font(800, 84); g.fillText(d, x, 696);
  });
  g.fillStyle = "rgba(255,255,255,.5)"; g.font = font(800, 54); g.fillText(":", 360, 684);
  g.fillStyle = "rgba(255,255,255,.45)"; g.font = font(400, 22); g.fillText("Predictions close at kick-off", 360, 800);
  // confirm / confirmed
  if (step < 3) {
    g.fillStyle = step === 2 ? "#2E6AE6" : "rgba(46,106,230,.35)"; rr(g, 40, 890, 640, 100, 30); g.fill();
    g.fillStyle = "#fff"; g.font = font(800, 32); g.fillText("Confirm", 360, 952);
  } else {
    g.fillStyle = "#4BD478"; rr(g, 40, 890, 640, 100, 30); g.fill();
    g.fillStyle = "#06140B"; g.font = font(800, 32); g.fillText("✓  Prediction confirmed", 360, 952);
  }
  // keypad
  g.fillStyle = "rgba(255,255,255,.04)"; g.fillRect(0, 1040, TEX_W, TEX_H - 1040);
  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].forEach((k, i) => {
    const x = 130 + (i % 3) * 230, y = 1100 + Math.floor(i / 3) * 104;
    if (!k) return;
    g.fillStyle = "rgba(255,255,255,.1)"; rr(g, x - 95, y - 34, 190, 84, 18); g.fill();
    g.fillStyle = "#fff"; g.font = font(600, 40); g.fillText(k, x, y + 22);
  });
  // rounded display corners + island
  g.globalCompositeOperation = "destination-in"; rr(g, 0, 0, TEX_W, TEX_H, 92); g.fill(); g.globalCompositeOperation = "source-over";
  g.fillStyle = "#000"; rr(g, TEX_W / 2 - 112, 30, 224, 64, 32); g.fill();
  g.fillStyle = "#fff"; g.font = font(600, 34); g.textAlign = "left"; g.fillText("23:01", 70, 72);
};

const load = (src: string) => new Promise<HTMLImageElement>((res) => { const i = new Image(); i.onload = () => res(i); i.src = src; });

export const usePredictScreens = () => {
  const [tex, setTex] = useState<THREE.Texture[] | null>(null);
  const [handle] = useState(() => delayRender("predict screens"));
  const advance = useThree((s) => s.advance);
  useEffect(() => {
    Promise.all([
      ...["400", "600", "800"].map((w) => document.fonts.load(`${w} 40px Inter`)),
      load(staticFile("flags/team-a.png")), load(staticFile("flags/team-b.png")),
    ]).then((r) => {
      const flags = [r[3], r[4]] as [HTMLImageElement, HTMLImageElement];
      setTex([0, 1, 2, 3].map((s) => {
        const c = document.createElement("canvas"); c.width = TEX_W; c.height = TEX_H;
        draw(c.getContext("2d")!, s, flags);
        const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
      }));
    });
  }, []);
  useEffect(() => { if (tex) requestAnimationFrame(() => { advance(performance.now()); continueRender(handle); }); }, [tex, advance, handle]);
  return tex;
};

/** taps: frame → which key; screen step changes on the tap */
export const PREDICT_TAPS = [22, 38, 58]; // first digit, second digit, confirm (on "Predict every score")
const KEY_POS: [number, number][] = [[360, 1122], [360, 1434], [360, 940]]; // texture px of "2", "0", Confirm

export const PredictPhone: React.FC = () => {
  const f = useCurrentFrame();
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const { geo } = usePhoneAssets();
  const screens = usePredictScreens();
  const step = PREDICT_TAPS.filter((t) => f >= t).length;

  useLayoutEffect(() => {
    const t = p(f, 0, 200, ez.inOutSine);
    camera.position.set(mix(-0.4, 0.3, t), mix(0.12, 0.04, t), mix(3.7, 3.3, t));
    camera.fov = 32; camera.near = 0.05; camera.far = 30;
    camera.lookAt(0.3, 0, 0);
    camera.updateProjectionMatrix();
  }, [f, camera]);

  const tapIdx = PREDICT_TAPS.findIndex((t) => f >= t && f < t + 16);
  const tap = tapIdx >= 0 ? (f - PREDICT_TAPS[tapIdx]) / 16 : -1;
  const [u, v] = tapIdx >= 0 ? KEY_POS[tapIdx] : [0, 0];
  const enter = p(f, 0, 30, ez.out);
  return (
    <>
      <StudioEnv />
      <ambientLight intensity={0.15} />
      <directionalLight position={[-3, 3, 4]} intensity={0.9} color={"#dfe8ff"} />
      <directionalLight position={[4, -1, 2]} intensity={0.4} color={"#4C86FF"} />
      <group position={[0, mix(-0.2, 0, enter), 0]} rotation={[0.04, mix(0.55, 0.32, p(f, 0, 200, ez.inOutSine)), 0.02]}>
        <mesh geometry={geo.body} material={titanium} />
        <mesh geometry={geo.glass} material={blackGlass} position={[0, 0, PHONE.d / 2 + 0.001]} />
        {screens && (
          <mesh geometry={geo.screen} position={[0, 0, SCREEN.z]}>
            <meshBasicMaterial map={screens[step]} transparent toneMapped={false} color={new THREE.Color(0.85, 0.85, 0.85)} />
          </mesh>
        )}
        {tap >= 0 && (
          <mesh position={[(u / TEX_W - 0.5) * SCREEN.w, (0.5 - v / TEX_H) * SCREEN.h, SCREEN.z + 0.004]} scale={0.02 + tap * 0.08}>
            <ringGeometry args={[0.8, 1, 48]} />
            <meshBasicMaterial color={"#9EC0FF"} transparent opacity={(1 - tap) * 0.8} toneMapped={false} />
          </mesh>
        )}
        <mesh geometry={geo.button} material={titanium} position={[-PHONE.w / 2 - 0.004, 0.35, 0]} />
        <mesh geometry={geo.button} material={titanium} position={[PHONE.w / 2 + 0.004, 0.25, 0]} scale={[1, 1.4, 1]} />
      </group>
    </>
  );
};
