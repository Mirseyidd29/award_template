import React, { useEffect, useMemo, useState } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { continueRender, delayRender } from "remotion";
import { wc } from "../theme/palette";

// A modern phone: rounded titanium body, black glass front, side buttons, a lit display with rounded corners
// and a glossy glass layer that picks up studio reflections. Screens are drawn on canvas with the film's fonts.
export const PHONE = { w: 0.78, h: 1.62, d: 0.085, r: 0.11 };
export const SCREEN = { w: 0.728, h: 1.572, z: PHONE.d / 2 + 0.006 };
const TEX_W = 720, TEX_H = Math.round((TEX_W * SCREEN.h) / SCREEN.w); // 1555
// the ABB PLAY pitch: centre-circle radius in texture px (texture width = SCREEN.w); stadium pitch circle = 9.4 world units
export const PLAY_CIRCLE_PX = 120;

const rr = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
const font = (w: number, px: number) => `${w} ${px}px Inter, sans-serif`;

const frame = (g: CanvasRenderingContext2D, dark: boolean) => {
  // rounded display corners (transparent outside) + status bar + dynamic island
  g.globalCompositeOperation = "destination-in";
  rr(g, 0, 0, TEX_W, TEX_H, 92); g.fill();
  g.globalCompositeOperation = "source-over";
  g.fillStyle = dark ? "#fff" : "#0d1b3a";
  g.font = font(600, 34); g.textAlign = "left"; g.fillText("9:41", 70, 72);
  for (let i = 0; i < 4; i++) g.fillRect(520 + i * 14, 70 - (i + 1) * 7, 9, (i + 1) * 7);
  rr(g, 590, 46, 56, 28, 8); g.strokeStyle = g.fillStyle as string; g.lineWidth = 3; g.stroke();
  rr(g, 594, 50, 40, 20, 5); g.fill();
  g.fillStyle = "#000"; rr(g, TEX_W / 2 - 112, 30, 224, 64, 32); g.fill();
};

