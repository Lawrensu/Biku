# Biku — Claude Context

This file is the single source of truth for Claude. Read it fully before touching any code.

---

## What is Biku

A couple web app built for COS30043 Interface Design and Development (Swinburne, 40% of grade).
Full-stack: Vue 3 SPA frontend + Bun/Fastify backend + SQLite database.

The app lets two partners share memories, mood logs, shared lists, important dates, and a date night randomiser.
Users must register and pair via invite code to unlock full functionality.

---

## Current Build Status

| Layer | Status |
|---|---|
| Backend — scaffold, DB, routes, middleware | ✅ Complete and fully tested |
| Frontend — setup, stores, router, views | ⬜ Not started (client/src is still a stub) |

**Next task: Frontend implementation. Start from Step 3 (Tailwind/CSS setup) and work through to Step 10 (all 14 views).**

---

## Tech Stack

| Concern | Choice |
|---|---|
| Frontend runtime | Vue 3 + Vite |
| Frontend state | Pinia |
| Frontend routing | Vue Router 4 |
| Frontend styling | Tailwind CSS v4 (via `@tailwindcss/vite` plugin) |
| Icons | `lucide-vue-next` |
| Backend runtime | Bun |
| Backend framework | Fastify v4 |
| Database | SQLite via `bun:sqlite` + Drizzle ORM |
| Auth | JWT in `httpOnly` cookie (jose) |
| Validation | Zod |
| Map | Leaflet + OpenStreetMap (no API key needed) |
| Images | Unsplash API (proxied through backend) |
| Weather | Open-Meteo (proxied + cached in SQLite) |
| AI (randomiser) | Gemini 2.5 Flash (Google AI Studio, free tier) |

---

## Repository Layout

```
Biku/
├── CLAUDE.md                  ← this file
├── docs/
│   ├── system_design.md       ← API contract, schema, routes table — source of truth
│   ├── frontend_design.md     ← design tokens, component patterns, voice/tone
│   ├── development_conventions.md
│   ├── getting_started.md
│   ├── project_scope.md
│   └── report.md
├── server/                    ← Bun + Fastify backend (COMPLETE)
│   ├── .env                   ← secrets (gitignored)
│   ├── .env.example           ← committed template
│   ├── biku.db                ← SQLite file (gitignored)
│   ├── package.json
│   └── src/
│       ├── app.js             ← Fastify entry point
│       ├── db/
│       │   ├── schema.js      ← Drizzle table definitions (8 tables)
│       │   ├── index.js       ← db connection + PRAGMA foreign_keys = ON
│       │   ├── migrate.js     ← CREATE TABLE IF NOT EXISTS runner
│       │   └── seed.js        ← 28 date_ideas rows
│       ├── middleware/
│       │   ├── auth.middleware.js   ← verifies JWT cookie → request.user
│       │   └── pair.middleware.js   ← checks request.user.coupleId → 403 if null
│       ├── routes/
│       │   ├── auth.routes.js       ← register, login, logout, me
│       │   ├── couple.routes.js     ← create, join, get, patch
│       │   ├── memory.routes.js     ← CRUD + /map endpoint
│       │   ├── list.routes.js       ← get list, item CRUD, reorder
│       │   ├── mood.routes.js       ← log, history, update
│       │   ├── dates.routes.js      ← important dates CRUD
│       │   ├── randomiser.routes.js ← Gemini 2.5 Flash + seed fallback
│       │   └── proxy.routes.js      ← Unsplash + Open-Meteo passthrough
│       └── utils/
│           ├── uuid.js        ← generateId()
│           ├── hash.js        ← hashPassword / verifyPassword (Bun.password / bcrypt)
│           └── jwt.js         ← issueToken(), COOKIE_OPTS (shared by auth + couple routes)
└── client/                    ← Vue 3 + Vite frontend (TO BE BUILT)
    ├── index.html
    ├── package.json
    ├── vite.config.js         ← proxies /api/* → localhost:3000
    ├── tailwind.config.js     ← design tokens
    └── src/
        ├── main.js            ← stub — needs router + pinia wired up
        ├── App.vue            ← stub — needs RouterView + dark mode attr
        ├── assets/
        │   └── main.css       ← needs CSS custom properties + base styles
        ├── components/        ← to be created
        ├── composables/       ← to be created
        ├── stores/            ← to be created
        ├── services/          ← to be created
        ├── views/             ← to be created
        ├── router/            ← to be created
        └── utils/             ← to be created
```

