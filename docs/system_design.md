# Biku System Design

> Technical reference for implementation. This document is read during development, not before it. Schema is the source of truth. API contract follows schema. Frontend follows API.

---

## 1. System Architecture

### 1.1 High-Level Overview

```
┌─────────────────────────────────────────┐
│              CLIENT (Browser)            │
│                                         │
│  Vue 3 + Vite SPA                       │
│  ├── Vue Router (client-side routing)   │
│  ├── Pinia (global state)               │
│  ├── Composables (reusable logic)       │
│  └── Components (UI layer)             │
│                                         │
│  Map tiles fetched directly:            │
│  └── Leaflet + OpenStreetMap           │
└──────────────┬──────────────────────────┘
               │ HTTP REST (JSON)
               │ via /api/*
┌──────────────▼──────────────────────────┐
│              SERVER (Bun runtime)        │
│                                         │
│  Fastify                                │
│  ├── Route handlers                     │
│  ├── Schema validation (Zod)            │
│  ├── Auth middleware (JWT)              │
│  └── External API proxy                │
│       ├── Unsplash proxy               │
│       └── Open-Meteo proxy + cache     │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│              DATABASE                    │
│  SQLite — single .db file               │
│  Drizzle ORM — schema and queries       │
│  Fallback: bun:sqlite (built-in driver) │
└─────────────────────────────────────────┘
```

External APIs are proxied through the backend. The Unsplash API key must never appear in client-side code — it would be visible in browser developer tools. Open-Meteo needs no key but is still routed through the backend so that responses can be cached in SQLite, meaning each (lat, lng, date) combination is only ever fetched once.

### 1.2 Authentication Flow

JWT stored in an `httpOnly` cookie.

On registration or login, the server issues a signed JWT and sets it as an `httpOnly` cookie on the response. All subsequent requests include the cookie automatically — no client-side token management is needed. The frontend determines auth state by calling `GET /api/auth/me` on application load, which returns the current user or a 401 if the cookie is absent or expired. Protected Fastify routes run the auth middleware before the route handler.

### 1.3 Couple State Machine

Every user account is in exactly one of these states at any point in time.

```
UNREGISTERED
     │
     ▼  registers
REGISTERED, UNPAIRED
     │  couple_id is null
     │  can see feature previews, cannot write any couple data
     │
     ▼  generates invite code (partner A) or enters code (partner B)
PAIRED
     │  couple_id is set on both user records
     │  full application access
     │
     ▼  (future — out of scope)
UNLINKED
```

Route guards enforce this at the frontend. The API enforces it independently via middleware — the frontend state is never trusted for authorisation.

### 1.4 Build Order

Schema is written before API routes. API routes are written before frontend components. This order is not optional — the schema defines what data exists, the API defines how it is accessed, and the frontend can only be built once both of those contracts are stable.

### 1.4 Frontend Styling and Design System

Tailwind CSS is used for all styling and responsive layout. Tailwind is a utility-first CSS framework that provides predefined classes for spacing, typography, colors, and responsive breakpoints. Rather than writing custom stylesheets, styles are applied directly in Vue component markup using utility classes.

Base configuration lives in `tailwind.config.js` at the project root. This file defines the design token constraints — spacing scale, colour palette, typography sizes, and breakpoints. All components inherit from this single source of truth, ensuring visual consistency across all 14 pages without maintaining a separate design system document.

Responsive behaviour is implemented using Tailwind's responsive prefixes: `sm:` (640px), `md:` (768px), `lg:` (1024px), `xl:` (1280px). These prefixes are applied directly to utility classes in markup, making the responsive behaviour of every element explicit and co-located with the structure rather than scattered across media query blocks. Mobile-first approach means no prefix on base utilities, then `sm:`, `md:`, `lg:` for larger screens.

Component-level styling is kept minimal. Base components (BaseButton, BaseInput, BaseModal) define their own utility classes. Feature components inherit this base styling and extend with component-specific utilities as needed. This approach avoids stylesheet bloat and keeps styling decisions visible in the markup.

---

## 2. Data Model

### 2.1 Design Decisions

Primary keys are UUIDs (TEXT) rather than integer autoincrement. Sequential integer IDs are predictable — a user who knows their memory ID is 5 could attempt to access ID 4 belonging to a different couple. UUIDs are non-sequential and non-guessable. Server-side ownership validation provides the primary protection, but non-guessable IDs are an additional layer.

