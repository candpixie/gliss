/**
 * pitchMath — pure helpers for converting Hz to notes and tuner readings.
 *
 * Kept framework-free (no React, no Web Audio) so the tuner logic is unit
 * testable. Consumed by Visualizer.jsx for the live readout.
 */

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

/** Nearest MIDI note number for a frequency (A4 = 440 Hz = MIDI 69). */
export function midiFromHz(hz) {
  return Math.round(69 + 12 * Math.log2(hz / 440))
}

/** Scientific-pitch name for a MIDI number, e.g. 69 → "A4". null if out of range. */
export function midiToName(midi) {
  if (midi < 0 || midi > 127) return null
  const name = NOTE_NAMES[((midi % 12) + 12) % 12]
  const octave = Math.floor(midi / 12) - 1
  return `${name}${octave}`
}

/** Exact frequency of a MIDI note in equal temperament (A440). */
export function hzFromMidi(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12)
}

/**
 * True tuner reading: nearest equal-tempered note and signed cents off it.
 * Independent of any hold-anchor, so it reads like a real chromatic tuner.
 * `cents` is in [-50, +50]. Returns null for non-positive / non-finite input.
 */
export function tunerReading(hz) {
  if (!Number.isFinite(hz) || hz <= 0) return null
  const midi = midiFromHz(hz)
  const noteHz = hzFromMidi(midi)
  return {
    name: midiToName(midi),
    noteHz,
    cents: 1200 * Math.log2(hz / noteHz),
  }
}
