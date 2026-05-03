/**
 * F0Track - Monophonic pitch tracker built on pitchy (McLeod Pitch Method).
 *
 * Wraps the AnalyserNode time-domain buffer; per frame returns
 * `{ hz, clarity, f0, f0Confidence }` where `f0` is the validated pitch in Hz
 * (or null when clarity is below threshold), and maintains a rolling ring
 * buffer of recent samples for downstream vibrato detection.
 */

import { PitchDetector } from 'pitchy'

const DEFAULT_RING_SIZE = 60          // ~1s at 60 Hz update rate
const DEFAULT_CLARITY_THRESHOLD = 0.85 // SPEC §3 / lane-a
const MIN_PLAUSIBLE_HZ = 40
const MAX_PLAUSIBLE_HZ = 4000

export class F0Track {
  /**
   * @param {object} [opts]
   * @param {number} [opts.inputLength=2048] AnalyserNode time-domain buffer length.
   * @param {number} [opts.sampleRate=44100] Default sample rate if not passed per-call.
   * @param {number} [opts.ringSize=60] Rolling ring buffer length (one update per rAF).
   * @param {number} [opts.clarityThreshold=0.85] Minimum clarity to consider voiced.
   */
  constructor({
    inputLength = 2048,
    sampleRate = 44100,
    ringSize = DEFAULT_RING_SIZE,
    clarityThreshold = DEFAULT_CLARITY_THRESHOLD,
  } = {}) {
    this.inputLength = inputLength
    this.sampleRate = sampleRate
    this.clarityThreshold = clarityThreshold
    this.ringSize = ringSize
    this.detector = PitchDetector.forFloat32Array(inputLength)
    // Pitchy's internal threshold is permissive; we apply our own gate after.
    this.detector.clarityThreshold = 0.5
    /** @type {Array<{f0: number|null, hz: number, clarity: number, env: number, t: number}>} */
    this.ring = []
  }

  /**
   * Update with a fresh time-domain frame.
   * @param {Float32Array} timeData time-domain samples (-1..1)
   * @param {number} [envelope=0] amplitude envelope (e.g. RMS) for AM analysis
   * @param {number} [sampleRate=this.sampleRate]
   * @returns {{hz: number, clarity: number, f0: number|null, f0Confidence: number}}
   */
  update(timeData, envelope = 0, sampleRate = this.sampleRate) {
    if (timeData.length !== this.inputLength) {
      // Recreate detector if buffer size changed (e.g. fftSize change).
      this.inputLength = timeData.length
      this.detector = PitchDetector.forFloat32Array(this.inputLength)
      this.detector.clarityThreshold = 0.5
    }
    const [hz, clarity] = this.detector.findPitch(timeData, sampleRate)
    const voiced =
      clarity > this.clarityThreshold &&
      hz >= MIN_PLAUSIBLE_HZ &&
      hz <= MAX_PLAUSIBLE_HZ
    const f0 = voiced ? hz : null

    this.ring.push({
      f0,
      hz,
      clarity,
      env: envelope,
      t: typeof performance !== 'undefined' ? performance.now() / 1000 : Date.now() / 1000,
    })
    if (this.ring.length > this.ringSize) {
      this.ring.splice(0, this.ring.length - this.ringSize)
    }

    return { hz, clarity, f0, f0Confidence: clarity }
  }

  /**
   * Append a synthetic sample to the ring (for tests / offline analysis).
   * @param {{f0: number|null, env?: number}} sample
   */
  pushSample({ f0, env = 0 }) {
    this.ring.push({
      f0,
      hz: f0 ?? 0,
      clarity: f0 != null ? 1 : 0,
      env,
      t: this.ring.length ? this.ring[this.ring.length - 1].t + 1 / 60 : 0,
    })
    if (this.ring.length > this.ringSize) {
      this.ring.splice(0, this.ring.length - this.ringSize)
    }
  }

  /**
   * Returns the rolling ring buffer of recent samples (oldest first).
   * @returns {Array<{f0: number|null, hz: number, clarity: number, env: number, t: number}>}
   */
  getRingBuffer() {
    return this.ring
  }

  reset() {
    this.ring.length = 0
  }
}
