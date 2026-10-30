<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture
- Frontend-only demo: all slot outcomes come from the mock engine in `src/lib/slot-engine.ts`; never add real-money, RTP math or payouts.
- Shared demo stats/feed live in the tiny external store `src/lib/store.ts` so the slot and dashboard stay in sync without a backend.
- Sounds are synthesized with Web Audio in `src/lib/sound.ts` (no audio files).
