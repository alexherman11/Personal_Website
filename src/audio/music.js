import * as Tone from 'tone'
import audioEngine from './audioEngine'

// ── Shared musical constants ────────────────────────────────────────

const BPM = 78

// ── Helper: create common synth types ───────────────────────────────

function makeBass(output) {
  const synth = new Tone.MonoSynth({
    oscillator: { type: 'sawtooth' },
    filter: { Q: 2, type: 'lowpass', rolloff: -24 },
    filterEnvelope: { attack: 0.02, decay: 0.2, sustain: 0.4, release: 0.3, baseFrequency: 100, octaves: 2 },
    envelope: { attack: 0.01, decay: 0.2, sustain: 0.6, release: 0.3 },
  })
  const gain = new Tone.Gain(0)
  synth.connect(gain)
  gain.connect(output)
  return { synth, gain }
}

function makePad(output) {
  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope: { attack: 1.5, decay: 1.0, sustain: 0.6, release: 2.0 },
  })
  const gain = new Tone.Gain(0)
  synth.connect(gain)
  gain.connect(output)
  return { synth, gain }
}

function makeLead(output) {
  const synth = new Tone.Synth({
    oscillator: { type: 'square' },
    envelope: { attack: 0.05, decay: 0.3, sustain: 0.3, release: 0.5 },
  })
  const gain = new Tone.Gain(0)
  synth.connect(gain)
  gain.connect(output)
  return { synth, gain }
}

function makeRhythm(output) {
  const synth = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.03 },
  })
  const filter = new Tone.Filter(6000, 'highpass')
  const gain = new Tone.Gain(0)
  synth.connect(filter)
  filter.connect(gain)
  gain.connect(output)
  return { synth, gain, filter }
}

// ── Pattern generators ──────────────────────────────────────────────
// Each returns an array of {time, note, dur, vel} events for Tone.Part

// Time helper: "bar:beat:sixteenth"
function t(bar, beat = 0, sub = 0) {
  return `${bar}:${beat}:${sub}`
}

// Arpeggiate a note array as 8th notes for N bars, repeating the pattern
function arp(notes, startBar, bars, vel = 0.6) {
  const events = []
  const stepsPerBar = 8 // 8th notes
  for (let bar = 0; bar < bars; bar++) {
    for (let step = 0; step < stepsPerBar; step++) {
      const note = notes[step % notes.length]
      if (note) {
        events.push({ time: t(startBar + bar, 0, step * 2), note, dur: '8n', vel })
      }
    }
  }
  return events
}

// Walking quarter notes for N bars
function walk(notes, startBar, bars, vel = 0.6) {
  const events = []
  for (let bar = 0; bar < bars; bar++) {
    for (let beat = 0; beat < 4; beat++) {
      const note = notes[(bar * 4 + beat) % notes.length]
      if (note) {
        events.push({ time: t(startBar + bar, beat), note, dur: '4n', vel })
      }
    }
  }
  return events
}

// Whole notes (one note per bar)
function wholes(notes, startBar, vel = 0.5) {
  return notes.map((note, i) => note ? { time: t(startBar + i), note, dur: '1m', vel } : null).filter(Boolean)
}

// Chord pad hits: play chords from a list, one every `interval` bars
function chordPad(chordList, startBar, interval, count, vel = 0.2) {
  const events = []
  for (let i = 0; i < count; i++) {
    const chord = chordList[i % chordList.length]
    events.push({ time: t(startBar + i * interval), chord, dur: `${interval}m`, vel })
  }
  return events
}

// Syncopated 8th note bass pattern for N bars
function syncopated(notes, startBar, bars, vel = 0.7) {
  // Pattern: X _ X X _ X X _ (syncopated feel)
  const hits = [0, 2, 3, 5, 6] // which 8th note positions have hits
  const events = []
  for (let bar = 0; bar < bars; bar++) {
    for (const pos of hits) {
      const note = notes[(bar * hits.length + hits.indexOf(pos)) % notes.length]
      if (note) {
        events.push({ time: t(startBar + bar, 0, pos * 2), note, dur: '8n', vel })
      }
    }
  }
  return events
}

// Hi-hat pattern for N bars (16th notes with velocity accents)
function hats(pattern, startBar, bars) {
  // pattern is array of velocities per 16th note (0 = rest)
  const events = []
  for (let bar = 0; bar < bars; bar++) {
    for (let i = 0; i < pattern.length; i++) {
      if (pattern[i]) {
        events.push({ time: t(startBar + bar, 0, i), vel: pattern[i] })
      }
    }
  }
  return events
}

// Sparse kick pattern for N bars (hit on specific 8th note positions)
function kicks(positions, startBar, bars, vel = 0.5) {
  const events = []
  for (let bar = 0; bar < bars; bar++) {
    for (const pos of positions) {
      events.push({ time: t(startBar + bar, 0, pos * 2), vel })
    }
  }
  return events
}

// Melodic phrase — array of {note, pos} placed at startBar
// pos is 8th note offset within the section
function phrase(noteSequence, startBar, vel = 0.35) {
  const events = []
  let eighthPos = 0
  for (const entry of noteSequence) {
    if (entry === null) { eighthPos++; continue }
    const bar = Math.floor(eighthPos / 8)
    const sub = (eighthPos % 8) * 2
    events.push({ time: t(startBar + bar, 0, sub), note: entry, dur: '8n', vel })
    eighthPos++
  }
  return events
}

// Pulsing octave bass (alternating root and octave above)
function pulse(root, octaveUp, startBar, bars, vel = 0.6) {
  const events = []
  for (let bar = 0; bar < bars; bar++) {
    for (let step = 0; step < 8; step++) {
      const note = step % 2 === 0 ? root : octaveUp
      // Add some rests for breathing
      if (step === 4 || step === 7) continue
      events.push({ time: t(startBar + bar, 0, step * 2), note, dur: '8n', vel })
    }
  }
  return events
}

// ── Room music configurations ───────────────────────────────────────
// Each returns { nodes[], sequences[], fadeIn(t), fadeOut(t) }
// "sequences" now contains Tone.Part instances

