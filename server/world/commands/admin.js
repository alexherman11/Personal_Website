// Wizard commands: Alex's tools for tending the world.
import store from '../store.js'
import { registerCommand } from '../registry.js'
import { resolveRef, isWizard, WIZARD_ID } from '../objects.js'
import { movePlayer } from '../actions.js'
import { findPlayerByName } from '../auth.js'
import { grantProgrammer } from '../vault.js'
import { broadcast, sessionsOf, tellPlayer, onlinePlayers } from '../session.js'
import { allMail } from '../mail.js'

function player(ctx, name) {
  const p = findPlayerByName(name) || (name?.startsWith('#') ? store.get(name) : null)
  if (!p || p.kind !== 'player') { ctx.tell(`No player "${name}".`, 'error'); return null }
  return p
}

registerCommand({
  name: '@programmer', usage: '@programmer <player> [off]', category: 'admin', requires: 'wizard', protected: true,
  summary: 'Grant (or revoke, with "off") the programmer bit.',
  async handler(ctx) {
    const [name, off] = ctx.args
    const p = player(ctx, name); if (!p) return
    if (off === 'off') { p.flags.programmer = false; store.save(p); ctx.tell(`${p.name} no longer has the bit.`, 'system'); tellPlayer(p.id, 'Your programmer bit has been taken back by the wizard.', 'system'); return }
    if (!grantProgrammer(p)) return ctx.tell(`${p.name} already has it.`)
    ctx.tell(`${p.name} has been given the programmer bit.`, 'system')
  },
})

registerCommand({
  name: '@setquota', usage: '@setquota <player> <n>', category: 'admin', requires: 'wizard', protected: true,
  summary: 'Set how many objects a player may own.',
  async handler(ctx) {
    const [name, n] = ctx.args
    const p = player(ctx, name); if (!p) return
    p.props.quota = Math.max(0, Number(n) || 0); store.save(p)
    ctx.tell(`${p.name}'s quota is now ${p.props.quota}.`, 'system')
    tellPlayer(p.id, `The wizard set your object quota to ${p.props.quota}.`, 'system')
  },
})

registerCommand({
  name: '@summon', usage: '@summon <player>', category: 'admin', requires: 'wizard', protected: true,
  summary: 'Bring a player to your room.',
  async handler(ctx) {
    const p = player(ctx, ctx.argstr); if (!p) return
    movePlayer(p, ctx.room, { leaveMsg: '%N is whisked away by an unseen hand.', arriveMsg: '%N appears, looking surprised.' })
    tellPlayer(p.id, `${ctx.player.name} summons you.`, 'system')
  },
})

registerCommand({
  name: '@boot', usage: '@boot <player>', category: 'admin', requires: 'wizard', protected: true,
  summary: 'Disconnect a player and send them home.',
  async handler(ctx) {
    const p = player(ctx, ctx.argstr); if (!p) return
    movePlayer(p, store.get(p.props.home || '#grand_hall'), { quiet: true })
    for (const s of sessionsOf(p.id)) { s.out('The wizard shows you the door.', 'system'); try { s.ws.close() } catch {} }
    ctx.tell(`${p.name} booted.`, 'system')
  },
})

registerCommand({
  name: '@chown', usage: '@chown <thing> to <player>', category: 'admin', requires: 'wizard', protected: true,
  summary: 'Change who owns something.',
  async handler(ctx) {
    const res = resolveRef(ctx.player, ctx.dobjstr, { includeExits: true }); if (!res.obj) return ctx.noSuch(ctx.dobjstr, res)
    const p = player(ctx, ctx.iobjstr); if (!p) return
    res.obj.owner = p.id; store.save(res.obj)
    ctx.tell(`${res.obj.name} now belongs to ${p.name}.`, 'system')
  },
})

registerCommand({
  name: '@broadcast', aliases: ['@shout', '@wall'], usage: '@broadcast <text>', category: 'admin', requires: 'wizard', protected: true,
  summary: 'Say something to everyone connected.',
  async handler(ctx) { broadcast(`[${ctx.player.name}, everywhere] ${ctx.rawArgstr || ctx.argstr}`, 'chat') },
})

registerCommand({
  name: '@inbox', usage: '@inbox', category: 'admin', requires: 'wizard', protected: true,
  summary: 'Every letter ever sent (also at /private).',
  async handler(ctx) {
    const mail = allMail().slice(-40)
    if (!mail.length) return ctx.tell('No mail in the world.')
    ctx.tell(mail.map(m => `  #${m.id} ${new Date(m.ts).toISOString().slice(0, 16)} ${m.fromName} → ${m.toName}: ${m.text}`), 'chat')
  },
})

registerCommand({
  name: '@snapshot', usage: '@snapshot', category: 'admin', requires: 'wizard', protected: true, hidden: true,
  summary: 'Write the world to disk now.',
  async handler(ctx) { store.snapshot(); ctx.tell('Snapshot written.', 'system') },
})

registerCommand({
  name: '@stats', usage: '@stats', category: 'admin', requires: 'wizard', protected: true,
  summary: 'World statistics.',
  async handler(ctx) {
    const kinds = {}
    let programmers = 0
    for (const o of store.all()) { kinds[o.kind] = (kinds[o.kind] || 0) + 1; if (o.kind === 'player' && o.flags?.programmer) programmers++ }
    ctx.tell([`Objects: ${JSON.stringify(kinds)}`, `Programmers: ${programmers}`, `Online: ${onlinePlayers().map(p => p.name).join(', ') || 'nobody'}`, `Mail: ${allMail().length}`], 'dim')
  },
})

registerCommand({
  name: '@purge-guests', usage: '@purge-guests <days>', category: 'admin', requires: 'wizard', protected: true, hidden: true,
  summary: 'Delete unregistered visitors (and their copies) not seen for N days.',
  async handler(ctx) {
    const days = Number(ctx.argstr) || 30
    const cutoff = Date.now() - days * 86400000
    let n = 0
    for (const o of [...store.all()]) {
      if (o.kind !== 'player' || o.props?.registered || o.flags?.wizard || o.flags?.programmer) continue
      if ((o.props?.lastSeen || o.updated) > cutoff) continue
      for (const c of store.contents(o.id)) store.remove(c.id)
      store.remove(o.id); n++
    }
    ctx.tell(`Purged ${n} stale visitors.`, 'system')
  },
})

export default {}
