> Working notes for COS30043 Interface Design and Development. Single source of truth for project-level decisions and justifications. Verbose by convention, capture everything, tidy later.

---

## 1. What Is Biku

Biku is a private, shared web application built exclusively for two people in a relationship. It is not a social platform and not a general-purpose productivity tool. It is a deliberately intimate digital space where a couple manages their shared life which are memories, important dates, shared lists, mood tracking, and date planning in one place.

The core concept is one couple, one shared data space. Every feature in the application exists within the context of that relationship. Nothing works in isolation.

---

## 2. Problem Statement
Couples currently rely on a fragmented set of general-purpose tools. WhatsApp for communication, Google Calendar for dates, Google Photos for memories, and various notes apps for lists. None of these tools are designed with the relationship as the primary context. They are shared incidentally, not intentionally.

The specific problems Biku addresses are as follows.
- **Memory preservation.** Photos exist in camera rolls, but the story, location, and emotional context around a shared experience is rarely captured alongside it. There is no shared, structured place to record what a moment meant.
- **Important dates.** Anniversaries, relationship milestones, and meaningful recurring dates are scattered across different calendars or simply forgotten. The significance of these dates is not reflected in any existing tool.
- **Date planning.** Deciding what to do together requires back-and-forth negotiation with no structured way to filter ideas by mood, budget, or time available.
- **Shared lists.** Bucket lists, grocery lists, and wishlists are managed in separate apps or buried in chat threads, leading to duplication and confusion between partners.
- **Mood awareness.** Neither partner has visibility into how the other is feeling over time. There is no lightweight, shared space for emotional check-ins.

---

## 3. Target Users
The primary user is someone in a committed relationship, aged roughly 18 to 35, who is comfortable using web and mobile applications daily.

The application is designed mobile-first. The majority of couple-related micro-interactions such as checking a shared list, logging a mood, viewing a memory happen on a phone, often in brief moments throughout the day. Desktop is a secondary context, used for longer interactions like creating a detailed memory entry.

---

## 4. Scope and Boundaries
Being explicit about what is and is not built is an engineering discipline. Scope creep is the primary risk in solo projects.

**In scope for this submission:**
- Two-user pairing system via invite code. 
- Memory journal with location tagging and Unsplash image integration. 
- Geographic memory map using Leaflet.js as the primary wow feature. 
- Important dates tracking with anniversary countdown. 
- Shared lists across three types: bucket, grocery, and wishlist. 
- Mood tracking with Chart.js visualisation. 
- Date night randomiser with AI-generated suggestions via Gemini 2.5 Flash, with graceful fallback to a locally seeded idea database.
- Solo setup mode — once a user creates or joins a couple record, the entire shared space (memories, lists, mood, dates, randomiser, settings) opens up immediately, even before a partner has joined. Rather than leaving that as an undocumented side effect (or blocking access until someone else shows up — which would leave the first partner staring at an empty screen, possibly for days), the experience is framed intentionally: a warm, persistent reminder card keeps the invite code visible until a partner actually joins, at which point the dashboard quietly switches into the full two-person view. The full reasoning behind choosing this hybrid approach over either "block solo access" or "say nothing" is written up in `docs/system_design.md` section 3.3, and should be lifted into the report's design-rationale section — it's a genuine, documented UX decision, not an oversight being explained away after the fact.

**Explicitly out of scope:**
- Real-time messaging or chat. 
- Push notifications or service workers. 
- Native mobile application. 
- More than two users per couple relationship. 
- Account deletion flow.


---

## 5. Tech Stack

### 5.1 Frontend

