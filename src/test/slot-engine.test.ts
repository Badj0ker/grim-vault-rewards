import { describe, expect, it } from "vitest";
import { evaluate, makeBonus, winTier, type Grid } from "@/lib/slot-engine";

const fill = (s: any): Grid => Array.from({ length: 5 }, () => [s, s, s]);

describe("slot engine", () => {
  it("3 scatters pay 2x total bet", () => {
    const g: Grid = [["SCAT","A","K"],["Q","SCAT","J"],["T","K","SCAT"],["A","J","Q"],["K","Q","J"]];
    expect(evaluate(g, 10).scatterWin).toBe(20);
  });
  it("wild substitutes on a line", () => {
    const g: Grid = [["J","A","J"],["Q","WILD","Q"],["T","A","T"],["K","J","K"],["Q","K","Q"]];
    const r = evaluate(g, 20);
    expect(r.lines.find((l) => l.line === 0)?.count).toBe(3);
  });
  it("free spins give 10 spins, super vault 15", () => {
    expect(makeBonus("free").total).toBe(10);
    expect(makeBonus("super").total).toBe(15);
  });
  it("win tiers at 10x / 25x / 50x", () => {
    expect(winTier(10, 1)).toBe("big");
    expect(winTier(25, 1)).toBe("mega");
    expect(winTier(50, 1)).toBe("epic");
    expect(winTier(9, 1)).toBe(null);
  });
  it("multiplier applies to line wins", () => {
    expect(evaluate(fill("T"), 20, 3).total).toBe(evaluate(fill("T"), 20, 1).total * 3);
  });
});
