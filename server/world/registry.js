// One registry of commands, shared by humans (help) and the narrator (which
// receives the same catalog so it can translate natural language into real
// commands). Every command is documented at the point of definition.
//
// registerCommand({
//   name: 'look', aliases: ['l'], usage: 'look [thing]',
//   summary: 'Look around, or at one thing.', category: 'basics',
//   requires: null | 'programmer' | 'wizard', handler: async (ctx) => {}
//   protected: true   // scripted verbs may not shadow it
// })

const commands = new Map()
const byAlias = new Map()

export const CATEGORIES = {
  basics: 'Getting around',
  things: 'Things and items',
  social: 'Talking to people',
  building: 'Building (programmer bit)',
  programming: 'Scripting (programmer bit)',
  admin: 'Wizard only',
  meta: 'The terminal itself',
}

export function registerCommand(spec) {
  if (!spec.name || !spec.handler) throw new Error('command needs name and handler')
  const cmd = { aliases: [], category: 'basics', requires: null, usage: spec.name, summary: '', ...spec }
  commands.set(cmd.name, cmd)
  byAlias.set(cmd.name.toLowerCase(), cmd)
  for (const a of cmd.aliases) byAlias.set(a.toLowerCase(), cmd)
  return cmd
}

export function findCommand(verb) {
  return byAlias.get(String(verb).toLowerCase()) || null
}

export function allCommands() {
  return [...commands.values()]
}

export function commandsFor(player, { includeHidden = false } = {}) {
  const prog = !!(player?.flags?.programmer || player?.flags?.wizard)
  const wiz = !!player?.flags?.wizard
  return allCommands().filter(c => {
    if (c.hidden && !includeHidden) return false
    if (c.requires === 'programmer' && !prog) return false
    if (c.requires === 'wizard' && !wiz) return false
    return true
  })
}

// Compact catalog for the narrator / help: "look [thing] — Look around"
export function catalogLines(player, categories = null) {
  const cmds = commandsFor(player).filter(c => !categories || categories.includes(c.category))
  return cmds.map(c => `${c.usage} — ${c.summary}`)
}

export default { registerCommand, findCommand, allCommands, commandsFor, catalogLines }