SQLite foreign key enforcement must be enabled explicitly with `PRAGMA foreign_keys = ON` on every connection. Drizzle does not enable this by default.

Weather data is stored as a cached JSON string on the memory record. Historical weather for a given (lat, lng, date) is immutable — it will never change. Fetching it once and caching it permanently eliminates repeated API calls for the same memory.

No business logic lives in the database. Constraints like "one mood log per user per day" are enforced at the application layer in the route handler, not via database triggers or complex constraints.

### 2.2 Schema

```sql
-- users
-- Each registered account. couple_id is null until the user pairs with a partner.
CREATE TABLE users (
    id              TEXT PRIMARY KEY,
    email           TEXT NOT NULL UNIQUE,
    password_hash   TEXT NOT NULL,
    display_name    TEXT NOT NULL,
    avatar_url      TEXT,
    couple_id       TEXT REFERENCES couples(id),
    created_at      INTEGER NOT NULL
);


-- couples
-- The relationship entity. Exactly two users per record.
-- partner_a is whoever created the couple (sent the invite).
-- partner_b is whoever joined (accepted the invite).
-- partner_b_id is null until the invite is accepted.
CREATE TABLE couples (
    id               TEXT PRIMARY KEY,
    partner_a_id     TEXT NOT NULL REFERENCES users(id),
    partner_b_id     TEXT REFERENCES users(id),
    couple_name      TEXT,
    anniversary_date TEXT,
    invite_code      TEXT UNIQUE,
    invite_status    TEXT NOT NULL DEFAULT 'pending',
    created_at       INTEGER NOT NULL
);

-- invite_status values: 'pending' | 'accepted' | 'expired'


-- memories
-- A shared memory entry. Always belongs to a couple.
CREATE TABLE memories (
    id               TEXT PRIMARY KEY,
    couple_id        TEXT NOT NULL REFERENCES couples(id),
    created_by       TEXT NOT NULL REFERENCES users(id),
    title            TEXT NOT NULL,
    description      TEXT,
    memory_date      TEXT NOT NULL,
    location_name    TEXT,
    lat              REAL,
    lng              REAL,
    image_url        TEXT,
    image_author     TEXT,
    image_author_url TEXT,
    weather_data     TEXT,
    created_at       INTEGER NOT NULL
);

-- memory_date is stored as ISO 8601 string: YYYY-MM-DD
-- image_url must be the hotlinked Unsplash URL (API terms requirement)
-- weather_data is a cached JSON string from Open-Meteo, set once on creation


-- lists
-- A shared list. Three types per couple, one of each.
-- list_type uniqueness per couple is enforced at the application layer.
CREATE TABLE lists (
    id         TEXT PRIMARY KEY,
    couple_id  TEXT NOT NULL REFERENCES couples(id),
    list_type  TEXT NOT NULL,
    created_at INTEGER NOT NULL
);

-- list_type values: 'bucket' | 'grocery' | 'wishlist'


-- list_items
-- Items belonging to a list.
-- sort_order is managed by the client and written on reorder.
CREATE TABLE list_items (
    id         TEXT PRIMARY KEY,
    list_id    TEXT NOT NULL REFERENCES lists(id),
    added_by   TEXT NOT NULL REFERENCES users(id),
    content    TEXT NOT NULL,
    is_checked INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
);

-- is_checked uses SQLite boolean convention: 0 = false, 1 = true


-- mood_logs
-- One entry per user per day. Enforced at application layer.
CREATE TABLE mood_logs (
    id         TEXT PRIMARY KEY,
    couple_id  TEXT NOT NULL REFERENCES couples(id),
    user_id    TEXT NOT NULL REFERENCES users(id),
    mood_score INTEGER NOT NULL,
    note       TEXT,
    log_date   TEXT NOT NULL,
    created_at INTEGER NOT NULL
);

-- mood_score range: 1 (very low) to 5 (very high)
-- log_date stored as YYYY-MM-DD


-- important_dates
-- Relationship milestones and reminders.
CREATE TABLE important_dates (
    id            TEXT PRIMARY KEY,
    couple_id     TEXT NOT NULL REFERENCES couples(id),
    created_by    TEXT NOT NULL REFERENCES users(id),
    title         TEXT NOT NULL,
    date          TEXT NOT NULL,
    recurs_yearly INTEGER NOT NULL DEFAULT 0,
    created_at    INTEGER NOT NULL
);

-- recurs_yearly: 0 = one-time event, 1 = recurring annually


-- date_ideas
-- Seed data for the date night randomiser fallback.
-- Not user-created. Populated by the seed script at initialisation.
-- The randomiser route calls Gemini 2.0 Flash first (GEMINI_API_KEY in .env).
-- This table is only queried when the AI call fails or the key is absent.
CREATE TABLE date_ideas (
    id          TEXT PRIMARY KEY,
    title       TEXT NOT NULL,
    description TEXT,
    category    TEXT NOT NULL,
    budget_level INTEGER NOT NULL,
    min_duration INTEGER,
    max_duration INTEGER,
    tags        TEXT
);

-- category values: 'outdoor' | 'indoor' | 'food' | 'adventure' | 'cosy'
-- budget_level: 1 (free) to 3 (splurge)
-- min_duration and max_duration in minutes
-- tags stored as a JSON array string: '["romantic","creative"]'
```

