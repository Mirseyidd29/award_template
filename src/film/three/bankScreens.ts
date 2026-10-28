import * as THREE from "three";

// The two screens the opening taps lead to: a bill paid, money sent. A clean, ordinary banking app:
// one clear title, one big confirmation, the amount as the hero, a few quiet detail rows, one primary button.
const W = 720, H = 1555;
const font = (w: number, px: number) => `${w} ${px}px Inter, sans-serif`;
const rr = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
const NAVY = "#0d1b3a", GREY = "#7d879b", BG = "#F3F5F9", ACCENT = "#4C6FE0";

const chrome = (g: CanvasRenderingContext2D, title: string) => {
  g.fillStyle = BG; g.fillRect(0, 0, W, H);
  // nav bar: back chevron + title
  g.strokeStyle = NAVY; g.lineWidth = 6; g.lineCap = "round"; g.lineJoin = "round";
  g.beginPath(); g.moveTo(74, 150); g.lineTo(52, 172); g.lineTo(74, 194); g.stroke();
  g.fillStyle = NAVY; g.font = font(700, 36); g.textAlign = "center"; g.fillText(title, W / 2, 186);
};
const finish = (g: CanvasRenderingContext2D) => {
  // status bar, island, rounded display corners
  g.fillStyle = NAVY; g.font = font(600, 34); g.textAlign = "left"; g.fillText("9:41", 70, 72);
  for (let i = 0; i < 4; i++) g.fillRect(520 + i * 14, 70 - (i + 1) * 7, 9, (i + 1) * 7);
  g.strokeStyle = NAVY; g.lineWidth = 3; rr(g, 590, 46, 56, 28, 8); g.stroke(); rr(g, 594, 50, 40, 20, 5); g.fill();
  g.fillStyle = "#000"; rr(g, W / 2 - 112, 30, 224, 64, 32); g.fill();
  g.fillStyle = NAVY; rr(g, W / 2 - 110, H - 24, 220, 9, 5); g.fill();
  g.globalCompositeOperation = "destination-in"; rr(g, 0, 0, W, H, 92); g.fill(); g.globalCompositeOperation = "source-over";
};
// the confirmation is a state of the screen: a drawn check in the app's accent (green is kept for goals in this film)
const success = (g: CanvasRenderingContext2D, y: number) => {
  g.fillStyle = "rgba(76,111,224,.12)"; g.beginPath(); g.arc(W / 2, y, 104, 0, Math.PI * 2); g.fill();
  g.fillStyle = ACCENT; g.beginPath(); g.arc(W / 2, y, 72, 0, Math.PI * 2); g.fill();
  g.strokeStyle = "#fff"; g.lineWidth = 12; g.lineCap = "round"; g.lineJoin = "round";
  g.beginPath(); g.moveTo(W / 2 - 34, y + 2); g.lineTo(W / 2 - 8, y + 28); g.lineTo(W / 2 + 38, y - 26); g.stroke();
};
const rows = (g: CanvasRenderingContext2D, y: number, items: [string, string][]) => {
  g.fillStyle = "#fff"; rr(g, 40, y, 640, items.length * 104 + 24, 32); g.fill();
  g.strokeStyle = "#E3E7EF"; g.lineWidth = 2; rr(g, 40, y, 640, items.length * 104 + 24, 32); g.stroke();
  items.forEach(([k, v], i) => {
    const ry = y + 70 + i * 104;
    g.textAlign = "left"; g.fillStyle = GREY; g.font = font(400, 27); g.fillText(k, 80, ry);
    g.textAlign = "right"; g.fillStyle = NAVY; g.font = font(600, 27); g.fillText(v, 640, ry);
    if (i < items.length - 1) { g.fillStyle = "#eef1f6"; g.fillRect(80, ry + 34, 560, 2); }
  });
};
const button = (g: CanvasRenderingContext2D, label: string) => {
  g.fillStyle = ACCENT; g.font = font(600, 30); g.textAlign = "center"; g.fillText("Share receipt", W / 2, H - 262);
  g.fillStyle = ACCENT; rr(g, 40, H - 210, 640, 104, 28); g.fill();
  g.fillStyle = "#fff"; g.font = font(700, 34); g.fillText(label, W / 2, H - 146);
};
const avatar = (g: CanvasRenderingContext2D, x: number, y: number, initials: string) => {
  g.fillStyle = "#E4E9F7"; g.beginPath(); g.arc(x, y, 26, 0, Math.PI * 2); g.fill();
  g.fillStyle = ACCENT; g.font = font(700, 22); g.textAlign = "center"; g.fillText(initials, x, y + 8);
};

export const drawPaid = (g: CanvasRenderingContext2D) => {
  chrome(g, "Pay bills");
  success(g, 390);
  g.textAlign = "center"; g.fillStyle = NAVY; g.font = font(600, 32); g.fillText("Payment successful", W / 2, 548);
  g.font = font(800, 92); g.fillText("XX.XX AZN", W / 2, 664);
  g.fillStyle = "rgba(13,27,58,.6)"; g.font = font(500, 30); g.fillText("Azerishig, electricity", W / 2, 722);
  rows(g, 790, [["To", "Acc. XXXX XXXX"], ["From", "Main account •••• XXXX"], ["Date", "Wed, XX:XX"], ["Ref.", "PB-XXXX"]]);
  button(g, "Done");
  finish(g);
};
export const drawSent = (g: CanvasRenderingContext2D) => {
  chrome(g, "Transfer");
  success(g, 390);
  g.textAlign = "center"; g.fillStyle = NAVY; g.font = font(600, 32); g.fillText("Transfer successful", W / 2, 548);
  g.font = font(800, 92); g.fillText("XXX.XX AZN", W / 2, 664);
  avatar(g, W / 2 - 92, 712, "EM");
  g.textAlign = "left"; g.fillStyle = "rgba(13,27,58,.6)"; g.font = font(500, 30); g.fillText("Elvin M.", W / 2 - 54, 722);
  rows(g, 790, [["To", "Elvin M. •••• XXXX"], ["From", "Main account •••• XXXX"], ["Date", "Fri, XX:XX"], ["Ref.", "TR-XXXX"]]);
  button(g, "Done");
  finish(g);
};
/** texture px of the "Done" button (for the tap ripple) */
export const DONE_AT: [number, number] = [W / 2, H - 158];

export const makeScreen = (draw: (g: CanvasRenderingContext2D) => void) => {
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  draw(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
};
