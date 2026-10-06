// JavaScript that runs inside the sandbox before every verb. It defines the
// object proxies and the small API scripts use. Keep it dependency-free: it
// is evaluated by QuickJS, not Node.
export const PRELUDE = String.raw`
const __env = JSON.parse(globalThis.__env);
const __cache = Object.create(null);
let __depth = 0;
function __h(op, arg) {
  const r = JSON.parse(__host(op, JSON.stringify(arg)));
  if (r && r.error) throw new Error(r.error);
  return r;
}
function __plain(v) { return JSON.parse(JSON.stringify(v === undefined ? null : v)); }
function __id(x) {
  if (x === null || x === undefined) return null;
  if (typeof x === 'string') return x;
  if (typeof x === 'object' && x.__id) return x.__id;
  throw new Error('expected an object (or its #id), got ' + typeof x);
}
function __unwrap(r) {
  if (r && r.ref) return obj(r.ref);
  if (r && r.refs) return r.refs.map(obj);
  return r ? r.value : undefined;
}
function obj(id) {
  id = __id(id);
  if (!id) return null;
  if (__cache[id]) return __cache[id];
  const p = new Proxy({ __id: id }, {
    get(t, key) {
      if (key === '__id' || key === 'id') return id;
      if (typeof key === 'symbol') { if (key === Symbol.toPrimitive) return () => id; return undefined; }
      if (key === 'toJSON' || key === 'toString' || key === 'valueOf') return () => id;
      if (key === 'then') return undefined;
      if (key === 'tell') return (text) => tell(id, text);
      if (key === 'announce') return (text, opts) => announce(text, Object.assign({}, opts || {}, { room: id }));
      if (key === 'move') return (dest) => move(id, dest);
      if (key === 'is') return (other) => __id(other) === id;
      if (key === 'has') return (k) => __h('has', { id, key: k }).value;
      if (key === 'room') return () => __unwrap(__h('room', { id }));
      return __unwrap(__h('get', { id, key: String(key) }));
    },
    set(t, key, value) { __h('set', { id, key: String(key), value: __plain(value) }); return true; },
    has(t, key) { return __h('has', { id, key: String(key) }).value; },
    deleteProperty(t, key) { __h('set', { id, key: String(key), value: null }); return true; },
  });
  __cache[id] = p;
  return p;
}
function tell(who, text) { return __h('tell', { to: __id(who), text: String(text) }).value; }
function announce(text, opts) {
  opts = opts || {};
  const except = opts.except ? [].concat(opts.except).map(__id) : [];
  return __h('announce', { roomId: opts.room ? __id(opts.room) : null, text: String(text), except, all: !!opts.all }).value;
}
function announceAll(text, opts) { return announce(text, Object.assign({}, opts || {}, { all: true })); }
function move(what, where) { return __h('move', { id: __id(what), dest: __id(where) }).value; }
function create(name, opts) {
  opts = opts || {};
  return __unwrap(__h('create', { name: String(name), parent: opts.parent ? __id(opts.parent) : null, description: opts.description || '', aliases: opts.aliases || [], where: opts.where ? __id(opts.where) : null }));
}
function recycle(what) { return __h('recycle', { id: __id(what) }).value; }
function find(name, where) { return __unwrap(__h('find', { name: String(name), where: where ? __id(where) : null })); }
function contents(what) { return __unwrap(__h('get', { id: __id(what), key: 'contents' })); }
function players(where) { return __unwrap(__h('get', { id: __id(where || here), key: 'players' })); }
function fork(seconds, verb) { const args = Array.prototype.slice.call(arguments, 2); return __h('fork', { seconds: Number(seconds), verb: String(verb), args: __plain(args) }).value; }
function every(seconds, verb) { const args = Array.prototype.slice.call(arguments, 2); return __h('fork', { seconds: Number(seconds), verb: String(verb), args: __plain(args), every: true }).value; }
function cancel(verb) { return __h('cancel', { verb: verb ? String(verb) : null }).value; }
function sub(text, thing) { return __h('sub', { text: String(text), thing: thing ? __id(thing) : null }).value; }
function roomOf(what) { return __unwrap(__h('room', { id: __id(what) })); }
function locked(what) { return __h('locked', { id: __id(what) }).value; }
function log(text) { return __h('log', { text: String(text) }).value; }
function random(a, b) { if (b === undefined) return Math.floor(Math.random() * a); return a + Math.floor(Math.random() * (b - a + 1)); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function cap(s) { s = String(s); return s ? s[0].toUpperCase() + s.slice(1) : s; }
function now() { return Date.now(); }
function list(items) { items = items.map(String); if (!items.length) return 'nothing'; if (items.length === 1) return items[0]; return items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1]; }
function name(x) { const o = obj(x); return o ? o.name : 'nothing'; }
function call(target, verb) {
  const args = Array.prototype.slice.call(arguments, 2);
  if (++__depth > __env.maxDepth) throw new Error('verb calls nested too deep');
  try {
    const info = __h('code', { id: __id(target), verb: String(verb) }).value;
    const fn = (0, eval)('(function(args, argstr, dobj, iobj, caller){\n' + info.code + '\n})');
    return fn.call(obj(info.thisId), args, args.join(' '), null, null, obj(__env.thisId));
  } finally { __depth--; }
}
globalThis.obj = obj; globalThis.tell = tell; globalThis.announce = announce; globalThis.announceAll = announceAll;
globalThis.move = move; globalThis.create = create; globalThis.recycle = recycle; globalThis.find = find; globalThis.contents = contents;
globalThis.players = players; globalThis.fork = fork; globalThis.every = every; globalThis.cancel = cancel; globalThis.sub = sub;
globalThis.roomOf = roomOf; globalThis.locked = locked; globalThis.log = log; globalThis.random = random; globalThis.pick = pick;
globalThis.cap = cap; globalThis.now = now; globalThis.list = list; globalThis.name = name; globalThis.call = call;
globalThis.player = obj(__env.playerId);
globalThis.here = obj(__env.hereId);
globalThis.me = globalThis.player;
globalThis.verb = __env.verb;
globalThis.scheduled = __env.scheduled;
globalThis.args = __env.args; globalThis.argstr = __env.argstr; globalThis.dobjstr = __env.dobjstr; globalThis.prepstr = __env.prepstr; globalThis.iobjstr = __env.iobjstr;
globalThis.__runMain = function () {
  return __main.call(obj(__env.thisId), __env.args, __env.argstr, obj(__env.dobjId), obj(__env.iobjId), null);
};
globalThis.__show = function (v) {
  if (v && typeof v === 'object' && v.__id) return v.__id + ' (' + v.name + ')';
  if (v === undefined) return 'undefined';
  if (Array.isArray(v)) return JSON.stringify(v.map(x => (x && x.__id) ? x.__id + ' (' + x.name + ')' : x));
  try { return JSON.stringify(v); } catch (e) { return String(v); }
};
`
export default PRELUDE
