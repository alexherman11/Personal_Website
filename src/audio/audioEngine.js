import * as Tone from 'tone'

class AudioEngine {
  initialized = false
  muted = false
  masterGain = null
  crtHum = null
  crtHumGain = null

  async init() {
    if (this.initialized) return
    await Tone.start()

    this.masterGain = new Tone.Gain(0.8).toDestination()

    // CRT hum — very quiet 60Hz sine, always on
    this.crtHumGain = new Tone.Gain(0.015).connect(this.masterGain)
    this.crtHum = new Tone.Oscillator(60, 'sine').connect(this.crtHumGain)
    this.crtHum.start()

    this.initialized = true
  }

  toggleMute() {
    this.muted = !this.muted
    if (this.masterGain) {
      this.masterGain.gain.rampTo(this.muted ? 0 : 0.8, 0.1)
    }
  }

  isMuted() {
    return this.muted
  }

  dispose() {
    if (this.crtHum) {
      this.crtHum.stop()
      this.crtHum.dispose()
    }
    if (this.crtHumGain) this.crtHumGain.dispose()
    if (this.masterGain) this.masterGain.dispose()
    this.initialized = false
  }
}

const audioEngine = new AudioEngine()
export default audioEngine