/** An ordinary, clean banking app: what customers open because they have to. */
// every phone on the wall belongs to someone else
export const PEOPLE: [string, string, string][] = [
  ["Aysel", "X,XXX.XX", "XXXX"], ["Elvin", "X,XXX.XX", "XXXX"], ["Leyla", "X,XXX.XX", "XXXX"], ["Murad", "X,XXX.XX", "XXXX"],
  ["Nigar", "X,XXX.XX", "XXXX"], ["Rashad", "X,XXX.XX", "XXXX"], ["Gunel", "X,XXX.XX", "XXXX"], ["Tural", "X,XXX.XX", "XXXX"],
  ["Aynur", "X,XXX.XX", "XXXX"], ["Kamran", "X,XXX.XX", "XXXX"], ["Sevinj", "X,XXX.XX", "XXXX"], ["Orkhan", "X,XXX.XX", "XXXX"],
  ["Nargiz", "X,XXX.XX", "XXXX"], ["Farid", "X,XXX.XX", "XXXX"],
];
const drawBank = (g: CanvasRenderingContext2D, [name, balance, cardNo]: [string, string, string]) => {
  g.fillStyle = "#F3F5F9"; g.fillRect(0, 0, TEX_W, TEX_H);
  g.fillStyle = "#0d1b3a"; g.textAlign = "left";
  g.font = font(400, 30); g.fillStyle = "#7d879b"; g.fillText("Good morning,", 56, 168);
  g.font = font(800, 46); g.fillStyle = "#0d1b3a"; g.fillText(name, 56, 222);
  g.fillStyle = "#dfe4ee"; g.beginPath(); g.arc(640, 190, 38, 0, Math.PI * 2); g.fill();
  // balance card
  const card = g.createLinearGradient(56, 270, 664, 560);
  card.addColorStop(0, "#1C2B4A"); card.addColorStop(1, "#3C5683");
  g.fillStyle = card; rr(g, 40, 268, 640, 300, 38); g.fill();
  g.fillStyle = "rgba(255,255,255,.65)"; g.font = font(600, 26); g.fillText("Main account", 80, 330);
  g.fillStyle = "#fff"; g.font = font(800, 64); g.fillText(balance, 80, 420);
  const bw = g.measureText(balance).width;
  g.font = font(600, 30); g.fillText("AZN", 80 + bw + 14, 420);
  g.fillStyle = "rgba(255,255,255,.65)"; g.font = font(400, 26); g.fillText(`•••• ${cardNo}`, 80, 520);
  g.fillStyle = "rgba(255,255,255,.12)"; g.beginPath(); g.arc(610, 330, 120, 0, Math.PI * 2); g.fill();
  // quick actions
  ["Transfer", "Pay", "Top up", "Cards"].forEach((t, i) => {
    const x = 110 + i * 166;
    g.fillStyle = "#fff"; g.beginPath(); g.arc(x, 650, 50, 0, Math.PI * 2); g.fill();
    g.strokeStyle = "#4C6FE0"; g.lineWidth = 6; g.lineCap = "round"; g.beginPath();
    if (i === 0) { g.moveTo(x - 16, 666); g.lineTo(x + 16, 634); g.moveTo(x + 16, 634); g.lineTo(x - 2, 634); g.moveTo(x + 16, 634); g.lineTo(x + 16, 652); }
    if (i === 1) { rr(g, x - 20, 634, 40, 32, 6); }
    if (i === 2) { g.moveTo(x, 632); g.lineTo(x, 668); g.moveTo(x - 18, 650); g.lineTo(x + 18, 650); }
    if (i === 3) { rr(g, x - 22, 636, 44, 30, 6); g.moveTo(x - 22, 646); g.lineTo(x + 22, 646); }
    g.stroke();
    g.fillStyle = "#4a5468"; g.font = font(600, 24); g.textAlign = "center"; g.fillText(t, x, 738);
  });
  // recent payments
  g.textAlign = "left"; g.fillStyle = "#0d1b3a"; g.font = font(800, 34); g.fillText("Recent payments", 56, 826);
  g.fillStyle = "#fff"; rr(g, 40, 856, 640, 560, 34); g.fill();
  const rows: [string, string, string, string][] = [
    ["Electricity bill", "Today", "−XX.XX", "#F2A541"], ["Mobile top-up", "Today", "−XX.XX", "#6C8CF5"], ["Transfer to Elvin", "Yesterday", "−XXX.XX", "#3FB8AF"],
    ["Supermarket", "Yesterday", "−XX.XX", "#E7716A"], ["Salary", "Last week", "+X,XXX.XX", "#4BD478"],
  ];
  rows.forEach(([name, when, amt, c], i) => {
    const y = 912 + i * 104;
    g.fillStyle = c + "33"; g.beginPath(); g.arc(102, y + 16, 34, 0, Math.PI * 2); g.fill();
    g.fillStyle = c; g.beginPath(); g.arc(102, y + 16, 12, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#0d1b3a"; g.font = font(600, 28); g.fillText(name, 156, y + 8);
    g.fillStyle = "#8a94a8"; g.font = font(400, 23); g.fillText(when, 156, y + 42);
    g.textAlign = "right"; g.fillStyle = amt.startsWith("+") ? "#23a35a" : "#0d1b3a"; g.font = font(600, 28); g.fillText(amt, 640, y + 26); g.textAlign = "left";
    if (i < rows.length - 1) { g.fillStyle = "#eef1f6"; g.fillRect(156, y + 70, 484, 2); }
  });
  // tab bar
  g.fillStyle = "#fff"; g.fillRect(0, TEX_H - 150, TEX_W, 150);
  ["Home", "Payments", "Cards", "More"].forEach((t, i) => {
    const x = 100 + i * 173;
    g.fillStyle = i === 0 ? "#4C6FE0" : "#b5bccb"; rr(g, x - 20, TEX_H - 126, 40, 36, 10); g.fill();
    g.font = font(600, 21); g.textAlign = "center"; g.fillText(t, x, TEX_H - 62);
  });
  g.fillStyle = "#0d1b3a"; rr(g, TEX_W / 2 - 110, TEX_H - 24, 220, 9, 5); g.fill();
  frame(g, false);
};

/** Home screen: wallpaper, a grid of muted app icons, the bank app in the centre (the app zooms open from here). */
const drawHome = (g: CanvasRenderingContext2D) => {
  const bg = g.createLinearGradient(0, 0, TEX_W * 0.6, TEX_H);
  bg.addColorStop(0, "#22305A"); bg.addColorStop(0.55, "#2E2B5C"); bg.addColorStop(1, "#141B33");
  g.fillStyle = bg; g.fillRect(0, 0, TEX_W, TEX_H);
  g.fillStyle = "rgba(255,255,255,.06)"; g.beginPath(); g.arc(560, 380, 300, 0, Math.PI * 2); g.fill();
  const icons = ["#5b6b8c", "#7a6aa8", "#4f8a8b", "#a07a5a", "#6f7f9f", "#8a6f8f", "#5f8f6f", "#9a8a5a"];
  const S = 112, gap = (TEX_W - 4 * S) / 5;
  for (let r = 0; r < 6; r++)
    for (let c = 0; c < 4; c++) {
      const x = gap + c * (S + gap), y = 170 + r * 170;
      const centre = r === 3 && (c === 1 || c === 2);
      if (centre) continue;
      g.fillStyle = icons[(r * 4 + c) % icons.length]; rr(g, x, y, S, S, 28); g.fill();
      g.fillStyle = "rgba(255,255,255,.55)"; rr(g, x + 22, y + S + 14, S - 44, 10, 5); g.fill();
    }
  // the bank app icon, centred (where the app opens from)
  const bx = TEX_W / 2 - 62, by = TEX_H / 2 - 62;
  const ic = g.createLinearGradient(bx, by, bx + 124, by + 124);
  ic.addColorStop(0, "#3C5683"); ic.addColorStop(1, "#1C2B4A");
  g.fillStyle = ic; rr(g, bx, by, 124, 124, 30); g.fill();
  g.fillStyle = "#fff"; g.font = font(800, 40); g.textAlign = "center"; g.fillText("AZN", TEX_W / 2, by + 76);
  g.fillStyle = "rgba(255,255,255,.85)"; g.font = font(600, 22); g.fillText("Bank", TEX_W / 2, by + 158);
  // dock
  g.fillStyle = "rgba(255,255,255,.14)"; rr(g, 30, TEX_H - 190, TEX_W - 60, 150, 44); g.fill();
  for (let c = 0; c < 4; c++) { g.fillStyle = icons[(c + 3) % icons.length]; rr(g, gap + c * (S + gap), TEX_H - 171, S, S, 28); g.fill(); }
  frame(g, true);
};

/** ABB PLAY: the pitch fills the screen (same scale and stripes as the 3D stadium, for the match cut). */
const drawPlay = (g: CanvasRenderingContext2D) => {
  const R = PLAY_CIRCLE_PX, cx = TEX_W / 2, cy = TEX_H / 2;
  const stripe = (R * (110 / 18)) / 9.4;
  for (let i = -8; i < 8; i++) {
    g.fillStyle = i % 2 === 0 ? "#1f6b34" : "#247a3c";
    g.fillRect(cx + i * stripe, 0, stripe + 1, TEX_H);
  }
  g.strokeStyle = "rgba(255,255,255,0.92)"; g.lineWidth = 4;
  g.beginPath(); g.moveTo(cx, 0); g.lineTo(cx, TEX_H); g.stroke();
  g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.stroke();
  g.fillStyle = "#fff"; g.beginPath(); g.arc(cx, cy, 7, 0, Math.PI * 2); g.fill();
  // header
  const top = g.createLinearGradient(0, 0, 0, 300);
  top.addColorStop(0, "rgba(6,19,47,.95)"); top.addColorStop(1, "rgba(6,19,47,0)");
  g.fillStyle = top; g.fillRect(0, 0, TEX_W, 300);
  const pill = g.createLinearGradient(170, 0, 550, 0);
  pill.addColorStop(0, "#CC80C4"); pill.addColorStop(0.5, "#A280E9"); pill.addColorStop(1, "#5EA8EF");
  g.fillStyle = pill; rr(g, 180, 124, 360, 84, 26); g.fill();
  g.fillStyle = "#fff"; g.font = font(800, 42); g.textAlign = "center"; g.fillText("ABB PLAY", cx, 180);
  g.fillStyle = "rgba(255,255,255,.8)"; g.font = font(600, 22); g.fillText("WORLD CUP · MATCHDAY", cx, 252);
  // prediction card
  g.fillStyle = "rgba(6,19,47,.88)"; rr(g, 48, TEX_H - 380, 624, 230, 34); g.fill();
  g.fillStyle = "rgba(255,255,255,.7)"; g.font = font(600, 22); g.fillText("YOUR PREDICTION", cx, TEX_H - 330);
  g.fillStyle = "#fff"; g.font = font(800, 84); g.fillText("X – X", cx, TEX_H - 238);
  g.fillStyle = wc.lime; rr(g, cx - 150, TEX_H - 210, 300, 46, 23); g.fill();
  g.fillStyle = "#06132F"; g.font = font(800, 24); g.fillText("+XX,XXX GOALS", cx, TEX_H - 178);
  frame(g, true);
};

const make = (draw: (g: CanvasRenderingContext2D) => void) => {
  const c = document.createElement("canvas");
  c.width = TEX_W; c.height = TEX_H;
  draw(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
};

/** Screens are drawn once the film's fonts are loaded (canvas text would otherwise fall back). */
export const usePhoneAssets = () => {
  const [tex, setTex] = useState<{ banks: THREE.Texture[]; play: THREE.Texture; home: THREE.Texture } | null>(null);
  const [handle] = useState(() => delayRender("phone screens"));
  const advance = useThree((st) => st.advance);
  useEffect(() => {
    Promise.all(["400", "600", "800"].map((w) => document.fonts.load(`${w} 40px Inter`))).then(() => {
      setTex({ banks: PEOPLE.map((p) => make((g) => drawBank(g, p))), play: make(drawPlay), home: make(drawHome) });
    });
  }, []);
  // the canvas only renders on frame changes: draw once more with the screens, then let Remotion take the frame
  useEffect(() => {
    if (!tex) return;
    requestAnimationFrame(() => {
      advance(performance.now());
      continueRender(handle);
    });
  }, [tex, advance, handle]);
  const geo = useMemo(() => ({
    body: new RoundedBoxGeometry(PHONE.w, PHONE.h, PHONE.d, 6, PHONE.r),
    glass: new RoundedBoxGeometry(PHONE.w - 0.012, PHONE.h - 0.012, 0.004, 4, PHONE.r - 0.006),
    screen: new THREE.PlaneGeometry(SCREEN.w, SCREEN.h),
    button: new RoundedBoxGeometry(0.012, 0.16, 0.03, 2, 0.005),
  }), []);
  return { tex, geo };
};

/** Studio reflections for the titanium and glass. */
export const StudioEnv: React.FC = () => {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    const pm = new THREE.PMREMGenerator(gl);
    // a dark studio: navy dome + two soft panels, so glass and titanium get gentle streaks, not white blobs
    const studio = new THREE.Scene();
    studio.add(new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), new THREE.MeshBasicMaterial({ color: "#070c1a", side: THREE.BackSide })));
    const panel = (w: number, h: number, c: string, x: number, y: number, z: number) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide }));
      m.position.set(x, y, z); m.lookAt(0, 0, 0); studio.add(m);
    };
    panel(6, 1.2, "#5d6f99", -4, 5, 6);
    panel(1.0, 7, "#3a4c7a", 7, 0, 3);
    const env = pm.fromScene(studio, 0.03).texture;
    scene.environment = env;
    return () => { env.dispose(); pm.dispose(); };
  }, [gl, scene]);
  return null;
};

