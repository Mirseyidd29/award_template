import React, { useEffect, useLayoutEffect, useState } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { continueRender, delayRender, useCurrentFrame } from "remotion";
import { Phone3D, PHONE, SCREEN, StudioEnv, usePhoneAssets } from "../../shared/Phone3D";
import { ez, mix, p } from "../look";
import { DONE_AT, drawPaid, drawSent, makeScreen } from "./bankScreens";

// Scene 1, the routine: one phone face-up on a dark table, the only light in the room.
// The screen wakes once and stays on (no on/off flicker). Synced to the voice: the app opens on "open their banking app",
// taps on "pay" and "transfer", the screen goes dark on "leave", then the camera dives into the black glass.
export const ROUTINE = { wake: [20, 40], app: [52, 64], off: [188, 198], dive: [194, 212] };
// every tap does something: Pay → "Paid", Done → back home, Transfer → "Sent"
export const TAPS = [
  { at: 116, tap: [276, 650] as [number, number] }, // "They pay."
  { at: 141, tap: DONE_AT }, // Done
  { at: 149, tap: [110, 650] as [number, number] }, // "They transfer."
];
/** the clock moves through the week with each operation */
export const CLOCK_AT = [116, 149];
const PAID = { in: 121, out: 144 }, SENT = { in: 155 };
const TEX_W = 720, TEX_H = 1555;
const onScreen = ([u, v]: [number, number]): [number, number] => [(u / TEX_W - 0.5) * SCREEN.w, (0.5 - v / TEX_H) * SCREEN.h];

const routine = (f: number) => {
  const t = [...TAPS].reverse().find((x) => f >= x.at) ?? TAPS[0];
  const k = f - t.at;
  const bright = Math.min(p(f, ROUTINE.wake[0], ROUTINE.wake[1], ez.inOut), 1 - p(f, ROUTINE.off[0], ROUTINE.off[1], ez.in));
  const app = p(f, ROUTINE.app[0], ROUTINE.app[1], ez.out);
  const ripple = k >= 0 && k < 10 ? k / 10 : -1; // short: the screen changes right after
  const paidIn = p(f, PAID.in, PAID.in + 8, ez.out);
  const paid = Math.min(paidIn, 1 - p(f, PAID.out, PAID.out + 3, ez.exit));
  const sent = p(f, SENT.in, SENT.in + 8, ez.out);
  return { v: t, bright, app, ripple, paid, paidIn, sent };
};

const useScreens = () => {
  const [tex, setTex] = useState<{ paid: THREE.Texture; sent: THREE.Texture } | null>(null);
  const [handle] = useState(() => delayRender("confirmation screens"));
  const advance = useThree((s) => s.advance);
  useEffect(() => {
    Promise.all(["400", "600", "700", "800"].map((w) => document.fonts.load(`${w} 40px Inter`))).then(() => setTex({ paid: makeScreen(drawPaid), sent: makeScreen(drawSent) }));
  }, []);
  useEffect(() => { if (tex) requestAnimationFrame(() => { advance(performance.now()); continueRender(handle); }); }, [tex, advance, handle]);
  return tex;
};

export const PhoneOnTable: React.FC<{ dive: number }> = ({ dive }) => {
  const f = useCurrentFrame();
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const assets = usePhoneAssets();
  const screens = useScreens();
  const { v, bright, app, ripple, paid, paidIn, sent } = routine(f);

  useLayoutEffect(() => {
    // a slow push over the whole scene, then a dive straight down into the dark screen
    const t = f / 212;
    const d = dive;
    const hold = p(f, 118, 142, ez.inOutSine); // one slow push, held until the dive
    const z = 1 - 0.15 * hold * (1 - d);
    camera.position.set(mix(mix(0.12, 0.05, t), 0, d), mix(mix(3.4, 2.9, t) * z, SCREEN.z + 0.12, ez.inOut(d)), mix(mix(1.9, 1.5, t) * z, 0.0, d));
    camera.fov = 34;
    camera.near = 0.02;
    camera.far = 30;
    camera.lookAt(0, 0, mix(0.03, 0, d));
    camera.updateProjectionMatrix();
  }, [f, camera, dive]);

  const [rx, ry] = onScreen(v.tap);
  return (
    <>
      <StudioEnv />
      <color attach="background" args={["#020304"]} />
      <ambientLight intensity={0.03} />
      {/* the screen lights the table */}
      <pointLight position={[0, 0.35, 0]} intensity={bright * 2.2} distance={3.2} decay={2} color={"#a9bfff"} />
      <directionalLight position={[-2, 3, 1]} intensity={0.08} color={"#8090b0"} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -PHONE.d / 2, 0]}>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial color={"#0b0c0f"} roughness={0.55} metalness={0.2} />
      </mesh>
      <group rotation={[-Math.PI / 2, 0, -0.32]}>
        <Phone3D assets={assets} screen="bank" brightness={bright * 0.72} app={app} person={0} buttons position={[0, 0, 0]} />
        {/* the operation screens, pushed over the app (fade + a slight settle, inside the display) */}
        {screens && assets.geo && ([[screens.paid, paid, paidIn], [screens.sent, sent, sent]] as const).map(([map, a, enter], i) => a > 0.002 && bright > 0.003 && (
          <mesh key={i} geometry={assets.geo.screen} position={[0, 0, SCREEN.z + 0.003]} scale={[mix(0.97, 1, enter), mix(0.97, 1, enter), 1]}>
            <meshBasicMaterial map={map} transparent opacity={a} color={new THREE.Color(1, 1, 1).multiplyScalar(bright * 0.72)} toneMapped={false} />
          </mesh>
        ))}
        {ripple >= 0 && (
          <mesh position={[rx, ry, SCREEN.z + 0.005]} scale={0.02 + ez.out(ripple) * 0.07}>
            <ringGeometry args={[0.8, 1, 48]} />
            <meshBasicMaterial color={"#4C6FE0"} transparent opacity={(1 - ripple) * 0.7} toneMapped={false} />
          </mesh>
        )}
        {ripple >= 0 && ripple < 0.5 && (
          <mesh position={[rx, ry, SCREEN.z + 0.0045]} scale={0.035}>
            <circleGeometry args={[1, 32]} />
            <meshBasicMaterial color={"#4C6FE0"} transparent opacity={(0.5 - ripple) * 0.5} toneMapped={false} />
          </mesh>
        )}
      </group>
    </>
  );
};
