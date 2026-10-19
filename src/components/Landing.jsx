import { useEffect, useRef } from 'react'

const LINE_GAP = 20
const GLISS_PERIOD = 7.5 // seconds per phantom glissando across the staff

// Phantom note path, u in 0..1 across the screen. Returns staff offset in
// line gaps (0 = middle line, negative = up) plus whether vibrato is on.
// Shape: settle low, slide up through the staff, hold with vibrato.
function phantomNote(u, t) {
  const slide = Math.min(1, Math.max(0, (u - 0.18) / 0.42))
  const eased = slide * slide * (3 - 2 * slide)
  let y = 2.6 - eased * 4.6
  const held = u > 0.62
  if (held) {
    const fade = Math.min(1, (u - 0.62) / 0.08)
    y += Math.sin(t * 2 * Math.PI * 5.5) * 0.35 * fade
  }
  return { y, held }
}

const Landing = ({ onStart }) => {
  const canvasRef = useRef(null)

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (file) onStart('file', file)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const pointer = { x: -1, y: 0, strength: 0, target: 0 }
    const trail = []
    let w = 0, h = 0, raf = 0, lastU = 0
    const start = performance.now()

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const onMove = (e) => {
      pointer.x = e.clientX
      pointer.y = e.clientY
      pointer.target = 1
    }
    const onLeave = () => { pointer.target = 0 }

    const draw = (now) => {
      const t = (now - start) / 1000
      const cy = h / 2
      ctx.clearRect(0, 0, w, h)

      // Lines fade in over the first second
      const intro = reduceMotion ? 1 : Math.min(1, t / 1.2)
      pointer.strength += (pointer.target - pointer.strength) * 0.06

      const u = reduceMotion ? -1 : (t % GLISS_PERIOD) / GLISS_PERIOD
      const note = phantomNote(u, t)
      const noteX = u * w
      const noteY = cy + note.y * LINE_GAP

      if (u >= 0) {
        if (u < lastU) trail.length = 0
        lastU = u
        trail.push({ x: noteX, y: noteY })
        if (trail.length > 1000) trail.shift()
      }

      for (let i = 0; i < 5; i++) {
        const baseY = cy + (i - 2) * LINE_GAP
        ctx.beginPath()
        for (let x = 0; x <= w; x += 6) {
          // Idle drift: two slow sines, out of phase per line
          let y = baseY
            + Math.sin(x * 0.004 + t * 0.35 + i * 0.9) * 1.6
            + Math.sin(x * 0.011 - t * 0.22 + i * 1.7) * 0.8

          if (u >= 0) {
            // The note pulls nearby lines toward it, like a bent string
            const dx = (x - noteX) / 90
            const pull = Math.exp(-dx * dx) * (noteY - baseY) * 0.18
            y += Math.max(-8, Math.min(8, pull))
            // Vibrato leaves a ripple trailing behind the held note
            if (note.held && x < noteX) {
              const behind = (noteX - x) / 260
              y += Math.sin((noteX - x) * 0.07 - t * 2 * Math.PI * 5.5)
                * 2.2 * Math.exp(-behind * behind)
            }
          }

          if (pointer.strength > 0.01) {
            const px = (x - pointer.x) / 140
            const bend = (pointer.y - baseY) * 0.12
            y += Math.exp(-px * px) * Math.max(-14, Math.min(14, bend)) * pointer.strength
          }

          if (x === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.strokeStyle = `rgba(232, 238, 245, ${0.09 * intro})`
        ctx.lineWidth = 1
        ctx.stroke()
      }

      // The glissando itself: one ink stroke drawn across the staff that
      // fades out as a whole near the end of each pass
      if (trail.length > 1) {
        const fade = Math.min(1, (1 - u) / 0.15)
        ctx.beginPath()
        ctx.moveTo(trail[0].x, trail[0].y)
        for (let k = 1; k < trail.length; k++) ctx.lineTo(trail[k].x, trail[k].y)
        ctx.strokeStyle = `rgba(142, 184, 201, ${0.45 * fade * intro})`
        ctx.lineWidth = 1.5
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.stroke()
      }

      if (!reduceMotion) raf = requestAnimationFrame(draw)
    }

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', onMove)
    document.addEventListener('pointerleave', onLeave)
    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return (
    <div className="relative w-full h-screen bg-bg-deep overflow-hidden flex items-center justify-center">
      {/* Staff: drifts idle, a phantom glissando slides across it, the cursor bends it */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 text-center px-6">
        <h1 className="text-[5rem] sm:text-[8rem] font-light tracking-tight text-text-primary leading-none lowercase">
          {'gliss'.split('').map((ch, i) => (
            <span key={i} className="landing-letter" style={{ animationDelay: `${0.15 + i * 0.07}s` }}>
              {ch}
            </span>
          ))}
          <span className="landing-letter text-accent-glacier" style={{ animationDelay: '0.65s' }}>.</span>
        </h1>

        <p className="landing-fade mt-8 text-text-muted text-base font-light italic" style={{ animationDelay: '0.9s' }}>
          an audio visualizer for woodwind, brass, strings, and voice.
        </p>

        <div className="landing-fade mt-14 flex items-center justify-center gap-6 text-sm" style={{ animationDelay: '1.1s' }}>
          <button
            onClick={() => onStart('mic')}
            className="text-text-primary hover:text-accent-glacier transition-colors duration-200 underline underline-offset-8 decoration-accent-glacier/40 hover:decoration-accent-glacier decoration-1"
          >
            use microphone
          </button>
          <span className="text-text-dim text-xs">/</span>
          <label className="cursor-pointer text-text-primary hover:text-accent-glacier transition-colors duration-200 underline underline-offset-8 decoration-accent-glacier/40 hover:decoration-accent-glacier decoration-1">
            upload a file
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        <p className="landing-fade mt-20 text-xs text-text-dim font-light tracking-wide" style={{ animationDelay: '1.3s' }}>
          best with monophonic instruments: recorder, flute, violin, voice.
        </p>
      </div>
    </div>
  )
}

export default Landing
