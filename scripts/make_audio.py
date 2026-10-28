"""Film B ("Lights On") v3 soundtrack (under 2:00): narration + light-driven sound design + an original score, synced to src/film/sync.json.

Every lamp in the picture has a sound: the floodlight clunk, relay clicks and cascades for the lamp walls, breaker slams
for the stadium towers, the blackout. Phone taps, notifications and swipes carry act 1. The score moves from a cold
D minor (the problem) through silence (the question) to D major (the idea), and cuts out with the lights at the end.
Sound effects are ElevenLabs takes in public/sfx/b (fallback: synthesised); the narration is public/vo/b/<voice>.
Run:  python3 scripts/sync.py && node scripts/cues.mjs && python3 scripts/make_audio.py  ->  public/audio/b-mix.wav
"""
import json
import subprocess
import wave
from pathlib import Path

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt

ROOT = Path(__file__).resolve().parent.parent
SY = json.loads((ROOT / "src/film/sync.json").read_text())
CUES = json.loads((ROOT / "src/film/cues.json").read_text())
NAR = json.loads((ROOT / "src/film/narration.json").read_text())
SR, FPS = 44100, SY["fps"]
TOTAL = SY["total"]
N = int((TOTAL / FPS + 3) * SR)
S = SY["start"]  # scene start frames
rng = np.random.default_rng(11)

music = np.zeros((N, 2))
sfx = np.zeros((N, 2))
hum = np.zeros((N, 2))  # electrical hum of the lit lamps (stays under everything)


def T(scene, frame=0):  # scene-local frame -> absolute seconds
    return (S[scene] + frame) / FPS


def t_arr(sec):
    return np.arange(int(sec * SR)) / SR


def filt(x, kind, f, order=2):
    sos = butter(order, [f[0] / (SR / 2), f[1] / (SR / 2)], btype="band", output="sos") if kind == "bp" else butter(order, f / (SR / 2), btype=kind, output="sos")
    return sosfilt(sos, x, axis=0)


def norm(x):
    return x / (np.max(np.abs(x)) + 1e-9)


def put(bus, at, sig, gain=1.0, pan=0.0):
    i = int(at * SR)
    if i >= N or i + len(sig) <= 0 or gain == 0:
        return
    if sig.ndim == 1:
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        sig = np.stack([sig * l, sig * r], axis=1)
    elif pan:
        sig = sig * np.array([np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)]) * np.sqrt(2)
    if i < 0:
        sig, i = sig[-i:], 0
    j = min(N, i + len(sig))
    bus[i:j] += sig[: j - i] * gain


def load(path, tempo=1.0):
    af = ["-af", f"atempo={tempo}"] if abs(tempo - 1) > 1e-6 else []
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), *af, "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype="<f4").reshape(-1, 2).astype(float)


def pitch(x, ratio):
    """resample: ratio > 1 = higher and shorter"""
    n = int(len(x) / ratio)
    idx = np.arange(n) * ratio
    return np.stack([np.interp(idx, np.arange(len(x)), x[:, c]) for c in range(x.shape[1])], axis=1) if x.ndim == 2 else np.interp(idx, np.arange(len(x)), x)


def fade(x, a=0.005, b=0.05):
    x = x.copy()
    na, nb = int(a * SR), int(b * SR)
    if na: x[:na] *= np.linspace(0, 1, na)[:, None] if x.ndim == 2 else np.linspace(0, 1, na)
    if nb: x[-nb:] *= np.linspace(1, 0, nb)[:, None] if x.ndim == 2 else np.linspace(1, 0, nb)
    return x


def reverb(x, sec=1.6, mix=0.25, decay=3.5):
    t = t_arr(sec)
    irs = [rng.standard_normal(len(t)) * np.exp(-t * decay) for _ in range(2)]
    wet = np.stack([fftconvolve(x[:, c], irs[c])[: len(x)] for c in range(2)], axis=1)
    wet *= np.max(np.abs(x)) / (np.max(np.abs(wet)) + 1e-9)
    return x * (1 - mix) + wet * mix