---

## Environment Variables (server/.env)

```
PORT=3000
JWT_SECRET=biku-dev-secret-change-in-production
UNSPLASH_ACCESS_KEY=<see server/.env — never commit actual key>
GEMINI_API_KEY=<see server/.env — never commit actual key>
DATABASE_URL=./biku.db
```

Gemini key note: current key shows `limit: 0` on free tier quota — likely a billing configuration issue on the Google Cloud project. The randomiser falls back to the seeded `date_ideas` table silently, so the app works regardless. Replace the key with one from https://aistudio.google.com if AI generation is needed.

---

## How to Run

```bash
# Backend (run from server/)
bun install
bun run migrate    # creates biku.db tables
bun run seed       # populates date_ideas (idempotent)
bun run dev        # starts on port 3000

# Frontend (run from client/)
npm install
npm run dev        # starts Vite on port 5173
```

To kill the backend server in WSL: `kill -9 $(ps aux | grep bun | grep -v grep | awk '{print $1}')`
Do NOT use taskkill from WSL — bun runs as a Windows process via the /c/Users/User/.bun/bin/bun path but is visible to WSL's ps.

---

## Design System

### Colour Tokens

| Token | Value | Usage |
|---|---|---|
| `linen` / `--color-linen` | `#FDFAF8` | Page background (`surface-base`) |
| `carbon` / `--color-carbon` | `#1B1C20` | Primary text |
| `blush` / `--color-blush` | `#EDB1B0` | Primary accent, CTA buttons |
| `slate` / `--color-slate` | `#5B6E7D` | Secondary text, muted UI |
| `cherry` / `--color-cherry` | `#5C0403` | Destructive actions, errors |
| `cherry-tint` | `#F5E8E8` | Error backgrounds |

Dark mode token: `[data-theme="dark"]` on `<html>` element. Managed by `ui.store.js`.

### Typography

- **Headings / UI chrome**: Plus Jakarta Sans (`font-heading`)
- **Body / reading text**: Lora (`font-body`)
- Both loaded via Google Fonts in `index.html`

### Card Pattern

```css
background: var(--surface-card);          /* white / dark surface */
border: 1px solid var(--border-subtle);
border-radius: var(--radius-lg);          /* 14px */
padding: var(--space-6);                  /* 24px */
box-shadow: 0 2px 8px rgba(27,28,32,0.06), 0 1px 2px rgba(27,28,32,0.04);
/* dark mode: box-shadow: none */
```

### Voice & Tone

- First-person plural ("we", "our", "let's")
- Lowercase-first on UI labels and microcopy
- No emoji in UI chrome
- Warm, specific, never generic

---

## Frontend Build Plan

Build in this order. Do not skip steps. Each step depends on the previous.

### Step 3 — CSS + Tailwind base
- `src/assets/main.css`: CSS custom properties for all design tokens, base resets, font imports
- Tailwind config already has tokens — `main.css` bridges to CSS vars for non-Tailwind usage

### Step 4 — Pinia stores
Three stores:
- `src/stores/auth.store.js` — user, isLoggedIn, isPaired, login/logout/fetchMe actions
- `src/stores/couple.store.js` — couple, partner, fetchCouple, patchCouple actions
- `src/stores/ui.store.js` — theme (light/dark), toggleTheme, applies `data-theme` to `<html>`

### Step 5 — Vue Router
- `src/router/index.js` — all 14 routes with meta (`requiresAuth`, `requiresUnauth`, `requiresPaired`)
- Navigation guard using auth store
- `App.vue` updated to use `<RouterView>`
- `main.js` updated to mount with router + pinia

### Step 6 — API service layer
- `src/services/api.js` — base fetch wrapper, handles 401 → redirect to /login
- `src/services/auth.service.js`
- `src/services/couple.service.js`
- `src/services/memory.service.js`
- `src/services/list.service.js`
- `src/services/mood.service.js`
- `src/services/date.service.js`
- `src/services/randomiser.service.js`
- `src/services/proxy.service.js`