### 2.3 Entity Relationships

```
couples (1)
    ├──< users (2, via partner_a_id and partner_b_id)
    ├──< memories (many)
    ├──< lists (3, one per list_type)
    │       └──< list_items (many)
    ├──< mood_logs (many, one per user per day)
    └──< important_dates (many)

date_ideas — standalone, no foreign key to couples
```

---

## 3. User Flows

### 3.1 Registration and Pairing

```
User A                                    User B
──────                                    ──────
Visits Biku, clicks Get Started
Fills registration form
POST /api/auth/register
Server creates user, couple_id = null
Redirected to /pair

Clicks "Invite my partner"
POST /api/couples
Server creates couple record:
  partner_a_id = User A
  partner_b_id = null
  invite_code  = "XK92PL"
  invite_status = "pending"
Server also sets couple_id on User A immediately
(see bug fix #5 — without this, User A's own
JWT never refreshes and they'd be stuck unable
to reach any paired route, including their own
invite screen)
UI shows invite code

User A now has full access to the shared space
(memories, lists, mood, dates, randomiser, settings)
even though partner_b_id is still null — this is
"solo setup mode", see 3.3 below for the reasoning

User A shares code out of band
(SMS, chat, etc.)
                                          Visits Biku, clicks "Join with a code"
                                          Fills registration form
                                          POST /api/auth/register
                                          Server creates user, couple_id = null
                                          Redirected to /pair

                                          Enters code "XK92PL"
                                          POST /api/couples/join
                                          Server:
                                            Finds couple by invite_code
                                            Validates invite_status = "pending"
                                            Sets partner_b_id = User B
                                            Sets invite_status = "accepted"
                                            Sets couple_id on User B
                                          (User A already had couple_id set
                                          from the moment they created the
                                          couple — see "solo setup mode" above)
                                          Redirected to /dashboard

User A's next request detects the change
(couple now has a partner_b) and the dashboard
swaps from solo setup mode into the full
two-person view — partner profile, dual-line
mood chart, shared everything.
```

### 3.2 Creating a Memory

```
User navigates to /memories/new
Fills in title, date, description, location name, coordinates

As the user types the title:
  Debounced (400ms) call to GET /api/proxy/unsplash/search?q={title}
  Image suggestions appear below the title field
  User selects an image (or skips — image is optional)

User submits the form
POST /api/memories
Server:
  Validates ownership via JWT couple_id
  Creates memory record with provided fields
  If lat and lng are provided:
    Fetches weather from Open-Meteo for that (lat, lng, memory_date)
    Stores response as weather_data JSON on the memory record
  Returns created memory

User is redirected to /memories/:id
The new memory appears as a pin on /map
```

### 3.3 Solo Setup Mode (couple created, partner not joined yet)

This replaces an earlier plan for a "blurred preview" state. Once the team actually
sat with the question — "what should the creator see while they're waiting?" —
blurred placeholder cards and a flat-line chart felt cold and unfinished, like
being shown a locked door. The decision instead: let the creator actually use
the space. There's a real, common reason to want this — adding memories from
before the couple started using Biku, picking a couple name, queueing up list
items, logging a mood, getting date ideas from the randomiser to suggest once
the partner arrives. None of that needs a partner to exist yet, and blocking it
would leave User A doing nothing for however long it takes User B to register.

