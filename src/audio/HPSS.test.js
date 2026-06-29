import { test } from 'node:test'
import assert from 'node:assert/strict'
import { HPSS } from './HPSS.js'

const BINS = 64

// A stable line spectrum: sharp peaks on a few bins, quiet elsewhere.
function tonalFrame() {
  const f = new Float32Array(BINS).fill(0.01)
  for (const peak of [8, 16, 24, 32]) f[peak] = 1.0
  return f
}

test('steady tonal spectrum reads as harmonic, not percussive', () => {
  const hpss = new HPSS({ binCount: BINS })
  let out
  for (let i = 0; i < 25; i++) out = hpss.update(tonalFrame())
  assert.ok(out.harmonicEnergy > out.percussiveEnergy,
    `harmonic ${out.harmonicEnergy} should exceed percussive ${out.percussiveEnergy}`)
  assert.ok(out.harmonicEnergy > 0.5, `harmonic ${out.harmonicEnergy} too low`)
})

test('energies stay within 0..1 and warmup returns zeros', () => {
  const hpss = new HPSS({ binCount: BINS })
  const first = hpss.update(tonalFrame())
  assert.deepEqual(first, { harmonicEnergy: 0, percussiveEnergy: 0 }) // N < 3
  for (let i = 0; i < 25; i++) {
    const o = hpss.update(tonalFrame())
    assert.ok(o.harmonicEnergy >= 0 && o.harmonicEnergy <= 1)
    assert.ok(o.percussiveEnergy >= 0 && o.percussiveEnergy <= 1)
  }
})

test('reset clears the rolling spectrogram', () => {
  const hpss = new HPSS({ binCount: BINS })
  for (let i = 0; i < 10; i++) hpss.update(tonalFrame())
  hpss.reset()
  assert.deepEqual(hpss.update(tonalFrame()), { harmonicEnergy: 0, percussiveEnergy: 0 })
})
