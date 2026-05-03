# fft-visualizer — v1 Spec

This is the integration contract for the v1 build. Every code change references this document. Conductor agents working in parallel worktrees must respect the boundaries here. If a change requires modifying this spec, flag it in the PR description rather than silently breaking other lanes.

---

## 1. Pitch

A music-aware FFT visualizer for monophonic acoustic instruments — woodwind, brass, strings, voice. Sees pitch, vibrato, breath/bow attacks, and harmonic structure, not just spectral magnitude. Different from ButterChurn (not "better than"): cold/organic/elemental aesthetic, music-aware response.

## 2. Aesthetic direction

**Theme:** ice, water, nature. Cold palette, translucent surfaces, organic motion, particle-based detail. Think glacier light, tide pools, frost growth, aurora over snow, ice skating tracks on a frozen pond.

**Anti-references:** neon purple/pink/fuchsia, kaleidoscopic Milkdrop preset density, EDM bass-drop visuals, anything that reads "rave" or "cyber."

**Palette:** deep ocean blue → glacier teal → frost white → silver. Accents in pale cyan, mint, rose-gold sunrise on snow. Saturation low to mid. Bloom yes, but "moonlit" not "blacklight."

The current `frontend-ui.jsx` design tokens (NEON_RV443) and `presets/index.js` neon hues are explicitly scrapped. The shell chrome, preset colors, and visual modules are all replaced.

## 3. AudioFrame — the integration contract

Every visual reads from this struct. Every audio module writes to this struct. No agent invents fields without amending this section first.

```ts
interface AudioFrame {
  // --- Existing FFT features (already implemented in src/audio/Features.js) ---
  rms: number;              // 0..1, perceptual loudness (smooth)
  centroid: number;         // 0..1, log-normalized spectral centroid
  flux: number;             // 0..1, half-wave rectified spectral flux (onset proxy)
  bands: { low: number; mid: number; high: number }; // 0..1 each
  fftMag: Float32Array;     // 1024 bins, raw magnitude (post-AnalyserNode)

  // --- Music-aware features (NEW, to be added) ---
  f0: number | null;        // Hz, monophonic pitch via pYIN; null when unvoiced
  f0Confidence: number;     // 0..1
  vibrato: {
    active: boolean;        // hysteresis-gated
    rateHz: number;         // 0..12, expected 4–8 Hz
    extentCents: number;    // peak-to-peak FM depth (strings, voice)
    amDepth: number;        // 0..1, AM depth (woodwind, brass)
  };
  harmonicEnergy: number;   // 0..1, harmonic mass (HPSS median filter)
  percussiveEnergy: number; // 0..1, breath/bow noise / attacks
}
```

Update rate: ~60 Hz (driven by `requestAnimationFrame`). FFT size 2048 at the device sample rate. Smoothing handled inside the audio module (exponential moving average, alpha tunable per feature).

## 4. The 3 v1 presets (replacing the current Neon Spectrum / Aurora Ribbons / Cyber Rosette)

Each preset is a Three.js scene module under `src/visuals/`. Each consumes the same `AudioFrame`; the difference is the visual treatment.

### 4a. **Glacier** (replaces Neon Spectrum)
A field of crystalline shards / icebergs in a dark teal sea.
- `f0` → which shard cluster glows (pitch-mapped vertical position)
- `f0` harmonics → secondary shards refract behind the primary
- `vibrato.active` → shards shimmer (subsurface scatter, animated normal map)
- `flux` → cracks propagate across the ice surface
- `harmonicEnergy` → shard translucency
- `percussiveEnergy` → frost particle bursts
- Palette: deep navy → ice teal → frost white. Rim-light only, no fill.

### 4b. **Tide** (replaces Aurora Ribbons)
A reflective water surface seen from low angle, with caustics underneath.
- `rms` → wave amplitude
- `centroid` → caustic density / refraction frequency
- `vibrato.rateHz` → standing-wave interference period
- `f0` → main current direction (vector field bias)
- `bands.low` → underwater fog density
- `bands.high` → spray/sparkle on wave crests
- Palette: midnight blue → moonlit cyan → silver foam. Specular highlights only.

