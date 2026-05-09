import * as Tone from 'tone'

// Persistent volume preferences (range 0..1).
const LS_MUSIC = 'depths_music_volume'
const LS_KEYSTROKE = 'depths_keystroke_volume'

// Default music sits a touch louder than the previous hard-coded 0.35 so the
// score reads through over the CRT hum and ambient beds without overpowering
// the typewriter line. Players can pull it down with the settings slider.
const DEFAULT_MUSIC = 0.5
const DEFAULT_KEYSTROKE = 1.0
const MASTER_LEVEL = 0.8

function readPref(key, fallback) {
  if (typeof localStorage === 'undefined') return fallback
  const raw = localStorage.getItem(key)
  if (raw == null) return fallback
  const num = parseFloat(raw)
  if (!Number.isFinite(num) || num < 0 || num > 2) return fallback
  return num
}

class AudioEngine {
  initialized = false
  muted = false
  masterGain = null
  crtHum = null
  crtHumGain = null
  // User-facing volume buses. Other modules connect through these so the
  // settings sliders affect them globally.
  musicGain = null
  keystrokeGain = null
  // Cached preferences (read once, also used before init() to apply on connect).
  musicVolume = DEFAULT_MUSIC
  keystrokeVolume = DEFAULT_KEYSTROKE

  constructor() {
    this.musicVolume = readPref(LS_MUSIC, DEFAULT_MUSIC)
    this.keystrokeVolume = readPref(LS_KEYSTROKE, DEFAULT_KEYSTROKE)
  }

  async init() {
    if (this.initialized) return
    await Tone.start()

    this.masterGain = new Tone.Gain(MASTER_LEVEL).toDestination()

    // Music bus — everything in music.js routes through here.
    this.musicGain = new Tone.Gain(this.musicVolume).connect(this.masterGain)
    // Keystroke / "text sounds" bus.
    this.keystrokeGain = new Tone.Gain(this.keystrokeVolume).connect(this.masterGain)

    // CRT hum — very quiet 60Hz sine, always on
    this.crtHumGain = new Tone.Gain(0.015).connect(this.masterGain)
    this.crtHum = new Tone.Oscillator(60, 'sine').connect(this.crtHumGain)
    this.crtHum.start()

    this.initialized = true
  }

  toggleMute() {
    this.muted = !this.muted
    if (this.masterGain) {
      this.masterGain.gain.rampTo(this.muted ? 0 : MASTER_LEVEL, 0.1)
    }
  }

  isMuted() {
    return this.muted
  }

  setMusicVolume(v) {
    const clamped = Math.max(0, Math.min(1, v))
    this.musicVolume = clamped
    if (this.musicGain) this.musicGain.gain.rampTo(clamped, 0.08)
    if (typeof localStorage !== 'undefined') localStorage.setItem(LS_MUSIC, String(clamped))
  }

  setKeystrokeVolume(v) {
    const clamped = Math.max(0, Math.min(1, v))
    this.keystrokeVolume = clamped
    if (this.keystrokeGain) this.keystrokeGain.gain.rampTo(clamped, 0.08)
    if (typeof localStorage !== 'undefined') localStorage.setItem(LS_KEYSTROKE, String(clamped))
  }

  getMusicVolume() { return this.musicVolume }
  getKeystrokeVolume() { return this.keystrokeVolume }

  dispose() {
    if (this.crtHum) {
      this.crtHum.stop()
      this.crtHum.dispose()
    }
    if (this.crtHumGain) this.crtHumGain.dispose()
    if (this.musicGain) this.musicGain.dispose()
    if (this.keystrokeGain) this.keystrokeGain.dispose()
    if (this.masterGain) this.masterGain.dispose()
    this.initialized = false
  }
}

const audioEngine = new AudioEngine()
export default audioEngine
