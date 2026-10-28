# Award case film: template

The editable source of the case film "Lights On" (16:9, 1920×1080, 30 fps, about 2 minutes), made with [Remotion](https://www.remotion.dev) (React).

**Everything in this repo is a placeholder.** Campaign figures appear as `X`, `XX,XXX` or `[X]`, and the footage, club crests, team flags and prize photos are grey stand-ins. The narration is not included, because it speaks the real figures. Put your own material in the places listed below.

## 1. Set up (once)

You need [Node.js 22](https://nodejs.org) and Git.

```bash
git clone https://github.com/Mirseyidd29/award_template.git
cd award_template
npm ci
```

## 2. Preview and render

| What | Command |
|---|---|
| Open the editor in the browser (live preview, scrub the timeline) | `npm run studio` |
| Render the film | `npm run render` → `out/film.mp4` + a smaller `out/film_review.mp4` |
| Render under another name | `npm run render -- my_cut` |
| Render only a range of frames (quick test) | `FRAMES=0-300 npm run render` |
| Save single frames as PNG | `npm run stills -- 300 1200 2400` → `out/stills/` |
| Check the code after an edit | `npm run typecheck` |

On Windows, use `cmd` (not PowerShell) and set variables with `set FRAMES=0-300` before the command.
If the 3D scenes come out black, render with `GL=swangle` (Windows: `set GL=swangle`). If the computer runs hot, add `CONCURRENCY=2`.

## 3. What to change, and where

| You want to change | Edit |
|---|---|
| **Figures on screen** (players, profit, uplift, goals, prizes…) | `src/film/content.ts`. A number counts up on screen; a string is shown as typed. |
| Football footage (7 shots in the "Insight" scene) | Replace the files in `public/footage/` and keep the file names. The list and length of each shot is `CLIPS` in `src/film/scenes/Insight.tsx`. |
| Club crests / team flags / prize photos | `public/clubs/`, `public/flags/`, `public/prizes/`. Names and labels are in `src/shared/brand.tsx`. |
| Product names on the lamp wall | `PRODUCTS` in `src/film/ProductGrid.tsx` |
| Banking app screens on the 3D phones | `src/shared/Phone3D.tsx`, `src/film/three/bankScreens.ts`, `src/film/three/PredictPhone.tsx` |
| Colours and fonts | `src/theme/palette.ts`, `src/theme/fonts.ts`, `src/film/look.tsx` |
| Logo | `public/brand/` and `src/shared/brand.tsx` |
| A scene's layout or animation | `src/film/scenes/` (Problem → Insight → Idea → Proof → Ending) |
| Scene lengths, captions, the words that time each beat | `src/film/sync.json` (generated: see step 4) |

The film is assembled in `src/film/AltFilm.tsx`; the composition is registered in `src/Root.tsx` as `film`.

## 4. Narration and soundtrack

The film plays one audio file, `public/audio/b-mix.wav` (music + sound effects + narration). The one in the repo has music and sound effects only.

To add a voice:

1. Write the lines in `src/film/narration.json` and replace every `[X]` with the spoken figure.
2. Record them with ElevenLabs (on your own computer):
   ```bash
   export ELEVENLABS_API_KEY=sk_...        # Windows cmd: set ELEVENLABS_API_KEY=sk_...
   npm run el -- narration bill            # → public/vo/b/bill/*.mp3 + word timings
   ```
   Or put your own recordings there with the same file names (one `.mp3` per line `id`). You will then also need the word-timing `.json` files.
3. In `scripts/sync.py`, `MARKS` names the spoken word that triggers each beat on screen. A mark whose word is `"x"` points at a `[X]` placeholder; change it to the first word you now say there (e.g. `"seven"`).
4. Rebuild timing, cues and the mix (needs Python 3 with `numpy` and `scipy`, and `ffmpeg` on the PATH):
   ```bash
   pip install numpy scipy
   python3 scripts/sync.py && node scripts/cues.mjs && python3 scripts/make_audio.py
   ```
5. `npm run render`.

Sound effects are in `public/sfx/b/` (prompts: `src/film/sfx.json`, remake with `npm run el -- sfx --force`). The music is synthesised by `scripts/make_audio.py`.

## Notes

- Text on screen is English. The ending carries a small "MOCK DATA" tag (`<Mock />` in `src/film/scenes/Ending.tsx`); remove it once the figures are final.
- Keep large video files out of Git; `out/` and `public/vo/` are ignored.
- **Rights.** Logos are trademarks of their owners and are here only for this case film. Any footage, crests or photos you add must be cleared for use. Fonts (Inter, Barlow Condensed, Anton) are under the SIL Open Font License. Remotion is free for individuals and companies of up to 3 people; larger companies need a [Remotion company license](https://www.remotion.dev/license).
