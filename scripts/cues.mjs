// Film B: cue frames that the picture computes with Remotion's seeded random(), so the mix can hit them exactly.
// node scripts/cues.mjs  →  src/film/cues.json  (read by scripts/make_audio.py)
import { random } from "remotion";
import fs from "node:fs";
const src = fs.readFileSync("src/film/ProductGrid.tsx", "utf8");
// every lamp in PRODUCTS, in order; a lamp is boostable when it has goals or daily (same rule as scenes/Idea.tsx)
const entries = [...src.matchAll(/\{ name: "([^"]+)"([^}]*)\}/g)].map((m) => /goals:|daily:/.test(m[2]));
const BOOSTABLE = entries.map((g, i) => (g ? i : -1)).filter((i) => i >= 0);
// same as scenes/Idea.tsx (ORDER / onAt)
const ORDER = [...BOOSTABLE].sort((a, b) => random(`o${a}`) - random(`o${b}`));
const marks = JSON.parse(fs.readFileSync("src/film/sync.json", "utf8")).marks;
const a = marks["boost.every"], b = marks["boost.discover"] + 10; // same as boostOnAt() in scenes/Idea.tsx
const boostOn = ORDER.map((_, k) => Math.round(a + (b - a) * Math.pow(k / ORDER.length, 0.62)));
fs.writeFileSync("src/film/cues.json", JSON.stringify({ boostOn }, null, 1));
console.log("boost lamps on at", boostOn.join(" "));
