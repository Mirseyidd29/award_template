import React, { useLayoutEffect, useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { random } from "remotion";
import { COLS, ROWS } from "../ProductGrid";
import { lerpColor, L } from "../look";

// The ending: a night stadium whose four floodlight heads are the film's 8×6 lamp grid.
// The camera starts tight on one head (the same picture as the 2D floodlight), the lamps clunk on,
// then it cranes back over the pitch while the other towers come on and their beams cut through the haze.
export type LampFn = (tower: number, i: number) => { level: number; warm: number };
export type StadiumCam = { pos: [number, number, number]; look: [number, number, number]; fov: number };

const PITCH_W = 105, PITCH_D = 68;
export const TOWERS: [number, number, number][] = [[-66, 0, -50], [66, 0, -50], [66, 0, 50], [-66, 0, 50]];
export const MAST_H = 46;
export const HEAD = { w: 11, h: 8.2, tilt: 0.42 };
export const HEAD_FWD = 2.6; // the head hangs this far in front of the mast
const LAMP_R = 0.52;
/** world position of a tower head, and its orientation (faces the centre spot, tilted down) */
export const headOf = (t: number) => {
  const [x, , z] = TOWERS[t];
  const yaw = Math.atan2(-x, -z);
  const pos = new THREE.Vector3(x + Math.sin(yaw) * HEAD_FWD, MAST_H, z + Math.cos(yaw) * HEAD_FWD);
  return { pos, yaw, mast: new THREE.Vector3(x, MAST_H, z) };
};

const pitchTexture = () => {
  const c = document.createElement("canvas");
  c.width = 2100; c.height = 1360;
  const g = c.getContext("2d")!;
  for (let i = 0; i < 20; i++) { g.fillStyle = i % 2 ? "#1c5a30" : "#226a38"; g.fillRect((i * c.width) / 20, 0, c.width / 20 + 1, c.height); }
  // light falloff toward the edges (the pitch reads as lit from above)
  const v = g.createRadialGradient(c.width / 2, c.height / 2, 200, c.width / 2, c.height / 2, 1250);
  v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,.7)"); // only a pool of light in the middle
  g.fillStyle = v; g.fillRect(0, 0, c.width, c.height);
  g.strokeStyle = "rgba(255,255,255,.42)"; g.lineWidth = 5;
  const m = 50, W = c.width - 2 * m, H = c.height - 2 * m;
  g.strokeRect(m, m, W, H);
  g.beginPath(); g.moveTo(c.width / 2, m); g.lineTo(c.width / 2, c.height - m); g.stroke();
  g.beginPath(); g.arc(c.width / 2, c.height / 2, 183, 0, Math.PI * 2); g.stroke();
  const box = (x: number, w: number, h: number) => g.strokeRect(x, c.height / 2 - h / 2, w, h);
  box(m, 330, 806); box(c.width - m - 330, 330, 806); box(m, 110, 366); box(c.width - m - 110, 110, 366);
  g.fillStyle = "#fff"; g.beginPath(); g.arc(c.width / 2, c.height / 2, 8, 0, Math.PI * 2); g.fill();
  const t = new THREE.CanvasTexture(c); t.anisotropy = 8; t.colorSpace = THREE.SRGBColorSpace;
  return t;
};

const glowTexture = () => {
  const c = document.createElement("canvas"); c.width = c.height = 256;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grd.addColorStop(0, "rgba(255,250,240,1)"); grd.addColorStop(0.18, "rgba(255,236,205,.55)"); grd.addColorStop(0.5, "rgba(255,220,180,.12)"); grd.addColorStop(1, "rgba(255,220,180,0)");
  g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
};

