// Render the film: npm run render            → out/film.mp4 (full quality) + out/film_review.mp4 (smaller copy)
//                  npm run render -- my_name  → out/my_name.mp4 + out/my_name_review.mp4
// Env: GL=angle|swangle|egl|vulkan (default angle; use swangle if 3D scenes come out black),
//      CONCURRENCY=<n> (fewer threads if the computer runs hot), FRAMES=<from>-<to> (render a short range to test).
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(ROOT);
const name = process.argv.slice(2).find((a) => !a.startsWith("--")) || "film";
const isWin = process.platform === "win32";

// Remotion's bundled ffmpeg, so nothing else needs installing
const ffmpeg = (args) => {
  const r = spawnSync(isWin ? "npx.cmd" : "npx", ["remotion", "ffmpeg", "-y", "-loglevel", "error", ...args], { stdio: "inherit", shell: isWin });
  if (r.status !== 0) throw new Error(`ffmpeg failed: ${args.join(" ")}`);
};

if (!fs.existsSync("public/audio/b-mix.wav")) console.log("no soundtrack yet: run python3 scripts/make_audio.py (see README.md)");

fs.mkdirSync("out", { recursive: true });
const master = `out/${name}.mp4`;
const chromiumOptions = { gl: process.env.GL || "angle" };
const frameRange = process.env.FRAMES ? process.env.FRAMES.split("-").map(Number) : null;
const inputProps = { withAudio: true };
console.log("bundling…");
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const composition = await selectComposition({ serveUrl, id: "film", inputProps, chromiumOptions });
const t0 = Date.now();
let last = -1;
await renderMedia({
  composition, serveUrl, inputProps, chromiumOptions, outputLocation: master, frameRange,
  codec: "h264", crf: 18, audioCodec: "aac", audioBitrate: "256k", imageFormat: "jpeg", jpegQuality: 95,
  concurrency: process.env.CONCURRENCY ? Number(process.env.CONCURRENCY) : null,
  onProgress: ({ progress }) => {
    const p = Math.floor(progress * 100);
    if (p !== last) { last = p; process.stdout.write(`\rrendering ${p}%  (${((Date.now() - t0) / 60000).toFixed(1)} min)`); }
  },
});
console.log(`\n✓ ${master}`);

const review = `out/${name}_review.mp4`;
ffmpeg(["-i", master, "-c:v", "libx264", "-crf", "27", "-preset", "slow", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", review]);
console.log(`✓ ${review} (${(fs.statSync(review).size / 1e6).toFixed(1)} MB)`);
