// Boot the world: load, seed, register commands, start the scheduler.
import store from './store.js'
import { seedWorld } from './seed.js'
import { syncWizardPassword } from './auth.js'
import { startScheduler } from './scheduler.js'
import { initSandbox } from './script/sandbox.js'
import { seedExamples } from './content/examples.js'
import './commands/basic.js'
import './commands/social.js'
import './commands/building.js'
import './commands/programming.js'
import './commands/admin.js'
import './commands/help.js'
import './vault.js'

export async function bootWorld() {
  store.load()
  seedWorld()
  await initSandbox()
  seedExamples()
  syncWizardPassword()
  store.startAutosave()
  startScheduler()
  let n = 0; for (const _ of store.all()) n++
  console.log(`[world] ${n} objects loaded`)
  return store
}

export { attachWebSocket } from './ws.js'
