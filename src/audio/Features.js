/**
 * Features - Audio feature extraction producing the AudioFrame integration
 * contract from SPEC.md §3.
 *
 * @typedef {Object} AudioFrame
 * @property {number} rms              0..1 perceptual loudness (smooth)
 * @property {number} centroid         0..1 log-normalized spectral centroid
 * @property {number} flux             0..1 half-wave rectified spectral flux
 * @property {{low:number, mid:number, high:number}} bands  per-band 0..1
 * @property {Float32Array} fftMag     1024 bins of linear magnitude
 * @property {number|null} f0          Hz, monophonic pitch via pitchy; null when unvoiced
 * @property {number} f0Confidence     0..1
 * @property {{active:boolean, rateHz:number, extentCents:number, amDepth:number}} vibrato
 * @property {number} harmonicEnergy   0..1 (HPSS)
 * @property {number} percussiveEnergy 0..1 (HPSS)
 * @property {Float32Array} frequencyData  raw dB output from AnalyserNode (alias for legacy consumers)
 * @property {Float32Array} timeData       time-domain samples (-1..1)
 */

import { F0Track } from './F0Track.js'
import { VibratoDetector } from './Vibrato.js'
import { HPSS } from './HPSS.js'

const DEFAULT_SAMPLE_RATE = 44100
const LOG_MIN_HZ = 20
const LOG_MAX_HZ = 20000
const LOG_RANGE = Math.log2(LOG_MAX_HZ / LOG_MIN_HZ)

/* ------------------------------------------------------------------------ */
/*  Pure feature primitives (kept around for callers that want them raw).   */
/* ------------------------------------------------------------------------ */

/** RMS of -1..1 time samples → 0..1. */
export function calculateRMS(timeData) {
  let sum = 0
  for (let i = 0; i < timeData.length; i++) sum += timeData[i] * timeData[i]
  return Math.sqrt(sum / timeData.length)
}

/**
 * Spectral centroid in Hz from dB-domain frequency data.
 */
export function calculateCentroid(frequencyDataDb, sampleRate = DEFAULT_SAMPLE_RATE) {
  let weightedSum = 0
  let magnitudeSum = 0
  const nyquist = sampleRate / 2
  const binWidth = nyquist / frequencyDataDb.length
  for (let i = 0; i < frequencyDataDb.length; i++) {
    const magnitude = Math.pow(10, frequencyDataDb[i] / 20)
    const frequency = i * binWidth
    weightedSum += frequency * magnitude
    magnitudeSum += magnitude
  }
  return magnitudeSum > 0 ? weightedSum / magnitudeSum : 0
}

/**
 * Half-wave rectified spectral flux on dB-domain frames (legacy form).
 */
export function calculateFlux(frequencyData, previousFrequencyData) {
  let flux = 0
  for (let i = 0; i < frequencyData.length; i++) {
    const diff = frequencyData[i] - (previousFrequencyData[i] || 0)
    if (diff > 0) flux += diff
  }
  return flux
}

/** Sum of linear magnitudes inside three bands (legacy form). */
export function calculateBandEnergy(
  frequencyDataDb,
  lowEnd = 60,
  midEnd = 2000,
  highEnd = 8000,
  sampleRate = DEFAULT_SAMPLE_RATE
) {
  const nyquist = sampleRate / 2
  const binWidth = nyquist / frequencyDataDb.length
  let lowEnergy = 0
  let midEnergy = 0
  let highEnergy = 0
  for (let i = 0; i < frequencyDataDb.length; i++) {
    const frequency = i * binWidth
    const magnitude = Math.pow(10, frequencyDataDb[i] / 20)
    if (frequency < lowEnd) lowEnergy += magnitude
    else if (frequency < midEnd) midEnergy += magnitude
    else if (frequency < highEnd) highEnergy += magnitude
  }
  return { low: lowEnergy, mid: midEnergy, high: highEnergy }
}

/** Exponential moving average. */
export function smoothFeature(current, previous, alpha = 0.3) {
  if (previous === undefined || previous === null || !Number.isFinite(previous)) return current
  return alpha * current + (1 - alpha) * previous
}

