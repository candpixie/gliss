# Lane A — Audio (Conductor agent prompt)

You are Lane A in a 4-agent parallel build of an FFT visualizer. Read `SPEC.md` at the repo root in full before writing any code. The integration contract is the `AudioFrame` interface in §3 of that spec.

## Your scope

Owns: `src/audio/Analyser.js`, `src/audio/AudioInput.js`, `src/audio/Features.js`, and three new files: `src/audio/F0Track.js`, `src/audio/Vibrato.js`, `src/audio/HPSS.js`.

Do NOT modify any file under `src/visuals/`, `src/components/`, `src/presets/`, or top-level config. If a change there is needed, stop and surface it in your PR description.

## What to build

1. **f0 tracking** (`F0Track.js`):
   - Use the `pitchy` npm package (McLeod Pitch Method). Add it to `package.json`.
   - Wraps the AnalyserNode time-domain buffer; returns `{ hz, clarity }` per frame.
   - Output `f0 = hz` when `clarity > 0.85`, else `null`. `f0Confidence = clarity`.
   - Maintain a small ring buffer of recent f0 values for the vibrato detector.

2. **Vibrato detection** (`Vibrato.js`):
   - Input: rolling 1-second f0 trajectory + amplitude envelope.
   - Detect 4–8 Hz periodicity. Short-time autocorrelation on the centered f0 series is sufficient.
   - Compute `extentCents` = peak-to-peak f0 modulation in cents.
   - Compute `amDepth` = (envelopeMax − envelopeMin) / envelopeMean over the same window, clamped 0..1.
   - `active = true` when periodicity confidence exceeds a hysteresis threshold (e.g. enter at 0.7, leave at 0.5) AND extent > 15 cents OR amDepth > 0.1.
   - Unit-test with a synthetic 5 Hz / 50-cent FM signal. Must report `rateHz ≈ 5`, `extentCents ≈ 50`, `active = true`.

3. **HPSS** (`HPSS.js`):
   - Fitzgerald median-filter approach. Maintain a rolling spectrogram of N=21 frames.
   - Horizontal (time) median → harmonic estimate. Vertical (frequency) median → percussive estimate.
   - Soft Wiener-style mask: `H_mask = h^2 / (h^2 + p^2 + ε)`, same for `P_mask`.
   - Output `harmonicEnergy = sum(H_mask * mag) / sum(mag)`, `percussiveEnergy` similarly.
   - Pure JS, ~50–80 lines.

4. **Wire it together** in `Features.js`:
   - Extend the existing `extractFeatures` to return the full `AudioFrame` shape from `SPEC.md` §3.
   - Existing rms/centroid/flux/bands logic stays — do not regress it.
   - Smoothing on f0Confidence, harmonicEnergy, percussiveEnergy with EMA alpha=0.3.

## Definition of done

- `npm run dev` boots without console errors.
- Console-logging the AudioFrame while playing recorder/voice/violin shows sane f0 values, vibrato detection that flips on during a sustained vibrato note, and harmonic/percussive energies that respond appropriately to noise vs tone.
- Unit test for vibrato passes (5 Hz / 50 cents synthetic).
- No imports from `three` or anything under `src/visuals/` or `src/components/`.

## Style

Plain JS modules (no TypeScript yet — the codebase is JS). Use JSDoc to document the AudioFrame return shape. Keep functions pure where possible. Don't add a state manager; one analyzer instance per session is fine.

When done, push your branch and open a PR titled `feat(audio): f0 + vibrato + HPSS for music-aware visualizer`. PR description should include a 5-line summary of what each new module does and any deviation from the spec.