| Technology    | Role                    | Justification                                                                                                                                                                                                                                                                 |
| ------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vue 3         | UI framework            | Mandated by unit requirements                                                                                                                                                                                                                                                 |
| Vite          | Build tool              | Mandated; fast HMR and native ESM out of the box                                                                                                                                                                                                                              |
| Vue Router    | Client-side routing     | Official Vue routing solution; navigation guards for auth and pair state                                                                                                                                                                                                      |
| Pinia         | Global state management | Official Vue 3 state manager; simpler API than Vuex, better suited to the Composition API                                                                                                                                                                                     |
| TailwindCSS   | Styling and layout      | Utility-first framework that enforces a consistent design system through constrained tokens. Responsive prefixes keep breakpoint logic co-located with markup. Significantly faster to build and maintain consistent UI across 14 pages compared to hand-written stylesheets. |
| Chart.js      | Mood visualisation      | Lightweight, well-documented, clean integration via vue-chartjs                                                                                                                                                                                                               |
| Leaflet.js    | Interactive map         | Open-source, no API key, pairs with OpenStreetMap tiles                                                                                                                                                                                                                       |
| Vue Draggable | Drag-to-reorder         | Thin wrapper around SortableJS; uses the HTML5 Drag and Drop API                                                                                                                                                                                                              |

### 5.2 Backend

| Technology | Role                        | Justification                                                                                                                                                                                                                                                                                                    |
| ---------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bun        | Runtime and package manager | Faster startup, improved throughput over Node.js, built-in SQLite driver, built-in `.env` loading, and significantly faster dependency installation via binary lockfile caching                                                                                                                                  |
| Fastify    | HTTP framework              | Chosen over Express for built-in JSON Schema validation and measurably faster throughput. Express requires additional packages to achieve equivalent validation. Fastify forces thinking about request and response contracts upfront, which aligns with the schema-first approach used throughout this project. |
| Zod        | Business rule validation    | Complements Fastify's HTTP schema validation with application-level constraint enforcement                                                                                                                                                                                                                       |

**On Bun as runtime:** 
- Bun is used as both the package manager and the runtime. 
- Fastify compatibility with Bun has improved substantially through 2025, major frameworks including Fastify are confirmed compatible and run without code changes. 
	- The Fastify project officially targets Node.js as its primary runtime, so edge-case compatibility issues remain possible and would require debugging against Bun's Node.js compatibility layer. 
	- This risk is accepted and mitigated by a deliberate practice: the server is validated to boot and handle basic requests correctly before any application feature code is written on top of it. 
	- If a blocking compatibility issue is encountered at that stage, reverting to Node.js as the runtime is a configuration-level change that costs nothing because no feature code has been written yet.

Bun's built-in SQLite driver (`bun:sqlite`) is available as a fallback if Drizzle's Node.js SQLite driver presents compatibility issues during implementation. This is an additional advantage that only exists because Bun is used as the runtime, not just the package manager.

### 5.3 Database

| Technology  | Role                   | Justification                                                                                                                                                      |
| ----------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| SQLite      | Database engine        | Zero infrastructure, a single `.db` file, no server process required. Appropriate for a two-user personal application where concurrent write volume is negligible. |
| Drizzle ORM | Schema and query layer | Schema-first design where the schema file is the source of truth and types are inferred from it automatically. Lightweight, generates readable SQL, no magic.      |

SQLite serialises concurrent writes, which is a known limitation. For two users with a low probability of simultaneous writes, this is architecturally acceptable. A production system would migrate to PostgreSQL. This trade-off is documented intentionally.

Drizzle is chosen over Prisma because Prisma is optimised for PostgreSQL-first workflows and is significantly heavier. Drizzle is purpose-built for lightweight use cases and produces SQL that is readable and understandable.

### 5.4 Authentication
- JWT (JSON Web Tokens) stored in `httpOnly` cookies.
- Tokens in `localStorage` are accessible via JavaScript and therefore vulnerable to XSS attacks. `httpOnly` cookies cannot be read by JavaScript at all as they are sent automatically with requests by the browser. For an application storing personal relationship data, this is the correct choice. Password hashing uses bcrypt via Bun's built-in `Bun.password` API, which provides a secure, constant-time comparison and automatic salt generation.

### 5.5 External APIs

|API|Role|Cost|Authentication|
|---|---|---|---|
|Unsplash API|Memory background image search|Free, 50 requests per hour (demo tier)|API key, free, no credit card|
|Open-Meteo|Historical weather on memory dates|Free, no rate limit for non-commercial use|None : no key, no registration|
|Leaflet + OpenStreetMap|Interactive memory map tiles|Free, open-source|None|
|Google Gemini 2.5 Flash|AI-generated date night suggestions|Free tier via Google AI Studio|API key, free, no credit card|

