# Gliss

A browser music visualizer for acoustic instruments. Tracks pitch and vibrato, knows the difference between a sustained note and a breath attack.

## What it does

- Mic input or uploaded audio file
- Real-time monophonic pitch tracking (pYIN, via [pitchy](https://www.npmjs.com/package/pitchy))
- Vibrato detection for both kinds: frequency-modulated (strings, voice) and amplitude-modulated (winds, brass)
- Harmonic vs percussive split (Fitzgerald median-filter HPSS), so breath attacks read differently from sustained tone
- Three elemental visual presets: Glacier, Tide, Aurora
- Records the canvas and audio to WebM

## vs. ButterChurn

ButterChurn descends from Milkdrop, the late-90s Winamp plugin. It looks great with EDM bass drops and synth pads. On a sustained recorder note or a violin tremolo it tends to fall flat, because it can't tell "vibrato at 5 Hz" apart from "loud part of the song."

Gliss is built for acoustic instruments: woodwind, brass, strings, voice. It knows what a held note is, what a vibrato is, what an attack is. The visuals respond to that, not just to amplitude.

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

## License

MIT.
