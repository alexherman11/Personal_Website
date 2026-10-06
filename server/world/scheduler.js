// Scheduled tasks: fork(seconds, "verb", ...args) from scripts, persisted in
// the world meta so a restart does not lose a ticking clock.
import store from './store.js'
import { runVerb } from './script/sandbox.js'
import { roomOf } from './objects.js'

export const TASK_LIMITS = { perOwner: 20, minDelay: 1, maxDelay: 7 * 86400, minEvery: 10 }

let timer = null
let nextId = 1

export function listTasks(ownerId = null) {
  const tasks = store.meta.tasks || []
  return ownerId ? tasks.filter(t => t.owner === ownerId) : tasks
}

function saveTasks(tasks) {
  store.setMeta({ tasks })
}

export function scheduleTask({ owner, player, obj, verb, args = [], delay, every = null }) {
  const tasks = listTasks()
  const mine = tasks.filter(t => t.owner === owner)
  if (mine.length >= TASK_LIMITS.perOwner) return { ok: false, error: `You already have ${mine.length} scheduled tasks; @kill some first.` }
  delay = Math.min(TASK_LIMITS.maxDelay, Math.max(TASK_LIMITS.minDelay, Number(delay) || 0))
  if (every !== null) every = Math.max(TASK_LIMITS.minEvery, Number(every) || TASK_LIMITS.minEvery)
  nextId = Math.max(nextId, ...tasks.map(t => Number(String(t.id).replace('t', '')) + 1), 1)
  const task = { id: 't' + nextId++, owner, player, obj, verb, args: JSON.parse(JSON.stringify(args)).slice(0, 10), at: Date.now() + delay * 1000, every, created: Date.now() }
  tasks.push(task)
  saveTasks(tasks)
  return { ok: true, task }
}

export function killTask(ref, ownerId = null) {
  let tasks = listTasks()
  const before = tasks.length
  if (ref === 'all') tasks = tasks.filter(t => ownerId && t.owner !== ownerId)
  else tasks = tasks.filter(t => !(t.id === ref && (!ownerId || t.owner === ownerId)))
  saveTasks(tasks)
  return before - tasks.length
}

export function killTasksFor(objId) {
  const tasks = listTasks().filter(t => t.obj !== objId)
  saveTasks(tasks)
}

async function tick() {
  const now = Date.now()
  const tasks = listTasks()
  const due = tasks.filter(t => t.at <= now)
  if (!due.length) return
  const remaining = tasks.filter(t => t.at > now)
  for (const t of due) {
    const obj = store.get(t.obj)
    const owner = store.get(t.owner)
    if (!obj || !owner) continue
    const found = store.findVerb(obj, t.verb)
    if (found && found.verb.code) {
      const player = store.get(t.player) || owner
      try {
        await runVerb({
          player, session: null, room: roomOf(obj) || roomOf(player), store,
          thisObj: obj, verbDef: found.verb, verbHolder: found.holder, dobj: null, iobj: null,
          args: t.args, argstr: t.args.join(' '), dobjstr: '', prepstr: '', iobjstr: '', verb: t.verb, raw: '', scheduled: true,
          tell: () => {}, announce: () => {}, send: () => {},
        })
      } catch (err) { console.error('[task]', t.id, err.message) }
    }
    if (t.every) remaining.push({ ...t, at: now + t.every * 1000 })
  }
  saveTasks(remaining)
}

export function startScheduler() {
  if (timer) return
  timer = setInterval(() => { tick().catch(err => console.error('[scheduler]', err)) }, 1000)
}
