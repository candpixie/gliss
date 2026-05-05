import { useState, useCallback, useRef, useEffect } from 'react'
import Landing from './components/Landing'
import Visualizer from './components/Visualizer'
import Controls from './components/Controls'
import Transport from './components/Transport'
import { getPresetNames } from './presets'

function App() {
  const [audioContext, setAudioContext] = useState(null)
  const [audioSource, setAudioSource] = useState(null)
  const [analyser, setAnalyser] = useState(null)
  const [isActive, setIsActive] = useState(false)
  const [inputMode, setInputMode] = useState('mic') // 'mic' | 'file'
  const [preset, setPreset] = useState('Glacier')
  const pointerRef = useRef({
    mouse: { x: 0.5, y: 0.5 },
    click: { x: 0.5, y: 0.5, serial: 0 },
  })
  const [controls, setControls] = useState({
    sensitivity: 0.65,
    smoothing: 0.4,
    bloom: 0.55,
    trailLength: 0.5,
    particleDensity: 0.6,
    onsetRings: true,
    vibratoResponse: true,
  })

  const handleStart = useCallback(async (mode, file = null) => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext
      const ctx = new AudioContextClass()

      const analyserNode = ctx.createAnalyser()
      analyserNode.fftSize = 2048
      analyserNode.smoothingTimeConstant = 0.8

      let source
      if (mode === 'mic') {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        source = ctx.createMediaStreamSource(stream)
        source.connect(analyserNode)
      } else if (mode === 'file' && file) {
        const arrayBuffer = await file.arrayBuffer()
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer)
        source = ctx.createBufferSource()
        source.buffer = audioBuffer
        source.loop = true
        source.connect(analyserNode)
        source.connect(ctx.destination)
        source.start(0)
      } else {
        return
      }

      setAudioContext(ctx)
      setAudioSource(source)
      setAnalyser(analyserNode)
      setInputMode(mode)
      setIsActive(true)
    } catch (error) {
      console.error('Error starting audio:', error)
    }
  }, [])

  const handleStop = useCallback(() => {
    if (audioSource && audioSource.mediaStream) {
      audioSource.mediaStream.getTracks().forEach(track => track.stop())
    }
    if (audioContext) {
      audioContext.close()
    }
    setAudioContext(null)
    setAudioSource(null)
    setAnalyser(null)
    setIsActive(false)
  }, [audioContext, audioSource])

  const updateControl = useCallback((key, value) => {
    setControls(prev => ({ ...prev, [key]: value }))
  }, [])

  useEffect(() => {
    if (!isActive) return
    const onPointerMove = (e) => {
      const x = e.clientX / window.innerWidth
      const y = 1 - e.clientY / window.innerHeight
      pointerRef.current.mouse.x = Math.min(1, Math.max(0, x))
      pointerRef.current.mouse.y = Math.min(1, Math.max(0, y))
    }
    const onPointerDown = (e) => {
      const x = e.clientX / window.innerWidth
      const y = 1 - e.clientY / window.innerHeight
      pointerRef.current.click = {
        x: Math.min(1, Math.max(0, x)),
        y: Math.min(1, Math.max(0, y)),
        serial: pointerRef.current.click.serial + 1,
      }
    }
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerdown', onPointerDown)
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerdown', onPointerDown)
    }
  }, [isActive])

  if (!isActive) {
    return <Landing onStart={handleStart} />
  }

  return (
    <div className="relative w-full h-screen bg-bg-deep overflow-hidden">
      {/* Main Visualizer Canvas */}
      <div className="absolute inset-0">
        <Visualizer
          analyser={analyser}
          preset={preset}
          controls={controls}
          pointerRef={pointerRef}
        />
      </div>

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 h-16 z-30 px-6
        flex items-center justify-between
        bg-black/45 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center
            bg-gradient-to-br from-accent-glacier/30 to-accent-tide/20
            border border-white/10">
            <svg className="w-4 h-4 text-accent-glacier" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                d="M12 3l3 5h-2v6h-2V8H9l3-5zm-7 12l3.5 6h11L23 15M5 15l-2 6h18" />
            </svg>
          </div>
          <span className="font-light tracking-tight text-text-primary text-lg">Gliss</span>
          <span className="text-text-dim text-xs tracking-wider uppercase ml-1 hidden sm:inline">
            {inputMode === 'mic' ? 'live' : 'file'}
          </span>
        </div>

        <select
          value={preset}
          onChange={(e) => setPreset(e.target.value)}
          aria-label="Preset"
          className="px-4 py-2 rounded-xl bg-white/[0.04] border border-white/10
            text-text-primary text-sm
            focus:outline-none focus:ring-2 focus:ring-[rgba(142,184,201,0.4)] focus:border-accent-glacier/50
            hover:bg-bg-surfaceHover transition-colors"
        >
          {getPresetNames().map(name => (
            <option key={name} value={name} className="bg-bg-deep text-text-primary">
              {name}
            </option>
          ))}
        </select>
      </div>

      {/* Right Control Panel */}
      <div className="absolute top-16 right-0 bottom-16 w-[320px] z-20">
        <Controls
          controls={controls}
          onUpdate={updateControl}
          onStop={handleStop}
          inputMode={inputMode}
        />
      </div>

      {/* Bottom Transport Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-16 z-30">
        <Transport
          audioContext={audioContext}
          audioSource={audioSource}
        />
      </div>
    </div>
  )
}

export default App