const roomMusicConfigs = {

  // ─ entrance: A→B→A (24 bars) — sparse Am drone that breathes ─────
  entrance: (output) => {
    const nodes = []
    const parts = []

    const pad = makePad(output)
    nodes.push(pad.synth, pad.gain)

    const padPart = new Tone.Part((time, e) => {
      pad.synth.triggerAttackRelease(e.chord, e.dur, time, e.vel)
    }, [
      // Section A (0-8): static Am drone
      ...chordPad([['A2', 'C3', 'E3']], 0, 2, 4, 0.3),
      // Section B (8-16): Dm + higher voicing
      ...chordPad([['D3', 'F3', 'A3'], ['A2', 'E3', 'A3']], 8, 2, 4, 0.3),
      // Section A' (16-24): return to Am
      ...chordPad([['A2', 'C3', 'E3']], 16, 2, 4, 0.3),
    ])
    padPart.loop = true
    padPart.loopEnd = '24m'
    parts.push(padPart)

    // Subtle high note in section B only
    const lead = makeLead(output)
    nodes.push(lead.synth, lead.gain)

    const leadPart = new Tone.Part((time, e) => {
      lead.synth.triggerAttackRelease(e.note, e.dur, time, e.vel)
    }, [
      { time: t(10), note: 'E4', dur: '2m', vel: 0.15 },
      { time: t(14), note: 'C4', dur: '2m', vel: 0.12 },
    ])
    leadPart.loop = true
    leadPart.loopEnd = '24m'
    parts.push(leadPart)

    // Arrangement
    const arr = new Tone.Part((time, e) => {
      if (e.pad !== undefined) pad.gain.gain.rampTo(e.pad, 2, time)
      if (e.lead !== undefined) lead.gain.gain.rampTo(e.lead, 2, time)
    }, [
      { time: '0:0:0', pad: 0.08, lead: 0 },
      { time: '8:0:0', pad: 0.09, lead: 0.04 },
      { time: '16:0:0', pad: 0.08, lead: 0 },
    ])
    arr.loop = true
    arr.loopEnd = '24m'
    parts.push(arr)

    return {
      nodes, sequences: parts,
      fadeIn(t) { pad.gain.gain.rampTo(0.08, t); for (const p of parts) p.start(0) },
      fadeOut(t) { pad.gain.gain.rampTo(0, t); lead.gain.gain.rampTo(0, t) },
    }
  },

  // ─ grounds: A→B→C→A (32 bars) — open walking bass + chords ───────
  grounds: (output) => {
    const nodes = []
    const parts = []

    const bass = makeBass(output)
    nodes.push(bass.synth, bass.gain)

    const bassPart = new Tone.Part((time, e) => {
      bass.synth.triggerAttackRelease(e.note, e.dur, time, e.vel)
    }, [
      // A (0-8): simple walking Am
      ...walk(['A2', 'E2', 'F2', 'E2', 'A2', 'G2', 'F2', 'E2'], 0, 8),
      // B (8-16): shift to F/C territory
      ...walk(['F2', 'A2', 'C3', 'A2', 'C3', 'E3', 'C3', 'G2'], 8, 8),
      // C (16-24): higher register, G chord
      ...walk(['G2', 'B2', 'D3', 'B2', 'A2', 'C3', 'E3', 'C3'], 16, 8),
      // A' (24-32): return
      ...walk(['A2', 'E2', 'F2', 'E2', 'A2', 'G2', 'F2', 'E2'], 24, 8),
    ])
    bassPart.loop = true
    bassPart.loopEnd = '32m'
    parts.push(bassPart)

    const pad = makePad(output)
    nodes.push(pad.synth, pad.gain)

    const padPart = new Tone.Part((time, e) => {
      pad.synth.triggerAttackRelease(e.chord, e.dur, time, e.vel)
    }, [
      // A: Am
      ...chordPad([['A2', 'C3', 'E3']], 0, 2, 4),
      // B: F, C
      ...chordPad([['F2', 'A2', 'C3'], ['C3', 'E3', 'G3']], 8, 2, 4),
      // C: G, Am
      ...chordPad([['G2', 'B2', 'D3'], ['A2', 'C3', 'E3']], 16, 2, 4),
      // A': Am
      ...chordPad([['A2', 'C3', 'E3']], 24, 2, 4),
    ])
    padPart.loop = true
    padPart.loopEnd = '32m'
    parts.push(padPart)

    const arr = new Tone.Part((time, e) => {
      if (e.bass !== undefined) bass.gain.gain.rampTo(e.bass, 2, time)
      if (e.pad !== undefined) pad.gain.gain.rampTo(e.pad, 2, time)
    }, [
      { time: '0:0:0', bass: 0.1, pad: 0.06 },
      { time: '8:0:0', bass: 0.1, pad: 0.07 },
      { time: '16:0:0', bass: 0.08, pad: 0.07 },
      { time: '24:0:0', bass: 0.1, pad: 0.06 },
    ])
    arr.loop = true
    arr.loopEnd = '32m'
    parts.push(arr)

    return {
      nodes, sequences: parts,
      fadeIn(t) {
        bass.gain.gain.rampTo(0.1, t); pad.gain.gain.rampTo(0.06, t)
        for (const p of parts) p.start(0)
      },
      fadeOut(t) { bass.gain.gain.rampTo(0, t); pad.gain.gain.rampTo(0, t) },
    }
  },

  // ─ tree: A→B→C (24 bars) — ethereal pads build to melody ─────────
  tree: (output) => {
    const nodes = []
    const parts = []

    const pad = makePad(output)
    nodes.push(pad.synth, pad.gain)

    const padPart = new Tone.Part((time, e) => {
      pad.synth.triggerAttackRelease(e.chord, e.dur, time, e.vel)
    }, [
      // A (0-8): Am7 only
      ...chordPad([['A2', 'C3', 'E3', 'G3']], 0, 2, 4, 0.2),
      // B (8-16): richer — Dm7, Fmaj7
      ...chordPad([['D3', 'F3', 'A3', 'C4'], ['F3', 'A3', 'C4', 'E4']], 8, 2, 4, 0.22),
      // C (16-24): Am7 → Em7 → Fmaj7
      ...chordPad([['A2', 'C3', 'E3', 'G3'], ['E3', 'G3', 'B3', 'D4'], ['F3', 'A3', 'C4', 'E4'], ['A2', 'C3', 'E3', 'G3']], 16, 2, 4, 0.2),
    ])
    padPart.loop = true
    padPart.loopEnd = '24m'
    parts.push(padPart)

    const lead = makeLead(output)
    nodes.push(lead.synth, lead.gain)

    const leadPart = new Tone.Part((time, e) => {
      lead.synth.triggerAttackRelease(e.note, e.dur, time, e.vel)
    }, [
      // Silent in A (0-8)
      // B (8-16): sparse arpeggiated wind-chime notes
      ...phrase(['E4', null, null, 'C4', null, null, null, 'A3',
        null, null, 'G3', null, null, null, null, null], 8, 0.3),
      ...phrase([null, null, 'G3', null, 'A3', null, null, null,
        'C4', null, null, null, null, null, null, null], 10, 0.25),
      // C (16-24): fuller melody
      ...phrase(['E4', null, 'D4', null, 'C4', null, 'A3', null,
        'G3', null, null, null, 'A3', null, 'C4', null], 16, 0.35),
      ...phrase(['E4', null, null, 'G4', null, null, 'E4', null,
        'D4', null, 'C4', null, null, null, null, null], 18, 0.3),
      ...phrase(['A3', null, null, null, 'C4', null, null, null,
        null, null, null, null, null, null, null, null], 20, 0.25),
    ])
    leadPart.loop = true
    leadPart.loopEnd = '24m'
    parts.push(leadPart)

    const arr = new Tone.Part((time, e) => {
      if (e.pad !== undefined) pad.gain.gain.rampTo(e.pad, 2, time)
      if (e.lead !== undefined) lead.gain.gain.rampTo(e.lead, 2, time)
    }, [
      { time: '0:0:0', pad: 0.07, lead: 0 },
      { time: '8:0:0', pad: 0.07, lead: 0.035 },
      { time: '16:0:0', pad: 0.08, lead: 0.045 },
    ])
    arr.loop = true
    arr.loopEnd = '24m'
    parts.push(arr)

    return {
      nodes, sequences: parts,
      fadeIn(t) {
        pad.gain.gain.rampTo(0.07, t)
        for (const p of parts) p.start(0)
      },
      fadeOut(t) { pad.gain.gain.rampTo(0, t); lead.gain.gain.rampTo(0, t) },
    }
  },

  // ─ grand_hall: A→B→C→D (32 bars) — full arrangement builds ───────
  grand_hall: (output) => {
    const nodes = []
    const parts = []

    const bass = makeBass(output)
    nodes.push(bass.synth, bass.gain)

    const bassPart = new Tone.Part((time, e) => {
      bass.synth.triggerAttackRelease(e.note, e.dur, time, e.vel)
    }, [
      // A (0-8): Am arpeggio
      ...arp(['A2', 'C3', 'E3', 'A3', 'E3', 'C3', 'A2', null], 0, 8),
      // B (8-16): F arpeggio
      ...arp(['F2', 'A2', 'C3', 'F3', 'C3', 'A2', 'F2', null], 8, 8),
      // C (16-24): Dm walking variation
      ...walk(['D2', 'F2', 'A2', 'D3', 'A2', 'F2', 'D2', 'A2',
        'E2', 'G2', 'B2', 'E3', 'B2', 'G2', 'E2', 'B2'], 16, 8),
      // D (24-32): return to Am, sparser
      ...arp(['A2', null, 'E3', null, 'A3', null, 'E3', null], 24, 8, 0.5),
    ])
    bassPart.loop = true
    bassPart.loopEnd = '32m'
    parts.push(bassPart)

    const pad = makePad(output)
    nodes.push(pad.synth, pad.gain)

    const padPart = new Tone.Part((time, e) => {
      pad.synth.triggerAttackRelease(e.chord, e.dur, time, e.vel)
    }, [
      // A: Am → Em
      ...chordPad([['A2', 'C3', 'E3'], ['E2', 'G2', 'B2']], 0, 2, 4),
      // B: F → E
      ...chordPad([['F2', 'A2', 'C3'], ['E2', 'G#2', 'B2']], 8, 2, 4),
      // C: Dm → G → Am → E
      ...chordPad([['D3', 'F3', 'A3'], ['G2', 'B2', 'D3'], ['A2', 'C3', 'E3'], ['E2', 'G#2', 'B2']], 16, 2, 4),
      // D: Am (sustained)
      ...chordPad([['A2', 'C3', 'E3']], 24, 4, 2, 0.25),
    ])
    padPart.loop = true
    padPart.loopEnd = '32m'
    parts.push(padPart)

    const rhythm = makeRhythm(output)
    nodes.push(rhythm.synth, rhythm.gain, rhythm.filter)
    rhythm.filter.frequency.value = 200
    rhythm.filter.type = 'lowpass'
    rhythm.synth.envelope.decay = 0.15

    const rhythmPart = new Tone.Part((time, e) => {
      rhythm.synth.triggerAttackRelease('8n', time, e.vel)
    }, [
      // Silent in A (0-8)
      // B (8-16): sparse kicks on 1 and 3
      ...kicks([0, 4], 8, 8),
      // C (16-24): fuller — 1, 3 + occasional 2.5
      ...kicks([0, 4], 16, 8),
      ...kicks([3], 18, 2, 0.3), // extra hit in bars 18-19
      ...kicks([3], 22, 2, 0.3), // extra hit in bars 22-23
      // Silent in D (24-32)
    ])
    rhythmPart.loop = true
    rhythmPart.loopEnd = '32m'
    parts.push(rhythmPart)

    const lead = makeLead(output)
    nodes.push(lead.synth, lead.gain)

    const leadPart = new Tone.Part((time, e) => {
      lead.synth.triggerAttackRelease(e.note, e.dur, time, e.vel)
    }, [
      // Silent in A and B (0-16)
      // C (16-24): descending phrase, then response
      ...phrase(['E4', 'D4', 'C4', 'A3', null, null, null, null], 16, 0.35),
      ...phrase([null, null, null, null, 'C4', 'D4', 'E4', null], 17, 0.3),
      ...phrase(['E4', null, 'G4', null, 'E4', 'D4', 'C4', null], 20, 0.35),
      ...phrase([null, null, 'A3', null, null, null, null, null], 21, 0.25),
      // D (24-32): ghost of the melody, very sparse
      ...phrase(['E4', null, null, null, null, null, null, null,
        null, null, null, null, null, null, 'C4', null], 26, 0.2),
    ])
    leadPart.loop = true
    leadPart.loopEnd = '32m'
    parts.push(leadPart)

    const arr = new Tone.Part((time, e) => {
      if (e.bass !== undefined) bass.gain.gain.rampTo(e.bass, 2, time)
      if (e.pad !== undefined) pad.gain.gain.rampTo(e.pad, 2, time)
      if (e.rhythm !== undefined) rhythm.gain.gain.rampTo(e.rhythm, 2, time)
      if (e.lead !== undefined) lead.gain.gain.rampTo(e.lead, 2, time)
    }, [
      { time: '0:0:0', bass: 0.09, pad: 0.05, rhythm: 0, lead: 0 },
      { time: '8:0:0', bass: 0.09, pad: 0.05, rhythm: 0.04, lead: 0 },
      { time: '16:0:0', bass: 0.09, pad: 0.05, rhythm: 0.04, lead: 0.04 },
      { time: '24:0:0', bass: 0.06, pad: 0.06, rhythm: 0, lead: 0.02 },
    ])
    arr.loop = true
    arr.loopEnd = '32m'
    parts.push(arr)

    return {
      nodes, sequences: parts,
      fadeIn(t) {
        bass.gain.gain.rampTo(0.09, t); pad.gain.gain.rampTo(0.05, t)
        for (const p of parts) p.start(0)
      },
      fadeOut(t) {
        bass.gain.gain.rampTo(0, t); pad.gain.gain.rampTo(0, t)
        rhythm.gain.gain.rampTo(0, t); lead.gain.gain.rampTo(0, t)
      },
    }
  },

  // ─ archive: A→B→A (24 bars) — quiet, scholarly ───────────────────
  archive: (output) => {
    const nodes = []
    const parts = []

    const bass = makeBass(output)
    nodes.push(bass.synth, bass.gain)

    const bassPart = new Tone.Part((time, e) => {
      bass.synth.triggerAttackRelease(e.note, e.dur, time, e.vel)
    }, [
      // A (0-8): whole notes
      ...wholes(['A2', 'D2', 'F2', 'E2', 'A2', 'D2', 'F2', 'E2'], 0),
      // B (8-16): quarter note walking
      ...walk(['A2', 'C3', 'E3', 'C3', 'D2', 'F2', 'A2', 'F2',
        'F2', 'A2', 'C3', 'A2', 'E2', 'G2', 'B2', 'G2'], 8, 8, 0.5),
      // A' (16-24): back to whole notes
      ...wholes(['A2', 'D2', 'F2', 'E2', 'A2', 'C3', 'F2', 'E2'], 16),
    ])
    bassPart.loop = true
    bassPart.loopEnd = '24m'
    parts.push(bassPart)

    const pad = makePad(output)
    nodes.push(pad.synth, pad.gain)

    const padPart = new Tone.Part((time, e) => {
      pad.synth.triggerAttackRelease(e.chord, e.dur, time, e.vel)
    }, [
      // A: Am7
      ...chordPad([['A2', 'C3', 'E3', 'G3']], 0, 4, 2),
      // B: Dm7 → Am7 → Fmaj7 → Em7
      ...chordPad([['D3', 'F3', 'A3', 'C4'], ['A2', 'C3', 'E3', 'G3'],
        ['F3', 'A3', 'C4', 'E4'], ['E3', 'G3', 'B3', 'D4']], 8, 2, 4),
      // A': Am7
      ...chordPad([['A2', 'C3', 'E3', 'G3']], 16, 4, 2),
    ])
    padPart.loop = true
    padPart.loopEnd = '24m'
    parts.push(padPart)

    const arr = new Tone.Part((time, e) => {
      if (e.bass !== undefined) bass.gain.gain.rampTo(e.bass, 2, time)
      if (e.pad !== undefined) pad.gain.gain.rampTo(e.pad, 2, time)
    }, [
      { time: '0:0:0', bass: 0.06, pad: 0.05 },
      { time: '8:0:0', bass: 0.08, pad: 0.06 },
      { time: '16:0:0', bass: 0.06, pad: 0.05 },
    ])
    arr.loop = true
    arr.loopEnd = '24m'
    parts.push(arr)

    return {
      nodes, sequences: parts,
      fadeIn(t) {
        bass.gain.gain.rampTo(0.06, t); pad.gain.gain.rampTo(0.05, t)
        for (const p of parts) p.start(0)
      },
      fadeOut(t) { bass.gain.gain.rampTo(0, t); pad.gain.gain.rampTo(0, t) },
    }
  },

  // ─ workshop: A→B→C→D (32 bars) — energetic, builds ───────────────
  workshop: (output) => {
    const nodes = []
    const parts = []

    const bass = makeBass(output)
    nodes.push(bass.synth, bass.gain)

    const bassPart = new Tone.Part((time, e) => {
      bass.synth.triggerAttackRelease(e.note, e.dur, time, e.vel)
    }, [
      // A (0-8): syncopated Am
      ...syncopated(['A2', 'A2', 'C3', 'E3', 'D3', 'F2', 'F2', 'A2', 'C3', 'A2'], 0, 8),
      // B (8-16): same pattern, shifted
      ...syncopated(['A2', 'C3', 'E3', 'D3', 'C3', 'F2', 'A2', 'C3', 'E3', 'C3'], 8, 8),
      // C (16-24): bass drops out — silence (breakdown)
      // D (24-32): return with variation
      ...syncopated(['A2', 'E3', 'A2', 'C3', 'D3', 'F2', 'C3', 'F2', 'A2', 'E3'], 24, 8),
    ])
    bassPart.loop = true
    bassPart.loopEnd = '32m'
    parts.push(bassPart)

    const rhythm = makeRhythm(output)
    nodes.push(rhythm.synth, rhythm.gain, rhythm.filter)

    const hatPattern = [0.5, 0.2, 0.3, 0.2, 0.5, 0.2, 0.3, 0.2,
      0.5, 0.2, 0.3, 0.2, 0.5, 0.2, 0.5, 0.3]
    const rhythmPart = new Tone.Part((time, e) => {
      rhythm.synth.triggerAttackRelease('32n', time, e.vel)
    }, [
      // A (0-8): hats
      ...hats(hatPattern, 0, 8),
      // B (8-16): hats continue
      ...hats(hatPattern, 8, 8),
      // C (16-24): sparser hats (breakdown)
      ...hats([0.4, 0, 0, 0, 0.4, 0, 0, 0, 0.3, 0, 0, 0, 0.3, 0, 0, 0], 16, 8),
      // D (24-32): full hats return
      ...hats(hatPattern, 24, 8),
    ])
    rhythmPart.loop = true
    rhythmPart.loopEnd = '32m'
    parts.push(rhythmPart)

    const lead = makeLead(output)
    nodes.push(lead.synth, lead.gain)

    const leadPart = new Tone.Part((time, e) => {
      lead.synth.triggerAttackRelease(e.note, e.dur, time, e.vel)
    }, [
      // Silent in A (0-8)
      // B (8-16): main riff
      ...phrase(['A3', 'C4', 'E4', 'D4', null, null, null, null,
        'A3', 'C4', 'D4', 'C4', null, null, null, null], 8, 0.4),
      ...phrase(['A3', 'C4', 'E4', 'D4', null, 'E4', 'G4', null,
        null, null, null, null, null, null, null, null], 10, 0.4),
      // C (16-24): lead continues over breakdown — becomes the focus
      ...phrase(['E4', null, 'D4', null, 'C4', null, 'A3', null,
        null, null, null, null, null, null, null, null], 16, 0.4),
      ...phrase(['A3', null, 'C4', null, 'E4', null, null, null,
        'G4', null, 'E4', null, 'D4', null, 'C4', null], 18, 0.35),
      ...phrase(['A3', null, null, null, null, null, null, null], 20, 0.3),
      // D (24-32): riff returns varied
      ...phrase(['A3', 'C4', 'E4', 'D4', null, 'E4', null, null,
        'C4', 'D4', 'E4', 'G4', null, null, null, null], 24, 0.4),
      ...phrase(['E4', 'D4', 'C4', 'A3', null, null, null, null,
        null, null, null, null, null, null, null, null], 26, 0.35),
    ])
    leadPart.loop = true
    leadPart.loopEnd = '32m'
    parts.push(leadPart)

    const arr = new Tone.Part((time, e) => {
      if (e.bass !== undefined) bass.gain.gain.rampTo(e.bass, 2, time)
      if (e.rhythm !== undefined) rhythm.gain.gain.rampTo(e.rhythm, 2, time)
      if (e.lead !== undefined) lead.gain.gain.rampTo(e.lead, 2, time)
    }, [
      { time: '0:0:0', bass: 0.1, rhythm: 0.035, lead: 0 },
      { time: '8:0:0', bass: 0.1, rhythm: 0.035, lead: 0.04 },
      { time: '16:0:0', bass: 0, rhythm: 0.02, lead: 0.045 },
      { time: '24:0:0', bass: 0.1, rhythm: 0.035, lead: 0.04 },
    ])
    arr.loop = true
    arr.loopEnd = '32m'
    parts.push(arr)

    return {
      nodes, sequences: parts,
      fadeIn(t) {
        bass.gain.gain.rampTo(0.1, t); rhythm.gain.gain.rampTo(0.035, t)
        for (const p of parts) p.start(0)
      },
      fadeOut(t) {
        bass.gain.gain.rampTo(0, t); rhythm.gain.gain.rampTo(0, t)
        lead.gain.gain.rampTo(0, t)
      },
    }
  },

  // ─ study: A→B→C→A (32 bars) — warm jazz walking ──────────────────
  study: (output) => {
    const nodes = []
    const parts = []

    const bass = makeBass(output)
    nodes.push(bass.synth, bass.gain)

    const bassPart = new Tone.Part((time, e) => {
      bass.synth.triggerAttackRelease(e.note, e.dur, time, e.vel)
    }, [
      // A (0-8): Cmaj7 walking
      ...walk(['C3', 'E3', 'G3', 'E3', 'F2', 'A2', 'C3', 'A2'], 0, 8),
      // B (8-16): Fmaj7 territory
      ...walk(['F2', 'A2', 'C3', 'E3', 'F2', 'C3', 'A2', 'F2'], 8, 8),
      // C (16-24): minor turn — Am7, Em
      ...walk(['A2', 'C3', 'E3', 'G3', 'E2', 'G2', 'B2', 'D3',
        'A2', 'C3', 'E3', 'C3', 'E2', 'B2', 'G2', 'E2'], 16, 8),
      // A' (24-32): return to Cmaj7
      ...walk(['C3', 'E3', 'G3', 'E3', 'F2', 'A2', 'C3', 'A2'], 24, 8),
    ])
    bassPart.loop = true
    bassPart.loopEnd = '32m'
    parts.push(bassPart)

    const pad = makePad(output)
    nodes.push(pad.synth, pad.gain)

    const padPart = new Tone.Part((time, e) => {
      pad.synth.triggerAttackRelease(e.chord, e.dur, time, e.vel)
    }, [
      // A: Cmaj7
      ...chordPad([['C3', 'E3', 'G3', 'B3']], 0, 2, 4),
      // B: Fmaj7 → Cmaj7
      ...chordPad([['F3', 'A3', 'C4', 'E4'], ['C3', 'E3', 'G3', 'B3']], 8, 2, 4),
      // C: Am7 → Em7 → Am7 → Dm7
      ...chordPad([['A2', 'C3', 'E3', 'G3'], ['E3', 'G3', 'B3', 'D4'],
        ['A2', 'C3', 'E3', 'G3'], ['D3', 'F3', 'A3', 'C4']], 16, 2, 4),
      // A': Cmaj7
      ...chordPad([['C3', 'E3', 'G3', 'B3']], 24, 2, 4),
    ])
    padPart.loop = true
    padPart.loopEnd = '32m'
    parts.push(padPart)

    const arr = new Tone.Part((time, e) => {
      if (e.bass !== undefined) bass.gain.gain.rampTo(e.bass, 2, time)
      if (e.pad !== undefined) pad.gain.gain.rampTo(e.pad, 2, time)
    }, [
      { time: '0:0:0', bass: 0.08, pad: 0.06 },
      { time: '8:0:0', bass: 0.08, pad: 0.07 },
      { time: '16:0:0', bass: 0.09, pad: 0.06 },
      { time: '24:0:0', bass: 0.08, pad: 0.06 },
    ])
    arr.loop = true
    arr.loopEnd = '32m'
    parts.push(arr)

    return {
      nodes, sequences: parts,
      fadeIn(t) {
        bass.gain.gain.rampTo(0.08, t); pad.gain.gain.rampTo(0.06, t)
        for (const p of parts) p.start(0)
      },
      fadeOut(t) { bass.gain.gain.rampTo(0, t); pad.gain.gain.rampTo(0, t) },
    }
  },

  // ─ signal_room: A→B→C→D (32 bars) — tense, building ─────────────
  signal_room: (output) => {
    const nodes = []
    const parts = []

    const bass = makeBass(output)
    nodes.push(bass.synth, bass.gain)

    const bassPart = new Tone.Part((time, e) => {
      bass.synth.triggerAttackRelease(e.note, e.dur, time, e.vel)
    }, [
      // A (0-8): pulsing A octaves
      ...pulse('A2', 'A3', 0, 8),
      // B (8-16): shift to E octaves
      ...pulse('E2', 'E3', 8, 8),
      // C (16-24): alternating A and E
      ...pulse('A2', 'A3', 16, 4),
      ...pulse('E2', 'E3', 20, 4),
      // D (24-32): bass drops out — tension
    ])
    bassPart.loop = true
    bassPart.loopEnd = '32m'
    parts.push(bassPart)

    const pad = makePad(output)
    nodes.push(pad.synth, pad.gain)

    const padPart = new Tone.Part((time, e) => {
      pad.synth.triggerAttackRelease(e.chord, e.dur, time, e.vel)
    }, [
      // A: tense minor 2nd (static)
      ...chordPad([['A2', 'Bb2', 'E3']], 0, 4, 2, 0.15),
      // B: resolves slightly
      ...chordPad([['A2', 'C3', 'E3']], 8, 4, 2, 0.18),
      // C: back to tension
      ...chordPad([['A2', 'Bb2', 'E3'], ['E2', 'Bb2', 'E3']], 16, 2, 4, 0.15),
      // D: open fifth — eerie
      ...chordPad([['A2', 'E3']], 24, 4, 2, 0.12),
    ])
    padPart.loop = true
    padPart.loopEnd = '32m'
    parts.push(padPart)

    const rhythm = makeRhythm(output)
    nodes.push(rhythm.synth, rhythm.gain, rhythm.filter)

    const rhythmPart = new Tone.Part((time, e) => {
      rhythm.synth.triggerAttackRelease('32n', time, e.vel)
    }, [
      // Silent in A (0-8)
      // B (8-16): syncopated hits
      ...hats([0, 0, 0.4, 0, 0, 0.4, 0, 0, 0.4, 0, 0, 0, 0.4, 0, 0, 0], 8, 8),
      // C (16-24): denser
      ...hats([0.4, 0, 0.3, 0, 0.4, 0, 0.3, 0, 0.4, 0, 0.3, 0.2, 0.4, 0, 0.3, 0], 16, 8),
      // D (24-32): sparse, just accents
      ...hats([0.5, 0, 0, 0, 0, 0, 0, 0, 0.3, 0, 0, 0, 0, 0, 0, 0], 24, 8),
    ])
    rhythmPart.loop = true
    rhythmPart.loopEnd = '32m'
    parts.push(rhythmPart)

    const lead = makeLead(output)
    nodes.push(lead.synth, lead.gain)

    const leadPart = new Tone.Part((time, e) => {
      lead.synth.triggerAttackRelease(e.note, e.dur, time, e.vel)
    }, [
      // Silent in A & B (0-16)
      // C (16-24): morse-like fragments
      ...phrase(['E4', 'E4', null, 'A4', null, null, null, null], 16, 0.3),
      ...phrase(['E4', null, 'A4', 'A4', null, null, null, null], 18, 0.3),
      ...phrase([null, null, null, null, 'E4', 'E4', 'E4', null,
        'A4', null, null, null, null, null, null, null], 20, 0.3),
      // D (24-32): lead becomes focal point — longer phrases
      ...phrase(['E4', null, 'D4', null, 'E4', null, null, null,
        'A4', null, null, null, 'E4', null, null, null], 24, 0.35),
      ...phrase(['E4', null, 'E4', null, 'D4', null, 'C4', null,
        'A3', null, null, null, null, null, null, null], 28, 0.3),
    ])
    leadPart.loop = true
    leadPart.loopEnd = '32m'
    parts.push(leadPart)

    const arr = new Tone.Part((time, e) => {
      if (e.bass !== undefined) bass.gain.gain.rampTo(e.bass, 2, time)
      if (e.pad !== undefined) pad.gain.gain.rampTo(e.pad, 2, time)
      if (e.rhythm !== undefined) rhythm.gain.gain.rampTo(e.rhythm, 2, time)
      if (e.lead !== undefined) lead.gain.gain.rampTo(e.lead, 2, time)
    }, [
      { time: '0:0:0', bass: 0.08, pad: 0.05, rhythm: 0, lead: 0 },
      { time: '8:0:0', bass: 0.08, pad: 0.05, rhythm: 0.03, lead: 0 },
      { time: '16:0:0', bass: 0.08, pad: 0.05, rhythm: 0.035, lead: 0.03 },
      { time: '24:0:0', bass: 0, pad: 0.04, rhythm: 0.02, lead: 0.04 },
    ])
    arr.loop = true
    arr.loopEnd = '32m'
    parts.push(arr)

    return {
      nodes, sequences: parts,
      fadeIn(t) {
        bass.gain.gain.rampTo(0.08, t); pad.gain.gain.rampTo(0.05, t)
        for (const p of parts) p.start(0)
      },
      fadeOut(t) {
        bass.gain.gain.rampTo(0, t); pad.gain.gain.rampTo(0, t)
        rhythm.gain.gain.rampTo(0, t); lead.gain.gain.rampTo(0, t)
      },
    }
  },

  // ─ vault: A→B→A (24 bars) — barely musical, ominous ──────────────
  vault: (output) => {
    const nodes = []
    const parts = []

    // Sub-bass drone with LFO
    const drone = new Tone.Oscillator('A1', 'sine').start()
    const droneLFO = new Tone.LFO(0.08, 0, 0.1).start()
    const droneGain = new Tone.Gain(0)
    droneLFO.connect(droneGain.gain)
    drone.connect(droneGain)
    droneGain.connect(output)
    nodes.push(drone, droneLFO, droneGain)

    // Second drone for section B
    const drone2 = new Tone.Oscillator('Bb1', 'sine').start()
    const drone2Gain = new Tone.Gain(0)
    drone2.connect(drone2Gain)
    drone2Gain.connect(output)
    nodes.push(drone2, drone2Gain)

    const pad = makePad(output)
    nodes.push(pad.synth, pad.gain)

    const padPart = new Tone.Part((time, e) => {
      pad.synth.triggerAttackRelease(e.chord, e.dur, time, e.vel)
    }, [
      // A (0-8): Phrygian cluster
      ...chordPad([['A2', 'Bb2', 'E3']], 0, 4, 2, 0.12),
      // B (8-16): different voicing — wider, more unsettling
      ...chordPad([['A2', 'C3', 'F3'], ['Bb2', 'E3', 'A3']], 8, 4, 2, 0.14),
      // A' (16-24): return
      ...chordPad([['A2', 'Bb2', 'E3']], 16, 4, 2, 0.12),
    ])
    padPart.loop = true
    padPart.loopEnd = '24m'
    parts.push(padPart)

    const arr = new Tone.Part((time, e) => {
      if (e.drone !== undefined) droneGain.gain.rampTo(e.drone, 3, time)
      if (e.drone2 !== undefined) drone2Gain.gain.rampTo(e.drone2, 3, time)
      if (e.pad !== undefined) pad.gain.gain.rampTo(e.pad, 2, time)
    }, [
      { time: '0:0:0', drone: 0.04, drone2: 0, pad: 0.04 },
      { time: '8:0:0', drone: 0.03, drone2: 0.025, pad: 0.05 },
      { time: '16:0:0', drone: 0.04, drone2: 0, pad: 0.04 },
    ])
    arr.loop = true
    arr.loopEnd = '24m'
    parts.push(arr)

    return {
      nodes, sequences: parts,
      fadeIn(t) {
        droneGain.gain.rampTo(0.04, t); pad.gain.gain.rampTo(0.04, t)
        for (const p of parts) p.start(0)
      },
      fadeOut(t) {
        droneGain.gain.rampTo(0, t); drone2Gain.gain.rampTo(0, t)
        pad.gain.gain.rampTo(0, t)
      },
    }
  },
}

