// Seed the world from the hand-written content in src/data (the source of
// truth for everything about Alex). Seed objects carry flags.seed and are
// re-synced from the data files on every boot, so editing rooms.js still
// edits the world; everything players build lives only in the store.
import store from './store.js'
import rooms from '../../src/data/rooms.js'
import itemDefs from '../../src/data/items.js'
import logbooks from '../../src/data/logbooks.js'
import { WIZARD_ID, SYSTEM_ID } from './objects.js'
import { roomSenses } from './content/senses.js'
import { handbookPages } from './content/helpTopics.js'
import { EXTRA_ROOMS, EXTRA_EXITS, EXTRA_OBJECTS, EXTRA_ROOM_EXITS, EXTRA_EXIT_ALIASES } from './content/vaultRooms.js'

function stripArticle(name) {
  return String(name || '').replace(/^(a|an|the)\s+/i, '')
}

function upsert(spec) {
  const existing = store.get(spec.id)
  if (!existing) return store.create({ ...spec, flags: { ...(spec.flags || {}), seed: true } })
  // Re-sync source-owned fields, keep anything in-world edits are allowed to touch.
  existing.kind = spec.kind
  existing.name = spec.name
  existing.aliases = spec.aliases || []
  existing.parent = spec.parent ?? existing.parent ?? null
  existing.owner = spec.owner ?? existing.owner
  existing.location = spec.location ?? existing.location
  existing.description = spec.description ?? existing.description
  existing.props = { ...(existing.props || {}), ...(spec.props || {}) }
  existing.messages = { ...(existing.messages || {}), ...(spec.messages || {}) }
  existing.flags = { ...(existing.flags || {}), ...(spec.flags || {}), seed: true }
  if (spec.verbs) existing.verbs = { ...(existing.verbs || {}), ...spec.verbs }
  if (spec.perms) existing.perms = { ...existing.perms, ...spec.perms }
  store.save(existing)
  return existing
}

