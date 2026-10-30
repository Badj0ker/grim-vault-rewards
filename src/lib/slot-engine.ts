// Mock slot engine — simulated outcomes only. No RTP, no real money.
export type SymId = "P1" | "P2" | "P3" | "WILD" | "SCAT" | "COIN" | "A" | "K" | "Q" | "J" | "T";
export type Grid = SymId[][]; // grid[reel][row]

export const SYMBOLS: Record<SymId, { name: string; pays: [number, number, number]; weight: number }> = {
  WILD: { name: "Fury Wild", pays: [20, 80, 250], weight: 2.6 },
  SCAT: { name: "Fury Scatter", pays: [0, 0, 0], weight: 2.4 },
  P1: { name: "VIP Glasses", pays: [10, 40, 150], weight: 4 },
  P2: { name: "Neon Pods", pays: [8, 30, 120], weight: 5 },
  P3: { name: "Shade Boss", pays: [6, 25, 100], weight: 5 },
  COIN: { name: "BFG Coin", pays: [5, 20, 75], weight: 6 },
  A: { name: "Ace", pays: [3, 10, 40], weight: 8 },
  K: { name: "King", pays: [3, 8, 30], weight: 9 },
  Q: { name: "Queen", pays: [2, 6, 25], weight: 10 },
  J: { name: "Jack", pays: [2, 5, 20], weight: 11 },
  T: { name: "Ten", pays: [1, 4, 15], weight: 12 },
};
export const SCATTER_PAYS: Record<number, number> = { 3: 2, 4: 10, 5: 50 }; // x total bet

export const PAYLINES: number[][] = [
  [1, 1, 1, 1, 1], [0, 0, 0, 0, 0], [2, 2, 2, 2, 2], [0, 1, 2, 1, 0], [2, 1, 0, 1, 2],
  [0, 0, 1, 2, 2], [2, 2, 1, 0, 0], [1, 0, 0, 0, 1], [1, 2, 2, 2, 1], [0, 1, 1, 1, 0],
  [2, 1, 1, 1, 2], [1, 0, 1, 2, 1], [1, 2, 1, 0, 1], [0, 1, 0, 1, 0], [2, 1, 2, 1, 2],
  [1, 1, 0, 1, 1], [1, 1, 2, 1, 1], [0, 2, 0, 2, 0], [2, 0, 2, 0, 2], [0, 2, 2, 2, 0],
];
export const BET_LEVELS = [0.2, 0.4, 1, 2, 4, 10, 20, 50, 100];

export type BonusType = "free" | "super" | "storm" | "mega";
export interface Bonus {
  type: BonusType;
  label: string;
  remaining: number;
  total: number;
  mult: number;
  step: number;
  won: number;
  sticky: string[];
}
export function makeBonus(type: BonusType): Bonus {
  const base = { won: 0, sticky: [] as string[] };
  switch (type) {
    case "free": return { ...base, type, label: "Free Spins", remaining: 10, total: 10, mult: 1, step: 1 };
    case "super": return { ...base, type, label: "Super Vault", remaining: 15, total: 15, mult: 2, step: 2 };
    case "storm": return { ...base, type, label: "Wild Storm", remaining: 12, total: 12, mult: 1, step: 1 };
    case "mega": return { ...base, type, label: "Mega Multiplier", remaining: 8, total: 8, mult: 5, step: 3 };
  }
}
export const BONUS_BUY = [
  { id: "free" as const, name: "Free Spins", price: 80, desc: "10 free spins. Multiplier grows +1 with every win." },
  { id: "super" as const, name: "Super Vault", price: 200, desc: "15 spins, sticky & expanding Wilds, x2 start, +2 per win." },
  { id: "mystery" as const, name: "Mystery Vault", price: 120, desc: "Crack the vault for a random surprise bonus variation." },
];

function pick(scatterFactor = 1): SymId {
  const entries = Object.entries(SYMBOLS) as [SymId, (typeof SYMBOLS)[SymId]][];
  const weights = entries.map(([id, s]) => (id === "SCAT" ? s.weight * scatterFactor : s.weight));
  let r = Math.random() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < entries.length; i++) {
    r -= weights[i];
    if (r <= 0) return entries[i][0];
  }
  return "T";
}

export function generateGrid(bonus: Bonus | null): { grid: Grid; sticky: string[] } {
  const grid: Grid = Array.from({ length: 5 }, () => Array.from({ length: 3 }, () => pick(bonus ? 0.6 : 1)));
  let sticky: string[] = [];
  if (bonus?.type === "storm") {
    for (let n = 0; n < 3; n++) grid[Math.floor(Math.random() * 5)][Math.floor(Math.random() * 3)] = "WILD";
  }
  if (bonus?.type === "super") {
    for (const k of bonus.sticky) {
      const [r, row] = k.split("-").map(Number);
      grid[r][row] = "WILD";
    }
    grid.forEach((col, r) => col.forEach((s, row) => s === "WILD" && sticky.push(`${r}-${row}`)));
    sticky = Array.from(new Set(sticky));
    grid.forEach((col, r) => {
      if (col.includes("WILD")) grid[r] = ["WILD", "WILD", "WILD"];
    });
  }
  return { grid, sticky };
}

export interface LineWin { line: number; sym: SymId; count: number; win: number; cells: [number, number][] }
export interface SpinResult { lines: LineWin[]; scatterCount: number; scatterCells: [number, number][]; scatterWin: number; total: number }

export function evaluate(grid: Grid, bet: number, mult = 1): SpinResult {
  const lineBet = bet / PAYLINES.length;
  const lines: LineWin[] = [];
  PAYLINES.forEach((pl, li) => {
    const syms = pl.map((row, r) => grid[r][row]);
    if (syms[0] === "SCAT") return;
    const base = syms.find((s) => s !== "WILD") ?? "WILD";
    if (base === "SCAT") {
      // wilds leading into a scatter: pay as wild line
    }
    const target = base === "SCAT" ? "WILD" : base;
    let count = 0;
    for (const s of syms) {
      if (s === target || s === "WILD") count++;
      else break;
    }
    if (count >= 3) {
      const win = SYMBOLS[target].pays[count - 3] * lineBet * mult;
      lines.push({ line: li, sym: target, count, win, cells: pl.slice(0, count).map((row, r) => [r, row]) });
    }
  });
  const scatterCells: [number, number][] = [];
  grid.forEach((col, r) => col.forEach((s, row) => s === "SCAT" && scatterCells.push([r, row])));
  const scatterCount = scatterCells.length;
  const scatterWin = (SCATTER_PAYS[Math.min(scatterCount, 5)] ?? 0) * bet;
  const total = Math.round((lines.reduce((a, l) => a + l.win, 0) + scatterWin) * 100) / 100;
  return { lines, scatterCount, scatterCells, scatterWin, total };
}

export function winTier(win: number, bet: number): "big" | "mega" | "epic" | null {
  const x = win / bet;
  if (x >= 50) return "epic";
  if (x >= 25) return "mega";
  if (x >= 10) return "big";
  return null;
}