// ── Procedural music for generated rooms ────────────────────────────

function seedFromId(roomId) {
  let hash = 0
  for (const ch of roomId) hash = ((hash << 5) - hash + ch.charCodeAt(0)) | 0
  return Math.abs(hash)
}

// Pools for procedural generation
const bassPatternPools = {
  indoor: [
    (root, fifth, third) => [root, third, fifth, root + '3' in {} ? root : third, fifth, third, root, null],
    (root, fifth) => [root, null, root, fifth, null, null, null, null],
    (root, fifth, third) => [root, fifth, root, third, fifth, third, root, null],
  ],
  outdoor: [
    (root, fifth) => [root, fifth, root, fifth],
    (root, fifth, third) => [root, third, fifth, third, root, third, fifth, third],
  ],
  hidden: [
    (root) => [root, null, null, null, root, null, null, null],
    (root, fifth) => [root, null, fifth, null, null, null, null, null],
  ],
}

const chordPools = {
  indoor: [
    [['A2', 'C3', 'E3'], ['F2', 'A2', 'C3'], ['E2', 'G2', 'B2'], ['A2', 'C3', 'E3']],
    [['A2', 'C3', 'E3'], ['D3', 'F3', 'A3'], ['G2', 'B2', 'D3'], ['A2', 'C3', 'E3']],
  ],
  outdoor: [
    [['A2', 'C3', 'E3'], ['G2', 'B2', 'D3'], ['F2', 'A2', 'C3'], ['A2', 'C3', 'E3']],
    [['A2', 'C3', 'E3'], ['F2', 'A2', 'C3'], ['C3', 'E3', 'G3'], ['A2', 'C3', 'E3']],
  ],
  hidden: [
    [['A2', 'Bb2', 'E3'], ['A2', 'C3', 'F3']],
    [['A2', 'Bb2', 'E3']],
  ],
}

