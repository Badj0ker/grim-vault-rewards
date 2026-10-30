import p1 from "@/assets/P1.jpg.asset.json";
import p2 from "@/assets/P2.jpg.asset.json";
import p3 from "@/assets/P3.jpg.asset.json";
import p4 from "@/assets/P4.jpg.asset.json";
import scatter from "@/assets/scatter.jpg.asset.json";
import type { SymId } from "@/lib/slot-engine";

const ROYAL: Partial<Record<SymId, { t: string; c: string }>> = {
  A: { t: "A", c: "var(--neon-red)" },
  K: { t: "K", c: "var(--neon-purple)" },
  Q: { t: "Q", c: "var(--neon-cyan)" },
  J: { t: "J", c: "var(--gold)" },
  T: { t: "10", c: "var(--neon-green)" },
};

export function SymbolTile({ id, sticky }: { id: SymId; sticky?: boolean }) {
  const royal = ROYAL[id];
  return (
    <div className="relative aspect-square w-full select-none">
      {royal && (
        <div className="absolute inset-0 grid place-items-center">
          <span className="royal" style={{ ["--c" as string]: royal.c }}>{royal.t}</span>
        </div>
      )}
      {id === "P1" && <Img cls="frame-gold" src={p1.url} alt="VIP glasses character" badge="VIP" badgeCls="bg-gold text-carbon" />}
      {id === "P2" && <Img cls="frame-neon" src={p2.url} alt="Airpods character" />}
      {id === "P3" && <Img cls="frame-cyan" src={p3.url} alt="Sunglasses character" />}
      {id === "WILD" && (
        <>
          <Img cls="frame-wild" src={p4.url} alt="Fury raccoon wild" />
          <span className="sym-badge bg-primary text-primary-foreground glow-red">WILD</span>
        </>
      )}
      {id === "SCAT" && (
        <>
          <div className="absolute inset-[4%] rounded-full" style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--neon-purple) 55%, transparent), transparent 70%)" }} />
          <div className="scatter-img absolute inset-[6%] overflow-hidden rounded-full"><img src={scatter.url} alt="Fury scatter mascot" className="h-full w-full object-cover" style={{ transform: "scale(2.3)", transformOrigin: "50% 36%" }} draggable={false} /></div>
          <span className="sym-badge bg-accent text-accent-foreground" style={{ boxShadow: "0 0 14px var(--neon-purple)" }}>SCATTER</span>
        </>
      )}
      {id === "COIN" && (
        <div className="coin">
          <div className="grid place-items-center leading-none">
            <span className="text-[clamp(8px,1.6vw,14px)] text-carbon">◆</span>
            <span className="font-display text-[clamp(10px,2.2vw,20px)] text-carbon">BFG</span>
          </div>
        </div>
      )}
      {sticky && <div className="pointer-events-none absolute inset-[3%] rounded-xl border-2 border-gold glow-gold" />}
    </div>
  );
}

function Img({ cls, src, alt, badge, badgeCls }: { cls: string; src: string; alt: string; badge?: string; badgeCls?: string }) {
  return (
    <>
      <div className={`sym-frame ${cls}`}>
        <img src={src} alt={alt} draggable={false} loading="eager" />
      </div>
      {badge && <span className={`sym-badge ${badgeCls}`}>{badge}</span>}
    </>
  );
}
