import { useState, useCallback } from 'react'
import Landing from './components/Landing'
import Visualizer from './components/Visualizer'
import Controls from './components/Controls'
import Transport from './components/Transport'

function App() {
  const [audioContext, setAudioContext] = useState(null)
  const [audioSource, setAudioSource] = useState(null)
  const [analyser, setAnalyser] = useState(null)
  const [isActive, setIsActive] = useState(false)
  const [inputMode, setInputMode] = useState('mic') // 'mic' | 'file'
  const [preset, setPreset] = useState('Neon Spectrum')
  const [controls, setControls] = useState({
    sensitivity: 0.65,
    smoothing: 0.4,
    bloom: 0.75,
    trailLength: 0.5,
    particleDensity: 0.6,
    onsetRings: true,
    pitchToColor: true,
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
        // File handling - decode and play
        const arrayBuffer = await file.arrayBuffer()
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer)
        source = ctx.createBufferSource()
        source.buffer = audioBuffer
        source.loop = true
        source.connect(analyserNode)
        source.connect(ctx.destination) // Also connect to output for playback
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

  if (!isActive) {
    return <Landing onStart={handleStart} />
  }

  return (
    <div className="relative w-full h-screen bg-[#0a0a0f] overflow-hidden">
      {/* Main Visualizer Canvas */}
      <div className="absolute inset-0">
        <Visualizer
          analyser={analyser}
          preset={preset}
          controls={controls}
        />
      </div>

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 h-16 z-30 px-6
        flex items-center justify-between
        bg-black/50 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
          <span className="font-black tracking-tight text-white text-xl">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">Neon Visualizer</span>
          </span>
        </div>

        <select
          value={preset}
          onChange={(e) => setPreset(e.target.value)}
          className="px-4 py-2 rounded-xl bg-white/5 border border-violet-500/30 text-violet-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
        >
          <option value="Neon Spectrum">Neon Spectrum</option>
          <option value="Aurora Ribbons">Aurora Ribbons</option>
          <option value="Cyber Rosette">Cyber Rosette</option>
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
          onExport={() => {}}
        />
      </div>
    </div>
  )
}

export default App

