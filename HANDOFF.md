# kids-games — Project Handoff

Last updated: 2026-07-08

## What this is

A hub of simple browser games for kids, built on Cloudflare Workers. Games so
far: **เกมส์ไพ่จับคู่** (memory match) and **Amaze Arrow** (arrow-sliding
puzzle), each with 3 difficulty modes and a shared online scoreboard, plus a
combined scores dashboard at `/scores`.

- **Live**: https://kids-games.nupark.workers.dev
- **Repo**: https://github.com/moborarl/games (branch `main`)
- **Cloudflare account**: `Nupark@outlook.com's Account` (account id
  `8348466e6a71f16898dfeb2ab7cb7eaf`)
- **Worker name**: `kids-games`
- **D1 database**: `kids-games-db` (uuid `135c3732-d80a-4129-add5-627719858c57`)

Sibling project in the same parent folder (`D:\Session limit\kids-tutor`) uses
the identical stack/conventions — worth checking there if you need a pattern
for something not yet done here (e.g. parent/child auth, R2 uploads).

## Stack

- **Cloudflare Workers** (single worker, not Pages) serving both the API and
  the built SPA via the `ASSETS` binding.
- **Hono** for the worker-side router (`worker/`).
- **React 18 + react-router-dom** for the frontend SPA (`src/`), built with
  Vite 6 and `@cloudflare/vite-plugin` (this plugin is what makes `vite build`
  emit both the client bundle and a worker-compatible SSR bundle in one go,
  and what makes `npm run dev` proxy `/api/*` to the local worker).
- **D1** (SQLite) for the scoreboard. No KV/R2 used in this project.
- **TypeScript**, strict, project-referenced (`tsconfig.json` →
  `tsconfig.app.json` for `src/`, `tsconfig.worker.json` for `worker/`).
- Shared types between frontend and worker live in `shared/types.ts`
  (imported via the `@shared/*` path alias in both tsconfigs and
  `vite.config.ts`).

## Repo map

```
index.html                       Vite entry HTML (Google Fonts: Mali + Noto Sans Thai)
src/
  main.tsx                       React root, mounts <App/> in BrowserRouter
  App.tsx                        Routes: "/", /games/memory-match, /games/amaze-arrow, /scores
  styles.css                     All CSS, single global stylesheet (design tokens in :root)
  lib/
    format.ts                    formatTime (m:ss.mmm)
    modes.ts                     GameMode type, MODE_ORDER/MODE_META, MAX_RANKS=10
    playerName.ts                remembered player name (localStorage)
    sound.ts                     Web Audio synthesized SFX + mute preference
  components/
    Scoreboard.tsx               top-10 table for any game slug + mode tabs
    TimerDisplay.tsx             self-ticking 30ms clock (isolates re-renders)
  pages/
    Home.tsx                     Game hub tiles
    MemoryMatchPage.tsx          Page shell + mute toggle
    AmazeArrowPage.tsx           Page shell + mute toggle
    ScoresPage.tsx               /scores dashboard: all games, all modes
  games/memoryMatch/
    config.ts                    MODE_CONFIGS + CARD_SYMBOLS (emoji + pastel bg)
    MemoryMatchGame.tsx          Game state machine + rendering
  games/amazeArrow/
    config.ts                    ARROW_MODE_CONFIGS (board size, pieces, hearts), CELL=40
    generator.ts                 reverse-construction board generator (always solvable)
    AmazeArrowGame.tsx           SVG board, tap→slide/bounce animation, hearts, win/lose
worker/
  index.ts                       Hono app entry, mounts routes, falls back to ASSETS
  env.ts                         Env bindings type (DB: D1Database, ASSETS: Fetcher)
  routes/scores.ts                GET/POST /api/scores (limit hard-capped at 10)
shared/types.ts                  MemoryMatchMode, ScoreRecord, payload/response types
db/migrations/0001_init.sql      `scores` table
wrangler.jsonc                   Worker + D1 binding config
.github/workflows/deploy.yml     CI: build + migrate + deploy on push to main
dev.cmd                          Windows dev launcher (sets PATH, runs `npm run dev`)
```

## Amaze Arrow design notes