**Why Open-Meteo over OpenWeatherMap:** 
- OpenWeatherMap's historical weather endpoints require a paid subscription and a credit card on file, even for the free tier.
- Open-Meteo provides over 80 years of historical weather data with no API key, no registration, and no credit card required. 
- This decision was made after evaluating both options and is documented as evidence of independent technical assessment.

**Unsplash attribution:** 
- Unsplash's API terms require that every displayed image attributes the photographer with a link to their Unsplash profile. This is implemented as a small attribution overlay on memory images throughout the application.

---

## 6. HD Feature Map

> **Status: verified against the finished build (2026-06-06).** This section was originally written during planning and described composables, components, and behaviours that changed shape during implementation — it has been corrected here to match what actually shipped, confirmed by reading the source files directly (not by re-describing the plan). This is the version to write the report from.

This section maps every HD-qualifying implementation to the rubric criterion it satisfies. Every item listed here must appear in the report's advanced techniques section. Anything not in the report is not awarded marks.

### 6.1 Advanced Vue Features

| Feature | What It Is | Where |
| --- | --- | --- |
| Composables | `useCountdown()` (`toValue()`-aware, supports `recursYearly`, cleans up its own `setInterval` on unmount) and `useMemories()` (pagination + `loadMore` + `hasMore`) — both genuinely reusable stateful logic extracted out of view components | `/dashboard`, `/dates`, `/memories` |
| Pinia stores as the composable-data layer | `auth.store.js`, `couple.store.js`, `ui.store.js` — each exposes computed getters (`isPaired`, `isLoggedIn`, `hasPartner`, `theme`) alongside actions, so views consume reactive shared state through `useXStore()` the same way they'd consume a composable | App-wide |
| `<Transition>` / `<TransitionGroup>` | Page transitions (`App.vue`, `mode="out-in"`), `BaseModal` fade+scale, `BaseSelect` dropdown, the mobile "more" sheet in `AppNavbar`, the randomiser's spin/result swap | Most views |
| CSS-keyframe entrance animations on shared base classes | `.card` (`card-enter`) and `.list-item` (`list-item-enter`) in `main.css`/`ListItem.vue` — a deliberate *alternative* to `<TransitionGroup>` so the effect applies to every card-based surface app-wide with zero per-view wiring, and survives `vue-draggable-plus`'s direct DOM manipulation. See `docs/frontend_design.md` §14.8 for why this was chosen over the more obvious `<TransitionGroup>` route | App-wide (memory cards, date cards, mood entries, list rows, settings sections, the randomiser idea card) |
| Dynamic async components + `Suspense` | `MemoryMap` is loaded via `defineAsyncComponent` and wrapped in `<Suspense>` in `MapView` — Leaflet (148KB) only enters the bundle when `/map` is visited | `/map` |
| Route-level code splitting | Every one of the 14 routes is a dynamic `import()` in `router/index.js`; verified in the production build — each view is its own 0.2–6KB chunk, heavy deps (`leaflet`, `chart.js`, `vue-draggable-plus`) are isolated to the routes that use them | All routes |
| Skeleton loading states | `MemorySkeleton` (shimmer animation matching `MemoryCard` dimensions exactly) shown while memories fetch — never a blank screen | `/memories`, `/dashboard` |
| Custom listbox component (`BaseSelect`) | Replaces the native `<select>` for the randomiser's budget/vibe filters — `role="listbox"`/`role="option"`, button trigger, click-outside-to-close, keyboard navigation, fully styleable open state (something a native `<select>` popup cannot be cross-platform) | `/randomiser` |

### 6.2 External API Integrations

