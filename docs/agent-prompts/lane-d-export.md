# Lane D — Export + Deploy (Conductor agent prompt)

You are Lane D in a 4-agent parallel build. Read `SPEC.md` at the repo root in full. Scope in §6.

## Your scope

Owns: a new file `src/export/Recorder.js`, plus `vercel.json` (only if needed), and the `package.json` scripts section (additive).

Do NOT modify `src/audio/`, `src/visuals/`, or any component files. The Transport bar's record button hookup is the one allowed component-side line — flag it in your PR description and let Lane C land first if there's contention.

## What to build

1. **`src/export/Recorder.js`**:
   - Exports a `Recorder` class wrapping `MediaRecorder` against the WebGL canvas (`canvas.captureStream(60)` for 60fps).
   - Methods: `start()`, `stop()` returns `Promise<Blob>`, `download(filename)`.
   - Audio track: include the AnalyserNode's source via `ctx.createMediaStreamDestination()` if mic, or the AudioBufferSource if file. Lane A may already wire this — check existing `App.jsx`.
   - Output: `video/webm; codecs=vp9` if supported, else `vp8`.
   - Max recording time 90 seconds (prevent runaway). Show a small countdown via a callback.

2. **Transport bar wiring**:
   - The `Transport` component already has an export button. Wire it to a Recorder instance.
   - State: idle | recording | encoding | ready-to-download.
   - Toast on completion: "Recording saved" with the auto-download.

3. **Build + deploy**:
   - Verify `npm run build` produces a clean `dist/`.
   - If not already present, add `vercel.json` with `{ "framework": "vite" }`.
   - Document a 1-line deploy command in `package.json` scripts: `"deploy": "vercel --prod"`.

## Constraints

- No new heavy dependencies. `MediaRecorder` is native; do not pull in ffmpeg.wasm.
- The recording must include audio AND the canvas video, in sync. Test with a 10-second clip of you humming.
- File size: typical 30s clip should be under 20 MB at 1080p.

## Definition of done

- Hit record, play 10 seconds, hit stop → browser auto-downloads a playable WebM with both audio and synced visuals.
- `npm run build` exits 0.
- `vercel.json` (or framework auto-detection) lets `vercel --prod` succeed without prompts.
- No imports from `src/audio/` internals or `src/visuals/` internals — only the public canvas and audio context references.

PR title: `feat(export): WebM recording + Vercel deploy config`. PR description should link to a recorded clip uploaded to a gist or similar.
