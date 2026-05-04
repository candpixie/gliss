# Gliss

A browser music visualizer for acoustic instruments. For illustrating the transitions between pitch and vibrato and the difference between a sustained note and a breath attack.

## Functions

- Mic input or uploaded audio file (.wav and .mp3 supported)
- Real-time monophonic pitch tracking (pYIN, via [pitchy](https://www.npmjs.com/package/pitchy))
- Vibrato detection for both kinds: frequency-modulated (strings, voice) and amplitude-modulated (winds, brass)
- Harmonic vs percussive split (Fitzgerald median-filter HPSS), so breath attacks read differently from sustained tone
- Three elemental visual presets: Glacier, Tide, Aurora 
- Records the canvas and audio to WebM

## vs. ButterChurn

ButterChurn descends from Milkdrop, the late-90s Winamp plugin. It looks great with EDM bass drops and synth pads. On a sustained recorder note or a violin tremolo it tends to fall flat, because it can't tell "vibrato at 5 Hz" apart from "loud part of the song."

Gliss is built for acoustic instruments: woodwind, brass, strings, voice. It knows what a held note is, what a vibrato is, what an attack of the note is. The visuals respond to that, not just to amplitude. Gliss is inspired by the word *Glissando*.

## Tech

Vite + React for the shell. Three.js for rendering. Web Audio API for analysis. pitchy for pitch detection. No backend.

## Run it

```
npm install
npm run dev
```

Open the URL Vite prints, allow mic, play.

## Status

Active development. v1 ships the three presets with mic input, file upload, and a 30-second WebM export. Polyphonic tracking and an embeddable widget are on the roadmap, not in v1.

## Acknowledgments

The three v1 visual presets are forks of open-source shaders. Each was ported to a Three.js `ShaderMaterial`, recolored to the cold palette, and rewired to read from the `AudioFrame` integration contract. Original authors below.

| Preset  | Source                                                                 | Author        | License           |
| ------- | ---------------------------------------------------------------------- | ------------- | ----------------- |
| Glacier | [Curious Crystal](https://www.shadertoy.com/view/slccDX)               | mrange        | CC BY-NC-SA 3.0   |
| Tide    | [WebGL Water](https://madebyevan.com/webgl-water/) ([source](https://github.com/evanw/webgl-water)) | Evan Wallace  | MIT               |
| Aurora  | [Auroras](https://www.shadertoy.com/view/XtGGRt)                       | nimitz        | CC BY-NC-SA 3.0   |

Two of the three sources are CC BY-NC-SA 3.0 (Shadertoy default). Gliss is non-commercial today; if commercial use is added later, those two presets need replacement or relicensing.

## License

MIT (Gliss code). Forked shader sources retain their original licenses listed above.