|API|Integration Point|User Value|
|---|---|---|
|Unsplash|Memory creation — debounced (400ms) image search fires as the user types a title; images proxied through the backend so the API key never reaches the client|Rich, contextual memory visuals without requiring photo uploads, with required photographer attribution overlaid on the cover image|
|Open-Meteo|Memory detail — historical weather fetched once per memory+coordinate and permanently cached as JSON in the `memories` row; raw WMO weather codes (e.g. `53`) are translated through a full lookup table into readable phrases ("moderate drizzle")|Emotional context ("it was raining that day") presented in plain language, not a meteorological code|
|Nominatim (OpenStreetMap geocoding)|Memory form — debounced (500ms) place-name search returns a styled dropdown of matches; selecting one fills latitude/longitude/location name automatically (GPS capture remains as an alternative)|Lets someone attach a memory's location by typing "Damai Beach" instead of needing to be physically present to use GPS|
|Leaflet + OSM|`/map` — every memory with coordinates is plotted as a clickable pin that opens a popup linking to the memory detail|A visual geographic journey of the relationship, rendered without any API key|
|Gemini 2.5 Flash|Date randomiser — generates a personalised date idea (title, description, category, budget, duration, tags) from a constructed prompt reflecting the user's filters; response is parsed defensively (strips markdown fences, validates required fields) and falls back silently to 28 seeded ideas if the API is unavailable or the key is invalid|Fresh, contextual date suggestions beyond a static seed pool, with zero risk of the feature ever visibly "breaking"|

### 6.3 Performance Optimisations

|Optimisation|Implementation|Why It Matters|
|---|---|---|
|Weather response caching|Open-Meteo response stored as JSON in the `memories` table on first fetch, keyed by coordinate + date|Historical weather for a given date never changes — there is no reason to ever call the API twice for the same memory|
|Debounced search inputs|Unsplash search fires 400ms after the title input settles; Nominatim place search fires after 500ms|Prevents an API call firing on every keystroke while someone is still typing|
|Route-level code splitting|Dynamic `import()` per route produces per-route chunks confirmed in the build output (e.g. `leaflet` 148KB and `chart.js` 176KB load only on `/map` and `/mood` respectively, never on first paint)|Smaller initial bundle (53KB gzipped main chunk), faster first load on a mobile connection|
|Dynamic Leaflet import inside `onMounted`|`MemoryMap.vue` imports Leaflet itself (not just the wrapping component) only once the component actually mounts, with static PNG marker-icon imports so Vite hashes them correctly at build time|Keeps a 148KB mapping library out of every page that isn't the map, and sidesteps a real Vite/Leaflet path-resolution bug discovered during build (`new URL(...)` doesn't resolve `node_modules` assets through a dynamic import)|

### 6.4 Advanced UI Interactions

| Interaction | Technology | Where |
| --- | --- | --- |
| Dual-line mood chart | Chart.js via `vue-chartjs`, two datasets (this partner in blush, the other in slate) over a rolling 30-day window | `/mood` |
| Drag-to-reorder list items | `vue-draggable-plus`, persists the new order with a single batched `PATCH /api/lists/:type/reorder` call on drag-end (not one request per moved item) | `/lists` |
| Live anniversary / important-date countdowns | `useCountdown()` — `toValue()`-aware so it re-triggers when async couple data resolves after mount, supports `recursYearly` (always counts to the next future month/day occurrence), ticks every second via `setInterval`, cleans up on unmount | `/dashboard`, `/dates` |
| Clickable memory map pins | Leaflet.js — pins open a popup with a memory preview that links through to the full detail page | `/map` |
| Custom toggle switch | `DatesView`'s "recurs every year" control — a visually-hidden checkbox driving a styled pill track + sliding thumb via `:checked` sibling selectors, fully keyboard- and screen-reader-accessible (`clip: rect(0,0,0,0)`, not `display:none`) | `/dates` |
| Liquid-glass mobile navigation | `AppNavbar`'s bottom bar uses a three-layer `color-mix()` treatment (vertical opacity gradient + inset rim highlight + `blur(20px) saturate(160%)`) to read as translucent glass regardless of what's behind it — a flat `rgba()` + blur looked identical to opaque against this app's close-toned dark-mode surfaces, so the effect had to be built from depth cues rather than transparency alone | Mobile, all paired routes |
| Dark mode via `data-theme` | CSS custom properties (no class-toggling), defaults to the OS `prefers-color-scheme`, persisted via `localStorage`, and a blocking inline script in `index.html` sets the attribute *before* first paint to eliminate the light-mode flash on load | App-wide |

---

## 7. Verification Status (final, pre-submission)

The build is complete and verified. This is the result of running through the verification passes defined for this project (happy-path end-to-end, auth guards, dark mode, responsiveness, and edge cases) plus a closing live-API test of the real register-and-pair flow. Anything written here can be stated in the report as fact, not as a plan.