### 4c. **Aurora** (replaces Cyber Rosette)
Borealis ribbons over a dark cold sky. The most "ButterChurn-like" of the three but kept elegant.
- `f0` → ribbon vertical position
- `vibrato.extentCents` → ribbon waver amplitude (wider for strings/voice)
- `vibrato.amDepth` → ribbon brightness modulation (woodwind/brass)
- `flux` → new ribbon spawned at attack
- `harmonicEnergy` → number of co-existing ribbons (chord-like layering proxy)
- Palette: navy sky → mint → pale rose → silver. Subtle star field background.

**Cross-preset shared elements:** moonlit fog volume, very subtle particle dust, no neon outlines, no kaleidoscopic mirroring.

## 5. v1 scope

In:
- Mic input + file upload (already wired in `src/App.jsx`)
- Existing FFT pipeline (`src/audio/Analyser.js`, `Features.js`) extended with f0 + vibrato + HPSS
- 3 new preset modules replacing `Bars.js` / `Rings.js`
- Dark-cold UI palette replacement (Controls / Transport / Landing / top bar — currently violet/fuchsia)
- WebM recording + export (`MediaRecorder`)
- Vercel-deployed live demo URL
- 30s recorder demo capture (laptop mic + phone camera, picture-in-picture)

Out (deferred to v2 or later):
- Polyphonic pitch tracking
- Embeddable widget API
- Mobile-optimized viewer beyond "doesn't crash"
- Custom preset builder
- Spectrogram scrub mode
- Save/load of control state

## 5b. Recommended libraries (so agents don't reinvent)

