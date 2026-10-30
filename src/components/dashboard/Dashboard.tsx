import { useEffect, useState } from "react";
import { Bell, Crown, Gift, MessageCircle, Trophy, Coins, RotateCw, Wallet } from "lucide-react";
import { toast } from "sonner";
import p1 from "@/assets/P1.jpg.asset.json";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { fmt, store, useStore } from "@/lib/store";
import { sound } from "@/lib/sound";

const WEEKLY = [
  { name: "@VaultKing", won: 48210, reward: "500 BFG" },
  { name: "@FuryQueen", won: 39120, reward: "300 BFG" },
  { name: "@CryptoRaccoon", won: 31555, reward: "200 BFG" },
  { name: "@NeonNinja", won: 22040, reward: "100 BFG" },
  { name: "@GrimReaper", won: 18300, reward: "50 BFG" },
  { name: "@SpinLord", won: 12775, reward: "25 BFG" },
  { name: "@MoonBag", won: 8420, reward: "10 BFG" },
];
const MONTHLY = [
  { name: "@FuryQueen", won: 212400, reward: "2,500 BFG" },
  { name: "@VaultKing", won: 198760, reward: "1,500 BFG" },
  { name: "@WhaleWatcher", won: 154300, reward: "1,000 BFG" },
  { name: "@NeonNinja", won: 97200, reward: "500 BFG" },
  { name: "@DiamondPaws", won: 81050, reward: "250 BFG" },
  { name: "@CryptoRaccoon", won: 66900, reward: "100 BFG" },
  { name: "@SpinLord", won: 40110, reward: "50 BFG" },
];
const CHATTER: [string, string][] = [
  ["@VaultKing", "just cracked a Mystery Vault 🔓"],
  ["@FuryQueen", "x14 multiplier in Free Spins 😱"],
  ["GrimVault Bot", "⚡ Weekly leaderboard resets in 2 days"],
  ["@NeonNinja", "who else is grinding the Super Vault?"],
  ["@CryptoRaccoon", "landed 5 Wilds on line 1 🦝"],
  ["GrimVault Bot", "📢 Community raid starts at 20:00 UTC — bonus BFG for participants"],
  ["@MoonBag", "EPIC WIN 🚀🚀"],
];

export function Dashboard() {
  const s = useStore((x) => x);
  const level = Math.floor(s.totalSpins / 25) + 7;
  const xp = ((s.totalSpins % 25) / 25) * 100;
  const rank = level >= 12 ? "Vault Master" : level >= 9 ? "Gold Raider" : "Silver Fury";

  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      const [from, text] = CHATTER[i++ % CHATTER.length]!;
      store.notify(from, text);
    }, 14000);
    return () => clearInterval(t);
  }, []);

  return (
    <aside className="panel w-full p-3 sm:p-4">
      {/* profile */}
      <div className="flex min-w-0 items-center gap-3">
        <img src={p1.url} alt="Your Telegram avatar" className="h-14 w-14 shrink-0 rounded-full border-2 border-gold object-cover glow-gold" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate font-display text-lg">@GezaFury</span>
            <Crown className="h-4 w-4 shrink-0 text-gold" />
          </div>
          <div className="text-xs text-muted-foreground">{rank} · Lv {level} · <MessageCircle className="inline h-3 w-3" /> {s.messages.toLocaleString()} msgs</div>
          <Progress value={xp} className="mt-1 h-1.5" />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Tile icon={Wallet} label="Credits" value={fmt(s.balance)} tone="text-foreground" />
        <Tile icon={Coins} label="BFG earned" value={s.bfg.toFixed(2)} tone="text-gold" />
        <Tile icon={RotateCw} label="Total spins" value={s.totalSpins.toLocaleString()} tone="text-neon-cyan" />
        <Tile icon={Trophy} label="Total wins" value={`${s.totalWins} · ${fmt(s.totalWon)}`} tone="text-neon-green" />
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Button className="font-display" disabled={s.dailyClaimed} onClick={() => { if (store.claimDaily()) { sound.bonus(); toast.success("Daily reward claimed", { description: "+500 credits · +2 BFG" }); } }}>
          <Gift /> {s.dailyClaimed ? "Claimed" : "Daily claim"}
        </Button>
        <Button variant="secondary" className="font-display" onClick={() => { store.topUp(); sound.click(); toast("Demo credits refilled"); }}>Refill demo</Button>
      </div>

      <Tabs defaultValue="board" className="mt-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="board">Leaderboard</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
          <TabsTrigger value="feed"><Bell className="mr-1 h-3.5 w-3.5" />Feed</TabsTrigger>
        </TabsList>
        <TabsContent value="board"><Leaderboard you={s.totalWon} /></TabsContent>
        <TabsContent value="rewards">
          <ul className="max-h-80 space-y-1.5 overflow-y-auto pr-1">
            {s.history.map((h) => (
              <li key={h.id} className="slide-in flex items-center justify-between gap-2 rounded-md bg-muted px-3 py-2 text-sm">
                <div className="min-w-0"><div className="truncate font-semibold">{h.label}</div><div className="text-xs text-muted-foreground">{h.time}</div></div>
                <div className="shrink-0 text-right"><div className="font-display text-neon-green">+{fmt(h.amount)}</div><div className="text-xs text-gold">+{h.bfg} BFG</div></div>
              </li>
            ))}
          </ul>
        </TabsContent>
        <TabsContent value="feed">
          <ul className="max-h-80 space-y-1.5 overflow-y-auto pr-1">
            {s.notices.map((n) => (
              <li key={n.id} className="slide-in rounded-lg rounded-tl-none border-l-2 border-neon-cyan bg-muted px-3 py-2 text-sm">
                <div className="flex justify-between gap-2 text-xs"><b className="truncate text-neon-cyan">{n.from}</b><span className="shrink-0 text-muted-foreground">{n.time}</span></div>
                <div>{n.text}</div>
              </li>
            ))}
          </ul>
        </TabsContent>
      </Tabs>
    </aside>
  );
}

function Leaderboard({ you }: { you: number }) {
  const [period, setPeriod] = useState<"weekly" | "monthly">("weekly");
  const rows = [...(period === "weekly" ? WEEKLY : MONTHLY), { name: "@GezaFury (you)", won: you, reward: "—", me: true }].sort((a, b) => b.won - a.won);
  return (
    <div>
      <div className="mb-2 flex gap-2">
        {(["weekly", "monthly"] as const).map((p) => (
          <Button key={p} size="sm" variant={period === p ? "default" : "secondary"} className="flex-1 capitalize" onClick={() => { sound.click(); setPeriod(p); }}>{p}</Button>
        ))}
      </div>
      <ol className="space-y-1">
        {rows.map((r, i) => (
          <li key={r.name} className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm ${"me" in r ? "border border-primary bg-primary/15" : "bg-muted"}`}>
            <span className={`w-6 shrink-0 text-center font-display ${i === 0 ? "text-gold" : i === 1 ? "text-foreground" : i === 2 ? "text-gold-deep" : "text-muted-foreground"}`}>{i + 1}</span>
            <span className="min-w-0 flex-1 truncate">{r.name}</span>
            <span className="shrink-0 font-display text-xs">{fmt(r.won)}</span>
            <span className="w-16 shrink-0 text-right text-xs text-gold">{r.reward}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Tile({ icon: Icon, label, value, tone }: { icon: typeof Coins; label: string; value: string; tone: string }) {
  return (
    <div className="min-w-0 rounded-lg bg-muted p-2">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted-foreground"><Icon className="h-3 w-3" />{label}</div>
      <div className={`truncate font-display ${tone}`}>{value}</div>
    </div>
  );
}
