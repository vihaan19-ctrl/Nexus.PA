# NEXUS — Personal AI Command Center

Local-first productivity OS: tasks, projects (with a robotics template), a
backlog planner with a time calculator, a school hub, notes, an idea vault
with one-click "convert to project," a calendar, reminders, a focus timer,
goals, data-driven analytics, global search/command palette (Ctrl/Cmd K),
quick capture (Ctrl/Cmd Shift Space) — plus a JARVIS-style AI layer: a
multi-conversation NEXUS AI with voice input/output, natural-language
actions with confirmation, an animated AI Core status widget, a Recent
History log of everything meaningful you do, and a PIN-protected API Vault
with multi-provider (Gemini/Groq/NVIDIA) key storage and automatic fallback.

## Status

Every screen saves/edits/deletes/filters/persists for real — nothing here
is a mockup. Data lives in the browser (`localStorage`, key
`nexus_data_v1`); API keys live only on your own backend
(`server/data/vault.json`, git-ignored), never in the browser or frontend
bundle.

## Running it

**Frontend:**
```
npm install
npm run dev       # http://localhost:5173
```

**Backend** (optional — only needed for real AI conversation, voice replies
routed through a provider, and the API Vault; local mode works without it):
```
cd server
npm install
cp .env.example .env      # optional: set NVIDIA_API_KEY for zero-config mode
npm start                 # http://localhost:8787
```

Configure providers in-app instead of `.env` via **Settings → API Vault**
(set a PIN, add Gemini/Groq/NVIDIA keys, reorder fallback priority, test
each key's connection).

## What's new in this upgrade

- **NEXUS AI Core** — animated status ring (idle/listening/thinking/
  executing/speaking) on the Dashboard and AI page.
- **Multi-conversation AI** — new/rename/delete/search conversations, not
  one giant thread.
- **Voice** — Web Speech API for input (mic button, live transcript,
  auto-send on final result) and speech synthesis for replies (toggle in
  Settings → Voice). Clean fallback message if the browser doesn't support
  it; text always works regardless.
- **Natural-language actions** — "create a task called finish physics
  lecture tomorrow" or "remind me to call mom at 6pm" get parsed and shown
  as a Confirm/Cancel step before anything is created.
- **Live web answers** — stock and weather questions hit free, keyless
  APIs (Stooq, Open-Meteo) via the backend and are labeled with source +
  timestamp; the AI never fabricates current data.
- **Recent History** — every task/project/note/reminder/backlog/focus/
  AI/web-query event is logged with timestamp, searchable, filterable,
  clickable through to the related item.
- **API Vault** (`Settings → API Vault`) — PIN-gated. Keys are stored and
  used entirely server-side; the frontend only ever sees a masked
  `••••••1234` version. Supports multiple keys per provider with priority
  ordering, per-key enable/disable, connection testing, and automatic
  fallback (key → key → next provider) on rate limits/invalid keys/errors.
- **System status strip** on the Dashboard (AI/database/voice availability,
  logged-event count).

## Project structure

```
src/
  components/ui/       Reusable primitives (Button, Modal, Card, Badge, Tabs, ...)
  components/          CommandPalette, QuickCapture, QuickAddMenu, AICore
  layouts/              AppShell, Sidebar, TopBar
  features/<domain>/   tasks, projects, backlog, school, notes, ideas,
                        calendar, reminders, focus, goals, analytics,
                        ai (chat, actions, web queries), history, settings
  data/store.tsx        Central reducer + localStorage persistence + CRUD + migration
  data/demoData.ts       Seed data, tagged isDemo: true
  types/index.ts         All entity types
  lib/                    quickAddParser, speech (Web Speech API), pin, vaultClient

server/
  index.js               Express app — chat w/ fallback, vault CRUD, web data
  vaultStore.js           Server-side key storage (server/data/vault.json)
  providerAdapters.js     Gemini / Groq / NVIDIA request normalization
  webData.js              Free stock (Stooq) + weather (Open-Meteo) lookups
```

Adding a new module: add types to `types/index.ts`, add an array + entity
key to `NexusData`/`EntityKey` in `store.tsx` (and to `migrate()` so
existing saved data upgrades cleanly), add a `features/<name>/` folder,
register a route in `App.tsx` and a sidebar entry in `layouts/Sidebar.tsx`.

## Data & privacy

Personal data (tasks, projects, notes, etc.) lives in your browser only.
API keys live only on your backend, never in frontend code or the browser.
The Vault's PIN is a UI-level gate, not encryption — the real protection is
that raw keys never leave the server. Settings → Data still has full
export/import/reset; Settings → Privacy shows and can clear stored AI
conversations and history independently of the rest of your data.

## What's still not built (by design)

- Light/system theme, compact density — hooks exist, only dark/comfortable
  is implemented.
- Cloud sync / auth / multi-device — local-first for now.
- Background push notifications for reminders — permission request works;
  scheduling a `Notification` while the tab is closed needs a service
  worker.
- News lookups — stock/weather use free keyless APIs; news generally
  requires a paid/keyed API, so it's not wired up.
- PWA/offline install, file uploads, GitHub/Calendar integrations.

## Design

Dark graphite background, cyan/teal accents concentrated around the AI Core
and system-status elements, restrained technical HUD details rather than a
full sci-fi overhaul — the rest of the app keeps its original calm,
practical productivity-tool look.
