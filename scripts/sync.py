"""Film B ("Lights On") v3: lock the picture to the narration (target: under 2:00).

Reads the ElevenLabs takes (public/vo/b/bill/*.mp3 + *.json word timings) and writes src/film/sync.json:
  scenes   : frames per scene (order in src/film/timeline.ts)
  vo       : every line with its absolute start frame and playback tempo
  marks    : "scene.name" -> scene-local frame where a given word is spoken (the picture's beats read these)
  captions : [text, from, to] in absolute frames, split at sentences, timed to the spoken words
After "Goals Bring Rewards" the narration plays 8 % faster (the film speeds up); the gloomy final whistle does not.
Run: python3 scripts/sync.py
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FPS = 30
N = json.loads((ROOT / "src/film/narration.json").read_text())
VO = ROOT / "public/vo/b" / N["voice"]

SCENES = [
    ("routine", 212), ("darkmap", 314), ("ads", 212), ("question", 154),
    ("light", 262), ("calendar", 140), ("montage", 330),
    ("name", 130), ("predict", 180), ("boost", 306), ("climb", 96),
    ("crowd", 232), ("habit", 165), ("lit", 80), ("profit", 168),
    ("ending", 535), ("card", 70),
]
FAST = 1.08
CLUNK = 196  # ending frame of the stadium clunk, on "going"
# line id -> (seconds into its scene, tempo)
PLACE = {
    "b01_routine": (0.4, 1), "b02_products": (0.9, 1.04), "b03_ads": (0.4, 1), "b04_question": (0.3, 1),
    "b05_passion": (1.0, 1), "b06v2_kickoff": (0.6, 1), "b07_country": (0.3, 1), "b08_inside": (0.7, 1),
    "b09v3_predict": (0.3, FAST), "b10v2_twist": (0.3, 1.12), "b11_climb": (0.2, FAST),
    "b12v3_players": (0.3, FAST), "b12b_predictions": (4.85, FAST), "b13v2_opens": (0.3, FAST),
    "b14v2_found": (0.3, FAST), "b14c_profit": (0.3, FAST),
    "b15v2_whistle": (0.3, 1), "b16v2_wanted": (114 / FPS, FAST), "b17_going": (None, FAST),
    "b18v2_league": ((CLUNK + 24) / FPS, FAST), "b19_lights": ((CLUNK + 204) / FPS, FAST),
}
# marks: key -> (line id, word, occurrence). The picture times its beats to these spoken words.
# "x" matches a placeholder [X]. When you write a real figure, put its first spoken word here (e.g. "seven" for "seven thousand").
MARKS = {
    "routine.open": ("b01_routine", "open", 0), "routine.pay": ("b01_routine", "pay", 0),
    "routine.transfer": ("b01_routine", "transfer", 0), "routine.leave": ("b01_routine", "leave", 0),
    "darkmap.built": ("b02_products", "built", 0), "darkmap.two": ("b02_products", "two", 0),
    "ads.swipe": ("b03_ads", "swipe", 0),
    "question.to": ("b04_question", "to", 0),
    "light.so": ("b05_passion", "so", 0), "light.made": ("b05_passion", "made", 0),
    "calendar.kick": ("b06v2_kickoff", "kick", 0),
    "name.inside": ("b08_inside", "inside", 0),
    "predict.exactly": ("b09v3_predict", "exactly", 0), "predict.goals": ("b09v3_predict", "x", 0),
    "boost.every": ("b10v2_twist", "every", 0), "boost.climb": ("b10v2_twist", "climb", 0), "boost.discover": ("b10v2_twist", "discover", 0),
    "crowd.players": ("b12v3_players", "x", 0),
    "crowd.made": ("b12b_predictions", "made", 0), "crowd.predictions": ("b12b_predictions", "x", 0),
    "habit.uplift": ("b13v2_opens", "x", 0), "habit.because": ("b13v2_opens", "because", 0),
    "lit.found": ("b14v2_found", "found", 0),
    "profit.amount": ("b14c_profit", "x", 0),
    "ending.then": ("b15v2_whistle", "then", 0), "ending.whistle": ("b15v2_whistle", "whistle", 0),
    "ending.but": ("b16v2_wanted", "but", 0), "ending.going": ("b17_going", "going", 0),
    "ending.league": ("b18v2_league", "abb", 0), "ending.months": ("b18v2_league", "x", 1),
    "ending.ended": ("b19_lights", "ended", 0), "ending.lights": ("b19_lights", "lights", 0),
}
# words already on screen as big type / numbers: no caption under them
NO_CAPTION = {"b04_question", "b18v2_league", "b19_lights", "b12b_predictions", "b14c_profit"}
NO_CAPTION_CHUNKS = ("So we found their passion", "[X] players", "They opened the app [X]")
SHOW = [
    ("[X] goals", "_[X] goals_"), ("just two of them", "just *two* of them"),
    ("swipe it away", "*swipe it away*"), ("what they love", "what they *love*"), ("inside the bank", "*inside the bank*"),
    ("discover the bank", "*discover the bank*"), ("because they wanted to", "*because they wanted to*"), ("kept going", "*kept going*"),
    ("wanted more", "*wanted more*"), ("the rest of the bank", "*the rest of the bank*"),
]

start, t = {}, 0
for k, d in SCENES:
    start[k] = t
    t += d
total = t


def words_of(line_id, tempo):
    a = json.loads((VO / f"{line_id}.json").read_text())
    out, cur, cs, ce = [], "", 0.0, 0.0
    for c, s, e in zip(a["characters"], a["character_start_times_seconds"], a["character_end_times_seconds"]):
        if c.isspace():
            if cur: out.append((cur, cs, ce)); cur = ""
        else:
            if not cur: cs = s
            cur += c; ce = e
    if cur: out.append((cur, cs, ce))
    clean, inside = [], False
    for w, s, e in out:  # drop [delivery cues]
        if w.startswith("["): inside = True
        if not inside: clean.append((w, s / tempo, e / tempo))
        if w.endswith("]"): inside = False
    return clean


def norm(w):
    return re.sub(r"[^a-z0-9\-]", "", w.lower())


lines = {l["id"]: l for l in N["lines"]}
vo, caps, marks, wordsets = [], [], {}, {}
for lid, (off, tempo) in PLACE.items():
    line = lines[lid]
    ws = words_of(lid, tempo)
    wordsets[lid] = ws
    if lid == "b17_going":  # "going" lands on the clunk
        g = next(s for w, s, _ in ws if norm(w) == "going")
        off = CLUNK / FPS - g
    at = start[line["scene"]] + round(off * FPS)
    vo.append({"id": lid, "scene": line["scene"], "at": at, "tempo": tempo, "end": at + round(ws[-1][2] * FPS)})
    for key, (mid, word, occ) in MARKS.items():
        if mid != lid: continue
        hits = [s for w, s, _ in ws if norm(w) == word]
        marks[key] = at - start[line["scene"]] + round(hits[occ] * FPS)
    if lid in NO_CAPTION: continue
    chunks, cur = [], []
    for w in ws:
        cur.append(w)
        long_pause = w[0].endswith("...") and len(" ".join(x[0] for x in cur)) > 34
        if (re.search(r"[.?!]$", w[0]) and not w[0].endswith("...")) or long_pause:
            chunks.append(cur); cur = []
    if cur: chunks.append(cur)
    merged = []
    for c in chunks:
        if merged and len(" ".join(x[0] for x in merged[-1] + c)) < 46 and c[0][1] - merged[-1][-1][2] < 0.9:
            merged[-1] = merged[-1] + c
        else:
            merged.append(c)
    for c in merged:
        text = " ".join(w for w, _, _ in c)
        if text.startswith(NO_CAPTION_CHUNKS): continue
        text = re.sub(r"^([^A-Za-z]*)([a-z])", lambda m: m.group(1) + m.group(2).upper(), text)  # every caption starts with a capital
        for a, b in SHOW: text = text.replace(a, b).replace(a[0].upper() + a[1:], b.replace(b.strip("*_")[0], b.strip("*_")[0].upper(), 1))
        caps.append([text, at + round(c[0][1] * FPS) - 3, at + round(c[-1][2] * FPS) + 18])

# no two captions on screen at once: a line ends as the next begins (+4 frames of in-place cross-fade)
caps.sort(key=lambda c: c[1])
for i in range(len(caps) - 1):
    caps[i][2] = min(caps[i][2], caps[i + 1][1] + 4)

out = {"fps": FPS, "total": total, "scenes": dict(SCENES), "start": start, "vo": vo, "marks": marks, "captions": caps}
(ROOT / "src/film/sync.json").write_text(json.dumps(out, indent=1))
print(f"total {total} frames = {total / FPS:.1f} s, {len(caps)} captions")
for v in vo:
    sc = v["scene"]; end_local = v["end"] - start[sc]
    flag = "  ⚠ runs past its scene" if end_local > dict(SCENES)[sc] else ""
    print(f"  {v['id']:<18} {v['at'] / FPS:6.2f}s – {v['end'] / FPS:6.2f}s  (scene {sc}: ends at {end_local}/{dict(SCENES)[sc]}){flag}")
print("marks:", marks)
