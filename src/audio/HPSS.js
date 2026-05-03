/**
 * HPSS - Fitzgerald median-filter Harmonic/Percussive Source Separation.
 *
 * Maintains a rolling spectrogram of N=21 frames of linear FFT magnitudes.
 *   - Horizontal (time-axis) median per bin → harmonic estimate H[k]
 *   - Vertical (freq-axis) median on the latest frame → percussive estimate P[k]
 *
 * Soft Wiener-style masks then recombine into harmonic / percussive energies:
 *   H_mask = h^2 / (h^2 + p^2 + ε)
 *   P_mask = p^2 / (h^2 + p^2 + ε)
 *   harmonicEnergy = Σ H_mask · |X|  /  Σ |X|
 *   percussiveEnergy = Σ P_mask · |X|  /  Σ |X|
 *
 * To keep per-frame cost reasonable we operate on `binCount` bins (defaults to
 * the full 1024). Both energies are returned in 0..1.
 */

const DEFAULT_FRAMES = 21
const DEFAULT_FREQ_WIDTH = 17

export class HPSS {
  /**
   * @param {object} [opts]
   * @param {number} [opts.binCount=1024]
   * @param {number} [opts.frames=21] rolling spectrogram length
   * @param {number} [opts.freqMedianWidth=17] frequency-axis median window
   */
  constructor({
    binCount = 1024,
    frames = DEFAULT_FRAMES,
    freqMedianWidth = DEFAULT_FREQ_WIDTH,
  } = {}) {
    this.binCount = binCount
    this.frames = frames
    this.freqMedianWidth = freqMedianWidth | 0
    /** @type {Float32Array[]} oldest first */
    this.spectrogram = []
    this._timeBuf = new Float32Array(this.frames)
    this._freqBuf = new Float32Array(this.freqMedianWidth)
    this._harm = new Float32Array(this.binCount)
    this._perc = new Float32Array(this.binCount)
  }

  /**
   * Push a fresh linear-magnitude frame and return harmonic/percussive energies.
   *
   * @param {ArrayLike<number>} linMag linear magnitudes (length >= binCount)
   * @returns {{harmonicEnergy: number, percussiveEnergy: number}}
   */
  update(linMag) {
    const bins = Math.min(this.binCount, linMag.length)
    if (bins !== this.binCount) {
      this.binCount = bins
      this._harm = new Float32Array(bins)
      this._perc = new Float32Array(bins)
      this.spectrogram.length = 0
    }

    const frame = new Float32Array(bins)
    for (let i = 0; i < bins; i++) {
      const v = linMag[i]
      frame[i] = Number.isFinite(v) && v > 0 ? v : 0
    }
    this.spectrogram.push(frame)
    if (this.spectrogram.length > this.frames) {
      this.spectrogram.splice(0, this.spectrogram.length - this.frames)
    }

    const N = this.spectrogram.length
    if (N < 3) {
      return { harmonicEnergy: 0, percussiveEnergy: 0 }
    }

    // Time-axis (horizontal) median per bin → harmonic estimate.
    const tBuf = this._timeBuf.length === N ? this._timeBuf : new Float32Array(N)
    this._timeBuf = tBuf
    for (let k = 0; k < bins; k++) {
      for (let n = 0; n < N; n++) tBuf[n] = this.spectrogram[n][k]
      this._harm[k] = median(tBuf, N)
    }

    // Frequency-axis (vertical) median on the latest frame → percussive.
    const current = this.spectrogram[N - 1]
    const w = this.freqMedianWidth
    const half = w >> 1
    const fBuf = this._freqBuf
    for (let k = 0; k < bins; k++) {
      let count = 0
      const lo = k - half
      const hi = k + half
      for (let j = lo; j <= hi; j++) {
        if (j >= 0 && j < bins) fBuf[count++] = current[j]
      }
      this._perc[k] = median(fBuf, count)
    }

    const eps = 1e-9
    let harmonicSum = 0
    let percussiveSum = 0
    let totalSum = 0
    for (let k = 0; k < bins; k++) {
      const h = this._harm[k]
      const p = this._perc[k]
      const h2 = h * h
      const p2 = p * p
      const denom = h2 + p2 + eps
      const mag = current[k]
      harmonicSum += (h2 / denom) * mag
      percussiveSum += (p2 / denom) * mag
      totalSum += mag
    }

    if (totalSum <= eps) return { harmonicEnergy: 0, percussiveEnergy: 0 }
    return {
      harmonicEnergy: clamp01(harmonicSum / totalSum),
      percussiveEnergy: clamp01(percussiveSum / totalSum),
    }
  }

  reset() {
    this.spectrogram.length = 0
  }
}

function clamp01(v) {
  if (!Number.isFinite(v)) return 0
  if (v < 0) return 0
  if (v > 1) return 1
  return v
}

function median(buf, len) {
  if (len === 0) return 0
  if (len === 1) return buf[0]
  // Copy + sort the active prefix; len is small (≤ ~21) so this is cheap.
  const copy = buf.slice(0, len)
  copy.sort((a, b) => a - b)
  const mid = len >> 1
  return len & 1 ? copy[mid] : 0.5 * (copy[mid - 1] + copy[mid])
}
