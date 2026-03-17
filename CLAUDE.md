### What this is 
A Zork-style text adventure portfolio website for Alex Herman. Visitors explore rooms, solve puzzles, and converse with a Claude Sonnet-powered dungeon master to discover Alex's bio, projects, resume, and writing. 

### Conventions
All game content about Alex comes from site-content.md — treat it as source of truth
Logbook text should preserve Alex's voice — edit for pagination only, not tone
The narrator never breaks character or acknowledges being an AI (until the vault)
The entrance jailbreak should be fun, not frustrating — hints escalate after 6-10 attempts
ASCII art should be hand-crafted to fit ~60-80 char width terminals
localStorage used for save state only (game progress persists across tab closes; type "newgame" to reset)
Audio must have a mute toggle and should not autoplay until first user interaction