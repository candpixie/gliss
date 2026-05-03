/**
 * Smoke test: builds a synthetic 440 Hz tone with 5 Hz vibrato, runs it
 * through the full AudioFrameExtractor pipeline a handful of times, and
 * console-logs the resulting AudioFrame to confirm shape and field types.
 *
 * Run with:  node src/audio/AudioFrame.smoke.js
 */

import { AudioFrameExtractor } from './Features.js'

const SAMPLE_RATE = 44100
const FFT_SIZE = 2048

function buildTimeData(t0, durationSamples) {
  const data = new Float32Array(FFT_SIZE)
  for (let i = 0; i < FFT_SIZE; i++) {
    const t = t0 + i / SAMPLE_RATE
    // 440 Hz with ±25 cent / 5 Hz vibrato + a touch of breath noise.
    const cents = 25 * Math.sin(2 * Math.PI * 5 * t)
    const f = 440 * Math.pow(2, cents / 1200)
    data[i] = 0.6 * Math.sin(2 * Math.PI * f * t) + 0.05 * (Math.random() - 0.5)
  }
  return data
}

function dft(timeData) {
  // Lightweight magnitude DFT for the smoke test only — slow but fine here.
  const N = timeData.length
  const bins = N / 2
  const out = new Float32Array(bins)
  for (let k = 0; k < bins; k++) {
    let re = 0
    let im = 0
    for (let n = 0; n < N; n++) {
      const angle = (-2 * Math.PI * k * n) / N
      re += timeData[n] * Math.cos(angle)
      im += timeData[n] * Math.sin(angle)
    }
    const mag = Math.sqrt(re * re + im * im) / N
    // Convert linear magnitude to dB (matching AnalyserNode output).
    out[k] = 20 * Math.log10(Math.max(mag, 1e-12))
  }
  return out
}

const extractor = new AudioFrameExtractor({ fftSize: FFT_SIZE, sampleRate: SAMPLE_RATE })

let lastFrame
const FRAMES = 30 // ~0.5 s at 60 Hz update rate
for (let i = 0; i < FRAMES; i++) {
  const t0 = i / 60
  const timeData = buildTimeData(t0, FFT_SIZE)
  const freqDataDb = dft(timeData)
  lastFrame = extractor.extract(freqDataDb, timeData, SAMPLE_RATE)
}

// Console-log a sample frame, replacing typed arrays with summaries so the
// log is readable.
const summary = {
  ...lastFrame,
  fftMag: `Float32Array(${lastFrame.fftMag.length})  [${lastFrame.fftMag[0].toExponential(2)}, ...]`,
  frequencyData: `Float32Array(${lastFrame.frequencyData.length})`,
  timeData: `Float32Array(${lastFrame.timeData.length})`,
}

console.log('AudioFrame sample:')
console.log(JSON.stringify(summary, null, 2))

// Cheap shape assertion to catch regressions.
const required = [
  'rms', 'centroid', 'flux', 'bands', 'fftMag',
  'f0', 'f0Confidence', 'vibrato', 'harmonicEnergy', 'percussiveEnergy',
]
for (const k of required) {
  if (!(k in lastFrame)) {
    console.error(`MISSING required AudioFrame field: ${k}`)
    process.exit(1)
  }
}
const vibKeys = ['active', 'rateHz', 'extentCents', 'amDepth']
for (const k of vibKeys) {
  if (!(k in lastFrame.vibrato)) {
    console.error(`MISSING vibrato.${k}`)
    process.exit(1)
  }
}
console.log('\nAudioFrame shape: OK')
console.log(`f0=${lastFrame.f0?.toFixed(2) ?? 'null'} Hz, vibrato.active=${lastFrame.vibrato.active}, rateHz=${lastFrame.vibrato.rateHz.toFixed(2)}, extentCents=${lastFrame.vibrato.extentCents.toFixed(2)}`)
