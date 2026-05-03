# Lane C — UI / Theme (Conductor agent prompt)

You are Lane C in a 4-agent parallel build. Read `SPEC.md` at the repo root in full. Aesthetic in §2.

## Your scope

Owns: `src/components/Landing.jsx`, `src/components/Controls.jsx`, `src/components/Transport.jsx`, `src/components/Visualizer.jsx`, `src/index.css`, `src/App.jsx` (chrome only — top bar, panels, no audio/visual logic), `src/presets/index.js`, `tailwind.config.js`, `index.html` (title only).

Do NOT touch `src/audio/` or `src/visuals/`.

## What to do

1. **Strip the neon-purple cyber theme.** Audit every Tailwind class for `violet`, `fuchsia`, `pink`, `amber`, `cyber`. Replace with cold-elemental tokens. The `frontend-ui.jsx` design-tokens file is for reference only and being scrapped — do not propagate its palette.

2. **New palette tokens** (in `tailwind.config.js`):
   - `bg.deep`: `#04060c` (matches new Scene background)
   - `bg.surface`: `rgba(255,255,255,0.04)`
   - `bg.surfaceHover`: `rgba(255,255,255,0.08)`
   - `accent.glacier`: `#8eb8c9` (frost-blue)
   - `accent.tide`: `#5db5b9` (glacier-teal)
   - `accent.aurora`: `#c8d9b4` (mint-pale-green)
   - `text.primary`: `#e8eef5`, `text.muted`: `#8a99ab`, `text.dim`: `#5a6878`
   - Border default: `rgba(255,255,255,0.06)`, focus ring: `rgba(142,184,201,0.4)`

3. **Brand rename.** "Neon Visualizer" / "RV443" / "NEON RV443" → all gone. Placeholder name: **Gliss**. Update top bar, `<title>`, Landing copy.

4. **Preset selector** options renamed: Glacier / Tide / Aurora. Update `src/presets/index.js` to match (preserve the `getPreset(name)` and `getPresetNames()` exports — Lane B depends on the shape).

5. **New: instrument-hint overlay.** Bottom-left of the canvas, semi-transparent. Shows live readout when `audioFrame.f0` is non-null:
   ```
   ♪ A4 (440 Hz) · vibrato 5.2 Hz, ±35 ¢
   ```
   When unvoiced or vibrato.active=false, fade out gracefully. Use the `text.muted` color, monospace font, small (12px), bottom-left padding 24px. This is a v1 differentiator — most visualizers don't show their understanding of the music.

6. **Landing screen rewrite.** Current copy is generic. New copy along the lines of:
   - Title: *Gliss*
   - Subtitle: "An audio visualizer that listens like a musician."
   - Two big buttons: "Use microphone" / "Upload a file"
   - Below: a one-line note "Best with monophonic instruments — recorder, flute, violin, voice."

7. **Controls panel cleanup.** Drop `pitchToColor` (auto-on now), keep sensitivity/smoothing/bloom/trailLength/particleDensity/onsetRings. Add a section header "Music-aware" above a single toggle "Vibrato response" (default on).

## Constraints

- Zero `violet|fuchsia|pink|amber` in the diff. Grep for them before opening the PR.
- Type system stays JS; do not introduce TS.
- Keep accessibility: focus rings visible, contrast ≥ 4.5:1 on all text.

## Definition of done

- `grep -rE '(violet|fuchsia|pink|amber)' src/` returns zero matches in your changed files.
- Landing → click mic → grants permission → see Visualizer with instrument-hint overlay reading correctly when you play a sustained note.
- All three preset names appear in the selector and work end-to-end (relies on Lane B for the actual visuals).
- No imports from `src/audio/` other than the existing AnalyserNode wiring already in `App.jsx` (do not refactor the audio plumbing).

PR title: `feat(ui): cold-elemental theme, Gliss rename, music-aware overlay`. Include a before/after screenshot of the Landing screen.
