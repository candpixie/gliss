# Tideglass

A music-aware audio visualizer for monophonic acoustic instruments — woodwind, brass, strings, voice. Sees pitch, vibrato, breath/bow attacks, and harmonic structure, not just spectral magnitude.

![Status](https://img.shields.io/badge/status-in%20development-7aa9bf)
![License](https://img.shields.io/badge/license-MIT-blue)

> Different from ButterChurn (not "better than"). Cold, organic, elemental — glacier light, tide pools, aurora over snow. No neon, no kaleidoscopic mirroring.

See [SPEC.md](./SPEC.md) for the full v1 integration contract.

---

## Overview

Tideglass captures audio (mic or file), runs an FFT plus music-aware feature extraction (monophonic pitch, vibrato, harmonic/percussive separation), and renders a synchronized cold-palette scene in WebGL. Built for live classical and instrumental performance.

The pipeline is built around a single per-frame **`AudioFrame`** struct so audio analysis and visual rendering can evolve independently.

---

## Features

- **Live mic input** — real-time Web Audio capture
- **File upload** — visualize any audio file
- **Music-aware features** — monophonic f0 (via `pitchy`), vibrato (rate + cents extent + AM depth), harmonic/percussive split (Fitzgerald HPSS)
- **Three v1 presets** — Glacier, Tide, Aurora (cold-elemental, no neon)
- **Adjustable controls** — sensitivity, bloom, trail length, particle density
- **Instrument-hint overlay** — non-intrusive readout of detected vibrato / pitch
- **Video export** — record and download as WebM *(in progress, Lane D)*

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | Vite + React 18 | Build tooling, UI |
| Audio | Web Audio API | Mic / file capture |
| DSP | `AnalyserNode` + custom JS | FFT, features, HPSS |
| Pitch | [`pitchy`](https://www.npmjs.com/package/pitchy) | McLeod Pitch Method, ESM, real-time-safe |
| Rendering | Three.js + `postprocessing` | WebGL, bloom |
| Export | `MediaRecorder` | Canvas → WebM |
| Styling | Tailwind CSS | UI components |

---

## AudioFrame — the integration contract

Every visual reads from this struct. Every audio module writes to this struct. New fields require a SPEC.md amendment.

```ts
interface AudioFrame {
  // Spectral features
  rms: number;              // 0..1, perceptual loudness (smooth)
  centroid: number;         // 0..1, log-normalized spectral centroid
  flux: number;             // 0..1, half-wave rectified spectral flux (onset proxy)
  bands: { low: number; mid: number; high: number };
  fftMag: Float32Array;     // 1024 bins, raw magnitude

  // Music-aware features
  f0: number | null;        // Hz, monophonic pitch via pitchy; null when unvoiced
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

Update rate ~60 Hz, driven by `requestAnimationFrame`. FFT size 2048 at the device sample rate.

---

## Presets

The v1 set is cold-elemental. Each preset is a Three.js scene module under `src/visuals/` that consumes the same `AudioFrame`.

### Glacier
A field of crystalline shards in a dark teal sea.
`f0` lights the active shard cluster · `vibrato.active` triggers shimmer · `flux` cracks the surface · `harmonicEnergy` controls translucency · `percussiveEnergy` releases frost particles. Palette: deep navy → ice teal → frost white.

### Tide
A reflective water surface with caustics underneath.
`rms` drives wave amplitude · `centroid` sets caustic density · `vibrato.rateHz` modulates standing-wave interference · `bands.high` adds spray on crests. Palette: midnight blue → moonlit cyan → silver foam.

### Aurora
Borealis ribbons over a dark cold sky.
`f0` sets ribbon height · `vibrato.extentCents` controls waver · `vibrato.amDepth` modulates brightness · `flux` spawns new ribbons · `harmonicEnergy` adds layered ribbons. Palette: navy → mint → pale rose → silver.

---

## Architecture

```
┌──────────────┐    ┌──────────────────┐    ┌──────────────────┐
│ Audio Input  │───▶│ FFT + Features   │───▶│ AudioFrame       │
│ (mic / file) │    │ + f0 + vibrato   │    │ (per-frame data) │
└──────────────┘    │ + HPSS           │    └────────┬─────────┘
                    └──────────────────┘             │
                                                     ▼
┌──────────────┐    ┌──────────────────┐    ┌──────────────────┐
│ WebM export  │◀───│ Three.js scene   │◀───│ Active preset    │
│ (Lane D)     │    │ + bloom          │    │ (Glacier/Tide/   │
└──────────────┘    └──────────────────┘    │  Aurora)         │
                                            └──────────────────┘
```

---

## Project Structure

```
fft-visualizer/
├── src/
│   ├── audio/
│   │   ├── AudioInput.js       # Mic / file source
│   │   ├── Analyser.js         # AnalyserNode wrapper
│   │   ├── Features.js         # RMS, centroid, flux, bands
│   │   ├── F0Track.js          # pitchy-based monophonic f0
│   │   ├── Vibrato.js          # 4–8 Hz rate, extent (cents), AM depth
│   │   ├── HPSS.js             # Fitzgerald median-filter HPSS
│   │   └── *.test.js           # node --test unit tests
│   ├── visuals/
│   │   ├── Scene.js            # Three.js scene + active-preset switch
│   │   ├── Bloom.js            # Post-processing
│   │   └── Glacier|Tide|Aurora # Cold-palette preset modules (Lane B)
│   ├── components/
│   │   ├── Landing.jsx         # Permission / source-select
│   │   ├── Visualizer.jsx      # Canvas host
│   │   ├── Controls.jsx        # Sliders + preset selector + hint overlay
│   │   └── Transport.jsx       # Record / export bar
│   ├── presets/index.js        # Preset metadata (Glacier / Tide / Aurora)
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── docs/
│   ├── agent-prompts/          # Per-lane Conductor agent prompts
│   └── screenshots/            # Before/after captures
├── SPEC.md                     # v1 integration contract
├── index.html
├── package.json
├── vite.config.js
└── tailwind.config.js
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Install & run

```bash
git clone https://github.com/candpixie/fft-visualizer.git
cd fft-visualizer
npm install
npm run dev
# open http://localhost:5173
```

### Build

```bash
npm run build       # output in /dist
npm run preview     # serve the production build locally
```

### Test (audio modules)

```bash
npm run test:audio  # node --test src/audio/*.test.js
```

---

## Configuration

### Audio
| Parameter | Default | Range | Notes |
|-----------|---------|-------|-------|
| Sample rate | 44100 | 44100 / 48000 | Device-dependent |
| FFT size | 2048 | 1024 / 2048 / 4096 | Higher = more resolution, more latency |
| Smoothing | 0.8 | 0–1 | `AnalyserNode` smoothing constant |
| f0 confidence gate | 0.85 | 0–1 | Below this, f0 reports `null` |

### Visual
| Parameter | Default | Range | Notes |
|-----------|---------|-------|-------|
| Bloom | 0.55 | 0–1 | Moonlit, not blacklight |
| Trail length | 0.5 | 0–1 | Afterimage persistence |
| Particle density | 0.6 | 0–1 | Frost / spray density |
| Sensitivity | 0.65 | 0–1 | Input gain multiplier |

---

## Conductor lanes

This repo is built in parallel via four Conductor lanes. Per-lane prompts live in [`docs/agent-prompts/`](./docs/agent-prompts) and the contract that keeps them honest is [SPEC.md](./SPEC.md).

| Lane | Owns | Status |
|------|------|--------|
| **A — Audio** | `src/audio/*` (f0, vibrato, HPSS, AudioFrame) | ✅ merged |
| **B — Visuals** | `src/visuals/*` (Glacier / Tide / Aurora) | 🚧 in progress |
| **C — UI / Theme** | `src/components/*`, `src/presets/index.js`, palette | ✅ cold-elemental theme shipped |
| **D — Export + Deploy** | `src/export/Recorder.js`, Vercel config | ⏳ pending |

Lanes merge sequentially (A → B → C → D), rebasing rather than parallel-merging when they finish out of order.

---

## Browser Support

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ Full | Recommended |
| Firefox | ✅ Full | |
| Safari | ⚠️ Partial | Requires user gesture for mic |
| Edge | ✅ Full | |
| Mobile Chrome | ✅ Full | |
| Mobile Safari | ⚠️ Partial | WebGL limitations |

---

## Roadmap

- [x] Cold-elemental UI theme + Tideglass rename (Lane C)
- [x] FFT, RMS, centroid, flux, band energies (Lane A)
- [x] Monophonic f0 via `pitchy` (Lane A)
- [x] Vibrato detection — rate, cents extent, AM depth (Lane A)
- [x] HPSS — harmonic / percussive energy split (Lane A)
- [x] Music-aware overlay (vibrato readout) (Lane C)
- [ ] Glacier / Tide / Aurora preset modules (Lane B)
- [ ] WebM recording + export (Lane D)
- [ ] Vercel live demo (Lane D)
- [ ] 30s recorder demo capture (laptop mic + phone PiP)

Out of scope for v1: polyphonic pitch, embeddable widget API, custom preset builder, spectrogram scrub, save/load of control state.

---

## Performance Notes

- Target 60fps on M-series Macs
- FFT runs on the audio thread; main thread only consumes `AudioFrame`
- HPSS rolling spectrogram is N=21 frames — keep that bound
- Reduce particle density on mobile if framerate drops

---

## License

MIT

---

## Acknowledgments

Built for live classical and instrumental performance. Inspired by Shadertoy "Frozen Lake" / "Curious Crystal" / "Auroras", Evan Wallace's WebGL Water, and the Codrops audio-reactive shader tutorial.
