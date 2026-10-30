import { createFileRoute } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { SlotGame } from "@/components/slot/SlotGame";
import { Dashboard } from "@/components/dashboard/Dashboard";
import p4 from "@/assets/P4.jpg.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Grim Vault — Unlock the Fortune" },
      { name: "description", content: "Grim Vault: a 5x3 demo slot for the Telegram community with Free Spins, Super Vault and Mystery Vault bonuses." },
      { property: "og:title", content: "Grim Vault — Unlock the Fortune" },
      { property: "og:description", content: "Spin the Fury reels, crack the vault and climb the community leaderboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="mx-auto min-h-screen max-w-7xl px-3 pb-10 sm:px-6">
      <header className="flex items-center gap-3 py-4">
        <img src={p4.url} alt="Grim Vault emblem" className="h-11 w-11 shrink-0 rounded-full border-2 border-primary object-cover glow-red" />
        <div className="min-w-0">
          <h1 className="truncate font-display text-2xl leading-none sm:text-3xl"><span className="text-gold-grad">GRIM</span> <span className="text-primary">VAULT</span></h1>
          <p className="text-xs uppercase tracking-[0.3em] text-neon-cyan">Unlock the Fortune</p>
        </div>
        <span className="ml-auto shrink-0 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">Demo · no real value</span>
      </header>
      <main className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <SlotGame />
        <Dashboard />
      </main>
      <Toaster theme="dark" position="top-center" />
    </div>
  );
}
