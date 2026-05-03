import { useEffect, useRef, useState } from 'react'
import { Recorder, MAX_SECONDS, pickMimeType } from '../export/Recorder'

const Transport = ({ audioContext, audioSource }) => {
  // status: 'idle' | 'recording' | 'encoding' | 'ready'
  const [status, setStatus] = useState('idle')
  const [elapsed, setElapsed] = useState(0)
  const [toast, setToast] = useState(null)
  const [error, setError] = useState(null)
  const recorderRef = useRef(null)
  const toastTimerRef = useRef(null)

  useEffect(() => () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    if (recorderRef.current && recorderRef.current.isRecording()) {
      recorderRef.current.stop().catch(() => {})
    }
  }, [])

  const showToast = (message) => {
    setToast(message)
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToast(null), 3000)
  }

  const finalize = async (blob) => {
    setStatus('encoding')
    if (!blob || blob.size === 0) {
      setError('Recording produced no data')
      setStatus('idle')
      return
    }
    try {
      recorderRef.current?.download(`tideglass-${Date.now()}.webm`, blob)
      setStatus('ready')
      showToast('Recording saved')
    } catch (err) {
      setError(err.message || 'Download failed')
      setStatus('idle')
    }
  }

  const startRecording = () => {
    setError(null)
    if (!pickMimeType()) {
      setError('WebM recording is not supported in this browser')
      return
    }
    try {
      const recorder = new Recorder({
        audioContext,
        audioSource,
        maxSeconds: MAX_SECONDS,
        onTick: ({ elapsed }) => setElapsed(elapsed),
        onAutoStop: (blob) => finalize(blob),
      })
      recorder.start()
      recorderRef.current = recorder
      setElapsed(0)
      setStatus('recording')
    } catch (err) {
      console.error('Recording failed to start:', err)
      setError(err.message || 'Recording failed to start')
    }
  }

  const stopRecording = async () => {
    const recorder = recorderRef.current
    if (!recorder) return
    try {
      const blob = await recorder.stop()
      await finalize(blob)
    } catch (err) {
      console.error('Recording failed to stop:', err)
      setError(err.message || 'Recording failed to stop')
      setStatus('idle')
    }
  }

  const handleRecord = () => {
    if (status === 'recording') stopRecording()
    else if (status !== 'encoding') startRecording()
  }

  const handleExport = () => {
    if (!recorderRef.current?.lastBlob) return
    try {
      recorderRef.current.download(`tideglass-${Date.now()}.webm`)
      showToast('Recording saved')
    } catch (err) {
      setError(err.message || 'Download failed')
    }
  }

  const formatTime = (seconds) => {
    const total = Math.max(0, Math.floor(seconds))
    const mins = Math.floor(total / 60)
    const secs = total % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const isRecording = status === 'recording'
  const isEncoding = status === 'encoding'
  const remaining = Math.max(0, MAX_SECONDS - elapsed)
  const canExport = !!recorderRef.current?.lastBlob && !isRecording

  return (
    <div className="relative h-full px-6 flex items-center justify-center gap-6
      bg-black/50 backdrop-blur-xl border-t border-white/[0.06]">
      {/* Record / Stop */}
      <button
        onClick={handleRecord}
        disabled={isEncoding}
        aria-label={isRecording ? 'Stop recording' : 'Start recording'}
        className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300
          ${isRecording
            ? 'bg-rose-400/25 border-2 border-rose-300/70'
            : 'bg-white/5 border border-white/15 hover:bg-white/10 hover:border-white/25'}
          ${isEncoding ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className={`bg-rose-300 transition-all duration-200
          ${isRecording ? 'w-3.5 h-3.5 rounded-sm' : 'w-4 h-4 rounded-full'}`} />
      </button>

      {/* Export */}
      <button
        onClick={handleExport}
        disabled={!canExport}
        aria-label={canExport ? 'Download last recording' : 'Record a clip first'}
        className={`px-4 py-2 rounded-xl font-medium text-sm
          bg-transparent border transition-all duration-200 flex items-center gap-2
          ${canExport
            ? 'text-text-primary border-white/15 hover:bg-bg-surfaceHover hover:border-white/25'
            : 'text-text-dim border-white/[0.06] cursor-not-allowed'}`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Export WebM
      </button>

      {/* Timer + countdown */}
      <div className={`text-base font-mono tracking-wider tabular-nums
        ${isRecording ? 'text-rose-300' : 'text-text-muted'}`}>
        {formatTime(elapsed)}
        {isRecording && (
          <span className="ml-3 text-xs text-rose-300/70">
            -{formatTime(remaining)}
          </span>
        )}
      </div>

      {error && (
        <div className="text-sm text-rose-300 ml-2 max-w-[280px] truncate" title={error}>
          {error}
        </div>
      )}

      {toast && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2
          px-4 py-2 rounded-lg bg-accent-glacier/15 border border-accent-glacier/30
          text-text-primary text-sm font-medium">
          {toast}
        </div>
      )}
    </div>
  )
}

export default Transport
