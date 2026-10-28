import React from "react";
import { AbsoluteFill } from "remotion";
import { fonts } from "../theme/fonts";
import { Lamp, LampLabel } from "./Lamp";
import { CONTENT, Figure } from "./content";
import { L, rgba } from "./look";

// The app's product catalogue as a wall of lamps. One lamp = one product; a lit lamp = a product people use.
// Names follow the ABB mobile catalogue. Goal values for the boosted products come from content.ts (placeholders).
const g = (name: string) => CONTENT.boosterGoals[name];
const daily = (name: string) => CONTENT.dailyBoosters[name];
export const PRODUCTS: { name: string; goals?: Figure; daily?: string }[] = [
  { name: "Mortgage" }, { name: "Car loan" }, { name: "Gold account" }, { name: "Brokerage" }, { name: "Bonds" }, { name: "Pension" }, { name: "Business account" }, { name: "POS terminal" },
  { name: "Life insurance" }, { name: "TamKart limit", goals: g("TamKart limit") }, { name: "DigiDeposit", goals: g("DigiDeposit") }, { name: "Dama-dama", goals: g("Dama-dama") }, { name: "Cash loan", goals: g("Cash loan") }, { name: "BNPL", goals: g("BNPL") }, { name: "Overdraft" }, { name: "Student loan" },
  { name: "Travel insurance" }, { name: "DigiTravel", goals: g("DigiTravel") }, { name: "Currency exchange" }, { name: "Transfers" }, { name: "Payments" }, { name: "QR pay", daily: daily("QR pay") }, { name: "Taksit", goals: g("Taksit") }, { name: "Kids card" },
  { name: "Auto insurance" }, { name: "Debit card", goals: g("Debit card") }, { name: "Open banking", goals: g("Open banking") }, { name: "Utility bills" }, { name: "Mobile top-up" }, { name: "DigiHesab Max", goals: g("DigiHesab Max") }, { name: "Cashback" }, { name: "Premium card", goals: g("Premium card") },
  { name: "Investments" }, { name: "Salary card" }, { name: "Card-to-card" }, { name: "Apple Pay" }, { name: "Google Pay" }, { name: "Gift card" }, { name: "Fines & taxes" }, { name: "Lounge access" },
  { name: "Metal card" }, { name: "Card payments", daily: daily("Card payments") }, { name: "Bill split" }, { name: "Charity" }, { name: "Deposit Plus" }, { name: "Insurance claims" }, { name: "Trade finance" }, { name: "Safe box" },
];
export const COLS = 8, ROWS = 6, CELL_W = 210, CELL_H = 205, LAMP = 112;
export const GRID_W = COLS * CELL_W, GRID_H = ROWS * CELL_H;
export const TRANSFERS = 19, PAYMENTS = 20;
/** plane coords (relative to the grid centre) of lamp i */
export const lampXY = (i: number): [number, number] => [((i % COLS) + 0.5) * CELL_W - GRID_W / 2, (Math.floor(i / COLS) + 0.42) * CELL_H - GRID_H / 2];

export type LampState = { level: number; warm?: number; tag?: number; label?: number };
export type Cam = { x: number; y: number; z: number; rx: number; ry: number; rz?: number };

export const ProductGrid: React.FC<{ cam: Cam; state: (i: number) => LampState; perspective?: number; labels?: number; dust?: number }> = ({
  cam, state, perspective = 1400, labels = 1, dust = 0,
}) => (
  <AbsoluteFill style={{ perspective, perspectiveOrigin: "50% 50%", overflow: "hidden" }}>
    <div style={{
      position: "absolute", left: "50%", top: "50%", width: GRID_W, height: GRID_H, marginLeft: -GRID_W / 2, marginTop: -GRID_H / 2,
      transformStyle: "preserve-3d",
      transform: `translateZ(${cam.z}px) rotateX(${cam.rx}deg) rotateY(${cam.ry}deg) rotateZ(${cam.rz ?? 0}deg) translate(${-cam.x}px, ${-cam.y}px)`,
    }}>
      {/* the wall the lamps sit in: faint panel lines */}
      <div style={{
        position: "absolute", inset: -40, borderRadius: 18, border: `1px solid ${rgba("#ffffff", 0.05)}`,
        background: `linear-gradient(180deg, ${rgba("#0E1320", 0.9)}, ${rgba("#070A11", 0.9)})`,
      }} />
      {PRODUCTS.map((pr, i) => {
        const s = state(i);
        const [x, y] = lampXY(i);
        const tagT = s.tag ?? 0;
        return (
          <div key={i} style={{ position: "absolute", left: x + GRID_W / 2 - CELL_W / 2, top: y + GRID_H / 2 - LAMP / 2, width: CELL_W, display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
            <Lamp size={LAMP} level={s.level} warm={s.warm ?? 1} />
            <LampLabel text={pr.name} lit={s.level} opacity={labels * (s.label ?? 1)} />
            {(pr.goals || pr.daily) && tagT > 0 && (
              <div style={{
                position: "absolute", top: -34, opacity: tagT, transform: `translateY(${(1 - tagT) * 10}px)`,
                fontFamily: fonts.ui, fontWeight: 800, fontSize: 17, letterSpacing: 0.5, color: "#06140B", background: L.goal,
                padding: "4px 10px", borderRadius: 14, whiteSpace: "nowrap",
              }}>{pr.goals ? `+${typeof pr.goals === "number" ? pr.goals.toLocaleString("en-US") : pr.goals}` : pr.daily}</div>
            )}
          </div>
        );
      })}
      {dust > 0 && (
        <div style={{ position: "absolute", inset: -40, borderRadius: 18, background: `radial-gradient(ellipse at 50% 40%, transparent 30%, ${rgba("#05070C", dust)} 85%)` }} />
      )}
    </div>
  </AbsoluteFill>
);
