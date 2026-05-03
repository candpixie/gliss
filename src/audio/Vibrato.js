/**
 * VibratoDetector - looks for 4–8 Hz periodicity in the f0 trajectory.
 *
 * Input:  rolling buffer of recent samples `{ f0, env }` produced by F0Track.
 * Output: `{ active, rateHz, extentCents, amDepth, confidence }`.
 *
 *   - `extentCents` is the peak-to-peak f0 modulation in cents (string/voice).
 *   - `amDepth` is (envMax - envMin) / envMean over the same window
 *     (woodwind/brass amplitude modulation).
 *   - `active` uses hysteresis: enter at 0.7 confidence, leave at 0.5,
 *     gated by extentCents > 15 OR amDepth > 0.1.
 */

const MIN_RATE_HZ = 4
const MAX_RATE_HZ = 8

export class VibratoDetector {
  /**
   * @param {object} [opts]
   * @param {number} [opts.updateRateHz=60] expected sample rate of the f0 buffer
   * @param {number} [opts.enterThreshold=0.7] autocorr peak required to flip on
   * @param {number} [opts.leaveThreshold=0.5] autocorr peak required to stay on
   * @param {number} [opts.minExtentCents=15] cents extent gate
   * @param {number} [opts.minAmDepth=0.1] AM-depth gate
   */
  constructor({
    updateRateHz = 60,
    enterThreshold = 0.7,
    leaveThreshold = 0.5,
    minExtentCents = 15,
    minAmDepth = 0.1,
  } = {}) {
    this.updateRateHz = updateRateHz
    this.enterThreshold = enterThreshold
    this.leaveThreshold = leaveThreshold
    this.minExtentCents = minExtentCents
    this.minAmDepth = minAmDepth
    this.active = false
  }

  /**
   * @param {Array<{f0: number|null, env?: number}>} samples
   * @returns {{active: boolean, rateHz: number, extentCents: number, amDepth: number, confidence: number}}
   */
  detect(samples) {
    const valid = []
    for (const s of samples) {
      if (s && s.f0 != null && Number.isFinite(s.f0) && s.f0 > 0) valid.push(s)
    }

    // Need at least half a window of voiced samples.
    if (valid.length < Math.max(8, this.updateRateHz * 0.5)) {
      this._applyHysteresis(0, 0, 0)
      return {
        active: false,
        rateHz: 0,
        extentCents: 0,
        amDepth: this._amDepth(samples),
        confidence: 0,
      }
    }

    const meanF0 = valid.reduce((acc, s) => acc + s.f0, 0) / valid.length
    const cents = new Float64Array(valid.length)
    let maxCents = -Infinity
    let minCents = Infinity
    for (let i = 0; i < valid.length; i++) {
      const c = 1200 * Math.log2(valid[i].f0 / meanF0)
      cents[i] = c
      if (c > maxCents) maxCents = c
      if (c < minCents) minCents = c
    }
    const extentCents = maxCents - minCents

    // Detrend (remove DC) before autocorrelation.
    let meanCents = 0
    for (let i = 0; i < cents.length; i++) meanCents += cents[i]
    meanCents /= cents.length
    for (let i = 0; i < cents.length; i++) cents[i] -= meanCents

    let r0 = 0
    for (let i = 0; i < cents.length; i++) r0 += cents[i] * cents[i]
    if (r0 < 1e-9) {
      this._applyHysteresis(0, extentCents, 0)
      return {
        active: false,
        rateHz: 0,
        extentCents,
        amDepth: this._amDepth(samples),
        confidence: 0,
      }
    }

    const minLag = Math.max(2, Math.floor(this.updateRateHz / MAX_RATE_HZ))
    const maxLag = Math.min(cents.length - 2, Math.ceil(this.updateRateHz / MIN_RATE_HZ))

    let bestLag = 0
    let bestConfidence = 0
    for (let lag = minLag; lag <= maxLag; lag++) {
      let r = 0
      const n = cents.length - lag
      for (let i = 0; i < n; i++) r += cents[i] * cents[i + lag]
      // Bias-corrected normalisation against r0.
      const norm = (r0 * n) / cents.length
      const rNorm = norm > 0 ? r / norm : 0
      if (rNorm > bestConfidence) {
        bestConfidence = rNorm
        bestLag = lag
      }
    }

    // Parabolic refinement around the integer lag for sub-sample rate accuracy.
    let refinedLag = bestLag
    if (bestLag > minLag && bestLag < maxLag) {
      const rAt = (lag) => {
        let r = 0
        const n = cents.length - lag
        for (let i = 0; i < n; i++) r += cents[i] * cents[i + lag]
        return r
      }
      const yL = rAt(bestLag - 1)
      const yC = rAt(bestLag)
      const yR = rAt(bestLag + 1)
      const denom = yL - 2 * yC + yR
      if (Math.abs(denom) > 1e-9) {
        const delta = (0.5 * (yL - yR)) / denom
        if (delta > -1 && delta < 1) refinedLag = bestLag + delta
      }
    }

    const confidence = Math.max(0, Math.min(1, bestConfidence))
    const rateHz = refinedLag > 0 ? this.updateRateHz / refinedLag : 0
    const amDepth = this._amDepth(samples)

    this._applyHysteresis(confidence, extentCents, amDepth)

    return {
      active: this.active,
      rateHz: this.active ? rateHz : 0,
      extentCents,
      amDepth,
      confidence,
    }
  }

  /** Reset internal hysteresis state. */
  reset() {
    this.active = false
  }

  _amDepth(samples) {
    let envMin = Infinity
    let envMax = -Infinity
    let envSum = 0
    let count = 0
    for (const s of samples) {
      if (!s || !Number.isFinite(s.env)) continue
      const e = s.env
      if (e < envMin) envMin = e
      if (e > envMax) envMax = e
      envSum += e
      count++
    }
    if (count < 4) return 0
    const envMean = envSum / count
    if (envMean < 1e-6) return 0
    return Math.min(1, Math.max(0, (envMax - envMin) / envMean))
  }

  _applyHysteresis(confidence, extentCents, amDepth) {
    const meetsExtent =
      extentCents > this.minExtentCents || amDepth > this.minAmDepth
    if (this.active) {
      if (confidence < this.leaveThreshold || !meetsExtent) this.active = false
    } else {
      if (confidence >= this.enterThreshold && meetsExtent) this.active = true
    }
  }
}