/* ------------------------------------------------------------------------ */
/*  AudioFrame extractor                                                    */
/* ------------------------------------------------------------------------ */

/**
 * Stateful AudioFrame producer. One instance per audio session.
 */
export class AudioFrameExtractor {
  constructor({ fftSize = 2048, sampleRate = DEFAULT_SAMPLE_RATE } = {}) {
    this.fftSize = fftSize
    this.sampleRate = sampleRate
    this.binCount = fftSize / 2
    this.f0Track = new F0Track({ inputLength: fftSize, sampleRate })
    this.vibrato = new VibratoDetector({ updateRateHz: 60 })
    this.hpss = new HPSS({ binCount: this.binCount })
    this._linMag = new Float32Array(this.binCount)
    this._prevLinMag = new Float32Array(this.binCount)
    this._smooth = {
      rms: 0,
      centroid: 0,
      flux: 0,
      f0Confidence: 0,
      harmonicEnergy: 0,
      percussiveEnergy: 0,
      bandLow: 0,
      bandMid: 0,
      bandHigh: 0,
    }
  }

  /**
   * Produce an AudioFrame from one rAF tick.
   * @param {Float32Array} frequencyDataDb dB-domain frame from AnalyserNode
   * @param {Float32Array} timeData        time-domain samples (-1..1)
   * @param {number} [sampleRate]
   * @returns {AudioFrame}
   */
  extract(frequencyDataDb, timeData, sampleRate = this.sampleRate) {
    if (sampleRate !== this.sampleRate) this.sampleRate = sampleRate

    const bins = Math.min(this.binCount, frequencyDataDb.length)
    if (bins !== this.binCount) {
      this.binCount = bins
      this._linMag = new Float32Array(bins)
      this._prevLinMag = new Float32Array(bins)
      this.hpss = new HPSS({ binCount: bins })
    }

    // dB → linear magnitude.
    let magSum = 0
    let weightedFreq = 0
    let fluxRaw = 0
    let bandLow = 0
    let bandMid = 0
    let bandHigh = 0
    const nyquist = sampleRate / 2
    const binWidth = nyquist / bins
    for (let i = 0; i < bins; i++) {
      const m = Math.pow(10, frequencyDataDb[i] / 20)
      this._linMag[i] = m
      magSum += m
      const f = i * binWidth
      weightedFreq += f * m
      const d = m - this._prevLinMag[i]
      if (d > 0) fluxRaw += d
      if (f < 60) bandLow += m
      else if (f < 2000) bandMid += m
      else if (f < 8000) bandHigh += m
    }

    // RMS in [0,1] — timeData is normalized -1..1.
    const rmsRaw = clamp01(calculateRMS(timeData))

    // Centroid → log-normalized 0..1 over [20 Hz, 20 kHz].
    const centroidHz = magSum > 0 ? weightedFreq / magSum : 0
    const centroidNorm = centroidHz > LOG_MIN_HZ
      ? clamp01(Math.log2(centroidHz / LOG_MIN_HZ) / LOG_RANGE)
      : 0

    // Flux: average per-bin half-wave rectified increase, soft-clipped.
    const fluxAvg = fluxRaw / Math.max(1, bins)
    const fluxNorm = clamp01(Math.tanh(fluxAvg * 8))

    // Bands: log-compress sums, soft-clip.
    const bandsNorm = {
      low: clamp01(Math.tanh(bandLow / 32)),
      mid: clamp01(Math.tanh(bandMid / 64)),
      high: clamp01(Math.tanh(bandHigh / 64)),
    }

    // F0 + ring buffer (envelope = current rms for AM analysis).
    const { hz, clarity, f0, f0Confidence } = this.f0Track.update(timeData, rmsRaw, sampleRate)

    // Vibrato from ring buffer.
    const ring = this.f0Track.getRingBuffer()
    const vib = this.vibrato.detect(ring)

    // HPSS energies from rolling spectrogram.
    const { harmonicEnergy, percussiveEnergy } = this.hpss.update(this._linMag)

    // EMA smoothing on noisy scalars (alpha=0.3).
    this._smooth.rms = smoothFeature(rmsRaw, this._smooth.rms, 0.3)
    this._smooth.centroid = smoothFeature(centroidNorm, this._smooth.centroid, 0.3)
    this._smooth.flux = smoothFeature(fluxNorm, this._smooth.flux, 0.5)
    this._smooth.f0Confidence = smoothFeature(f0Confidence, this._smooth.f0Confidence, 0.3)
    this._smooth.harmonicEnergy = smoothFeature(harmonicEnergy, this._smooth.harmonicEnergy, 0.3)
    this._smooth.percussiveEnergy = smoothFeature(percussiveEnergy, this._smooth.percussiveEnergy, 0.3)
    this._smooth.bandLow = smoothFeature(bandsNorm.low, this._smooth.bandLow, 0.3)
    this._smooth.bandMid = smoothFeature(bandsNorm.mid, this._smooth.bandMid, 0.3)
    this._smooth.bandHigh = smoothFeature(bandsNorm.high, this._smooth.bandHigh, 0.3)

    // Snapshot fftMag for downstream visuals (linear, owned by caller).
    const fftMag = new Float32Array(this._linMag)

    // Roll prev-mag for next frame's flux.
    const tmp = this._prevLinMag
    this._prevLinMag = this._linMag
    this._linMag = tmp

    return {
      rms: this._smooth.rms,
      centroid: this._smooth.centroid,
      flux: this._smooth.flux,
      bands: {
        low: this._smooth.bandLow,
        mid: this._smooth.bandMid,
        high: this._smooth.bandHigh,
      },
      fftMag,
      f0,
      f0Confidence: this._smooth.f0Confidence,
      vibrato: {
        active: vib.active,
        rateHz: vib.rateHz,
        extentCents: vib.extentCents,
        amDepth: vib.amDepth,
      },
      harmonicEnergy: this._smooth.harmonicEnergy,
      percussiveEnergy: this._smooth.percussiveEnergy,
      // Legacy aliases — kept until Lane B swaps consumers to `fftMag`.
      frequencyData: new Float32Array(frequencyDataDb),
      timeData: new Float32Array(timeData),
      // Auxiliary (not in the SPEC contract but useful for overlays).
      _meta: { hz, clarity, centroidHz },
    }
  }

