import { useSyncExternalStore } from "react";

export interface HistoryItem { id: number; time: string; label: string; amount: number; bfg: number }
export interface Notice { id: number; time: string; from: string; text: string }

interface State {
  balance: number;
  totalSpins: number;
  totalWins: number;
  totalWon: number;
  bfg: number;
  messages: number;
  history: HistoryItem[];
  notices: Notice[];
  dailyClaimed: boolean;
}

let id = 1;
const now = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

let state: State = {
  balance: 5000,
  totalSpins: 0,
  totalWins: 0,
  totalWon: 0,
  bfg: 12.5,
  messages: 1284,
  history: [{ id: 0, time: "09:12", label: "Welcome bonus", amount: 5000, bfg: 12.5 }],
  notices: [{ id: 0, time: "09:12", from: "GrimVault Bot", text: "🔓 Welcome to the Vault! 5,000 demo credits loaded." }],
  dailyClaimed: false,
};
const subs = new Set<() => void>();
const set = (p: Partial<State>) => { state = { ...state, ...p }; subs.forEach((f) => f()); };

export const store = {
  get: () => state,
  subscribe: (f: () => void) => { subs.add(f); return () => subs.delete(f); },
  debit(n: number) { set({ balance: Math.round((state.balance - n) * 100) / 100 }); },
  spun() { set({ totalSpins: state.totalSpins + 1 }); },
  win(n: number) {
    set({
      balance: Math.round((state.balance + n) * 100) / 100,
      totalWins: state.totalWins + 1,
      totalWon: Math.round((state.totalWon + n) * 100) / 100,
      bfg: Math.round((state.bfg + n * 0.01) * 1000) / 1000,
    });
  },
  reward(label: string, amount: number, bfg: number) {
    set({
      history: [{ id: id++, time: now(), label, amount, bfg }, ...state.history].slice(0, 40),
      bfg: Math.round((state.bfg + bfg) * 1000) / 1000,
    });
  },
  notify(from: string, text: string) {
    set({ notices: [{ id: id++, time: now(), from, text }, ...state.notices].slice(0, 40) });
  },
  claimDaily() {
    if (state.dailyClaimed) return false;
    set({ dailyClaimed: true, balance: state.balance + 500 });
    store.reward("Daily vault claim", 500, 2);
    store.notify("GrimVault Bot", "🎁 Daily claim: +500 credits & +2 BFG");
    return true;
  },
  topUp() {
    set({ balance: state.balance + 5000 });
    store.notify("GrimVault Bot", "💳 Demo credits refilled: +5,000");
  },
};

export function useStore<T>(sel: (s: State) => T): T {
  return useSyncExternalStore(store.subscribe, () => sel(state), () => sel(state));
}

export const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
