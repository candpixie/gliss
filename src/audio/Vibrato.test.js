/**
 * Synthetic FM signal test for VibratoDetector.
 *
 * Builds a 1-second f0 trajectory at 60 Hz update rate with 5 Hz sinusoidal
 * FM and ±25 cents modulation amplitude (50 cents peak-to-peak), then asserts
 * the detector reports rateHz≈5, extentCents≈50, and active=true.
 *
 * Run with:  node --test src/audio/Vibrato.test.js
 */

import test from 'node:test'
import assert from 'node:assert/strict'
import { VibratoDetector } from './Vibrato.js'

function buildFmSignal({
  rateHz = 5,
  amplitudeCents = 25,         // ± amplitudeCents → 2*amplitudeCents peak-to-peak
  durationSec = 1,
  updateRateHz = 60,
  baseHz = 440,
  amDepth = 0.0,
} = {}) {
  const n = Math.round(durationSec * updateRateHz)
  const samples = []
  for (let i = 0; i < n; i++) {
    const t = i / updateRateHz
    const cents = amplitudeCents * Math.sin(2 * Math.PI * rateHz * t)
    const f0 = baseHz * Math.pow(2, cents / 1200)
    const env = 0.5 * (1 + amDepth * Math.sin(2 * Math.PI * rateHz * t))
    samples.push({ f0, env })
  }
  return samples
}

test('detects 5 Hz / 50-cent peak-to-peak FM vibrato', () => {
  const detector = new VibratoDetector({ updateRateHz: 60 })
  const samples = buildFmSignal({ rateHz: 5, amplitudeCents: 25 })

  // Detector uses hysteresis — feed two windows so it can latch on.
  detector.detect(samples)
  const result = detector.detect(samples)

  assert.equal(result.active, true, 'vibrato should be active')
  assert.ok(
    Math.abs(result.rateHz - 5) < 0.6,
    `rateHz should be ~5, got ${result.rateHz.toFixed(3)}`
  )
  assert.ok(
    Math.abs(result.extentCents - 50) < 5,
    `extentCents should be ~50, got ${result.extentCents.toFixed(2)}`
  )
  assert.ok(result.confidence > 0.7, `confidence too low: ${result.confidence.toFixed(3)}`)
})

test('does not flip active on flat (no vibrato) f0', () => {
  const detector = new VibratoDetector({ updateRateHz: 60 })
  const samples = []
  for (let i = 0; i < 60; i++) samples.push({ f0: 440, env: 0.5 })
  const result = detector.detect(samples)
  assert.equal(result.active, false)
  assert.ok(result.extentCents < 1)
})

test('amDepth is computed from envelope variation', () => {
  const detector = new VibratoDetector({ updateRateHz: 60 })
  // 5 Hz FM with strong AM coupling (50% amplitude swing).
  const samples = buildFmSignal({ rateHz: 5, amplitudeCents: 25, amDepth: 0.5 })
  const result = detector.detect(samples)
  assert.ok(result.amDepth > 0.3, `amDepth should reflect 50% swing, got ${result.amDepth.toFixed(3)}`)
})

test('rejects tiny extent (10 cent) FM as not active', () => {
  const detector = new VibratoDetector({ updateRateHz: 60 })
  // 10 cents peak-to-peak is below the minExtentCents=15 gate.
  const samples = buildFmSignal({ rateHz: 5, amplitudeCents: 5 })
  detector.detect(samples)
  const result = detector.detect(samples)
  assert.equal(
    result.active,
    false,
    'sub-15-cent extent should fail the gate even at 5 Hz'
  )
})
