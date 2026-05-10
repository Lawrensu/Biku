# Biku — COS30043 Interface Design and Development

Biku is a private, shared web application built exclusively for two people in a relationship. It is not a social platform and not a general-purpose productivity tool. It is a deliberately intimate digital space where a couple manages their shared life:

    - memories
    - important dates
    - shared lists
    - mood tracking
    - date night planning 

in one place.

## Features (As of now)

- **Memory Journal** : Record shared experiences with location tagging, Unsplash imagery, and historical weather context via Open-Meteo
- **Memory Map** : An interactive Leaflet.js map plotting every memory as a clickable pin
- **Important Dates** : Track anniversaries and milestones with live countdown timers
- **Shared Lists** : Bucket list, grocery list, and wishlist with drag-to-reorder
- **Mood Tracking** : Daily emotional check-ins with a dual-line Chart.js visualisation across both partners
- **Date Night Randomiser** : AI-generated suggestions via Gemini 2.5 Flash, with a seeded local fallback

## Documentation

1. [Getting Started](docs/getting_started.md)
2. [Development Convention](docs/development_convention.md)
3. [Architecture / System Design](docs/system_design.md)
4. [Frontend Design](docs/frontend_design.md)
5. [Report](docs/report.md)

## Tech Stack

| Layer    | Technology                              |
|----------|-----------------------------------------|
| Frontend | Vue 3, Vite, Tailwind CSS v4, Pinia, Vue Router |
| Backend  | Bun, Fastify v4, Zod                    |
| Database | SQLite, Drizzle ORM                     |
| Auth     | JWT in `httpOnly` cookies (`jose`)      |
| APIs     | Unsplash, Open-Meteo, Gemini 2.5 Flash, Leaflet + OSM |

---
