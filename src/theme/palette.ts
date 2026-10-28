// ABB PLAY case-film palette: World Cup energy that resolves into ABB blue.
// ABB values come from abb-bank.az CSS and the ABB PLAY promo; WC values are sampled
// from the tournament artwork (evocation only: no FIFA marks or artwork in the film).

export const abb = {
  blue: "#1B63ED", // primary brand blue (abb-bank.az)
  blueApp: "#2E6AE6", // CTA blue as it renders in the app ("Qoşul")
  deep: "#0056C1", // secondary / pressed blue (abb-bank.az)
  navy: "#0A204F", // stadium-night navy from the promo
  night: "#06132F", // film background (replaces Itaú's black)
  mist: "#EEF3FC", // light background for explainer boards (Itaú used cream)
  white: "#FFFFFF",
  points: "#4BD478", // "QOL" points green from the promo cards
} as const;

export const wc = {
  flame: "#F73E08",
  lime: "#AADF08",
  royal: "#3953F6", // the bridge colour: sits right beside ABB blue
  lilac: "#B084F4",
  violet: "#6508DD",
  aqua: "#6CF8D5",
  crimson: "#C70307",
  maroon: "#7B1F24",
  pine: "#0B4F43",
  sun: "#E4DA57",
  teal: "#1AAE93",
} as const;

// Ring order for the kaleidoscope, outer to inner. It ends on royal, then ABB blue.
export const ringOrder = [
  wc.aqua, wc.lime, wc.flame, wc.lilac, wc.violet, wc.crimson,
  wc.sun, wc.teal, wc.flame, wc.lilac, wc.royal,
] as const;

// Roles: what each part of the film uses.
export const roles = {
  tournament: { bg: abb.night, accents: [wc.flame, wc.lime, wc.lilac, wc.aqua, wc.royal] },
  league: { bg: abb.night, primary: abb.blue, accent: abb.points, text: abb.white },
  results: { bg: abb.night, number: abb.white, subline: wc.lime, rule: abb.blue },
  explainer: { bg: abb.mist, primary: abb.blue, ink: abb.navy, accent: wc.flame },
} as const;

// v3: calmer, deeper tones for large areas (feedback: pure white and #1B63ED fields were too harsh).
export const v3 = {
  ink: "#040B1E", // deepest background
  deep: "#071A42", // main dark background
  sea: "#0B2A66", // raised surfaces
  logo: "#0A56C9", // ABB logo blue: large blue areas
  glow: "#3D7BFF", // light, glows, active lines
  sky: "#8FB4FF", // secondary text and accents on dark
  soft: "#EEF3FF", // "white" text on dark (never pure white fields)
  mute: "#8A9BC4", // tertiary text
} as const;
