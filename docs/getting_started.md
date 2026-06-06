# Getting Started

Steps to run Biku locally. Backend first, then frontend.

---

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Bun | >= 1.1 | Runtime and package manager for the backend |
| Node.js | >= 20 | Required by the Vue / Vite frontend |
| Git | any | |

Install Bun: https://bun.sh

---

## 1. Clone the repo

```bash
git clone <repo-url>
cd Biku
git checkout dev
```

---

## 2. Backend setup

### 2a. Install dependencies

```bash
cd server
bun install
```

### 2b. Configure environment variables

```bash
cp .env.example .env
```

Open `server/.env` and fill in the required values:

```
PORT=3000
JWT_SECRET=<any long random string>

UNSPLASH_ACCESS_KEY=<key from https://unsplash.com/developers>

# Free tier key from https://aistudio.google.com — create key in new project
GEMINI_API_KEY=<key from Google AI Studio>

DATABASE_URL=./biku.db
```

**JWT_SECRET:** Any long random string works. Generate one with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# or with Bun:
bun -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

The dev default (`biku-dev-secret-change-in-production`) is fine for local development, only replace it for a production deployment (future plan of this project).

**Unsplash:** Register at https://unsplash.com/developers, create an app, copy the Access Key.

**Gemini:** Go to https://aistudio.google.com → Get API key → Create API key in new project. Free tier gives access to `gemini-2.5-flash` at no cost. If the key is absent or the call fails, the randomiser falls back to the seeded date ideas silently.

### 2c. Create the database and seed data

```bash
bun run migrate   # creates all tables in biku.db
bun run seed      # populates date_ideas, plus an optional showcase couple (see below)
```

Both scripts are idempotent — safe to run more than once.

`bun run seed` does two independent things, each with its own "already done" check:

1. **`date_ideas`** — always runs on a fresh database, inserting the 28 starter ideas the randomiser falls back to when Gemini is unavailable.
2. **Showcase couple (Law + Ariana)** — a demo dataset for presenting the app, built on top of an existing account with the email `lawrensuleo@gmail.com`. It looks that account up, creates a second account for "Ariana" (`Ariana7@gmail.com` / `DPRGrande7#`), pairs her onto the existing couple, and seeds a few months of memories, important dates, list items, and ~20 days of mood logs for both partners — enough to show off the mood chart, map, lists, and dashboard with real-looking content. If no account with that email exists yet (e.g. on a fresh clone), this section just logs a message and skips — it won't fail the rest of the seed run.

### 2d. Start the backend

```bash
bun run dev       # starts with file watching on port 3000
```

Confirm the server is up:

```bash
curl http://localhost:3000/api/health
# → {"ok":true}
```

---

## 3. Frontend setup

### 3a. Install dependencies

```bash
cd ../client
npm install
```

### 3b. Start the dev server

```bash
npm run dev       # starts Vite on http://localhost:5173
```

The Vite config proxies all `/api/*` requests to `http://localhost:3000`, so no CORS configuration is needed during development.

---

## 4. Running both together

Open two terminals:

```
Terminal 1 — server/    →  bun run dev
Terminal 2 — client/    →  npm run dev
```

Then open http://localhost:5173 in the browser.

---

## 5. Useful commands

| Command | Location | What it does |
|---|---|---|
| `bun run dev` | `server/` | Start backend with file watching |
| `bun run migrate` | `server/` | Create or re-create all DB tables |
| `bun run seed` | `server/` | Seed `date_ideas`, plus the Law + Ariana showcase couple (each part skips if already seeded) |
| `npm run dev` | `client/` | Start Vite dev server |
| `npm run build` | `client/` | Production build to `client/dist/` |

---

## 6. Architecture notes

- **Auth:** JWT stored in `httpOnly` cookie — no token management needed on the frontend
- **Couple state:** a new user creates or joins a couple via invite code, which immediately opens up the whole shared space (memories, lists, mood, dates, randomiser, settings). this is "solo setup mode": it lets the first partner get everything ready while waiting for the second to join. a warm reminder card keeps the invite code visible until a partner actually joins; once they do, the dashboard switches into the full two-person view (partner profile, dual-line mood chart, "our" framing throughout). see `docs/system_design.md` section 3.3 for the full reasoning.
- **Weather:** fetched from Open-Meteo (no key needed) and cached permanently on the memory record
- **Randomiser:** calls Gemini 2.5 Flash to generate a date idea; falls back to the 28 seeded ideas if the API is unavailable
- **Map:** Leaflet + OpenStreetMap tiles, no key required
- **Images:** proxied through the backend to keep the Unsplash key off the client

See `docs/system_design.md` for the full API contract and data model.
