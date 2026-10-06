# The Depths

A Zork-style text adventure that *is* Alex Herman's portfolio — and, since v3, a small shared world in the spirit of LambdaMOO. Visitors explore interconnected rooms, solve puzzles, collect items, and talk to a Claude-powered narrator to discover Alex's bio, projects, resume, and writing. Everyone is in the same persistent house. Visitors who reach the end earn a **programmer bit** and can dig rooms, create things, and script verbs that stay in the house for everyone who comes after.

Built with React + Vite on the frontend and Express + WebSockets + a QuickJS sandbox on the backend.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [The World](#the-world)
  - [Objects](#objects)
  - [Seed content vs. built content](#seed-content-vs-built-content)
  - [Players, guests, and accounts](#players-guests-and-accounts)
  - [Persistence](#persistence)
- [Commands](#commands)
- [Building](#building)
- [Scripting](#scripting)
- [The Narrator](#the-narrator)
- [Game Mechanics](#game-mechanics)
  - [The Entrance Puzzle (5 methods)](#the-entrance-puzzle-5-methods)
  - [The Vault (the end)](#the-vault-the-end)
  - [Mail and the direct line to Alex](#mail-and-the-direct-line-to-alex)
- [Admin](#admin)
- [Deployment](#deployment)
- [Playtesting](#playtesting)
- [Key Design Decisions](#key-design-decisions)
- [Development Notes](#development-notes)

---

## Quick Start

**Prerequisites:** Node.js 20+ and either an Anthropic API key or a local `claude` CLI login.

1. Install dependencies:
   ```
   npm install
   ```
2. Create `.env` from `.env.example`. At minimum:
   ```
   ANTHROPIC_API_KEY=your_key_here
   WIZARD_PASSWORD=something-long
   ```
3. Build the frontend once, then start the server (it serves `dist/` and the WebSocket):
   ```
   npm run build
   node --env-file=.env server/index.js
   ```
   Open `http://localhost:3002`.

   For frontend development run Vite in a second terminal (`npm run dev`, port 5173/5176); it proxies `/ws` and `/private` to the server.

4. In the game, `connect alex <WIZARD_PASSWORD>` logs you in as the wizard.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 (JSX), Vite 6, custom CRT CSS, IBM Plex Mono |
| Audio | Tone.js procedural soundscapes |
| Transport | WebSocket (`ws`) at `/ws`; JSON messages both ways |
| Backend | Express 5, Node 20+ |
| World store | In-memory objects, JSON journal + snapshots (no database server) |
| Scripting | QuickJS (WASM) via `quickjs-emscripten-core` — sandboxed JavaScript verbs |
| Narrator | Anthropic SDK → Claude Sonnet 5.5 (`claude-sonnet-5-5`, server-side refusal fallbacks, medium effort), or a local `claude` CLI in print mode |

---

## Project Structure

```
the-depths/
├── site-content.md                 # Source of truth for all Alex content
├── CLAUDE.md                       # Conventions for AI assistants working here
├── .env.example
├── index.html / vite.config.js     # Vite entry + dev proxies (/ws, /private)
│
├── server/
│   ├── index.js                    # Express + http server, boots the world, attaches /ws
│   ├── auth/
│   │   ├── claudeAuth.js           # Anthropic client: API key -> OAuth -> claude CLI
│   │   ├── claudeCli.js            # `claude -p` transport with the exact narrator prompt
│   │   └── basicAuth.js            # /private pages
│   ├── prompts/                    # Narrator prompts (base, entrance, vault, per-room Alex content)
│   ├── routes/                     # flyer, /private, /private/mail, foreman
│   ├── data/world/                 # snapshot.json + journal.jsonl (gitignored)
│   └── world/                      # THE GAME
│       ├── index.js                # bootWorld(): load, seed, sandbox, scheduler
│       ├── store.js                # object store + persistence
│       ├── objects.js              # naming, matching, visibility, permissions, movement helpers
│       ├── seed.js                 # src/data/* -> seed objects (re-synced every boot)
│       ├── parser.js               # verb [dobj] [prep iobj], quotes, " : ; prefixes
│       ├── registry.js             # the single command registry (help + narrator catalog)
│       ├── dispatch.js             # line -> scripted verb -> builtin -> exit -> narrator
│       ├── session.js              # connections, tell/announce fan-out
│       ├── ws.js                   # WebSocket protocol
│       ├── auth.js                 # guests, @register, connect, tokens, wizard password
│       ├── actions.js              # describeRoom, movePlayer, locks, take/drop, map data
│       ├── messages.js             # %N %t %s pronoun substitution
│       ├── entrance.js             # the five ways through the door
│       ├── vault.js                # the ending puzzle + programmer bit
│       ├── narrator.js             # context building, "do" affordance, markers
│       ├── mail.js / onboarding.js / scheduler.js
│       ├── commands/               # basic, social, building, programming, admin, help
│       ├── script/                 # sandbox.js (QuickJS runtime, transaction, commit), prelude.js (in-sandbox API)
│       └── content/                # senses, vault rooms, Annex examples, help topics + handbook
│
└── src/                            # React client (a terminal; no game logic)
    ├── App.jsx                     # screens, server messages -> UI state
    ├── engine/client.js            # WebSocket client, token in localStorage
    ├── data/                       # rooms.js, items.js, logbooks.js (seed content), projects.js
    ├── components/                 # Terminal, Editor (overlay for @edit), MapPanel (generic layout),
    │                               # MiniMap, Inventory, Logbook, BootSequence, Landing, Portfolio, CRT
    ├── hooks/                      # useAudio, useKeyboardShortcuts, useCommandHistory
    └── audio/                      # effects, ambients, music
```

---

## Architecture

```
 browser (React terminal)  ──/ws──▶  server/world
   typed line ─────────────────────▶  dispatch.js
                                       1. scripted verb on something in scope (sandbox)
                                       2. builtin command (registry)
                                       3. an exit name
                                       4. the narrator (Claude) — may answer with ONE real command
   lines, room header, inventory, ◀──  session.out / announceRoom
   map, logbook, editor, sounds
```

The server is authoritative. The client holds only a session token; everything a player has done (rooms visited, items, flags, the programmer bit, built objects) is in the world store. Several tabs of the same player share one identity.

---

## The World

### Objects

Everything is an object record (`server/world/store.js`):

```js
{ id: '#12', kind: 'room'|'thing'|'exit'|'player'|'generic',
  name, aliases: [], parent: '#thing', owner: '#7', location: '#grand_hall',
  description, props: {}, verbs: { push: { names, args, code, owner } },
  messages: { oarrive: '...' }, perms: { r, w, f }, flags: {} }
```

- **Rooms** contain things, players, and **exits** (exit objects whose `props.dest` is another room; exits can be locked with key expressions).
- **Things** may be takeable, scenery, containers (`props.container`), enterable vehicles (`props.enterable`), notes (`props.text`), or anything a script makes them.
- **Inheritance:** `parent` chains give default props, messages and verbs. Generics: `$thing`, `$room`, `$exit`, `$note`, `$container`, plus the example objects in The Annex (`$pet_rock`, `$button`, `$dice`, `$sign`, `$lever`, `$computer`, `$vehicle`, `$monster`, `$npc`).
- **Permissions:** you control what you own; `+w` lets others write props, `+f` lets others create children. The wizard controls everything.

### Seed content vs. built content

`src/data/rooms.js`, `items.js`, `logbooks.js` remain the hand-written source of truth for Alex's house. `seed.js` upserts them into the store on every boot (ids like `#grand_hall`, `#grand_hall.portrait`, `#item.golden_compass`, `#exit.grand_hall.north`). Seed clue items are **per-player**: taking one gives you your own copy, so everybody can solve the puzzles. Player-built objects get numeric ids and live only in the store. Seed rooms can't be dug from, except **The Annex** (east of the Workshop), which exists for building.

### Players, guests, and accounts

Every browser gets a guest player (`Visitor-1234`) bound to a secret token in `localStorage`. On entering the Grand Hall the house asks for a name. `@register <name> <password>` turns the guest into an account that can `connect` from anywhere and keeps the programmer bit. Alex's wizard account is `#alex`; its password comes from `WIZARD_PASSWORD`.

### Persistence

`server/data/world/journal.jsonl` is append-only (`put`/`del`/`meta` entries); `snapshot.json` is written on boot, every 5 minutes if dirty, after 5000 journal lines, and on SIGTERM/SIGINT. Scheduled tasks and mail live in the store's `meta`. Set `WORLD_DATA_DIR` to a persistent volume in production.

---

## Commands

All commands are registered in one registry (`server/world/registry.js`), which `help` renders for humans and the narrator receives as its catalog of things it may `do`. Highlights (`help` in-game lists everything):

| Category | Commands |
|---|---|
| Moving | `north/n …`, `go <exit>`, exit names (`tree`, `annex`), `exits`, `home`, `@join <player>`, `@sethome`, `map` |
| Things | `look`, `examine/x`, `read`, `take [from]`, `drop`, `put … in …`, `open/close`, `look in`, `inventory/i`, `use <item> [on …]`, `write … on <note>`, `erase` |
| Senses | `listen`, `knock`, `smell`, `taste`, `touch` |
| Social | `say`/`"`, `emote`/`:`, `think`, `whisper … to …`, `page <who> <text>`, `who`, `mail <who> <text>`, `mail` |
| Identity | `@name`, `@gender`, `@describe me as`, `@register`, `@password`, `connect` |
| Building (bit) | `@dig`, `@create`, `@describe`, `@art`, `@rename`, `@recycle`, `@exit`, `@unlink`, `@lock/@unlock`, `@messages` + `@<msg> … is "…"`, `@set`, `@rmprop`, `@examine`, `@audit`, `@quota`, `@classes`, `@chparent`, `@parents`, `@chmod`, `@teleport`, `@go` |
| Scripting (bit) | `@verb`, `@rmverb`, `@args`, `@program`, `@edit`, `@list`, `@verbs`, `@copy`, `@test`, `;expr`, `@tasks`, `@kill` |
| Wizard | `@programmer`, `@setquota`, `@summon`, `@boot`, `@chown`, `@broadcast`, `@inbox`, `@stats`, `@snapshot`, `@purge-guests` |

Parsing is MOO-style: `verb [dobj] [prep iobj]`, with double quotes grouping words (`@dig north to "The Lamp Room"`), and `"`, `:`, `;` as shortcuts for say, emote, eval. References resolve against your pack, the room, exits, `me`, `here`, `#id`, `$generic`, `my <thing>`.

Every refusal says what to do instead (borrowed from Agora4's self-teaching refusals): *"There is already an exit "north" here. Pick another direction, or @unlink north first."*

---

## Building

1. Reach The Annex (Workshop → east). `@dig north to "The Lantern Room"` makes the room and both exits.
2. `north`, then `@describe here as "…"` (or `@describe here` for the line editor) and `@art here` for ASCII art above it.
3. `@create $thing named "Brass Lamp,lamp"`, `@describe lamp as "…"`, `drop lamp`.
4. Messages: `@oarrive north is "%N arrives in a shower of sparks."` (`%N` actor, `%t` this, `%s/%o/%p` pronouns, `%<verb>` agreement).
5. Locks: `@lock north with "brass key"` (name of a thing the player must be or carry; `me`, `programmer`, `nobody`, `&& || !`).

Quota: objects per builder (default 60; rooms, things and exits all count), 30 verbs per thing. `@quota`, `@audit`, `@recycle`.

---

## Scripting

Verbs are small JavaScript programs attached to things, run in a QuickJS sandbox (no Node, no network, ~80 ms CPU, 24 MB, atomic commit — a crash changes nothing and tells the owner why).

```
@verb lamp:light this none none
@program lamp:light
tell(player, "You strike a match. The lamp glows.")
announce(player.name + " lights the lamp.")
this.lit = true
this.description = "A brass lamp, glowing warmly."
fork(60, "gutter")          // run lamp:gutter in a minute (survives restarts)
.
```

- **Arg specs** (`dobj prep iobj`): `this none none` → `light lamp`; `any in this` → `put coin in slot`; `none none none` → bare word works near the thing; `this none this` → not a command, only `fork()`/`call()` can run it.
- **Globals:** `this`, `player`, `here`, `dobj`, `iobj`, `args`, `argstr`, `dobjstr`, `prepstr`, `iobjstr`, `verb`, `scheduled`.
- **Objects** are proxies: `o.name`, `o.description`, `o.location`, `o.contents`, `o.owner`, `o.exits`; `o.anyProp = value` is saved when the verb finishes; `o.tell()`, `o.announce()`, `o.move()`.
- **API:** `tell`, `announce`, `announceAll`, `sub`, `move`, `create`, `recycle`, `find`, `contents`, `players`, `roomOf`, `locked`, `fork`, `every`, `cancel`, `call`, `random`, `pick`, `cap`, `list`, `name`, `log`, `now`. `return false` means "not handled" (the builtin runs instead).
- **Tools:** `@edit` opens an editor overlay (Ctrl+Enter saves), `@test` dry-runs and prints the effects, `;expr` evaluates a line, `@list` reads any readable verb (the Annex examples are all readable), `@copy` clones one onto your thing.
- **Permissions:** a verb acts as its owner. It can change what its owner owns (or things with `+w`), move the player who triggered it (or any player standing in a room the owner owns), and never read other players' private props.

`help scripting`, `help api`, `help examples` in-game are the canonical docs (`server/world/content/helpTopics.js`); keep them in sync with `script/prelude.js` and `script/sandbox.js`.

---

## The Narrator

Anything the engine doesn't understand goes to the narrator (`server/world/narrator.js`). It receives the room's real state — description, every object here with its description and scripted verbs, exits, people, the player's inventory and progress, recent room events, and the command catalog — and answers as JSON `{ "narrative", "do" }`. `do` may be exactly one listed command or exit ("walk through the eastern door" → `east`); the engine runs it as if typed and refuses anything not listed. The narrator cannot create rooms or items (the old `createRoom`/`createItem` channel is gone). Hints come from a SECRETS block (hidden interactions, the vault's next step) and are only ever paraphrased.

Prompt modes: entrance (the door; `<<DOOR_OPENS>>` marker opens it; hints begin after 6 attempts), standard (per-room Alex content from `server/prompts/alexContent.js`, or generic content for built rooms), and vault (`server/prompts/vaultPrompt.js`: the narrator may say it is Claude, discuss Conscious Claude, and grant the bit with `<<GRANT_BIT>>`).

Transport: `server/auth/claudeAuth.js` tries `ANTHROPIC_API_KEY`, then `~/.claude/.credentials.json`, then the local `claude` CLI (`server/auth/claudeCli.js`, which replays the same system prompt and conversation through `claude -p`). `NARRATOR_BACKEND=claude-cli` forces the CLI; `NARRATOR_MODEL` and `NARRATOR_EFFORT` override the model and effort.

---

## Game Mechanics

### The Entrance Puzzle (5 methods)

All per player, all in `server/world/entrance.js`:
1. **The Explorer** — read the tree journal, `listen` at the tree, examine the canopy for the iron key, `use key on door`.
2. **The Knock** — `knock`.
3. **The Hacker** — `ls`, `cd secret`, `cat key.txt`.
4. **The Brute** — `examine crossbars`, then `use paracord on door`.
5. **The Charmer** — make the narrator smile (`<<DOOR_OPENS>>`).

Opening the door sets `door_opened`; the exits `in`/`out` between the Entrance and the Grand Hall then stay open, so wandering back outside (or reloading) can never lock you out again.

### The Vault (the end)

Four clue items and three discoveries lead down: `use compass` in the Grand Hall (the inscription parts into a hatch), `use gear on hatch`, `use crystal on hatch` (the hatch opens; `down`), `use tome on door` in The Descent (the black door asks *What is it like to be?*), `down`. In the Vault the narrator drops the act; `take bit` (or asking for it) grants the programmer bit with a ceremony, and the Builder's Handbook on the lectern walks through a first room, thing and verb. Logic in `server/world/vault.js`; rooms in `server/world/content/vaultRooms.js`.

### Mail and the direct line to Alex

`mail alex <text>` leaves a letter whether or not Alex is online; `page` delivers live and falls back to mail. Letters are stored in the world meta, listed at `/private/mail` (basic auth) and `@inbox` in-game.

---

## Admin

- `connect alex <WIZARD_PASSWORD>` — the wizard controls everything; `@programmer <player>` grants/revokes the bit outside the vault; `@setquota`, `@summon`, `@boot`, `@chown`, `@broadcast`, `@stats`, `@purge-guests <days>`.
- `/private` (flyer submissions), `/private/mail` (letters), `/private/foreman/*` — gated by `PRIVATE_ADMIN_USER/PASSWORD`.

---

## Deployment

The server needs Node 20+, writable disk for `WORLD_DATA_DIR` (a **persistent volume**, or built content vanishes on redeploy), and the narrator credentials. `npm run build` before deploying so `dist/` is current; `npm start` runs `server/index.js`. WebSockets must be allowed by the host/proxy (`/ws`).

---

## Playtesting

Two ways to drive the world without a human:
- A browser driver (Playwright) typing into the real terminal — used for the stranger's-eye playtests.
- A tiny WebSocket client that sends commands and prints every message (`hello`, `cmd`, `bootdone`, `editor_save`).

Set `NARRATOR_BACKEND=claude-cli` to run the narrator through a local `claude` login with the exact same prompts.

---

## Key Design Decisions

- **Server-authoritative shared world.** Multiplayer, persistence, player-built content and sandboxed scripts all need one source of truth; the browser is a terminal.
- **Narrator as voice, not engine.** The old narrator could invent rooms and items, which broke puzzles (it once built a dead-end "Entry Hall" instead of opening the real door). Now it narrates what exists and can only trigger commands the player could have typed.
- **One registry for humans and the model** (from Agora4): help text and the narrator's catalog come from the same command definitions, and every refusal names the fix.
- **Atomic verb effects.** Scripts return proposed changes; a crash leaves no half-state (Agora4's "proposed changes", MOO's feel).
- **Seed content stays in data files.** `rooms.js` et al. remain the source of truth; the store re-syncs them each boot, so Alex edits content the same way as before.
- **Per-player seed items.** Clue items copy themselves so one visitor can't strip the house.
- **Examples are the documentation.** Every object on the Annex bench is readable (`@list`) and fertile (`@create $x named …`), the way LambdaMOO's generics taught a generation to build.

---

## Development Notes

**Content source of truth:** `site-content.md`. Narrator content per room: `server/prompts/alexContent.js`.

**Adding a seed room:** add it to `src/data/rooms.js` (exits, objects, items, ASCII art), content in `alexContent.js`, ambience in `src/audio/ambients.js`. Boot re-syncs. Extra server-only rooms (the Descent, the Vault, the Annex) live in `server/world/content/`.

**Adding a builtin command:** `registerCommand({ name, aliases, usage, summary, category, requires, handler })` in `server/world/commands/*.js`. The handler gets `ctx` (`player`, `room`, `here`, `tell`, `announce`, `resolve`, `noSuch`, parsed parts).

**Adding an example object:** `server/world/content/examples.js`; its verbs are real sandbox code and double as documentation.

**Scratch data:** delete `server/data/world/` to reset the world (players and built content included).
