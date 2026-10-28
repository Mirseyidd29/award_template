// Review stills at given frames: npm run stills -- 20 600 1800   → out/stills/fNNNN.png
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";

const frames = process.argv.slice(2).map(Number);
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const inputProps = { withAudio: false };
const browserExecutable = process.env.REMOTION_BROWSER || null;
const chromiumOptions = { gl: "swangle" };
const composition = await selectComposition({ serveUrl, id: process.env.COMP || "film", inputProps, browserExecutable, chromiumOptions });
for (const frame of frames) {
  await renderStill({ composition, serveUrl, output: `out/stills/${process.env.COMP ? process.env.COMP + "_" : ""}f${String(frame).padStart(4, "0")}.png`, frame, inputProps, browserExecutable, chromiumOptions, scale: 0.5 });
  console.log("still", frame);
}
