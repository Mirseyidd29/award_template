import React from "react";
import { Img, staticFile } from "remotion";
import { fonts } from "../theme/fonts";

// ABB PLAY logo, rebuilt as vectors from the official press visual.
// Replace with the official file when the brand team sends it.
export const abbPlayGradient = {
  top: "linear-gradient(90deg, #CC80C4 0%, #A280E9 42%, #7A97EF 74%, #5EA8EF 100%)",
  edge: "linear-gradient(90deg, #BA59B1 0%, #7059E3 50%, #3B8DE5 100%)",
};

const Puzzle: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <path
      fill="#fff"
      d="M38 8c7 0 12 5 12 11 0 3-1 5-3 7h18c3 0 5 2 5 5v16c2-2 4-3 7-3 6 0 11 5 11 12s-5 12-11 12c-3 0-5-1-7-3v17c0 3-2 5-5 5H48c2-2 3-4 3-7 0-6-5-11-12-11s-12 5-12 11c0 3 1 5 3 7H14c-3 0-5-2-5-5V68c2 2 4 3 7 3 6 0 11-5 11-12s-5-12-11-12c-3 0-5 1-7 3V31c0-3 2-5 5-5h17c-2-2-3-4-3-7 0-6 5-11 12-11z"
      transform="rotate(-18 50 50)"
    />
  </svg>
);

const PlayA: React.FC<{ h: number }> = ({ h }) => (
  <svg width={h * 0.92} height={h} viewBox="0 0 92 100" style={{ margin: `0 ${h * 0.02}px` }}>
    <path fill="#fff" fillRule="evenodd" d="M46 4c4 0 7 2 9 6l34 74c3 7-2 14-9 14H12C5 98 0 91 3 84L37 10c2-4 5-6 9-6zM38 46v32l28-16z" />
  </svg>
);

export const AbbPlayLogo: React.FC<{ height?: number; style?: React.CSSProperties }> = ({ height = 120, style }) => {
  const h = height;
  return (
    <div style={{ position: "relative", height: h * 1.07, display: "inline-block", ...style }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: h * 0.07, height: h, borderRadius: h * 0.26, background: abbPlayGradient.edge }} />
      <div style={{
        position: "relative", height: h, borderRadius: h * 0.26, background: abbPlayGradient.top, display: "flex", alignItems: "center",
        gap: h * 0.16, padding: `0 ${h * 0.32}px 0 ${h * 0.24}px`, boxShadow: `inset 0 ${h * 0.03}px 0 rgba(255,255,255,.35)`,
      }}>
        <Puzzle size={h * 0.62} />
        <div style={{ display: "flex", alignItems: "center", fontFamily: fonts.ui, color: "#fff", fontSize: h * 0.56, lineHeight: 1, letterSpacing: h * 0.01 }}>
          <span style={{ fontWeight: 400 }}>ABB</span>
          <span style={{ width: h * 0.2 }} />
          <span style={{ fontWeight: 800 }}>PL</span>
          <PlayA h={h * 0.43} />
          <span style={{ fontWeight: 800 }}>Y</span>
        </div>
      </div>
    </div>
  );
};

/** Official ABB logo (symbol + ABB, tagline removed) from abb-bank.az brand centre. */
export const AbbLogo: React.FC<{ height?: number; white?: boolean }> = ({ height = 120, white }) => (
  <Img src={staticFile(white ? "brand/abb-logo-white.png" : "brand/abb-logo-blue.png")} style={{ height, width: "auto" }} />
);

/** ABB mobile app icon (App Store artwork). */
export const AbbMobileIcon: React.FC<{ size?: number }> = ({ size = 160 }) => (
  <Img src={staticFile("brand/abb-mobile-icon.png")} style={{ width: size, height: size, borderRadius: size * 0.225, boxShadow: "0 20px 50px rgba(0,0,0,.25)" }} />
);

// Club crests for the Master League row: placeholder shields. Put your own files in public/clubs/ and list them here.
export const clubs = {
  clubA: { name: "Club A", file: "clubs/club-a.png" },
  clubB: { name: "Club B", file: "clubs/club-b.png" },
  clubC: { name: "Club C", file: "clubs/club-c.png" },
  clubD: { name: "Club D", file: "clubs/club-d.png" },
  clubE: { name: "Club E", file: "clubs/club-e.png" },
  clubF: { name: "Club F", file: "clubs/club-f.png" },
} as const;
export type ClubKey = keyof typeof clubs;

export const Crest: React.FC<{ club: ClubKey; size: number; style?: React.CSSProperties }> = ({ club, size, style }) => (
  <Img src={staticFile(clubs[club].file)} style={{ width: size, height: size, objectFit: "contain", ...style }} />
);

// Prize photos: placeholders. Put your own images in public/prizes/ and name the prizes here.
export const prizes = [
  { name: "Prize name", file: "prizes/prize-a.png" },
  { name: "Prize name", file: "prizes/prize-b.png" },
] as const;

export const PrizePhoto: React.FC<{ i: number; style?: React.CSSProperties }> = ({ i, style }) => (
  <Img src={staticFile(prizes[i % prizes.length].file)} style={{ width: "100%", height: "100%", objectFit: "cover", ...style }} />
);