**Build health:** `npm run build` produces a clean Vite production build — 1824 modules, zero errors, zero warnings. Main bundle 53KB gzipped; heavy dependencies (`leaflet` 148KB, `chart.js` 176KB, `vue-draggable-plus` 47KB) are confirmed isolated to lazy per-route chunks that never touch the initial load.

**Happy-path, auth guards, dark mode, responsiveness, edge cases:** all passed. Where they didn't on first attempt, the bug was found and fixed (see `docs/system_design.md` and `.claude/CLAUDE.md` "Key Bugs Fixed" for the full list with root causes — these make excellent material for a "development process and problem solving" section, since each one demonstrates a real debugging process rather than a guess). Notable examples worth a mention in the report:
- A Drizzle ORM camelCase-vs-snake_case mismatch (`moodScore` vs `mood_score`) caused the mood log to silently show nothing despite the API working correctly — caught by reading the actual network response shape rather than assuming the contract.
- A Gemini API integration that *looked* broken (always falling back to seed data) turned out to have two independent causes layered on top of each other — a malformed request field (`thinkingConfig` nested at the wrong level, returning a silently-swallowed 400) and, after fixing that, a stale Windows environment variable shadowing the working key in `.env`. Diagnosing this required temporarily adding, then removing, structured logging to capture the live error from Google's API directly.
- A CSS specificity bug where a mobile-only override rule was silently losing to a later same-specificity base rule purely due to source order — fixed by moving the media query to the end of the stylesheet, with a comment explaining why so it doesn't regress.

**Final live-flow test (after the solo setup mode feature was added):** two fresh accounts were registered against the running backend, a couple was created, and the invite-code exchange was driven through the real API end-to-end. This confirmed the exact data shape the new `hasPartner` computed depends on:
- Before the second account joins: `GET /api/couples/me` returns `partnerBId: null`, `partner: null`, and the live invite code — so `couple.hasPartner` evaluates `false` and `PendingInviteBanner` renders with the real code.
- The instant the second account calls `POST /api/couples/join`: `partnerBId` becomes a populated UUID and `partner.displayName` resolves — `hasPartner` flips to `true`, the banner disappears, and the settings page shows the partner's real name in place of the "still finding their way to us" placeholder.

This is the project's actual register-and-pair flow, not a simulation of it — and it's the same JWT-reissue mechanism documented as bug fix #3 (`GET /api/auth/me` detects a `coupleId` mismatch between the JWT and the database and silently reissues the token) that makes the live flip visible without requiring a manual re-login.

**Post-verification fixes (discovered during real-device testing after the initial verification sign-off):** three additional bugs were found and resolved. Each is worth a sentence in the report's development-process section as evidence of continued quality practice:

- **List drag-to-reorder (500 on every attempt)** — `db.transaction()` in `list.routes.js` was being called as if it returned a deferred function (the raw `bun:sqlite` API), when Drizzle's version runs the callback immediately and returns its return value. The callback had no `return`, so the result was `undefined`, and calling `undefined()` threw a `TypeError` on every reorder attempt. Diagnosed by reproducing the error with a standalone script against the live database. Fixed: call `db.transaction(callback)` directly in one step.
- **Randomiser seed fallback returned 404 for sparse filter combos** — when Gemini's free-tier daily quota (20 requests/day) was exhausted and the exact filter combination (e.g. splurge + indoor + ≤240 min) had zero seed matches, the route returned a hard `404 NO_RESULTS` — a dead end on a feature that should always produce something. Fixed: `querySeeded()` now tries four progressively looser passes (all filters → drop duration → drop category → any idea) so the user always gets a result.
- **All 8 page bodies overflowed the right edge at 768px (tablet)** — discovered via iPad Mini DevTools. Every view had `width: 100%` in its base rule (= full viewport width), and the tablet media query added `margin-left: 64px` (sidebar), making the total box wider than the viewport by exactly the sidebar width. Fixed: added `max-width: min(Xpx, calc(100vw - var(--sidebar-w)))` to each view's tablet media query, capping content width to the available space after the sidebar without touching the centring behaviour at wider viewports.

---