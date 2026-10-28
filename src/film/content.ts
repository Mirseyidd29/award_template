// Every campaign figure shown in the film lives here, and all of them are placeholders.
// Replace a placeholder with your own value:
//   - a number (e.g. players: 25000) counts up on screen like a live counter;
//   - a string (e.g. "XX,XXX") is shown exactly as typed.
// Text that is also spoken (the narration) is in narration.json; see README.md.
export type Figure = number | string;

export const CONTENT = {
  // Act 1: the problem
  productsInApp: "XX+" as Figure, // "products and services in the app"

  // Act 2: the insight (calendar)
  calendarMonth: "MONTH YEAR",
  calendarLine: "Kick-off date. XX days, XXX matches.",

  // Act 3: the idea
  goalsExact: "XX,XXX" as Figure, // goals for an exact score
  goalsRight: "XX,XXX" as Figure, // goals for the right result
  matchDate: "Full time, DATE",
  matchScore: "X – X",
  boostTotal: "XXX,XXX" as Figure, // the "goals from banking" counter; leave a string to show it as typed
  boosterGoals: {
    "TamKart limit": "XX,XXX", "DigiDeposit": "XX,XXX", "Dama-dama": "XX,XXX", "Cash loan": "XX,XXX", "BNPL": "XX,XXX",
    "DigiTravel": "XX,XXX", "Taksit": "XX,XXX", "Debit card": "XX,XXX", "Open banking": "XX,XXX", "DigiHesab Max": "XX,XXX",
    "Premium card": "XX,XXX",
  } as Record<string, Figure>,
  dailyBoosters: { "QR pay": "X per ₼X", "Card payments": "X per ₼X" } as Record<string, string>,
  topPrize: "XX,XXX AZN",

  // Act 4: the proof
  players: "XXX,XXX" as Figure,
  predictions: "X,XXX,XXX" as Figure,
  predictionsPerPlayer: "XX.X",
  opensBefore: "X.XX" as Figure,
  opensDuring: "X.XX" as Figure,
  opensUplift: "XX.XX" as Figure, // shown as +…%
  newProducts: "XX,XXX" as Figure,
  productsBefore: "X.XX" as Figure,
  productsAfter: "X.XX" as Figure,
  profitAzn: "X,XXX,XXX" as Figure,
  profitUsd: "≈ US$XXX,XXX",
  // the lit bar: `weight` sets each segment's width relative to the others; `label` is the text under it
  profitSplit: [
    { name: "Lending", label: "XX.X%", weight: 3 },
    { name: "Deposits", label: "XX.X%", weight: 2 },
    { name: "Card limits", label: "XX.X%", weight: 1 },
  ],
  profitOther: "X.X%", // DigiHesab Max, Dama-dama and debit cards together
  cltvUplift: "XX.X" as Figure, // shown as +…%
  cltvLine: "players’ lifetime value, MONTH → MONTH",

  // Act 5: the ending
  leagueLine: "XX MONTHS. XXX MATCHES.",
};