function generateClusterMusic(cluster, roomId, output) {
  const seed = seedFromId(roomId)
  const nodes = []
  const parts = []

  let s = seed
  const rand = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff }

  const rootOffset = Math.floor(rand() * 5)
  const root = Tone.Frequency('A2').transpose(rootOffset).toNote()
  const fifth = Tone.Frequency('E3').transpose(rootOffset).toNote()
  const third = Tone.Frequency('C3').transpose(rootOffset).toNote()

  const totalBars = 24 // 3 sections of 8 bars
  const loopEnd = `${totalBars}m`

  // Bass
  const bass = makeBass(output)
  nodes.push(bass.synth, bass.gain)

  const bassPool = bassPatternPools[cluster] || bassPatternPools.indoor
  const bassPattern1 = bassPool[Math.floor(rand() * bassPool.length)](root, fifth, third)
  const bassPattern2 = bassPool[Math.floor(rand() * bassPool.length)](root, fifth, third)

  const bassPart = new Tone.Part((time, e) => {
    bass.synth.triggerAttackRelease(e.note, e.dur, time, e.vel)
  }, [
    ...arp(bassPattern1, 0, 8),
    ...arp(bassPattern2, 8, 8),
    ...arp(bassPattern1, 16, 8),
  ])
  bassPart.loop = true
  bassPart.loopEnd = loopEnd
  parts.push(bassPart)

  // Pad
  const pad = makePad(output)
  nodes.push(pad.synth, pad.gain)

  const cPool = chordPools[cluster] || chordPools.indoor
  const chords1 = cPool[Math.floor(rand() * cPool.length)]
  const chords2 = cPool[Math.floor(rand() * cPool.length)]

  const padPart = new Tone.Part((time, e) => {
    pad.synth.triggerAttackRelease(e.chord, e.dur, time, e.vel)
  }, [
    ...chordPad(chords1, 0, 2, 4),
    ...chordPad(chords2, 8, 2, 4),
    ...chordPad(chords1, 16, 2, 4),
  ])
  padPart.loop = true
  padPart.loopEnd = loopEnd
  parts.push(padPart)

  // Lead — chance-based
  const leadChance = cluster === 'indoor' ? 0.5 : cluster === 'outdoor' ? 0.3 : 0.2
  const hasLead = rand() < leadChance
  let lead = null
  if (hasLead) {
    lead = makeLead(output)
    nodes.push(lead.synth, lead.gain)
    const leadRoot = Tone.Frequency('A3').transpose(rootOffset).toNote()
    const leadFifth = Tone.Frequency('E4').transpose(rootOffset).toNote()
    const leadThird = Tone.Frequency('C4').transpose(rootOffset).toNote()

    const leadPart = new Tone.Part((time, e) => {
      lead.synth.triggerAttackRelease(e.note, e.dur, time, e.vel)
    }, [
      // Only in section B (8-16)
      ...phrase([leadRoot, null, null, leadFifth, null, null, null, null,
        leadRoot, null, leadFifth, null, null, null, null, null], 8, 0.35),
      ...phrase([leadThird, null, leadRoot, null, null, null, null, null], 12, 0.3),
    ])
    leadPart.loop = true
    leadPart.loopEnd = loopEnd
    parts.push(leadPart)
  }

  const bassVol = cluster === 'hidden' ? 0.05 : 0.08
  const padVol = cluster === 'hidden' ? 0.04 : 0.06

  // Arrangement
  const arr = new Tone.Part((time, e) => {
    if (e.bass !== undefined) bass.gain.gain.rampTo(e.bass, 2, time)
    if (e.pad !== undefined) pad.gain.gain.rampTo(e.pad, 2, time)
    if (hasLead && e.lead !== undefined) lead.gain.gain.rampTo(e.lead, 2, time)
  }, [
    { time: '0:0:0', bass: bassVol, pad: padVol, lead: 0 },
    { time: '8:0:0', bass: bassVol, pad: padVol + 0.01, lead: hasLead ? 0.03 : 0 },
    { time: '16:0:0', bass: bassVol * 0.8, pad: padVol, lead: 0 },
  ])
  arr.loop = true
  arr.loopEnd = loopEnd
  parts.push(arr)

  return {
    nodes, sequences: parts,
    fadeIn(t) {
      bass.gain.gain.rampTo(bassVol, t); pad.gain.gain.rampTo(padVol, t)
      for (const p of parts) p.start(0)
    },
    fadeOut(t) {
      bass.gain.gain.rampTo(0, t); pad.gain.gain.rampTo(0, t)
      if (hasLead) lead.gain.gain.rampTo(0, t)
    },
  }
}

