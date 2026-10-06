### What this is
A Zork-style text adventure portfolio website for Alex Herman. Visitors explore rooms, solve puzzles, and converse with a Claude-powered narrator to discover Alex's bio, projects, resume, and writing. The world is a small shared MOO (LambdaMOO-style): everyone is in the same persistent house, and visitors who reach the end earn a programmer bit that lets them dig rooms and script objects that stay for everyone after them.

### Architecture in one breath
- `server/world/` is the game. Rooms, things, exits and players are object records in an in-memory store persisted as a JSON journal + snapshots (`server/data/world/`). The React client (`src/`) is a thin terminal over a WebSocket (`/ws`); it holds only a session token.
- `src/data/rooms.js`, `items.js`, `logbooks.js` are still the source of truth for Alex's seed content: `server/world/seed.js` re-syncs them into the store on every boot. Player-built objects live only in the store.
- Builtin commands are registered in `server/world/commands/*.js` through one registry (`registry.js`) that also feeds `help` and the narrator's catalog. Player verbs run in a QuickJS sandbox (`server/world/script/`) with a CPU/memory cap and atomic commits.
- The narrator (`server/world/narrator.js`) only narrates. It sees the real room state and may translate a sentence into ONE existing command (`"do"`); it cannot create rooms or items.

### Conventions
All game content about Alex comes from site-content.md — treat it as source of truth
Logbook text should preserve Alex's voice — edit for pagination only, not tone
The narrator never breaks character or acknowledges being an AI (until the vault)
The entrance jailbreak should be fun, not frustrating — hints escalate after 6-10 attempts
Every refusal names the fix ("There is no exit north. Exits: east, south.") — see Agora4's self-teaching refusals
Scripted verbs are plain JavaScript; the API is documented in `help api` (server/world/content/helpTopics.js). Keep the help in sync with the sandbox.
ASCII art should be hand-crafted to fit ~60-80 char width terminals
localStorage holds only the session token (`depths-token`); progress lives on the server
Audio must have a mute toggle and should not autoplay until first user interaction

### Running locally
`npm install`, then `node --env-file=.env server/index.js` (serves `dist/` and `/ws`) and `npm run dev` for the Vite frontend (proxies `/ws`). `npm run build` before committing `dist/`. Set `WIZARD_PASSWORD` to log in as Alex (`connect alex <password>`); set `WORLD_DATA_DIR` to a persistent disk in production.
