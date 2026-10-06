// Scripting: verbs on objects, the line editor and the overlay editor,
// listing, dry runs, eval, and scheduled tasks.
import store from '../store.js'
import { registerCommand } from '../registry.js'
import { resolveRef, controls, isWizard, theName, canRead } from '../objects.js'
import { enterEditor } from '../dispatch.js'
import { compileCheck, runVerb, evalSnippet, LIMITS } from '../script/sandbox.js'
import { listTasks, killTask } from '../scheduler.js'
import { verbUsage } from './basic.js'

const VERB_NAME_RE = /^[a-z][a-z0-9_\-*]*$/i
const ARG_SPECS = new Set(['this', 'any', 'none'])

function parseVerbRef(ctx, ref) {
  const m = String(ref || '').match(/^(.+?):([A-Za-z0-9_\-*" ]+)$/)
  if (!m) { ctx.tell('Name the verb as thing:verb, e.g. rock:pet', 'error'); return null }
  const res = resolveRef(ctx.player, m[1], { includeExits: true })
  if (!res.obj) { ctx.noSuch(m[1], res); return null }
  return { obj: res.obj, verbName: m[2].replace(/"/g, '').trim() }
}

function ownVerb(ctx, obj, verbName, { mustExist = true } = {}) {
  const found = store.findVerb(obj, verbName)
  if (mustExist && !found) {
    const have = Object.keys(obj.verbs || {})
    ctx.tell(`${obj.name} has no verb "${verbName}".${have.length ? ` It has: ${have.join(', ')}.` : ''} Add one with @verb ${obj.id}:${verbName} this none none`, 'error')
    return null
  }
  if (found && found.holder.id !== obj.id) {
    ctx.tell(`"${verbName}" is inherited from ${found.holder.name} (${found.holder.id}). To change it for ${obj.name} only, copy it first: @copy ${found.holder.id}:${verbName} to ${obj.id}:${verbName}`, 'error')
    return null
  }
  if (found && !controls(ctx.player, obj) && found.verb.owner !== ctx.player.id) {
    ctx.tell(`${obj.name} is not yours to program.`, 'error')
    return null
  }
  return found
}

// ---------- @verb ----------
registerCommand({
  name: '@verb', usage: '@verb <thing>:<name> [dobj prep iobj]', category: 'programming', requires: 'programmer', protected: true,
  summary: 'Add a verb (a command) to a thing. e.g. @verb rock:pet this none none   then   @program rock:pet',
  async handler(ctx) {
    const [ref, ...rest] = ctx.args
    const vr = parseVerbRef(ctx, ref); if (!vr) return
    const { obj, verbName } = vr
    if (!controls(ctx.player, obj)) return ctx.tell(`${obj.name} is not yours. @create your own thing first.`, 'error')
    const names = verbName.split(/\s+/).filter(Boolean)
    for (const n of names) if (!VERB_NAME_RE.test(n)) return ctx.tell(`Verb names are words like "pet", "push", "pu*sh" (the * marks where abbreviation may start). "${n}" is not one.`, 'error')
    let args = rest.length ? rest.map(s => s.toLowerCase()) : ['this', 'none', 'none']
    if (args.length === 1 && args[0] === 'tnt') args = ['this', 'none', 'this']
    if (args.length !== 3) return ctx.tell('Give three arg specs: dobj prep iobj, each "this", "any" or "none" (prep may also be a word like "on"). e.g. this none none', 'error')
    if (!ARG_SPECS.has(args[0]) || !ARG_SPECS.has(args[2]) || !(ARG_SPECS.has(args[1]) || /^[a-z ]+$/.test(args[1]))) return ctx.tell('Arg specs are "this", "any" or "none".', 'error')
    const count = Object.keys(obj.verbs || {}).length
    if (count >= LIMITS.verbsPerObject && !isWizard(ctx.player)) return ctx.tell(`${obj.name} already has ${count} verbs. That is plenty for one thing.`, 'error')
    const key = names[0].replace('*', '')
    if (obj.verbs?.[key]) return ctx.tell(`${obj.name} already has a verb "${key}". @program ${obj.id}:${key} edits it; @rmverb removes it.`, 'error')
    obj.verbs = obj.verbs || {}
    obj.verbs[key] = { names, args, code: '', owner: ctx.player.id, perms: { r: true, x: true }, created: Date.now() }
    store.save(obj)
    ctx.tell(`Verb ${obj.name}:${names.join('/')} (${args.join(' ')}) added. Now write it:  @program ${obj.id}:${key}   (or @edit ${obj.id}:${key} for the editor window)`, 'system')
  },
})

registerCommand({
  name: '@rmverb', aliases: ['@remove-verb'], usage: '@rmverb <thing>:<verb>', category: 'programming', requires: 'programmer', protected: true,
  summary: 'Remove a verb from your thing.',
  async handler(ctx) {
    const vr = parseVerbRef(ctx, ctx.argstr); if (!vr) return
    const found = ownVerb(ctx, vr.obj, vr.verbName); if (!found) return
    delete vr.obj.verbs[found.verb.key]; store.save(vr.obj)
    ctx.tell(`Removed ${vr.obj.name}:${found.verb.key}.`, 'system')
  },
})

registerCommand({
  name: '@args', usage: '@args <thing>:<verb> <dobj> <prep> <iobj>', category: 'programming', requires: 'programmer', protected: true,
  summary: 'Change what a verb expects: "push button" is this none none; "put coin in slot" is any in this.',
  async handler(ctx) {
    const [ref, ...rest] = ctx.args
    const vr = parseVerbRef(ctx, ref); if (!vr) return
    const found = ownVerb(ctx, vr.obj, vr.verbName); if (!found) return
    const args = rest.map(s => s.toLowerCase())
    if (args.length !== 3) return ctx.tell('Give three: dobj prep iobj.', 'error')
    vr.obj.verbs[found.verb.key].args = args; store.save(vr.obj)
    ctx.tell(`${vr.obj.name}:${found.verb.key} now takes ${args.join(' ')}.`, 'system')
  },
})

registerCommand({
  name: '@rename-verb', usage: '@rename-verb <thing>:<verb> to "<names>"', category: 'programming', requires: 'programmer', protected: true, hidden: true,
  summary: 'Rename a verb (several names separated by spaces).',
  async handler(ctx) {
    const vr = parseVerbRef(ctx, ctx.dobjstr); if (!vr) return
    const found = ownVerb(ctx, vr.obj, vr.verbName); if (!found) return
    const names = ctx.iobjstr.replace(/"/g, '').split(/\s+/).filter(Boolean)
    if (!names.length || !names.every(n => VERB_NAME_RE.test(n))) return ctx.tell('Give one or more verb names.', 'error')
    const def = vr.obj.verbs[found.verb.key]
    delete vr.obj.verbs[found.verb.key]
    vr.obj.verbs[names[0].replace('*', '')] = { ...def, names }
    store.save(vr.obj)
    ctx.tell(`Verb renamed to ${names.join('/')}.`, 'system')
  },
})

// ---------- @program / @edit ----------
async function saveCode(ctx, obj, key, code) {
  const check = await compileCheck(code)
  if (!check.ok) {
    ctx.tell(`Not saved — the code has a problem: ${check.error}`, 'error')
    ctx.tell('Fix it and try again (@program keeps nothing from a failed save; the previous code is intact).', 'dim')
    return false
  }
  if (code.length > LIMITS.codeBytes) { ctx.tell(`Verb code is limited to ${LIMITS.codeBytes} characters.`, 'error'); return false }
  obj.verbs[key].code = code
  obj.verbs[key].updated = Date.now()
  store.save(obj)
  ctx.tell(`${obj.name}:${key} programmed (${code.split('\n').length} lines). Try it; "@list ${obj.id}:${key}" shows it.`, 'system')
  return true
}

registerCommand({
  name: '@program', aliases: ['@prog'], usage: '@program <thing>:<verb>', category: 'programming', requires: 'programmer', protected: true,
  summary: 'Type the code of a verb line by line; "." on its own line saves. (See: help scripting)',
  async handler(ctx) {
    const vr = parseVerbRef(ctx, ctx.argstr); if (!vr) return
    const found = ownVerb(ctx, vr.obj, vr.verbName); if (!found) return
    const key = found.verb.key
    if (found.verb.code) ctx.tell(`(${vr.obj.name}:${key} already has ${found.verb.code.split('\n').length} lines; saving replaces them. "@list ${vr.obj.id}:${key}" shows them, "@edit" edits in place.)`, 'dim')
    enterEditor(ctx.session, {
      title: `${vr.obj.name}:${key}  [${(found.verb.args || []).join(' ')}]`,
      lines: [],
      onDone: body => saveCode(ctx, vr.obj, key, body),
    })
  },
})

registerCommand({
  name: '@edit', usage: '@edit <thing>:<verb>', category: 'programming', requires: 'programmer', protected: true,
  summary: 'Open a verb in the editor window (Ctrl+Enter saves, Esc cancels).',
  async handler(ctx) {
    const vr = parseVerbRef(ctx, ctx.argstr); if (!vr) return
    const found = ownVerb(ctx, vr.obj, vr.verbName); if (!found) return
    ctx.send({
      t: 'editor', target: `${vr.obj.id}:${found.verb.key}`,
      title: `${vr.obj.name}:${found.verb.key}   args: ${(found.verb.args || []).join(' ')}`,
      text: found.verb.code || '',
      hint: 'JavaScript. this = the object, player = who typed it, dobj/iobj, args, argstr. tell(player, "..."), announce("..."), this.prop = value, move(obj, room), fork(seconds, "verbname"). Ctrl+Enter saves, Esc cancels. "help api" lists everything.',
    })
  },
})

// Called by the transport when the overlay editor saves.
export async function editorSave(session, target, text) {
  const ctx = { player: session.p, session, tell: (t, s) => session.out(t, s), noSuch: (r) => session.out(`No such thing: ${r}`, 'error') }
  const vr = parseVerbRef(ctx, target); if (!vr) return
  const found = ownVerb(ctx, vr.obj, vr.verbName); if (!found) return
  await saveCode(ctx, vr.obj, found.verb.key, String(text || '').slice(0, LIMITS.codeBytes + 1))
}

registerCommand({
  name: '@list', usage: '@list <thing>:<verb>', category: 'programming', requires: 'programmer', protected: true,
  summary: 'Show the code of a verb (yours, or any readable one — reading others\' code is how MOOers learned).',
  async handler(ctx) {
    const vr = parseVerbRef(ctx, ctx.argstr); if (!vr) return
    const found = store.findVerb(vr.obj, vr.verbName)
    if (!found) return ctx.tell(`${vr.obj.name} has no verb "${vr.verbName}". "@verbs ${vr.obj.id}" lists them.`, 'error')
    if (!(controls(ctx.player, vr.obj) || found.verb.perms?.r !== false)) return ctx.tell('That verb is not readable.', 'error')
    const v = found.verb
    const lines = [`${found.holder.name}:${(v.names || [v.key]).join(' ')}   args: ${(v.args || []).join(' ')}   owner: ${store.get(v.owner)?.name || '?'}`]
    if (!v.code) lines.push(v.builtin ? '  (built into the house itself)' : '  (empty — nothing programmed yet)')
    else v.code.split('\n').forEach((l, i) => lines.push(`${String(i + 1).padStart(3)}  ${l}`))
    ctx.tell(lines, 'dim')
  },
})

registerCommand({
  name: '@verbs', usage: '@verbs <thing>', category: 'programming', requires: 'programmer', protected: true,
  summary: 'List the verbs on a thing, own and inherited.',
  async handler(ctx) {
    const res = resolveRef(ctx.player, ctx.argstr || 'here', { includeExits: true }); if (!res.obj) return ctx.noSuch(ctx.argstr, res)
    const verbs = store.allVerbs(res.obj)
    if (!verbs.length) return ctx.tell(`${res.obj.name} has no verbs. @verb ${res.obj.id}:<name> this none none adds one.`)
    ctx.tell(verbs.map(v => `  ${res.obj.id}:${(v.names || [v.key]).join('/')}  ${(v.args || []).join(' ')}  — ${verbUsage(v, res.obj)}${v.holder.id !== res.obj.id ? `  (from ${v.holder.name})` : ''}${v.code ? '' : '  [no code]'}`), 'dim')
  },
})

registerCommand({
  name: '@copy', usage: '@copy <thing>:<verb> to <thing2>:<verb2>', category: 'programming', requires: 'programmer', protected: true,
  summary: 'Copy a readable verb onto your own thing.',
  async handler(ctx) {
    if (ctx.prepstr !== 'to') return ctx.tell('Usage: @copy $pet_rock:pet to rock:pet', 'error')
    const src = parseVerbRef(ctx, ctx.dobjstr); if (!src) return
    const dst = parseVerbRef(ctx, ctx.iobjstr); if (!dst) return
    const found = store.findVerb(src.obj, src.verbName)
    if (!found || !found.verb.code) return ctx.tell(`No readable code at ${src.obj.name}:${src.verbName}.`, 'error')
    if (!(controls(ctx.player, src.obj) || found.verb.perms?.r !== false)) return ctx.tell('That verb is not readable.', 'error')
    if (!controls(ctx.player, dst.obj)) return ctx.tell(`${dst.obj.name} is not yours.`, 'error')
    const key = dst.verbName.replace('*', '')
    dst.obj.verbs = dst.obj.verbs || {}
    dst.obj.verbs[key] = { names: [dst.verbName], args: [...(found.verb.args || ['this', 'none', 'none'])], code: found.verb.code, owner: ctx.player.id, perms: { r: true, x: true }, created: Date.now() }
    store.save(dst.obj)
    ctx.tell(`Copied to ${dst.obj.name}:${key}.`, 'system')
  },
})

registerCommand({
  name: '@test', aliases: ['@dryrun'], usage: '@test <thing>:<verb> [args]', category: 'programming', requires: 'programmer', protected: true,
  summary: 'Run a verb without changing anything: shows what it would say and do.',
  async handler(ctx) {
    const [ref, ...rest] = ctx.args
    const vr = parseVerbRef(ctx, ref); if (!vr) return
    const found = store.findVerb(vr.obj, vr.verbName)
    if (!found || !found.verb.code) return ctx.tell(`No code at ${vr.obj.name}:${vr.verbName}.`, 'error')
    const res = await runVerb({ ...ctx, thisObj: vr.obj, verbDef: found.verb, verbHolder: found.holder, dobj: null, iobj: null, argstr: rest.join(' '), args: rest, dobjstr: rest.join(' '), prepstr: '', iobjstr: '', dryRun: true })
    if (res && res.report) ctx.tell(res.report, 'dim')
  },
})

registerCommand({
  name: 'eval', aliases: [';'], usage: ';<expression>', category: 'programming', requires: 'programmer', protected: true,
  summary: 'Evaluate a line of script and print the result. e.g. ;here.name   or   ;contents(here).map(o => o.name)',
  async handler(ctx) {
    const code = ctx.rawArgstr || ctx.argstr
    if (!code) return ctx.tell('Usage: ;1 + 1', 'error')
    const res = await evalSnippet(ctx, code)
    ctx.tell(res, 'dim')
  },
})

registerCommand({
  name: '@tasks', aliases: ['@forked'], usage: '@tasks', category: 'programming', requires: 'programmer', protected: true,
  summary: 'List your scheduled (forked) tasks.',
  async handler(ctx) {
    const tasks = listTasks(isWizard(ctx.player) ? null : ctx.player.id)
    if (!tasks.length) return ctx.tell('No scheduled tasks.')
    ctx.tell(tasks.map(t => `  ${t.id}  ${store.get(t.obj)?.name || t.obj}:${t.verb}  in ${Math.max(0, Math.round((t.at - Date.now()) / 1000))}s${t.every ? ` (every ${t.every}s)` : ''}`), 'dim')
  },
})

registerCommand({
  name: '@kill', usage: '@kill <task id> | all', category: 'programming', requires: 'programmer', protected: true,
  summary: 'Cancel a scheduled task of yours.',
  async handler(ctx) {
    const n = killTask(ctx.argstr, isWizard(ctx.player) ? null : ctx.player.id)
    ctx.tell(n ? `Cancelled ${n} task${n === 1 ? '' : 's'}.` : 'No such task of yours.', n ? 'system' : 'error')
  },
})

export default {}