### Step 7 — Base components
- `src/components/base/BaseButton.vue` — variants: primary, secondary, ghost, danger
- `src/components/base/BaseInput.vue` — label, error state, helper text
- `src/components/base/BaseModal.vue` — teleport to body, backdrop, close on escape

### Step 8 — Layout components
- `src/components/layout/AppNavbar.vue` — nav links, dark mode toggle, user avatar
- `src/components/layout/AppFooter.vue` — minimal

### Step 9 — Feature components
- `src/components/memory/MemoryCard.vue`
- `src/components/memory/MemorySkeleton.vue`
- `src/components/mood/MoodChart.vue` — Chart.js line chart
- `src/components/mood/MoodLogForm.vue`
- `src/components/list/ListItem.vue`
- `src/components/list/ListContainer.vue`
- `src/components/map/MemoryMap.vue` — Leaflet map

### Step 10 — All 14 views (in this order)
1. `LandingView.vue` — breathing ASCII art background, Y2K retro packaging aesthetic, BIKU + heart + 2 abstract figures
2. `RegisterView.vue`
3. `LoginView.vue`
4. `PairView.vue` — generate invite code OR enter partner's code
5. `DashboardView.vue` — paired state + unpaired preview state
6. `MemoriesView.vue` — paginated grid
7. `MemoryFormView.vue` — Unsplash image picker, location, date
8. `MemoryDetailView.vue` — weather data display
9. `MapView.vue` — Leaflet with memory pins
10. `ListsView.vue` — bucket / grocery / wishlist tabs
11. `MoodView.vue` — log form + Chart.js
12. `DatesView.vue` — countdown to next date
13. `RandomiserView.vue` — filter + spin animation
14. `SettingsView.vue` — couple name, anniversary, profile

---

## 14 Routes Reference

| Route | View | Auth | Paired |
|---|---|---|---|
| `/` | LandingView | No | Any |
| `/register` | RegisterView | No (unauthed only) | — |
| `/login` | LoginView | No (unauthed only) | — |
| `/pair` | PairView | Yes | Unpaired |
| `/dashboard` | DashboardView | Yes | Any |
| `/memories` | MemoriesView | Yes | Yes |
| `/memories/new` | MemoryFormView | Yes | Yes |
| `/memories/:id` | MemoryDetailView | Yes | Yes |
| `/map` | MapView | Yes | Yes |
| `/lists` | ListsView | Yes | Yes |
| `/mood` | MoodView | Yes | Yes |
| `/dates` | DatesView | Yes | Yes |
| `/randomiser` | RandomiserView | Yes | Yes |
| `/settings` | SettingsView | Yes | Yes |

---

## Backend API — Quick Reference

All routes prefixed `/api`. Auth via `httpOnly` JWT cookie. Errors: `{ error, code }`.

```
POST   /api/auth/register        { email, password, display_name }
POST   /api/auth/login           { email, password }
POST   /api/auth/logout
GET    /api/auth/me              → { user, couple? } — reissues JWT if coupleId changed

POST   /api/couples              → { couple, invite_code }
POST   /api/couples/join         { invite_code } → { couple } — reissues JWT for joiner
GET    /api/couples/me           → { couple, partner }
PATCH  /api/couples/me          { couple_name?, anniversary_date? }

GET    /api/memories?page&limit
POST   /api/memories
GET    /api/memories/map
GET    /api/memories/:id
PATCH  /api/memories/:id
DELETE /api/memories/:id

GET    /api/lists/:type          type: bucket | grocery | wishlist (auto-creates)
POST   /api/lists/:type/items    { content }
PATCH  /api/lists/items/:id      { content?, is_checked?, sort_order? }
DELETE /api/lists/items/:id
PATCH  /api/lists/:type/reorder  { ordered_ids: string[] }

GET    /api/moods?days=30
POST   /api/moods                { mood_score: 1-5, note? }
PATCH  /api/moods/:id            today only

GET    /api/dates
POST   /api/dates                { title, date: YYYY-MM-DD, recurs_yearly: bool }
PATCH  /api/dates/:id
DELETE /api/dates/:id

GET    /api/date-ideas?budget&category&max_duration   → { idea, source: "ai"|"seed" }

GET    /api/proxy/unsplash/search?q=      → { images: [{url, thumb_url, author, author_url}] }
GET    /api/proxy/weather?lat&lng&date    → { weather: {tempMax, tempMin, weatherCode}, cached }

GET    /api/health               → { ok: true }
```