export const titanium = new THREE.MeshPhysicalMaterial({ color: "#454b59", metalness: 1, roughness: 0.3, clearcoat: 0.5, clearcoatRoughness: 0.25, envMapIntensity: 1.4 });
export const blackGlass = new THREE.MeshStandardMaterial({ color: "#010203", metalness: 0.1, roughness: 0.18 });
export const glassSheen = new THREE.MeshPhysicalMaterial({ color: "#ffffff", metalness: 0, roughness: 0.05, transparent: true, opacity: 0.05, envMapIntensity: 0.8, depthWrite: false });

type PhoneProps = {
  assets: ReturnType<typeof usePhoneAssets>;
  screen: "bank" | "play";
  brightness: number; // 0 = off (black glass), 1 = on
  tint?: string;
  scaleY?: number; // screen squash (switch-off / power-on)
  person?: number; // which account the bank app shows (index into PEOPLE)
  app?: number; // bank screen only: 0 = home screen, 1 = bank app fully open (zooms out of the centre icon)
  buttons?: boolean;
} & JSX_GroupProps;
type JSX_GroupProps = { position?: [number, number, number]; rotation?: [number, number, number] };

export const Phone3D: React.FC<PhoneProps> = ({ assets, screen, brightness, tint = "#ffffff", scaleY = 1, app = 1, person = 0, buttons = false, position, rotation }) => {
  const { tex, geo } = assets;
  const color = useMemo(() => new THREE.Color(tint).multiplyScalar(brightness), [tint, brightness]);
  return (
    <group position={position} rotation={rotation}>
      <mesh geometry={geo.body} material={titanium} />
      <mesh geometry={geo.glass} material={blackGlass} position={[0, 0, PHONE.d / 2 + 0.001]} />
      {tex && brightness > 0.003 && screen === "play" && (
        <mesh geometry={geo.screen} position={[0, 0, SCREEN.z]} scale={[1, Math.max(0.001, scaleY), 1]}>
          <meshBasicMaterial map={tex.play} color={color} transparent toneMapped={false} />
        </mesh>
      )}
      {tex && brightness > 0.003 && screen === "bank" && (
        <>
          <mesh geometry={geo.screen} position={[0, 0, SCREEN.z]} scale={[1, Math.max(0.001, scaleY), 1]}>
            <meshBasicMaterial map={tex.home} color={color} transparent toneMapped={false} />
          </mesh>
          {app > 0.001 && (
            <mesh geometry={geo.screen} position={[0, 0, SCREEN.z + 0.002]} scale={[0.17 + 0.83 * app, (0.08 + 0.92 * app) * Math.max(0.001, scaleY), 1]}>
              <meshBasicMaterial map={tex.banks[person % tex.banks.length]} color={color} transparent opacity={Math.min(1, app * 3)} toneMapped={false} />
            </mesh>
          )}
        </>
      )}
      {buttons && (
        <>
          <mesh geometry={geo.button} material={titanium} position={[-PHONE.w / 2 - 0.004, 0.35, 0]} />
          <mesh geometry={geo.button} material={titanium} position={[-PHONE.w / 2 - 0.004, 0.14, 0]} />
          <mesh geometry={geo.button} material={titanium} position={[PHONE.w / 2 + 0.004, 0.25, 0]} scale={[1, 1.4, 1]} />
        </>
      )}
    </group>
  );
};