```
User registers, creates a couple, gets an invite code
couple_id is now set on their account — partner_b_id is still null

User navigates anywhere in the app:
  Full access to memories, lists, mood, dates, randomiser, settings
  (this is what the code calls "isPaired" — having a couple record,
   which is a slightly looser definition than "has a partner")

The dashboard (and settings) additionally show a warm, persistent
reminder card with the invite code, so the creator never loses track
of where it went or forgets their partner hasn't joined yet:
  "this space is ready and waiting for them.
   share [code], and the moment they join, it's ours."

The moment partner_b_id is set (partner joins):
  The reminder card disappears
  Partner profile, dual-line mood chart, and "our X" framing
  reflect a genuinely shared space from then on
```

**Why this matters for the access model:** "paired" in the codebase (`auth.isPaired`,
the `requiresPaired` middleware) means *"has created or joined a couple record"* —
not *"has an active partner."* That's intentional, confirmed, and now documented:
it's what makes solo setup mode possible. A second, narrower flag — `hasPartner`
(`!!couple.partnerBId`) — is what the UI uses to decide whether to show the
reminder card and the two-person views. The backend access guard never needed to
change: every route that requires a couple record (memories, lists, mood, dates,
randomiser, settings, map) is exactly the set of things a solo creator should
reasonably be able to set up in advance.

All POST and PATCH operations are still gated at the API level — the pair
middleware checks `couple_id` from the JWT, and frontend state is never the
authority on what's permitted. What changed is only the *meaning* assigned to
having a couple record: it now explicitly represents "has set up our space,"
with partnership being a separate, additive state layered on top.

---

## 4. API Contract

### 4.1 Conventions

All routes are prefixed with `/api`. All requests and responses use `Content-Type: application/json`. Authentication is via `httpOnly` JWT cookie sent automatically by the browser. Error responses follow the shape `{ error: string, code: string }`. Timestamps in responses are ISO 8601 strings. IDs are UUIDs.

Three route guard types exist. `requiresAuth` redirects to `/login` if no valid JWT is present. `requiresUnauth` redirects to `/dashboard` if already logged in. `requiresPaired` returns 403 if `couple_id` is null on the authenticated user.

### 4.2 Auth Routes

```
POST   /api/auth/register
       Body:     { email, password, display_name }
       Response: { user }
       Sets httpOnly JWT cookie on success

POST   /api/auth/login
       Body:     { email, password }
       Response: { user }
       Sets httpOnly JWT cookie on success

POST   /api/auth/logout
       Response: 204
       Clears the JWT cookie

GET    /api/auth/me
       Response: { user, couple? }
       Used on application load to determine auth and pair state
       Returns 401 if not authenticated
```

### 4.3 Couple Routes

```
POST   /api/couples
       Creates a couple record and generates an invite code
       Guard:    requiresAuth, user must be unpaired
       Response: { couple, invite_code }

POST   /api/couples/join
       Body:     { invite_code }
       Guard:    requiresAuth, user must be unpaired
       Response: { couple }

GET    /api/couples/me
       Guard:    requiresAuth, requiresPaired
       Response: { couple, partner }

PATCH  /api/couples/me
       Body:     { couple_name?, anniversary_date? }
       Guard:    requiresAuth, requiresPaired
       Response: { couple }
```

### 4.4 Memory Routes

```
GET    /api/memories
       Query:    ?page=1&limit=12
       Guard:    requiresAuth, requiresPaired
       Response: { memories: [], total, page }

POST   /api/memories
       Body:     { title, description?, memory_date, location_name?,
                   lat?, lng?, image_url?, image_author?, image_author_url? }
       Guard:    requiresAuth, requiresPaired
       Response: { memory }

GET    /api/memories/map
       Returns only memories with coordinates, for map pins
       Guard:    requiresAuth, requiresPaired
       Response: { memories: [{ id, title, lat, lng, image_url, memory_date }] }

GET    /api/memories/:id
       Guard:    requiresAuth, requiresPaired, ownership validated
       Response: { memory } — includes cached weather_data

PATCH  /api/memories/:id
       Body:     partial memory fields
       Guard:    requiresAuth, ownership validated
       Response: { memory }

DELETE /api/memories/:id
       Guard:    requiresAuth, ownership validated
       Response: 204
```