// ── MusicManager ────────────────────────────────────────────────────

class MusicManager {
  currentRoom = null
  currentMusic = null
  musicGain = null
  sharedReverb = null
  sharedFilter = null
  fadeTime = 1.5
  transportStarted = false

  init() {
    if (this.musicGain) return
    this.musicGain = new Tone.Gain(0.35).connect(audioEngine.masterGain)
    this.sharedFilter = new Tone.Filter(3000, 'lowpass').connect(this.musicGain)
    this.sharedReverb = new Tone.Freeverb({ roomSize: 0.7, dampening: 3000, wet: 0.3 }).connect(this.sharedFilter)
    Tone.Transport.bpm.value = BPM
  }

  setRoom(roomId, cluster = null) {
    if (!audioEngine.initialized || roomId === this.currentRoom) return
    this.currentRoom = roomId

    // Lazy init
    this.init()

    // Fade out current
    if (this.currentMusic) {
      const old = this.currentMusic
      old.fadeOut(this.fadeTime)
      setTimeout(() => {
        for (const seq of old.sequences) {
          try { seq.stop(); seq.dispose() } catch { /* already disposed */ }
        }
        for (const node of old.nodes) {
          try { node.dispose() } catch { /* already disposed */ }
        }
      }, (this.fadeTime + 0.5) * 1000)
      this.currentMusic = null
    }

    // Create new music
    let config = roomMusicConfigs[roomId]
    let music
    if (config) {
      music = config(this.sharedReverb)
    } else if (cluster) {
      music = generateClusterMusic(cluster, roomId, this.sharedReverb)
    }

    if (music) {
      this.currentMusic = music
      if (!this.transportStarted) {
        Tone.Transport.start()
        this.transportStarted = true
      }
      music.fadeIn(this.fadeTime)
    }
  }

  stop() {
    if (this.currentMusic) {
      const old = this.currentMusic
      old.fadeOut(0.5)
      setTimeout(() => {
        for (const seq of old.sequences) {
          try { seq.stop(); seq.dispose() } catch { /* already disposed */ }
        }
        for (const node of old.nodes) {
          try { node.dispose() } catch { /* already disposed */ }
        }
      }, 1000)
      this.currentMusic = null
      this.currentRoom = null
    }
  }

  dispose() {
    this.stop()
    if (this.sharedReverb) { try { this.sharedReverb.dispose() } catch {} }
    if (this.sharedFilter) { try { this.sharedFilter.dispose() } catch {} }
    if (this.musicGain) { try { this.musicGain.dispose() } catch {} }
    this.musicGain = null
    this.sharedReverb = null
    this.sharedFilter = null
  }
}

const musicManager = new MusicManager()
export default musicManager
