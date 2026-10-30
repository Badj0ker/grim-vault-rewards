import { useCallback, useEffect, useRef, useState } from "react";
import { Minus, Plus, Volume2, VolumeX, Info, RotateCw, Repeat, Sparkles, Zap, Gem, Square } from "lucide-react";
import { toast } from "sonner";
import { SymbolTile } from "./SymbolTile";
import { WinOverlay, BonusIntro, BonusEnd, VaultOpen } from "./Overlays";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  BET_LEVELS, BONUS_BUY, PAYLINES, SYMBOLS, SCATTER_PAYS, evaluate, generateGrid, makeBonus, winTier,
  type Bonus, type Grid, type LineWin, type SymId,
} from "@/lib/slot-engine";
import { sound } from "@/lib/sound";
import { fmt, store, useStore } from "@/lib/store";

const INITIAL: Grid = [
  ["A", "P1", "K"], ["Q", "WILD", "J"], ["P2", "SCAT", "COIN"], ["T", "P3", "A"], ["K", "COIN", "Q"],
];
const STRIPS: SymId[][] = [
  ["A", "P1", "J", "COIN", "Q", "P3", "T", "K", "WILD", "P2"],
  ["K", "P2", "Q", "SCAT", "A", "COIN", "J", "P1", "T", "P3"],
  ["Q", "COIN", "P3", "T", "WILD", "K", "P1", "A", "J", "SCAT"],
  ["J", "P3", "A", "P2", "K", "T", "COIN", "Q", "P1", "WILD"],
  ["T", "SCAT", "K", "P1", "J", "Q", "P2", "A", "COIN", "P3"],
];
const LINE_COLORS = ["var(--gold)", "var(--neon-cyan)", "var(--neon-red)", "var(--neon-purple)", "var(--neon-green)"];

type Overlay =
  | { kind: "win"; tier: "big" | "mega" | "epic"; amount: number }
  | { kind: "intro"; bonus: Bonus }
  | { kind: "end"; label: string; total: number }
  | { kind: "vault" };