### 4.5 List Routes

```
GET    /api/lists/:type
       type:     'bucket' | 'grocery' | 'wishlist'
       Guard:    requiresAuth, requiresPaired
       Response: { list, items: [] }

POST   /api/lists/:type/items
       Body:     { content }
       Guard:    requiresAuth, requiresPaired
       Response: { item }

PATCH  /api/lists/items/:id
       Body:     { content?, is_checked?, sort_order? }
       Guard:    requiresAuth, requiresPaired
       Response: { item }

DELETE /api/lists/items/:id
       Guard:    requiresAuth, requiresPaired
       Response: 204

PATCH  /api/lists/:type/reorder
       Body:     { ordered_ids: string[] }
       Batch-updates sort_order based on array position
       Guard:    requiresAuth, requiresPaired
       Response: 204
```

### 4.6 Mood Routes

```
GET    /api/moods
       Query:    ?days=30
       Returns mood logs for both partners over the given number of days
       Guard:    requiresAuth, requiresPaired
       Response: { logs: [{ user_id, mood_score, note, log_date }] }

POST   /api/moods
       Body:     { mood_score, note? }
       One entry per user per day — enforced in the route handler
       Guard:    requiresAuth, requiresPaired
       Response: { log }

PATCH  /api/moods/:id
       Body:     { mood_score?, note? }
       Only the current day's entry can be edited
       Guard:    requiresAuth, requiresPaired
       Response: { log }
```

### 4.7 Important Dates Routes

```
GET    /api/dates
       Guard:    requiresAuth, requiresPaired
       Response: { dates: [] }

POST   /api/dates
       Body:     { title, date, recurs_yearly }
       Guard:    requiresAuth, requiresPaired
       Response: { date }

PATCH  /api/dates/:id
       Body:     partial fields
       Guard:    requiresAuth, requiresPaired
       Response: { date }

DELETE /api/dates/:id
       Guard:    requiresAuth, requiresPaired
       Response: 204
```

### 4.8 Randomiser Routes

```
GET    /api/date-ideas
       Query:    ?budget=1&category=outdoor&max_duration=120
       Calls Gemini 2.0 Flash to generate a date idea matching the filters.
       Falls back to the seeded date_ideas table if AI is unavailable.
       Response includes a "source" field: "ai" | "seed"
       Guard:    requiresAuth, requiresPaired
       Response: { idea, source }
```

AI integration notes:
- Model: gemini-2.5-flash (Google AI Studio free tier — latest stable Flash model, free tier pricing)
- Key configured via GEMINI_API_KEY in .env
- Prompt requests a single structured JSON object; response is parsed and validated
- Any failure (network, quota, malformed JSON) silently falls back to seed table
- AI-generated ideas return id: null — they are ephemeral, not persisted to the database
- Advanced technique for HD report: AI-generated content with graceful degradation

### 4.9 External API Proxy Routes

```
GET    /api/proxy/unsplash/search
       Query:    ?q=sunset+beach
       Proxies to Unsplash API, keeping the API key server-side
       Response: { images: [{ url, thumb_url, author, author_url }] }

GET    /api/proxy/weather
       Query:    ?lat=3.14&lng=101.68&date=2024-06-01
       Checks SQLite for cached weather_data first
       Fetches from Open-Meteo only if not cached
       Response: { weather: { temp, condition, description } }
```

---

## 5. Pages and Routes

### 5.1 Route Table

|Route|View Component|Auth|Paired|Notes|
|---|---|---|---|---|
|`/`|LandingView|No|Any|Public entry point|
|`/register`|RegisterView|No|Unauthed|Redirects to /dashboard if already logged in|
|`/login`|LoginView|No|Unauthed|Redirects to /dashboard if already logged in|
|`/pair`|PairView|Yes|Unpaired|Invite code flow|
|`/dashboard`|DashboardView|Yes|Any|Full dashboard always; shows a warm "share your code" reminder on top while in solo setup mode (couple created, partner not joined yet) — see 3.3|
|`/memories`|MemoriesView|Yes|Paired|Paginated memory journal|
|`/memories/new`|MemoryFormView|Yes|Paired|Create memory form|
|`/memories/:id`|MemoryDetailView|Yes|Paired|Single memory with weather|
|`/map`|MapView|Yes|Paired|Leaflet map with all memory pins|
|`/lists`|ListsView|Yes|Paired|Three list types, tab-switched|
|`/mood`|MoodView|Yes|Paired|Log form and Chart.js visualisation|
|`/dates`|DatesView|Yes|Paired|Important dates and countdown|
|`/randomiser`|RandomiserView|Yes|Paired|Date idea filter and result|
|`/settings`|SettingsView|Yes|Paired|Couple name, anniversary, profile|

