// MOO-style pronoun substitution for messages:
//   %n / %N  player's name          %t / %T  this object's name
//   %d / %D  direct object          %i / %I  indirect object
//   %l / %L  location name          %s %o %p %q %r  he/him/his/his/himself
//   %<verb>  verb agreement ("%<is>" -> "is" / "are" for plural "they")
//   %%       literal percent
import store from './store.js'

const PRONOUNS = {
  they: { s: 'they', o: 'them', p: 'their', q: 'theirs', r: 'themselves', plural: true },
  she: { s: 'she', o: 'her', p: 'her', q: 'hers', r: 'herself' },
  he: { s: 'he', o: 'him', p: 'his', q: 'his', r: 'himself' },
  it: { s: 'it', o: 'it', p: 'its', q: 'its', r: 'itself' },
}

const IRREGULAR = { is: 'are', has: 'have', was: 'were', does: 'do', goes: 'go', doesnt: "don't", isnt: "aren't", "doesn't": "don't", "isn't": "aren't" }

export function pronounsFor(obj) {
  const g = (obj?.props?.gender || (obj?.kind === 'player' ? 'they' : 'it')).toLowerCase()
  return PRONOUNS[g] || PRONOUNS.they
}

function agree(verb, plural) {
  if (!plural) return verb
  if (IRREGULAR[verb]) return IRREGULAR[verb]
  if (/(sh|ch|ss|x|z)es$/.test(verb)) return verb.slice(0, -2)
  if (/ies$/.test(verb)) return verb.slice(0, -3) + 'y'
  if (/s$/.test(verb)) return verb.slice(0, -1)
  return verb
}

function cap(s) { return s ? s[0].toUpperCase() + s.slice(1) : s }

export function substitute(text, ctx = {}) {
  if (!text) return ''
  const { player, thing, dobj, iobj } = ctx
  const pr = pronounsFor(player)
  const location = player?.location ? store.get(player.location) : null
  const nameOf = o => (o ? o.name : 'something')
  const theNameOf = o => (!o ? 'something' : (o.kind === 'player' || o.flags?.proper) ? o.name : `the ${o.name}`)
  return String(text).replace(/%(%|<[^>]+>|\[[^\]]+\]|\([^)]+\)|[a-zA-Z#])/g, (m, code) => {
    if (code === '%') return '%'
    if (code.startsWith('<')) return agree(code.slice(1, -1), pr.plural)
    if (code.startsWith('(')) { const k = code.slice(1, -1); return String(player?.props?.[k] ?? '') }
    if (code.startsWith('[')) {
      const inner = code.slice(1, -1)
      const which = inner[0]; const key = inner.slice(1)
      const target = { t: thing, d: dobj, i: iobj, l: location, n: player }[which]
      return String(target?.props?.[key] ?? '')
    }
    const lower = code.toLowerCase()
    const upper = code !== lower
    let out
    switch (lower) {
      case 'n': out = nameOf(player); break
      case 't': out = theNameOf(thing); break
      case 'd': out = theNameOf(dobj); break
      case 'i': out = theNameOf(iobj); break
      case 'l': out = nameOf(location); break
      case 's': out = pr.s; break
      case 'o': out = pr.o; break
      case 'p': out = pr.p; break
      case 'q': out = pr.q; break
      case 'r': out = pr.r; break
      case '#': out = player?.id || ''; break
      default: return m
    }
    return upper ? cap(out) : out
  })
}

export default substitute
