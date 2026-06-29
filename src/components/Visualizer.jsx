import { useEffect, useRef, useState } from 'react'
import { Scene } from '../visuals/Scene'
import { extractFeatures } from '../audio/Features'
import { midiFromHz, midiToName, tunerReading } from '../audio/pitchMath'
import PracticePanel from './PracticePanel'

const TRACE_WINDOW_MS = 5000
const TRACE_SAMPLE_INTERVAL_MS = 50   // ~20 Hz pitch trace samples
const READOUT_INTERVAL_MS = 100       // ~10 Hz React updates
const HOLD_TOLERANCE_CENTS = 20
const SILENCE_DROP_ANCHOR_MS = 600    // drop anchor after this much continuous silence

function makeAnchor(hz) {
  const midi = midiFromHz(hz)
  return {
    hz,                 // actual user pitch — what we measure hold against
    midi,
    name: midiToName(midi),
  }
}

const Visualizer = ({ analyser, preset, controls }) => {
  const canvasRef = useRef(null)
  const sceneRef = useRef(null)
  const animationFrameRef = useRef(null)

  const traceRef = useRef([])           // [{ t, hz }] — last 5s of f0 samples
  const anchorRef = useRef(null)        // { hz, midi, name } or null
  const holdMsRef = useRef(0)
  const silenceMsRef = useRef(0)
  const lastFrameTimeRef = useRef(0)
  const lastTraceSampleRef = useRef(0)
  const lastReadoutRef = useRef(0)

  const [telemetry, setTelemetry] = useState(null)

  useEffect(() => {
    if (!canvasRef.current || !analyser) return

    const canvas = canvasRef.current

    const initScene = () => {
      const rect = canvas.getBoundingClientRect()
      const width = rect.width || window.innerWidth
      const height = rect.height || window.innerHeight

      canvas.width = width
      canvas.height = height

      try {
        const scene = new Scene(canvas, preset, controls)
        sceneRef.current = scene

        const frequencyData = new Float32Array(analyser.frequencyBinCount)
        const timeData = new Float32Array(analyser.fftSize)

        // Real hardware sample rate (commonly 48 kHz on macOS), not the 44.1 kHz
        // default — pitchy needs the true rate or every note reads ~147¢ flat.
        const sampleRate = analyser.context.sampleRate

        const animate = () => {
          if (!analyser || !sceneRef.current) return

          analyser.getFloatFrequencyData(frequencyData)
          analyser.getFloatTimeDomainData(timeData)

          const features = extractFeatures(frequencyData, timeData, sampleRate)
          sceneRef.current.update(features, controls)

          const now = performance.now()
          const dt = lastFrameTimeRef.current ? now - lastFrameTimeRef.current : 0
          lastFrameTimeRef.current = now

          const f0 = features?.f0 ?? null

          // -- Anchor + hold tracking ---------------------------------------
          if (f0 != null) {
            silenceMsRef.current = 0
            if (!anchorRef.current) {
              anchorRef.current = makeAnchor(f0)
              holdMsRef.current = 0
            } else {
              const cents = 1200 * Math.log2(f0 / anchorRef.current.hz)
              if (Math.abs(cents) <= HOLD_TOLERANCE_CENTS) {
                holdMsRef.current += dt
              } else {
                anchorRef.current = makeAnchor(f0)
                holdMsRef.current = 0
              }
            }
          } else {
            silenceMsRef.current += dt
            holdMsRef.current = 0
            if (silenceMsRef.current > SILENCE_DROP_ANCHOR_MS) {
              anchorRef.current = null
            }
          }

          // -- Pitch trace ring buffer --------------------------------------
          if (now - lastTraceSampleRef.current > TRACE_SAMPLE_INTERVAL_MS) {
            lastTraceSampleRef.current = now
            if (f0 != null) traceRef.current.push({ t: now, hz: f0 })
            const cutoff = now - TRACE_WINDOW_MS
            while (traceRef.current.length && traceRef.current[0].t < cutoff) {
              traceRef.current.shift()
            }
          }

          // -- Throttled React update ---------------------------------------
          if (now - lastReadoutRef.current > READOUT_INTERVAL_MS) {
            lastReadoutRef.current = now
            const anchor = anchorRef.current
            if (anchor) {
              const cents = f0 != null
                ? 1200 * Math.log2(f0 / anchor.hz)
                : null
              const vib = features?.vibrato
              const trace = traceRef.current.map(p => ({
                ageMs: now - p.t,
                cents: 1200 * Math.log2(p.hz / anchor.hz),
              }))
              setTelemetry({
                anchor,
                f0,
                cents,
                tuner: f0 != null ? tunerReading(f0) : null,
                vibrato: vib?.active
                  ? { rateHz: vib.rateHz, extentCents: vib.extentCents }
                  : null,
                holdMs: holdMsRef.current,
                trace,
              })
            } else {
              setTelemetry(null)
            }
          }

          animationFrameRef.current = requestAnimationFrame(animate)
        }

        animate()
      } catch (error) {
        console.error('Error initializing scene:', error)
      }
    }

    requestAnimationFrame(initScene)

    const handleResize = () => {
      if (canvas && sceneRef.current) {
        const rect = canvas.getBoundingClientRect()
        const width = rect.width || window.innerWidth
        const height = rect.height || window.innerHeight
        canvas.width = width
        canvas.height = height
        sceneRef.current.resize(width, height)
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      window.removeEventListener('resize', handleResize)
      if (sceneRef.current) {
        sceneRef.current.dispose()
      }
      traceRef.current = []
      anchorRef.current = null
      holdMsRef.current = 0
      silenceMsRef.current = 0
    }
  }, [analyser, preset])

  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.updateControls(controls)
      sceneRef.current.updatePreset(preset)
    }
  }, [controls, preset])

  return (
    <>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ display: 'block' }}
      />
      <PracticePanel telemetry={telemetry} />
    </>
  )
}

export default Visualizer
