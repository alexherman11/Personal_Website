import * as Tone from 'tone'
import audioEngine from './audioEngine'

// Reusable keystroke noise synth — created lazily, stays connected
let keystrokeSynth = null

function getKeystrokeSynth() {
  if (!keystrokeSynth && audioEngine.initialized) {
    keystrokeSynth = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.03, sustain: 0, release: 0.01 },
    })
    const filter = new Tone.Filter(4000, 'highpass')
    const gain = new Tone.Gain(0.04)
    keystrokeSynth.connect(filter)
    filter.connect(gain)
    gain.connect(audioEngine.masterGain)
  }
  return keystrokeSynth
}

export function keystroke() {
  if (!audioEngine.initialized) return
  const synth = getKeystrokeSynth()
  if (synth) synth.triggerAttackRelease('32n')
}

export function roomTransition() {
  if (!audioEngine.initialized) return
  const noise = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.01, decay: 0.5, sustain: 0, release: 0.1 },
  })
  const filter = new Tone.Filter(6000, 'lowpass')
  const gain = new Tone.Gain(0.12)

  noise.connect(filter)
  filter.connect(gain)
  gain.connect(audioEngine.masterGain)

  // Sweep filter down
  filter.frequency.rampTo(200, 0.5)

  noise.triggerAttackRelease('4n')
  setTimeout(() => { noise.dispose(); filter.dispose(); gain.dispose() }, 1500)
}

export function itemPickup() {
  if (!audioEngine.initialized) return
  const synth = new Tone.Synth({
    oscillator: { type: 'sine' },
    envelope: { attack: 0.005, decay: 0.15, sustain: 0, release: 0.1 },
  })
  const gain = new Tone.Gain(0.1)
  synth.connect(gain)
  gain.connect(audioEngine.masterGain)

  const now = Tone.now()
  synth.triggerAttackRelease('C5', '16n', now)
  synth.triggerAttackRelease('E5', '16n', now + 0.08)

  setTimeout(() => { synth.dispose(); gain.dispose() }, 800)
}

export function panelOpen() {
  if (!audioEngine.initialized) return
  const noise = new Tone.NoiseSynth({
    noise: { type: 'brown' },
    envelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.05 },
  })
  const filter = new Tone.Filter(300, 'lowpass')
  const gain = new Tone.Gain(0.08)

  noise.connect(filter)
  filter.connect(gain)
  gain.connect(audioEngine.masterGain)

  filter.frequency.rampTo(1200, 0.2)
  noise.triggerAttackRelease('8n')
  setTimeout(() => { noise.dispose(); filter.dispose(); gain.dispose() }, 800)
}

export function panelClose() {
  if (!audioEngine.initialized) return
  const noise = new Tone.NoiseSynth({
    noise: { type: 'brown' },
    envelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.05 },
  })
  const filter = new Tone.Filter(1200, 'lowpass')
  const gain = new Tone.Gain(0.08)

  noise.connect(filter)
  filter.connect(gain)
  gain.connect(audioEngine.masterGain)

  filter.frequency.rampTo(300, 0.2)
  noise.triggerAttackRelease('8n')
  setTimeout(() => { noise.dispose(); filter.dispose(); gain.dispose() }, 800)
}

export function logbookOpen() {
  if (!audioEngine.initialized) return
  const noise = new Tone.NoiseSynth({
    noise: { type: 'brown' },
    envelope: { attack: 0.005, decay: 0.1, sustain: 0, release: 0.04 },
  })
  const filter = new Tone.Filter(2000, 'bandpass')
  const gain = new Tone.Gain(0.07)

  noise.connect(filter)
  filter.connect(gain)
  gain.connect(audioEngine.masterGain)

  noise.triggerAttackRelease('16n')
  setTimeout(() => { noise.dispose(); filter.dispose(); gain.dispose() }, 600)
}

export function pageTurn() {
  if (!audioEngine.initialized) return
  const noise = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.002, decay: 0.06, sustain: 0, release: 0.02 },
  })
  const filter = new Tone.Filter(3000, 'highpass')
  const gain = new Tone.Gain(0.04)

  noise.connect(filter)
  filter.connect(gain)
  gain.connect(audioEngine.masterGain)

  noise.triggerAttackRelease('32n')
  setTimeout(() => { noise.dispose(); filter.dispose(); gain.dispose() }, 400)
}

export function logbookClose() {
  if (!audioEngine.initialized) return
  const synth = new Tone.Synth({
    oscillator: { type: 'sine' },
    envelope: { attack: 0.01, decay: 0.12, sustain: 0, release: 0.05 },
  })
  const gain = new Tone.Gain(0.05)
  synth.connect(gain)
  gain.connect(audioEngine.masterGain)

  synth.triggerAttackRelease('A3', '16n')
  setTimeout(() => { synth.dispose(); gain.dispose() }, 500)
}

let bootTickCount = 0
export function bootTick() {
  if (!audioEngine.initialized) return
  const freq = 200 + bootTickCount * 40
  bootTickCount++

  const synth = new Tone.Synth({
    oscillator: { type: 'square' },
    envelope: { attack: 0.001, decay: 0.06, sustain: 0, release: 0.02 },
  })
  const gain = new Tone.Gain(0.06)
  synth.connect(gain)
  gain.connect(audioEngine.masterGain)

  synth.triggerAttackRelease(freq, '32n')
  setTimeout(() => { synth.dispose(); gain.dispose() }, 300)
}

export function resetBootTick() {
  bootTickCount = 0
}

export function menuSelect() {
  if (!audioEngine.initialized) return
  const synth = new Tone.Synth({
    oscillator: { type: 'sine' },
    envelope: { attack: 0.005, decay: 0.1, sustain: 0, release: 0.05 },
  })
  const gain = new Tone.Gain(0.08)
  synth.connect(gain)
  gain.connect(audioEngine.masterGain)

  synth.triggerAttackRelease('A4', '32n')
  setTimeout(() => { synth.dispose(); gain.dispose() }, 400)
}

export function jailbreakSuccess() {
  if (!audioEngine.initialized) return
  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sine' },
    envelope: { attack: 0.05, decay: 0.3, sustain: 0.2, release: 0.8 },
  })
  const reverb = new Tone.Reverb(2.0)
  const gain = new Tone.Gain(0.1)

  synth.connect(reverb)
  reverb.connect(gain)
  gain.connect(audioEngine.masterGain)

  const now = Tone.now()
  synth.triggerAttackRelease('C4', '4n', now)
  synth.triggerAttackRelease('E4', '4n', now + 0.2)
  synth.triggerAttackRelease('G4', '4n', now + 0.4)
  synth.triggerAttackRelease('C5', '2n', now + 0.6)

  setTimeout(() => { synth.dispose(); reverb.dispose(); gain.dispose() }, 4000)
}