- **Pitch detection:** [`pitchy`](https://www.npmjs.com/package/pitchy) — McLeod Pitch Method, ESM, real-time-safe. Returns `[hz, clarity]`. Use this instead of porting pYIN from scratch. (`pitchfinder` is the fallback if `pitchy` isn't accurate enough on test recordings.)
- **HPSS:** No mature JS library; implement Fitzgerald's median-filter HPSS in plain TS. ~50 lines. Spec runs on a rolling spectrogram of N=21 frames; horizontal median → harmonic mask, vertical median → percussive mask.
- **Vibrato:** Build on top of `pitchy` output. Detect 4–8 Hz periodicity in the f0 time series via short-time autocorrelation or sliding FFT on the f0 trajectory. AM depth = peak-to-peak amplitude envelope variation at the same rate.
- **Three.js / postprocessing:** Already in `package.json`. `ShaderMaterial` for caustics / shards / aurora ribbons.

## 5c. Visual sources (open-source shaders to fork)

Lane B forks existing shaders rather than writing GLSL from scratch. Each preset has one canonical source. License attribution lands in the README's Acknowledgments section.

- **Glacier:** Shadertoy *Curious Crystal* (https://www.shadertoy.com/view/slccDX) — scattering media inside refractive substance, palette swapped to cold teal/frost.
- **Tide:** Evan Wallace's WebGL Water (https://madebyevan.com/webgl-water/, MIT) — caustics + ripple math, replace click-input with audio-driven ripple sources.
- **Aurora:** Shadertoy *Auroras* (https://www.shadertoy.com/view/XtGGRt) — already a flowing aurora; strip warm hues for the cool palette and add a star background.

Anti-reference (do NOT look like): ButterChurn live demo (https://butterchurnviz.com/) — kaleidoscopic Milkdrop preset density, hot saturated palette. Gliss is the opposite axis.

Shadertoy default license is CC BY-NC-SA 3.0; check each source's actual license tag before merging Lane B.

## 6. File ownership (Conductor lanes)

Each agent owns the listed files. Agents must NOT modify files outside their lane without flagging it.

### Lane A — Audio
Owns: `src/audio/Analyser.js`, `src/audio/AudioInput.js`, `src/audio/Features.js`, **new:** `src/audio/F0Track.js`, `src/audio/Vibrato.js`, `src/audio/HPSS.js`
- Implement pYIN-based monophonic f0 tracking (port or library — see SoundTouch/pitchy/aubio.js options)
- Vibrato detector: from `f0` time series, find 4–8 Hz periodicity; compute extent in cents and amplitude-modulation depth on the fundamental
- HPSS: Fitzgerald median-filter on a short rolling spectrogram → harmonic / percussive masks → energy sums
- Output an `AudioFrame` per requestAnimationFrame tick
- Must NOT touch any file under `src/visuals/`, `src/components/`, or `src/presets/`

### Lane B — Visuals
Owns: `src/visuals/Scene.js`, `src/visuals/Bloom.js`, **new:** `src/visuals/Glacier.js`, `src/visuals/Tide.js`, `src/visuals/Aurora.js`. **Delete:** `src/visuals/Bars.js`, `src/visuals/Rings.js`.
- Replace `Bars` + `Rings` with the 3 elemental preset modules
- Each module: shader-based where possible, Three.js mesh otherwise. Use custom `ShaderMaterial` for caustics / shards / ribbons.
- Update `Scene.js` to instantiate the active preset module instead of always-on Bars+Rings
- Consume `AudioFrame` (read-only). May stub `AudioFrame` during dev with hardcoded values.
- Must NOT touch any file under `src/audio/` or `src/components/`

### Lane C — UI / Theme
Owns: `src/components/Landing.jsx`, `src/components/Controls.jsx`, `src/components/Transport.jsx`, `src/components/Visualizer.jsx`, `src/index.css`, `src/App.jsx` (chrome only), `src/presets/index.js`, `tailwind.config.js`, `index.html` (title)
- Strip all violet/fuchsia/pink/cyber-neon styling
- New cold palette tokens, used consistently across Landing / Controls / Transport / top bar
- Rename brand from "Neon Visualizer" to **Gliss** (sheet-music abbreviation for *glissando*)
- Update preset selector to: Glacier / Tide / Aurora
- Add a small instrument-hint indicator (e.g. "vibrato detected: 5.2 Hz, ±35 cents") as a non-intrusive overlay
- Must NOT touch any file under `src/audio/` or `src/visuals/`

### Lane D — Export + Deploy
Owns: **new:** `src/export/Recorder.js`, **new:** `vercel.json` (if needed), `package.json` scripts (deploy)
- `MediaRecorder` against the live canvas, WebM output
- Hook into Transport bar's record button
- Optional: 60s max recording with countdown
- Vercel deployment config + `npm run build` verification
- Must NOT touch any file under `src/audio/` or `src/visuals/` or shared components

## 7. Definition of done (per lane)

- **A:** `AudioFrame` flows out at ~60 Hz with all fields populated and sane on test inputs (sine, recorder note with vibrato, breath puff). Unit-test the vibrato detector with a synthetic 5 Hz / 50-cent FM signal.
- **B:** All three presets render at >= 50 fps on M-series Mac. Switching presets is instant. No console errors over a 2-min mic session.
- **C:** Landing → Visualizer → Controls reads cold/elemental, no purple anywhere. Tailwind class audit shows zero `violet|fuchsia|pink` references.
- **D:** Recording produces a playable WebM. `npm run build` succeeds. Vercel preview deploy is reachable.

## 8. Integration order (NOT parallel merge)

1. Lane A merges first → establishes `AudioFrame` shape on main.
2. Lane B rebases onto merged A → swaps stub for real `AudioFrame`.
3. Lane C rebases onto merged B → palette + chrome on real visuals.
4. Lane D rebases onto merged C → records the final canvas.

If lanes finish out of order, the later ones rebase rather than merge in parallel. Conflicts are paid once, sequentially.
