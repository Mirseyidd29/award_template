import { Composition } from "remotion";
import "./theme/fonts";
import { ALT_FRAMES, AltFilm } from "./film/AltFilm";

export const FPS = 30;

export const Root: React.FC = () => (
  <>
    <Composition id="film" component={AltFilm} width={1920} height={1080} fps={FPS} durationInFrames={ALT_FRAMES} defaultProps={{ ending: "B" as const }} />
  </>
);