  reset() {
    this.f0Track.reset()
    this.vibrato.reset()
    this.hpss.reset()
    this._prevLinMag.fill(0)
    for (const k of Object.keys(this._smooth)) this._smooth[k] = 0
  }
}

/* ------------------------------------------------------------------------ */
/*  Backwards-compatible singleton API                                       */
/*                                                                           */
/*  Existing call site (Visualizer.jsx) does:                                */
/*    extractFeatures(frequencyData, timeData)                               */
/*  We keep that signature working by lazily constructing one extractor.     */
/* ------------------------------------------------------------------------ */

let defaultExtractor = null

/**
 * Produce an AudioFrame from current AnalyserNode frames. Stateful — uses a
 * module-level singleton extractor, which is fine for one audio session.
 *
 * @param {Float32Array} frequencyData dB-domain
 * @param {Float32Array} timeData time-domain (-1..1)
 * @param {number} [sampleRate=44100]
 * @returns {AudioFrame}
 */
export function extractFeatures(frequencyData, timeData, sampleRate = DEFAULT_SAMPLE_RATE) {
  if (!defaultExtractor || defaultExtractor.fftSize !== timeData.length) {
    defaultExtractor = new AudioFrameExtractor({ fftSize: timeData.length, sampleRate })
  }
  return defaultExtractor.extract(frequencyData, timeData, sampleRate)
}

/** Reset singleton state (e.g. when stopping/starting a new source). */
export function resetFeatures() {
  if (defaultExtractor) defaultExtractor.reset()
  defaultExtractor = null
}

function clamp01(v) {
  if (!Number.isFinite(v)) return 0
  if (v < 0) return 0
  if (v > 1) return 1
  return v
}