export function SlotGame() {
  const balance = useStore((s) => s.balance);
  const [grid, setGrid] = useState<Grid>(INITIAL);
  const [reelSpin, setReelSpin] = useState<boolean[]>([false, false, false, false, false]);
  const [anticip, setAnticip] = useState<boolean[]>([false, false, false, false, false]);
  const [landed, setLanded] = useState(0);
  const [betIdx, setBetIdx] = useState(2);
  const [lines, setLines] = useState<LineWin[]>([]);
  const [winCells, setWinCells] = useState<Set<string>>(new Set());
  const [lineLabel, setLineLabel] = useState(0);
  const [lastWin, setLastWin] = useState(0);
  const [bonus, setBonus] = useState<Bonus | null>(null);
  const [queue, setQueue] = useState<Overlay[]>([]);
  const [auto, setAuto] = useState(0); // remaining autoplay spins, -1 infinite
  const [stopOnBonus, setStopOnBonus] = useState(true);
  const [soundOn, setSoundOn] = useState(true);
  const [fx, setFx] = useState(true);
  const [modal, setModal] = useState<null | "auto" | "info" | "buy">(null);
  const [autoPick, setAutoPick] = useState(25);
  const spinningRef = useRef(false);
  const [spinning, setSpinning] = useState(false);
  const bonusRef = useRef(bonus);
  bonusRef.current = bonus;
  const autoRef = useRef(auto);
  autoRef.current = auto;
  const stopOnBonusRef = useRef(stopOnBonus);
  stopOnBonusRef.current = stopOnBonus;

  const bet = BET_LEVELS[betIdx]!;
  const overlay = queue[0];
  const nextOverlay = useCallback(() => setQueue((q) => q.slice(1)), []);

  const spin = useCallback(async () => {
    if (spinningRef.current) return;
    const b = bonusRef.current;
    if (!b) {
      if (store.get().balance < bet) {
        sound.error();
        toast.error("Not enough credits", { description: "Refill demo credits from your dashboard." });
        setAuto(0);
        return;
      }
      store.debit(bet);
      if (autoRef.current > 0) setAuto((a) => a - 1);
    }
    spinningRef.current = true;
    setSpinning(true);
    setLines([]);
    setWinCells(new Set());
    sound.spin();
    const { grid: target, sticky } = generateGrid(b);
    setReelSpin([true, true, true, true, true]);

    // staggered stops with scatter anticipation
    let t = 0;
    let sc = 0;
    const plan: { at: number; anticip: boolean }[] = [];
    for (let i = 0; i < 5; i++) {
      const ant = sc >= 2;
      t += i === 0 ? 600 : ant ? 1300 : 230;
      plan.push({ at: t, anticip: ant });
      sc += target[i]!.filter((s) => s === "SCAT").length;
    }
    await new Promise<void>((resolve) => {
      plan.forEach((p, i) => {
        setTimeout(() => {
          setGrid((g) => g.map((col, r) => (r === i ? target[i]! : col)));
          setReelSpin((rs) => rs.map((v, r) => (r === i ? false : v)));
          setLanded((n) => n + 1);
          sound.reelStop(i);
          if (target[i]!.includes("SCAT")) sound.scatter();
          const nxt = plan[i + 1];
          setAnticip((a) => a.map((_, r) => (nxt?.anticip ? r === i + 1 : false)));
          if (nxt?.anticip) sound.tension();
          if (i === 4) resolve();
        }, p.at);
      });
    });

    const mult = b ? b.mult : 1;
    const res = evaluate(target, bet, mult);
    store.spun();
    const cells = new Set<string>();
    res.lines.forEach((l) => l.cells.forEach(([r, row]) => cells.add(`${r}-${row}`)));
    if (res.scatterCount >= 3) res.scatterCells.forEach(([r, row]) => cells.add(`${r}-${row}`));
    setLines(res.lines);
    setWinCells(cells);
    setLastWin(res.total);
    if (res.total > 0) {
      store.win(res.total);
      sound.win();
    }

    const q: Overlay[] = [];
    const tier = winTier(res.total, bet);
    if (tier) {
      q.push({ kind: "win", tier, amount: res.total });
      store.reward(`${tier.toUpperCase()} WIN`, res.total, Math.round(res.total * 0.02 * 100) / 100);
      store.notify("GrimVault Bot", `🏆 @you hit a ${tier.toUpperCase()} WIN of ${fmt(res.total)} credits!`);
    }
    let nb: Bonus | null = null;
    if (b) {
      nb = { ...b, remaining: b.remaining - 1, won: b.won + res.total, mult: res.total > 0 ? b.mult + b.step : b.mult, sticky };
      if (res.scatterCount >= 3) {
        nb.remaining += 5;
        nb.total += 5;
        toast.success("Retrigger! +5 spins");
      }
      if (nb.remaining <= 0) {
        q.push({ kind: "end", label: nb.label, total: nb.won });
        store.reward(`${nb.label} bonus`, nb.won, 5);
        store.notify("GrimVault Bot", `💎 ${nb.label} finished: ${fmt(nb.won)} credits + 5 BFG`);
        nb = null;
      }
    } else if (res.scatterCount >= 3) {
      const fb = makeBonus("free");
      q.push({ kind: "intro", bonus: fb });
      store.notify("GrimVault Bot", "🔥 3 Scatters! Free Spins unlocked.");
      if (stopOnBonusRef.current) setAuto(0);
    }
    setBonus(nb);
    setAnticip([false, false, false, false, false]);
    setQueue((old) => [...old, ...q]);
    spinningRef.current = false;
    setSpinning(false);
  }, [bet]);

  const spinRef = useRef(spin);
  spinRef.current = spin;

  // auto-continue for bonus rounds & autoplay
  useEffect(() => {
    if (spinning || overlay) return;
    if (bonus || auto !== 0) {
      const t = setTimeout(() => spinRef.current(), bonus ? 900 : 650);
      return () => clearTimeout(t);
    }
  }, [spinning, overlay, bonus, auto, landed]);

  // cycle payline label
  useEffect(() => {
    if (!lines.length) return;
    const t = setInterval(() => setLineLabel((n) => n + 1), 1300);
    return () => clearInterval(t);
  }, [lines]);

  // keyboard: space to spin
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.code === "Space" && !(e.target instanceof HTMLInputElement) && !modal) {
        e.preventDefault();
        spinRef.current();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [modal]);

  const changeBet = (d: number) => {
    if (spinning || bonus) return;
    sound.click();
    setBetIdx((i) => Math.max(0, Math.min(BET_LEVELS.length - 1, i + d)));
  };

  const buy = (id: "free" | "super" | "mystery") => {
    const opt = BONUS_BUY.find((o) => o.id === id)!;
    const price = opt.price * bet;
    if (balance < price) { sound.error(); toast.error("Not enough credits for this bonus"); return; }
    store.debit(price);
    store.notify("GrimVault Bot", `🛒 Bonus Buy: ${opt.name} for ${fmt(price)} credits`);
    setModal(null);
    setAuto(0);
    setLines([]);
    setWinCells(new Set());
    if (id === "mystery") setQueue([{ kind: "vault" }]);
    else setQueue([{ kind: "intro", bonus: makeBonus(id) }]);
  };

  const sticky = new Set(bonus?.type === "super" ? bonus.sticky : []);
  const busy = spinning || !!overlay || !!bonus;
  const curLine = lines.length ? lines[lineLabel % lines.length] : null;

  return (
    <section className="w-full">
      {/* bonus status bar */}
      <div className="mb-3 grid grid-cols-3 gap-2 text-center">
        <Stat label={bonus ? `${bonus.label}` : "Mode"} value={bonus ? `${bonus.remaining} left` : "Base game"} tone={bonus ? "text-neon-cyan" : "text-foreground"} />
        <Stat label="Multiplier" value={`x${bonus ? bonus.mult : 1}`} tone="text-gold" />
        <Stat label={bonus ? "Bonus win" : "Last win"} value={fmt(bonus ? bonus.won : lastWin)} tone="text-neon-green" />
      </div>

      {/* reels */}
      <div className={`metal-frame relative rounded-2xl p-2 sm:p-3 ${bonus?.type === "super" ? "glow-gold" : ""}`}>
        <div className="reel-window relative overflow-hidden rounded-xl">
          <div className="grid grid-cols-5">
            {grid.map((col, r) => (
              <div key={r} className={`relative aspect-[1/3] overflow-hidden border-r border-border/40 last:border-r-0 ${anticip[r] ? "reel-anticip" : ""}`}>
                {reelSpin[r] ? (
                  <div className={`reel-strip absolute inset-x-0 top-0 ${anticip[r] ? "slow" : ""}`}>
                    {[...STRIPS[r]!, ...STRIPS[r]!].map((s, i) => <SymbolTile key={i} id={s} />)}
                  </div>
                ) : (
                  <div className="landed">
                    {col.map((s, row) => {
                      const k = `${r}-${row}`;
                      const win = winCells.has(k);
                      return (
                        <div key={row} className={win ? "cell-win" : winCells.size ? "cell-dim" : ""}>
                          <SymbolTile id={s} sticky={sticky.has(k)} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
          {lines.length > 0 && (
            <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 500 300" preserveAspectRatio="none">
              {lines.map((l, i) => (
                <polyline key={`${l.line}-${landed}`} className="payline" fill="none" strokeLinecap="round" strokeLinejoin="round"
                  stroke={LINE_COLORS[i % LINE_COLORS.length]} style={{ filter: `drop-shadow(0 0 6px ${LINE_COLORS[i % LINE_COLORS.length]})` }}
                  points={PAYLINES[l.line]!.map((row, r) => `${r * 100 + 50},${row * 100 + 50}`).join(" ")} />
              ))}
            </svg>
          )}
        </div>
        {overlay?.kind === "win" && <WinOverlay tier={overlay.tier} amount={overlay.amount} fx={fx} onDone={nextOverlay} />}
        {overlay?.kind === "intro" && (
          <BonusIntro bonus={overlay.bonus} onStart={() => { setBonus(overlay.bonus); nextOverlay(); }} />
        )}
        {overlay?.kind === "end" && <BonusEnd label={overlay.label} total={overlay.total} onDone={nextOverlay} />}
        {overlay?.kind === "vault" && (
          <VaultOpen onReveal={(b) => setQueue([{ kind: "intro", bonus: b }])} />
        )}
      </div>

      {/* win line ticker */}
      <div className="mt-2 h-7 text-center font-display text-sm sm:text-base">
        {curLine ? (
          <span key={lineLabel} className="slide-in inline-block text-gold">
            Line {curLine.line + 1}: {curLine.count}× {SYMBOLS[curLine.sym].name} pays {fmt(curLine.win)}
          </span>
        ) : spinning ? (
          <span className="text-muted-foreground">Good luck…</span>
        ) : (
          <span className="text-muted-foreground">20 paylines · Space to spin</span>
        )}
      </div>

      {/* controls */}
      <div className="panel mt-2 grid grid-cols-2 items-center gap-3 p-3 sm:grid-cols-[1fr_auto_1fr]">
        <div className="flex min-w-0 items-center gap-2">
          <Button variant="secondary" size="icon" onClick={() => changeBet(-1)} disabled={busy || betIdx === 0} aria-label="Decrease bet"><Minus /></Button>
          <div className="min-w-0 flex-1 text-center">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Bet</div>
            <div className="truncate font-display text-lg text-gold">{fmt(bet)}</div>
          </div>
          <Button variant="secondary" size="icon" onClick={() => changeBet(1)} disabled={busy || betIdx === BET_LEVELS.length - 1} aria-label="Increase bet"><Plus /></Button>
        </div>

        <div className="order-first col-span-2 flex items-center justify-center gap-3 sm:order-none sm:col-span-1">
          <Button variant="outline" className="h-11 font-display" disabled={busy} onClick={() => { sound.click(); setBetIdx(BET_LEVELS.length - 1); toast("Max bet set", { description: `${fmt(BET_LEVELS.at(-1)!)} per spin` }); }}>MAX</Button>
          <button
            onClick={() => { if (auto !== 0) { setAuto(0); return; } spin(); }}
            disabled={(spinning && auto === 0) || !!overlay || (!!bonus && auto === 0)}
            aria-label={auto !== 0 ? "Stop autoplay" : "Spin"}
            className={`relative grid h-20 w-20 place-items-center rounded-full bg-primary text-primary-foreground transition-transform active:scale-90 disabled:opacity-60 glow-red sm:h-24 sm:w-24 ${spinning ? "spinning" : ""}`}
          >
            <span className="spin-ring absolute inset-1 rounded-full border-4 border-dashed border-primary-foreground/40" />
            {auto !== 0 ? (
              <span className="grid place-items-center"><Square className="h-6 w-6" /><span className="text-xs font-display">{auto < 0 ? "∞" : auto}</span></span>
            ) : (
              <RotateCw className="h-9 w-9" />
            )}
          </button>
          <Button variant="outline" className="h-11 font-display" disabled={busy} onClick={() => { sound.click(); setModal("auto"); }}><Repeat /> AUTO</Button>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button className="bg-accent font-display text-accent-foreground hover:bg-accent/80" disabled={busy} onClick={() => { sound.click(); setModal("buy"); }}><Sparkles /> BUY</Button>
          <Button variant="secondary" size="icon" aria-label="Toggle sound" onClick={() => { const v = !soundOn; setSoundOn(v); sound.setEnabled(v); }}>
            {soundOn ? <Volume2 /> : <VolumeX />}
          </Button>
          <Button variant="secondary" size="icon" aria-label="Paytable" onClick={() => { sound.click(); setModal("info"); }}><Info /></Button>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
        <span>Balance <b className="font-display text-foreground">{fmt(balance)}</b></span>
        <label className="flex items-center gap-2">FX <Switch checked={fx} onCheckedChange={setFx} /></label>
      </div>

      {/* Autoplay */}
      <Dialog open={modal === "auto"} onOpenChange={(o) => !o && setModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Autoplay</DialogTitle>
            <DialogDescription>Choose how many spins to run automatically.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-2">
            {[10, 25, 50, 100, 250, -1].map((n) => (
              <Button key={n} variant={autoPick === n ? "default" : "secondary"} className="font-display" onClick={() => { sound.click(); setAutoPick(n); }}>
                {n < 0 ? "∞" : n}
              </Button>
            ))}
          </div>
          <label className="flex items-center justify-between rounded-md bg-muted p-3 text-sm">Stop when a bonus triggers <Switch checked={stopOnBonus} onCheckedChange={setStopOnBonus} /></label>
          <Button size="lg" className="font-display" onClick={() => { setModal(null); setAuto(autoPick); }}>START {autoPick < 0 ? "∞" : autoPick} SPINS</Button>
        </DialogContent>
      </Dialog>

      {/* Bonus buy */}
      <Dialog open={modal === "buy"} onOpenChange={(o) => !o && setModal(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">Bonus Buy</DialogTitle>
            <DialogDescription>Demo pricing at your current bet of {fmt(bet)}.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-3">
            {BONUS_BUY.map((o, i) => {
              const Icon = [Zap, Gem, Sparkles][i]!;
              const price = o.price * bet;
              return (
                <div key={o.id} className="panel flex flex-col gap-2 p-4 text-center">
                  <Icon className={`mx-auto h-10 w-10 ${["text-neon-cyan", "text-gold", "text-neon-purple"][i]}`} />
                  <div className="font-display text-lg">{o.name}</div>
                  <p className="flex-1 text-sm text-muted-foreground">{o.desc}</p>
                  <div className="font-display text-gold">{fmt(price)}</div>
                  <Button onClick={() => buy(o.id)} disabled={balance < price} className="font-display">BUY</Button>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Paytable */}
      <Dialog open={modal === "info"} onOpenChange={(o) => !o && setModal(null)}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Paytable & Rules</DialogTitle>
            <DialogDescription>Pays shown for your current bet ({fmt(bet)}). Demo only — simulated outcomes, no real value.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {(Object.keys(SYMBOLS) as SymId[]).filter((s) => s !== "SCAT").map((s) => (
              <div key={s} className="panel flex items-center gap-2 p-2">
                <div className="w-14 shrink-0"><SymbolTile id={s} /></div>
                <div className="min-w-0 text-xs">
                  <div className="truncate font-display text-sm">{SYMBOLS[s].name}</div>
                  {[5, 4, 3].map((n) => (
                    <div key={n}>{n}× <b className="text-gold">{fmt(SYMBOLS[s].pays[n - 3]! * bet / 20)}</b></div>
                  ))}
                </div>
              </div>
            ))}
            <div className="panel flex items-center gap-2 p-2">
              <div className="w-14 shrink-0"><SymbolTile id="SCAT" /></div>
              <div className="text-xs">
                <div className="font-display text-sm">Scatter</div>
                {[5, 4, 3].map((n) => <div key={n}>{n}× <b className="text-gold">{fmt(SCATTER_PAYS[n]! * bet)}</b></div>)}
              </div>
            </div>
          </div>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>WILD substitutes for all symbols except SCATTER.</li>
            <li>3+ SCATTERS anywhere trigger 10 Free Spins; multiplier rises +1 per win. 3 more during the bonus add +5 spins.</li>
            <li>Super Vault: 15 spins, Wilds stick and expand to the full reel, x2 start, +2 per win.</li>
            <li>Mystery Vault: reveals Super Vault, Wild Storm, Mega Multiplier or Free Spins.</li>
            <li>Wins pay left to right on 20 lines. Highest win per line only.</li>
          </ul>
          <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
            {PAYLINES.map((pl, i) => (
              <div key={i} className="rounded bg-muted p-1">
                <div className="text-center text-[10px] text-muted-foreground">{i + 1}</div>
                <div className="grid grid-cols-5 gap-px">
                  {[0, 1, 2].flatMap((row) => pl.map((pr, r) => <span key={`${row}-${r}`} className={`aspect-square rounded-[1px] ${pr === row ? "bg-primary" : "bg-background"}`} />))}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="panel min-w-0 px-2 py-1.5">
      <div className="truncate text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`truncate font-display text-sm sm:text-lg ${tone}`}>{value}</div>
    </div>
  );
}
