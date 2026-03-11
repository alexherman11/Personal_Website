import * as Tone from 'tone'
import audioEngine from './audioEngine'

// Room ambient configurations
// Each returns an array of { node, gain } to be managed by the AmbientManager
const roomConfigs = {
  entrance: (masterGain) => {
    const nodes = []

    // Wind — brown noise through modulated lowpass
    const windNoise = new Tone.Noise('brown').start()
    const windFilter = new Tone.Filter(400, 'lowpass')
    const windLFO = new Tone.LFO(0.1, 200, 600).start()
    windLFO.connect(windFilter.frequency)
    const windGain = new Tone.Gain(0)
    windNoise.connect(windFilter)
    windFilter.connect(windGain)
    windGain.connect(masterGain)
    nodes.push(windNoise, windFilter, windLFO, windGain)

    // Low drone
    const drone = new Tone.Oscillator(80, 'sine').start()
    const droneGain = new Tone.Gain(0)
    drone.connect(droneGain)
    droneGain.connect(masterGain)
    nodes.push(drone, droneGain)

    return {
      nodes,
      fadeIn(time) {
        windGain.gain.rampTo(0.06, time)
        droneGain.gain.rampTo(0.02, time)
      },
      fadeOut(time) {
        windGain.gain.rampTo(0, time)
        droneGain.gain.rampTo(0, time)
      },
    }
  },

  grounds: (masterGain) => {
    const nodes = []

    // Wide wind
    const wind = new Tone.Noise('pink').start()
    const windFilter = new Tone.Filter(800, 'bandpass')
    const windGain = new Tone.Gain(0)
    wind.connect(windFilter)
    windFilter.connect(windGain)
    windGain.connect(masterGain)
    nodes.push(wind, windFilter, windGain)

    // Birdsong — periodic chirps
    const birdSynth = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 0.08, sustain: 0, release: 0.05 },
    })
    const birdGain = new Tone.Gain(0)
    birdSynth.connect(birdGain)
    birdGain.connect(masterGain)
    nodes.push(birdSynth, birdGain)

    let birdInterval = null
    const startBirds = () => {
      const chirp = () => {
        if (audioEngine.initialized) {
          const freq = 2000 + Math.random() * 2000
          birdSynth.triggerAttackRelease(freq, '32n')
        }
        birdInterval = setTimeout(chirp, 3000 + Math.random() * 5000)
      }
      birdInterval = setTimeout(chirp, 1000 + Math.random() * 3000)
    }

    return {
      nodes,
      birdInterval: () => birdInterval,
      fadeIn(time) {
        windGain.gain.rampTo(0.05, time)
        birdGain.gain.rampTo(0.03, time)
        startBirds()
      },
      fadeOut(time) {
        windGain.gain.rampTo(0, time)
        birdGain.gain.rampTo(0, time)
        if (birdInterval) clearTimeout(birdInterval)
      },
    }
  },

  tree: (masterGain) => {
    const nodes = []

    // Leaf rustle — narrow bandpass brown noise
    const rustle = new Tone.Noise('brown').start()
    const rustleFilter = new Tone.Filter(600, 'bandpass')
    rustleFilter.Q.value = 2
    const rustleLFO = new Tone.LFO(0.3, 400, 800).start()
    rustleLFO.connect(rustleFilter.frequency)
    const rustleGain = new Tone.Gain(0)
    rustle.connect(rustleFilter)
    rustleFilter.connect(rustleGain)
    rustleGain.connect(masterGain)
    nodes.push(rustle, rustleFilter, rustleLFO, rustleGain)

    // Rope creak — periodic filtered noise burst
    const creakNoise = new Tone.NoiseSynth({
      noise: { type: 'brown' },
      envelope: { attack: 0.1, decay: 0.3, sustain: 0, release: 0.2 },
    })
    const creakFilter = new Tone.Filter(200, 'lowpass')
    const creakGain = new Tone.Gain(0)
    creakNoise.connect(creakFilter)
    creakFilter.connect(creakGain)
    creakGain.connect(masterGain)
    nodes.push(creakNoise, creakFilter, creakGain)

    let creakInterval = null
    const startCreaks = () => {
      const creak = () => {
        if (audioEngine.initialized) creakNoise.triggerAttackRelease('8n')
        creakInterval = setTimeout(creak, 5000 + Math.random() * 5000)
      }
      creakInterval = setTimeout(creak, 3000 + Math.random() * 4000)
    }

    return {
      nodes,
      fadeIn(time) {
        rustleGain.gain.rampTo(0.05, time)
        creakGain.gain.rampTo(0.04, time)
        startCreaks()
      },
      fadeOut(time) {
        rustleGain.gain.rampTo(0, time)
        creakGain.gain.rampTo(0, time)
        if (creakInterval) clearTimeout(creakInterval)
      },
    }
  },

  grand_hall: (masterGain) => {
    const nodes = []

    // Two detuned sine waves — slow beat frequency
    const osc1 = new Tone.Oscillator(55, 'sine').start()
    const osc2 = new Tone.Oscillator(56.5, 'sine').start()
    const oscGain = new Tone.Gain(0)
    osc1.connect(oscGain)
    osc2.connect(oscGain)
    oscGain.connect(masterGain)
    nodes.push(osc1, osc2, oscGain)

    // Subtle reverb-washed noise
    const noise = new Tone.Noise('brown').start()
    const noiseFilter = new Tone.Filter(300, 'lowpass')
    const noiseGain = new Tone.Gain(0)
    noise.connect(noiseFilter)
    noiseFilter.connect(noiseGain)
    noiseGain.connect(masterGain)
    nodes.push(noise, noiseFilter, noiseGain)

    return {
      nodes,
      fadeIn(time) {
        oscGain.gain.rampTo(0.025, time)
        noiseGain.gain.rampTo(0.02, time)
      },
      fadeOut(time) {
        oscGain.gain.rampTo(0, time)
        noiseGain.gain.rampTo(0, time)
      },
    }
  },

  archive: (masterGain) => {
    const nodes = []

    // Very quiet brown noise
    const noise = new Tone.Noise('brown').start()
    const noiseGain = new Tone.Gain(0)
    noise.connect(noiseGain)
    noiseGain.connect(masterGain)
    nodes.push(noise, noiseGain)

    // Occasional crackle
    const crackleSynth = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.02, sustain: 0, release: 0.01 },
    })
    const crackleGain = new Tone.Gain(0)
    crackleSynth.connect(crackleGain)
    crackleGain.connect(masterGain)
    nodes.push(crackleSynth, crackleGain)

    let crackleInterval = null
    const startCrackle = () => {
      const crackle = () => {
        if (audioEngine.initialized) crackleSynth.triggerAttackRelease('64n')
        crackleInterval = setTimeout(crackle, 8000 + Math.random() * 7000)
      }
      crackleInterval = setTimeout(crackle, 4000 + Math.random() * 6000)
    }

    return {
      nodes,
      fadeIn(time) {
        noiseGain.gain.rampTo(0.015, time)
        crackleGain.gain.rampTo(0.03, time)
        startCrackle()
      },
      fadeOut(time) {
        noiseGain.gain.rampTo(0, time)
        crackleGain.gain.rampTo(0, time)
        if (crackleInterval) clearTimeout(crackleInterval)
      },
    }
  },

  workshop: (masterGain) => {
    const nodes = []

    // Electrical hum — 60Hz sawtooth, louder than CRT hum
    const hum = new Tone.Oscillator(60, 'sawtooth').start()
    const humFilter = new Tone.Filter(200, 'lowpass')
    const humGain = new Tone.Gain(0)
    hum.connect(humFilter)
    humFilter.connect(humGain)
    humGain.connect(masterGain)
    nodes.push(hum, humFilter, humGain)

    // Sparks — random noise bursts
    const sparkSynth = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.02 },
    })
    const sparkGain = new Tone.Gain(0)
    sparkSynth.connect(sparkGain)
    sparkGain.connect(masterGain)
    nodes.push(sparkSynth, sparkGain)

    // Ticking
    const tickSynth = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.01, sustain: 0, release: 0.005 },
    })
    const tickFilter = new Tone.Filter(5000, 'highpass')
    const tickGain = new Tone.Gain(0)
    tickSynth.connect(tickFilter)
    tickFilter.connect(tickGain)
    tickGain.connect(masterGain)
    nodes.push(tickSynth, tickFilter, tickGain)

    let sparkInterval = null
    let tickInterval = null
    const startEvents = () => {
      const spark = () => {
        if (audioEngine.initialized) sparkSynth.triggerAttackRelease('32n')
        sparkInterval = setTimeout(spark, 4000 + Math.random() * 4000)
      }
      sparkInterval = setTimeout(spark, 2000 + Math.random() * 3000)

      const tick = () => {
        if (audioEngine.initialized) tickSynth.triggerAttackRelease('64n')
        tickInterval = setTimeout(tick, 2000)
      }
      tickInterval = setTimeout(tick, 1000)
    }

    return {
      nodes,
      fadeIn(time) {
        humGain.gain.rampTo(0.03, time)
        sparkGain.gain.rampTo(0.06, time)
        tickGain.gain.rampTo(0.02, time)
        startEvents()
      },
      fadeOut(time) {
        humGain.gain.rampTo(0, time)
        sparkGain.gain.rampTo(0, time)
        tickGain.gain.rampTo(0, time)
        if (sparkInterval) clearTimeout(sparkInterval)
        if (tickInterval) clearTimeout(tickInterval)
      },
    }
  },

  study: (masterGain) => {
    const nodes = []

    // Clock tick
    const tickSynth = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.015, sustain: 0, release: 0.005 },
    })
    const tickFilter = new Tone.Filter(3000, 'bandpass')
    const tickGain = new Tone.Gain(0)
    tickSynth.connect(tickFilter)
    tickFilter.connect(tickGain)
    tickGain.connect(masterGain)
    nodes.push(tickSynth, tickFilter, tickGain)

    // Quiet low drone
    const drone = new Tone.Oscillator(65, 'sine').start()
    const droneGain = new Tone.Gain(0)
    drone.connect(droneGain)
    droneGain.connect(masterGain)
    nodes.push(drone, droneGain)

    let tickInterval = null
    const startTick = () => {
      const tick = () => {
        if (audioEngine.initialized) tickSynth.triggerAttackRelease('64n')
        tickInterval = setTimeout(tick, 1000)
      }
      tickInterval = setTimeout(tick, 500)
    }

    return {
      nodes,
      fadeIn(time) {
        tickGain.gain.rampTo(0.04, time)
        droneGain.gain.rampTo(0.01, time)
        startTick()
      },
      fadeOut(time) {
        tickGain.gain.rampTo(0, time)
        droneGain.gain.rampTo(0, time)
        if (tickInterval) clearTimeout(tickInterval)
      },
    }
  },

  signal_room: (masterGain) => {
    const nodes = []

    // Radio static
    const static_ = new Tone.Noise('white').start()
    const staticFilter = new Tone.Filter(2000, 'bandpass')
    staticFilter.Q.value = 1
    const staticGain = new Tone.Gain(0)
    static_.connect(staticFilter)
    staticFilter.connect(staticGain)
    staticGain.connect(masterGain)
    nodes.push(static_, staticFilter, staticGain)

    // Morse beeps
    const morseSynth = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.005, decay: 0.05, sustain: 0.8, release: 0.05 },
    })
    const morseGain = new Tone.Gain(0)
    morseSynth.connect(morseGain)
    morseGain.connect(masterGain)
    nodes.push(morseSynth, morseGain)

    let morseInterval = null
    const startMorse = () => {
      const morseSequence = () => {
        if (!audioEngine.initialized) return
        // Random short morse-like pattern
        const pattern = []
        const count = 2 + Math.floor(Math.random() * 4)
        for (let i = 0; i < count; i++) {
          pattern.push(Math.random() > 0.5 ? 0.06 : 0.15) // dit or dah
        }
        let offset = 0
        for (const dur of pattern) {
          setTimeout(() => {
            if (audioEngine.initialized) morseSynth.triggerAttackRelease(800, dur)
          }, offset * 1000)
          offset += dur + 0.06
        }
        morseInterval = setTimeout(morseSequence, 5000 + Math.random() * 5000)
      }
      morseInterval = setTimeout(morseSequence, 2000 + Math.random() * 3000)
    }

    return {
      nodes,
      fadeIn(time) {
        staticGain.gain.rampTo(0.03, time)
        morseGain.gain.rampTo(0.04, time)
        startMorse()
      },
      fadeOut(time) {
        staticGain.gain.rampTo(0, time)
        morseGain.gain.rampTo(0, time)
        if (morseInterval) clearTimeout(morseInterval)
      },
    }
  },

  vault: (masterGain) => {
    const nodes = []

    // Ultra-low drone
    const drone = new Tone.Oscillator(30, 'sine').start()
    const droneGain = new Tone.Gain(0)
    drone.connect(droneGain)
    droneGain.connect(masterGain)
    nodes.push(drone, droneGain)

    // Occasional pulse
    const pulseSynth = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.5, decay: 1.0, sustain: 0, release: 0.5 },
    })
    const pulseGain = new Tone.Gain(0)
    pulseSynth.connect(pulseGain)
    pulseGain.connect(masterGain)
    nodes.push(pulseSynth, pulseGain)

    let pulseInterval = null
    const startPulse = () => {
      const pulse = () => {
        if (audioEngine.initialized) pulseSynth.triggerAttackRelease(40, '2n')
        pulseInterval = setTimeout(pulse, 15000 + Math.random() * 5000)
      }
      pulseInterval = setTimeout(pulse, 8000 + Math.random() * 7000)
    }

    return {
      nodes,
      fadeIn(time) {
        droneGain.gain.rampTo(0.015, time)
        pulseGain.gain.rampTo(0.02, time)
        startPulse()
      },
      fadeOut(time) {
        droneGain.gain.rampTo(0, time)
        pulseGain.gain.rampTo(0, time)
        if (pulseInterval) clearTimeout(pulseInterval)
      },
    }
  },
}

class AmbientManager {
  currentRoom = null
  currentAmbient = null
  fadeTime = 1.0

  setRoom(roomId) {
    if (!audioEngine.initialized || roomId === this.currentRoom) return
    this.currentRoom = roomId

    // Fade out current
    if (this.currentAmbient) {
      const old = this.currentAmbient
      old.fadeOut(this.fadeTime)
      setTimeout(() => {
        for (const node of old.nodes) {
          try { node.dispose() } catch { /* already disposed */ }
        }
      }, (this.fadeTime + 0.5) * 1000)
      this.currentAmbient = null
    }

    // Create and fade in new
    const config = roomConfigs[roomId]
    if (config) {
      this.currentAmbient = config(audioEngine.masterGain)
      this.currentAmbient.fadeIn(this.fadeTime)
    }
  }

  stop() {
    if (this.currentAmbient) {
      this.currentAmbient.fadeOut(0.5)
      const old = this.currentAmbient
      setTimeout(() => {
        for (const node of old.nodes) {
          try { node.dispose() } catch { /* already disposed */ }
        }
      }, 1000)
      this.currentAmbient = null
      this.currentRoom = null
    }
  }
}

const ambientManager = new AmbientManager()
export default ambientManager
