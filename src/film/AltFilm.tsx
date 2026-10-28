import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { CAPTIONS, SceneKey, starts, TOTAL } from "./timeline";
import { Captions } from "./look";
import { Ads, DarkMap, Question, Routine } from "./scenes/Problem";
import { Calendar, Light, Montage } from "./scenes/Insight";
import { Boost, Climb, Name, Predict } from "./scenes/Idea";
import { Crowd, Habit, Lit, Profit } from "./scenes/Proof";
import { Card, Ending } from "./scenes/Ending";

// Case film "Lights On". Soundtrack (music + sound effects + narration once recorded): public/audio/b-mix.wav, built by scripts/make_audio.py.
export const ALT_FRAMES = TOTAL;

export const AltFilm: React.FC<{ ending?: "A" | "B"; withAudio?: boolean }> = ({ ending = "B", withAudio = true }) => {
  const scenes: Record<SceneKey, React.FC> = {
    routine: Routine, darkmap: DarkMap, ads: Ads, question: Question,
    light: Light, calendar: Calendar, montage: Montage,
    name: Name, predict: Predict, boost: Boost, climb: Climb,
    crowd: Crowd, habit: Habit, lit: Lit, profit: Profit,
    ending: () => <Ending variant={ending} />, card: Card,
  };
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {(Object.keys(starts) as SceneKey[]).map((k) => {
        const [a, b] = starts[k];
        const C = scenes[k];
        return (
          <Sequence key={k} name={k === "ending" ? `ending ${ending}` : k} from={a} durationInFrames={b - a}>
            <C />
          </Sequence>
        );
      })}
      {/* the narration, as small captions timed to the spoken words */}
      <Captions lines={CAPTIONS} />
      {/* soundtrack for ending B (scripts/make_audio.py); ending A has no mix of its own yet */}
      {withAudio && ending === "B" && <Audio src={staticFile("audio/b-mix.wav")} />}
    </AbsoluteFill>
  );
};
