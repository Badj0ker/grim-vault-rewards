import { useEffect, useMemo, useState } from "react";
import { fmt } from "@/lib/store";
import { sound } from "@/lib/sound";
import { makeBonus, type Bonus, type BonusType } from "@/lib/slot-engine";
import { Button } from "@/components/ui/button";
import p4 from "@/assets/P4.jpg.asset.json";
import scatter from "@/assets/scatter.jpg.asset.json";

function Coins({ n = 40 }: { n?: number }) {
  const coins = useMemo(
    () => Array.from({ length: n }, () => ({ left: Math.random() * 100, delay: Math.random() * 2, dur: 1.8 + Math.random() * 2, s: 0.6 + Math.random() * 0.8 })),
    [n],
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {coins.map((c, i) => (
        <span key={i} className="coin-particle" style={{ left: `${c.left}%`, animationDelay: `${c.delay}s`, animationDuration: `${c.dur}s`, scale: String(c.s) }} />
      ))}
    </div>
  );
}

function Shell({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <div className="absolute inset-0 z-30 grid place-items-center overflow-hidden rounded-2xl bg-carbon/85 backdrop-blur-sm" onClick={onClick}>
      <div className="rays absolute -inset-1/2 opacity-60" />
      {children}
    </div>
  );
}

export function WinOverlay({ tier, amount, fx, onDone }: { tier: "big" | "mega" | "epic"; amount: number; fx: boolean; onDone: () => void }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    sound.bigWin();
    const dur = tier === "epic" ? 3200 : tier === "mega" ? 2600 : 2000;
    const start = performance.now();
    let raf = 0;
    let last = 0;
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setShown(amount * (1 - Math.pow(1 - p, 3)));
      if (t - last > 70) { sound.tick(); last = t; }
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    const close = setTimeout(onDone, dur + 1800);
    return () => { cancelAnimationFrame(raf); clearTimeout(close); };
  }, [tier, amount, onDone]);
  const title = { big: "BIG WIN", mega: "MEGA WIN", epic: "EPIC WIN" }[tier];
  return (
    <Shell onClick={onDone}>
      {fx && <Coins n={tier === "epic" ? 80 : tier === "mega" ? 55 : 35} />}
      <div className="relative text-center pop-in">
        <div className="shimmer-text font-display text-5xl sm:text-7xl drop-shadow-lg">{title}</div>
        <div className="mt-3 font-display text-4xl text-gold-grad sm:text-6xl tabular-nums">{fmt(shown)}</div>
        <div className="mt-4 text-sm uppercase tracking-widest text-muted-foreground">tap to continue</div>
      </div>
    </Shell>
  );
}

export function BonusIntro({ bonus, onStart }: { bonus: Bonus; onStart: () => void }) {
  useEffect(() => sound.bonus(), []);
  const detail: Record<BonusType, string> = {
    free: "Multiplier grows +1 with every winning spin",
    super: "Sticky & expanding Wilds · x2 start · +2 per win",
    storm: "3 extra Wilds crash onto the reels every spin",
    mega: "Starts at x5 · +3 multiplier per win",
  };
  return (
    <Shell>
      <div className="relative flex flex-col items-center gap-3 px-6 text-center pop-in">
        <img src={bonus.type === "super" ? p4.url : scatter.url} alt="" className="h-24 w-24 rounded-full border-4 border-gold object-cover glow-gold sm:h-32 sm:w-32" />
        <div className="font-display text-2xl text-neon-cyan sm:text-3xl">{bonus.label.toUpperCase()}</div>
        <div className="shimmer-text font-display text-5xl sm:text-6xl">{bonus.total} SPINS</div>
        <p className="max-w-xs text-muted-foreground">{detail[bonus.type]}</p>
        <Button size="lg" className="mt-2 font-display text-lg glow-red" onClick={onStart}>START BONUS</Button>
      </div>
    </Shell>
  );
}

export function BonusEnd({ label, total, onDone }: { label: string; total: number; onDone: () => void }) {
  useEffect(() => sound.bigWin(), []);
  return (
    <Shell>
      <Coins n={40} />
      <div className="relative text-center pop-in">
        <div className="font-display text-xl text-neon-cyan">{label} complete</div>
        <div className="mt-2 text-muted-foreground">Total bonus win</div>
        <div className="shimmer-text mt-1 font-display text-5xl sm:text-6xl">{fmt(total)}</div>
        <Button size="lg" className="mt-6 font-display" onClick={onDone}>COLLECT</Button>
      </div>
    </Shell>
  );
}

export function VaultOpen({ onReveal }: { onReveal: (b: Bonus) => void }) {
  const variant = useMemo<BonusType>(() => (["super", "storm", "mega", "free"] as BonusType[])[Math.floor(Math.random() * 4)]!, []);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    sound.vault();
    const t = setTimeout(() => setOpen(true), 2300);
    return () => clearTimeout(t);
  }, []);
  const b = makeBonus(variant);
  return (
    <div className="absolute inset-0 z-30 overflow-hidden rounded-2xl bg-carbon">
      <div className="absolute inset-0 grid place-items-center">
        <div className={`text-center transition-all duration-700 ${open ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}>
          <div className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Mystery revealed</div>
          <div className="shimmer-text font-display text-4xl sm:text-6xl">{b.label.toUpperCase()}</div>
          <div className="mt-1 font-display text-xl text-neon-cyan">{b.total} spins · x{b.mult} start</div>
          {open && <Button size="lg" className="mt-5 font-display glow-red" onClick={() => onReveal(b)}>ENTER THE VAULT</Button>}
        </div>
      </div>
      {(["l", "r"] as const).map((s) => (
        <div key={s} className={`metal-frame absolute top-0 h-full w-1/2 ${s === "l" ? "door-l left-0" : "door-r right-0"} grid place-items-center`}>
          <div className={`absolute top-1/2 h-40 w-40 -translate-y-1/2 sm:h-56 sm:w-56 ${s === "l" ? "-right-20 sm:-right-28" : "-left-20 sm:-left-28"}`}>
            <div className="vault-wheel h-full w-full rounded-full border-8 border-gold-deep" style={{ background: "repeating-conic-gradient(var(--gold-deep) 0 8deg, var(--carbon) 8deg 45deg)" }} />
          </div>
        </div>
      ))}
    </div>
  );
}
