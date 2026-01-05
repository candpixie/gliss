# FFT-Visualizer

Real-time audio visualizer that turns live performance into neon visuals.

![NEON RV443](https://img.shields.io/badge/status-in%20development-violet)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## Overview

FFT-Visualizer captures audio (mic or file), analyzes it using Fast Fourier Transform, and renders synchronized neon visuals in real-time. Built for musical performance — optimized for recorder/classical instruments but works with any audio source.

**No backend. No accounts. Runs entirely in your browser.**

---

## Features

- 🎤 **Live mic input** — real-time audio capture
- 📁 **File upload** — visualize any audio file
- 🎨 **Preset themes** — Neon Spectrum, Aurora Ribbons, Cyber Rosette
- 🎛️ **Adjustable controls** — sensitivity, bloom, trail length, particle density
- 🎬 **Video export** — record and download as WebM
- 📱 **Mobile support** — responsive viewer mode

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | Vite + React | Build tooling, UI |
| Audio | Web Audio API | Mic/file capture |
| DSP | AnalyserNode | FFT, frequency analysis |
| Rendering | Three.js + postprocessing | WebGL, bloom effects |
| Export | MediaRecorder API | Canvas → WebM |
| Styling | Tailwind CSS | UI components |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER (Client-side)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐  │
│  │ Audio Input  │───▶│ DSP Layer    │───▶│ Feature Vector   │  │
│  │ (Mic/File)   │    │ (FFT)        │    │ {rms, centroid,  │  │
│  └──────────────┘    └──────────────┘    │  flux, bands}    │  │
│                                          └────────┬─────────┘  │
│                                                   │             │
│                                                   ▼             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐  │
│  │ Video Export │◀───│ Render Layer │◀───│ Mapping Layer    │  │
│  │ (WebM)       │    │ (Three.js)   │    │ (Art Direction)  │  │
│  └──────────────┘    └──────────────┘    └──────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Audio Pipeline

### 1. Input Layer
```javascript
// Web Audio API captures PCM samples
navigator.mediaDevices.getUserMedia({ audio: true })
// Output: Float32Array @ 44.1kHz/48kHz
```

### 2. Analysis Layer
```javascript
// FFT converts time domain → frequency domain
analyser.fftSize = 2048;
analyser.getFloatFrequencyData(frequencyData);
// Output: 1024 frequency bins (magnitude in dB)
```

### 3. Feature Extraction
| Feature | Formula | Visual Mapping |
|---------|---------|----------------|
| RMS | `sqrt(mean(samples²))` | Global brightness, bloom |
| Spectral Centroid | `Σ(freq × mag) / Σ(mag)` | Hue shift (warm↔cool) |
| Spectral Flux | `Σ(max(0, mag - prevMag))` | Pulse rings, onsets |
| Band Energy | Sum magnitudes per range | Layer intensity (low/mid/high) |

### 4. Smoothing
```javascript
// Exponential moving average prevents jitter
smoothed = alpha * current + (1 - alpha) * previous;
// alpha: 0.2–0.4 for visuals
```

---

## Visual Mapping

| Audio Feature | Visual Effect |
|---------------|---------------|
| RMS (loudness) | Bloom strength, global brightness |
| Spectral flux | Ring bursts on note attacks |
| Centroid | Color temperature (bright tone → warm) |
| Low band | Background fog intensity |
| Mid band | Ribbon/wave amplitude |
| High band | Sparkle particles |

---

## Project Structure

```
FFT-visualizer/
├── src/
│   ├── components/
│   │   ├── Landing.jsx        # Permission screen
│   │   ├── Visualizer.jsx     # Main canvas
│   │   ├── Controls.jsx       # Right panel sliders
│   │   └── Transport.jsx      # Record/export bar
│   ├── audio/
│   │   ├── AudioInput.js      # Mic/file handling
│   │   ├── Analyser.js        # FFT wrapper
│   │   └── Features.js        # RMS, centroid, flux
│   ├── visuals/
│   │   ├── Scene.js           # Three.js setup
│   │   ├── Bars.js            # Spectrum bars
│   │   ├── Rings.js           # Onset pulses
│   │   └── Bloom.js           # Post-processing
│   ├── presets/
│   │   └── index.js           # Neon Spectrum, Aurora, etc.
│   ├── App.jsx
│   └── main.jsx
├── public/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone
git clone https://github.com/yourusername/FFT-visualizer.git
cd FFT-visualizer

# Install dependencies
npm install

# Run dev server
npm run dev

# Open http://localhost:5173
```

### Build for Production

```bash
npm run build
# Output in /dist
```

### Deploy to Vercel

```bash
npm install -g vercel
vercel
# Get public URL
```

---

## Configuration

### Audio Settings
| Parameter | Default | Range | Notes |
|-----------|---------|-------|-------|
| Sample Rate | 44100 | 44100/48000 | Device-dependent |
| FFT Size | 2048 | 1024/2048/4096 | Higher = more resolution, more latency |
| Smoothing | 0.8 | 0–1 | AnalyserNode smoothing constant |

### Visual Settings
| Parameter | Default | Range | Notes |
|-----------|---------|-------|-------|
| Bloom | 0.75 | 0–1 | Post-processing intensity |
| Trail Length | 0.5 | 0–1 | Afterimage persistence |
| Particle Density | 0.6 | 0–1 | High-freq sparkles |
| Sensitivity | 0.65 | 0–1 | Input gain multiplier |

---

## Presets

### Neon Spectrum
Classic frequency bars with bloom glow.

### Aurora Ribbons  
Flowing ribbons controlled by spectral centroid.

### Cyber Rosette
Radial visualization with onset-triggered rings.

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

- [x] UI design
- [ ] Audio input (mic/file)
- [ ] FFT analysis
- [ ] Basic spectrum bars
- [ ] Bloom post-processing
- [ ] Feature extraction (RMS, centroid, flux)
- [ ] Preset system
- [ ] Video export
- [ ] Mobile viewer mode

---

## Performance Notes

- Target 60fps on modern hardware
- FFT runs on audio thread (no main thread blocking)
- Use `requestAnimationFrame` for render loop
- Reduce resolution on mobile if needed

---

## License

MIT

---

## Acknowledgments

- Inspired by RV 443 (Vivaldi's Recorder Concerto in C Major)
- Built for live classical performance visualization
