import React from "react";
import { L, lerpColor } from "./look";

// The ABB PLAY name as a stadium scoreboard: a dot matrix of lamps. It is the film's brand lock-up
// (the name reveal, and again on the end card). state(x, y, lit) → lamp level/warm for each dot.
const GLYPHS: Record<string, string[]> = {
  A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  B: ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."],
  P: ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
  L: ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
  Y: ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."],
  " ": [".", ".", ".", ".", ".", ".", "."],
};
export const MATRIX = (() => {
  const word = "ABB PLAY";
  const cols: boolean[][] = [];
  for (const ch of word) {
    const g = GLYPHS[ch];
    for (let c = 0; c < g[0].length; c++) cols.push(g.map((row) => row[c] === "#"));
    cols.push(new Array(7).fill(false));
  }
  cols.pop(); // no trailing gap: the word sits optically centred
  const pad = 2;
  const W = cols.length + pad * 2, H = 7 + pad * 2;
  const on = (x: number, y: number) => { const c = cols[x - pad], r = y - pad; return !!c && r >= 0 && r < 7 && c[r]; };
  return { W, H, on };
})();

type DotState = { level: number; warm: number };
export const Led: React.FC<{ dot: number; state: (x: number, y: number, letter: boolean) => DotState; style?: React.CSSProperties }> = ({ dot: D, state, style }) => {
  const G = D * 0.2;
  const { W, H, on } = MATRIX;
  return (
    <div style={{ position: "relative", width: W * (D + G) - G, height: H * (D + G) - G, ...style }}>
      {Array.from({ length: W * H }, (_, i) => {
        const x = i % W, y = Math.floor(i / W);
        const s = state(x, y, on(x, y));
        const c = lerpColor(L.ember, L.lamp, s.warm);
        const lit = s.level > 0.01;
        return (
          <div key={i} style={{
            position: "absolute", left: x * (D + G), top: y * (D + G), width: D, height: D, borderRadius: "50%",
            background: lit ? `radial-gradient(circle, #fff 0%, ${c} 45%, ${c.replace("rgb", "rgba").replace(")", ",.4)")} 75%)` : "radial-gradient(circle at 40% 35%, #1a2030, #0b0e15 70%)",
            opacity: lit ? 0.3 + 0.7 * s.level : 1,
            boxShadow: lit ? `0 0 ${D * 0.9}px ${c.replace("rgb", "rgba").replace(")", `,${0.55 * s.level})`)}` : "inset 0 1px 2px rgba(255,255,255,.05)",
          }} />
        );
      })}
    </div>
  );
};
export const ledSize = (dot: number) => ({ w: MATRIX.W * dot * 1.2 - dot * 0.2, h: MATRIX.H * dot * 1.2 - dot * 0.2 });
