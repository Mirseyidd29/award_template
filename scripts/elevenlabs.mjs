// ElevenLabs voice and sound effects. Run on your own computer (the free plan blocks cloud and proxy IPs).
//   set ELEVENLABS_API_KEY=sk_...          (Windows cmd)   |   export ELEVENLABS_API_KEY=sk_...   (macOS / Linux)
//   npm run el -- narration bill   → public/vo/b/bill/<id>.mp3 (+ .json word timings)   lines: src/film/narration.json
//   npm run el -- sfx              → public/sfx/b/<id>.mp3                                prompts: src/film/sfx.json
//   npm run el -- samples          → a short test line per candidate voice
//   npm run el -- credits          → how much of the plan is used
// Existing files are skipped, so re-running only makes what is missing. Add --force to remake.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const FILM = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(FILM);
const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY) throw new Error("Set ELEVENLABS_API_KEY first (see the top of this file).");
const [cmd = "credits", ...rest] = process.argv.slice(2);
const force = rest.includes("--force");
const filmB = true; // this template has one film
const SRC = filmB ? "src/film" : "src/demo";
const VO_DIR = filmB ? "public/vo/b" : "public/vo";
const SFX_DIR = filmB ? "public/sfx/b" : "public/sfx/el";
const API = "https://api.elevenlabs.io";
const FORMAT = "mp3_44100_128"; // highest format on the free plan

const credits = async () => {
  const r = await fetch(`${API}/v1/user/subscription`, { headers: { "xi-api-key": KEY } });
  const d = await r.json();
  if (!r.ok) throw new Error(JSON.stringify(d));
  return d.character_count;
};

const save = async (url, body, out) => {
  if (!force && fs.existsSync(out)) return console.log(`skip ${out} (exists)`);
  const r = await fetch(url, { method: "POST", headers: { "xi-api-key": KEY, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`${out}: ${r.status} ${await r.text()}`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, Buffer.from(await r.arrayBuffer()));
  console.log(`✓ ${out}`);
};

// with-timestamps: also saves <name>.json with per-character timings, so on-screen words can land on the spoken words
const tts = async (voiceId, text, settings, out) => {
  if (!force && fs.existsSync(out)) return console.log(`skip ${out} (exists)`);
  const r = await fetch(`${API}/v1/text-to-speech/${voiceId}/with-timestamps?output_format=${FORMAT}`, {
    method: "POST", headers: { "xi-api-key": KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ text, model_id: settings.model || "eleven_v4", voice_settings: settings.voiceSettings }),
  });
  if (!r.ok) throw new Error(`${out}: ${r.status} ${await r.text()}`);
  const d = await r.json();
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, Buffer.from(d.audio_base64, "base64"));
  fs.writeFileSync(out.replace(/\.mp3$/, ".json"), JSON.stringify(d.normalized_alignment || d.alignment));
  console.log(`✓ ${out} (+ timings)`);
};

const before = await credits();
const N = JSON.parse(fs.readFileSync(`${SRC}/narration.json`, "utf8"));

if (cmd === "samples") {
  for (const [name, id] of Object.entries(N.candidates)) await tts(id, N.sampleText, N, `${VO_DIR}/samples/${name}.mp3`);
} else if (cmd === "narration") {
  // npm run el -- narration bill   → public/vo/bill/<id>.mp3 (default voice: "voice" in narration.json)
  const voice = rest.find((a) => !a.startsWith("--")) || N.voice;
  const id = N.candidates[voice];
  if (!id) throw new Error(`unknown voice ${voice}; pick one of ${Object.keys(N.candidates).join(", ")}`);
  const only = rest.filter((a) => !a.startsWith("--"))[1]; // optional single line id
  for (const line of N.lines.filter((l) => !only || l.id === only)) await tts(id, line.text, N, `${VO_DIR}/${voice}/${line.id}.mp3`);
} else if (cmd === "sfx") {
  const S = JSON.parse(fs.readFileSync(`${SRC}/sfx.json`, "utf8"));
  const only = rest.find((a) => !a.startsWith("--"));
  for (const s of S.sounds.filter((x) => !only || x.id === only)) {
    await save(`${API}/v1/sound-generation?output_format=${FORMAT}`, { text: s.prompt, duration_seconds: s.seconds, prompt_influence: 0.6 }, `${SFX_DIR}/${s.id}.mp3`);
  }
} else if (cmd !== "credits") throw new Error(`unknown command ${cmd}`);

const after = await credits();
console.log(`credits used now: ${after - before} · total ${after}`);
