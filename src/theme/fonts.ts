import { continueRender, delayRender, staticFile } from "remotion";

// Local copies (Google Fonts, OFL) so renders never depend on the network.
const faces: Array<[family: string, file: string, weight: string]> = [
  ["Barlow Condensed", "BarlowCondensed-600", "600"],
  ["Barlow Condensed", "BarlowCondensed-800", "800"],
  ["Barlow Condensed", "BarlowCondensed-900", "900"],
  ["Inter", "Inter-400", "400"],
  ["Inter", "Inter-600", "600"],
  ["Inter", "Inter-800", "800"],
  ["Anton", "Anton-400", "400"],
];

export const fonts = {
  display: "'Barlow Condensed', 'Anton', sans-serif", // supers, numbers (Itaú-style condensed caps)
  ui: "'Inter', sans-serif", // subtitles, small print, app-adjacent text
} as const;

// unicode-range per subset, as Google Fonts serves them (latin-ext carries ə, ğ, ı, ş for Azerbaijani).
const ranges: Record<string, string> = {
  latin: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD",
  "latin-ext": "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF",
};

if (typeof document !== "undefined") {
  const handle = delayRender("Loading fonts");
  const loads = faces.flatMap(([family, file, weight]) =>
    ["latin", "latin-ext"].map((subset) => {
      const face = new FontFace(family, `url(${staticFile(`fonts/${file}-${subset}.woff2`)}) format('woff2')`, { weight, unicodeRange: ranges[subset] });
      document.fonts.add(face);
      return face.load();
    }),
  );
  Promise.all(loads).then(() => continueRender(handle), (e) => { console.error(e); continueRender(handle); });
}
