import { test } from 'node:test'
import assert from 'node:assert/strict'
import { midiFromHz, midiToName, hzFromMidi, tunerReading } from './pitchMath.js'

test('midiFromHz maps reference pitches to MIDI numbers', () => {
  assert.equal(midiFromHz(440), 69)      // A4
  assert.equal(midiFromHz(261.6256), 60) // C4 (middle C)
  assert.equal(midiFromHz(880), 81)      // A5
})

test('midiToName produces scientific-pitch names', () => {
  assert.equal(midiToName(69), 'A4')
  assert.equal(midiToName(60), 'C4')
  assert.equal(midiToName(70), 'A#4')
  assert.equal(midiToName(-1), null)
  assert.equal(midiToName(200), null)
})

test('hzFromMidi round-trips with midiFromHz on exact notes', () => {
  for (const midi of [40, 55, 60, 69, 81, 100]) {
    assert.equal(midiFromHz(hzFromMidi(midi)), midi)
  }
})

test('tunerReading: exact reference pitches read 0 cents', () => {
  for (const [hz, name] of [[440, 'A4'], [261.6256, 'C4'], [196, 'G3'], [466.1638, 'A#4']]) {
    const r = tunerReading(hz)
    assert.equal(r.name, name)
    assert.ok(Math.abs(r.cents) < 1, `${hz} Hz should be ~0 cents, got ${r.cents}`)
  }
})

test('tunerReading: sharp/flat pitches report signed cents toward nearest note', () => {
  // 445 Hz is ~19.6 cents sharp of A4.
  const sharp = tunerReading(445)
  assert.equal(sharp.name, 'A4')
  assert.ok(sharp.cents > 15 && sharp.cents < 25, `got ${sharp.cents}`)

  // 433 Hz is ~27.8 cents flat of A4.
  const flat = tunerReading(433)
  assert.equal(flat.name, 'A4')
  assert.ok(flat.cents < -22 && flat.cents > -33, `got ${flat.cents}`)
})

test('tunerReading: cents always fall within a semitone (-50..50)', () => {
  for (let hz = 80; hz <= 1000; hz += 3.7) {
    const r = tunerReading(hz)
    assert.ok(r.cents >= -50.01 && r.cents <= 50.01, `${hz} Hz → ${r.cents} cents`)
  }
})

test('tunerReading: rejects non-positive / non-finite input', () => {
  assert.equal(tunerReading(0), null)
  assert.equal(tunerReading(-100), null)
  assert.equal(tunerReading(NaN), null)
})
