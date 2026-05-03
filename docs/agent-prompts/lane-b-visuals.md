# Lane B — Visuals (Conductor agent prompt)

You are Lane B in a 4-agent parallel build. Read `SPEC.md` at the repo root in full. The aesthetic direction is in §2; the 3 preset specs are in §4; the AudioFrame you consume is in §3.

## Your scope

Owns: `src/visuals/Scene.js`, `src/visuals/Bloom.js`, plus three new files: `src/visuals/Glacier.js`, `src/visuals/Tide.js`, `src/visuals/Aurora.js`.

Delete: `src/visuals/Bars.js`, `src/visuals/Rings.js`. (These are the "lame neon-purple bars" being replaced.)

Do NOT modify any file under `src/audio/` or `src/components/`. If you need to change `App.jsx` for preset wiring, surface that in your PR description for Lane C to integrate.

## What to build

Three preset modules, all consuming the same `AudioFrame` (read-only). During development, stub the AudioFrame with hardcoded values if Lane A hasn't merged yet — the contract is in `SPEC.md` §3.

1. **`Glacier.js`** — crystalline shards in a deep teal sea. Custom `ShaderMaterial` for the shards (subsurface scatter feel via fake rim lighting). Refs in `docs/refs/glacier-*`. f0 → shard cluster glow position; vibrato → shimmer; flux → propagating cracks; harmonicEnergy → translucency; percussiveEnergy → frost particle bursts.

2. **`Tide.js`** — reflective water surface, low angle. Caustic pattern via a tiled noise shader (Voronoi or worley). Refs in `docs/refs/tide-*`. rms → wave amplitude; centroid → caustic frequency; vibrato.rateHz → standing-wave period; bands.high → sparkle.

3. **`Aurora.js`** — flowing ribbons over dark sky. Vertex displacement + emissive gradient. Refs in `docs/refs/aurora-*`. f0 → ribbon Y position; vibrato.extentCents → waver amplitude; vibrato.amDepth → brightness modulation; flux → spawn new ribbon.

Each preset is a class with `constructor(scene, preset)`, `update(audioFrame, controls)`, `updatePreset(preset)`, `dispose()` — same shape as the existing `Bars.js` so `Scene.js` can swap them cleanly.

**`Scene.js`** changes:
- Replace the always-on `Bars` + `Rings` instances with one active preset module determined by `preset.style` (`'glacier' | 'tide' | 'aurora'`).
- `updatePreset` should dispose the current preset and instantiate the new one.
- Background: deep navy `#04060c`, NOT the current `#0a0a0f` (which is too warm).

## Constraints

- **Palette discipline**: zero violet/fuchsia/pink/amber. If a `setHSL` call drifts warm, that's a bug. Cool hues only: navy 220–230, teal 180–200, cyan 190, mint 150, silver 0% sat at 80% L.
- **Performance**: target ≥50 fps on M-series Mac. Shader work on the GPU; CPU per-frame cost should be <1 ms.
- **No kaleidoscope, no mirroring, no preset density a la ButterChurn.** Elegant > dense.

## Definition of done

- All three presets render against a stubbed AudioFrame (or a real one if Lane A has merged).
- Switching presets via `Scene.updatePreset()` is instant and leak-free (verify with Three.js memory profiler).
- No imports from `src/audio/` or `src/components/`.
- 2-minute mic session shows no console errors and no fps degradation.

PR title: `feat(visuals): elemental presets — Glacier, Tide, Aurora`. PR description should include a screenshot of each preset (use `npm run dev` + browser screenshot).
