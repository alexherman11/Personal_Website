// help: the one place humans and the narrator learn what is possible.
import store from '../store.js'
import { registerCommand, findCommand, commandsFor, CATEGORIES } from '../registry.js'
import { resolveRef, isProgrammer, isWizard } from '../objects.js'
import { HELP_TOPICS } from '../content/helpTopics.js'

registerCommand({
  name: 'help', aliases: ['?', '@help', 'commands'], usage: 'help [topic | command | thing]', category: 'meta', protected: true,
  summary: 'This. "help building", "help scripting", "help say", or "help rock".',
  async handler(ctx) {
    const q = ctx.argstr.trim().toLowerCase().replace(/^on\s+/, '')
    if (!q) return overview(ctx)
    // topic
    const topic = HELP_TOPICS[q] || HELP_TOPICS[Object.keys(HELP_TOPICS).find(k => k.startsWith(q) && q.length >= 3)]
    if (topic && (!topic.requires || (topic.requires === 'programmer' && isProgrammer(ctx.player)) || (topic.requires === 'wizard' && isWizard(ctx.player)))) {
      return ctx.tell(typeof topic.text === 'function' ? topic.text(ctx) : topic.text, 'output')
    }
    // category
    const cat = Object.entries(CATEGORIES).find(([k, label]) => k === q || label.toLowerCase().startsWith(q))
    if (cat) return listCategory(ctx, cat[0])
    // command
    const cmd = findCommand(q) || findCommand('@' + q)
    if (cmd && !(cmd.requires === 'programmer' && !isProgrammer(ctx.player)) && !(cmd.requires === 'wizard' && !isWizard(ctx.player))) {
      const lines = [`${cmd.usage}`, `  ${cmd.summary}`]
      if (cmd.aliases?.length) lines.push(`  also: ${cmd.aliases.join(', ')}`)
      if (cmd.help) lines.push('', ...(Array.isArray(cmd.help) ? cmd.help : [cmd.help]))
      return ctx.tell(lines)
    }
    // object
    const res = resolveRef(ctx.player, q, { includeExits: true })
    if (res.obj) {
      const h = store.prop(res.obj, 'help')
      const verbs = store.allVerbs(res.obj).filter(v => v.code && !v.hidden)
      const lines = []
      if (h) lines.push(...(Array.isArray(h) ? h : [h]))
      if (verbs.length) lines.push(`Things you can do with ${res.obj.name}: ${verbs.map(v => (v.names || [v.key])[0].replace('*', '')).join(', ')}`)
      if (!lines.length) lines.push(`${res.obj.name} has no help. Try "examine ${res.obj.name.toLowerCase()}".`)
      return ctx.tell(lines)
    }
    ctx.tell(`No help for "${q}". Try "help" alone, or one of: ${Object.keys(HELP_TOPICS).filter(k => !HELP_TOPICS[k].requires || isProgrammer(ctx.player)).join(', ')}.`, 'error')
  },
})

function overview(ctx) {
  const prog = isProgrammer(ctx.player)
  const lines = [
    'THE DEPTHS — how to be here',
    '',
    '  look (l)                 look around          examine <thing>      inspect, read, open books',
    '  north / n / go <exit>    move                 exits                ways out of here',
    '  take <thing>, drop, put <thing> in <box>, inventory (i), use <item> on <thing>',
    '  say <text> or "text      talk to the room     :waves               act (emote)',
    '  whisper <text> to <who>  page <who> <text>    who                  who is around',
    '  mail alex <text>         write to Alex — he reads it.',
    '  @name <name>             be known by a name   @register <name> <pw>  come back from anywhere',
    '  home                     back to the hall     map (m)              where you have been',
    '',
    'You can also just talk. The narrator listens, and the world sometimes answers.',
    'Topics: help social · help things · help moving' + (prog ? ' · help building · help scripting · help api · help examples' : ''),
  ]
  if (!prog) lines.push('', 'Somewhere below this house there is a bit that lets you build here. Find the end.')
  ctx.tell(lines)
}

function listCategory(ctx, cat) {
  const cmds = commandsFor(ctx.player).filter(c => c.category === cat)
  ctx.tell([`${CATEGORIES[cat]}:`, ...cmds.map(c => `  ${c.usage.padEnd(36)} ${c.summary}`)])
}

export default {}