# ───────────── fallbacks (only used if an ElevenLabs take is missing) ─────────────
def clunk_fb(sec=1.2):
    t = t_arr(sec)
    body = np.sin(2 * np.pi * np.cumsum(70 + 60 * np.exp(-t * 30)) / SR) * np.exp(-t * 6)
    click = filt(rng.standard_normal(len(t)), "bp", (800, 5000)) * np.exp(-t * 60)
    return norm(body + click * 0.6)


def click_fb():
    t = t_arr(0.12)
    return norm(filt(rng.standard_normal(len(t)), "bp", (1500, 7000)) * np.exp(-t * 80))


FALLBACK = {"flood_on": clunk_fb(2.5), "flood_off": clunk_fb(2.0), "relay_click": click_fb(), "breaker_slam": clunk_fb(2.0), "deep_impact": clunk_fb(2.5)}
_cache = {}


def fx(name):
    if name not in _cache:
        p = ROOT / f"public/sfx/b/{name}.mp3"
        q = ROOT / f"public/sfx/el/{name}.mp3"  # film A's takes (whistle, crowd_roar, tv_off…)
        _cache[name] = norm(load(p)) if p.exists() else norm(load(q)) if q.exists() else FALLBACK.get(name, click_fb())
        if not p.exists() and not q.exists():
            print(f"  (synth fallback for {name})")
    return _cache[name]