// soft volumetric beam: bright near the lamp, fading with distance and toward the cone's edges
const beamMaterial = () => new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  uniforms: { uOn: { value: 0 }, uColor: { value: new THREE.Color("#FFEFD6") } },
  vertexShader: `
    varying float vH; varying vec3 vN; varying vec3 vV;
    void main() {
      vH = uv.y;
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: `
    uniform float uOn; uniform vec3 uColor;
    varying float vH; varying vec3 vN; varying vec3 vV;
    void main() {
      float along = pow(vH, 1.6);                 // 1 at the lamp, 0 at the pitch
      float edge = pow(abs(dot(vN, vV)), 1.8);    // soft cone edges
      float a = uOn * along * edge * 0.95;
      gl_FragColor = vec4(uColor * a, a);
    }`,
});

const CameraRig: React.FC<{ cam: StadiumCam }> = ({ cam }) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  useLayoutEffect(() => {
    camera.position.set(...cam.pos);
    camera.fov = cam.fov; camera.near = 0.3; camera.far = 1200;
    camera.lookAt(...cam.look);
    camera.updateProjectionMatrix();
  }, [camera, ...cam.pos, ...cam.look, cam.fov]);
  return null;
};

/** One floodlight head: a steel frame with 48 lamp discs, each with its own small glow, plus one big bloom. */
const Head: React.FC<{ t: number; lamps: LampFn; glow: THREE.Texture }> = ({ t, lamps, glow }) => {
  const { mast: pos, yaw } = headOf(t);
  const gx = HEAD.w / COLS, gy = HEAD.h / ROWS;
  let total = 0;
  const cells = Array.from({ length: COLS * ROWS }, (_, i) => {
    const s = lamps(t, i);
    total += s.level;
    return { i, s, x: ((i % COLS) + 0.5) * gx - HEAD.w / 2, y: HEAD.h / 2 - (Math.floor(i / COLS) + 0.5) * gy };
  });
  const on = total / (COLS * ROWS);
  return (
    <group position={pos} rotation={[0, yaw, 0]}>
      <group position={[0, 0, HEAD_FWD]} rotation={[HEAD.tilt, 0, 0]}>
        <mesh position={[0, 0, -0.35]}>
          <boxGeometry args={[HEAD.w + 0.9, HEAD.h + 0.9, 0.6]} />
          <meshStandardMaterial color={"#1a1f2b"} metalness={0.7} roughness={0.45} />
        </mesh>
        {cells.map(({ i, s, x, y }) => (
          <group key={i} position={[x, y, 0]}>
            <mesh>
              <circleGeometry args={[LAMP_R, 24]} />
              <meshBasicMaterial color={s.level > 0.01 ? new THREE.Color(lerpColor(L.ember, "#FFF7EC", s.warm)).multiplyScalar(0.25 + 1.6 * s.level) : new THREE.Color("#0b0e15")} toneMapped={false} />
            </mesh>
            <mesh position={[0, 0, -0.02]}>
              <ringGeometry args={[LAMP_R, LAMP_R * 1.18, 24]} />
              <meshStandardMaterial color={"#2a3142"} metalness={0.8} roughness={0.3} />
            </mesh>
            {s.level > 0.02 && (
              <sprite position={[0, 0, 0.1]} scale={[LAMP_R * 5, LAMP_R * 5, 1]}>
                <spriteMaterial map={glow} transparent opacity={0.55 * s.level} blending={THREE.AdditiveBlending} depthWrite={false} color={new THREE.Color(lerpColor(L.ember, "#FFF3E2", s.warm))} />
              </sprite>
            )}
          </group>
        ))}
        {on > 0.01 && (
          <sprite position={[0, 0, 1.2]} scale={[HEAD.w * 4.2 * on, HEAD.w * 4.2 * on, 1]}>
            <spriteMaterial map={glow} transparent opacity={0.55 * on} blending={THREE.AdditiveBlending} depthWrite={false} />
          </sprite>
        )}
      </group>
    </group>
  );
};

const Beam: React.FC<{ t: number; on: number }> = ({ t, on }) => {
  const mat = useMemo(beamMaterial, []);
  mat.uniforms.uOn.value = on;
  const { pos } = headOf(t);
  // a cone from the head to a pool on the pitch, between the tower and the centre spot
  const target = new THREE.Vector3(pos.x * 0.32, 0, pos.z * 0.32);
  const dir = target.clone().sub(pos);
  const len = dir.length();
  const mid = pos.clone().add(dir.clone().multiplyScalar(0.5));
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir.clone().normalize());
  if (on < 0.01) return null;
  return (
    <mesh position={mid} quaternion={q} material={mat}>
      {/* cylinder: top radius = the head, bottom radius = the pool on the grass; uv.y = 1 at the top */}
      <cylinderGeometry args={[HEAD.w * 0.45, 40, len, 48, 1, true]} />
    </mesh>
  );
};

export const LightsStadium: React.FC<{ cam: StadiumCam; lamps: LampFn; frame: number }> = ({ cam, lamps, frame }) => {
  const pitch = useMemo(pitchTexture, []);
  const glow = useMemo(glowTexture, []);
  const crowd = useRef<THREE.InstancedMesh>(null);
  const phones = useRef<THREE.InstancedMesh>(null);

  // four straight stands, rising back from the touchlines; every seat a dark figure, some holding a lit phone
  const seats = useMemo(() => {
    const out: { p: THREE.Vector3; ry: number; phone: boolean; ph: number }[] = [];
    const stand = (len: number, along: "x" | "z", sign: number, start: number) => {
      for (let r = 0; r < 26; r++) {
        const off = start + r * 1.05, y = 0.8 + r * 0.72;
        for (let k = 0; k < len / 0.85; k++) {
          const a = -len / 2 + k * 0.85 + (r % 2) * 0.4;
          const id = `${along}${sign}${r}-${k}`;
          if (random(`gap${id}`) < 0.06) continue;
          const p = along === "x" ? new THREE.Vector3(a, y, sign * off) : new THREE.Vector3(sign * off, y, a);
          out.push({ p, ry: along === "x" ? (sign > 0 ? Math.PI : 0) : (sign > 0 ? -Math.PI / 2 : Math.PI / 2), phone: random(`ph${id}`) < 0.12, ph: random(`t${id}`) });
        }
      }
    };
    stand(PITCH_W + 14, "x", 1, PITCH_D / 2 + 8); stand(PITCH_W + 14, "x", -1, PITCH_D / 2 + 8);
    stand(PITCH_D + 6, "z", 1, PITCH_W / 2 + 8); stand(PITCH_D + 6, "z", -1, PITCH_W / 2 + 8);
    return out;
  }, []);
  const phoneSeats = useMemo(() => seats.filter((s) => s.phone), [seats]);

  useLayoutEffect(() => {
    const m = crowd.current, ph = phones.current;
    if (!m || !ph) return;
    const o = new THREE.Object3D(), c = new THREE.Color();
    seats.forEach((s, i) => {
      o.position.copy(s.p); o.rotation.set(0, s.ry, 0); o.scale.set(1, 1, 1); o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      m.setColorAt(i, c.set("#0c1019").lerp(new THREE.Color("#1a2133"), s.ph));
    });
    phoneSeats.forEach((s, i) => {
      o.position.copy(s.p).add(new THREE.Vector3(0, 0.55, 0)); o.rotation.set(0, s.ry, 0);
      const tw = 0.6 + 0.4 * Math.sin(frame / 7 + s.ph * 20);
      o.scale.setScalar(tw); o.updateMatrix();
      ph.setMatrixAt(i, o.matrix);
    });
    m.instanceMatrix.needsUpdate = true; ph.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [seats, phoneSeats, frame]);

  const towerOn = TOWERS.map((_, t) => {
    let s = 0;
    for (let i = 0; i < COLS * ROWS; i++) s += lamps(t, i).level;
    return s / (COLS * ROWS);
  });
  const lit = towerOn.reduce((a, b) => a + b, 0) / 4;

  return (
    <>
      <CameraRig cam={cam} />
      <color attach="background" args={["#03050a"]} />
      <fogExp2 attach="fog" args={["#090d18", 0.0058]} />
      <ambientLight intensity={0.03 + 0.06 * lit} color={"#9fb2d8"} />
      <hemisphereLight args={["#2a3550", "#05080c", 0.3 * lit]} />
      {TOWERS.map((_, t) => {
        const { pos } = headOf(t);
        return (
          // the spot's default target is the origin: every tower aims at the centre spot
          <spotLight key={t} position={pos} intensity={9000 * towerOn[t]} distance={260} angle={0.62} penumbra={0.8} decay={2} color={"#FFF1DC"} />
        );
      })}

      {/* pitch + surround */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[PITCH_W + 10, PITCH_D + 8]} />
        <meshStandardMaterial map={pitch} roughness={0.92} metalness={0} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]}>
        <planeGeometry args={[600, 600]} />
        <meshStandardMaterial color={"#0a1410"} roughness={1} />
      </mesh>

      {/* stands: sloped concrete tiers under the crowd, the crowd, their phones */}
      {([[0, 1], [0, -1], [1, 0], [-1, 0]] as const).map(([sx, sz], i) => {
        const along = sx === 0;
        const len = along ? PITCH_W + 16 : PITCH_D + 8;
        const start = along ? PITCH_D / 2 + 8 : PITCH_W / 2 + 8;
        const sign = along ? sz : sx;
        const ry = along ? (sign > 0 ? 0 : Math.PI) : (sign > 0 ? Math.PI / 2 : -Math.PI / 2);
        return (
          <group key={i} position={along ? [0, 9.1, sign * (start + 13.1)] : [sign * (start + 13.1), 9.1, 0]} rotation={[0, ry, 0]}>
            <mesh rotation={[-0.6, 0, 0]}>
              <boxGeometry args={[len, 0.6, 32.5]} />
              <meshStandardMaterial color={"#0c1018"} roughness={0.95} />
            </mesh>
          </group>
        );
      })}
      <instancedMesh ref={crowd} args={[undefined, undefined, seats.length]}>
        <boxGeometry args={[0.55, 0.9, 0.45]} />
        <meshStandardMaterial roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={phones} args={[undefined, undefined, phoneSeats.length]}>
        <planeGeometry args={[0.16, 0.26]} />
        <meshBasicMaterial color={"#CFE0FF"} toneMapped={false} side={THREE.DoubleSide} />
      </instancedMesh>
      {/* roof rim: a thin dark ring catching the light */}
      {([[0, 1], [0, -1], [1, 0], [-1, 0]] as const).map(([sx, sz], i) => {
        const along = sx === 0;
        const len = along ? PITCH_W + 70 : PITCH_D + 70;
        const off = (along ? PITCH_D / 2 : PITCH_W / 2) + 37;
        return (
          <mesh key={`roof${i}`} position={[sx * off, 24, sz * off]} rotation={[0, along ? 0 : Math.PI / 2, 0]}>
            <boxGeometry args={[len, 0.8, 10]} />
            <meshStandardMaterial color={"#121722"} metalness={0.6} roughness={0.5} />
          </mesh>
        );
      })}

      {/* towers */}
      {TOWERS.map((p, t) => (
        <group key={t}>
          <mesh position={[p[0], (MAST_H - 1) / 2, p[2]]}>
            <cylinderGeometry args={[0.55, 1.1, MAST_H - 1, 10]} />
            <meshStandardMaterial color={"#1a2030"} metalness={0.6} roughness={0.5} />
          </mesh>
          <Head t={t} lamps={lamps} glow={glow} />
          <Beam t={t} on={towerOn[t]} />
        </group>
      ))}
    </>
  );
};