- **Mechanic**: tap an arrow piece → it slides along its own polyline shape
  (train-style) in the head's direction; clear path → exits the board,
  blocked by another piece → bounces back (and costs a heart on
  medium/hard). Clear all pieces to win. Easy has no hearts (can't lose).
- **Modes** (`games/amazeArrow/config.ts`): easy 12×9 / 16 pieces / ~20%
  snakes len 3-4; medium 15×12 / 42 pieces / ~40% snakes len 4-7 / 3
  hearts; hard 20×15 / 66 pieces / ~45% snakes len 5-10 / 3 hearts.
- **Generator guarantees solvability** by reverse construction: each new
  piece's exit ray must avoid all previously placed pieces, so tapping in
  reverse placement order (descending `id`) always solves the board. Useful
  for testing: `g[data-pid]` elements, tap descending pid.
- **Difficulty comes from a dependency bias**: among valid placements the
  generator samples ~14 candidates and picks the one whose body blocks the
  most existing pieces' exit rays, so most pieces can't exit until others
  clear (on medium, ~half the board starts blocked). Tune difficulty via
  piece counts/snake ratios in config, or the candidate count in
  `generator.ts` (more candidates = more forced ordering).
- **Animation is setTimeout-driven for game state; rAF only draws.** This
  matters: in throttled/background tabs rAF may never fire, and an earlier
  version locked up because piece removal happened in the rAF callback.
  Don't move game-state changes back into rAF.
- Scores post to the same `/api/scores` with `game: 'amaze-arrow'`;
  `moves` = total taps (server requires moves > 0, which taps always is).

## Data model

`scores` table (see `db/migrations/0001_init.sql`):

```sql
CREATE TABLE scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game TEXT NOT NULL DEFAULT 'memory-match',
  mode TEXT NOT NULL CHECK (mode IN ('easy', 'medium', 'hard')),
  player_name TEXT NOT NULL,
  time_ms INTEGER NOT NULL,
  moves INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_scores_leaderboard ON scores (game, mode, time_ms);
```

`game` is already a column so future games can share this same table —
just pick a new `game` slug and reuse `worker/routes/scores.ts` as-is if the
shape fits (mode/time/moves), or add a new table + route if it doesn't.

## API

- `GET /api/scores?game=memory-match&mode=easy&limit=10` → top N by
  `time_ms` ascending (fastest first), then `moves` ascending as tiebreak.
- `POST /api/scores` body `{ game, mode, playerName, timeMs, moves }` →
  inserts and returns `{ score, rank }`. Server-side validation: mode must be
  one of easy/medium/hard, playerName trimmed to 20 chars, timeMs/moves must
  be positive finite numbers within sane bounds. **No auth, no rate
  limiting** — anyone can POST arbitrary scores. Fine for a family/friends
  scoreboard; would need hardening (e.g. a shared secret, or requiring the
  game to have actually run server-side) before wider public exposure.

## Game design notes (memory match)

- **Modes** (`config.ts`): easy = 6 pairs / 4 cols, medium = 8 pairs / 4
  cols, hard = 12 pairs / 6 cols. Row count is computed in
  `MemoryMatchGame.tsx` as `Math.ceil(cards.length / columns)` and both
  `gridTemplateColumns`/`gridTemplateRows` are set inline so cards fill the
  available space exactly (no page scroll — see layout notes below).
- **Card symbols**: `CARD_SYMBOLS` in `config.ts` is a curated list of
  `{ emoji, bg }` pairs spanning animals/nature/sports/food/objects, each
  with its own pastel tile color — deliberately not just animal faces.
  Deck is `CARD_SYMBOLS.slice(0, pairs)` doubled and shuffled. If you add a
  4th mode or push pair counts above 24, extend this array first.
- **Card visual**: face-down side (`.card-front`) is a flat diagonal-stripe
  pattern (`repeating-linear-gradient`) with a star, no gradient "shine".
  Face-up side (`.card-back`) is the per-symbol pastel `bg` color with the
  emoji sized via **CSS container queries** (`container-type: size` on
  `.memory-card`, font-size in `cqmin`) so the icon scales correctly with
  card size across all three modes/columns without JS measuring.
- **Timing constants** (in `MemoryMatchGame.tsx`): flip CSS transition
  0.25s (`.card-face` in `styles.css`), match-reveal pause 200ms,
  mismatch-reveal pause 650ms. Timer ticks every 30ms via `setInterval` for
  millisecond-precision display; `formatTime()` in `Scoreboard.tsx` renders
  `m:ss.mmm`.
- **Sound**: `sound.ts` synthesizes short tones via the Web Audio API
  (oscillator + gain envelope) — no audio asset files, so nothing to host
  or license. `playFlip/playMatch/playMismatch/playWin` are called from
  `MemoryMatchGame.tsx`. Mute state is a module-level variable in
  `sound.ts`, toggled from `MemoryMatchPage.tsx`'s header button and
  persisted to `localStorage` under `kids-games-sound-muted`. If you add a
  second game that also needs sound, consider whether the mute preference
  should be shared (currently it's scoped to this one sound module, which
  in practice is global since it's a singleton — that's probably fine, but
  worth deciding explicitly).
- **No-scroll iPad layout**: `html, body, #root` are pinned to
  `height: 100%; overflow: hidden` in `styles.css`. Both `.home` and
  `.game-page` are `height: 100dvh` flex columns. Inside the game, only
  `.scoreboard-body` (the score list) scrolls internally as a safety net —
  everything else is sized to fit. Verified at both 1024×768 and 768×1024
  (iPad landscape/portrait) with no page-level scrollbar, including hard
  mode's 24-card grid and the win modal.
- **Known-fixed bug**: `.mode-easy/.mode-medium/.mode-hard` background
  classes used to be unscoped and were shared between the difficulty-select
  buttons (`.mode-card`) and the in-game card grid container, causing the
  grid's gap color to bleed through as solid green/blue/red. Now scoped to
  `.mode-card.mode-easy` etc., and the card grid no longer carries a
  `mode-*` class at all. If you ever see stray background color in a grid
  gap again, check for this same unscoped-class pattern.

## Local development

```powershell
cd "D:\Session limit\kids-games"
npm install                              # first time only
npx wrangler d1 migrations apply DB --local   # first time only, sets up local D1
npm run dev                               # or: dev.cmd (sets PATH first on this machine)
```

Dev server runs on port **5174** (kids-tutor, the sibling project, uses
5173 — see `vite.config.ts`'s `server.port` and
`D:\Session limit\.claude\launch.json`).

`npm run typecheck` → `tsc -b` for both app and worker tsconfigs.

## Deploying

Manual (what's been done so far every time):

```powershell
npm run build
npx wrangler deploy
# if db/migrations/ changed:
npx wrangler d1 migrations apply DB --remote
```

Wrangler is already authenticated locally via OAuth (`npx wrangler whoami`
confirms account `Nupark@outlook.com`), so `wrangler deploy` just works from
this machine without extra setup.

**GitHub Actions** (`.github/workflows/deploy.yml`) is wired up to build +
migrate + deploy on every push to `main`, but **it will not run
successfully yet** — it needs two repo secrets added at
github.com/moborarl/games → Settings → Secrets and variables → Actions:

- `CLOUDFLARE_ACCOUNT_ID` = `8348466e6a71f16898dfeb2ab7cb7eaf`
- `CLOUDFLARE_API_TOKEN` = a token created at
  https://dash.cloudflare.com/profile/api-tokens using the **"Edit
  Cloudflare Workers"** template (needs Workers Scripts + D1 write access)

Until those secrets exist, keep deploying manually from a machine with
`wrangler` logged in.

## Open items / ideas not yet done

- Home page has two disabled placeholder tiles ("ต่อจิ๊กซอว์", "เกมส์เลข")
  for future games — not implemented.
- No abuse protection on score submission (see API section above).
- Only one sound "pack" (synthesized tones) — if kids find it annoying, an
  easy upgrade path is swapping the oscillator calls in `sound.ts` for
  `<audio>` playback of real SFX files without changing the call sites.
- No automated tests. Verification so far has been manual: `tsc -b`,
  `vite build`, and manual play-throughs via the browser preview tool
  (full game completions, scoreboard round-trips, layout checks at iPad
  viewport sizes).
- CI secrets not yet added (see Deploying section) — Actions workflow is
  unproven end-to-end.

## Windows-environment gotchas (from working on this machine)

- `npm install` on this machine needs `npm approve-scripts --all` after
  install for `esbuild`/`sharp`/`workerd` postinstall scripts to run (this
  is already reflected in `package.json`'s `allowScripts` block — don't
  strip that out).
- `dev.cmd` explicitly prepends `C:\Program Files\nodejs` to `PATH` before
  running `npm run dev`, because the shell's default `PATH` here doesn't
  always pick up Node otherwise.
- Local D1 state (`.wrangler/state/`) is keyed by the `database_id` in
  `wrangler.jsonc`. If that id ever changes (it did once, from a placeholder
  to the real uuid), the local DB silently becomes empty and `/api/scores`
  returns 500 `no such table: scores` — just re-run
  `npx wrangler d1 migrations apply DB --local`.