---

## Key Bugs Fixed (backend)

1. **Empty JSON body** — Fastify rejected `POST /api/couples` (no body) with `FST_ERR_CTP_EMPTY_JSON_BODY`. Fixed with custom content-type parser in `app.js` that treats empty body as `{}`.

2. **Stale JWT after pairing** — After `POST /api/couples/join`, the joining user's JWT still had `coupleId: null`. Fixed: `couple.routes.js` now reissues the JWT immediately after updating the DB.

3. **Partner A stale JWT** — Partner A's JWT never updated after partner B joined. Fixed: `GET /api/auth/me` detects DB vs JWT `coupleId` mismatch and reissues the token transparently.

4. **Shared JWT utils** — `issueToken` and `COOKIE_OPTS` were duplicated. Extracted to `src/utils/jwt.js`.

---

## Development Conventions

- **Indentation**: tabs, size 4
- **Quotes**: single quotes (double only for JSDoc)
- **Modules**: ES modules (`import`/`export`), `"type": "module"` in package.json
- **Comments**: explain the WHY, not the WHAT
- **Whitespace**: 3 blank lines between functions, 5 between major sections
- **Git commits**: `file.ext: description` (single-line) or multi-line with bullet list
- **Separation of concerns**: DB stores data only, routes validate + call service, services hold logic
- **No business logic in DB**: constraints like "one mood per day" enforced in route handler

---

## HD Advanced Techniques (must be documented in report)

These must all appear in the project report's advanced techniques section:

1. JWT auth with httpOnly cookies (no localStorage)
2. Couple state machine with middleware enforcement (requiresAuth, requiresPaired)
3. AI-generated content — Gemini 2.5 Flash for date ideas with graceful fallback
4. Open-Meteo weather caching in SQLite (permanent cache, fetch once per coordinate+date)
5. Unsplash image proxy (API key never client-side)
6. Leaflet interactive map with dynamic memory pins
7. Chart.js mood visualisation (dual-partner line chart)
8. Drag-to-reorder lists (batch sort_order update via `PATCH /api/lists/:type/reorder`)
9. Dark mode via `data-theme` attribute (CSS custom properties, no class toggling)
10. Breathing CSS animation on landing page (ASCII art, Y2K retro aesthetic)
11. Vue Router navigation guards (3 guard types, server-side enforcement mirrors client)
12. Pinia stores with composable-based data access patterns
13. Debounced Unsplash search in memory form (400ms, triggered by title input)

---

## LandingView — Design Brief

The landing page has a continuously breathing ASCII art background. Subject: BIKU text + heart symbol + 2 abstract figures representing a couple. Aesthetic: retro Y2K packaging, warm and intimate. The ASCII characters animate with a slow CSS breathing effect (scale + opacity pulse). The page sits on `#FDFAF8` (linen) with the ASCII art in a muted `blush` or `carbon` at low opacity. CTA: "get started" → `/register`, "sign in" → `/login`.

---

## Client Dependencies (already installed)

```json
{
  "dependencies": {
    "lucide-vue-next": "^1.0.0",
    "pinia": "^3.0.4",
    "vue": "^3.5.30",
    "vue-router": "4"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.2.4",
    "@vitejs/plugin-vue": "^6.0.5",
    "autoprefixer": "^10.5.0",
    "tailwindcss": "^4.2.4",
    "vite": "^8.0.1"
  }
}
```

Still needed (install when required):
- `chart.js` + `vue-chartjs` — for MoodView chart
- `leaflet` — for MapView
- `@vuedraggable/next` or `sortablejs` — for list reordering

---

## What NOT to Do

- Do not use Stitch — Claude Design bundle only
- Do not use integer IDs — all primary keys are UUIDs
- Do not put business logic in DB schema — enforce in route handlers
- Do not expose the Unsplash API key to the frontend
- Do not use localStorage for JWT — httpOnly cookie only
- Do not deviate from the 14 routes defined above
- Do not skip the report documentation — HD grade depends on it