def ticker(frames, tail=0.35):
    """the counter tick, cut to the length of the count it scores: it slows and stops when the number lands"""
    x = fx("counter")
    n = int(frames / FPS * SR)
    if n > len(x):
        x = np.concatenate([x] * (n // len(x) + 1))
    x = x[:n].copy()
    nt = int(n * tail)
    x[n - nt:] *= np.linspace(1, 0, nt)[:, None] ** 1.5
    return fade(x, 0.005, 0.0)


def lamp_hum(sec, level=1.0):
    """mains hum of metal-halide lamps: 100 Hz family + a little buzz"""
    t = t_arr(sec)
    s = sum(np.sin(2 * np.pi * f * t + ph) * a for f, a, ph in [(100, 1, 0), (200, 0.5, 1), (300, 0.25, 2), (400, 0.12, 0.5)])
    buzz = filt(rng.standard_normal(len(t)), "bp", (1800, 4200)) * 0.05 * (1 + 0.5 * np.sin(2 * np.pi * 100 * t))
    s = (s * 0.5 + buzz) * level
    return np.stack([s, np.roll(s, 211)], axis=1)


def room_tone(sec):
    w = np.fft.rfft(rng.standard_normal(int(sec * SR)))
    f = np.arange(len(w)) + 1
    x = np.fft.irfft(w / np.sqrt(f), int(sec * SR)) * 20
    x = filt(x, "lp", 900)
    return np.stack([x, np.roll(x, 900)], axis=1)


# ───────────── score ─────────────
def hz(n):
    return 440 * 2 ** ((n - 69) / 12)


def piano(n, sec=3.5, vel=1.0):
    """felt piano: slightly inharmonic partials, soft hammer, quick then slow decay"""
    t = t_arr(sec)
    f = hz(n)
    s = sum(np.sin(2 * np.pi * f * k * np.sqrt(1 + 0.0004 * k * k) * t) * (0.9 / k ** 1.3) * np.exp(-t * (0.9 + 0.55 * k)) for k in range(1, 8))
    s += filt(rng.standard_normal(len(t)), "bp", (300, 2400)) * np.exp(-t * 90) * 0.08
    s = filt(s, "lp", 2600 + 1200 * vel) * vel
    return fade(np.stack([s, np.roll(s, 120)], axis=1), 0.002, 0.3)


def pad(notes, sec, cutoff=900, attack=1.5, release=1.5, bright=0.0):
    t = t_arr(sec)
    s = np.zeros(len(t))
    for n in notes:
        for d in (-0.005, 0.0, 0.006):
            ph = hz(n) * (1 + d) * t
            s += 2 * (ph - np.floor(ph + 0.5))
    env = np.minimum(1, t / attack) * np.minimum(1, np.maximum(0, sec - t) / release)
    s = filt(s, "lp", cutoff + bright * 1500) * env / (len(notes) * 3)
    return np.stack([s, np.roll(s, 400)], axis=1)


def sub(n, sec, attack=0.8):
    t = t_arr(sec)
    s = np.sin(2 * np.pi * hz(n) * t) * np.minimum(1, t / attack) * np.minimum(1, np.maximum(0, sec - t) / 1.0)
    return np.stack([s, s], axis=1)


def kick_soft():
    t = t_arr(0.5)
    f = 42 + 60 * np.exp(-t * 25)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6)


def chords(at, bars, beat, prog, gain=0.5, cutoff=900, bright=0.0, bass=True):
    """lay a chord progression: one chord per bar (4 beats)"""
    for i, ch in enumerate(prog * ((bars + len(prog) - 1) // len(prog))):
        if i >= bars: break
        t0 = at + i * 4 * beat
        put(music, t0, pad(ch, 4 * beat + 1.2, cutoff, attack=1.2, release=1.2, bright=bright), gain)
        if bass: put(music, t0, sub(ch[0] - 12, 4 * beat + 0.6), gain * 0.5)



MK = SY["marks"]
LEN = SY["scenes"]
CLUNK, BOOM = MK["ending.going"], MK["ending.but"]
FOUR = MK["ending.months"]

# ───────────── score ─────────────
BEAT = 60 / 72  # the first half breathes
BEAT2 = 60 / 84  # after "Goals Bring Rewards" the film moves faster, and so does the music
Dm, Bb, F, C, Gm, A = [50, 57, 62, 65], [46, 53, 58, 62], [41, 53, 57, 60], [48, 55, 60, 64], [43, 55, 58, 62], [45, 52, 57, 61]
D, Bm, G, Em, Asus = [50, 57, 62, 66], [47, 54, 59, 62], [43, 55, 59, 62], [40, 52, 55, 59], [45, 52, 57, 62]

# act 1, the problem: cold, sparse D minor; a lonely piano motif
a1, a1_end = T("routine", 6), T("question", 24)
chords(a1, int((a1_end - a1) / (4 * BEAT)), BEAT, [Dm, Bb, Dm, A], gain=0.32, cutoff=600)
for bar, notes in enumerate([[74, 77], [72], [74, 69], [70], [74, 77], [76], [74, 69], [73]] * 3):
    t0 = a1 + 2 * BEAT + bar * 4 * BEAT
    if t0 > a1_end - 2: break
    for j, n in enumerate(notes):
        put(music, t0 + j * 1.5 * BEAT, piano(n, 4, 0.55), 0.22)
# the question: one high note, then silence before the clunk
put(music, T("question", 0), pad([81], T("light", 14) - T("question", 0), 1800, attack=0.8, release=2.0), 0.1)

# act 2, the insight: the light comes on and the harmony opens; the montage swells
a2 = T("light", 26)
chords(a2, int((T("montage", 0) - a2) / (4 * BEAT)), BEAT, [Bb, F, Gm, D], gain=0.34, cutoff=800, bright=0.2)
for i, n in enumerate([62, 65, 69, 70, 69, 65, 74, 72, 70, 69]):
    put(music, a2 + 2 * BEAT + i * 2 * BEAT, piano(n, 4, 0.6), 0.2)
m0, m1 = T("montage", 0), T("montage", 310)
chords(m0, int((m1 - m0) / (4 * BEAT)) + 1, BEAT, [Bb, F, Gm, Bb, F, C], gain=0.5, cutoff=1100, bright=0.5)
for i in range(int((m1 - m0) / BEAT)):
    ch = [Bb, F, Gm, Bb, F, C][(i // 4) % 6]
    put(music, m0 + i * BEAT, piano(ch[2 + (i % 2)] + 12, 3, 0.45), 0.16)

# act 3, the idea: D major, faster, a gentle pulse
a3, a3_end = T("name", 60), T("crowd", 0)
chords(a3, int((a3_end - a3) / (4 * BEAT2)) + 1, BEAT2, [D, Bm, G, A], gain=0.4, cutoff=1000, bright=0.3)
for i in range(int((a3_end - a3) / (BEAT2 / 2))):
    t0 = a3 + i * BEAT2 / 2
    ch = [D, Bm, G, A][(i // 8) % 4]
    put(music, t0, piano(ch[1 + (i % 3)] + 12, 1.4, 0.4), 0.11, pan=(-0.3 if i % 2 else 0.3))
    if i % 2 == 0 and t0 > T("predict", 0): put(music, t0, kick_soft(), 0.22)

# act 4, the proof: fuller, building to the profit
a4, a4_end = T("crowd", 0), T("ending", 16)
chords(a4, int((a4_end - a4) / (4 * BEAT2)) + 1, BEAT2, [G, D, Em, A], gain=0.46, cutoff=1300, bright=0.6)
for i in range(int((a4_end - a4) / (BEAT2 / 2))):
    t0 = a4 + i * BEAT2 / 2
    ch = [G, D, Em, A][(i // 8) % 4]
    put(music, t0, piano(ch[1 + (i % 3)] + 12, 1.4, 0.5), 0.12, pan=(-0.3 if i % 2 else 0.3))
    if i % 2 == 0: put(music, t0, kick_soft(), 0.3)

# the final whistle: the score dies with the lamps; a low, dark drone; then near-silence
cut = int(T("ending", 18) * SR)
music[cut: cut + int(0.8 * SR)] *= np.linspace(1, 0, int(0.8 * SR))[:, None]
music[cut + int(0.8 * SR): int(T("ending", BOOM) * SR)] = 0
put(music, T("ending", 8), pad([38, 41, 45], (88 - 8) / FPS, 260, attack=1.0, release=1.4), 0.32)
put(music, T("ending", 8), sub(26, (90 - 8) / FPS, 1.0), 0.28)

# BOOM: "But the players wanted more!", a driving pulse that climbs into the clunk
b0, b1 = T("ending", BOOM), T("ending", CLUNK)
n_hits = int((b1 - b0) / 0.25)
for i in range(n_hits):
    put(music, b0 + i * 0.25, kick_soft(), 0.34 + 0.2 * i / max(1, n_hits))
put(music, b0, pad([45, 52, 57, 64, 69], b1 - b0 + 0.3, 500, attack=0.05, release=0.2, bright=0.0), 0.32)
put(music, b0, sub(33, b1 - b0, 0.05), 0.35)
rise_ = pad([57, 64, 69, 76], b1 - b0, 400, attack=b1 - b0 - 0.1, release=0.1, bright=1.0)
put(music, b0, rise_, 0.3)

# the clunk: the biggest chord of the film, then the Master League, resolving on "The lights stayed on"
e0 = T("ending", CLUNK)
put(music, e0, pad(D + [69, 74], 6.0, 1200, attack=0.2, release=2, bright=0.8), 0.6)
put(music, e0, sub(38, 6.0, 0.1), 0.5)
chords(e0 + 5.6, 3, BEAT2 * 1.2, [Bm, G, Asus], gain=0.5, cutoff=1400, bright=0.8)
fin = T("ending", MK["ending.lights"])
put(music, fin - 0.4, pad(D + [69, 74, 78], 9, 1600, attack=0.8, release=4, bright=1.0), 0.65)
put(music, fin - 0.4, sub(38, 9, 0.6), 0.55)
for i, n in enumerate([74, 78, 81, 86]):
    put(music, fin + i * 0.42, piano(n, 5, 0.7), 0.22)
put(music, T("card", 6), piano(62, 5, 0.6), 0.18)
put(music, T("card", 6), piano(69, 5, 0.6), 0.14)

# ───────────── sound design: every lamp has a sound ─────────────
# 01 the routine: a quiet room at night, one phone
put(sfx, 0, room_tone(T("question", 0)), 0.05)
put(sfx, T("routine", 18), fx("phone_wake"), 0.45)
put(sfx, T("routine", 52), fx("phone_tap"), 0.35)
for at in (116, 141, 149):  # pay, done, transfer
    put(sfx, T("routine", at), fx("phone_tap"), 0.55)
for at in (121, 155):  # "Payment successful", "Transfer successful"
    put(sfx, T("routine", at), pitch(fx("notif"), 1.1), 0.32)
put(sfx, T("routine", 188), pitch(fx("phone_tap"), 0.8), 0.3)
put(sfx, T("routine", 192), fx("whoosh_soft"), 0.35)
# 02 the dark map: two lamps humming in a dark wall; the numbers land
put(hum, T("darkmap", 0), fade(lamp_hum(T("question", 10) - T("darkmap", 0), 0.6), 1.2, 1.5), 0.05)
put(sfx, T("darkmap", 0), fx("lamp_warm"), 0.3)
put(sfx, T("darkmap", 196), fx("deep_impact"), 0.28)
put(sfx, T("darkmap", MK["darkmap.two"] - 4), fx("relay_click"), 0.6)
# 03 ads: chime in, dragged, flung away (busier and quieter as the flurry builds)
for i in range(12):
    a = 14 + i * 32 if i < 3 else 110 + (i - 3) * 11
    drag = a + (18 if i < 3 else 6)
    pan = -0.35 if i % 2 == 0 else 0.35
    put(sfx, T("ads", a), pitch(fx("notif"), 1 + (i % 3) * 0.06), 0.5 if i < 3 else 0.28, -pan)
    put(sfx, T("ads", drag + 10), fx("swipe"), 0.45 if i < 3 else 0.3, pan)
# 05 the light: one clunk in the dark
put(sfx, T("light", 18), fx("flood_on"), 1.0)
put(sfx, T("light", 18), fx("deep_impact"), 0.5)
put(sfx, T("light", 20), fx("lamp_warm"), 0.35)
put(hum, T("light", 20), fade(lamp_hum(T("montage", 0) - T("light", 20), 1.0), 1.5, 1.5), 0.06)
put(sfx, T("light", MK["light.so"] - 6), fx("whoosh_soft"), 0.28)
put(sfx, T("light", MK["light.made"] - 2), fx("deep_impact"), 0.28)
# 06 the calendar: the lamp lands on the 11th; on "kick off" the tournament days click on
put(sfx, T("calendar", 0), fx("whoosh_soft"), 0.3)
kick = MK["calendar.kick"]
put(sfx, T("calendar", kick), fx("flood_on"), 0.55)
for d in range(12, 31):
    put(sfx, T("calendar", kick + 16 + (d - 12) * 2), pitch(fx("relay_click"), 0.9 + rng.random() * 0.25), 0.2 + rng.random() * 0.08, rng.uniform(-0.5, 0.5))
put(sfx, T("calendar", kick + 16), fx("relay_cascade"), 0.22)
# 07 the montage: a stadium heard from far away; the floodlight slams on
put(sfx, T("montage", 0), fade(fx("crowd_far"), 0.8, 1.5), 0.32)
put(sfx, T("montage", 150), fade(fx("crowd_far"), 1.5, 1.5), 0.3)
put(sfx, T("montage", 304), fx("breaker_slam"), 0.75)
put(hum, T("montage", 310), fade(lamp_hum(T("name", 30) - T("montage", 310), 1.3), 0.02, 1.0), 0.07)
# 08 the name: the floodlight grows into the scoreboard; every lamp that isn't a letter clicks off
put(sfx, T("name", 0), fx("whoosh_soft"), 0.35)
put(sfx, T("name", 24), fx("flood_off"), 0.35)
for j in range(16):
    put(sfx, T("name", 24 + j * 3), pitch(fx("relay_click"), 0.75 + rng.random() * 0.15), 0.16, rng.uniform(-0.7, 0.7))
put(sfx, T("name", 70), fx("deep_impact"), 0.3)
# 09 predict: taps on the keypad, confirmed, the chips
for at in (22, 38, 58):
    put(sfx, T("predict", at), fx("phone_tap"), 0.6)
put(sfx, T("predict", 60), fx("notif"), 0.4)
put(sfx, T("predict", MK["predict.exactly"] - 2), fx("message_pop"), 0.45)
put(sfx, T("predict", MK["predict.exactly"] + 14), pitch(fx("message_pop"), 1.12), 0.4)
put(sfx, T("predict", MK["predict.goals"]), fx("relay_click"), 0.3)
put(sfx, T("predict", 160), fx("relay_click"), 0.35)
# 10 boost: each product lamp ignites with its goal value; the counter runs
for k, at in enumerate(CUES["boostOn"]):
    pan = rng.uniform(-0.6, 0.6)
    put(sfx, T("boost", at), pitch(fx("relay_click"), 0.88 + rng.random() * 0.3), 0.32 + 0.2 * (k == 0), pan)
    put(sfx, T("boost", at + 1), pitch(fx("message_pop"), 0.92 + (k % 5) * 0.05), 0.12, pan)
put(sfx, T("boost", CUES["boostOn"][0]), fx("flood_on"), 0.4)
put(hum, T("boost", CUES["boostOn"][0]), fade(lamp_hum(T("crowd", 0) - T("boost", CUES["boostOn"][0]), 1.2), 3, 1.5), 0.06)
put(sfx, T("boost", CUES["boostOn"][0] + 2), ticker(CUES["boostOn"][-1] + 10 - CUES["boostOn"][0] - 2), 0.16)
# 11 climb: the table scrolls, you land
put(sfx, T("climb", 2), fx("whoosh_soft"), 0.25)
put(sfx, T("climb", 6), ticker(76), 0.25)
put(sfx, T("climb", 82), fx("relay_click"), 0.4)
for i in range(3):
    put(sfx, T("climb", 6 + i * 3), pitch(fx("message_pop"), 1 + i * 0.08), 0.3)
# 12–16 the proof: every number is lights switching on
put(sfx, T("crowd", 8), fx("relay_cascade"), 0.4)
put(sfx, T("crowd", 8), ticker(max(60, MK["crowd.players"] + 30 - 8)), 0.2)  # = the players count (Proof.tsx F0/FD)
put(sfx, T("crowd", MK["crowd.made"] - 4), fx("whoosh_soft"), 0.2)
three = MK["crowd.predictions"] - 4  # predictions: the map crackles with flashes
put(sfx, T("crowd", three), fx("relay_cascade"), 0.34)
put(sfx, T("crowd", three + 20), pitch(fx("relay_cascade"), 1.12), 0.24)
put(sfx, T("crowd", three), ticker(40), 0.22)  # PD
for at in (14, 22, 26, 34, 42):
    put(sfx, T("habit", at), pitch(fx("relay_click"), 0.95 + rng.random() * 0.1), 0.45)
put(sfx, T("habit", MK["habit.uplift"] - 4), fx("deep_impact"), 0.3)
put(sfx, T("habit", MK["habit.uplift"] - 4), ticker(30), 0.18)  # stops when the number lands
put(sfx, T("lit", 12), fx("flood_on"), 0.45)  # the third lamp: the bookend of the dark map
put(sfx, T("lit", 14), fx("lamp_warm"), 0.3)
put(sfx, T("lit", 24), pitch(fx("relay_click"), 0.9), 0.18)
for i, at in enumerate([20, 32, 42, 50, 58, 64]):  # each product's segment of the bar switches on (Loans first, the biggest)
    put(sfx, T("profit", at), fx("flood_on") if i == 0 else pitch(fx("relay_click"), 0.9 + 0.05 * i), 0.5 if i == 0 else 0.42, -0.5 + i * 0.2)
put(sfx, T("profit", 20), ticker(54), 0.24)  # until the last segment lands
put(sfx, T("profit", 74), fx("deep_impact"), 0.45)
# 17 the ending: the final whistle, the lamps die, darkness…
put(sfx, T("ending", 0), fx("whistle"), 0.38)
put(sfx, T("ending", 16), fx("blackout"), 0.55)
put(sfx, T("ending", 50), fx("flood_off"), 0.35)
# …BOOM: the players wanted more
put(sfx, T("ending", BOOM), fx("deep_impact"), 1.0)
put(sfx, T("ending", BOOM), fx("breaker_slam"), 0.45)
for i in range(6):
    put(sfx, T("ending", BOOM + 2 + i * 4), pitch(fx("message_pop"), 0.95 + (i % 3) * 0.07), 0.42, -0.3 if i % 2 == 0 else 0.3)
put(sfx, T("ending", CLUNK - 22), fx("whoosh_soft"), 0.25)
# …the clunk on "going", the stadium, the towers on the matches figure
put(sfx, T("ending", CLUNK), fx("flood_on"), 1.0)
put(sfx, T("ending", CLUNK), fx("breaker_slam"), 0.7)
put(sfx, T("ending", CLUNK), fx("deep_impact"), 0.75)
put(sfx, T("ending", CLUNK + 3), fx("lamp_warm"), 0.4)
for i in range(3):
    put(sfx, T("ending", FOUR + i * 10), reverb(fx("breaker_slam"), 2.2, 0.45), 0.5 + 0.08 * i, [-0.6, 0.6, 0.0][i])
put(hum, T("ending", CLUNK), fade(lamp_hum(T("card", 20) - T("ending", CLUNK), 1.6), 0.02, 2.0), 0.08)
put(sfx, T("ending", FOUR - 10), fade(fx("crowd_far"), 2.5, 1.0), 0.28)
put(sfx, T("ending", FOUR + 12), fx("whoosh_soft"), 0.3)
put(sfx, T("ending", FOUR + 60), fade(fx("crowd_far"), 1.0, 2.5), 0.3)
put(sfx, T("ending", MK["ending.lights"] - 2), fx("deep_impact"), 0.35)
# 18 the card: the ABB symbol turns into place, the wordmark slides out, ABB mobile settles
put(sfx, T("card", 1), fx("whoosh_soft"), 0.32)
put(sfx, T("card", 22), fx("deep_impact"), 0.3)
put(sfx, T("card", 40), pitch(fx("message_pop"), 0.9), 0.22)

# ───────────── mix ─────────────
music = reverb(music, 2.2, 0.3, 2.6)
sfx = reverb(sfx, 1.2, 0.14)
vo = np.zeros((N, 2))
for v in SY["vo"]:
    take = ROOT / f"public/vo/b/{NAR['voice']}/{v['id']}.mp3"
    if not take.exists():  # no narration yet: the mix is music and sound effects only
        continue
    x = load(take, v.get("tempo", 1.0))
    put(vo, v["at"] / FPS, x, 1.0)
env = np.abs(vo).max(axis=1)
k = int(0.3 * SR)
env = np.convolve((env > 0.02).astype(float), np.ones(k) / k, mode="same")
music *= (1 - 0.7 * np.clip(env * 1.5, 0, 1))[:, None]  # about -10 dB under the voice
sfx *= (1 - 0.35 * np.clip(env * 1.5, 0, 1))[:, None]
if np.max(np.abs(vo)) > 0:
    vo *= 0.8 / np.max(np.abs(vo))
mix = music * 0.75 + sfx * 0.85 + hum * 1.0 + vo * 2.0
mix = filt(mix, "hp", 26)
mix = np.tanh(mix * 1.3) / np.tanh(1.3)
mix *= 0.89 / np.max(np.abs(mix))
mix = mix[: int(TOTAL / FPS * SR)]

out = ROOT / "public/audio/b-mix.wav"
out.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(out), "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype("<i2").tobytes())
print(f"wrote {out} ({len(mix) / SR:.1f}s)")
