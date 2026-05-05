import { useEffect, useRef, useState } from 'react'
import { Scene } from '../visuals/Scene'
import { extractFeatures } from '../audio/Features'

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

function hzToNoteName(hz) {
  if (!hz || hz <= 0) return null
  const midi = Math.round(69 + 12 * Math.log2(hz / 440))
  if (midi < 0 || midi > 127) return null
  const name = NOTE_NAMES[midi % 12]
  const octave = Math.floor(midi / 12) - 1
  return `${name}${octave}`
}

const Visualizer = ({ analyser, preset, controls, pointerRef }) => {
  const canvasRef = useRef(null)
  const sceneRef = useRef(null)
  const animationFrameRef = useRef(null)
  const lastHintUpdateRef = useRef(0)
  const [hint, setHint] = useState(null) // { note, hz, vibratoRate, vibratoExtent } | null

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

        const animate = () => {
          if (!analyser || !sceneRef.current) return

          analyser.getFloatFrequencyData(frequencyData)
          analyser.getFloatTimeDomainData(timeData)

          const features = extractFeatures(frequencyData, timeData)
          if (pointerRef?.current) {
            sceneRef.current.setPointer(pointerRef.current)
          }
          sceneRef.current.update(features, controls)

          // Throttle hint updates to ~10 Hz so React doesn't re-render at 60 fps.
          const now = performance.now()
          if (now - lastHintUpdateRef.current > 100) {
            lastHintUpdateRef.current = now
            const f0 = features?.f0 ?? null
            const note = hzToNoteName(f0)
            if (note) {
              const vib = features?.vibrato
              setHint({
                note,
                hz: f0,
                vibratoRate: vib?.active ? vib.rateHz : null,
                vibratoExtent: vib?.active ? vib.extentCents : null,
              })
            } else {
              setHint(null)
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
      <InstrumentHint hint={hint} />
    </>
  )
}

const InstrumentHint = ({ hint }) => {
  return (
    <div
      aria-live="polite"
      className={`pointer-events-none absolute bottom-[88px] left-6 z-30
        font-mono text-[12px] text-text-muted tracking-wide
        transition-opacity duration-500
        ${hint ? 'opacity-100' : 'opacity-0'}`}
    >
      {hint && (
        <span>
          <span aria-hidden="true">♪ </span>
          {hint.note} ({Math.round(hint.hz)} Hz)
          {hint.vibratoRate != null && (
            <>
              {' · vibrato '}
              {hint.vibratoRate.toFixed(1)} Hz, ±{Math.round(hint.vibratoExtent)} ¢
            </>
          )}
        </span>
      )}
    </div>
  )
}

export default Visualizer
