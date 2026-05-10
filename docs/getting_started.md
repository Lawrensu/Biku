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

**Unsplash:** Register at https://unsplash.com/developers, create an app, copy the Access Key.

**Gemini:** Go to https://aistudio.google.com → Get API key → Create API key in new project. Free tier gives access to `gemini-2.5-flash` at no cost. If the key is absent or the call fails, the randomiser falls back to the seeded date ideas silently.

### 2c. Create the database and seed data

```bash
bun run migrate   # creates all tables in biku.db
bun run seed      # populates date_ideas with 28 starter ideas
```

Both scripts are idempotent — safe to run more than once.

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
| `bun run seed` | `server/` | Seed `date_ideas` (skips if already seeded) |
| `npm run dev` | `client/` | Start Vite dev server |
| `npm run build` | `client/` | Production build to `client/dist/` |

---

## 6. Architecture notes

- **Auth:** JWT stored in `httpOnly` cookie — no token management needed on the frontend
- **Couple state:** users start unpaired; full app access unlocks after both partners join via invite code
- **Weather:** fetched from Open-Meteo (no key needed) and cached permanently on the memory record
- **Randomiser:** calls Gemini 2.5 Flash to generate a date idea; falls back to the 28 seeded ideas if the API is unavailable
- **Map:** Leaflet + OpenStreetMap tiles, no key required
- **Images:** proxied through the backend to keep the Unsplash key off the client

See `docs/system_design.md` for the full API contract and data model.
