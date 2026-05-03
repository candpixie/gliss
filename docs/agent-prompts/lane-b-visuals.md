# Lane B — Visuals (Conductor agent prompt)

You are Lane B in the parallel build. Read `SPEC.md` at the repo root in full first. The aesthetic direction is in §2; the 3 preset specs are in §4; the AudioFrame you consume is in §3.

The general approach for Lane B is **fork existing open-source shaders and audio-react them**, not write GLSL from scratch. ButterChurn itself is a fork of Milkdrop; this is the standard play in browser-visualization. Each preset below has a concrete source you adapt, port to Three.js `ShaderMaterial`, and wire to `AudioFrame` fields.

## Your scope

Owns: `src/visuals/Scene.js`, `src/visuals/Bloom.js`, plus three new files: `src/visuals/Glacier.js`, `src/visuals/Tide.js`, `src/visuals/Aurora.js`.

Delete: `src/visuals/Bars.js`, `src/visuals/Rings.js` (the lame neon-purple bars being replaced).

Do NOT modify any file under `src/audio/` or `src/components/`. If `App.jsx` needs a preset-wiring change, surface it in the PR description.

## Per-preset shader source + AudioFrame uniform mapping

Each preset module exposes the same class shape (`constructor(scene, preset)`, `update(audioFrame, controls)`, `updatePreset(preset)`, `dispose()`) so `Scene.js` can swap them.

### Glacier — `src/visuals/Glacier.js`

**Source shader to fork:** Shadertoy *Curious Crystal* — https://www.shadertoy.com/view/slccDX

It already does scattering media inside a refractive substance, which is close to the "crystalline shards in a dark teal sea" target. Read the GLSL, port the fragment shader into a `THREE.ShaderMaterial`, replace its constants with uniforms.

Uniform wiring:
| Shader uniform | AudioFrame field | Mapping |
|---|---|---|
| `uHighlightAxis` (vec3) | `f0` | log-mapped to a vertical highlight position; null f0 → soft idle |
| `uShimmer` (float, 0..1) | `vibrato.active ? vibrato.amDepth + extentCents/100 : 0` | refractive-index wobble at `vibrato.rateHz` |
| `uCrack` (float, 0..1, decaying) | `flux` | spike on attack, ease-out over ~400ms |
| `uTranslucency` (float, 0..1) | `harmonicEnergy` | smoothed |
| `uParticleBurst` (float, 0..1, decaying) | `percussiveEnergy` | drives a small particle system layered over the shader |
| `uTime` (float) | clock | seconds elapsed |

Palette override the source's colors: deep navy `#04060c` → ice teal `#5db5b9` → frost white `#e8eef5`. Rim-light only, no warm fill.

### Tide — `src/visuals/Tide.js`

**Source code to fork:** Evan Wallace's WebGL Water — https://madebyevan.com/webgl-water/ (source viewable from the page; mirrored at https://github.com/evanw/webgl-water if available, otherwise scrape from the demo). MIT-licensed.

Use his caustics + ripple math; replace the manual click-to-ripple input with audio-driven ripple sources.

Uniform wiring:
| Shader uniform | AudioFrame field | Mapping |
|---|---|---|
| `uWaveAmp` (float) | `rms` | scaled vertex displacement |
| `uCausticDensity` (float) | `centroid` | log-mapped |
| `uStandingWavePeriod` (float) | `vibrato.rateHz` (when active) | controls a sinusoidal interference pattern |
| `uCurrentDirection` (vec2) | `f0` | log-mapped to a 2D vector field bias |
| `uFogDensity` (float) | `bands.low` | smoothed |
| `uSparkle` (float) | `bands.high` | drives crest sparkle particle density |

Palette: midnight blue → moonlit cyan `#5db5b9` → silver `#c8d9b4`. Specular highlights only. Camera at low angle on the surface.

### Aurora — `src/visuals/Aurora.js`

**Source shader to fork:** Shadertoy *Auroras* — https://www.shadertoy.com/view/XtGGRt

Already a flowing aurora over a starfield. Strip the warm reds/yellows for the cool palette. Add a star background layer (cheap point cloud or screen-space noise).

Uniform wiring:
| Shader uniform | AudioFrame field | Mapping |
|---|---|---|
| `uBandY` (float) | `f0` | log-mapped vertical position |
| `uWaverAmp` (float) | `vibrato.extentCents` | wider for strings/voice |
| `uBrightnessAM` (float) | `vibrato.amDepth` | woodwind/brass shimmer |
| `uRibbonSpawn` (float, 0..1, decaying) | `flux` | new ribbon at attack |
| `uRibbonCount` (float, integer-ish) | `harmonicEnergy` | how many concurrent ribbons |
| `uTime` (float) | clock | seconds elapsed |

Palette override: navy sky `#04060c` → mint `#c8d9b4` → pale rose `#f0d9d4` (use sparingly) → silver. Subtle star field background.

## Scene.js changes

Replace the always-on `Bars` + `Rings` instances with one active preset module determined by `preset.style` (`'glacier' | 'tide' | 'aurora'`). `updatePreset` disposes the current preset and instantiates the new one. Background: `#04060c` (not the current `#0a0a0f`, which is too warm).

## Constraints

- **Palette discipline:** zero violet/fuchsia/pink/amber. Audit your fragment shaders before opening the PR.
- **Performance:** target ≥50 fps on M-series Mac. Shader work on the GPU. CPU per-frame should be <1 ms.
- **No kaleidoscope, no mirroring, no Milkdrop preset density.** Elegant > dense.
- **Licensing:** the Shadertoy default license is CC BY-NC-SA 3.0; Evan Wallace's water demo is MIT. Read each source's license. Attribution must land in the README under a new "Acknowledgments" section listing each source author + URL + license. If the source is NC and we plan to charge for Gliss someday, flag it in the PR description; for now we're MIT-noncommercial-friendly.

## Definition of done

- All three presets render with a real `AudioFrame` (Lane A is on main; pull and use it, don't stub).
- Switching presets via `Scene.updatePreset()` is instant and leak-free.
- No imports from `src/audio/` or `src/components/`.
- 2-minute mic session: no console errors, no fps degradation.
- README updated with an "Acknowledgments" section listing each forked source, its author, URL, and license.
- Take screenshots of all three presets running on real audio (sustained tone with vibrato) and include them in the PR.

PR title: `feat(visuals): elemental presets — Glacier, Tide, Aurora`. PR description must include the three screenshots and the per-source license confirmation.
