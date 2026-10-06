// First steps inside: ask the visitor what the halls should call them.
import { setName } from './auth.js'

export function enterNamePrompt(session) {
  const player = session.p
  if (!/^Visitor-\d+$/.test(player.name)) return
  session.mode = 'name'
  session.modeData = {
    setName: n => setName(player, n),
    onDone: () => { session.send({ t: 'player', name: session.p.name }) },
  }
  session.send({ t: 'mode', mode: 'name', prompt: 'name>' })
  session.out([
    '',
    'The hall seems to wait. Not for a password — for a name.',
    'What should these walls call you? (Type a name, or "skip".)',
  ], 'system')
}
