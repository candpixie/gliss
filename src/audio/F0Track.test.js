import { test } from 'node:test'
import assert from 'node:assert/strict'
import { F0Track } from './F0Track.js'

const N = 2048

function sine(freq, sampleRate, n = N, amp = 0.8) {
  const buf = new Float32Array(n)
  for (let i = 0; i < n; i++) buf[i] = amp * Math.sin(2 * Math.PI * freq * i / sampleRate)
  return buf
}

test('detects a clean tone at the actual sample rate', () => {
  for (const sampleRate of [44100, 48000]) {
    const track = new F0Track({ inputLength: N, sampleRate })
    for (const freq of [196, 261.6256, 440, 880]) {
      const { f0, clarity } = track.update(sine(freq, sampleRate), 0.5, sampleRate)
      assert.ok(f0 != null, `${freq} Hz @ ${sampleRate} should be voiced`)
      const cents = Math.abs(1200 * Math.log2(f0 / freq))
      assert.ok(cents < 10, `${freq} Hz @ ${sampleRate}: detected ${f0?.toFixed(1)} (${cents.toFixed(1)} cents off)`)
      assert.ok(clarity > 0.85, `clarity ${clarity} below voiced gate`)
    }
  }
})

test('a wrong sample rate skews the detected pitch (regression guard)', () => {
  // Tone is generated at 48k but findPitch is told 44.1k — pitch reads flat.
  // This is exactly the bug the tuner fix addressed: pass the real rate.
  const track = new F0Track({ inputLength: N, sampleRate: 44100 })
  const { f0 } = track.update(sine(440, 48000), 0.5, 44100)
  assert.ok(f0 != null)
  // 440 * 44100/48000 ≈ 404 Hz
  assert.ok(Math.abs(f0 - 404) < 8, `expected ~404 Hz from the rate mismatch, got ${f0?.toFixed(1)}`)
})

test('gates out silence and broadband noise as unvoiced', () => {
  const sampleRate = 48000
  const track = new F0Track({ inputLength: N, sampleRate })

  const silence = new Float32Array(N)
  assert.equal(track.update(silence, 0, sampleRate).f0, null)

  // Deterministic pseudo-noise (no Math.random for reproducibility).
  const noise = new Float32Array(N)
  let seed = 12345
  for (let i = 0; i < N; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    noise[i] = (seed / 0x7fffffff) * 2 - 1
  }
  assert.equal(track.update(noise, 0.5, sampleRate).f0, null)
})

test('ring buffer is bounded to ringSize', () => {
  const track = new F0Track({ inputLength: N, sampleRate: 48000, ringSize: 10 })
  for (let i = 0; i < 30; i++) track.update(sine(440, 48000), 0.5, 48000)
  assert.equal(track.getRingBuffer().length, 10)
})
