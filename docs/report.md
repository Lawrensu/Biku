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
- Date night randomiser drawing from a locally seeded idea database.
- Unpaired user state that previews features to encourage pairing.

**Explicitly out of scope:**
- Real-time messaging or chat. 
- Push notifications or service workers. 
- AI-powered date suggestions (architecture is kept open for this extension, but it is not implemented). 
	- The AI extension for the date randomiser is a deliberate future hook. 
	- The `date_ideas` table is seeded locally for submission, but the randomiser route is designed so that an AI API call can be substituted as the data source later with minimal architectural change.
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
- Tokens in `localStorage` are accessible via JavaScript and therefore vulnerable to XSS attacks. `httpOnly` cookies cannot be read by JavaScript at all as they are sent automatically with requests by the browser. For an application storing personal relationship data, this is the correct choice. Password hashing uses argon2id, which is the current OWASP-recommended algorithm, preferred over bcrypt for new systems.

### 5.5 External APIs

|API|Role|Cost|Authentication|
|---|---|---|---|
|Unsplash API|Memory background image search|Free, 50 requests per hour (demo tier)|API key, free, no credit card|
|Open-Meteo|Historical weather on memory dates|Free, no rate limit for non-commercial use|None — no key, no registration|
|Leaflet + OpenStreetMap|Interactive memory map tiles|Free, open-source|None|

**Why Open-Meteo over OpenWeatherMap:** 
- OpenWeatherMap's historical weather endpoints require a paid subscription and a credit card on file, even for the free tier.
- Open-Meteo provides over 80 years of historical weather data with no API key, no registration, and no credit card required. 
- This decision was made after evaluating both options and is documented as evidence of independent technical assessment.

**Unsplash attribution:** 
- Unsplash's API terms require that every displayed image attributes the photographer with a link to their Unsplash profile. This is implemented as a small attribution overlay on memory images throughout the application.

---

## 6. HD Feature Map
This section maps every HD-qualifying implementation to the rubric criterion it satisfies. Every item listed here must appear in the report's advanced techniques section. Anything not in the report is not awarded marks.

### 6.1 Advanced Vue Features

| Feature                    | What It Is                                                                                                             | Where                     |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| Composables                | `useCouple()`, `useMemories()`, `useMoodStats()`, `useCountdown()` : reusable stateful logic extracted from components | App-wide                  |
| Vue Transition API         | Animated page transitions, memory card enter/leave, list item add/remove animations                                    | All pages                 |
| Dynamic async components   | Map component loaded only when `/map` is visited, not on initial bundle load                                           | `/map`                    |
| Route-level code splitting | Dynamic imports in router config split the bundle by route                                                             | All routes                |
| Skeleton loading states    | Custom skeleton components shown while data fetches, never a blank screen                                              | `/memories`, `/dashboard` |

### 6.2 External API Integrations

|API|Integration Point|User Value|
|---|---|---|
|Unsplash|Memory creation — debounced image search fires as the user types a title|Rich, contextual memory visuals without requiring photo uploads|
|Open-Meteo|Memory detail — historical weather fetched once per memory and cached permanently|Emotional context ("it was raining that day")|
|Leaflet + OSM|`/map` — every memory with coordinates is plotted as a clickable pin|A visual geographic journey of the relationship|

### 6.3 Performance Optimisations

|Optimisation|Implementation|Why It Matters|
|---|---|---|
|Weather response caching|Open-Meteo response stored as JSON in the `memories` table on first fetch|Historical weather for a given date never changes — no reason to call the API twice|
|Debounced Unsplash search|Image search fires after a 400ms pause in typing|Prevents unnecessary API calls on every keystroke|
|Lazy image loading|Intersection Observer on memory card images|Defers off-screen image loads in the journal feed|
|Route-level code splitting|Dynamic imports produce per-route chunks|Reduces initial bundle size, faster first load|

### 6.4 Advanced UI Interactions

| Interaction                | Technology                                                            | Where                  |
| -------------------------- | --------------------------------------------------------------------- | ---------------------- |
| Dual-line mood chart       | Chart.js via vue-chartjs — both partners' 30-day mood overlaid        | `/mood`                |
| Drag-to-reorder list items | Vue Draggable (SortableJS)                                            | `/lists`               |
| Live anniversary countdown | `useCountdown()` composable with `setInterval`, cleaned up on unmount | `/dashboard`, `/dates` |
| Clickable memory map pins  | Leaflet.js — pins open a memory preview card                          | `/map`                 |
| Animated page transitions  | Vue `<Transition>` component with CSS                                 | All routes             |

---