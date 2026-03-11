# The Depths

A Zork-style text adventure portfolio website for Alex Herman. Visitors explore interconnected rooms, solve puzzles, collect items, and converse with a Claude Sonnet-powered dungeon master narrator to discover Alex's bio, projects, resume, and writing.

Built with React + Vite on the frontend and Express + Anthropic API on the backend.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Architecture Overview](#architecture-overview)
- [Frontend](#frontend)
  - [State Management](#state-management)
  - [Command Pipeline](#command-pipeline)
  - [Components](#components)
  - [Game Data](#game-data)
  - [Audio System](#audio-system)
- [Backend](#backend)
  - [Express Server](#express-server)
  - [AI Communication](#ai-communication)
  - [Prompt Architecture](#prompt-architecture)
  - [Response Parsing](#response-parsing)
- [Game Mechanics](#game-mechanics)
  - [Game Phases](#game-phases)
  - [Entrance Puzzle (5 Methods)](#entrance-puzzle-5-methods)
  - [Room Navigation](#room-navigation)
  - [Items and Inventory](#items-and-inventory)
  - [AI-Created Items](#ai-created-items)
  - [Logbooks](#logbooks)
- [Key Design Decisions](#key-design-decisions)
- [Development Notes](#development-notes)

---

## Quick Start

**Prerequisites:** Node.js 18+, an Anthropic API key.

1. Clone the repo and install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file in the project root:
   ```
   ANTHROPIC_API_KEY=your_key_here
   ```

3. Start both servers (two terminals):
   ```
   # Terminal 1 — Frontend (port 5173)
   npm run dev

   # Terminal 2 — Backend (port 3001)
   node --env-file=.env server/index.js
   ```

4. Open `http://localhost:5173` in a browser.

> **Windows note:** If `npm run dev` fails with ENOENT, run `node node_modules/vite/bin/vite.js` directly.

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React (JSX, no TypeScript) | 19.1.0 |
| Build | Vite | 6.3.5 |
| Styling | Custom CSS (CRT effects, no framework) | — |
| Font | IBM Plex Mono (Google Fonts) | — |
| Audio | Tone.js (procedural synthesis) | 15.1.22 |
| Backend | Express | 5.1.0 |
| AI | Anthropic SDK → Claude Sonnet | 0.39.0 |
| Rate Limiting | express-rate-limit | 7.5.0 |

---

## Project Structure

```
the-depths/
├── index.html                          # Vite entry point
├── package.json
├── vite.config.js                      # Vite config + API proxy
├── .env                                # ANTHROPIC_API_KEY (not committed)
├── site-content.md                     # Source of truth for all Alex content
├── DEVELOPMENT_PLAN.md                 # Master 8-phase plan
├── CLAUDE.md                           # AI assistant project conventions
│
├── server/                             # Express backend
│   ├── index.js                        # Server entry, CORS, rate limiter
│   ├── routes/
│   │   └── chat.js                     # POST /api/chat — AI endpoint
│   └── prompts/
│       ├── assemblePrompt.js           # Combines all prompt modules
│       ├── basePrompt.js               # Narrator personality + rules
│       ├── entrancePrompt.js           # Jailbreak puzzle narrator
│       ├── roomContext.js              # Serializes game state for AI
│       └── alexContent.js             # Per-room content from site-content.md
│
└── src/                                # React frontend
    ├── main.jsx                        # React DOM root (no StrictMode)
    ├── App.jsx                         # Root orchestrator
    ├── index.css                       # Global styles, CSS vars, CRT palette
    │
    ├── engine/                         # Game logic (pure functions)
    │   ├── commandParser.js            # Raw input → command objects
    │   ├── commandHandler.js           # Command → { output[], actions[] }
    │   ├── gameReducer.js              # useReducer reducer + ACTIONS
    │   └── initialState.js             # Default game state shape
    │
    ├── data/                           # Static game content
    │   ├── rooms.js                    # 9 room definitions
    │   ├── items.js                    # 8 item definitions
    │   └── logbooks.js                 # 3 paginated logbooks
    │
    ├── audio/                          # Procedural audio (Tone.js)
    │   ├── audioEngine.js              # Singleton: init, master gain, CRT hum
    │   ├── effects.js                  # One-shot sound effects
    │   └── ambients.js                 # Per-room procedural soundscapes
    │
    ├── hooks/                          # React hooks
    │   ├── useAudio.js                 # Audio lifecycle + mute state
    │   ├── useCommandHistory.js        # Arrow-key command recall
    │   └── useKeyboardShortcuts.js     # Global i/m/ESC/arrows/q
    │
    └── components/                     # UI components
        ├── Terminal/Terminal.jsx        # Core terminal with typewriter queue
        ├── CRTScreen/CRTScreen.jsx     # CRT visual wrapper (scanlines, glow)
        ├── BootSequence/BootSequence.jsx  # Boot animation
        ├── InventoryPanel/InventoryPanel.jsx  # Slide-in inventory
        ├── MapPanel/MapPanel.jsx       # Slide-in ASCII map
        ├── MiniInventory/MiniInventory.jsx  # Compact inventory widget
        ├── MiniMap/MiniMap.jsx          # Compact map widget
        ├── Logbook/Logbook.jsx         # Full-screen paginated reader
        └── MuteToggle/MuteToggle.jsx   # Audio mute button
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     BROWSER                              │
│                                                          │
│  User Input                                              │
│      │                                                   │
│      ▼                                                   │
│  parseCommand(raw) ──→ { type, target, ... }            │
│      │                                                   │
│      ▼                                                   │
│  handleGameCommand(parsed, state)                        │
│      │                                                   │
│      ├──→ { output[], actions[] }  ← local commands      │
│      │         │                                         │
│      │         ├──→ dispatch(actions) to gameReducer      │
│      │         └──→ terminal.addLines(output)            │
│      │                                                   │
│      └──→ { aiRequest }  ← unknown/whisper commands      │
│               │                                          │
│               ▼                                          │
│         fetch('/api/chat')                               │
│               │                                          │
└───────────────│──────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────┐
│                   EXPRESS SERVER                         │
│                                                          │
│  POST /api/chat                                         │
│      │                                                   │
│      ├──→ assembleSystemPrompt(gameState)                │
│      │         │                                         │
│      │         ├── basePrompt (narrator voice + rules)   │
│      │         ├── alexContent[room] (bio/projects)      │
│      │         ├── roomContext (state serialization)      │
│      │         └── responseFormat (JSON schema)          │
│      │                                                   │
│      ├──→ Anthropic API (claude-sonnet-4-20250514)       │
│      │                                                   │
│      └──→ Parse + validate JSON response                │
│               │                                          │
│               ▼                                          │
│  { narrative, stateChanges, jailbreakSuccess }          │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Frontend

### State Management

All game state lives in a single `useReducer` in `App.jsx`. No localStorage — state resets on page refresh.

**State shape** (`initialState.js`):
```js
{
  phase: 'entrance',          // 'entrance' | 'boot' | 'playing'
  currentRoom: 'entrance',    // Room ID string
  visitedRooms: ['entrance'], // For map fog-of-war
  inventory: [],              // Array of { id, name, icon, description }
  panelOpen: null,            // null | 'inventory' | 'map'
  logbookOpen: null,          // null | logbook ID string
  logbookPage: 0,             // Current page index
  flags: {},                  // Arbitrary game flags (e.g. read_tree_journal)
  roomItemsTaken: {},         // { roomId: [itemId, ...] }
  conversationHistory: [],    // AI chat history (max 20 messages)
  aiLoading: false,           // Disables input while waiting for AI
  jailbreakAttempts: 0,       // Entrance attempt counter
}
```

**Reducer actions** (`gameReducer.js`):

| Action | Effect |
|--------|--------|
| `MOVE_TO_ROOM` | Updates room, adds to visited, clears panels + conversation |
| `ADD_ITEM` | Adds item to inventory + tracks in roomItemsTaken (idempotent) |
| `REMOVE_ITEM` | Removes item from inventory |
| `TOGGLE_PANEL` | Opens/closes inventory or map panel |
| `CLOSE_PANELS` | Closes all panels |
| `OPEN_LOGBOOK` | Opens a logbook by ID, resets page, closes panels |
| `CLOSE_LOGBOOK` | Closes logbook |
| `LOGBOOK_NEXT_PAGE` / `LOGBOOK_PREV_PAGE` | Navigate logbook pages |
| `SET_FLAG` | Sets a game flag (for puzzle progress) |
| `SET_PHASE` | Changes game phase |
| `ADD_CONVERSATION_MESSAGE` | Adds to chat history (FIFO, max 20) |
| `SET_AI_LOADING` | Toggles loading state |
| `INCREMENT_JAILBREAK_ATTEMPTS` | Tracks entrance attempts |

### Command Pipeline

The command flow is a three-stage pipeline:

1. **Parse** (`commandParser.js`): Raw string → structured command object
   - Recognizes verbs: `go`, `look`, `examine`, `take`, `use`, `inventory`, `map`, `help`, `whisper`, `combine`, `listen`, `knock`, `smell`, `taste`, `touch`
   - Handles aliases: `x` → examine, `n` → go north, `l` → look, `i` → inventory, `get` → take
   - Parses `open [target]` as examine (enables "open drawer")
   - Navigation phrases: "climb tree", "approach tree" → go with direction
   - Easter eggs: xyzzy, plugh, plover, hello sailor, sing, dance, scream, yell
   - Unknown input → `{ type: 'unknown', raw: input }` (routed to AI)

2. **Handle** (`commandHandler.js`): Command + state → result object
   - Returns `{ output: string[], actions: Action[], roomHeader?, doorOpens?, aiRequest? }`
   - Pure function (doesn't mutate state)
   - Shell commands (`ls`, `cd`, `cat`, `pwd`, `whoami`) intercepted during entrance phase only
   - Unknown commands fall through to AI via `aiRequest`

3. **Dispatch** (`App.jsx`): Processes the result
   - Dispatches actions to reducer
   - Renders output via `terminal.addLines()`
   - If `aiRequest` present, calls backend and handles response
   - If `doorOpens` true, triggers entrance-to-playing transition

### Components

**Terminal** (`Terminal.jsx`)
- Core interactive terminal with typewriter effect
- Exposes imperative API via `useImperativeHandle`:
  - `addLines(texts, options)` — Queue lines for typewriter display
  - `setRoomHeader(header)` — Set sticky room name + ASCII art
  - `clearLines()` — Clear all output (used on room transitions)
  - `getInputRef()` — Access input element for focus management
- Supports mixed output: plain strings and `{ text, type, typewriter }` objects
- ASCII art rendered instantly (`typewriter: false`) with `line-height: 1.2`
- Queue-based typewriter with skip-on-keypress (any key commits all pending text)
- Command history via `useCommandHistory` hook (arrow keys)
- Input disabled during AI loading and logbook viewing
- Keystroke sound effect fires per character (skips spaces)

**CRTScreen** (`CRTScreen.jsx`)
- Pure CSS wrapper providing retro CRT monitor aesthetics
- Effects: scanlines, flicker animation, phosphor glow, vignette darkening, barrel distortion (curvature)
- Contains the MuteToggle button
- All children render inside the CRT frame

**BootSequence** (`BootSequence.jsx`)
- Self-contained async step sequencer
- Plays when transitioning from entrance to playing phase
- Boot line sounds with escalating pitch
- Calls `onComplete` when finished → sets phase to 'playing'

**InventoryPanel** / **MapPanel**
- Slide-in panels using CSS transforms (position absolute)
- Inventory slides from left, Map from right
- Items show icon, name, description; downloadable items get a link
- Map uses ASCII art with fog-of-war (unvisited rooms hidden)

**MiniInventory** / **MiniMap**
- Compact always-visible widgets showing item count/icons and current room indicator
- Click to open full panels
- Positioned at z-index 4 (below panels at z-index 5)

**Logbook** (`Logbook.jsx`)
- Full-screen overlay with Unicode box-drawing border
- Paginated content with ← / → arrows
- Content preserves Alex's writing voice

### Game Data

**Rooms** (`rooms.js`) — 9 rooms organized in two clusters:

| Room | Cluster | Key Content |
|------|---------|------------|
| `entrance` | outdoor | Starting room, iron gate, puzzle |
| `grounds` | outdoor | Garden path, stone walls |
| `tree` | outdoor | Ancient tree, journal, paracord |
| `grand_hall` | indoor | Central hub, portrait, inscription |
| `archive` | indoor | Bookshelves, journal, letters |
| `workshop` | indoor | Workbench, blueprints, gear |
| `study` | indoor | Desk, sealed letter, clock |
| `signal_room` | indoor | Radio equipment, crystal, static |
| `vault` | indoor | Endgame room (Phase 7) |

Each room has: `name`, `description`, `asciiArt[]`, `exits {}`, `objects {}`, `items {}`, `aliases {}`, `hiddenInteractions {}`, `cluster`.

**Items** (`items.js`) — 8 static items:

| ID | Name | Vault Clue | Has Link |
|----|------|-----------|----------|
| `golden_compass` | Golden Compass | Yes | No |
| `dusty_tome` | Dusty Tome | Yes | No |
| `blueprints` | Set of Blueprints | No | Yes (resume PDF) |
| `strange_gear` | Strange Gear | Yes | No |
| `sealed_letter` | Sealed Letter | No | Yes (resume PDF) |
| `radio_crystal` | Radio Crystal | Yes | No |
| `paracord` | Length of Paracord | No | No |
| `iron_key` | Iron Key | No | No |

Items can also be created dynamically by the AI narrator (see [AI-Created Items](#ai-created-items)).

**Logbooks** (`logbooks.js`) — 3 paginated texts preserving Alex's voice:
- Agora logbook (9 pages)
- Strawberry logbook (7 pages)
- Tree journal (5 pages)

### Audio System

All audio is procedurally synthesized with Tone.js — no audio files.

**AudioEngine** (`audioEngine.js`) — Singleton managing:
- `Tone.start()` initialization (triggered by first user gesture)
- Master gain node (0.8 volume, ramps to 0 on mute)
- Persistent 60Hz CRT hum (very quiet sine wave)
- Mute toggle (used by MuteToggle component)

**Effects** (`effects.js`) — One-shot sounds:
- `keystroke` — Fires per character during typewriter (skips spaces)
- `roomTransition` — On MOVE_TO_ROOM action
- `itemPickup` — On ADD_ITEM action
- `panelOpen` / `panelClose` — Panel slide sounds
- `logbookOpen` / `logbookClose` — Logbook overlay sounds
- `pageTurn` — Logbook page navigation
- `bootTick` — Escalating pitch blips during boot sequence
- `jailbreakSuccess` — Entrance door opening

**Ambients** (`ambients.js`) — Per-room procedural soundscapes with crossfade:

| Room | Soundscape |
|------|-----------|
| entrance | Brown noise wind + 80Hz drone |
| grounds | Pink noise wind + random bird chirps |
| tree | Filtered leaf rustle + periodic rope creaks |
| grand_hall | Detuned sine drones (55/56.5Hz beat) + quiet noise |
| archive | Very quiet brown noise + occasional crackle |
| workshop | 60Hz sawtooth hum + random sparks + ticking |
| study | Clock tick (1s interval) + quiet 65Hz drone |
| signal_room | Bandpass radio static + random morse beep patterns |
| vault | Ultra-low 30Hz drone + slow sine pulses |

The `AmbientManager` handles crossfading: when the player moves rooms, the old ambient fades out over 1 second while the new one fades in.

**Audio activation:** No autoplay. Tone.js initializes on the first real user gesture (click or keypress) via `useAudio` hook. A mute toggle (`[~]`/`[x]`) sits in the bottom-right corner.

---

## Backend

### Express Server

**Entry point:** `server/index.js`

- Runs on port 3001 (configurable via `PORT` env var)
- CORS configured for `http://localhost:5173` (frontend dev server)
- Rate limiting: 30 requests per 60 seconds per IP, with in-character error messages
- Two endpoints:
  - `POST /api/chat` — Main AI chat endpoint
  - `GET /api/health` — Health check

**Vite proxy:** The frontend dev server proxies `/api` requests to `localhost:3001` (configured in `vite.config.js`), so the browser only talks to port 5173.

### AI Communication

**Request flow** (initiated from `App.jsx`):

1. User types an unrecognized command or whisper
2. `commandHandler` returns `{ aiRequest: { message } }`
3. `App.jsx` sets `aiLoading: true`, adds user message to conversation history
4. Frontend sends `POST /api/chat` with:
   ```json
   {
     "message": "the user's input",
     "gameState": {
       "currentRoom": "grand_hall",
       "visitedRooms": ["entrance", "grand_hall"],
       "inventory": [{ "id": "golden_compass", "name": "Golden Compass" }],
       "flags": { "read_tree_journal": true },
       "roomItemsTaken": { "grand_hall": ["golden_compass"] },
       "conversationHistory": [
         { "role": "user", "content": "..." },
         { "role": "assistant", "content": "..." }
       ],
       "jailbreakAttempts": 3,
       "currentRoomItems": [
         { "id": "dusty_tome", "name": "Dusty Tome", "keywords": ["tome", "book"] }
       ]
     }
   }
   ```
5. Backend assembles a system prompt, calls Claude Sonnet, parses the response
6. Returns `{ narrative, stateChanges, jailbreakSuccess }` to frontend
7. Frontend displays narrative via typewriter, dispatches any state changes

**AI model:** `claude-sonnet-4-20250514` with `max_tokens: 400`.

**Conversation history:** Maintained in frontend state, capped at 20 messages (FIFO). Cleared when the player navigates to a new room. Sent with each request so the AI has conversational context.

### Prompt Architecture

The system prompt is assembled dynamically per request by `assemblePrompt.js`:

```
[basePrompt or entrancePrompt]   ← Narrator personality + rules
[alexContent for current room]   ← Factual content about Alex
[roomContext]                    ← Serialized game state
[responseFormat]                 ← JSON response schema
```

**basePrompt.js** — Defines the narrator personality:
- Classic Zork dungeon master: dry-witted, atmospheric, sardonic
- Never breaks character or acknowledges being AI
- Keeps responses to 2-4 sentences
- Knows everything about Alex Herman from provided content
- Won't help with out-of-game tasks
- Includes item creation rules (when/how to create items)

**entrancePrompt.js** — Special narrator for the jailbreak puzzle:
- Ephemeral narrator voice (not a "guardian" or "gatekeeper")
- Each attempt judged on its own merit (no escalation, no hint system)
- Rewards genuine creativity, rejects brute force
- On success, includes `<<DOOR_OPENS>>` marker in response

**alexContent.js** — Per-room factual content about Alex extracted from `site-content.md`. Each room maps to relevant content (e.g., workshop has projects, archive has writing, study has personal details).

**roomContext.js** — Serializes current game state into text for the AI:
```
CURRENT LOCATION: grand_hall
ROOMS VISITED: entrance, grounds, grand_hall
PLAYER INVENTORY: golden_compass: Golden Compass, dusty_tome: Dusty Tome
ITEMS TAKEN (ALL ROOMS): grand_hall: golden_compass; archive: dusty_tome
ITEMS AVAILABLE IN THIS ROOM: Strange Gear (keywords: gear, strange gear)
GAME FLAGS: read_tree_journal=true
```

This gives the AI full awareness of inventory (preventing duplicate item creation), taken items across all rooms (for consistency), and available static items in the current room.

**responseFormat** — Specifies the JSON schema the AI must return:
```json
{
  "narrative": "Text the player sees in the terminal.",
  "stateChanges": {
    "addFlag": null,
    "createItem": null
  }
}
```

### Response Parsing

The backend (`chat.js`) handles several edge cases in AI responses:

1. **Markdown stripping:** Removes `` ```json `` code fences that Claude sometimes adds
2. **Direct JSON parse:** Tries `JSON.parse(rawText)` first
3. **Embedded JSON fallback:** If parse fails, uses regex to find JSON embedded within narrative text: `rawText.match(/\{[\s\S]*"narrative"\s*:[\s\S]*\}/)`. This handles cases where the AI writes prose before the JSON block.
4. **Plain text fallback:** If no JSON found at all, the raw text becomes the narrative

**createItem validation:** If `stateChanges.createItem` is present:
- Requires `id`, `name`, `icon`, `description` — strips the item if any are missing
- Forces `realLink: null` (AI cannot create downloadable items)
- Forces `isVaultClue: false` (AI cannot create vault-relevant items)
- Casts all fields to `String` and caps description at 300 characters

**Jailbreak detection:** If the narrative contains `<<DOOR_OPENS>>`, it's stripped from the text and `jailbreakSuccess: true` is returned, triggering the entrance-to-playing transition on the frontend.

---

## Game Mechanics

### Game Phases

The game has three phases:

1. **`entrance`** — Player starts outside, must solve the entrance puzzle. All game UI (terminal, panels, logbook) is functional. Three outdoor rooms accessible (entrance, grounds, tree).

2. **`boot`** — Transition animation. A boot sequence plays with escalating blip sounds, simulating a computer booting up. Triggers when the entrance door opens.

3. **`playing`** — Full exploration. All 9 rooms accessible, AI narrator active, items collectible.

### Entrance Puzzle (5 Methods)

There are 5 ways to open the entrance door, any of which triggers `doorOpens: true`:

1. **The Explorer** — Read the tree journal → listen at the tree (hear jingling) → examine branches (auto-adds iron_key) → use key on door

2. **The Knock** — Type `knock` at the entrance door

3. **The Hacker** — Use shell commands at the entrance (`ls`, `cd`, `cat`, `pwd`, `whoami`). A virtual filesystem is defined in `commandHandler.js`. Typing `cat secret/key.txt` opens the door.

4. **The Brute** — Take paracord from tree → examine crossbars (notice corrosion) → use paracord on crossbar

5. **The Jailbreak** — Talk to the AI narrator with creative prompts. The narrator judges each attempt independently. No hints, no escalation. Rewards genuine creativity (elaborate reframing, creative roleplay, clever narrative tricks). On success, AI includes `<<DOOR_OPENS>>` marker.

All methods trigger: jailbreak success sound → 4-second delay → move to grand_hall → boot sequence → playing phase.

### Room Navigation

Rooms define exits as direction-to-roomId maps. The `handleGo` function checks if the requested direction exists in the current room's exits. Some rooms have aliases (e.g., "upstairs" → "up").

On room move:
- Terminal is cleared
- Room header (name + ASCII art) is set as sticky
- Room description is displayed via typewriter
- Conversation history is cleared
- Ambient sound crossfades to new room
- `roomTransition` sound effect plays

### Items and Inventory

**Static items** are defined in `rooms.js` and `items.js`. Each room can have `items` (takeable) and `objects` (examinable but not takeable). When a player takes a static item:
- Item is added to inventory
- Item ID is tracked in `roomItemsTaken[roomId]`
- Item no longer appears in room descriptions (filtered out on `look`)
- `itemPickup` sound effect plays

**The `take` command** follows this priority:
1. Check room's static items by keyword → take if found
2. Check room's objects by keyword → "not something you can take"
3. Check inventory → "You already have that in your pack"
4. Fall through to AI → AI decides whether to create the item

### AI-Created Items

The AI narrator can dynamically create items during conversations. When a player explores or interacts in ways that narratively produce a discovery, the AI includes a `createItem` in its response:

```json
{
  "narrative": "Behind the loose stone, your fingers close around something cold and round...",
  "stateChanges": {
    "createItem": {
      "id": "copper_spring",
      "name": "Copper Spring",
      "icon": "🔩",
      "description": "A tightly wound copper spring, green with age. It hums faintly when held."
    }
  }
}
```

The frontend dispatches `ADD_ITEM` with this payload, which:
- Adds the item to inventory (the reducer prevents duplicates by checking `item.id`)
- Plays the `itemPickup` sound
- The item appears in InventoryPanel and MiniInventory immediately

AI-created items can be examined from the terminal (`examine copper spring`) — `handleExamine` checks inventory items before returning "you don't see that."

**Item consistency:** The AI receives full global context (all items taken across all rooms + current inventory with IDs + available static items) so it never creates duplicates or offers items the player already has.

### Logbooks

Three in-game logbooks contain Alex's extended writing, paginated for the terminal:
- Opened via `read [logbook keyword]` or `examine [logbook]`
- Full-screen overlay with Unicode box-drawing border
- Navigate with ← / → arrows or on-screen buttons
- Close with ESC or q
- Page turn sound effect on navigation

---

## Key Design Decisions

**No localStorage.** All state is in React's useReducer. Refreshing the page resets the game. This is intentional — the game is meant to be explored fresh each visit.

**No TypeScript.** Plain JSX for simplicity and faster iteration.

**Procedural audio (no files).** All sounds are synthesized with Tone.js at runtime. This keeps the bundle small and allows unique per-room soundscapes.

**Command pipeline separation.** Parsing, handling, and dispatching are separate concerns. `commandParser` and `commandHandler` are pure functions with no side effects. This makes them testable and predictable.

**AI as narrator, not engine.** The AI never controls game state directly. It returns a JSON response that the frontend validates and selectively applies. The AI cannot move the player, open logbooks, or create vault clues.

**Conversation history per room.** History clears on room navigation to keep AI context focused and prevent confusion about location.

**Five entrance methods.** The entrance puzzle is designed so that different personality types find their own way in. Explorers, hackers, brute-forcers, and creative thinkers all have a path.

**Embedded JSON fallback.** Claude sometimes writes narrative prose before its JSON block. Rather than failing, the parser uses regex to extract embedded JSON, making the system resilient to AI formatting variation.

---

## Development Notes

**Color palette** (CSS variables in `index.css`):
- `--color-primary: #FFB000` (amber)
- `--color-dim: #805800` (faded amber)
- `--color-bg: #0A0A0A` (near-black)

**Keyboard shortcuts** (handled by `useKeyboardShortcuts`):
- `i` — Toggle inventory panel
- `m` — Toggle map panel
- `ESC` — Close any open panel or logbook
- `←` / `→` — Navigate logbook pages
- `q` — Close logbook
- Arrow up/down in terminal — Command history

**Content source of truth:** All factual content about Alex comes from `site-content.md`. The narrator never invents facts about Alex beyond what's provided.

**Development phases:**
1. Core Terminal & CRT Shell — Complete
2. Game Engine & State Management — Complete
3. Backend & AI Integration — Complete
4. Entrance Puzzle & Outdoor Areas — Complete
5. Content & Room Polish — Complete
6. Audio — Complete
7. Vault Architecture — Not started
8. Polish & Deploy — Not started

**Adding a new room:**
1. Add room definition in `src/data/rooms.js` (exits, objects, items, ASCII art)
2. Add room content in `server/prompts/alexContent.js`
3. Add ambient soundscape in `src/audio/ambients.js`
4. Connect exits from adjacent rooms
5. Add any new items to `src/data/items.js`

**Adding a new item:**
1. Add to `src/data/items.js` with id, name, icon, description
2. Add to a room's `items` map in `src/data/rooms.js` with keywords
3. Items will automatically work with take, examine, inventory display

**Modifying the AI narrator:**
- Personality and rules: `server/prompts/basePrompt.js`
- Per-room knowledge: `server/prompts/alexContent.js`
- Response format: `server/prompts/assemblePrompt.js`
- Game state context: `server/prompts/roomContext.js`
- Entrance behavior: `server/prompts/entrancePrompt.js`