14 routes across 14 views. The minimum requirement is 8.

### 5.2 Navigation Guard Logic

```javascript
router.beforeEach((to, from, next) => {
    const auth = useAuthStore()

    if (to.meta.requiresAuth && !auth.isLoggedIn) {
        return next('/login')
    }

    if (to.meta.requiresUnauth && auth.isLoggedIn) {
        return next('/dashboard')
    }

    if (to.meta.requiresPaired && !auth.isPaired) {
        return next('/pair')
    }

    next()
})
```

---

## 6. Folder Structure

### 6.1 Frontend

```
client/
├── public/
│   └── favicon.ico
├── src/
│   ├── assets/
│   │   └── main.css
│   ├── components/
│   │   ├── base/
│   │   │   ├── BaseButton.vue
│   │   │   ├── BaseInput.vue
│   │   │   └── BaseModal.vue
│   │   ├── layout/
│   │   │   ├── AppNavbar.vue
│   │   │   └── AppFooter.vue
│   │   ├── memory/
│   │   │   ├── MemoryCard.vue
│   │   │   ├── MemoryForm.vue
│   │   │   └── MemorySkeleton.vue
│   │   ├── mood/
│   │   │   ├── MoodChart.vue
│   │   │   └── MoodLogForm.vue
│   │   ├── list/
│   │   │   ├── ListItem.vue
│   │   │   └── ListContainer.vue
│   │   └── map/
│   │       └── MemoryMap.vue
│   ├── composables/
│   │   ├── useCouple.js
│   │   ├── useMemories.js
│   │   ├── useMoodStats.js
│   │   └── useCountdown.js
│   ├── stores/
│   │   ├── auth.store.js
│   │   ├── couple.store.js
│   │   └── ui.store.js
│   ├── services/
│   │   ├── api.js
│   │   ├── auth.service.js
│   │   ├── memory.service.js
│   │   ├── mood.service.js
│   │   ├── list.service.js
│   │   └── couple.service.js
│   ├── views/
│   │   ├── LandingView.vue
│   │   ├── LoginView.vue
│   │   ├── RegisterView.vue
│   │   ├── PairView.vue
│   │   ├── DashboardView.vue
│   │   ├── MemoriesView.vue
│   │   ├── MemoryDetailView.vue
│   │   ├── MemoryFormView.vue
│   │   ├── MapView.vue
│   │   ├── ListsView.vue
│   │   ├── MoodView.vue
│   │   ├── DatesView.vue
│   │   ├── RandomiserView.vue
│   │   └── SettingsView.vue
│   ├── router/
│   │   └── index.js
│   ├── utils/
│   │   ├── date.js
│   │   └── validation.js
│   ├── App.vue
│   └── main.js
├── index.html
├── vite.config.js
└── package.json
```

Components are grouped by domain (memory, mood, list, map) rather than by type. This makes it easier to locate and reason about related components during implementation.

### 6.2 Backend

```
server/
├── src/
│   ├── db/
│   │   ├── schema.js
│   │   ├── index.js
│   │   ├── migrate.js
│   │   └── seed.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── couple.routes.js
│   │   ├── memory.routes.js
│   │   ├── mood.routes.js
│   │   ├── list.routes.js
│   │   ├── dates.routes.js
│   │   ├── randomiser.routes.js
│   │   └── proxy.routes.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   └── pair.middleware.js
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── couple.service.js
│   │   ├── memory.service.js
│   │   └── weather.service.js
│   ├── utils/
│   │   ├── uuid.js
│   │   └── hash.js
│   └── app.js
├── .env
├── .env.example
└── package.json
```

The services layer holds business logic. Route handlers are kept thin — they validate input, call a service, and return the result. Business logic never lives in a route handler directly.