export function seedWorld() {
  // ---- generics ----
  upsert({ id: '#thing', kind: 'generic', name: 'generic thing', aliases: ['thing'], owner: WIZARD_ID, perms: { r: true, w: false, f: true },
    description: 'A plain, ordinary thing. Everything buildable descends from it.',
    props: { help: 'The root of all things. @create $thing named "my object" makes one.' } })
  upsert({ id: '#room', kind: 'generic', name: 'generic room', aliases: ['room'], owner: WIZARD_ID, perms: { r: true, w: false, f: true },
    description: 'An empty room.', props: { help: 'Rooms hold things and players. @dig makes one.' } })
  upsert({ id: '#exit', kind: 'generic', name: 'generic exit', aliases: ['exit'], owner: WIZARD_ID, perms: { r: true, w: false, f: true },
    description: 'A way from one room to another.', props: { help: 'Exits join rooms. @dig north to "Name" makes a pair of them.' } })
  upsert({ id: '#player', kind: 'generic', name: 'generic player', aliases: ['player'], owner: WIZARD_ID, perms: { r: true, w: false, f: false },
    description: 'A visitor to The Depths.' })
  upsert({ id: '#note', kind: 'generic', name: 'generic note', aliases: ['note'], owner: WIZARD_ID, parent: '#thing', perms: { r: true, w: false, f: true },
    description: 'A note. Blank, for now.', props: { text: [], help: 'Notes can be read and written: "read note", "write <text> on note", "erase note".' } })
  upsert({ id: '#container', kind: 'generic', name: 'generic container', aliases: ['container'], owner: WIZARD_ID, parent: '#thing', perms: { r: true, w: false, f: true },
    description: 'A container. Things can be put in it.', props: { container: true, opened: true, help: '"put <thing> in <container>", "take <thing> from <container>", "open"/"close".' } })

  // ---- system + wizard ----
  upsert({ id: SYSTEM_ID, kind: 'generic', name: 'The Depths', aliases: ['system'], owner: WIZARD_ID, description: 'The world itself.', perms: { r: true } })
  const wiz = store.get(WIZARD_ID)
  if (wiz && !wiz.props.phase) { wiz.props.phase = 'playing'; wiz.props.flags = { ...(wiz.props.flags || {}), door_opened: true }; store.save(wiz) }
  if (!wiz) {
    store.create({ id: WIZARD_ID, kind: 'player', name: 'Alex', aliases: ['alex herman', 'wizard'], parent: '#player', owner: WIZARD_ID,
      location: '#grand_hall', description: 'Alex Herman — the builder of this place. He looks like someone who has spent a lot of time outside.',
      props: { gender: 'he', home: '#grand_hall', quota: 1000000, flags: { door_opened: true }, registered: true, phase: 'playing', visited: ['#grand_hall'] },
      flags: { seed: true, wizard: true, programmer: true, proper: true } })
  }

  // ---- rooms ----
  const allRooms = { ...rooms, ...EXTRA_ROOMS }
  for (const [key, extra] of Object.entries(EXTRA_ROOM_EXITS)) {
    allRooms[key] = { ...allRooms[key], exits: { ...(allRooms[key].exits || {}), ...extra } }
  }
  for (const [key, r] of Object.entries(allRooms)) {
    const id = '#' + key
    upsert({
      id, kind: 'room', name: r.name, aliases: [stripArticle(r.name).toLowerCase()], parent: '#room', owner: WIZARD_ID,
      description: r.description,
      props: {
        asciiArt: r.asciiArt || [],
        cluster: r.cluster || 'indoor',
        hidden: r.hiddenInteractions || {},
        senses: roomSenses[key] || {},
        seedKey: key,
      },
      perms: { r: true, w: false, f: false },
    })
    // scenery objects
    for (const [okey, o] of Object.entries(r.objects || {})) {
      upsert({
        id: `${id}.${okey}`, kind: 'thing', name: stripArticle(o.name), aliases: o.keywords || [], parent: '#thing', owner: WIZARD_ID,
        location: id, description: o.examineText || '',
        props: { logbook: o.logbookId || null, scenery: true },
        flags: { scenery: true },
      })
    }
    // per-player items
    for (const [ikey, it] of Object.entries(r.items || {})) {
      const def = itemDefs[it.id] || {}
      upsert({
        id: `#item.${it.id}`, kind: 'thing', name: def.name || it.id, aliases: it.keywords || [], parent: '#thing', owner: WIZARD_ID,
        location: id, description: def.description || '',
        props: { icon: def.icon || '', realLink: def.realLink || null, takeText: it.takeText || '', isVaultClue: !!def.isVaultClue },
        flags: { perPlayer: true, takeable: true },
      })
    }
    // exits
    const aliasMap = r.exitAliases || {}
    for (const [dir, dest] of Object.entries(r.exits || {})) {
      const destRoom = allRooms[dest]
      const names = [dir, ...(aliasMap[dir] || []), ...(EXTRA_EXIT_ALIASES[`${key}.${dir}`] || [])]
      const extra = EXTRA_EXITS[`${key}.${dir}`] || {}
      upsert({
        id: `#exit.${key}.${dir}`, kind: 'exit', name: dir, aliases: names.slice(1).concat(destRoom ? [stripArticle(destRoom.name).toLowerCase()] : []),
        parent: '#exit', owner: WIZARD_ID, location: id,
        description: '',
        props: { dest: '#' + dest, direction: dir, named: !(dir in { north: 1, south: 1, east: 1, west: 1, up: 1, down: 1 }), ...extra.props },
        flags: { ...(extra.flags || {}) },
      })
    }
  }
  // items that exist only in itemDefs (iron key is found at the tree)
  upsert({
    id: '#item.iron_key', kind: 'thing', name: itemDefs.iron_key.name, aliases: ['key', 'iron key'], parent: '#thing', owner: WIZARD_ID,
    location: null, description: itemDefs.iron_key.description,
    props: { icon: itemDefs.iron_key.icon, takeText: '' }, flags: { perPlayer: true, takeable: true, hidden: true },
  })

  for (const spec of EXTRA_OBJECTS) upsert(spec)
  upsert({
    id: '#item.programmer_bit', kind: 'thing', name: 'Programmer Bit', aliases: ['bit', 'programmer bit', 'the bit'], parent: '#thing', owner: WIZARD_ID,
    location: null, description: 'One bit. It weighs nothing and changes everything. With it, you can build: "help building".',
    props: { icon: '\u2726', takeText: '' }, flags: { perPlayer: true, takeable: true, hidden: true },
  })

  // logbooks are content, not objects: stash them on the system object
  const sys = store.get(SYSTEM_ID)
  sys.props.logbooks = { ...logbooks, handbook: { id: 'handbook', title: "THE BUILDER'S HANDBOOK", pages: handbookPages() } }
  store.save(sys)
  return store
}

export default seedWorld
