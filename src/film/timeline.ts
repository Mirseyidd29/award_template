// Film B "Lights On": scene lengths in frames (30 fps), locked to the narration by scripts/sync.py (→ sync.json).
import sync from "./sync.json";
export const FPS = 30;
export const SCENES = [
  "routine", "darkmap", "ads", "question", // 01 the problem
  "light", "calendar", "montage", // 02 the insight
  "name", "predict", "boost", "climb", // 03 the idea
  "crowd", "habit", "lit", "profit", // 04 the proof
  "ending", "card", // 05 what came next
] as const;
export type SceneKey = (typeof SCENES)[number];
export const LEN = sync.scenes as Record<SceneKey, number>;

export const starts = (() => {
  const out = {} as Record<SceneKey, [number, number]>;
  let t = 0;
  for (const k of SCENES) { out[k] = [t, t + LEN[k]]; t += LEN[k]; }
  return out;
})();
export const TOTAL = SCENES.reduce((a, k) => a + LEN[k], 0);
/** narration captions, absolute frames */
export const CAPTIONS = sync.captions as [string, number, number][];
